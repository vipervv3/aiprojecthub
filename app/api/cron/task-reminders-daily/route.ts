import { NextRequest, NextResponse } from 'next/server'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

// Force dynamic rendering - prevents caching issues with cron jobs
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron job: Check for tasks due in 1 day (tomorrow)
 * Runs: Daily at 8:00 AM UTC
 * Schedule: 0 8 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel cron jobs are automatically authenticated
    const authHeader = request.headers.get('authorization')
    const vercelCron = request.headers.get('x-vercel-cron')
    
    if (!vercelCron && process.env.CRON_SECRET) {
      const providedSecret = authHeader?.replace('Bearer ', '')
      if (providedSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('📅 Daily task reminder check triggered (1-day reminders) at', new Date().toISOString(), vercelCron ? '(Vercel cron)' : '(manual)')
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

