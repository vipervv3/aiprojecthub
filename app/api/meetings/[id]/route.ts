import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idParam = params.id

    if (!idParam) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    // ✅ SECURITY: Verify user is authenticated
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      console.log('❌ Unauthorized: No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🗑️ API: Deleting recording with ID:', idParam, 'for user:', user.id)

    // ✅ Handle "recording-" prefix (used for orphaned recordings in UI)
    let actualId = idParam
    if (idParam.startsWith('recording-')) {
      actualId = idParam.replace('recording-', '')
      console.log('🔧 Stripped "recording-" prefix, actual ID:', actualId)
    }

    let meetingId: string | null = null
    let recordingSessionId: string | null = null

    // Try to find as a meeting first
    const { data: meeting } = await supabaseAdmin
      .from('meetings')
      .select('recording_session_id')
      .eq('id', actualId)
      .maybeSingle()

    if (meeting) {
      // It's a meeting ID
      meetingId = actualId
      recordingSessionId = meeting.recording_session_id
      console.log('📋 Found as meeting ID')
    } else {
      // Maybe it's a recording_session ID (orphaned recording)
      const { data: session } = await supabaseAdmin
        .from('recording_sessions')
        .select('id, user_id, metadata, file_path')
        .eq('id', actualId)
        .maybeSingle()

      if (session) {
        recordingSessionId = session.id
        // Check if there's a meeting linked via metadata
        const linkedMeetingId = session.metadata?.meetingId
        if (linkedMeetingId) {
          meetingId = linkedMeetingId
        }
        console.log('🎙️ Found as recording_session ID')
        
        // ✅ SECURITY: Verify ownership
        if (session.user_id !== user.id) {
          console.log('❌ Unauthorized: User does not own this recording')
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
      } else {
        // Not found as either
        console.log('❌ Not found as meeting or recording session')
        return NextResponse.json(
          { error: 'Recording not found' },
          { status: 404 }
        )
      }
    }

    // ✅ SECURITY: If we have a recording session, verify ownership
    if (recordingSessionId) {
      const { data: session } = await supabaseAdmin
        .from('recording_sessions')
        .select('user_id')
        .eq('id', recordingSessionId)
        .maybeSingle()

      if (session && session.user_id !== user.id) {
        console.log('❌ Unauthorized: User does not own this recording')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    console.log('✅ User authorized:', user.id)

    // Get recording session to delete storage files
    let recordingSession = null
    if (recordingSessionId) {
      const { data } = await supabaseAdmin
        .from('recording_sessions')
        .select('file_path, storage_path, user_id')
        .eq('id', recordingSessionId)
        .maybeSingle()
      recordingSession = data
    }

    // Delete storage files if they exist (try both file_path and storage_path)
    const filePath = recordingSession?.file_path || recordingSession?.storage_path
    if (filePath) {
      console.log('🗑️ Deleting storage files:', filePath)
      const { error: storageError } = await supabaseAdmin.storage
        .from('meeting-recordings')
        .remove([filePath])
      
      if (storageError) {
        console.error('⚠️ Storage deletion error:', storageError.message)
        // Don't fail the whole operation if storage deletion fails
      } else {
        console.log('✅ Storage file deleted')
      }
    }

    // Delete task links (if meeting exists)
    if (meetingId) {
      console.log('🗑️ Deleting task links...')
      const { error: taskLinkError } = await supabaseAdmin
        .from('meeting_tasks')
        .delete()
        .eq('meeting_id', meetingId)

      if (taskLinkError) {
        console.error('⚠️ Task link deletion error:', taskLinkError.message)
      }
    }

    // Delete recording session
    if (recordingSessionId) {
      console.log('🗑️ Deleting recording session...')
      const { error: recordingError } = await supabaseAdmin
        .from('recording_sessions')
        .delete()
        .eq('id', recordingSessionId)

      if (recordingError) {
        console.error('⚠️ Recording session deletion error:', recordingError.message)
      }
    }

    // Delete the meeting itself (if it exists)
    if (meetingId) {
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
    }

    console.log('✅ Recording deleted successfully')

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




