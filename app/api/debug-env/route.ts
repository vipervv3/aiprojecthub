import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to check environment variables (without exposing values)
 */
export async function GET(request: NextRequest) {
  const envVars = {
    GROQ_API_KEY: process.env.GROQ_API_KEY ? '✅ SET' : '❌ NOT SET',
    GROQ_API_KEY_LENGTH: process.env.GROQ_API_KEY?.length || 0,
    GROQ_API_KEY_PREFIX: process.env.GROQ_API_KEY?.substring(0, 10) || 'N/A',
    ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY ? '✅ SET' : '❌ NOT SET',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ SET' : '❌ NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET',
  }

  return NextResponse.json({
    message: 'Environment variable check',
    envVars,
    note: 'Values are not exposed for security'
  })
}

