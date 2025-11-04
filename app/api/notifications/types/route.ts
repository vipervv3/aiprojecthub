import { NextRequest, NextResponse } from 'next/server'
import { enhancedNotificationService } from '@/lib/notifications/enhanced-notification-service'
import { NotificationType } from '@/lib/notifications/notification-types'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, type, data } = await request.json()

    if (!userId || !type) {
      return NextResponse.json({ error: 'User ID and notification type are required' }, { status: 400 })
    }

    // Verify user exists
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create notification based on type
    switch (type) {
      case 'task_due':
        await enhancedNotificationService.createTaskNotification(userId, data, NotificationType.TASK_DUE)
        break
      
      case 'task_overdue':
        await enhancedNotificationService.createTaskNotification(userId, data, NotificationType.TASK_OVERDUE)
        break
      
      case 'task_completed':
        await enhancedNotificationService.createTaskNotification(userId, data, NotificationType.TASK_COMPLETED)
        break
      
      case 'project_deadline':
        await enhancedNotificationService.createProjectNotification(userId, data, NotificationType.PROJECT_DEADLINE)
        break
      
      case 'project_at_risk':
        await enhancedNotificationService.createProjectNotification(userId, data, NotificationType.PROJECT_AT_RISK)
        break
      
      case 'meeting_reminder':
        await enhancedNotificationService.createMeetingNotification(userId, data, NotificationType.MEETING_REMINDER)
        break
      
      case 'ai_insight':
        await enhancedNotificationService.createAINotification(userId, NotificationType.AI_INSIGHT, data)
        break
      
      case 'ai_recommendation':
        await enhancedNotificationService.createAINotification(userId, NotificationType.AI_RECOMMENDATION, data)
        break
      
      case 'smart_alert':
        await enhancedNotificationService.createAINotification(userId, NotificationType.SMART_ALERT, data)
        break
      
      case 'weekly_report':
        await enhancedNotificationService.createReportNotification(userId, NotificationType.WEEKLY_REPORT, data)
        break
      
      case 'monthly_report':
        await enhancedNotificationService.createReportNotification(userId, NotificationType.MONTHLY_REPORT, data)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification created successfully' 
    })
  } catch (error) {
    console.error('Notification API error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY FIX: Get authenticated user instead of trusting query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // Import auth utils
    const { getAuthenticatedUser } = await import('@/lib/auth-utils')
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get notifications for authenticated user ONLY
    const notifications = await enhancedNotificationService.getUserNotifications(user.id, 50)
    
    // Filter by type if specified
    const filteredNotifications = type 
      ? notifications.filter(n => n.type === type)
      : notifications

    return NextResponse.json({ notifications: filteredNotifications })
  } catch (error) {
    console.error('Get notifications API error:', error)
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}






















