import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notifications/notification-service'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify user exists
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate morning notification
    await notificationService.generateMorningNotifications(userId)

    return NextResponse.json({ 
      success: true, 
      message: 'Morning notification generated successfully' 
    })
  } catch (error) {
    console.error('Morning notification API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate morning notification' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user notifications
    const notifications = await notificationService.getUserNotifications(userId, 50)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Get notifications API error:', error)
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}






















