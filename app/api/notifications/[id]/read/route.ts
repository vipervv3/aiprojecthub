import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notifications/notification-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    // Mark notification as read
    await notificationService.markAsRead(id)

    return NextResponse.json({ 
      success: true, 
      message: 'Notification marked as read' 
    })
  } catch (error) {
    console.error('Mark notification as read API error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}






















