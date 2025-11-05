# 🔧 Troubleshooting: Task Extraction & Title Generation

## Issues Identified

1. **Task extraction using fallback** (confidence 0.3)
2. **Generic titles** instead of intelligent ones
3. **Tasks not showing** on meeting detail page

## Root Causes

### 1. Groq API May Not Be Working
The fallback confidence (0.3) indicates Groq API calls are failing. Check:

- Vercel logs for Groq API errors
- `GROQ_API_KEY` environment variable on Vercel
- Network/firewall issues blocking Groq API

### 2. Project ID Not Being Passed
Tasks need `project_id` to be linked correctly. Verify:

- Recording widget saves `projectId` to `recording_sessions.metadata.projectId`
- `process-recording` API receives `projectId` in request body
- Tasks are created with `project_id: finalProjectId`

### 3. Task Loading Query Issue
Meeting detail page was querying `tasks.meeting_id` which doesn't exist. Fixed to use `meeting_tasks` junction table.

## Fixes Applied

1. ✅ Fixed task loading to use `meeting_tasks` junction table
2. ✅ Added fallback to load tasks by `project_id` if junction table fails
3. ✅ Improved projectId extraction from meeting metadata
4. ✅ Enhanced logging for Groq API calls

## Next Steps

1. **Check Vercel Logs** for:
   - `🚀 Calling Groq AI` messages
   - `❌ Groq API error` messages
   - `📁 Project context` logs

2. **Verify Environment Variables** on Vercel:
   - `GROQ_API_KEY` is set and valid
   - `NEXT_PUBLIC_APP_URL` is set to your Vercel URL

3. **Test with New Recording**:
   - Select a project before recording
   - Record a meeting with clear action items
   - Check Vercel logs for processing
   - Verify tasks appear in the selected project

## Debug Commands

Check Vercel logs:
```bash
vercel logs --follow
```

Or check via Vercel dashboard:
1. Go to your project
2. Click "Deployments"
3. Click latest deployment
4. Click "Functions" tab
5. Check `/api/process-recording` logs

