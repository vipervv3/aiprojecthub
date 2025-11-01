import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, userId } = body

    if (!endpoint || !userId) {
      return NextResponse.json({ error: 'Endpoint and userId required' }, { status: 400 })
    }

    // Deactivate subscription
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('endpoint', endpoint)
      .eq('user_id', userId)

    if (error) {
      console.error('Error unsubscribing:', error)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Unsubscribed successfully' })
  } catch (error) {
    console.error('Error in push unsubscribe:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

