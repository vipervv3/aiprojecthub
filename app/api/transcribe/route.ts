import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAIService } from '@/lib/services/assemblyai-service'
import { createClient } from '@supabase/supabase-js'

const assemblyAI = new AssemblyAIService()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordingUrl, sessionId } = body

    if (!recordingUrl || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: recordingUrl, sessionId' },
        { status: 400 }
      )
    }

    console.log(`🎙️ Starting transcription for session: ${sessionId}`)

    // Start transcription
    const transcriptId = await assemblyAI.createTranscription(recordingUrl, {
      auto_highlights: true,
    })

    console.log(`✅ Transcription job created: ${transcriptId}`)

    // Create Supabase client with service role for API routes
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get existing metadata to preserve projectId
    const { data: existingSession } = await supabase
      .from('recording_sessions')
      .select('metadata')
      .eq('id', sessionId)
      .single()
    
    await supabase
      .from('recording_sessions')
      .update({
        transcription_status: 'processing',
        metadata: {
          ...existingSession?.metadata,
          transcriptId,
          assemblyai_job_id: transcriptId
        },
      })
      .eq('id', sessionId)

    // ✅ START BACKGROUND POLLING - Don't wait for completion
    // This runs asynchronously and won't block the response
    pollTranscriptionInBackground(sessionId, transcriptId).catch(err => {
      console.error(`❌ Background polling failed for ${sessionId}:`, err)
    })

    return NextResponse.json({
      success: true,
      transcriptId,
      message: 'Transcription started and polling in background',
    })
  } catch (error) {
    console.error('Error in transcribe API:', error)
    return NextResponse.json(
      {
        error: 'Failed to start transcription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Poll AssemblyAI for transcription completion in the background
 * When complete, triggers AI processing automatically
 */
async function pollTranscriptionInBackground(sessionId: string, transcriptId: string) {
  console.log(`🔄 Starting background polling for transcription: ${transcriptId}`)
  
  const maxAttempts = 60 // 5 minutes max (5 seconds * 60)
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      // Wait 5 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++

      // Check transcription status
      const result = await assemblyAI.getTranscription(transcriptId)
      console.log(`📊 Poll ${attempts}/${maxAttempts} - Status: ${result.status}`)

      if (result.status === 'completed') {
        console.log(`✅ Transcription completed for ${sessionId}!`)
        
        // Create Supabase client for database operations
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Get session to find user_id and projectId
        const { data: session } = await supabase
          .from('recording_sessions')
          .select('user_id, metadata')
          .eq('id', sessionId)
          .single()

        // Save transcription to database
        await supabase
          .from('recording_sessions')
          .update({
            transcription_status: 'completed',
            transcription_text: result.text,
            transcription_confidence: result.confidence,
          })
          .eq('id', sessionId)

        console.log(`💾 Transcription saved to database`)

        // ✅ Trigger AI processing
        if (session?.user_id) {
          const projectId = session.metadata?.projectId || null
          
          console.log(`🤖 Triggering AI processing (project: ${projectId || 'none'})`)
          
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const response = await fetch(`${appUrl}/api/process-recording`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              userId: session.user_id,
              projectId
            })
          })

          if (response.ok) {
            console.log(`🎉 AI processing triggered successfully!`)
          } else {
            const errorData = await response.json()
            console.error(`❌ AI processing failed:`, errorData)
          }
        }

        return // Done!

      } else if (result.status === 'error') {
        console.error(`❌ Transcription failed: ${result.error}`)
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase
          .from('recording_sessions')
          .update({
            transcription_status: 'failed',
            processing_error: result.error || 'Unknown error',
          })
          .eq('id', sessionId)

        return // Stop polling

      }
      // else status is 'queued' or 'processing', continue polling

    } catch (error) {
      console.error(`❌ Polling error (attempt ${attempts}):`, error)
      // Continue polling even if one attempt fails
    }
  }

  // Timeout reached
  console.error(`⏱️ Transcription polling timeout for ${sessionId}`)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  await supabase
    .from('recording_sessions')
    .update({
      transcription_status: 'failed',
      processing_error: 'Transcription polling timeout after 5 minutes',
    })
    .eq('id', sessionId)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const transcriptId = searchParams.get('transcriptId')

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Missing transcriptId parameter' },
        { status: 400 }
      )
    }

    // Get transcription status
    const result = await assemblyAI.getTranscription(transcriptId)

    return NextResponse.json({
      success: true,
      transcription: result,
    })
  } catch (error) {
    console.error('Error getting transcription status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get transcription status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Poll endpoint for checking transcription progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcriptId, sessionId } = body

    if (!transcriptId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get transcription status
    const result = await assemblyAI.getTranscription(transcriptId)

    // Update database if completed
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (result.status === 'completed') {
      // Get session to find user_id
      const { data: session } = await supabase
        .from('recording_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single()

      await supabase
        .from('recording_sessions')
        .update({
          transcription_status: 'completed',
          transcription_text: result.text,
          transcription_confidence: result.confidence,
        })
        .eq('id', sessionId)

      console.log(`✅ Transcription completed for session: ${sessionId}`)

      // Trigger AI processing asynchronously (don't wait for it)
      if (session?.user_id) {
        // Get full session data to extract projectId from metadata
        const { data: fullSession } = await supabase
          .from('recording_sessions')
          .select('metadata')
          .eq('id', sessionId)
          .single()
        
        const projectId = fullSession?.metadata?.projectId || null
        
        console.log(`🤖 Triggering AI processing for session: ${sessionId} (project: ${projectId || 'none'})`)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process-recording`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: session.user_id,
            projectId // ✅ Pass project context
          })
        }).catch(err => {
          console.error('Failed to trigger AI processing:', err)
        })
      }
    } else if (result.status === 'error') {
      await supabase
        .from('recording_sessions')
        .update({
          transcription_status: 'failed',
          processing_error: result.error || 'Unknown error',
        })
        .eq('id', sessionId)
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      text: result.text,
      confidence: result.confidence,
    })
  } catch (error) {
    console.error('Error polling transcription:', error)
    return NextResponse.json(
      {
        error: 'Failed to poll transcription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}




