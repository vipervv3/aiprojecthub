-- ================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ================================================
-- Run this in your Supabase SQL Editor!
-- Go to: https://supabase.com/dashboard → SQL Editor → New Query

-- Step 1: DROP ALL CONFLICTING POLICIES
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
DROP POLICY IF EXISTS "Project owners and editors can update members" ON project_members;
DROP POLICY IF EXISTS "Project owners can remove members" ON project_members;
DROP POLICY IF EXISTS "Users can view owned or shared projects" ON projects;
DROP POLICY IF EXISTS "Users can update owned or editable projects" ON projects;
DROP POLICY IF EXISTS "Users can view owned projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update owned projects" ON projects;
DROP POLICY IF EXISTS "Users can delete owned projects" ON projects;
DROP POLICY IF EXISTS "Users can view tasks from accessible projects" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in editable projects" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in editable projects" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in editable projects" ON tasks;
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete project tasks" ON tasks;

-- Step 2: CREATE SIMPLE, NON-RECURSIVE POLICIES

-- ================================================
-- PROJECTS: Simple owner check (NO project_members reference)
-- ================================================
CREATE POLICY "Users can view owned projects" ON projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update owned projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete owned projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- ================================================
-- PROJECT_MEMBERS: Only check owner_id directly
-- ================================================
CREATE POLICY "Users can view project members if owner" ON project_members
  FOR SELECT USING (
    -- Can view if you're a member of this record
    user_id = auth.uid()
    OR
    -- Can view if you own the project (check directly, no subquery)
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can add members" ON project_members
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own member status" ON project_members
  FOR UPDATE USING (
    user_id = auth.uid() 
    OR project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can remove members" ON project_members
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- ================================================
-- TASKS: Check assignee_id directly (NO project check)
-- ================================================
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (
    -- Can view if you're assigned to the task
    auth.uid() = assignee_id
    OR
    -- Can view if you own the project
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    -- Can create if you own the project
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks" ON tasks
  FOR UPDATE USING (
    -- Can update if you're assigned or own the project
    auth.uid() = assignee_id
    OR project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks" ON tasks
  FOR DELETE USING (
    -- Can delete if you own the project
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- ================================================
-- DONE! No more infinite recursion!
-- ================================================

