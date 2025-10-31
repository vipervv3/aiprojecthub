import { NextRequest, NextResponse } from 'next/server'
import { taskReminderService } from '@/lib/notifications/task-reminder-service'

/**
 * Cron job: Alert users about overdue tasks
 * Runs: Daily at 9:00 AM UTC
 * Schedule: 0 9 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚨 Overdue task alert check triggered')
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

