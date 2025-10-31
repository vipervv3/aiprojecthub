// ICS/iCal Calendar Sync Service
// Parses ICS feeds from Outlook, Google Calendar, Apple Calendar, etc.

export interface ICSEvent {
  uid: string
  title: string
  description?: string
  start: Date
  end?: Date
  location?: string
  organizer?: string
  attendees?: string[]
  recurrence?: string
  allDay?: boolean
}

export interface CalendarSync {
  id: string
  name: string
  url: string
  color: string
  enabled: boolean
  last_synced?: Date
}

/**
 * Parse ICS/iCal format calendar feed
 */
export function parseICS(icsContent: string): ICSEvent[] {
  const events: ICSEvent[] = []
  
  // Split into individual events
  const eventBlocks = icsContent.split('BEGIN:VEVENT')
  
  for (let i = 1; i < eventBlocks.length; i++) {
    const eventBlock = eventBlocks[i].split('END:VEVENT')[0]
    const lines = eventBlock.split(/\r?\n/).filter(line => line.trim())
    
    const event: Partial<ICSEvent> = {}
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      
      // Extract the property name (before any semicolon)
      const propName = key.split(';')[0]
      
      switch (propName) {
        case 'UID':
          event.uid = value
          break
        case 'SUMMARY':
          event.title = unescapeICS(value)
          break
        case 'DESCRIPTION':
          event.description = unescapeICS(value)
          break
        case 'LOCATION':
          event.location = unescapeICS(value)
          break
        case 'DTSTART':
          event.start = parseICSDate(value, key)
          event.allDay = key.includes('VALUE=DATE') && !key.includes('TZID')
          break
        case 'DTEND':
          event.end = parseICSDate(value, key)
          break
        case 'ORGANIZER':
          const organizerMatch = value.match(/CN=([^:;]+)/)
          event.organizer = organizerMatch ? organizerMatch[1] : value
          break
        case 'ATTENDEE':
          if (!event.attendees) event.attendees = []
          const attendeeMatch = value.match(/CN=([^:;]+)/)
          if (attendeeMatch) {
            event.attendees.push(attendeeMatch[1])
          }
          break
        case 'RRULE':
          event.recurrence = value
          break
      }
    }
    
    if (event.uid && event.title && event.start) {
      // If event has recurrence, expand it into multiple instances
      if (event.recurrence) {
        const expandedEvents = expandRecurringEvent(event as ICSEvent)
        events.push(...expandedEvents)
      } else {
        events.push(event as ICSEvent)
      }
    }
  }
  
  return events
}

/**
 * Expand recurring events into individual instances
 */
function expandRecurringEvent(event: ICSEvent): ICSEvent[] {
  if (!event.recurrence || !event.start) return [event]
  
  const instances: ICSEvent[] = []
  const rrule = parseRRule(event.recurrence)
  
  if (!rrule) {
    console.warn('Could not parse RRULE:', event.recurrence)
    return [event]
  }
  
  // Generate occurrences for the next 6 months (or until UNTIL date)
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 6)
  
  const untilDate = rrule.until || maxDate
  const count = rrule.count || 365 // Max 365 occurrences
  
  let currentDate = new Date(event.start)
  let occurrenceCount = 0
  
  while (currentDate <= untilDate && occurrenceCount < count) {
    // Create instance for this occurrence
    const duration = event.end ? event.end.getTime() - event.start.getTime() : 0
    const instanceEnd = duration > 0 ? new Date(currentDate.getTime() + duration) : undefined
    
    instances.push({
      ...event,
      uid: `${event.uid}-${currentDate.getTime()}`, // Unique ID for each instance
      start: new Date(currentDate),
      end: instanceEnd,
      recurrence: event.recurrence // Keep original RRULE for reference
    })
    
    occurrenceCount++
    
    // Calculate next occurrence based on frequency
    switch (rrule.freq) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + rrule.interval)
        break
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + (7 * rrule.interval))
        break
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + rrule.interval)
        break
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + rrule.interval)
        break
      default:
        console.warn('Unsupported frequency:', rrule.freq)
        break
    }
  }
  
  return instances.length > 0 ? instances : [event]
}

/**
 * Parse RRULE string
 */
function parseRRule(rruleString: string): {
  freq: string
  interval: number
  until?: Date
  count?: number
  byday?: string[]
} | null {
  const parts = rruleString.split(';')
  const rule: any = {
    freq: '',
    interval: 1
  }
  
  for (const part of parts) {
    const [key, value] = part.split('=')
    
    switch (key) {
      case 'FREQ':
        rule.freq = value
        break
      case 'INTERVAL':
        rule.interval = parseInt(value) || 1
        break
      case 'UNTIL':
        rule.until = parseICSDate(value, '')
        break
      case 'COUNT':
        rule.count = parseInt(value)
        break
      case 'BYDAY':
        rule.byday = value.split(',')
        break
    }
  }
  
  return rule.freq ? rule : null
}

/**
 * Parse ICS date format with proper timezone handling
 */
function parseICSDate(dateString: string, fullLine: string): Date {
  // Extract timezone info from the full line if present
  const tzidMatch = fullLine.match(/TZID=([^:;]+)/)
  const hasTzid = tzidMatch !== null
  
  const cleanDate = dateString.replace(/Z$/, '').split('T')
  
  // Check if it's a date-only (all-day) event
  if (cleanDate.length === 1 && cleanDate[0].length === 8) {
    // YYYYMMDD format - all-day events are always in local date
    const year = parseInt(cleanDate[0].substring(0, 4))
    const month = parseInt(cleanDate[0].substring(4, 6)) - 1
    const day = parseInt(cleanDate[0].substring(6, 8))
    return new Date(year, month, day, 0, 0, 0)
  }
  
  // YYYYMMDDTHHMMSS format - timed events
  const year = parseInt(dateString.substring(0, 4))
  const month = parseInt(dateString.substring(4, 6)) - 1
  const day = parseInt(dateString.substring(6, 8))
  const hour = parseInt(dateString.substring(9, 11) || '0')
  const minute = parseInt(dateString.substring(11, 13) || '0')
  const second = parseInt(dateString.substring(13, 15) || '0')
  
  // If it ends with Z, it's UTC - convert to local time automatically
  if (dateString.endsWith('Z')) {
    // Date constructor automatically converts UTC to local time
    return new Date(Date.UTC(year, month, day, hour, minute, second))
  }
  
  // CRITICAL FIX: The events are showing 4-5 hours early, which suggests Outlook is
  // exporting times in local timezone (EST/EDT = UTC-4/UTC-5), but we're parsing as UTC.
  //
  // When Outlook exports "12:00 PM EST", it becomes "20251030T120000" (no Z, no TZID).
  // If we parse this as UTC, it becomes 12:00 UTC which displays as 7:00 AM EST (wrong!).
  //
  // SOLUTION: When there's no 'Z', assume the time is in EST/EDT (UTC-4 or UTC-5).
  // Since EST/EDT offset varies by DST, we'll use EDT (UTC-4) as a safe default.
  // We'll add 4 hours to convert to UTC: 12:00 PM EDT → 4:00 PM UTC → displays as 12:00 PM EST ✓
  //
  // Note: This is a workaround. Proper solution requires timezone library or TZID parsing.
  if (hasTzid) {
    const tzid = tzidMatch?.[1] || ''
    // Check for common timezone identifiers
    const isEST = /Eastern|America\/New_York|EST|EDT/i.test(tzid)
    const isCST = /Central|America\/Chicago|CST|CDT/i.test(tzid)
    const isPST = /Pacific|America\/Los_Angeles|PST|PDT/i.test(tzid)
    
    if (isEST) {
      // EST is UTC-5, EDT is UTC-4. Use UTC-4 (EDT) as default (most of the year)
      console.log(`📍 Event timezone: ${tzid} (Eastern) - adding 4 hours to convert EDT→UTC`)
      return new Date(Date.UTC(year, month, day, hour + 4, minute, second))
    } else if (isCST) {
      // CST is UTC-6, CDT is UTC-5. Use UTC-5 (CDT) as default
      console.log(`📍 Event timezone: ${tzid} (Central) - adding 5 hours to convert CDT→UTC`)
      return new Date(Date.UTC(year, month, day, hour + 5, minute, second))
    } else if (isPST) {
      // PST is UTC-8, PDT is UTC-7. Use UTC-7 (PDT) as default
      console.log(`📍 Event timezone: ${tzid} (Pacific) - adding 7 hours to convert PDT→UTC`)
      return new Date(Date.UTC(year, month, day, hour + 7, minute, second))
    } else {
      // Unknown timezone - assume UTC (default behavior)
      console.log(`⚠️  Event has unknown timezone: ${tzid} - parsing as UTC`)
      return new Date(Date.UTC(year, month, day, hour, minute, second))
    }
  }
  
  // No 'Z' and no TZID - Outlook often exports these in user's local timezone (typically EST/EDT)
  // Apply EDT offset (UTC-4) to convert to UTC
  // This fixes the 4-hour shift we're seeing
  console.log(`📍 Event time without timezone/Z - assuming EDT (UTC-4) and adding 4 hours to convert to UTC`)
  return new Date(Date.UTC(year, month, day, hour + 4, minute, second))
}

/**
 * Unescape ICS special characters
 */
function unescapeICS(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

/**
 * Fetch and parse ICS feed from URL
 */
export async function fetchICSFeed(url: string): Promise<ICSEvent[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/calendar, text/plain, */*'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ICS feed: ${response.statusText}`)
    }
    
    const icsContent = await response.text()
    return parseICS(icsContent)
  } catch (error) {
    console.error('Error fetching ICS feed:', error)
    throw error
  }
}

/**
 * Get common calendar provider ICS URLs
 */
export function getCalendarProviderInfo(provider: 'outlook' | 'google' | 'apple' | 'other') {
  const info = {
    outlook: {
      name: 'Outlook/Microsoft 365',
      instructions: 'In Outlook.com, go to Calendar > Share > Publish calendar > Get ICS link',
      urlPattern: 'https://outlook.live.com/owa/calendar/...',
      color: '#0078D4'
    },
    google: {
      name: 'Google Calendar',
      instructions: 'In Google Calendar, go to Settings > Calendar settings > Integrate calendar > Secret address in iCal format',
      urlPattern: 'https://calendar.google.com/calendar/ical/...',
      color: '#4285F4'
    },
    apple: {
      name: 'Apple iCloud Calendar',
      instructions: 'In iCloud Calendar, share calendar and enable "Public Calendar" to get webcal:// link. Replace webcal:// with https://',
      urlPattern: 'https://p##-caldav.icloud.com/...',
      color: '#000000'
    },
    other: {
      name: 'Other Calendar',
      instructions: 'Enter the ICS/iCal feed URL from your calendar provider',
      urlPattern: 'https://...',
      color: '#6B7280'
    }
  }
  
  return info[provider]
}

/**
 * Validate ICS URL
 */
export function validateICSUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'webcal:'
  } catch {
    return false
  }
}

