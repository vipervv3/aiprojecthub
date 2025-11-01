import { NextRequest, NextResponse } from 'next/server'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

// Force dynamic rendering - prevents caching issues with cron jobs
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron job: Check for tasks due in 1 hour
 * Runs: Every hour
 * Schedule: 0 * * * * (every hour on the hour)
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

    console.log('⏰ Hourly task reminder check triggered at', new Date().toISOString(), vercelCron ? '(Vercel cron)' : '(manual)')
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

