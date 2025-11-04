import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeTasksAndProjects } from '@/lib/groq-ai-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🤖 Generating AI insights for user:', userId)

    // Fetch user's projects first
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('owner_id', userId)

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Get project IDs to fetch tasks
    const projectIds = projects?.map(p => p.id) || []
    
    // Fetch user's tasks via their projects
    let tasks: any[] = []
    let tasksError = null
    
    if (projectIds.length > 0) {
      const result = await supabaseAdmin
        .from('tasks')
        .select('*')
        .in('project_id', projectIds)
      
      tasks = result.data || []
      tasksError = result.error
    }

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    console.log(`📊 Analyzing ${tasks?.length || 0} tasks and ${projects?.length || 0} projects`)

    // Generate AI insights
    const insights = await analyzeTasksAndProjects(tasks || [], projects || [])

    console.log(`✅ Generated ${insights.length} AI insights`)

    // Store insights in database
    if (insights.length > 0) {
      const insightsToStore = insights.map(insight => ({
        user_id: userId,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        impact: insight.impact,
        confidence: insight.confidence,
        actionable: insight.actionable,
        category: insight.category,
        metadata: {}
      }))

      const { error: insertError } = await supabaseAdmin
        .from('ai_insights')
        .insert(insightsToStore)

      if (insertError) {
        console.error('Error storing insights:', insertError)
        // Continue anyway - we can still return the insights
      }
    }

    return NextResponse.json({
      success: true,
      insights,
      tasksAnalyzed: tasks?.length || 0,
      projectsAnalyzed: projects?.length || 0
    })

  } catch (error) {
    console.error('Error generating AI insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights', details: (error as Error).message },
      { status: 500 }
    )
  }
}

