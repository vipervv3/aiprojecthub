import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

/**
 * Test endpoint for intelligent notifications
 * Visit: /api/test-notification?userId=your-user-id&period=morning
 */
export async function GET(request: NextRequest) {
  try {
    // Get parameters
    const userId = request.nextUrl.searchParams.get('userId')
    const period = request.nextUrl.searchParams.get('period') || 'morning'
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId required',
        usage: '/api/test-notification?userId=your-user-id&period=morning'
      }, { status: 400 })
    }

    if (!['morning', 'midday', 'evening'].includes(period)) {
      return NextResponse.json({ 
        error: 'Invalid period. Must be: morning, midday, or evening'
      }, { status: 400 })
    }

    console.log(`🧪 Testing ${period} notification for user ${userId}`)

    // Send test notification
    await intelligentAssistant.sendIntelligentNotification(
      userId, 
      period as 'morning' | 'midday' | 'evening'
    )

    return NextResponse.json({ 
      success: true, 
      message: `✅ Test ${period} notification sent! Check your email and in-app notifications.`,
      userId,
      period,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test notification failed:', error)
    return NextResponse.json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}







