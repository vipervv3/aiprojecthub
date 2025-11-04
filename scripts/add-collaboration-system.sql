-- Add collaboration system to enable project sharing with role-based permissions
-- This script creates the project_members table and updates RLS policies

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('pending', 'active', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);

-- Enable RLS on project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Project members policies
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    -- Can view if you're the project owner or a member
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Project owners can add members" ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners and editors can update members" ON project_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR (
      user_id = auth.uid() AND status = 'pending'
    )
  );

CREATE POLICY "Project owners can remove members" ON project_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Update projects RLS policies to allow team member access
DROP POLICY IF EXISTS "Users can view owned projects" ON projects;
CREATE POLICY "Users can view owned or shared projects" ON projects
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
      AND project_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can update owned projects" ON projects;
CREATE POLICY "Users can update owned or editable projects" ON projects
  FOR UPDATE USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('owner', 'editor')
      AND project_members.status = 'active'
    )
  );

-- Update tasks RLS policies to allow team member access
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
CREATE POLICY "Users can view tasks from accessible projects" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = auth.uid()
          AND project_members.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can create project tasks" ON tasks;
CREATE POLICY "Users can create tasks in editable projects" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = auth.uid()
          AND project_members.role IN ('owner', 'editor')
          AND project_members.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update project tasks" ON tasks;
CREATE POLICY "Users can update tasks in editable projects" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = auth.uid()
          AND project_members.role IN ('owner', 'editor')
          AND project_members.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete project tasks" ON tasks;
CREATE POLICY "Users can delete tasks in editable projects" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = auth.uid()
          AND project_members.role IN ('owner', 'editor')
          AND project_members.status = 'active'
        )
      )
    )
  );

-- Function to automatically add project owner as a member
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role, status, accepted_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add owner as member when project is created
DROP TRIGGER IF EXISTS trigger_add_owner_as_member ON projects;
CREATE TRIGGER trigger_add_owner_as_member
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- Migrate existing projects (add owners as members)
INSERT INTO project_members (project_id, user_id, role, status, accepted_at)
SELECT id, owner_id, 'owner', 'active', NOW()
FROM projects
WHERE owner_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

