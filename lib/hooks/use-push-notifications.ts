'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers'
import { toast } from 'sonner'

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(true)
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null)

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false)
      setLoading(false)
      return
    }

    // Check for service worker and push manager support
    const hasServiceWorker = 'serviceWorker' in navigator
    const hasPushManager = 'PushManager' in window
    
    // iOS Safari requires the app to be added to Home Screen
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS 13+
    const isStandalone = (window.navigator as any).standalone === true || 
                         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    
    // Check if we're in a PWA context (standalone mode)
    const isInAppBrowser = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true ||
                           document.referrer.includes('android-app://')
    
    if (hasServiceWorker && hasPushManager) {
      // On iOS, only support push if in standalone mode (added to Home Screen)
      if (isIOS && !isStandalone) {
        setIsSupported(false)
        setLoading(false)
        console.warn('⚠️ iOS push notifications require adding to Home Screen.')
        console.log('📱 Steps: Share button → Add to Home Screen → Open from Home Screen icon')
        return
      }
      
      setIsSupported(true)
      setPermission(Notification.permission)
      
      // Log diagnostic info
      console.log('🔔 Push notification support check:', {
        hasServiceWorker,
        hasPushManager,
        isIOS,
        isStandalone,
        isInAppBrowser,
        permission: Notification.permission,
        userAgent: navigator.userAgent.substring(0, 100)
      })
    } else {
      setIsSupported(false)
      setLoading(false)
      console.log('❌ Push notifications not supported:', {
        hasServiceWorker,
        hasPushManager,
        isIOS,
        isStandalone
      })
    }
  }, [])

  // Get VAPID public key
  useEffect(() => {
    if (isSupported) {
      fetch('/api/push/vapid-public-key')
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch VAPID key: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          if (data.publicKey) {
            setVapidPublicKey(data.publicKey)
            console.log('✅ VAPID public key loaded')
          } else {
            console.error('❌ No VAPID public key in response:', data)
          }
        })
        .catch(err => {
          console.error('❌ Error fetching VAPID key:', err)
          setLoading(false)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [isSupported])

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers not supported')
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('✅ Service Worker registered:', registration.scope)
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      
      return registration
    } catch (error) {
      console.error('Error registering service worker:', error)
      toast.error('Failed to register service worker')
      return null
    }
  }, [])

  // Convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      if (!isSupported) {
        toast.error('Push notifications are not supported in this browser')
        return false
      }

      if (!vapidPublicKey) {
        console.error('❌ VAPID key not loaded')
        toast.error('VAPID key not loaded. Please refresh the page and try again.')
        // Try to fetch it again
        try {
          const res = await fetch('/api/push/vapid-public-key')
          const data = await res.json()
          if (data.publicKey) {
            setVapidPublicKey(data.publicKey)
            console.log('✅ VAPID key loaded on retry')
          } else {
            return false
          }
        } catch (err) {
          console.error('❌ Failed to load VAPID key on retry:', err)
          return false
        }
      }

      if (!user) {
        toast.error('You must be logged in to enable push notifications')
        return false
      }

      // Request notification permission
      if (Notification.permission === 'default') {
        const permissionResult = await Notification.requestPermission()
        setPermission(permissionResult)
        
        if (permissionResult !== 'granted') {
          toast.error('Notification permission denied')
          return false
        }
      } else if (Notification.permission === 'denied') {
        toast.error('Notification permission was previously denied. Please enable it in your browser settings.')
        return false
      }

      // Register service worker
      const registration = await registerServiceWorker()
      if (!registration) {
        return false
      }

      // Subscribe to push manager
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Convert subscription to format for our API
      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!)))
        }
      }

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscriptionData,
          userId: user.id,
          userAgent: navigator.userAgent,
          deviceInfo: {
            platform: navigator.platform,
            language: navigator.language
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setSubscription(subscriptionData)
      toast.success('Push notifications enabled! 🎉')
      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      toast.error('Failed to enable push notifications')
      return false
    }
  }, [isSupported, vapidPublicKey, user, registerServiceWorker])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      if (!subscription) {
        return true
      }

      // Unsubscribe from push manager
      const registration = await navigator.serviceWorker.ready
      const pushSubscription = await registration.pushManager.getSubscription()
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe()
      }

      // Notify server
      if (!user) return false

      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to unsubscribe')
      }

      setSubscription(null)
      toast.success('Push notifications disabled')
      return true
    } catch (error) {
      console.error('Error unsubscribing:', error)
      toast.error('Failed to disable push notifications')
      return false
    }
  }, [subscription])

  // Check existing subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !user || loading) return

      try {
        const registration = await navigator.serviceWorker.ready
        const pushSubscription = await registration.pushManager.getSubscription()
        
        if (pushSubscription) {
          const subscriptionData: PushSubscription = {
            endpoint: pushSubscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!)))
            }
          }
          setSubscription(subscriptionData)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [isSupported, user, loading])

  return {
    isSupported,
    subscription,
    permission,
    loading,
    subscribe,
    unsubscribe,
    isSubscribed: subscription !== null
  }
}

