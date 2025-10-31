import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

