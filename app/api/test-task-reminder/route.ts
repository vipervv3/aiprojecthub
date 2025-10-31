import { NextRequest, NextResponse } from 'next/server'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

/**
 * Test endpoint for task reminders
 * Visit: /api/test-task-reminder?type=1hour|1day|overdue
 */
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') || '1hour'
    
    if (!['1hour', '1day', 'overdue'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Must be: 1hour, 1day, or overdue'
      }, { status: 400 })
    }

    console.log(`🧪 Testing ${type} task reminders`)

    let message = ''
    if (type === '1hour') {
      await taskReminderService.processOneHourReminders()
      message = 'Processed 1-hour deadline reminders'
    } else if (type === '1day') {
      await taskReminderService.processOneDayReminders()
      message = 'Processed 1-day deadline reminders'
    } else if (type === 'overdue') {
      await taskReminderService.processOverdueAlerts()
      message = 'Processed overdue task alerts'
    }

    return NextResponse.json({ 
      success: true, 
      message: `✅ ${message}! Check your email.`,
      type,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test task reminder failed:', error)
    return NextResponse.json({ 
      error: 'Failed to send test reminder',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

