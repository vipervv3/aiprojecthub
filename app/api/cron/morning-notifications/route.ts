import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

// Force dynamic rendering - prevents caching issues with cron jobs
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Vercel cron jobs are automatically authenticated by Vercel
    // Check for Vercel's cron signature or CRON_SECRET for manual calls
    const authHeader = request.headers.get('authorization')
    const vercelCron = request.headers.get('x-vercel-cron')
    
    // If CRON_SECRET is set, require it for non-Vercel calls
    // Vercel automatically authenticates cron jobs, so we trust x-vercel-cron header
    if (!vercelCron && process.env.CRON_SECRET) {
      const providedSecret = authHeader?.replace('Bearer ', '')
      if (providedSecret !== process.env.CRON_SECRET) {
        console.error('❌ Unauthorized cron request - missing valid auth')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('🌅 Morning notifications triggered at', new Date().toISOString(), vercelCron ? '(Vercel cron)' : '(manual)')
    await intelligentAssistant.processNotificationsForPeriod('morning')

    return NextResponse.json({ 
      success: true, 
      message: 'Morning notifications sent',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Morning notifications failed:', error)
    return NextResponse.json({ 
      error: 'Failed to send morning notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}





