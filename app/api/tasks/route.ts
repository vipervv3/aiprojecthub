import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createAuthenticatedSupabaseClient } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, priority, due_date, project_id, assignee_id } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Use authenticated Supabase client
    const supabase = createAuthenticatedSupabaseClient(request)

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this project' }, { status: 403 })
    }

    // Create task
    const taskData: any = {
      title: title.trim(),
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      project_id,
      assignee_id: assignee_id || user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (due_date) {
      taskData.due_date = due_date
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      return NextResponse.json(
        { error: 'Failed to create task', details: taskError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task,
      message: 'Task created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in create task API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

