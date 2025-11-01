import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

/**
 * Test endpoint to manually trigger notifications
 * Usage: GET /api/test/notifications?type=morning&userId=optional-user-id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'morning'
    const userId = searchParams.get('userId')
    
    console.log(`🧪 Testing ${type} notification${userId ? ` for user ${userId}` : ''}...`)
    
    let result: any = {}
    
    if (type === 'morning' || type === 'midday' || type === 'evening') {
      result = await intelligentAssistant.processNotificationsForPeriod(type as 'morning' | 'midday' | 'evening')
    } else if (type === 'hourly') {
      result = await taskReminderService.processOneHourReminders()
    } else if (type === 'daily') {
      result = await taskReminderService.processOneDayReminders()
    } else if (type === 'overdue') {
      result = await taskReminderService.processOverdueAlerts()
    } else {
      return NextResponse.json({ 
        error: 'Invalid type. Use: morning, midday, evening, hourly, daily, or overdue' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${type} notification test completed`,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test notification failed:', error)
    return NextResponse.json({ 
      error: 'Failed to test notifications',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

