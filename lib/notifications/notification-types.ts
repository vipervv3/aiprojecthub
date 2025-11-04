export enum NotificationType {
  // Daily notifications
  MORNING_NOTIFICATION = 'morning_notification',
  EVENING_SUMMARY = 'evening_summary',
  DAILY_DIGEST = 'daily_digest',
  
  // Task-related notifications
  TASK_DUE = 'task_due',
  TASK_OVERDUE = 'task_overdue',
  TASK_COMPLETED = 'task_completed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_PRIORITY_CHANGED = 'task_priority_changed',
  
  // Project notifications
  PROJECT_UPDATE = 'project_update',
  PROJECT_DEADLINE = 'project_deadline',
  PROJECT_COMPLETED = 'project_completed',
  PROJECT_AT_RISK = 'project_at_risk',
  PROJECT_MILESTONE = 'project_milestone',
  
  // Meeting notifications
  MEETING_REMINDER = 'meeting_reminder',
  MEETING_STARTING = 'meeting_starting',
  MEETING_COMPLETED = 'meeting_completed',
  MEETING_CANCELLED = 'meeting_cancelled',
  
  // AI-powered notifications
  AI_INSIGHT = 'ai_insight',
  AI_RECOMMENDATION = 'ai_recommendation',
  AI_ALERT = 'ai_alert',
  SMART_ALERT = 'smart_alert',
  
  // Team notifications
  TEAM_INVITE = 'team_invite',
  TEAM_UPDATE = 'team_update',
  COLLABORATION_REQUEST = 'collaboration_request',
  
  // System notifications
  SYSTEM_UPDATE = 'system_update',
  MAINTENANCE_NOTICE = 'maintenance_notice',
  SECURITY_ALERT = 'security_alert',
  
  // Weekly/Monthly reports
  WEEKLY_REPORT = 'weekly_report',
  MONTHLY_REPORT = 'monthly_report',
  PRODUCTIVITY_REPORT = 'productivity_report',
  
  // Custom notifications
  CUSTOM_REMINDER = 'custom_reminder',
  GOAL_REMINDER = 'goal_reminder',
  HABIT_REMINDER = 'habit_reminder'
}

export interface NotificationTemplate {
  type: NotificationType
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionable: boolean
  category: 'task' | 'project' | 'meeting' | 'ai' | 'team' | 'system' | 'report'
  icon: string
  color: string
  defaultSchedule?: {
    time?: string
    frequency?: 'daily' | 'weekly' | 'monthly' | 'custom'
    days?: number[]
  }
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  // Daily notifications
  [NotificationType.MORNING_NOTIFICATION]: {
    type: NotificationType.MORNING_NOTIFICATION,
    title: 'Good Morning! Your Daily AI Summary',
    message: 'Here\'s your personalized project update and AI insights for today.',
    priority: 'medium',
    actionable: true,
    category: 'ai',
    icon: '🌅',
    color: 'blue',
    defaultSchedule: { time: '08:00', frequency: 'daily' }
  },
  
  [NotificationType.EVENING_SUMMARY]: {
    type: NotificationType.EVENING_SUMMARY,
    title: 'Evening Wrap-up',
    message: 'Review your day\'s accomplishments and plan for tomorrow.',
    priority: 'low',
    actionable: true,
    category: 'report',
    icon: '🌙',
    color: 'purple',
    defaultSchedule: { time: '18:00', frequency: 'daily' }
  },
  
  [NotificationType.DAILY_DIGEST]: {
    type: NotificationType.DAILY_DIGEST,
    title: 'Daily Project Digest',
    message: 'Summary of all project activities and team updates.',
    priority: 'medium',
    actionable: true,
    category: 'report',
    icon: '📊',
    color: 'green',
    defaultSchedule: { time: '17:00', frequency: 'daily' }
  },

  // Task notifications
  [NotificationType.TASK_DUE]: {
    type: NotificationType.TASK_DUE,
    title: 'Task Due Soon',
    message: 'You have tasks approaching their due date.',
    priority: 'high',
    actionable: true,
    category: 'task',
    icon: '⏰',
    color: 'orange'
  },
  
  [NotificationType.TASK_OVERDUE]: {
    type: NotificationType.TASK_OVERDUE,
    title: 'Overdue Task Alert',
    message: 'You have overdue tasks that need immediate attention.',
    priority: 'urgent',
    actionable: true,
    category: 'task',
    icon: '🚨',
    color: 'red'
  },
  
  [NotificationType.TASK_COMPLETED]: {
    type: NotificationType.TASK_COMPLETED,
    title: 'Task Completed',
    message: 'Great job! You\'ve completed a task.',
    priority: 'low',
    actionable: false,
    category: 'task',
    icon: '✅',
    color: 'green'
  },
  
  [NotificationType.TASK_ASSIGNED]: {
    type: NotificationType.TASK_ASSIGNED,
    title: 'New Task Assigned',
    message: 'You\'ve been assigned a new task.',
    priority: 'medium',
    actionable: true,
    category: 'task',
    icon: '📋',
    color: 'blue'
  },
  
  [NotificationType.TASK_PRIORITY_CHANGED]: {
    type: NotificationType.TASK_PRIORITY_CHANGED,
    title: 'Task Priority Updated',
    message: 'The priority of one of your tasks has been changed.',
    priority: 'medium',
    actionable: true,
    category: 'task',
    icon: '⚡',
    color: 'yellow'
  },

  // Project notifications
  [NotificationType.PROJECT_UPDATE]: {
    type: NotificationType.PROJECT_UPDATE,
    title: 'Project Update',
    message: 'There\'s been an update to one of your projects.',
    priority: 'medium',
    actionable: true,
    category: 'project',
    icon: '📁',
    color: 'blue'
  },
  
  [NotificationType.PROJECT_DEADLINE]: {
    type: NotificationType.PROJECT_DEADLINE,
    title: 'Project Deadline Approaching',
    message: 'A project deadline is coming up soon.',
    priority: 'high',
    actionable: true,
    category: 'project',
    icon: '📅',
    color: 'orange'
  },
  
  [NotificationType.PROJECT_COMPLETED]: {
    type: NotificationType.PROJECT_COMPLETED,
    title: 'Project Completed',
    message: 'Congratulations! A project has been completed.',
    priority: 'low',
    actionable: false,
    category: 'project',
    icon: '🎉',
    color: 'green'
  },
  
  [NotificationType.PROJECT_AT_RISK]: {
    type: NotificationType.PROJECT_AT_RISK,
    title: 'Project at Risk',
    message: 'A project may be at risk of missing its deadline.',
    priority: 'urgent',
    actionable: true,
    category: 'project',
    icon: '⚠️',
    color: 'red'
  },
  
  [NotificationType.PROJECT_MILESTONE]: {
    type: NotificationType.PROJECT_MILESTONE,
    title: 'Project Milestone Reached',
    message: 'A project milestone has been achieved.',
    priority: 'medium',
    actionable: true,
    category: 'project',
    icon: '🏆',
    color: 'purple'
  },

  // Meeting notifications
  [NotificationType.MEETING_REMINDER]: {
    type: NotificationType.MEETING_REMINDER,
    title: 'Meeting Reminder',
    message: 'You have a meeting scheduled soon.',
    priority: 'medium',
    actionable: true,
    category: 'meeting',
    icon: '📅',
    color: 'blue'
  },
  
  [NotificationType.MEETING_STARTING]: {
    type: NotificationType.MEETING_STARTING,
    title: 'Meeting Starting Now',
    message: 'Your meeting is starting right now.',
    priority: 'high',
    actionable: true,
    category: 'meeting',
    icon: '🔔',
    color: 'orange'
  },
  
  [NotificationType.MEETING_COMPLETED]: {
    type: NotificationType.MEETING_COMPLETED,
    title: 'Meeting Completed',
    message: 'Your meeting has ended. Review the summary and action items.',
    priority: 'medium',
    actionable: true,
    category: 'meeting',
    icon: '✅',
    color: 'green'
  },
  
  [NotificationType.MEETING_CANCELLED]: {
    type: NotificationType.MEETING_CANCELLED,
    title: 'Meeting Cancelled',
    message: 'A scheduled meeting has been cancelled.',
    priority: 'medium',
    actionable: true,
    category: 'meeting',
    icon: '❌',
    color: 'gray'
  },

  // AI notifications
  [NotificationType.AI_INSIGHT]: {
    type: NotificationType.AI_INSIGHT,
    title: 'AI Insight Available',
    message: 'New AI-powered insights are available for your projects.',
    priority: 'medium',
    actionable: true,
    category: 'ai',
    icon: '🤖',
    color: 'purple'
  },
  
  [NotificationType.AI_RECOMMENDATION]: {
    type: NotificationType.AI_RECOMMENDATION,
    title: 'AI Recommendation',
    message: 'AI has a new recommendation to improve your productivity.',
    priority: 'medium',
    actionable: true,
    category: 'ai',
    icon: '💡',
    color: 'yellow'
  },
  
  [NotificationType.AI_ALERT]: {
    type: NotificationType.AI_ALERT,
    title: 'AI Alert',
    message: 'AI has detected an important pattern or issue.',
    priority: 'high',
    actionable: true,
    category: 'ai',
    icon: '🚨',
    color: 'red'
  },
  
  [NotificationType.SMART_ALERT]: {
    type: NotificationType.SMART_ALERT,
    title: 'Smart Alert',
    message: 'Intelligent alert based on your work patterns.',
    priority: 'medium',
    actionable: true,
    category: 'ai',
    icon: '🧠',
    color: 'blue'
  },

  // Team notifications
  [NotificationType.TEAM_INVITE]: {
    type: NotificationType.TEAM_INVITE,
    title: 'Team Invitation',
    message: 'You\'ve been invited to join a team.',
    priority: 'medium',
    actionable: true,
    category: 'team',
    icon: '👥',
    color: 'blue'
  },
  
  [NotificationType.TEAM_UPDATE]: {
    type: NotificationType.TEAM_UPDATE,
    title: 'Team Update',
    message: 'There\'s an update from your team.',
    priority: 'medium',
    actionable: true,
    category: 'team',
    icon: '👥',
    color: 'green'
  },
  
  [NotificationType.COLLABORATION_REQUEST]: {
    type: NotificationType.COLLABORATION_REQUEST,
    title: 'Collaboration Request',
    message: 'Someone wants to collaborate on a project.',
    priority: 'medium',
    actionable: true,
    category: 'team',
    icon: '🤝',
    color: 'purple'
  },

  // System notifications
  [NotificationType.SYSTEM_UPDATE]: {
    type: NotificationType.SYSTEM_UPDATE,
    title: 'System Update',
    message: 'The system has been updated with new features.',
    priority: 'low',
    actionable: true,
    category: 'system',
    icon: '🔄',
    color: 'blue'
  },
  
  [NotificationType.MAINTENANCE_NOTICE]: {
    type: NotificationType.MAINTENANCE_NOTICE,
    title: 'Maintenance Notice',
    message: 'Scheduled maintenance will occur soon.',
    priority: 'medium',
    actionable: true,
    category: 'system',
    icon: '🔧',
    color: 'orange'
  },
  
  [NotificationType.SECURITY_ALERT]: {
    type: NotificationType.SECURITY_ALERT,
    title: 'Security Alert',
    message: 'Important security information for your account.',
    priority: 'urgent',
    actionable: true,
    category: 'system',
    icon: '🔒',
    color: 'red'
  },

  // Report notifications
  [NotificationType.WEEKLY_REPORT]: {
    type: NotificationType.WEEKLY_REPORT,
    title: 'Weekly Report',
    message: 'Your weekly productivity and project report is ready.',
    priority: 'low',
    actionable: true,
    category: 'report',
    icon: '📈',
    color: 'green',
    defaultSchedule: { time: '09:00', frequency: 'weekly', days: [1] }
  },
  
  [NotificationType.MONTHLY_REPORT]: {
    type: NotificationType.MONTHLY_REPORT,
    title: 'Monthly Report',
    message: 'Your monthly project and productivity summary is available.',
    priority: 'low',
    actionable: true,
    category: 'report',
    icon: '📊',
    color: 'blue',
    defaultSchedule: { time: '09:00', frequency: 'monthly', days: [1] }
  },
  
  [NotificationType.PRODUCTIVITY_REPORT]: {
    type: NotificationType.PRODUCTIVITY_REPORT,
    title: 'Productivity Report',
    message: 'AI-generated productivity insights and recommendations.',
    priority: 'medium',
    actionable: true,
    category: 'report',
    icon: '📊',
    color: 'purple'
  },

  // Custom notifications
  [NotificationType.CUSTOM_REMINDER]: {
    type: NotificationType.CUSTOM_REMINDER,
    title: 'Custom Reminder',
    message: 'Your custom reminder is due.',
    priority: 'medium',
    actionable: true,
    category: 'task',
    icon: '⏰',
    color: 'blue'
  },
  
  [NotificationType.GOAL_REMINDER]: {
    type: NotificationType.GOAL_REMINDER,
    title: 'Goal Reminder',
    message: 'Don\'t forget about your goals!',
    priority: 'medium',
    actionable: true,
    category: 'task',
    icon: '🎯',
    color: 'green'
  },
  
  [NotificationType.HABIT_REMINDER]: {
    type: NotificationType.HABIT_REMINDER,
    title: 'Habit Reminder',
    message: 'Time to work on your habits.',
    priority: 'low',
    actionable: true,
    category: 'task',
    icon: '🔄',
    color: 'purple'
  }
}






















