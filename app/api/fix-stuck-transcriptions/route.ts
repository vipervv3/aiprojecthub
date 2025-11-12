import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AssemblyAIService } from '@/lib/services/assemblyai-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables')
}

const assemblyAI = new AssemblyAIService()

/**
 * Fix stuck transcriptions by checking AssemblyAI and updating database
 * This endpoint can be called manually or via cron job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body // Optional: check specific session, or check all if not provided

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get stuck recordings (pending or processing for more than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    let query = supabase
      .from('recording_sessions')
      .select('*')
      .in('transcription_status', ['pending', 'processing'])
      .lt('created_at', fiveMinutesAgo) // Created more than 5 minutes ago

    if (sessionId) {
      query = query.eq('id', sessionId)
    }

    const { data: stuckRecordings, error } = await query

    if (error) {
      console.error('Error fetching stuck recordings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recordings', details: error.message },
        { status: 500 }
      )
    }

    if (!stuckRecordings || stuckRecordings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck transcriptions found',
        fixed: 0,
        checked: 0
      })
    }

    console.log(`🔍 Found ${stuckRecordings.length} stuck recording(s) to check`)

    let fixed = 0
    let checked = 0
    const results = []

    for (const recording of stuckRecordings) {
      checked++
      const transcriptId = recording.metadata?.transcriptId || recording.metadata?.assemblyai_job_id

      if (!transcriptId) {
        console.log(`⚠️ Recording ${recording.id} has no transcript ID - transcription may not have started`)
        results.push({
          sessionId: recording.id,
          status: 'no_transcript_id',
          message: 'No transcription job ID found'
        })
        continue
      }

      try {
        console.log(`🔍 Checking transcription ${transcriptId} for session ${recording.id}`)
        const transcript = await assemblyAI.getTranscription(transcriptId)

        if (transcript.status === 'completed' && transcript.text) {
          console.log(`✅ Transcription completed! Updating database for ${recording.id}`)
          
          // Update database
          const { error: updateError } = await supabase
            .from('recording_sessions')
            .update({
              transcription_status: 'completed',
              transcription_text: transcript.text,
              transcription_confidence: transcript.confidence,
            })
            .eq('id', recording.id)

          if (updateError) {
            console.error(`❌ Failed to update database:`, updateError)
            results.push({
              sessionId: recording.id,
              status: 'update_failed',
              message: updateError.message
            })
            continue
          }

          fixed++
          results.push({
            sessionId: recording.id,
            status: 'fixed',
            message: 'Transcription completed and saved'
          })

          // Trigger AI processing if not already processed
          if (!recording.ai_processed && recording.user_id) {
            const projectId = recording.project_id || recording.metadata?.projectId || null
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            
            console.log(`🤖 Triggering AI processing for ${recording.id}`)
            fetch(`${appUrl}/api/process-recording`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: recording.id,
                userId: recording.user_id,
                projectId
              })
            }).catch(err => {
              console.error('Failed to trigger AI processing:', err)
            })
          }

        } else if (transcript.status === 'error') {
          console.log(`❌ Transcription failed for ${recording.id}: ${transcript.error}`)
          
          await supabase
            .from('recording_sessions')
            .update({
              transcription_status: 'failed',
              processing_error: transcript.error || 'Unknown error'
            })
            .eq('id', recording.id)

          results.push({
            sessionId: recording.id,
            status: 'failed',
            message: transcript.error || 'Transcription failed'
          })

        } else {
          // Still processing or queued
          console.log(`⏳ Transcription still ${transcript.status} for ${recording.id}`)
          results.push({
            sessionId: recording.id,
            status: transcript.status,
            message: `Still ${transcript.status}`
          })
        }

      } catch (apiError) {
        console.error(`❌ Error checking transcription for ${recording.id}:`, apiError)
        results.push({
          sessionId: recording.id,
          status: 'error',
          message: apiError instanceof Error ? apiError.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${checked} recording(s), fixed ${fixed}`,
      checked,
      fixed,
      results
    })

  } catch (error) {
    console.error('Error in fix-stuck-transcriptions:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check status of fix operation
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to fix stuck transcriptions',
    usage: {
      method: 'POST',
      body: {
        sessionId: 'optional - specific session ID, or omit to check all stuck recordings'
      }
    }
  })
}






