import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch tasks for the user - using project_id to filter by user's projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', userId)

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

