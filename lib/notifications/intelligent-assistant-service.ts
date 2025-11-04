import { supabaseAdmin } from '@/lib/supabase'
import Groq from 'groq-sdk'
import { Resend } from 'resend'
import { isTimeToSend, getCurrentTimeInTimezone } from '@/lib/utils/timezone-utils'
import { pushNotificationService } from '@/lib/services/push-notification-service'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

interface TimeOfDay {
  period: 'morning' | 'midday' | 'evening'
  greeting: string
  focus: string
}

export class IntelligentAssistantService {
  private static instance: IntelligentAssistantService

  static getInstance(): IntelligentAssistantService {
    if (!IntelligentAssistantService.instance) {
      IntelligentAssistantService.instance = new IntelligentAssistantService()
    }
    return IntelligentAssistantService.instance
  }

  // Get time-specific configuration
  private getTimeOfDayConfig(hour: number): TimeOfDay {
    if (hour >= 6 && hour < 12) {
      return {
        period: 'morning',
        greeting: 'Good morning',
        focus: 'Plan your day and prioritize your most important tasks'
      }
    } else if (hour >= 12 && hour < 17) {
      return {
        period: 'midday',
        greeting: 'Good afternoon',
        focus: 'Check your progress and adjust priorities for the rest of the day'
      }
    } else {
      return {
        period: 'evening',
        greeting: 'Good evening',
        focus: 'Review your accomplishments and prepare for tomorrow'
      }
    }
  }

  // Generate AI-powered assistant message
  async generateAssistantMessage(
    period: 'morning' | 'midday' | 'evening',
    userData: any
  ): Promise<string> {
    const { user, projects, tasks, meetings, insights, completedToday } = userData

    const prompt = this.buildAssistantPrompt(period, userData)

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an intelligent AI project management assistant. Your role is to help users stay on track with their tasks and projects. Be:
- Friendly and conversational (like a helpful colleague)
- Specific and actionable (reference actual tasks and projects)
- Encouraging but realistic
- Concise (2-3 sentences max)
- Personalized to the user's actual data

Time of day: ${period}
User's name: ${user.name}

Based on their current tasks and progress, provide ${period === 'morning' ? 'a motivating start-of-day message' : period === 'midday' ? 'a progress check and re-prioritization suggestion' : 'a reflection on the day and preparation for tomorrow'}.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 200
      })

      return completion.choices[0]?.message?.content || this.getFallbackMessage(period, userData)
    } catch (error) {
      console.error('Failed to generate AI assistant message:', error)
      return this.getFallbackMessage(period, userData)
    }
  }

  // Build context-rich prompt for AI
  private buildAssistantPrompt(period: string, userData: any): string {
    const { user, projects, tasks, meetings, insights, completedToday } = userData
    
    const urgentTasks = tasks.filter((t: any) => t.priority === 'urgent')
    const highTasks = tasks.filter((t: any) => t.priority === 'high')
    const overdueTasks = tasks.filter((t: any) => new Date(t.due_date) < new Date())

    let context = `User Context for ${period} update:\n\n`
    
    // Projects overview
    context += `Active Projects (${projects.length}):\n`
    projects.slice(0, 3).forEach((p: any) => {
      context += `- ${p.name} (${p.progress || 0}% complete)\n`
    })
    
    // Tasks overview
    context += `\nTasks:\n`
    context += `- ${urgentTasks.length} urgent\n`
    context += `- ${highTasks.length} high priority\n`
    context += `- ${overdueTasks.length} overdue\n`
    context += `- Total due today: ${tasks.length}\n`
    
    if (period === 'midday' || period === 'evening') {
      context += `- Completed today: ${completedToday}\n`
    }
    
    // Meetings
    if (meetings.length > 0) {
      context += `\nMeetings today: ${meetings.length}\n`
      meetings.forEach((m: any) => {
        context += `- ${m.title} at ${new Date(m.scheduled_at).toLocaleTimeString()}\n`
      })
    }
    
    // Recent AI insights
    if (insights.length > 0) {
      context += `\nRecent AI Insights:\n`
      insights.slice(0, 2).forEach((i: any) => {
        context += `- ${i.title}\n`
      })
    }

    // Specific guidance based on time
    if (period === 'morning') {
      context += `\nProvide a motivating message to start the day. Focus on the most important task they should tackle first.`
    } else if (period === 'midday') {
      context += `\nProvide a progress check. Acknowledge what they've completed and suggest adjusting priorities for the afternoon.`
    } else {
      context += `\nProvide an evening reflection. Celebrate what was accomplished and suggest light preparation for tomorrow.`
    }

    return context
  }

  // Fallback message if AI fails
  private getFallbackMessage(period: string, userData: any): string {
    const { user, tasks } = userData
    const urgentCount = tasks.filter((t: any) => t.priority === 'urgent').length

    if (period === 'morning') {
      return urgentCount > 0
        ? `${user.name}, you have ${urgentCount} urgent task${urgentCount > 1 ? 's' : ''} today. Let's tackle the most critical one first! 💪`
        : `${user.name}, you have ${tasks.length} task${tasks.length > 1 ? 's' : ''} on your plate today. Start with your highest priority and build momentum! 🚀`
    } else if (period === 'midday') {
      return `${user.name}, great progress! Take a moment to review what's left and adjust your priorities for the afternoon. 🎯`
    } else {
      return `${user.name}, time to wrap up! Review what you've accomplished today and set yourself up for success tomorrow. 🌟`
    }
  }

  // Get comprehensive user data for notifications
  async getUserDataForAssistant(userId: string): Promise<any> {
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
        .in('status', ['active', 'on_hold'])
        .order('updated_at', { ascending: false })
        .limit(5)

      // Get today's tasks - get all active tasks for user
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Get tasks - try both assignee_id and project owner_id
      const { data: tasks } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          projects(*)
        `)
        .or(`assignee_id.eq.${userId},projects.owner_id.eq.${userId}`)
        .neq('status', 'completed')
        .is('completed_at', null)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })
        .limit(20)
      
      console.log(`📋 Found ${tasks?.length || 0} active tasks for user`)

      // Get tasks completed today
      const { data: completedTasks } = await supabaseAdmin
        .from('tasks')
        .select('id, projects!inner(*)')
        .eq('projects.owner_id', userId)
        .gte('completed_at', today.toISOString())
        .lt('completed_at', tomorrow.toISOString())

      // Get today's meetings - try user_id first, but meetings might not have user_id
      const { data: meetings } = await supabaseAdmin
        .from('meetings')
        .select('*')
        .or(`user_id.eq.${userId},created_at.gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`)
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
        .order('scheduled_at', { ascending: true })
      
      console.log(`📋 Found ${meetings?.length || 0} meetings today for user`)

      // Get recent AI insights (last 3 days)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const { data: insights } = await supabaseAdmin
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', threeDaysAgo.toISOString())
        .order('priority', { ascending: false })
        .limit(5)

      return {
        user,
        projects: projects || [],
        tasks: tasks || [],
        meetings: meetings || [],
        insights: insights || [],
        completedToday: completedTasks?.length || 0
      }
    } catch (error) {
      console.error('Failed to get user data for assistant:', error)
      return null
    }
  }

  // Send intelligent notification (morning/midday/evening)
  async sendIntelligentNotification(userId: string, period: 'morning' | 'midday' | 'evening'): Promise<void> {
    try {
      console.log(`Generating ${period} notification for user ${userId}`)

      const userData = await this.getUserDataForAssistant(userId)
      if (!userData || !userData.user) {
        console.log(`No user data found for user ${userId}`)
        return
      }

      // Check if user has email notifications enabled
      // Default to enabled if not set (opt-out model)
      const prefs = userData.user.notification_preferences || {}
      const emailEnabled = prefs.email_daily_summary !== false
      const morningEnabled = prefs.morning_notifications !== false
      
      // For morning, need both enabled. For others, just email_daily_summary
      const shouldSend = period === 'morning' 
        ? (emailEnabled && morningEnabled)
        : emailEnabled
      
      if (!shouldSend) {
        console.log(`User ${userId} has ${period} notifications disabled`)
        return
      }

      // Generate AI assistant message
      const aiMessage = await this.generateAssistantMessage(period, userData)

      // Generate and send email
      const emailHTML = this.generateIntelligentEmailHTML(period, userData, aiMessage)
      
      const timeConfig = this.getTimeOfDayConfig(new Date().getHours())
      
      if (!userData.user.email) {
        console.error(`❌ No email address for user ${userId}`)
        return
      }
      
      // Check if push notifications are enabled
      const pushEnabled = prefs.push_notifications !== false
      
      // Send email notification
      if (emailEnabled) {
        console.log(`📧 Sending email to ${userData.user.email}...`)
        
        try {
          const emailResult = await resend.emails.send({
            from: 'AI ProjectHub <noreply@omarb.in>',
            to: [userData.user.email],
            subject: `${timeConfig.greeting}, ${userData.user.name}! 🤖 Your ${period} update`,
            html: emailHTML
          })
          console.log(`✅ Email sent successfully:`, emailResult)
        } catch (emailError) {
          console.error(`❌ Email sending failed:`, emailError)
          throw emailError
        }
      }

      // Send push notification if enabled
      if (pushEnabled) {
        try {
          console.log(`🔔 Sending push notification to user ${userId}...`)
          await pushNotificationService.sendIntelligentNotification(
            userId,
            period,
            aiMessage.substring(0, 200) // Truncate for push notification
          )
          console.log(`✅ Push notification sent successfully`)
        } catch (pushError) {
          console.error(`❌ Push notification failed (non-critical):`, pushError)
          // Don't throw - push notifications are optional
        }
      }

      // Create in-app notification
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: period === 'morning' ? 'morning_notification' : period === 'midday' ? 'smart_alert' : 'daily_summary',
        title: `${timeConfig.greeting}!`,
        message: aiMessage,
        action_url: '/dashboard',
        metadata: {
          priority: 'medium',
          category: 'daily',
          color: period === 'morning' ? '#3b82f6' : period === 'midday' ? '#f59e0b' : '#8b5cf6',
          actionable: true,
          aiGenerated: true,
          period
        },
        sent_at: new Date().toISOString()
      })

      console.log(`✅ ${period} notification sent successfully to user ${userId}`)
    } catch (error) {
      console.error(`Failed to send ${period} notification for user ${userId}:`, error)
      throw error
    }
  }

  // Generate beautiful HTML email
  private generateIntelligentEmailHTML(
    period: string,
    userData: any,
    aiMessage: string
  ): string {
    const { user, projects, tasks, meetings, insights, completedToday } = userData
    const timeConfig = this.getTimeOfDayConfig(new Date().getHours())
    
    const urgentTasks = tasks.filter((t: any) => t.priority === 'urgent')
    const highTasks = tasks.filter((t: any) => t.priority === 'high')
    
    // Color scheme based on time of day
    const colorScheme = {
      morning: { primary: '#3b82f6', secondary: '#60a5fa', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
      midday: { primary: '#f59e0b', secondary: '#fbbf24', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
      evening: { primary: '#8b5cf6', secondary: '#a78bfa', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
    }[period]

    const emoji = {
      morning: '☀️',
      midday: '⚡',
      evening: '🌙'
    }[period]

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
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header { 
            background: ${colorScheme.gradient};
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 0;
            opacity: 0.95;
            font-size: 16px;
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
          .section { 
            margin-bottom: 30px; 
          }
          .section-title { 
            color: ${colorScheme.primary};
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .metrics {
            display: flex;
            gap: 15px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          .metric { 
            flex: 1;
            min-width: 140px;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .metric-value { 
            font-size: 32px;
            font-weight: 800;
            color: ${colorScheme.primary};
            display: block;
            margin-bottom: 5px;
          }
          .metric-label { 
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .task-item { 
            padding: 15px;
            margin-bottom: 10px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 3px solid ${colorScheme.primary};
            transition: transform 0.2s;
          }
          .task-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
          }
          .task-meta {
            font-size: 13px;
            color: #6b7280;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
          }
          .priority-urgent { border-left-color: #ef4444; }
          .priority-high { border-left-color: #f59e0b; }
          .priority-medium { border-left-color: #3b82f6; }
          .priority-low { border-left-color: #10b981; }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .badge-urgent { background: #fee2e2; color: #dc2626; }
          .badge-high { background: #fef3c7; color: #d97706; }
          .badge-medium { background: #dbeafe; color: #2563eb; }
          .badge-low { background: #d1fae5; color: #059669; }
          .cta-button { 
            display: inline-block;
            padding: 14px 28px;
            background: ${colorScheme.primary};
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: background 0.3s;
          }
          .cta-button:hover {
            background: ${colorScheme.secondary};
          }
          .footer { 
            background: #f8fafc;
            padding: 25px;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            line-height: 1.8;
          }
          .footer a {
            color: ${colorScheme.primary};
            text-decoration: none;
          }
          .empty-state {
            text-align: center;
            padding: 30px;
            color: #9ca3af;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} ${timeConfig.greeting}, ${user.name}!</h1>
            <p>Your intelligent ${period} update from AI ProjectHub</p>
          </div>
          
          <div class="ai-message">
            ${aiMessage}
          </div>

          <div class="content">
            <!-- Metrics Overview -->
            <div class="section">
              <div class="section-title">📊 Your Dashboard</div>
              <div class="metrics">
                <div class="metric">
                  <span class="metric-value">${projects.length}</span>
                  <span class="metric-label">Active Projects</span>
                </div>
                <div class="metric">
                  <span class="metric-value">${tasks.length}</span>
                  <span class="metric-label">Tasks Due Today</span>
                </div>
                <div class="metric">
                  <span class="metric-value">${meetings.length}</span>
                  <span class="metric-label">Meetings Today</span>
                </div>
                ${period !== 'morning' ? `
                <div class="metric">
                  <span class="metric-value">${completedToday}</span>
                  <span class="metric-label">Completed Today</span>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Urgent & High Priority Tasks -->
            ${urgentTasks.length > 0 || highTasks.length > 0 ? `
            <div class="section">
              <div class="section-title">🎯 Priority Tasks</div>
              ${urgentTasks.slice(0, 3).map((task: any) => `
                <div class="task-item priority-urgent">
                  <div class="task-title">
                    <span class="badge badge-urgent">Urgent</span>
                    ${task.title}
                  </div>
                  <div class="task-meta">
                    <span>⏰ ${new Date(task.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    ${task.projects?.name ? `<span>📁 ${task.projects.name}</span>` : ''}
                  </div>
                </div>
              `).join('')}
              ${highTasks.slice(0, 2).map((task: any) => `
                <div class="task-item priority-high">
                  <div class="task-title">
                    <span class="badge badge-high">High</span>
                    ${task.title}
                  </div>
                  <div class="task-meta">
                    <span>⏰ ${new Date(task.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    ${task.projects?.name ? `<span>📁 ${task.projects.name}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Meetings -->
            ${meetings.length > 0 ? `
            <div class="section">
              <div class="section-title">📅 Today's Meetings</div>
              ${meetings.map((meeting: any) => `
                <div class="task-item">
                  <div class="task-title">${meeting.title}</div>
                  <div class="task-meta">
                    <span>🕐 ${new Date(meeting.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    ${meeting.duration ? `<span>⏱️ ${meeting.duration} min</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- AI Insights -->
            ${insights.length > 0 ? `
            <div class="section">
              <div class="section-title">💡 AI Insights</div>
              ${insights.slice(0, 3).map((insight: any) => `
                <div class="task-item">
                  <div class="task-title">${insight.title}</div>
                  <div class="task-meta">
                    <span>${insight.description}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- CTA -->
            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
                Open AI ProjectHub →
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>AI ProjectHub</strong> – Your intelligent project management assistant</p>
            <p>This ${period} update was personally crafted by AI based on your current tasks and projects.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings">Manage notification preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Process all users for a specific time period
  async processNotificationsForPeriod(period: 'morning' | 'midday' | 'evening'): Promise<void> {
    try {
      console.log(`🤖 Starting ${period} notification processing...`)
      
      // Get all users with notifications enabled (including timezone)
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, name, timezone, notification_preferences')

      if (!users || users.length === 0) {
        console.log('No users found')
        return
      }

      console.log(`Processing ${period} notifications for ${users.length} users`)

      // Filter users who should receive notifications BEFORE processing
      const usersToNotify = users.filter(user => {
        // Check if user has email notifications enabled
        // Default to true if not set (users should receive notifications by default)
        const prefs = user.notification_preferences || {}
        const emailEnabled = prefs.email_daily_summary !== false
        const morningEnabled = prefs.morning_notifications !== false
        
        // For morning period, check morning_notifications specifically
        // For other periods, check email_daily_summary
        const shouldSendByPrefs = period === 'morning' 
          ? (emailEnabled && morningEnabled)
          : emailEnabled
        
        if (!shouldSendByPrefs) {
          console.log(`⏭️ Skipping ${period} notification for ${user.email} (notifications disabled)`)
          return false
        }

        // 🌍 TIMEZONE CHECK: Only send if it's the right time in user's timezone
        const userTimezone = user.timezone || 'UTC'
        
        // Default notification times (can be customized per user later)
        let desiredHour: number
        let desiredMinute: number = 0
        
        if (period === 'morning') {
          desiredHour = parseInt(prefs.morning_notification_time?.split(':')[0] || '8', 10)
          desiredMinute = parseInt(prefs.morning_notification_time?.split(':')[1] || '0', 10)
        } else if (period === 'midday') {
          desiredHour = 13 // 1 PM
        } else {
          desiredHour = 18 // 6 PM
        }

        // Check if it's time to send for this user's timezone
        if (!isTimeToSend(userTimezone, desiredHour, desiredMinute)) {
          const currentTime = getCurrentTimeInTimezone(userTimezone)
          console.log(`⏰ Skipping ${period} notification for ${user.email} - not yet time in ${userTimezone} (current: ${currentTime.hour}:${currentTime.minute.toString().padStart(2, '0')}, desired: ${desiredHour}:${desiredMinute.toString().padStart(2, '0')})`)
          return false
        }

        console.log(`📧 Will send ${period} notification to ${user.email}`)
        return true
      })

      console.log(`Sending notifications to ${usersToNotify.length} users (filtered from ${users.length} total)`)

      // 🚀 PARALLEL PROCESSING: Process all users at once (much faster!)
      // This allows us to stay within Vercel's 10-second free tier limit
      const results = await Promise.allSettled(
        usersToNotify.map(user => this.sendIntelligentNotification(user.id, period))
      )

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const errorCount = results.filter(r => r.status === 'rejected').length

      // Log any errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to process ${period} notification for user ${usersToNotify[index].id}:`, result.reason)
        }
      })

      console.log(`✅ ${period} notification processing completed: ${successCount} sent, ${errorCount} failed`)
    } catch (error) {
      console.error(`Failed to process ${period} notifications:`, error)
      throw error
    }
  }
}

export const intelligentAssistant = IntelligentAssistantService.getInstance()



