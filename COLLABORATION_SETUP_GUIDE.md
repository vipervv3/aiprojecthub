# Collaboration System Setup Guide

This guide will help you set up the project collaboration and permission system in your AI Project Hub.

## Overview

The collaboration system allows you to:
- ✅ **Add team members** to projects
- ✅ **Assign roles** (Owner, Editor, Viewer)
- ✅ **Control permissions** for viewing and editing
- ✅ **Manage access** to projects and tasks

## Permission Roles

| Role | Can View | Can Edit | Can Manage Members | Can Delete Project |
|------|----------|----------|-------------------|-------------------|
| 👑 **Owner** | ✅ | ✅ | ✅ | ✅ |
| ✏️ **Editor** | ✅ | ✅ | ❌ | ❌ |
| 👁️ **Viewer** | ✅ | ❌ | ❌ | ❌ |

## Installation Steps

### Step 1: Run the Database Migration

You have two options to run the migration:

#### Option A: Using Supabase Dashboard (Recommended)

1. Open your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the contents of `scripts/add-collaboration-system.sql`
6. Paste and click **Run**

#### Option B: Using the Migration Script

```bash
node scripts/add-collaboration-system.js
```

Note: Due to Supabase API limitations, you'll still need to run the SQL manually in the dashboard. The script will guide you through the process.

### Step 2: Verify Installation

After running the migration, verify the setup:

1. Check that the `project_members` table exists:
```sql
SELECT * FROM project_members LIMIT 1;
```

2. Verify RLS policies are active:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'project_members';
```

3. Confirm existing projects have owners as members:
```sql
SELECT p.name, pm.role, u.email 
FROM projects p
JOIN project_members pm ON p.id = pm.project_id
JOIN users u ON pm.user_id = u.id
LIMIT 10;
```

## How to Use

### Adding Team Members

1. **Navigate to a project** you own
2. Click the **"Invite Member"** button in the top right
3. Enter the **email address** of the person you want to add
4. Select their **role** (Editor or Viewer)
5. Click **"Send Invite"**

**Note:** The person must already have an account in your system.

### Managing Existing Members

1. Click the **"Invite Member"** button on any project
2. View all current members in the modal
3. **Change roles** using the dropdown next to each member
4. **Remove members** by clicking the trash icon

### Accessing Shared Projects

When someone adds you to a project:
- You'll receive a **notification**
- The project will appear in your **Projects** page
- Your access level determines what you can do

## API Endpoints

The system provides the following API endpoints:

### GET `/api/project-members?projectId={id}`
Get all members of a project

### POST `/api/project-members`
Add a new member to a project
```json
{
  "projectId": "uuid",
  "userEmail": "user@example.com",
  "role": "editor" | "viewer"
}
```

### PATCH `/api/project-members`
Update a member's role
```json
{
  "memberId": "uuid",
  "role": "owner" | "editor" | "viewer"
}
```

### DELETE `/api/project-members?memberId={id}`
Remove a member from a project

## Database Schema

### project_members Table

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR CHECK (status IN ('pending', 'active', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);
```

## Row Level Security

The system uses Supabase RLS to enforce permissions:

1. **Projects**: Users can view projects they own OR are members of
2. **Tasks**: Users can view/edit tasks in projects they have access to
3. **Members**: Only project owners can add/remove members
4. **Editors** can modify project content but not manage members
5. **Viewers** have read-only access

## Troubleshooting

### "User not found" error
- The user must have an account before you can add them
- Ask them to sign up first

### "Only project owners can add members" error
- You must be the project owner to invite members
- Check your role in the project

### Members not showing up
- Refresh the page
- Check the browser console for errors
- Verify the database migration ran successfully

### Permission denied errors
- Verify RLS policies are enabled
- Check the user's role in the project
- Ensure the user is logged in

## Security Notes

- ✅ All access is controlled via Row Level Security (RLS)
- ✅ Users can only see projects they own or are members of
- ✅ Owners cannot be removed from their projects
- ✅ All member changes are logged
- ✅ Email invitations include role information

## Future Enhancements

Potential improvements you could add:

- [ ] Email invitations for users without accounts
- [ ] Pending invitation system
- [ ] Team/group management
- [ ] Custom roles with granular permissions
- [ ] Activity logs for member changes
- [ ] Bulk member import
- [ ] Public/private project visibility

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify database migrations ran successfully
3. Check Supabase logs in the dashboard
4. Review the RLS policies in SQL Editor

## Summary

You now have a fully functional collaboration system! Team members can:
- 👥 Be added to projects
- 🔒 Have appropriate access levels
- 📝 View and edit based on their role
- 🔔 Receive notifications when added

Enjoy collaborating on your projects! 🎉







