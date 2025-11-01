import { NextRequest, NextResponse } from 'next/server'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Vercel cron jobs are automatically authenticated by Vercel
    const authHeader = request.headers.get('authorization')
    const vercelCron = request.headers.get('x-vercel-cron')
    
    if (!vercelCron && process.env.CRON_SECRET) {
      const providedSecret = authHeader?.replace('Bearer ', '')
      if (providedSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('⏰ Task reminders cron triggered', vercelCron ? '(Vercel cron)' : '(manual)')
    
    // Process all task reminders (hourly, daily, overdue)
    await taskReminderService.processHourlyReminders()
    await taskReminderService.processDailyReminders()
    await taskReminderService.processOverdueAlerts()

    return NextResponse.json({ 
      success: true, 
      message: 'Task reminders processed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Task reminders cron failed:', error)
    return NextResponse.json({ 
      error: 'Failed to process task reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

