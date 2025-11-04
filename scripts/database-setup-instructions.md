# Database Setup Instructions

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Navigate to your project: `xekyfsnxrnfkdvrcsiye`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the Schema**
   - Copy the contents from `lib/database/schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

## Method 2: Using Node.js Script

```bash
# Install dependencies
npm install dotenv

# Run the setup script
node scripts/setup-database.js
```

## Method 3: Manual Table Creation

If the above methods don't work, you can create tables manually using the Supabase dashboard:

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  timezone VARCHAR DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{
    "email_daily_summary": true,
    "smart_alerts": true,
    "morning_notifications": true,
    "push_notifications": true,
    "morning_notification_time": "08:00"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'archived')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget_allocated DECIMAL(12,2) DEFAULT 0,
  budget_spent DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  due_date DATE,
  team_members JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ai_priority_score DECIMAL(3,2) DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Enable Row Level Security
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view owned projects" ON projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view project tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );
```

## Verification

After setting up the tables, verify they were created:

1. Go to "Table Editor" in Supabase dashboard
2. You should see: `users`, `projects`, `tasks` tables
3. Test the connection by visiting your app at `http://localhost:3000`

## Troubleshooting

If you encounter issues:

1. **Permission errors**: Make sure you're using the service role key
2. **RLS errors**: Check that Row Level Security policies are set up correctly
3. **Connection errors**: Verify your environment variables are correct

## Next Steps

Once the database is set up:

1. Test the application at `http://localhost:3000`
2. Try creating a user account
3. Test the dashboard functionality
4. Verify data is being stored in Supabase





















