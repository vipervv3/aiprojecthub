import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get all members of a project
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get project members with user details using admin client (bypasses RLS)
    const { data: members, error } = await supabaseAdmin
      .from('project_members')
      .select(`
        *,
        user:users!project_members_user_id_fkey(id, email, name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch project members', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ members: members || [] })
  } catch (error: any) {
    console.error('Error in GET /api/project-members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Add a new member to a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, userEmail, role = 'viewer', currentUserId } = body

    if (!projectId || !userEmail) {
      return NextResponse.json(
        { error: 'Project ID and user email are required' },
        { status: 400 }
      )
    }

    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be owner, editor, or viewer' },
        { status: 400 }
      )
    }

    // Find user by email using admin client
    const { data: invitedUser, error: invitedUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', userEmail)
      .single()

    if (invitedUserError || !invitedUser) {
      console.error('User lookup error:', invitedUserError)
      return NextResponse.json(
        { error: 'User not found. They must have an account first.' },
        { status: 404 }
      )
    }

    // Add member using admin client (bypasses RLS)
    const { data: member, error: memberError } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: invitedUser.id,
        role: role,
        invited_by: currentUserId,
        status: 'active',
        accepted_at: new Date().toISOString()
      })
      .select(`
        *,
        user:users!project_members_user_id_fkey(id, email, name, avatar_url)
      `)
      .single()

    if (memberError) {
      if (memberError.code === '23505') {
        return NextResponse.json(
          { error: 'User is already a member of this project' },
          { status: 409 }
        )
      }
      console.error('Error adding project member:', memberError)
      return NextResponse.json(
        { error: 'Failed to add project member', details: memberError.message },
        { status: 500 }
      )
    }

    // Create notification for the invited user
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: invitedUser.id,
        type: 'project_invite',
        title: 'Added to Project',
        message: `You have been added to a project with ${role} access`,
        action_url: `/projects/${projectId}`,
        read: false
      })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/project-members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update a member's role
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, role } = body

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'Member ID and role are required' },
        { status: 400 }
      )
    }

    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be owner, editor, or viewer' },
        { status: 400 }
      )
    }

    // Update member role using admin client
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('project_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select(`
        *,
        user:users!project_members_user_id_fkey(id, email, name, avatar_url)
      `)
      .single()

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member role', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ member: updatedMember })
  } catch (error: any) {
    console.error('Error in PATCH /api/project-members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove a member from a project
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Delete member using admin client
    const { error: deleteError } = await supabaseAdmin
      .from('project_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove member', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/project-members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

