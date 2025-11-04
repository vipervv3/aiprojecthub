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

    console.log('🌙 Evening notifications triggered at', new Date().toISOString(), vercelCron ? '(Vercel cron)' : '(manual)')
    await intelligentAssistant.processNotificationsForPeriod('evening')

    return NextResponse.json({ 
      success: true, 
      message: 'Evening notifications sent',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Evening notifications failed:', error)
    return NextResponse.json({ 
      error: 'Failed to send evening notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}





