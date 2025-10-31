import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🌅 Morning notifications triggered')
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





