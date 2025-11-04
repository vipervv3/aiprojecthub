import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const vercelCron = request.headers.get('x-vercel-cron')
    
    if (!vercelCron && process.env.CRON_SECRET) {
      const providedSecret = authHeader?.replace('Bearer ', '')
      if (providedSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log(`🔄 Notification scheduler triggered at ${new Date().toISOString()}`, vercelCron ? '(Vercel cron)' : '(manual)')
    
    // Get all users with their timezones
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, timezone, notification_preferences')

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users found',
        timestamp: new Date().toISOString()
      })
    }

    const currentUTC = new Date()
    let morningSent = 0
    let middaySent = 0
    let eveningSent = 0
    let skipped = 0

    // Process each user and check what notifications they should receive
    for (const user of users) {
      const userTimezone = user.timezone || 'UTC'
      const prefs = user.notification_preferences || {}
      
      // Get user's current local time
      const now = new Date()
      const userLocalTimeString = now.toLocaleString('en-US', {
        timeZone: userTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
      const [userHour, userMinute] = userLocalTimeString.split(':').map(Number)

      console.log(`👤 User ${user.email} (${userTimezone}): Current local time is ${userHour}:${userMinute.toString().padStart(2, '0')}`)

      // Check if it's time for morning notification (default 8 AM)
      const morningTime = prefs.morning_notification_time?.split(':') || ['8', '0']
      const morningHour = parseInt(morningTime[0], 10)
      const morningMinute = parseInt(morningTime[1] || '0', 10)
      
      if (userHour === morningHour && userMinute >= morningMinute && userMinute < morningMinute + 5) {
        console.log(`📅 Sending morning notification to ${user.email} at ${userHour}:${userMinute.toString().padStart(2, '0')} ${userTimezone}`)
        try {
          await intelligentAssistant.sendIntelligentNotification(user.id, 'morning')
          morningSent++
        } catch (error) {
          console.error(`Failed to send morning notification to ${user.id}:`, error)
        }
      }
      
      // Check if it's time for midday notification (1 PM)
      if (userHour === 13 && userMinute >= 0 && userMinute < 5) {
        console.log(`📅 Sending midday notification to ${user.email} at ${userHour}:${userMinute.toString().padStart(2, '0')} ${userTimezone}`)
        try {
          await intelligentAssistant.sendIntelligentNotification(user.id, 'midday')
          middaySent++
        } catch (error) {
          console.error(`Failed to send midday notification to ${user.id}:`, error)
        }
      }
      
      // Check if it's time for evening notification (6 PM)
      if (userHour === 18 && userMinute >= 0 && userMinute < 5) {
        console.log(`📅 Sending evening notification to ${user.email} at ${userHour}:${userMinute.toString().padStart(2, '0')} ${userTimezone}`)
        try {
          await intelligentAssistant.sendIntelligentNotification(user.id, 'evening')
          eveningSent++
        } catch (error) {
          console.error(`Failed to send evening notification to ${user.id}:`, error)
        }
      }

      if (!(userHour === morningHour && userMinute >= morningMinute && userMinute < morningMinute + 5) &&
          !(userHour === 13 && userMinute >= 0 && userMinute < 5) &&
          !(userHour === 18 && userMinute >= 0 && userMinute < 5)) {
        skipped++
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications scheduled',
      stats: {
        totalUsers: users.length,
        morningSent,
        middaySent,
        eveningSent,
        skipped
      },
      timestamp: new Date().toISOString(),
      utcTime: currentUTC.toISOString()
    })
  } catch (error) {
    console.error('Notification scheduler failed:', error)
    return NextResponse.json({ 
      error: 'Failed to schedule notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

