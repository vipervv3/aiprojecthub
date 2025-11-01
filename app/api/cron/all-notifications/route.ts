import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

// Force dynamic rendering - prevents caching issues with cron jobs
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Vercel cron jobs are automatically authenticated by Vercel
    const authHeader = request.headers.get('authorization')
    const vercelCron = request.headers.get('x-vercel-cron')
    
    // If CRON_SECRET is set, require it for non-Vercel calls
    if (!vercelCron && process.env.CRON_SECRET) {
      const providedSecret = authHeader?.replace('Bearer ', '')
      if (providedSecret !== process.env.CRON_SECRET) {
        console.error('❌ Unauthorized cron request - missing valid auth')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const currentHour = new Date().getUTCHours()
    
    console.log(`🔄 All notifications cron triggered at ${currentHour}:00 UTC`, vercelCron ? '(Vercel cron)' : '(manual)')
    
    // Check what period we're in and process accordingly
    // This runs multiple times per day, and each time it checks if it's the right time for each user's timezone
    await intelligentAssistant.processNotificationsForPeriod('morning')
    await intelligentAssistant.processNotificationsForPeriod('midday')
    await intelligentAssistant.processNotificationsForPeriod('evening')

    return NextResponse.json({ 
      success: true, 
      message: 'All notifications processed',
      timestamp: new Date().toISOString(),
      hour: currentHour
    })
  } catch (error) {
    console.error('All notifications cron failed:', error)
    return NextResponse.json({ 
      error: 'Failed to process notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

