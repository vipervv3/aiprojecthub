# 🧪 AI ProjectHub - Testing Guide

## ✅ Quick Start Testing

### Step 1: Database Setup (Required)

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `COMPLETE_DATABASE_SETUP.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success. No rows returned" message

**Option B: Using Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Environment Variables

1. Copy the example environment file:
```bash
cp env.example .env.local
```

2. Edit `.env.local` with your Supabase credentials:
```env
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: AI Services (can test without these)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
ASSEMBLYAI_API_KEY=...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Start the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The app will start at: **http://localhost:3000**

---

## 🎯 Testing Features

### 1. Dashboard Testing

**URL:** http://localhost:3000/dashboard

**What to Test:**
- ✅ Welcome message displays
- ✅ Metric cards show correct numbers
- ✅ Recent activity feed loads
- ✅ Active projects appear with progress bars
- ✅ Today's schedule section

**Expected Results:**
- Should see 3 sample projects
- Should see 5 sample tasks
- Activity feed shows recent actions
- All metrics are calculated correctly

---

### 2. Projects Page Testing

**URL:** http://localhost:3000/projects

**What to Test:**
- ✅ View existing projects (should see 3 sample projects)
- ✅ Create new project (click "New Project" button)
- ✅ Edit project (click edit icon on project card)
- ✅ Delete project (click delete icon, confirm)
- ✅ Project progress bars display correctly

**Test Creating a Project:**
1. Click "New Project"
2. Fill in:
   - Name: "Test Project"
   - Description: "Testing project creation"
   - Status: Active
   - Progress: 50
3. Click "Create Project"
4. Should see success message
5. New project appears in grid

---

### 3. Tasks Page (Kanban Board) Testing

**URL:** http://localhost:3000/tasks

**What to Test:**
- ✅ Three columns: To Do, In Progress, Completed
- ✅ Drag and drop tasks between columns
- ✅ Create new task
- ✅ Edit task
- ✅ Delete task
- ✅ Filter tasks by status/priority/project
- ✅ Task cards show all details (title, description, due date, priority)

**Test Drag & Drop:**
1. Find a task in "To Do" column
2. Click and hold on the task card
3. Drag to "In Progress" column
4. Release
5. Task should move and status should update in database

**Test Creating a Task:**
1. Click "New Task" button
2. Fill in:
   - Title: "Test Task"
   - Description: "Testing task creation"
   - Project: Select one
   - Priority: High
   - Status: To Do
3. Click "Create Task"
4. Task appears in correct column

---

### 4. Meetings & Recording Testing

**URL:** http://localhost:3000/meetings

**What to Test:**
- ✅ View meetings list
- ✅ Click floating microphone button (bottom-right)
- ✅ Start recording
- ✅ Stop recording
- ✅ Upload recording

**Test Recording (Basic):**
1. Click red microphone button (bottom-right corner)
2. Select a project from dropdown
3. Click "Start Recording"
4. Allow microphone access
5. Speak for a few seconds
6. Click "Stop Recording"
7. Click "Upload & Process"
8. Recording should appear in meetings list

**Note:** Full AI transcription requires API keys configured

---

### 5. AI Insights Testing

**URL:** http://localhost:3000/ai-insights

**What to Test:**
- ✅ View AI-generated insights
- ✅ Project health analysis
- ✅ Recommendations display
- ✅ Analytics charts

**Expected Results:**
- Shows mock AI insights
- Displays project analytics
- Task analytics visible
- Charts render correctly

---

### 6. Analytics Testing

**URL:** http://localhost:3000/analytics

**What to Test:**
- ✅ Metrics overview cards
- ✅ Productivity chart
- ✅ Project analytics
- ✅ Task analytics
- ✅ Time range selector

---

## 🔍 Verification Checklist

### Database Verification

Run this in Supabase SQL Editor to verify setup:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check demo user exists
SELECT id, email, name FROM users WHERE email = 'demo@example.com';

-- Check sample projects exist
SELECT id, name, status, progress FROM projects;

-- Check sample tasks exist
SELECT id, title, status, priority FROM tasks;
```

**Expected Results:**
- Should see 12+ tables
- Demo user with email 'demo@example.com'
- 3 sample projects
- 5 sample tasks

---

## 🐛 Troubleshooting

### Issue: "No projects found"

**Solution:**
1. Check Supabase connection in browser console
2. Verify environment variables in `.env.local`
3. Re-run database setup SQL
4. Check browser console for errors

### Issue: "Failed to fetch data"

**Solution:**
1. Verify Supabase URL and keys are correct
2. Check if RLS is disabled (should be for demo)
3. Check network tab in browser DevTools
4. Verify demo user exists in database

### Issue: Drag & Drop not working

**Solution:**
1. Clear browser cache
2. Refresh page
3. Check console for JavaScript errors
4. Try different browser

### Issue: Recording not working

**Solution:**
1. Grant microphone permissions
2. Use HTTPS or localhost (required for mic access)
3. Check browser compatibility (Chrome/Edge recommended)
4. Verify storage bucket exists in Supabase

---

## 📊 Test Data

### Demo User Credentials
- **Email:** demo@example.com
- **User ID:** 550e8400-e29b-41d4-a716-446655440000

### Sample Projects
1. **AI ProjectHub Development** - 75% complete
2. **Dashboard Enhancement** - 45% complete
3. **Mobile App Integration** - 20% complete

### Sample Tasks
1. Design user interface - In Progress, High Priority
2. Implement authentication - Completed, High Priority
3. Database optimization - To Do, Medium Priority
4. API documentation - To Do, Low Priority
5. Setup CI/CD pipeline - In Progress, Urgent Priority

---

## ✅ Success Criteria

Your setup is successful if:

- ✅ Dashboard loads without errors
- ✅ Can see 3 sample projects
- ✅ Can create new project
- ✅ Can see 5 sample tasks in Kanban board
- ✅ Can drag tasks between columns
- ✅ Can create new task
- ✅ All pages load without console errors
- ✅ Data persists after page refresh

---

## 🚀 Next Steps After Testing

1. **Configure AI Services** (Optional)
   - Add OpenAI API key for GPT-4 and Whisper
   - Add Groq API key for fast inference
   - Add AssemblyAI key for transcription

2. **Customize**
   - Update demo user information
   - Add your own projects and tasks
   - Customize notification preferences

3. **Deploy**
   - Follow deployment guide in README.md
   - Set up production Supabase project
   - Configure environment variables in Vercel

---

## 📞 Need Help?

Check these files:
- `README.md` - General setup instructions
- `PROJECT_STATUS.md` - Feature status
- `HEALTH_CHECK_COMPLETE.txt` - System health info
- `COMPLETE_RECORDING_FLOW.md` - Recording system details

**Common Issues:**
- Database connection: Check Supabase credentials
- Missing data: Re-run database setup SQL
- Build errors: Run `npm run dev` (development mode works)
- Recording issues: Check microphone permissions

---

## 🎉 Ready to Test!

Start with the Dashboard and work your way through each feature. The app is fully functional in development mode!











