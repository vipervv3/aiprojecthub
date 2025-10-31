import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAIService } from '@/lib/services/assemblyai-service'
import { supabase } from '@/lib/supabase'

const assemblyAI = new AssemblyAIService()

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

    console.log(`Starting transcription for session: ${sessionId}`)

    // Start transcription
    const transcriptId = await assemblyAI.createTranscription(recordingUrl, {
      auto_highlights: true,
    })

    // Update recording session with transcript ID
    if (supabase) {
      await supabase
        .from('recording_sessions')
        .update({
          transcription_status: 'processing',
          metadata: { transcriptId },
        })
        .eq('id', sessionId)
    }

    return NextResponse.json({
      success: true,
      transcriptId,
      message: 'Transcription started',
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
    if (result.status === 'completed' && supabase) {
      await supabase
        .from('recording_sessions')
        .update({
          transcription_status: 'completed',
          transcription_text: result.text,
          transcription_confidence: result.confidence,
        })
        .eq('id', sessionId)

      console.log(`Transcription completed for session: ${sessionId}`)
    } else if (result.status === 'error' && supabase) {
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




