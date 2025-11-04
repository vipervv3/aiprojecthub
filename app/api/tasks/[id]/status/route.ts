import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyTaskOwnership } from '@/lib/auth-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, completed_at } = body

    console.log('📝 Update Task Status API Called:')
    console.log('  Task ID:', id)
    console.log('  Request Body:', body)
    console.log('  Status:', status)

    if (!id) {
      console.log('❌ No task ID provided')
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    if (!status || !['todo', 'in_progress', 'completed'].includes(status)) {
      console.log('❌ Invalid status:', status)
      return NextResponse.json({ 
        error: `Valid status is required (todo, in_progress, completed). Received: ${status}` 
      }, { status: 400 })
    }

    // ✅ SECURITY: Verify user is authenticated and owns this task
    const { authorized, userId } = await verifyTaskOwnership(request, id)
    
    if (!authorized) {
      console.log('❌ Unauthorized: User does not own this task')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    console.log('✅ User authorized:', userId)

    // Update task status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Set completed_at if status is completed
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (status !== 'completed') {
      // Clear completed_at if moving away from completed
      updateData.completed_at = null
    }

    console.log('  Update Data:', updateData)

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase update error:', error)
      return NextResponse.json(
        { error: 'Failed to update task status', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Task updated successfully:', data)

    // 📝 Log activity to activity_log table
    try {
      const statusText = status === 'todo' ? 'To Do' : 
                        status === 'in_progress' ? 'In Progress' : 
                        'Completed'
      
      const activityLog = {
        user_id: data.assignee_id,
        entity_type: 'task',
        entity_id: id,
        action: 'updated',
        details: {
          title: data.title,
          status: statusText,
          old_status: body.oldStatus || 'unknown',
          new_status: statusText
        }
      }

      const { error: activityError } = await supabaseAdmin
        .from('activity_log')
        .insert([activityLog])

      if (activityError) {
        console.warn('⚠️ Failed to log activity:', activityError)
        // Don't fail the request if activity logging fails
      } else {
        console.log('✅ Activity logged successfully')
      }
    } catch (logError) {
      console.warn('⚠️ Error logging activity:', logError)
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ 
      success: true, 
      task: data,
      message: 'Task status updated successfully' 
    })
  } catch (error) {
    console.error('Update task status API error:', error)
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    )
  }
}

