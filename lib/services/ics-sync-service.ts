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
  const cleanDate = dateString.replace(/Z$/, '').split('T')
  
  // Check if it's a date-only (all-day) event
  if (cleanDate.length === 1 && cleanDate[0].length === 8) {
    // YYYYMMDD format - all-day events
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
  
  // If it ends with Z, it's already UTC
  if (dateString.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second))
  }
  
  // Check if there's a TZID (timezone identifier)
  const tzidMatch = fullLine.match(/TZID=([^:;]+)/)
  
  if (tzidMatch) {
    const tzid = tzidMatch[1]
    
    // Handle Eastern timezone (most common case for US)
    if (tzid.toLowerCase().includes('eastern') || tzid.includes('EST') || tzid.includes('EDT')) {
      // Determine if DST is in effect (rough approximation)
      // DST in US: Second Sunday in March to First Sunday in November
      const isDST = month > 2 && month < 10 // Approximate: March-October
      const utcOffset = isDST ? 4 : 5 // EDT = UTC-4, EST = UTC-5
      
      // Convert FROM Eastern TO UTC by ADDING the offset
      return new Date(Date.UTC(year, month, day, hour + utcOffset, minute, second))
    }
    
    // Handle Central timezone
    if (tzid.toLowerCase().includes('central') || tzid.includes('CST') || tzid.includes('CDT')) {
      const isDST = month > 2 && month < 10
      const utcOffset = isDST ? 5 : 6 // CDT = UTC-5, CST = UTC-6
      return new Date(Date.UTC(year, month, day, hour + utcOffset, minute, second))
    }
    
    // Handle Mountain timezone
    if (tzid.toLowerCase().includes('mountain') || tzid.includes('MST') || tzid.includes('MDT')) {
      const isDST = month > 2 && month < 10
      const utcOffset = isDST ? 6 : 7 // MDT = UTC-6, MST = UTC-7
      return new Date(Date.UTC(year, month, day, hour + utcOffset, minute, second))
    }
    
    // Handle Pacific timezone
    if (tzid.toLowerCase().includes('pacific') || tzid.includes('PST') || tzid.includes('PDT')) {
      const isDST = month > 2 && month < 10
      const utcOffset = isDST ? 7 : 8 // PDT = UTC-7, PST = UTC-8
      return new Date(Date.UTC(year, month, day, hour + utcOffset, minute, second))
    }
    
    // For other timezones, log a warning and treat as local time
    console.warn(`⚠️ Unknown timezone: ${tzid} - treating as local time`)
  }
  
  // No timezone info - treat as local time
  return new Date(year, month, day, hour, minute, second)
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

