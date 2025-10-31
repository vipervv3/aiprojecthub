import { NextRequest, NextResponse } from 'next/server'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

/**
 * Cron job: Check for tasks due in 1 hour
 * Runs: Every hour
 * Schedule: 0 * * * * (every hour on the hour)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('⏰ Hourly task reminder check triggered')
    await taskReminderService.processOneHourReminders()

    return NextResponse.json({ 
      success: true, 
      message: 'Hourly task reminders processed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Hourly task reminders failed:', error)
    return NextResponse.json({ 
      error: 'Failed to process hourly reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

