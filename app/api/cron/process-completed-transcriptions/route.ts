import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * Cron job to process completed transcriptions that haven't been AI-processed yet
 * Should run every minute or so
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron
    // Vercel automatically sets Authorization header for cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET
    
    // Allow if no secret is set (for local dev) or if secret matches
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check for Vercel's automatic cron secret
      const vercelCronSecret = request.headers.get('x-vercel-cron-secret')
      if (!vercelCronSecret && !authHeader?.includes('Bearer')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find all recordings with completed transcriptions that haven't been AI-processed
    const { data: unprocessedRecordings, error } = await supabase
      .from('recording_sessions')
      .select('id, user_id, metadata, transcription_text')
      .eq('transcription_status', 'completed')
      .eq('ai_processed', false)
      .not('transcription_text', 'is', null)
      .limit(10) // Process up to 10 at a time

    if (error) {
      console.error('Error fetching unprocessed recordings:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!unprocessedRecordings || unprocessedRecordings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed recordings found',
        processed: 0
      })
    }

    console.log(`🔄 Found ${unprocessedRecordings.length} unprocessed recordings`)

    const results = []
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Process each recording
    for (const recording of unprocessedRecordings) {
      try {
        console.log(`🤖 Processing recording: ${recording.id}`)
        
        const projectId = recording.metadata?.projectId || null
        
        const response = await fetch(`${appUrl}/api/process-recording`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: recording.id,
            userId: recording.user_id,
            projectId
          })
        })

        const data = await response.json()

        if (response.ok) {
          console.log(`✅ Successfully processed: ${recording.id}`)
          results.push({
            id: recording.id,
            status: 'success',
            meeting: data.meeting?.id
          })
        } else {
          console.error(`❌ Failed to process ${recording.id}:`, data)
          results.push({
            id: recording.id,
            status: 'error',
            error: data.error
          })
        }
      } catch (error) {
        console.error(`❌ Exception processing ${recording.id}:`, error)
        results.push({
          id: recording.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const failureCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      message: `Processed ${unprocessedRecordings.length} recordings`,
      successCount,
      failureCount,
      results
    })
  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

