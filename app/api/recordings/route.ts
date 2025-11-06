import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null
  
  try {
    console.log('📼 Recording upload request received')
    console.log('   Request headers:', {
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
      'origin': request.headers.get('origin'),
    })
    
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const title = formData.get('title') as string
    const duration = parseInt(formData.get('duration') as string)
    const userId = formData.get('userId') as string
    const projectId = formData.get('projectId') as string | null
    
    console.log('📼 Form data received:')
    console.log('   Audio file:', audioFile ? `${audioFile.name} (${audioFile.size} bytes)` : 'MISSING')
    console.log('   Title:', title || 'MISSING')
    console.log('   Duration:', duration || 'MISSING')
    console.log('   User ID:', userId || 'MISSING')
    console.log('   Project ID:', projectId || 'none')

    // ✅ Bulletproof validation
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Missing audio file' },
        { status: 400 }
      )
    }

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

    // ✅ Support large recordings (30+ minutes to 1+ hour)
    // Supabase storage supports up to 500MB per file
    // For very large files, client should use direct upload
    const maxSize = 500 * 1024 * 1024 // 500MB (Supabase storage limit)
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB. For very large files, use direct upload.' },
        { status: 400 }
      )
    }
    
    // Warn if file is very large (but still allow it)
    const fileSizeMB = audioFile.size / 1024 / 1024
    if (fileSizeMB > 100) {
      console.warn(`⚠️ Large file detected: ${fileSizeMB.toFixed(2)}MB. Consider using direct upload for better reliability.`)
    }

    // Validate file type
    if (!audioFile.type.includes('audio') && !audioFile.name.endsWith('.webm')) {
      console.warn('⚠️ Unexpected file type:', audioFile.type, audioFile.name)
      // Continue anyway - some browsers may not set MIME type correctly
    }

    console.log(`📼 Recording upload - Project: ${projectId || 'none'}`)
    console.log(`   File size: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Duration: ${duration}s`)

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate unique filename with retry logic
    const timestamp = Date.now()
    const fileName = `recording_${timestamp}.webm`
    const filePath = `recordings/${userId}/${fileName}`
    uploadedFilePath = filePath // Track for cleanup

    // Upload audio file to Supabase Storage with retry
    let uploadData = null
    let uploadError = null
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const { data, error } = await supabase.storage
        .from('meeting-recordings')
        .upload(filePath, audioFile, {
          contentType: 'audio/webm',
          upsert: false,
        })
      
      if (!error) {
        uploadData = data
        break
      }
      
      uploadError = error
      console.warn(`Upload attempt ${attempt}/${maxRetries} failed:`, error.message)
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        // Generate new filename for retry
        const retryFileName = `recording_${Date.now()}.webm`
        uploadedFilePath = `recordings/${userId}/${retryFileName}`
      }
    }

    if (uploadError || !uploadData) {
      console.error('Upload error after retries:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload recording after multiple attempts', details: uploadError?.message || 'Unknown error' },
        { status: 500 }
      )
    }
    
    console.log(`✅ File uploaded successfully: ${uploadedFilePath}`)

    // Get public URL (use the final uploaded path)
    const finalFilePath = uploadedFilePath || filePath
    const { data: urlData } = supabase.storage
      .from('meeting-recordings')
      .getPublicUrl(finalFilePath)

    const publicUrl = urlData.publicUrl

    // Create recording session in database
    // ✅ Save projectId both in direct column (if exists) and metadata (fallback)
    const sessionDataToInsert: any = {
      user_id: userId,
      title,
      file_path: finalFilePath,
      file_size: audioFile.size,
      duration,
      transcription_status: 'pending',
      metadata: {
        projectId: projectId || null, // ✅ Store project context in metadata
        uploadedAt: new Date().toISOString()
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
      
      // ✅ Clean up uploaded file if database insert fails
      if (uploadedFilePath) {
        try {
          await supabase.storage.from('meeting-recordings').remove([uploadedFilePath])
          console.log('✅ Cleaned up uploaded file after database error')
        } catch (cleanupError) {
          console.error('⚠️ Failed to clean up file:', cleanupError)
        }
      }
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

    console.log(`✅ Recording saved: ${sessionData.id} - "${title}"`)

    return NextResponse.json({
      success: true,
      session: sessionData,
      recordingUrl: publicUrl,
      message: 'Recording uploaded successfully',
    })
  } catch (error) {
    console.error('❌ Error in recordings API:', error)
    console.error('   Error type:', error?.constructor?.name || typeof error)
    console.error('   Error message:', error instanceof Error ? error.message : String(error))
    console.error('   Error stack:', error instanceof Error ? error.stack : 'N/A')
    
    // ✅ Clean up uploaded file if it exists
    if (uploadedFilePath) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase.storage.from('meeting-recordings').remove([uploadedFilePath])
        console.log('✅ Cleaned up uploaded file after error')
      } catch (cleanupError) {
        console.error('⚠️ Failed to clean up file:', cleanupError)
      }
    }
    
    return NextResponse.json(
      {
        error: 'Failed to process recording',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name || typeof error,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch recordings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('recording_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, recordings: data })
  } catch (error) {
    console.error('Error fetching recordings:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch recordings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

