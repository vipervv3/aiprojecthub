import { NextRequest, NextResponse } from 'next/server'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

// Force dynamic rendering - prevents caching issues with cron jobs
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron job: Alert users about overdue tasks
 * Runs: Daily at 9:00 AM UTC
 * Schedule: 0 9 * * *
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

    console.log('🚨 Overdue task alert check triggered at', new Date().toISOString(), vercelCron ? '(Vercel cron)' : '(manual)')
    await taskReminderService.processOverdueAlerts()

    return NextResponse.json({ 
      success: true, 
      message: 'Overdue task alerts processed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Overdue task alerts failed:', error)
    return NextResponse.json({ 
      error: 'Failed to process overdue alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

