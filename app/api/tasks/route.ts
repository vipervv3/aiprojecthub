import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createAuthenticatedSupabaseClient } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user from token, not from query params
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use authenticated Supabase client (respects RLS)
    const supabase = createAuthenticatedSupabaseClient(request)

    // Fetch tasks for the authenticated user
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', user.id)

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    const projectIds = projects?.map(p => p.id) || []

    if (projectIds.length === 0) {
      return NextResponse.json([])
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json(tasks || [])
  } catch (error) {
    console.error('Error in tasks API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

