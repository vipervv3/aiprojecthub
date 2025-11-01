import { NextResponse } from 'next/server'
import { PushNotificationService } from '@/lib/services/push-notification-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const publicKey = PushNotificationService.getVapidPublicKey()
    
    if (!publicKey) {
      return NextResponse.json({ 
        error: 'VAPID public key not configured' 
      }, { status: 500 })
    }

    return NextResponse.json({ publicKey })
  } catch (error) {
    console.error('Error getting VAPID key:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

