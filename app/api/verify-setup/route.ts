import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const results: any = {
      connection: false,
      database: {},
      storage: {},
      recordings: {},
      meetings: {},
      orphaned: {},
      environment: {},
      errors: []
    }

    // Test connection
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1)
      if (error) throw error
      results.connection = true
    } catch (err: any) {
      results.errors.push(`Connection failed: ${err.message}`)
      return NextResponse.json(results, { status: 500 })
    }

    // Verify Database Tables
    const requiredTables = [
      'users', 'projects', 'tasks', 'recording_sessions', 
      'meetings', 'meeting_tasks', 'ai_insights', 'notifications'
    ]
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          results.database[table] = { status: 'error', message: error.message }
        } else {
          results.database[table] = { status: 'ok' }
        }
      } catch (err: any) {
        results.database[table] = { status: 'error', message: err.message }
      }
    }

    // Verify Storage Bucket
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        results.storage.buckets = { status: 'error', message: bucketsError.message }
      } else {
        const meetingBucket = buckets?.find(b => b.name === 'meeting-recordings')
        
        if (!meetingBucket) {
          results.storage.bucket = { 
            status: 'error', 
            message: 'Bucket "meeting-recordings" NOT FOUND',
            fix: 'Create bucket in Supabase Dashboard → Storage → New bucket (name: meeting-recordings, make it PUBLIC)'
          }
        } else {
          results.storage.bucket = {
            status: meetingBucket.public ? 'ok' : 'critical',
            name: meetingBucket.name,
            public: meetingBucket.public,
            id: meetingBucket.id,
            created_at: meetingBucket.created_at,
            message: meetingBucket.public 
              ? 'Bucket is public ✅' 
              : '🚨 CRITICAL: Bucket is NOT public! AssemblyAI cannot access files. Make it public in Supabase Dashboard.'
          }
          
          // List files
          const { data: files, error: filesError } = await supabase.storage
            .from('meeting-recordings')
            .list()
          
          if (filesError) {
            results.storage.files = { status: 'error', message: filesError.message }
          } else {
            results.storage.files = { 
              status: 'ok', 
              count: files?.length || 0,
              sample: files?.slice(0, 3).map(f => ({
                name: f.name,
                size: f.metadata?.size,
                created_at: f.created_at
              }))
            }
          }
        }
      }
    } catch (err: any) {
      results.storage.error = err.message
    }

    // Verify Recording Sessions
    try {
      const { data: sessions, error } = await supabase
        .from('recording_sessions')
        .select('id, title, transcription_status, ai_processed, file_path, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) {
        results.recordings.error = error.message
      } else {
        results.recordings = {
          count: sessions?.length || 0,
          sessions: sessions?.map(s => ({
            id: s.id,
            title: s.title,
            transcription_status: s.transcription_status,
            ai_processed: s.ai_processed,
            file_path: s.file_path,
            created_at: s.created_at
          })) || []
        }
        
        // Check for stuck transcriptions
        const stuck = sessions?.filter(s => {
          const isStuck = (s.transcription_status === 'pending' || s.transcription_status === 'processing')
          const isOld = new Date(s.created_at) < new Date(Date.now() - 5 * 60 * 1000)
          return isStuck && isOld
        }) || []
        
        if (stuck.length > 0) {
          results.recordings.stuck = stuck.length
        }
      }
    } catch (err: any) {
      results.recordings.error = err.message
    }

    // Verify Meetings
    try {
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('id, title, recording_session_id, summary, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) {
        results.meetings.error = error.message
      } else {
        results.meetings = {
          count: meetings?.length || 0,
          meetings: meetings?.map(m => ({
            id: m.id,
            title: m.title,
            recording_session_id: m.recording_session_id,
            has_summary: !!m.summary,
            created_at: m.created_at
          })) || []
        }
      }
    } catch (err: any) {
      results.meetings.error = err.message
    }

    // Check Orphaned Recordings
    try {
      const { data: orphaned, error } = await supabase
        .from('recording_sessions')
        .select('id, title, transcription_status, ai_processed, created_at')
        .eq('transcription_status', 'completed')
        .not('transcription_text', 'is', null)
        .eq('ai_processed', false)
      
      if (error) {
        results.orphaned.error = error.message
      } else {
        results.orphaned = {
          count: orphaned?.length || 0,
          recordings: orphaned?.map(r => ({
            id: r.id,
            title: r.title,
            created_at: r.created_at
          })) || []
        }
      }
    } catch (err: any) {
      results.orphaned.error = err.message
    }

    // Verify Environment Variables
    results.environment = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ASSEMBLYAI_API_KEY: !!process.env.ASSEMBLYAI_API_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
    }

    // Test Recording URL Access
    try {
      const { data: session } = await supabase
        .from('recording_sessions')
        .select('file_path')
        .not('file_path', 'is', null)
        .limit(1)
        .single()
      
      if (session?.file_path) {
        const { data: urlData } = supabase.storage
          .from('meeting-recordings')
          .getPublicUrl(session.file_path)
        
        const publicUrl = urlData.publicUrl
        
        // Test URL accessibility
        try {
          const response = await fetch(publicUrl, { method: 'HEAD' })
          results.storage.urlTest = {
            url: publicUrl,
            accessible: response.ok,
            status: response.status,
            contentType: response.headers.get('content-type'),
            message: response.ok 
              ? '✅ URL is accessible (AssemblyAI can access it)'
              : `❌ URL returned ${response.status} - AssemblyAI cannot access this!`
          }
        } catch (fetchError: any) {
          results.storage.urlTest = {
            url: publicUrl,
            accessible: false,
            error: fetchError.message,
            message: '❌ Error accessing URL - AssemblyAI will not be able to access recordings'
          }
        }
      }
    } catch (err: any) {
      // No recordings to test, that's ok
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Verification failed',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

