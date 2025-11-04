import cron from 'node-cron'
import { notificationService } from '@/lib/notifications/notification-service'

export class MorningNotificationCron {
  private static instance: MorningNotificationCron
  private isRunning: boolean = false

  static getInstance(): MorningNotificationCron {
    if (!MorningNotificationCron.instance) {
      MorningNotificationCron.instance = new MorningNotificationCron()
    }
    return MorningNotificationCron.instance
  }

  // Start the morning notification cron job
  start(): void {
    if (this.isRunning) {
      console.log('Morning notification cron is already running')
      return
    }

    // Run every day at 8:00 AM
    const cronExpression = process.env.NOTIFICATION_CRON_SCHEDULE || '0 8 * * *'
    
    cron.schedule(cronExpression, async () => {
      console.log('Running morning notification cron job...')
      try {
        await notificationService.processMorningNotifications()
      } catch (error) {
        console.error('Morning notification cron job failed:', error)
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    })

    this.isRunning = true
    console.log(`Morning notification cron started with schedule: ${cronExpression}`)
  }

  // Stop the cron job
  stop(): void {
    // Note: node-cron doesn't have a destroy method, jobs are stopped by not scheduling new ones
    this.isRunning = false
    console.log('Morning notification cron stopped')
  }

  // Manual trigger for testing
  async triggerManually(): Promise<void> {
    console.log('Manually triggering morning notifications...')
    try {
      await notificationService.processMorningNotifications()
      console.log('Manual morning notification trigger completed')
    } catch (error) {
      console.error('Manual morning notification trigger failed:', error)
    }
  }

  // Get cron status
  getStatus(): { running: boolean; schedule: string } {
    return {
      running: this.isRunning,
      schedule: process.env.NOTIFICATION_CRON_SCHEDULE || '0 8 * * *'
    }
  }
}

export const morningNotificationCron = MorningNotificationCron.getInstance()


