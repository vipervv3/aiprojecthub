# Health Check Usage Guide

## Quick Start

### Running the Health Check Script

```bash
# Make sure you have the Supabase credentials in .env.local
node scripts/health-check-database.js
```

### Expected Output

```
🏥 Database Health Check Starting...
============================================================

📋 TABLE VERIFICATION
------------------------------------------------------------
✅ users               EXISTS
✅ projects            EXISTS
✅ tasks               EXISTS
✅ meetings            EXISTS
✅ notifications       EXISTS
✅ activities          EXISTS
✅ activity_log        EXISTS

👤 DEMO USER VERIFICATION
------------------------------------------------------------
✅ Demo user exists: 550e8400-e29b-41d4-a716-446655440000
   Email: demo@example.com

📦 PROJECTS CRUD TEST
------------------------------------------------------------
✅ CREATE project
✅ READ project
✅ UPDATE project
✅ DELETE project

✅ TASKS CRUD TEST
------------------------------------------------------------
✅ CREATE task
✅ READ task
✅ UPDATE task (status change)
✅ DELETE task

============================================================
📊 HEALTH CHECK SUMMARY
============================================================
✅ ALL CHECKS PASSED - System is healthy!

============================================================
```

## What Was Fixed

### 1. Status Constraint Issue ✅

**Before:**
```tsx
// UI offered 'cancelled' status
<option value="cancelled">Cancelled</option>
```

**After:**
```tsx
// Only valid statuses: todo, in_progress, completed
<option value="todo">To Do</option>
<option value="in_progress">In Progress</option>
<option value="completed">Completed</option>
```

### 2. Priority Options Standardized ✅

**Before:**
```tsx
// CreateTaskModal was missing 'urgent'
<option value="low">Low</option>
<option value="medium">Medium</option>
<option value="high">High</option>
```

**After:**
```tsx
// All priority options available
<option value="low">Low</option>
<option value="medium">Medium</option>
<option value="high">High</option>
<option value="urgent">Urgent</option>
```

## Valid Values Reference

### Task Status
```typescript
type TaskStatus = 'todo' | 'in_progress' | 'completed'
```

- ✅ `todo` - Not started
- ✅ `in_progress` - Currently working on
- ✅ `completed` - Finished
- ❌ `cancelled` - NOT SUPPORTED (removed)

### Task Priority
```typescript
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
```

- ✅ `low` - Low priority
- ✅ `medium` - Medium priority
- ✅ `high` - High priority
- ✅ `urgent` - Urgent (also auto-set for overdue tasks)

### Project Status
```typescript
type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived'
```

- ✅ `active` - Currently active
- ✅ `completed` - Finished
- ✅ `on_hold` - Temporarily paused
- ✅ `archived` - Archived

## Testing Your Pages

### Test Projects Page

1. **Navigate to Projects:**
   ```
   http://localhost:3000/projects
   ```

2. **Create a Project:**
   - Click "New Project" button
   - Fill in the form:
     - Name: "Test Project"
     - Description: "Testing project creation"
     - Status: "active"
     - Due Date: Select a future date
   - Click "Create Project"
   - ✅ Should appear in the grid immediately

3. **Edit a Project:**
   - Click the edit icon on any project card
   - Change the progress to 50%
   - Click "Update Project"
   - ✅ Progress bar should update

4. **Delete a Project:**
   - Click the delete icon
   - Confirm the deletion
   - ✅ Project should disappear from grid

### Test Tasks Page

1. **Navigate to Tasks:**
   ```
   http://localhost:3000/tasks
   ```

2. **Create a Task:**
   - Click "New Task" button
   - Fill in the form:
     - Task Title: "Test Task"
     - Description: "Testing task creation"
     - Project: Select a project
     - Status: "todo"
     - Priority: "medium"
     - Due Date: Select a future date
   - Click "Create Task"
   - ✅ Should appear in "To Do" column

3. **Drag and Drop:**
   - Click and hold a task card
   - Drag it to the "In Progress" column
   - Release
   - ✅ Task should move and status should update

4. **Quick Status Toggle:**
   - Click the checkbox on any task
   - ✅ Should toggle between todo and completed

5. **Edit a Task:**
   - Click the edit icon on any task
   - Change the priority to "urgent"
   - Click "Update Task"
   - ✅ Priority badge should update

6. **Delete a Task:**
   - Click the delete icon
   - Confirm the deletion
   - ✅ Task should disappear from board

## Common Issues & Solutions

### Issue: "Invalid status value"

**Cause:** Trying to use 'cancelled' status  
**Solution:** Use 'completed' instead

### Issue: "Demo user not found"

**Cause:** Database not set up correctly  
**Solution:** Run the setup script:
```bash
# In Supabase SQL Editor, run:
scripts/complete-database-setup.sql
```

### Issue: "Failed to create project/task"

**Possible Causes:**
1. Missing required fields
2. Invalid foreign key reference (project_id doesn't exist)
3. Database connection issue

**Solutions:**
1. Check console for specific error message
2. Ensure project exists before creating tasks
3. Verify Supabase credentials in `.env.local`

### Issue: "RLS policy violation"

**Cause:** Row Level Security is enabled  
**Solution:** Either:
- Disable RLS (run `complete-database-setup.sql`)
- Or implement proper authentication

## Monitoring

### Check Browser Console

Open DevTools (F12) and check for:

```javascript
// Good - Successful operations
✅ "Task created successfully"
✅ "Project updated in Supabase"
✅ "Loaded projects from Supabase: 5"

// Bad - Errors
❌ "Failed to create project in Supabase"
❌ "Invalid status value: cancelled"
❌ "Error updating task"
```

### Check Network Tab

Look for Supabase requests:

```
POST   /rest/v1/projects      → Create project
GET    /rest/v1/tasks         → Load tasks
PATCH  /rest/v1/tasks?id=...  → Update task
DELETE /rest/v1/projects?id=...  → Delete project
```

All should return `200` or `201` status codes.

## Next Steps

After verifying everything works:

1. ✅ All tests pass
2. ✅ No console errors
3. ✅ Data persists on page refresh
4. 📋 Ready to add new features
5. 📋 Ready to implement authentication (optional)

## Files Reference

| File | Purpose |
|------|---------|
| `app/tasks/page.tsx` | Tasks page route |
| `app/projects/page.tsx` | Projects page route |
| `components/tasks/simple-tasks-page.tsx` | Tasks component (MODIFIED) |
| `components/projects/simple-projects-page.tsx` | Projects component |
| `lib/data-service.ts` | Data access layer |
| `lib/supabase.ts` | Supabase client setup |
| `scripts/health-check-database.js` | Automated health check (NEW) |
| `HEALTH_CHECK_REPORT.md` | Full health check report (NEW) |

## Support

If you encounter issues:

1. Check `HEALTH_CHECK_REPORT.md` for detailed analysis
2. Run `node scripts/health-check-database.js` for automated tests
3. Review browser console for error messages
4. Verify `.env.local` has correct Supabase credentials

---

**Last Updated:** October 10, 2025  
**Status:** ✅ All systems operational




