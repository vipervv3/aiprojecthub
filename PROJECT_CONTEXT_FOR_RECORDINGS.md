# 📁 Project Context for Recordings

## ✅ Feature Complete

Tasks extracted from meeting recordings are now automatically linked to your selected project!

## 🎯 How It Works

### 1. Select Project Before Recording

On the **Meetings page**, you'll see a blue project selector box:

```
📁 Project Context for Recordings
[Dropdown: Select a project]
```

**Options:**
- "No Project (General)" - Tasks won't be linked to any project
- Your projects list - All tasks will link to selected project

### 2. Record Your Meeting

1. Select project from dropdown
2. Click "Start Recording"
3. Record your meeting/notes
4. Stop and upload

### 3. AI Extracts Tasks with Project Link

When AI processes your recording:
- ✅ Extracts tasks from transcription
- ✅ Links each task to your selected project
- ✅ Tasks appear on Tasks page filtered by that project
- ✅ Perfect for project-specific meetings

## 📊 Full Workflow

```
1. Go to Meetings page
   ↓
2. Select "Project A" from dropdown
   ↓
3. Start Recording
   ↓
4. Say: "We need to finish the user dashboard by Friday"
   ↓
5. Stop & Upload
   ↓
6. AI Processing (automatic)
   ↓
7. Task created: "Finish user dashboard"
   - Priority: High
   - Due: Friday
   - Project: Project A ✅
   - Appears in Project A's task list
```

## 🔧 Technical Details

### Data Flow:

1. **Meetings Page**
   - User selects project
   - Saved to `localStorage.recording_project_context`

2. **Recording Modal**
   - Reads projectId from localStorage
   - Includes in upload form data

3. **Recordings API**
   - Stores projectId in `recording_sessions.metadata`
   - Saved for later processing

4. **Transcription Complete**
   - Reads projectId from metadata
   - Passes to AI processing

5. **AI Processing**
   - Extracts tasks
   - Sets `project_id` field for each task
   - Tasks are now linked!

### Database Structure:

```sql
-- Recording session stores project context
recording_sessions:
  metadata: {
    projectId: "uuid-here",
    uploadedAt: "2025-11-04..."
  }

-- Tasks get project_id from recording context
tasks:
  project_id: "uuid-here",  -- ✅ Linked to project
  is_ai_generated: true,
  tags: ["meeting-generated", "meeting:meeting-id"]
```

## 🎯 Use Cases

### Use Case 1: Project Standup

```
Select: "Website Redesign Project"
Record: Daily standup discussion
Result: All action items linked to Website Redesign
```

### Use Case 2: Client Meeting

```
Select: "Client XYZ Project"
Record: Client requirements discussion
Result: All tasks linked to Client XYZ project
```

### Use Case 3: General Tasks

```
Select: "No Project (General)"
Record: Personal reminders
Result: Tasks created without project link
```

### Use Case 4: Sprint Planning

```
Select: "Q4 Marketing Campaign"
Record: Sprint planning session
Result: All sprint tasks under Q4 Marketing Campaign
```

## 💡 Best Practices

### 1. Set Project Before Recording
Always select the project **before** starting your recording. The selection is saved and persists across sessions.

### 2. Use Project Context for Team Meetings
When recording team meetings, select the relevant project so all action items go to the right place.

### 3. Clear Context for General Notes
Set to "No Project" when recording personal reminders or general tasks not tied to any specific project.

### 4. Review Project Tasks
After AI processing, go to Tasks page and filter by the project to see all extracted tasks.

## 📱 Mobile Support

Works perfectly on mobile:
1. Open app on mobile browser
2. Go to Meetings page
3. Select project from dropdown
4. Record using mobile microphone
5. Tasks are linked automatically

## 🔄 Processing Existing Recordings

If you have old unprocessed recordings:

1. Go to Meetings page
2. Select desired project from dropdown
3. Scroll to "Unprocessed Recordings" section
4. Click "Process with AI"
5. Tasks will be linked to currently selected project

**Note:** The project selected at processing time is used, not the project that was selected when recording.

## 📊 Tracking & Visibility

### See Project Context:
- Console logs show: `📁 Recording project context set: [project-id]`
- Upload shows: `📼 Recording upload - Project: [project-id]`
- Processing shows: `🤖 Processing with project context: [project-id]`

### Verify Task Links:
```sql
-- See tasks by project
SELECT title, priority, project_id, is_ai_generated 
FROM tasks 
WHERE project_id = 'your-project-id' 
  AND is_ai_generated = true;
```

## ✅ Benefits

1. **Organized Tasks**
   - All meeting tasks go to correct project
   - Easy to track project-specific action items

2. **No Manual Sorting**
   - AI handles the project association
   - No need to move tasks manually

3. **Team Clarity**
   - Everyone sees project-related tasks together
   - Clear context for each action item

4. **Better Reporting**
   - Filter tasks by project
   - See all AI-generated tasks per project
   - Track meeting-derived work

## 🎓 Example Scenarios

### Scenario 1: Multi-Project Manager

You manage 3 projects. For each meeting:
- Select the relevant project
- Record meeting
- Tasks automatically sort into correct project
- No manual organization needed

### Scenario 2: Freelancer with Clients

- Client A meeting → Select "Client A Project"
- Client B meeting → Select "Client B Project"
- Personal tasks → Select "No Project"
- Perfect separation of work

### Scenario 3: Sprint Planning

- Sprint planning for Feature X → Select "Feature X"
- All sprint tasks link to Feature X
- Backlog refinement → Select "Backlog"
- Clear separation of sprint vs backlog

## 🐛 Troubleshooting

### Tasks Not Linking to Project

**Check:**
1. Project was selected before recording
2. Console shows: `📁 Recording will be linked to project`
3. Database has projectId in metadata
4. Tasks table has project_id field populated

**Debug SQL:**
```sql
-- Check recording metadata
SELECT id, title, metadata 
FROM recording_sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if tasks have project_id
SELECT id, title, project_id, is_ai_generated 
FROM tasks 
WHERE is_ai_generated = true 
ORDER BY created_at DESC 
LIMIT 10;
```

### Project Selection Not Saving

**Fix:**
- localStorage might be disabled
- Check browser console for errors
- Try different browser
- Clear cache and reload

### Old Recordings Don't Have Project

**Expected:**
- Recordings made before this feature won't have projectId
- When processing manually, they use currently selected project
- Not retroactively applied

## 📚 Related Features

- **Task Filters:** Filter tasks by project on Tasks page
- **Project Dashboard:** See all tasks per project
- **AI Insights:** Get project-specific insights
- **Task Assignment:** Assign tasks within project context

---

**Status:** ✅ Fully Functional
**Last Updated:** November 4, 2025
**Available:** Web + Mobile

🎯 **Your recordings now automatically organize tasks by project!**

