import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchICSFeed } from '@/lib/services/ics-sync-service'

// GET: Fetch all calendar syncs for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: syncs, error } = await supabaseAdmin
      .from('calendar_syncs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching calendar syncs:', error)
      return NextResponse.json({ error: 'Failed to fetch calendar syncs' }, { status: 500 })
    }

    return NextResponse.json({ syncs })
  } catch (error) {
    console.error('Error in GET /api/calendar-sync:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new calendar sync and fetch initial events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, provider, icsUrl, color } = body

    if (!userId || !name || !icsUrl) {
      return NextResponse.json(
        { error: 'User ID, name, and ICS URL are required' },
        { status: 400 }
      )
    }

    // Test the ICS feed first
    console.log(`🔄 Testing ICS feed: ${icsUrl}`)
    let events
    try {
      events = await fetchICSFeed(icsUrl)
      
      // Count recurring vs non-recurring events
      const recurringCount = events.filter(e => e.recurrence).length
      const nonRecurringCount = events.length - recurringCount
      
      console.log(`✅ Successfully fetched ${events.length} events from ICS feed`)
      console.log(`   📊 Breakdown: ${nonRecurringCount} one-time events, ${recurringCount} instances from recurring events`)
    } catch (fetchError) {
      console.error('Error fetching ICS feed:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch ICS feed. Please check the URL and try again.' },
        { status: 400 }
      )
    }

    // Create the sync entry
    const { data: sync, error: syncError } = await supabaseAdmin
      .from('calendar_syncs')
      .insert([
        {
          user_id: userId,
          name,
          provider: provider || 'other',
          ics_url: icsUrl,
          color: color || '#6B7280',
          enabled: true,
          last_synced: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (syncError) {
      console.error('Error creating calendar sync:', syncError)
      return NextResponse.json({ error: 'Failed to create calendar sync' }, { status: 500 })
    }

    // Import the events
    const eventsToInsert = events.map(event => ({
      sync_id: sync.id,
      external_uid: event.uid,
      title: event.title,
      description: event.description,
      start_time: event.start.toISOString(),
      end_time: event.end?.toISOString(),
      location: event.location,
      organizer: event.organizer,
      attendees: event.attendees,
      all_day: event.allDay,
      recurrence: event.recurrence
    }))

    if (eventsToInsert.length > 0) {
      const { error: eventsError } = await supabaseAdmin
        .from('synced_events')
        .insert(eventsToInsert)

      if (eventsError) {
        console.error('Error importing events:', eventsError)
        // Don't fail the whole operation, just log the error
      } else {
        console.log(`✅ Imported ${eventsToInsert.length} events`)
      }
    }

    return NextResponse.json({ 
      sync, 
      eventsCount: eventsToInsert.length,
      message: `Successfully synced ${eventsToInsert.length} events from ${name}`
    })
  } catch (error) {
    console.error('Error in POST /api/calendar-sync:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update a calendar sync (enable/disable, refresh)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { syncId, action } = body

    if (!syncId) {
      return NextResponse.json({ error: 'Sync ID is required' }, { status: 400 })
    }

    // Get the sync
    const { data: sync, error: syncFetchError } = await supabaseAdmin
      .from('calendar_syncs')
      .select('*')
      .eq('id', syncId)
      .single()

    if (syncFetchError || !sync) {
      return NextResponse.json({ error: 'Calendar sync not found' }, { status: 404 })
    }

    if (action === 'refresh') {
      // Fetch fresh events from the ICS feed
      console.log(`🔄 Refreshing events for sync: ${sync.name}`)
      
      try {
        const events = await fetchICSFeed(sync.ics_url)
        
        // Count recurring vs non-recurring events
        const recurringCount = events.filter(e => e.recurrence).length
        const nonRecurringCount = events.length - recurringCount
        
        console.log(`✅ Fetched ${events.length} events`)
        console.log(`   📊 Breakdown: ${nonRecurringCount} one-time events, ${recurringCount} instances from recurring events`)

        // Delete old events
        await supabaseAdmin
          .from('synced_events')
          .delete()
          .eq('sync_id', syncId)

        // Insert new events
        const eventsToInsert = events.map((event, index) => {
          const startISO = event.start.toISOString()
          const endISO = event.end?.toISOString()
          
          // Debug logging for first few events to verify UTC times
          if (index < 5) {
            console.log(`📅 Event "${event.title}": start=${event.start.toLocaleString()} (local) → ${startISO} (UTC), hour=${event.start.getHours()}`)
          }
          
          return {
            sync_id: syncId,
            external_uid: event.uid,
            title: event.title,
            description: event.description,
            start_time: startISO,
            end_time: endISO,
            location: event.location,
            organizer: event.organizer,
            attendees: event.attendees,
            all_day: event.allDay,
            recurrence: event.recurrence
          }
        })

        if (eventsToInsert.length > 0) {
          await supabaseAdmin
            .from('synced_events')
            .insert(eventsToInsert)
        }

        // Update last_synced
        await supabaseAdmin
          .from('calendar_syncs')
          .update({ last_synced: new Date().toISOString() })
          .eq('id', syncId)

        return NextResponse.json({ 
          success: true, 
          eventsCount: eventsToInsert.length,
          message: `Refreshed ${eventsToInsert.length} events`
        })
      } catch (fetchError) {
        console.error('Error refreshing ICS feed:', fetchError)
        return NextResponse.json({ error: 'Failed to refresh calendar' }, { status: 500 })
      }
    }

    if (action === 'toggle') {
      const { data: updatedSync, error: updateError } = await supabaseAdmin
        .from('calendar_syncs')
        .update({ enabled: !sync.enabled })
        .eq('id', syncId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update sync' }, { status: 500 })
      }

      return NextResponse.json({ sync: updatedSync })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in PATCH /api/calendar-sync:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove a calendar sync and all its events
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const syncId = searchParams.get('syncId')

    if (!syncId) {
      return NextResponse.json({ error: 'Sync ID is required' }, { status: 400 })
    }

    // Delete the sync (cascades to synced_events)
    const { error } = await supabaseAdmin
      .from('calendar_syncs')
      .delete()
      .eq('id', syncId)

    if (error) {
      console.error('Error deleting calendar sync:', error)
      return NextResponse.json({ error: 'Failed to delete calendar sync' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/calendar-sync:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

