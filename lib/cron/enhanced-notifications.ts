import cron from 'node-cron'
import { enhancedNotificationService } from '@/lib/notifications/enhanced-notification-service'
import { supabaseAdmin } from '@/lib/supabase'

export class EnhancedNotificationCron {
  private static instance: EnhancedNotificationCron
  private isRunning: boolean = false

  static getInstance(): EnhancedNotificationCron {
    if (!EnhancedNotificationCron.instance) {
      EnhancedNotificationCron.instance = new EnhancedNotificationCron()
    }
    return EnhancedNotificationCron.instance
  }

  // Start all notification cron jobs
  start(): void {
    if (this.isRunning) {
      console.log('Enhanced notification cron is already running')
      return
    }

    // Morning notifications (8:00 AM daily)
    cron.schedule('0 8 * * *', async () => {
      console.log('Running morning notification cron job...')
      try {
        await this.processMorningNotifications()
      } catch (error) {
        console.error('Morning notification cron job failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    // Evening summary (6:00 PM daily)
    cron.schedule('0 18 * * *', async () => {
      console.log('Running evening summary cron job...')
      try {
        await this.processEveningSummaries()
      } catch (error) {
        console.error('Evening summary cron job failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    // Task deadline checks (every hour)
    cron.schedule('0 * * * *', async () => {
      console.log('Running task deadline check...')
      try {
        await this.checkTaskDeadlines()
      } catch (error) {
        console.error('Task deadline check failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    // Project health checks (every 6 hours)
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running project health check...')
      try {
        await this.checkProjectHealth()
      } catch (error) {
        console.error('Project health check failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    // Meeting reminders (every 15 minutes)
    cron.schedule('*/15 * * * *', async () => {
      console.log('Running meeting reminder check...')
      try {
        await this.checkMeetingReminders()
      } catch (error) {
        console.error('Meeting reminder check failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    // Weekly reports (Mondays at 9:00 AM)
    cron.schedule('0 9 * * 1', async () => {
      console.log('Running weekly report generation...')
      try {
        await this.generateWeeklyReports()
      } catch (error) {
        console.error('Weekly report generation failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    // Monthly reports (1st of month at 9:00 AM)
    cron.schedule('0 9 1 * *', async () => {
      console.log('Running monthly report generation...')
      try {
        await this.generateMonthlyReports()
      } catch (error) {
        console.error('Monthly report generation failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    // Scheduled notifications (every minute)
    cron.schedule('* * * * *', async () => {
      try {
        await enhancedNotificationService.processScheduledNotifications()
      } catch (error) {
        console.error('Scheduled notifications processing failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    // Recurring notifications (every minute)
    cron.schedule('* * * * *', async () => {
      try {
        await enhancedNotificationService.processRecurringNotifications()
      } catch (error) {
        console.error('Recurring notifications processing failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    this.isRunning = true
    console.log('Enhanced notification cron jobs started')
  }

  // Process morning notifications
  private async processMorningNotifications(): Promise<void> {
    try {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, notification_preferences')
        .eq('notification_preferences->morning_notifications', true)

      if (!users) return

      for (const user of users) {
        try {
          await enhancedNotificationService.createNotification({
            userId: user.id,
            type: 'morning_notification' as any,
            title: 'Good Morning! Your Daily AI Summary',
            message: 'Here\'s your personalized project update and AI insights for today.',
            actionUrl: '/dashboard',
            metadata: {
              aiGenerated: true,
              generatedAt: new Date().toISOString()
            }
          })
        } catch (error) {
          console.error(`Failed to create morning notification for user ${user.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to process morning notifications:', error)
    }
  }

  // Process evening summaries
  private async processEveningSummaries(): Promise<void> {
    try {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, notification_preferences')
        .eq('notification_preferences->evening_summary', true)

      if (!users) return

      for (const user of users) {
        try {
          await enhancedNotificationService.createNotification({
            userId: user.id,
            type: 'evening_summary' as any,
            title: 'Evening Wrap-up',
            message: 'Review your day\'s accomplishments and plan for tomorrow.',
            actionUrl: '/dashboard',
            metadata: {
              aiGenerated: true,
              generatedAt: new Date().toISOString()
            }
          })
        } catch (error) {
          console.error(`Failed to create evening summary for user ${user.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to process evening summaries:', error)
    }
  }

  // Check task deadlines
  private async checkTaskDeadlines(): Promise<void> {
    try {
      const now = new Date()
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // Check for tasks due in the next hour
      const { data: urgentTasks } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          projects!inner(*)
        `)
        .gte('due_date', now.toISOString())
        .lte('due_date', oneHourFromNow.toISOString())
        .eq('status', 'todo')

      // Check for tasks due in the next 24 hours
      const { data: dueTasks } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          projects!inner(*)
        `)
        .gte('due_date', oneHourFromNow.toISOString())
        .lte('due_date', oneDayFromNow.toISOString())
        .eq('status', 'todo')

      // Check for overdue tasks
      const { data: overdueTasks } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          projects!inner(*)
        `)
        .lt('due_date', now.toISOString())
        .neq('status', 'completed')

      // Send notifications
      if (urgentTasks) {
        for (const task of urgentTasks) {
          await enhancedNotificationService.createTaskNotification(
            task.projects.owner_id,
            task,
            'task_due' as any
          )
        }
      }

      if (dueTasks) {
        for (const task of dueTasks) {
          await enhancedNotificationService.createTaskNotification(
            task.projects.owner_id,
            task,
            'task_due' as any
          )
        }
      }

      if (overdueTasks) {
        for (const task of overdueTasks) {
          await enhancedNotificationService.createTaskNotification(
            task.projects.owner_id,
            task,
            'task_overdue' as any
          )
        }
      }
    } catch (error) {
      console.error('Failed to check task deadlines:', error)
    }
  }

  // Check project health
  private async checkProjectHealth(): Promise<void> {
    try {
      const { data: projects } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('status', 'active')

      if (!projects) return

      for (const project of projects) {
        const now = new Date()
        const dueDate = new Date(project.due_date)
        const timeUntilDue = dueDate.getTime() - now.getTime()
        const daysUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24))

        // Check if project is at risk
        if (daysUntilDue <= 7 && project.progress < 50) {
          await enhancedNotificationService.createProjectNotification(
            project.owner_id,
            project,
            'project_at_risk' as any
          )
        }

        // Check if deadline is approaching
        if (daysUntilDue <= 3 && daysUntilDue > 0) {
          await enhancedNotificationService.createProjectNotification(
            project.owner_id,
            project,
            'project_deadline' as any
          )
        }
      }
    } catch (error) {
      console.error('Failed to check project health:', error)
    }
  }

  // Check meeting reminders
  private async checkMeetingReminders(): Promise<void> {
    try {
      const now = new Date()
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)

      const { data: meetings } = await supabaseAdmin
        .from('meetings')
        .select('*')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', fifteenMinutesFromNow.toISOString())

      if (!meetings) return

      for (const meeting of meetings) {
        await enhancedNotificationService.createMeetingNotification(
          'user_id_placeholder', // This would need to be properly mapped
          meeting,
          'meeting_reminder' as any
        )
      }
    } catch (error) {
      console.error('Failed to check meeting reminders:', error)
    }
  }

  // Generate weekly reports
  private async generateWeeklyReports(): Promise<void> {
    try {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, notification_preferences')
        .eq('notification_preferences->weekly_report', true)

      if (!users) return

      for (const user of users) {
        try {
          await enhancedNotificationService.createReportNotification(
            user.id,
            'weekly_report' as any,
            {
              period: 'week',
              generatedAt: new Date().toISOString()
            }
          )
        } catch (error) {
          console.error(`Failed to create weekly report for user ${user.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to generate weekly reports:', error)
    }
  }

  // Generate monthly reports
  private async generateMonthlyReports(): Promise<void> {
    try {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, notification_preferences')
        .eq('notification_preferences->monthly_report', true)

      if (!users) return

      for (const user of users) {
        try {
          await enhancedNotificationService.createReportNotification(
            user.id,
            'monthly_report' as any,
            {
              period: 'month',
              generatedAt: new Date().toISOString()
            }
          )
        } catch (error) {
          console.error(`Failed to create monthly report for user ${user.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to generate monthly reports:', error)
    }
  }

  // Stop all cron jobs
  stop(): void {
    // Note: node-cron doesn't have a destroy method, jobs are stopped by not scheduling new ones
    this.isRunning = false
    console.log('Enhanced notification cron jobs stopped')
  }

  // Get cron status
  getStatus(): { running: boolean } {
    return {
      running: this.isRunning
    }
  }
}

export const enhancedNotificationCron = EnhancedNotificationCron.getInstance()


