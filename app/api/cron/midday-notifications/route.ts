import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

// Force dynamic rendering - prevents caching issues with cron jobs
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    console.log('☀️ Midday notifications triggered at', new Date().toISOString(), vercelCron ? '(Vercel cron)' : '(manual)')
    await intelligentAssistant.processNotificationsForPeriod('midday')

    return NextResponse.json({ 
      success: true, 
      message: 'Midday notifications sent',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Midday notifications failed:', error)
    return NextResponse.json({ 
      error: 'Failed to send midday notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}





