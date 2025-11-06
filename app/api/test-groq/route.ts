import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai/services'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to verify Groq API is working
 */
export async function GET(request: NextRequest) {
  try {
    const hasGroqKey = !!process.env.GROQ_API_KEY
    const groqKeyLength = process.env.GROQ_API_KEY?.length || 0

    console.log('🧪 Testing Groq API...')
    console.log(`   GROQ_API_KEY: ${hasGroqKey ? 'SET' : 'NOT SET'}`)
    // Don't log key length or prefix in production for security

    if (!hasGroqKey) {
      return NextResponse.json({
        success: false,
        error: 'GROQ_API_KEY is not set on Vercel',
        details: 'Please add GROQ_API_KEY to Vercel environment variables'
      }, { status: 500 })
    }

    // Test a simple Groq API call
    const aiService = AIService.getInstance()
    
    try {
      console.log('🚀 Calling Groq API...')
      const testPrompt = 'Say "SUCCESS" and nothing else.'
      const response = await aiService.analyzeWithFallback(testPrompt)
      
      console.log('✅ Groq API test successful!')
      console.log(`   Response: ${response?.substring(0, 100)}`)

      return NextResponse.json({
        success: true,
        message: 'Groq API is working!',
        response: response?.substring(0, 100)
        // Don't expose key length or prefix in response
      })
    } catch (testError: any) {
      console.error('❌ Groq API test failed:', testError)
      
      return NextResponse.json({
        success: false,
        error: 'Groq API call failed',
        details: testError?.message || 'Unknown error',
        errorType: testError?.constructor?.name
        // Don't expose key length, prefix, or stack traces in production
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

