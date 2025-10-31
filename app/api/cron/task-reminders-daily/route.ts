import { NextRequest, NextResponse } from 'next/server'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

/**
 * Cron job: Check for tasks due in 1 day (tomorrow)
 * Runs: Daily at 8:00 AM UTC
 * Schedule: 0 8 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📅 Daily task reminder check triggered (1-day reminders)')
    await taskReminderService.processOneDayReminders()

    return NextResponse.json({ 
      success: true, 
      message: 'Daily task reminders processed (1-day)',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Daily task reminders failed:', error)
    return NextResponse.json({ 
      error: 'Failed to process daily reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

