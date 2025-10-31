import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = params.id

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ API: Deleting meeting:', meetingId)

    // Get recording session to delete storage files
    const { data: recordingSession } = await supabaseAdmin
      .from('recording_sessions')
      .select('storage_path, user_id')
      .eq('metadata->>meetingId', meetingId)
      .maybeSingle()

    // Delete storage files if they exist
    if (recordingSession?.storage_path) {
      console.log('🗑️ Deleting storage files:', recordingSession.storage_path)
      const { error: storageError } = await supabaseAdmin.storage
        .from('meeting-recordings')
        .remove([recordingSession.storage_path])
      
      if (storageError) {
        console.error('⚠️ Storage deletion error:', storageError.message)
        // Don't fail the whole operation if storage deletion fails
      }
    }

    // Delete task links
    console.log('🗑️ Deleting task links...')
    const { error: taskLinkError } = await supabaseAdmin
      .from('meeting_tasks')
      .delete()
      .eq('meeting_id', meetingId)

    if (taskLinkError) {
      console.error('⚠️ Task link deletion error:', taskLinkError.message)
    }

    // Delete recording session
    console.log('🗑️ Deleting recording session...')
    const { error: recordingError } = await supabaseAdmin
      .from('recording_sessions')
      .delete()
      .eq('metadata->>meetingId', meetingId)

    if (recordingError) {
      console.error('⚠️ Recording session deletion error:', recordingError.message)
    }

    // Delete the meeting itself
    console.log('🗑️ Deleting meeting record...')
    const { error: meetingError } = await supabaseAdmin
      .from('meetings')
      .delete()
      .eq('id', meetingId)

    if (meetingError) {
      console.error('❌ Meeting deletion error:', meetingError)
      return NextResponse.json(
        { error: 'Failed to delete meeting', details: meetingError.message },
        { status: 500 }
      )
    }

    console.log('✅ Meeting deleted successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Meeting deleted successfully' 
    })

  } catch (error: any) {
    console.error('❌ Delete meeting error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}




