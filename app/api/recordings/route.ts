import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const title = formData.get('title') as string
    const duration = parseInt(formData.get('duration') as string)
    const userId = formData.get('userId') as string
    const projectId = formData.get('projectId') as string | null

    if (!audioFile || !title || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, title, or userId' },
        { status: 400 }
      )
    }

    console.log(`📼 Recording upload - Project: ${projectId || 'none'}`)

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `recording_${timestamp}.webm`
    const filePath = `recordings/${userId}/${fileName}`

    // Upload audio file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('meeting-recordings')
      .upload(filePath, audioFile, {
        contentType: 'audio/webm',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload recording', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('meeting-recordings')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Create recording session in database
    const { data: sessionData, error: dbError } = await supabase
      .from('recording_sessions')
      .insert({
        user_id: userId,
        title,
        file_path: filePath,
        file_size: audioFile.size,
        duration,
        transcription_status: 'pending',
        metadata: {
          projectId: projectId || null, // ✅ Store project context
          uploadedAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from('meeting-recordings').remove([filePath])
      return NextResponse.json(
        { error: 'Failed to create recording session', details: dbError.message },
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
    console.error('Error in recordings API:', error)
    return NextResponse.json(
      {
        error: 'Failed to process recording',
        details: error instanceof Error ? error.message : 'Unknown error',
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

