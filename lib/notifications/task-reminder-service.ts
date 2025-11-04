import { supabaseAdmin } from '@/lib/supabase'
import Groq from 'groq-sdk'
import { Resend } from 'resend'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

interface Task {
  id: string
  title: string
  description: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  due_date: string
  status: string
  project_id: string
  projects?: {
    id: string
    name: string
    owner_id: string
  }
}

interface User {
  id: string
  email: string
  name: string
  notification_preferences: any
}

export class TaskReminderService {
  private static instance: TaskReminderService

  static getInstance(): TaskReminderService {
    if (!TaskReminderService.instance) {
      TaskReminderService.instance = new TaskReminderService()
    }
    return TaskReminderService.instance
  }

  // Get tasks due within a specific time window
  async getTasksDueInTimeWindow(
    startMinutes: number,
    endMinutes: number
  ): Promise<Task[]> {
    const now = new Date()
    const startTime = new Date(now.getTime() + startMinutes * 60000)
    const endTime = new Date(now.getTime() + endMinutes * 60000)

    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        projects!inner(
          id,
          name,
          owner_id
        )
      `)
      .gte('due_date', startTime.toISOString())
      .lt('due_date', endTime.toISOString())
      .neq('status', 'completed')
      .is('completed_at', null)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      return []
    }

    return tasks || []
  }

  // Get overdue tasks
  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date()

    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        projects!inner(
          id,
          name,
          owner_id
        )
      `)
      .lt('due_date', now.toISOString())
      .neq('status', 'completed')
      .is('completed_at', null)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching overdue tasks:', error)
      return []
    }

    return tasks || []
  }

  // Generate AI reminder message
  async generateReminderMessage(
    task: Task,
    reminderType: '1hour' | '1day' | 'overdue',
    user: User
  ): Promise<string> {
    try {
      const urgencyMap = {
        '1hour': 'in 1 hour',
        '1day': 'tomorrow',
        'overdue': 'overdue'
      }

      const prompt = `You are an AI assistant helping ${user.name} stay on top of their tasks.

Task: ${task.title}
Priority: ${task.priority}
Due: ${urgencyMap[reminderType]}
Project: ${task.projects?.name || 'No project'}

Generate a brief, helpful reminder message (1-2 sentences max) that:
- Is friendly but urgent for ${reminderType === '1hour' ? 'immediate' : reminderType === 'overdue' ? 'overdue' : 'upcoming'} deadlines
- References the specific task
- ${reminderType === 'overdue' ? 'Encourages immediate action without being judgmental' : 'Helps them prepare'}
- Is personalized and motivating

Don't include emojis. Be direct and helpful.`

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful, concise AI assistant for task management. Keep messages brief and actionable.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 150
      })

      return completion.choices[0]?.message?.content || this.getFallbackMessage(task, reminderType, user)
    } catch (error) {
      console.error('Failed to generate AI reminder:', error)
      return this.getFallbackMessage(task, reminderType, user)
    }
  }

  // Fallback message if AI fails
  private getFallbackMessage(
    task: Task,
    reminderType: '1hour' | '1day' | 'overdue',
    user: User
  ): string {
    const messages = {
      '1hour': `${user.name}, "${task.title}" is due in 1 hour! This is a ${task.priority} priority task. Time to wrap it up!`,
      '1day': `${user.name}, reminder that "${task.title}" is due tomorrow. This ${task.priority} priority task needs your attention soon.`,
      'overdue': `${user.name}, "${task.title}" is now overdue. Let's get this ${task.priority} priority task back on track today.`
    }
    return messages[reminderType]
  }

  // Generate reminder email HTML
  private generateReminderEmailHTML(
    task: Task,
    reminderType: '1hour' | '1day' | 'overdue',
    aiMessage: string,
    user: User
  ): string {
    const now = new Date()
    const dueDate = new Date(task.due_date)
    const hoursUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    const colorScheme = {
      '1hour': { 
        primary: '#ef4444', 
        secondary: '#dc2626', 
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        emoji: '🔴',
        urgency: 'URGENT'
      },
      '1day': { 
        primary: '#f59e0b', 
        secondary: '#d97706', 
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        emoji: '🟠',
        urgency: 'DUE SOON'
      },
      'overdue': { 
        primary: '#dc2626', 
        secondary: '#991b1b', 
        gradient: 'linear-gradient(135deg, #dc2626, #991b1b)',
        emoji: '🚨',
        urgency: 'OVERDUE'
      }
    }[reminderType]

    const priorityBadges = {
      urgent: { bg: '#fee2e2', color: '#dc2626', label: 'URGENT' },
      high: { bg: '#fef3c7', color: '#d97706', label: 'HIGH' },
      medium: { bg: '#dbeafe', color: '#2563eb', label: 'MEDIUM' },
      low: { bg: '#d1fae5', color: '#059669', label: 'LOW' }
    }

    const priorityStyle = priorityBadges[task.priority]

    const timeDisplay = reminderType === 'overdue' 
      ? `Overdue by ${Math.abs(hoursUntilDue)} hours`
      : reminderType === '1hour'
      ? 'Due in 1 hour'
      : 'Due tomorrow'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #1f2937; 
            background: #f9fafb;
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: ${colorScheme.gradient};
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
            font-weight: 700;
          }
          .header p {
            margin: 0;
            opacity: 0.95;
            font-size: 18px;
          }
          .urgency-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
            margin-top: 10px;
            letter-spacing: 1px;
          }
          .ai-message {
            background: linear-gradient(135deg, ${colorScheme.primary}15, ${colorScheme.secondary}15);
            border-left: 4px solid ${colorScheme.primary};
            padding: 20px;
            margin: 30px;
            border-radius: 8px;
            font-size: 16px;
            line-height: 1.7;
            color: #374151;
          }
          .ai-message::before {
            content: '🤖';
            font-size: 24px;
            display: block;
            margin-bottom: 10px;
          }
          .content { 
            padding: 30px; 
          }
          .task-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            border: 2px solid ${colorScheme.primary};
          }
          .task-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
          }
          .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            background: ${priorityStyle.bg};
            color: ${priorityStyle.color};
          }
          .task-title {
            font-size: 22px;
            font-weight: 700;
            color: #1f2937;
            margin: 10px 0;
          }
          .task-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #6b7280;
          }
          .meta-icon {
            font-size: 18px;
          }
          .time-warning {
            background: ${colorScheme.gradient};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
            font-size: 18px;
            margin: 20px 0;
          }
          .cta-button { 
            display: inline-block;
            padding: 16px 32px;
            background: ${colorScheme.primary};
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background 0.3s;
            text-align: center;
          }
          .cta-button:hover {
            background: ${colorScheme.secondary};
          }
          .cta-section {
            text-align: center;
            margin: 30px 0;
          }
          .footer { 
            background: #f8fafc;
            padding: 25px;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            line-height: 1.8;
          }
          .description {
            color: #4b5563;
            font-size: 15px;
            line-height: 1.6;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${colorScheme.emoji} Task Reminder</h1>
            <p>${timeDisplay}</p>
            <div class="urgency-badge">${colorScheme.urgency}</div>
          </div>
          
          <div class="ai-message">
            ${aiMessage}
          </div>

          <div class="content">
            <div class="task-card">
              <div class="task-header">
                <span class="priority-badge">${priorityStyle.label}</span>
              </div>
              
              <div class="task-title">${task.title}</div>
              
              ${task.description ? `
                <div class="description">${task.description}</div>
              ` : ''}

              <div class="task-meta">
                <div class="meta-item">
                  <span class="meta-icon">⏰</span>
                  <span><strong>Due:</strong> ${dueDate.toLocaleString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}</span>
                </div>
                
                ${task.projects ? `
                  <div class="meta-item">
                    <span class="meta-icon">📁</span>
                    <span><strong>Project:</strong> ${task.projects.name}</span>
                  </div>
                ` : ''}
                
                <div class="meta-item">
                  <span class="meta-icon">🎯</span>
                  <span><strong>Priority:</strong> ${task.priority}</span>
                </div>
              </div>
            </div>

            <div class="time-warning">
              ${reminderType === '1hour' ? '⏰ Less than 1 hour remaining!' :
                reminderType === '1day' ? '📅 Due tomorrow - plan your time!' :
                '🚨 This task is overdue - let\'s complete it today!'}
            </div>

            <div class="cta-section">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" class="cta-button">
                ${reminderType === 'overdue' ? '🚀 Complete Task Now' : '✅ View Task'}
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>AI ProjectHub</strong> – Keeping you on track</p>
            <p>This reminder was sent to help you meet your deadlines.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: ${colorScheme.primary};">Manage notification preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Send reminder for a specific task
  async sendTaskReminder(
    task: Task,
    reminderType: '1hour' | '1day' | 'overdue'
  ): Promise<void> {
    try {
      // Get task owner
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, notification_preferences')
        .eq('id', task.projects?.owner_id)
        .single()

      if (userError || !user) {
        console.log(`User not found for task ${task.id}`)
        return
      }

      // Check notification preferences
      // Default to enabled if not set (opt-out model)
      const prefs = user.notification_preferences || {}
      const reminderPrefs = prefs.reminder_timing || {}
      
      // Check if this type of reminder is explicitly disabled
      if (reminderType === '1hour' && reminderPrefs.task_1hour === false) {
        console.log(`1-hour reminders disabled for user ${user.id}`)
        return
      }
      if (reminderType === '1day' && reminderPrefs.task_1day === false) {
        console.log(`1-day reminders disabled for user ${user.id}`)
        return
      }
      
      // Check if task reminders are enabled (default to true)
      const taskRemindersEnabled = prefs.task_reminders !== false
      const emailEnabled = prefs.email_daily_summary !== false
      
      if (!taskRemindersEnabled && !emailEnabled) {
        console.log(`Task reminders disabled for user ${user.id}`)
        return
      }

      console.log(`Sending ${reminderType} reminder for task: ${task.title}`)

      // Generate AI message
      const aiMessage = await this.generateReminderMessage(task, reminderType, user)

      // Generate email HTML
      const emailHTML = this.generateReminderEmailHTML(task, reminderType, aiMessage, user)

      // Send email
      const subject = {
        '1hour': `🔴 URGENT: "${task.title}" due in 1 hour!`,
        '1day': `🟠 Reminder: "${task.title}" due tomorrow`,
        'overdue': `🚨 OVERDUE: "${task.title}" needs attention`
      }[reminderType]

      await resend.emails.send({
        from: 'AI ProjectHub <noreply@omarb.in>',
        to: [user.email],
        subject,
        html: emailHTML
      })

      // Create in-app notification
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        type: 'task_reminder',
        title: subject,
        message: aiMessage,
        action_url: `/tasks`,
        metadata: {
          task_id: task.id,
          reminder_type: reminderType,
          priority: task.priority,
          due_date: task.due_date,
          aiGenerated: true
        },
        sent_at: new Date().toISOString()
      })

      console.log(`✅ Reminder sent for task: ${task.title}`)
    } catch (error) {
      console.error(`Failed to send reminder for task ${task.id}:`, error)
    }
  }

  // Process 1-hour deadline reminders
  async processOneHourReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for tasks due in 1 hour...')
      
      // Get tasks due between 55-65 minutes from now (to catch tasks in hourly window)
      const tasks = await this.getTasksDueInTimeWindow(55, 65)
      
      console.log(`Found ${tasks.length} tasks due in ~1 hour`)

      // 🚀 PARALLEL PROCESSING: Process all tasks at once (faster!)
      const results = await Promise.allSettled(
        tasks.map(task => this.sendTaskReminder(task, '1hour'))
      )

      const successCount = results.filter(r => r.status === 'fulfilled').length
      const errorCount = results.filter(r => r.status === 'rejected').length

      console.log(`✅ Processed ${tasks.length} 1-hour reminders: ${successCount} sent, ${errorCount} failed`)
    } catch (error) {
      console.error('Failed to process 1-hour reminders:', error)
      throw error
    }
  }

  // Alias for processOneHourReminders (for cron job compatibility)
  async processHourlyReminders(): Promise<void> {
    return this.processOneHourReminders()
  }

  // Process 1-day deadline reminders
  async processOneDayReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for tasks due in 1 day...')
      
      // Get tasks due between 23-25 hours from now
      const tasks = await this.getTasksDueInTimeWindow(23 * 60, 25 * 60)
      
      console.log(`Found ${tasks.length} tasks due tomorrow`)

      // 🚀 PARALLEL PROCESSING: Process all tasks at once (faster!)
      const results = await Promise.allSettled(
        tasks.map(task => this.sendTaskReminder(task, '1day'))
      )

      const successCount = results.filter(r => r.status === 'fulfilled').length
      const errorCount = results.filter(r => r.status === 'rejected').length

      console.log(`✅ Processed ${tasks.length} 1-day reminders: ${successCount} sent, ${errorCount} failed`)
    } catch (error) {
      console.error('Failed to process 1-day reminders:', error)
      throw error
    }
  }

  // Alias for processOneDayReminders (for cron job compatibility)
  async processDailyReminders(): Promise<void> {
    return this.processOneDayReminders()
  }

  // Process overdue task alerts
  async processOverdueAlerts(): Promise<void> {
    try {
      console.log('🔍 Checking for overdue tasks...')
      
      const tasks = await this.getOverdueTasks()
      
      console.log(`Found ${tasks.length} overdue tasks`)

      // Group by user to send one summary email per user
      const tasksByUser = tasks.reduce((acc, task) => {
        const userId = task.projects?.owner_id
        if (userId) {
          if (!acc[userId]) acc[userId] = []
          acc[userId].push(task)
        }
        return acc
      }, {} as Record<string, Task[]>)

      // 🚀 PARALLEL PROCESSING: Process all tasks at once (faster!)
      const allTasksToProcess: Task[] = []
      for (const [userId, userTasks] of Object.entries(tasksByUser)) {
        // Limit to 5 per user to avoid spam
        allTasksToProcess.push(...userTasks.slice(0, 5))
      }

      const results = await Promise.allSettled(
        allTasksToProcess.map(task => this.sendTaskReminder(task, 'overdue'))
      )

      const successCount = results.filter(r => r.status === 'fulfilled').length
      const errorCount = results.filter(r => r.status === 'rejected').length

      console.log(`✅ Processed overdue alerts for ${Object.keys(tasksByUser).length} users: ${successCount} sent, ${errorCount} failed`)
    } catch (error) {
      console.error('Failed to process overdue alerts:', error)
      throw error
    }
  }
}

export const taskReminderService = TaskReminderService.getInstance()

