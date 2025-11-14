import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AssemblyAIService } from '@/lib/services/assemblyai-service'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

const assemblyAI = new AssemblyAIService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get recording session
    const { data: session, error: sessionError } = await supabase
      .from('recording_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Recording session not found' },
        { status: 404 }
      )
    }

    // If transcription is already completed, return it
    if (session.transcription_status === 'completed' && session.transcription_text) {
      return NextResponse.json({
        status: 'completed',
        transcription_text: session.transcription_text,
        transcription_confidence: session.transcription_confidence,
        message: 'Transcription already completed'
      })
    }

    // Check if we have a transcript ID in metadata
    const transcriptId = session.metadata?.transcriptId || session.metadata?.assemblyai_job_id

    if (!transcriptId) {
      // Return a valid response indicating transcription hasn't started yet
      // This is a valid state, not an error - the client can continue polling
      return NextResponse.json({
        status: 'pending',
        message: 'Transcription has not started yet. Please wait...'
      })
    }

    // Check transcription status with AssemblyAI
    try {
      const result = await assemblyAI.getTranscription(transcriptId)
      
      // Update database if completed
      if (result.status === 'completed' && result.text) {
        await supabase
          .from('recording_sessions')
          .update({
            transcription_status: 'completed',
            transcription_text: result.text,
            transcription_confidence: result.confidence,
          })
          .eq('id', sessionId)

        // Trigger AI processing if not already processed
        if (!session.ai_processed && session.user_id) {
          // ✅ Get projectId from multiple sources: direct column → metadata → null (same as transcribe route)
          const projectId = (session as any).project_id || session.metadata?.projectId || null
          console.log(`📁 Project ID sources: project_id column=${(session as any).project_id || 'none'}, metadata=${session.metadata?.projectId || 'none'}, final=${projectId || 'none'}`)
          
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          
          // Trigger in background (don't wait)
          fetch(`${appUrl}/api/process-recording`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              userId: session.user_id,
              projectId
            })
          }).catch(err => console.error('Error triggering AI processing:', err))
        }

        return NextResponse.json({
          status: 'completed',
          transcription_text: result.text,
          transcription_confidence: result.confidence,
          message: 'Transcription completed'
        })
      }

      // Update status if it changed
      if (result.status !== session.transcription_status) {
        await supabase
          .from('recording_sessions')
          .update({
            transcription_status: result.status,
            ...(result.status === 'error' && result.error ? { processing_error: result.error } : {})
          })
          .eq('id', sessionId)
      }

      return NextResponse.json({
        status: result.status,
        message: result.status === 'processing' ? 'Transcription in progress' : 
                 result.status === 'queued' ? 'Transcription queued' :
                 result.status === 'error' ? `Transcription failed: ${result.error}` : 'Unknown status'
      })

    } catch (apiError) {
      console.error('Error checking transcription:', apiError)
      return NextResponse.json(
        { error: 'Failed to check transcription status', details: apiError instanceof Error ? apiError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in check-transcription API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

