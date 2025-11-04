# Fix Row Level Security (RLS) Issue

## The Problem
Your projects are not saving because Supabase has Row Level Security (RLS) enabled on the tables, which prevents data insertion without proper authentication and policies.

## Solution: Disable RLS (Quick Fix)

### Step 1: Go to Supabase Dashboard
1. Open your browser and go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `xekyfsnxrnfkdvrcsiye`

### Step 2: Access SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New Query"**

### Step 3: Run This SQL Code
Copy and paste this SQL code into the editor:

```sql
-- Disable Row Level Security for all tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
```

### Step 4: Execute the Query
1. Click the **"Run"** button (or press Ctrl+Enter)
2. You should see "Success. No rows returned" for each table

### Step 5: Verify the Fix
After running the SQL, test your application:
1. Go to `http://localhost:3000/projects`
2. Click "Create Project"
3. Fill in the project details
4. Click "Create"
5. The project should now save successfully!

## Alternative: Enable RLS with Proper Policies (Advanced)

If you want to keep RLS enabled for security, you can create proper policies instead:

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Allow all operations on projects" ON projects
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for tasks  
CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for activities
CREATE POLICY "Allow all operations on activities" ON activities
    FOR ALL USING (true) WITH CHECK (true);
```

## Why This Happens
- Supabase enables RLS by default for security
- RLS requires authentication and proper policies to allow data operations
- For development/demo purposes, disabling RLS is the quickest solution
- For production, you should implement proper RLS policies

## After Fixing RLS
Once you've disabled RLS:
1. ✅ Projects will save to the database
2. ✅ Tasks will save to the database  
3. ✅ All CRUD operations will work
4. ✅ Data will persist between sessions
5. ✅ Dashboard will show real data

## Test Your Fix
Run this command to test if the fix worked:

```bash
node scripts/test-project-creation.js
```

You should see "✅ Project created successfully!" instead of the RLS error.




















