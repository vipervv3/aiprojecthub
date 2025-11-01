/**
 * Push Notification Service
 * Handles sending web push notifications to users
 */

import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase'

// VAPID keys - should be in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@aiprojecthub.com'

// Configure web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    // Remove padding characters from VAPID keys if present
    const cleanPublicKey = VAPID_PUBLIC_KEY.replace(/=/g, '')
    const cleanPrivateKey = VAPID_PRIVATE_KEY.replace(/=/g, '')
    webpush.setVapidDetails(VAPID_SUBJECT, cleanPublicKey, cleanPrivateKey)
  } catch (error) {
    console.error('Error setting VAPID details:', error)
    // Don't throw - push notifications will just fail if keys are invalid
  }
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  requireInteraction?: boolean
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export class PushNotificationService {
  /**
   * Send push notification to a single subscription
   */
  async sendNotification(
    subscription: PushSubscription,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.error('VAPID keys not configured')
        return false
      }

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-192x192.png',
        tag: payload.tag || 'notification',
        url: payload.url || '/',
        requireInteraction: payload.requireInteraction || false,
        data: payload.data || {},
        actions: payload.actions
      })

      await webpush.sendNotification(subscription, pushPayload)
      console.log('✅ Push notification sent successfully')
      return true
    } catch (error: any) {
      console.error('❌ Error sending push notification:', error)
      
      // Handle invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log('Subscription expired or invalid, should remove from database')
        return false
      }
      
      return false
    }
  }

  /**
   * Send push notification to all user's subscriptions
   */
  async sendToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get user's push subscriptions from database
      const { data: subscriptions, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)

      if (error) {
        console.error('Error fetching push subscriptions:', error)
        return { sent: 0, failed: 0 }
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`)
        return { sent: 0, failed: 0 }
      }

      let sent = 0
      let failed = 0

      // Send to all subscriptions
      for (const sub of subscriptions) {
        try {
          const subscription: PushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys_p256dh,
              auth: sub.keys_auth
            }
          }

          const success = await this.sendNotification(subscription, payload)
          if (success) {
            sent++
          } else {
            failed++
            // Mark subscription as inactive if it failed
            await supabaseAdmin
              .from('push_subscriptions')
              .update({ active: false })
              .eq('id', sub.id)
          }
        } catch (error) {
          console.error('Error sending to subscription:', error)
          failed++
        }
      }

      console.log(`📤 Push notifications: ${sent} sent, ${failed} failed for user ${userId}`)
      return { sent, failed }
    } catch (error) {
      console.error('Error in sendToUser:', error)
      return { sent: 0, failed: 0 }
    }
  }

  /**
   * Send push notification with intelligent notification content
   */
  async sendIntelligentNotification(
    userId: string,
    period: 'morning' | 'midday' | 'evening',
    summary?: string
  ): Promise<boolean> {
    const titles = {
      morning: '🌅 Good Morning!',
      midday: '☀️ Midday Check-in',
      evening: '🌙 Evening Summary'
    }

    const payload: PushNotificationPayload = {
      title: titles[period],
      body: summary || `Your ${period} update is ready`,
      icon: '/icon-192x192.png',
      tag: `notification-${period}`,
      url: '/dashboard',
      requireInteraction: period === 'morning', // Morning notifications require interaction
      data: {
        period,
        url: '/dashboard'
      }
    }

    const result = await this.sendToUser(userId, payload)
    return result.sent > 0
  }

  /**
   * Get VAPID public key for client-side registration
   */
  static getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY
  }
}

export const pushNotificationService = new PushNotificationService()

