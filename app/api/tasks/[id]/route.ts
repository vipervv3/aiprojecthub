import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH - Update entire task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    console.log('📝 Update Task API Called:')
    console.log('  Task ID:', id)
    console.log('  Request Body:', body)

    if (!id) {
      console.log('❌ No task ID provided')
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.project_id !== undefined) updateData.project_id = body.project_id
    if (body.assignee_id !== undefined) updateData.assignee_id = body.assignee_id

    // Set completed_at if status is completed
    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (body.status && body.status !== 'completed') {
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
        { error: 'Failed to update task', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Task updated successfully:', data)

    return NextResponse.json({ 
      success: true, 
      task: data,
      message: 'Task updated successfully' 
    })
  } catch (error) {
    console.error('Update task API error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    console.log('🗑️ Delete Task API Called:')
    console.log('  Task ID:', id)

    if (!id) {
      console.log('❌ No task ID provided')
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Supabase delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete task', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Task deleted successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Task deleted successfully' 
    })
  } catch (error) {
    console.error('Delete task API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}











