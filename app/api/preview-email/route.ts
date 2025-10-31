import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

/**
 * Preview email HTML in browser without sending
 * Visit: /api/preview-email?userId=your-user-id&period=morning
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const period = request.nextUrl.searchParams.get('period') || 'morning'
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId required',
        usage: '/api/preview-email?userId=your-user-id&period=morning'
      }, { status: 400 })
    }

    if (!['morning', 'midday', 'evening'].includes(period)) {
      return NextResponse.json({ 
        error: 'Invalid period. Must be: morning, midday, or evening'
      }, { status: 400 })
    }

    // Get user data
    const userData = await intelligentAssistant.getUserDataForAssistant(userId)
    if (!userData || !userData.user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Generate AI message
    const aiMessage = await intelligentAssistant.generateAssistantMessage(
      period as 'morning' | 'midday' | 'evening',
      userData
    )

    // Generate email HTML
    const emailHTML = (intelligentAssistant as any).generateIntelligentEmailHTML(
      period,
      userData,
      aiMessage
    )

    // Return HTML directly
    return new NextResponse(emailHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Preview email failed:', error)
    return new NextResponse(
      `<h1>Error</h1><pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>`,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

