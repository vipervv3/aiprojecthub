'use client'

import { useEffect } from 'react'

/**
 * Component to automatically register service worker and set up push notifications
 * This should be included in the root layout or providers
 */
export default function PushNotificationSetup() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker on page load
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration.scope)
        })
        .catch(err => {
          console.error('❌ Service worker registration failed:', err)
        })
    }
  }, [])

  return null // This component doesn't render anything
}
