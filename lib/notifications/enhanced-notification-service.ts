import { supabaseAdmin } from '@/lib/supabase'
import { aiService } from '@/lib/ai/services'
import { Resend } from 'resend'
import { NotificationType, NOTIFICATION_TEMPLATES } from './notification-types'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EnhancedNotificationData {
  userId: string
  type: NotificationType
  title?: string
  message?: string
  actionUrl?: string
  metadata?: Record<string, any>
  scheduledFor?: Date
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
}

export interface NotificationSchedule {
  userId: string
  type: NotificationType
  time: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  days?: number[]
  isActive: boolean
  aiEnabled: boolean
}

export class EnhancedNotificationService {
  private static instance: EnhancedNotificationService

  static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService()
    }
    return EnhancedNotificationService.instance
  }

  // Create any type of notification
  async createNotification(data: EnhancedNotificationData): Promise<void> {
    try {
      const template = NOTIFICATION_TEMPLATES[data.type]
      
      const notificationData = {
        user_id: data.userId,
        type: data.type,
        title: data.title || template.title,
        message: data.message || template.message,
        action_url: data.actionUrl,
        metadata: {
          ...data.metadata,
          priority: data.priority || template.priority,
          category: data.category || template.category,
          icon: template.icon,
          color: template.color,
          actionable: template.actionable
        },
        scheduled_for: data.scheduledFor?.toISOString(),
        sent_at: data.scheduledFor ? null : new Date().toISOString()
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .insert(notificationData)

      if (error) throw error
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  // Send email notification with template
  async sendEmailNotification(
    email: string, 
    type: NotificationType, 
    customData?: Record<string, any>
  ): Promise<void> {
    try {
      const template = NOTIFICATION_TEMPLATES[type]
      const subject = customData?.title || template.title
      const content = customData?.message || template.message
      
      const htmlContent = this.generateEmailHTML(type, content, customData)

      await resend.emails.send({
        from: 'AI ProjectHub <noreply@aiprojecthub.com>',
        to: [email],
        subject,
        html: htmlContent,
      })
    } catch (error) {
      console.error('Failed to send email notification:', error)
      throw error
    }
  }

  // Generate HTML email content based on notification type
  private generateEmailHTML(
    type: NotificationType, 
    content: string, 
    customData?: Record<string, any>
  ): string {
    const template = NOTIFICATION_TEMPLATES[type]
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .icon { font-size: 48px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 15px; }
          .message { font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
          .cta-button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #6b7280; font-size: 14px; }
          .priority-high { border-left: 4px solid #ef4444; padding-left: 20px; }
          .priority-medium { border-left: 4px solid #f59e0b; padding-left: 20px; }
          .priority-low { border-left: 4px solid #22c55e; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">${template.icon}</div>
            <h1>${template.title}</h1>
          </div>
          
          <div class="content priority-${template.priority}">
            <div class="message">
              ${content}
            </div>
            
            ${customData?.actionItems ? `
            <div style="margin: 20px 0;">
              <h3>Action Items:</h3>
              <ul>
                ${customData.actionItems.map((item: string) => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            ${customData?.metrics ? `
            <div style="margin: 20px 0;">
              <h3>Key Metrics:</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                ${Object.entries(customData.metrics).map(([key, value]) => `
                  <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${value}</div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">${key}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">
                Open AI ProjectHub
              </a>
            </div>
          </div>

          <div class="footer">
            <p>This notification was sent by AI ProjectHub's intelligent notification system.</p>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Process all scheduled notifications
  async processScheduledNotifications(): Promise<void> {
    try {
      console.log('Processing scheduled notifications...')
      
      const now = new Date()
      const { data: notifications } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('sent_at', null)
        .not('scheduled_for', 'is', null)
        .lte('scheduled_for', now.toISOString())

      if (!notifications) return

      for (const notification of notifications) {
        try {
          await this.sendNotification(notification)
        } catch (error) {
          console.error(`Failed to send notification ${notification.id}:`, error)
        }
      }

      console.log(`Processed ${notifications.length} scheduled notifications`)
    } catch (error) {
      console.error('Failed to process scheduled notifications:', error)
    }
  }

  // Send a specific notification
  private async sendNotification(notification: any): Promise<void> {
    try {
      // Get user email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, notification_preferences')
        .eq('id', notification.user_id)
        .single()

      if (!user) return

      // Check if user wants email notifications for this type
      const preferences = user.notification_preferences || {}
      const emailEnabled = preferences[`email_${notification.type}`] !== false

      if (emailEnabled) {
        await this.sendEmailNotification(
          user.email,
          notification.type as NotificationType,
          {
            title: notification.title,
            message: notification.message,
            ...notification.metadata
          }
        )
      }

      // Mark as sent
      await supabaseAdmin
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notification.id)

    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  // Create task-related notifications
  async createTaskNotification(
    userId: string,
    task: any,
    type: NotificationType.TASK_DUE | NotificationType.TASK_OVERDUE | NotificationType.TASK_COMPLETED | NotificationType.TASK_ASSIGNED
  ): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[type]
    
    let title = template.title
    let message = template.message
    let scheduledFor: Date | undefined

    switch (type) {
      case NotificationType.TASK_DUE:
        title = `Task Due Soon: ${task.title}`
        message = `Your task "${task.title}" is due ${this.formatDueDate(task.due_date)}`
        // Schedule for 1 hour before due date
        scheduledFor = new Date(new Date(task.due_date).getTime() - 60 * 60 * 1000)
        break
      
      case NotificationType.TASK_OVERDUE:
        title = `Overdue Task: ${task.title}`
        message = `Your task "${task.title}" is overdue and needs immediate attention`
        break
      
      case NotificationType.TASK_COMPLETED:
        title = `Task Completed: ${task.title}`
        message = `Great job! You've completed "${task.title}"`
        break
      
      case NotificationType.TASK_ASSIGNED:
        title = `New Task Assigned: ${task.title}`
        message = `You've been assigned a new task: "${task.title}"`
        break
    }

    await this.createNotification({
      userId,
      type,
      title,
      message,
      actionUrl: `/tasks?id=${task.id}`,
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.project_id
      },
      scheduledFor
    })
  }

  // Create project notifications
  async createProjectNotification(
    userId: string,
    project: any,
    type: NotificationType.PROJECT_UPDATE | NotificationType.PROJECT_DEADLINE | NotificationType.PROJECT_AT_RISK
  ): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[type]
    
    let title = template.title
    let message = template.message
    let scheduledFor: Date | undefined

    switch (type) {
      case NotificationType.PROJECT_DEADLINE:
        title = `Project Deadline: ${project.name}`
        message = `Your project "${project.name}" deadline is approaching`
        // Schedule for 3 days before deadline
        scheduledFor = new Date(new Date(project.due_date).getTime() - 3 * 24 * 60 * 60 * 1000)
        break
      
      case NotificationType.PROJECT_AT_RISK:
        title = `Project at Risk: ${project.name}`
        message = `Your project "${project.name}" may be at risk of missing its deadline`
        break
      
      case NotificationType.PROJECT_UPDATE:
        title = `Project Update: ${project.name}`
        message = `There's been an update to your project "${project.name}"`
        break
    }

    await this.createNotification({
      userId,
      type,
      title,
      message,
      actionUrl: `/projects?id=${project.id}`,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        progress: project.progress
      },
      scheduledFor
    })
  }

  // Create meeting notifications
  async createMeetingNotification(
    userId: string,
    meeting: any,
    type: NotificationType.MEETING_REMINDER | NotificationType.MEETING_STARTING | NotificationType.MEETING_COMPLETED
  ): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[type]
    
    let title = template.title
    let message = template.message
    let scheduledFor: Date | undefined

    switch (type) {
      case NotificationType.MEETING_REMINDER:
        title = `Meeting Reminder: ${meeting.title}`
        message = `You have a meeting "${meeting.title}" scheduled soon`
        // Schedule for 15 minutes before meeting
        scheduledFor = new Date(new Date(meeting.scheduled_at).getTime() - 15 * 60 * 1000)
        break
      
      case NotificationType.MEETING_STARTING:
        title = `Meeting Starting: ${meeting.title}`
        message = `Your meeting "${meeting.title}" is starting now`
        scheduledFor = new Date(meeting.scheduled_at)
        break
      
      case NotificationType.MEETING_COMPLETED:
        title = `Meeting Completed: ${meeting.title}`
        message = `Your meeting "${meeting.title}" has ended. Review the summary and action items`
        break
    }

    await this.createNotification({
      userId,
      type,
      title,
      message,
      actionUrl: `/meetings?id=${meeting.id}`,
      metadata: {
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        duration: meeting.duration
      },
      scheduledFor
    })
  }

  // Create AI-powered notifications
  async createAINotification(
    userId: string,
    type: NotificationType.AI_INSIGHT | NotificationType.AI_RECOMMENDATION | NotificationType.SMART_ALERT,
    data: any
  ): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[type]
    
    // Generate AI-powered content
    const aiContent = await aiService.generateNotificationContent(data, type)
    
    await this.createNotification({
      userId,
      type,
      title: aiContent.title,
      message: aiContent.message,
      priority: aiContent.priority,
      actionUrl: '/ai-insights',
      metadata: {
        aiGenerated: true,
        confidence: data.confidence || 0.8,
        ...data
      }
    })
  }

  // Create weekly/monthly reports
  async createReportNotification(
    userId: string,
    type: NotificationType.WEEKLY_REPORT | NotificationType.MONTHLY_REPORT | NotificationType.PRODUCTIVITY_REPORT,
    reportData: any
  ): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[type]
    
    await this.createNotification({
      userId,
      type,
      title: template.title,
      message: template.message,
      actionUrl: '/reports',
      metadata: {
        reportData,
        generatedAt: new Date().toISOString()
      }
    })
  }

  // Schedule recurring notifications
  async scheduleRecurringNotification(schedule: NotificationSchedule): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('notification_schedules')
        .insert({
          user_id: schedule.userId,
          schedule_type: schedule.frequency,
          time_slot: schedule.time,
          days_of_week: schedule.days || [],
          is_active: schedule.isActive,
          ai_intelligence_enabled: schedule.aiEnabled
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to schedule recurring notification:', error)
      throw error
    }
  }

  // Process recurring notifications
  async processRecurringNotifications(): Promise<void> {
    try {
      const now = new Date()
      const currentHour = now.getHours().toString().padStart(2, '0')
      const currentMinute = now.getMinutes().toString().padStart(2, '0')
      const currentTime = `${currentHour}:${currentMinute}`
      const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.

      const { data: schedules } = await supabaseAdmin
        .from('notification_schedules')
        .select('*')
        .eq('is_active', true)
        .eq('time_slot', currentTime)

      if (!schedules) return

      for (const schedule of schedules) {
        try {
          // Check if today is a scheduled day
          if (schedule.days_of_week && schedule.days_of_week.length > 0) {
            if (!schedule.days_of_week.includes(currentDay)) {
              continue
            }
          }

          await this.generateRecurringNotification(schedule)
        } catch (error) {
          console.error(`Failed to process recurring notification for schedule ${schedule.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to process recurring notifications:', error)
    }
  }

  // Generate recurring notification
  private async generateRecurringNotification(schedule: any): Promise<void> {
    // This would generate the appropriate notification based on the schedule type
    // For now, we'll create a generic recurring notification
    await this.createNotification({
      userId: schedule.user_id,
      type: NotificationType.CUSTOM_REMINDER,
      title: 'Scheduled Reminder',
      message: 'This is your scheduled reminder from AI ProjectHub',
      metadata: {
        scheduleId: schedule.id,
        aiGenerated: schedule.ai_intelligence_enabled
      }
    })
  }

  // Utility function to format due dates
  private formatDueDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'tomorrow'
    if (diffDays > 0) return `in ${diffDays} days`
    if (diffDays === -1) return 'yesterday'
    return `${Math.abs(diffDays)} days ago`
  }

  // Get user notifications
  async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get user notifications:', error)
      return []
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }
}

export const enhancedNotificationService = EnhancedNotificationService.getInstance()






















