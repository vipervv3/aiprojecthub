import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('☀️ Midday notifications triggered')
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





