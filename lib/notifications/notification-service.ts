import { supabaseAdmin } from '@/lib/supabase'
import { aiService } from '@/lib/ai/services'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface NotificationData {
  userId: string
  type: 'task_due' | 'project_update' | 'meeting_reminder' | 'ai_insight' | 'daily_summary' | 'morning_notification' | 'smart_alert'
  title: string
  message: string
  actionUrl?: string
  metadata?: Record<string, any>
  scheduledFor?: Date
}

export interface MorningNotificationData {
  userId: string
  projects: any[]
  tasks: any[]
  meetings: any[]
  aiInsights: any[]
  userPreferences: any
}

export class NotificationService {
  private static instance: NotificationService

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Create notification
  async createNotification(data: NotificationData): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          action_url: data.actionUrl,
          metadata: data.metadata || {},
          scheduled_for: data.scheduledFor?.toISOString(),
          sent_at: data.scheduledFor ? null : new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  // Send email notification
  async sendEmailNotification(email: string, subject: string, content: string, htmlContent?: string): Promise<void> {
    try {
      await resend.emails.send({
        from: 'AI ProjectHub <noreply@aiprojecthub.com>',
        to: [email],
        subject,
        html: htmlContent || `<p>${content}</p>`,
      })
    } catch (error) {
      console.error('Failed to send email notification:', error)
      throw error
    }
  }

  // AI-powered morning notifications
  async generateMorningNotifications(userId: string): Promise<void> {
    try {
      // Get user data for AI analysis
      const userData = await this.getUserDataForNotifications(userId)
      
      if (!userData) {
        console.log(`No user data found for user ${userId}`)
        return
      }

      // Generate AI-powered notification content
      const notificationContent = await aiService.generateNotificationContent(
        userData,
        'morning_notification'
      )

      // Create personalized morning notification
      await this.createNotification({
        userId,
        type: 'morning_notification',
        title: notificationContent.title,
        message: notificationContent.message,
        actionUrl: '/dashboard',
        metadata: {
          priority: notificationContent.priority,
          actionable: notificationContent.actionable,
          aiGenerated: true,
          generatedAt: new Date().toISOString()
        }
      })

      // Send email if user has email notifications enabled
      if (userData.user.notification_preferences?.email_daily_summary) {
        await this.sendMorningEmail(userId, userData, notificationContent)
      }

      console.log(`Generated morning notification for user ${userId}`)
    } catch (error) {
      console.error(`Failed to generate morning notification for user ${userId}:`, error)
    }
  }

  // Get comprehensive user data for AI analysis
  private async getUserDataForNotifications(userId: string): Promise<any> {
    try {
      // Get user profile
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!user) return null

      // Get active projects
      const { data: projects } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      // Get today's tasks
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: tasks } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          projects!inner(*)
        `)
        .eq('projects.owner_id', userId)
        .gte('due_date', today.toISOString())
        .lt('due_date', tomorrow.toISOString())
        .order('priority', { ascending: false })

      // Get today's meetings
      const { data: meetings } = await supabaseAdmin
        .from('meetings')
        .select('*')
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
        .order('scheduled_at', { ascending: true })

      // Get recent AI insights
      const { data: insights } = await supabaseAdmin
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      return {
        user,
        projects: projects || [],
        tasks: tasks || [],
        meetings: meetings || [],
        insights: insights || []
      }
    } catch (error) {
      console.error('Failed to get user data for notifications:', error)
      return null
    }
  }

  // Send morning email with AI-generated content
  private async sendMorningEmail(userId: string, userData: any, notificationContent: any): Promise<void> {
    try {
      const { user, projects, tasks, meetings, insights } = userData

      // Generate email HTML content
      const emailContent = this.generateMorningEmailHTML(
        user,
        projects,
        tasks,
        meetings,
        insights,
        notificationContent
      )

      await this.sendEmailNotification(
        user.email,
        `Good morning, ${user.name}! Your AI ProjectHub update`,
        notificationContent.message,
        emailContent
      )
    } catch (error) {
      console.error('Failed to send morning email:', error)
    }
  }

  // Generate HTML email content
  private generateMorningEmailHTML(
    user: any,
    projects: any[],
    tasks: any[],
    meetings: any[],
    insights: any[],
    notificationContent: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #3b82f6; margin-bottom: 15px; }
          .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: #f8fafc; border-radius: 8px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .task-item { padding: 10px; border-left: 3px solid #3b82f6; margin-bottom: 10px; background: #f8fafc; }
          .priority-urgent { border-left-color: #ef4444; }
          .priority-high { border-left-color: #f59e0b; }
          .cta-button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Good morning, ${user.name}! 👋</h1>
            <p>Your AI-powered project management update</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h3>📊 Today's Overview</h3>
              <div class="metric">
                <div class="metric-value">${projects.length}</div>
                <div class="metric-label">Active Projects</div>
              </div>
              <div class="metric">
                <div class="metric-value">${tasks.length}</div>
                <div class="metric-label">Tasks Due Today</div>
              </div>
              <div class="metric">
                <div class="metric-value">${meetings.length}</div>
                <div class="metric-label">Meetings Today</div>
              </div>
            </div>

            ${tasks.length > 0 ? `
            <div class="section">
              <h3>🎯 Today's Priority Tasks</h3>
              ${tasks.slice(0, 5).map((task: any) => `
                <div class="task-item priority-${task.priority}">
                  <strong>${task.title}</strong><br>
                  <small>Due: ${new Date(task.due_date).toLocaleTimeString()}</small>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${meetings.length > 0 ? `
            <div class="section">
              <h3>📅 Today's Meetings</h3>
              ${meetings.map((meeting: any) => `
                <div class="task-item">
                  <strong>${meeting.title}</strong><br>
                  <small>${new Date(meeting.scheduled_at).toLocaleString()}</small>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${insights.length > 0 ? `
            <div class="section">
              <h3>🤖 AI Insights</h3>
              ${insights.slice(0, 3).map((insight: any) => `
                <div class="task-item">
                  <strong>${insight.title}</strong><br>
                  <small>${insight.description}</small>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div class="section">
              <h3>💡 AI Recommendation</h3>
              <p>${notificationContent.message}</p>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">
                Open AI ProjectHub
              </a>
            </div>
          </div>

          <div class="footer">
            <p>This email was generated by AI ProjectHub's intelligent notification system.</p>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Schedule intelligent notifications based on user behavior
  async scheduleIntelligentNotifications(userId: string): Promise<void> {
    try {
      const userData = await this.getUserDataForNotifications(userId)
      
      if (!userData) return

      // Analyze user patterns and schedule smart notifications
      await this.analyzeAndScheduleNotifications(userId, userData)
    } catch (error) {
      console.error('Failed to schedule intelligent notifications:', error)
    }
  }

  // Analyze user patterns and create smart notifications
  private async analyzeAndScheduleNotifications(userId: string, userData: any): Promise<void> {
    const { projects, tasks, meetings, insights } = userData

    // Check for urgent tasks and schedule alerts
    const urgentTasks = tasks.filter((task: any) => task.priority === 'urgent' && !task.completed_at)
    if (urgentTasks.length > 0) {
      await this.createNotification({
        userId,
        type: 'smart_alert',
        title: '🚨 Urgent Tasks Alert',
        message: `You have ${urgentTasks.length} urgent task${urgentTasks.length > 1 ? 's' : ''} requiring immediate attention.`,
        actionUrl: '/tasks?filter=urgent',
        metadata: {
          priority: 'high',
          aiGenerated: true,
          triggerType: 'urgent_tasks'
        }
      })
    }

    // Check for upcoming deadlines
    const upcomingDeadlines = tasks.filter((task: any) => {
      const dueDate = new Date(task.due_date)
      const now = new Date()
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntilDue > 0 && hoursUntilDue <= 24 && !task.completed_at
    })

    if (upcomingDeadlines.length > 0) {
      await this.createNotification({
        userId,
        type: 'smart_alert',
        title: '⏰ Deadline Reminder',
        message: `${upcomingDeadlines.length} task${upcomingDeadlines.length > 1 ? 's' : ''} due within 24 hours.`,
        actionUrl: '/tasks',
        metadata: {
          priority: 'medium',
          aiGenerated: true,
          triggerType: 'upcoming_deadlines'
        }
      })
    }

    // Check for project health issues
    const atRiskProjects = projects.filter((project: any) => project.progress < 30 && new Date(project.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    if (atRiskProjects.length > 0) {
      await this.createNotification({
        userId,
        type: 'ai_insight',
        title: '⚠️ Project Health Alert',
        message: `${atRiskProjects.length} project${atRiskProjects.length > 1 ? 's' : ''} may be at risk of missing deadlines.`,
        actionUrl: '/projects',
        metadata: {
          priority: 'high',
          aiGenerated: true,
          triggerType: 'project_health'
        }
      })
    }
  }

  // Process all morning notifications (cron job)
  async processMorningNotifications(): Promise<void> {
    try {
      console.log('Starting morning notification processing...')
      
      // Get all users with morning notifications enabled
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, notification_preferences')
        .eq('notification_preferences->morning_notifications', true)

      if (!users) {
        console.log('No users with morning notifications enabled')
        return
      }

      console.log(`Processing morning notifications for ${users.length} users`)

      // Process each user
      for (const user of users) {
        try {
          await this.generateMorningNotifications(user.id)
          
          // Schedule intelligent notifications
          await this.scheduleIntelligentNotifications(user.id)
        } catch (error) {
          console.error(`Failed to process notifications for user ${user.id}:`, error)
        }
      }

      console.log('Morning notification processing completed')
    } catch (error) {
      console.error('Failed to process morning notifications:', error)
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
}

export const notificationService = NotificationService.getInstance()






















