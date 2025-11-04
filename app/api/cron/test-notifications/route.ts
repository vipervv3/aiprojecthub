import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') as 'morning' | 'midday' | 'evening' | null

    console.log(`🧪 Test notification request - userId: ${userId}, period: ${period || 'all'}`)

    if (userId) {
      // Test notification for specific user
      if (period) {
        await intelligentAssistant.sendIntelligentNotification(userId, period)
        return NextResponse.json({ 
          success: true, 
          message: `Test ${period} notification sent to user ${userId}`,
          timestamp: new Date().toISOString()
        })
      } else {
        // Send all periods
        await intelligentAssistant.sendIntelligentNotification(userId, 'morning')
        await intelligentAssistant.sendIntelligentNotification(userId, 'midday')
        await intelligentAssistant.sendIntelligentNotification(userId, 'evening')
        return NextResponse.json({ 
          success: true, 
          message: `Test notifications (all periods) sent to user ${userId}`,
          timestamp: new Date().toISOString()
        })
      }
    } else {
      // Process all users for all periods (simulate cron job)
      console.log('🧪 Processing all notifications for all users...')
      await intelligentAssistant.processNotificationsForPeriod('morning')
      await intelligentAssistant.processNotificationsForPeriod('midday')
      await intelligentAssistant.processNotificationsForPeriod('evening')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test notifications processed for all users',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Test notification failed:', error)
    return NextResponse.json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

