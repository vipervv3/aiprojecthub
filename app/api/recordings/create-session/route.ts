import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

/**
 * Create a recording session without file upload
 * Used when file is uploaded directly to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, duration, userId, projectId, filePath, fileSize, recordingUrl } = body

    console.log('📼 Creating recording session (direct upload path)')
    console.log('   Title:', title)
    console.log('   Duration:', duration)
    console.log('   User ID:', userId)
    console.log('   Project ID:', projectId || 'none')
    console.log('   File path:', filePath)
    console.log('   File size:', fileSize, 'bytes (', (fileSize / 1024 / 1024).toFixed(2), 'MB)')

    // ✅ Bulletproof validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create recording session in database
    // ✅ Save projectId both in direct column (if exists) and metadata (fallback)
    const sessionDataToInsert: any = {
      user_id: userId,
      title,
      file_path: filePath,
      file_size: fileSize || 0,
      duration: duration || 0,
      transcription_status: 'pending',
      metadata: {
        projectId: projectId || null, // ✅ Store project context in metadata
        uploadedAt: new Date().toISOString(),
        uploadedVia: 'direct' // Mark as direct upload
      }
    }
    
    // If project_id column exists, also set it directly
    if (projectId) {
      sessionDataToInsert.project_id = projectId
    }
    
    const { data: sessionData, error: dbError } = await supabase
      .from('recording_sessions')
      .insert(sessionDataToInsert)
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error creating recording session:', dbError)
      console.error('   Error code:', dbError.code)
      console.error('   Error message:', dbError.message)
      console.error('   Error details:', dbError.details)
      console.error('   Error hint:', dbError.hint)
      
      return NextResponse.json(
        { 
          error: 'Failed to create recording session', 
          details: dbError.message,
          code: dbError.code,
          hint: dbError.hint
        },
        { status: 500 }
      )
    }

    console.log(`✅ Recording session created: ${sessionData.id} - "${title}"`)

    return NextResponse.json({
      success: true,
      session: sessionData,
      recordingUrl: recordingUrl || null,
      message: 'Recording session created successfully',
    })
  } catch (error) {
    console.error('❌ Error in create-session API:', error)
    console.error('   Error type:', error?.constructor?.name || typeof error)
    console.error('   Error message:', error instanceof Error ? error.message : String(error))
    console.error('   Error stack:', error instanceof Error ? error.stack : 'N/A')
    
    return NextResponse.json(
      {
        error: 'Failed to create recording session',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name || typeof error,
      },
      { status: 500 }
    )
  }
}

