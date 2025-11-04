/**
 * Timezone utility functions for notification scheduling
 */

/**
 * Convert a time in user's timezone to UTC
 * @param userTimezone - IANA timezone string (e.g., 'America/New_York')
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @returns UTC hour and minute as object
 */
export function convertToUTC(
  userTimezone: string,
  hour: number,
  minute: number = 0
): { utcHour: number; utcMinute: number } {
  try {
    // Get current date in user's timezone
    const now = new Date()
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
    
    // Create a date object for the desired time in user's timezone
    const targetDate = new Date(userDate)
    targetDate.setHours(hour, minute, 0, 0)
    
    // Get UTC equivalent
    const utcDate = new Date(
      targetDate.toLocaleString('en-US', { timeZone: userTimezone })
    )
    
    // Calculate UTC offset
    const offset = userDate.getTimezoneOffset() - targetDate.getTimezoneOffset()
    
    // Convert to UTC
    const utcTime = new Date(targetDate.getTime() - (offset * 60 * 1000))
    
    return {
      utcHour: utcTime.getUTCHours(),
      utcMinute: utcTime.getUTCMinutes()
    }
  } catch (error) {
    console.error('Error converting timezone:', error)
    // Fallback to UTC if timezone is invalid
    return { utcHour: hour, utcMinute: minute }
  }
}

/**
 * Get current time in user's timezone
 * @param userTimezone - IANA timezone string
 * @returns Current hour and minute in user's timezone
 */
export function getCurrentTimeInTimezone(userTimezone: string): { hour: number; minute: number } {
  try {
    const now = new Date()
    const timeString = now.toLocaleString('en-US', {
      timeZone: userTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const [hour, minute] = timeString.split(':').map(Number)
    return { hour, minute }
  } catch (error) {
    console.error('Error getting time in timezone:', error)
    const now = new Date()
    return { hour: now.getUTCHours(), minute: now.getUTCMinutes() }
  }
}

/**
 * Check if current UTC time matches user's desired local time
 * @param userTimezone - IANA timezone string
 * @param desiredHour - Desired hour in user's timezone (0-23)
 * @param desiredMinute - Desired minute in user's timezone (0-59)
 * @returns true if current time matches
 */
export function isTimeToSend(
  userTimezone: string,
  desiredHour: number,
  desiredMinute: number = 0
): boolean {
  try {
    const { utcHour, utcMinute } = convertToUTC(userTimezone, desiredHour, desiredMinute)
    const now = new Date()
    const currentUTCHour = now.getUTCHours()
    const currentUTCMinute = now.getUTCMinutes()
    
    // Allow 5-minute window (cron runs every minute, but we check hourly)
    return currentUTCHour === utcHour && Math.abs(currentUTCMinute - utcMinute) <= 5
  } catch (error) {
    console.error('Error checking time to send:', error)
    return false
  }
}

/**
 * Get list of all IANA timezones grouped by region
 */
export function getTimezoneOptions(): { region: string; timezones: { value: string; label: string }[] }[] {
  const timezones = Intl.supportedValuesOf('timeZone')
  
  const grouped: { [key: string]: { value: string; label: string }[] } = {}
  
  timezones.forEach(tz => {
    const parts = tz.split('/')
    const region = parts[0] || 'Other'
    
    if (!grouped[region]) {
      grouped[region] = []
    }
    
    const label = tz.replace(/_/g, ' ').replace(/\//g, ' / ')
    grouped[region].push({ value: tz, label })
  })
  
  // Sort regions and timezones within regions
  const sortedRegions = Object.keys(grouped).sort()
  
  return sortedRegions.map(region => ({
    region,
    timezones: grouped[region].sort((a, b) => a.label.localeCompare(b.label))
  }))
}

/**
 * Get user-friendly timezone label
 */
export function getTimezoneLabel(timezone: string): string {
  try {
    const now = new Date()
    const offset = getTimezoneOffset(timezone)
    const offsetString = formatOffset(offset)
    return `${timezone.replace(/_/g, ' ')} (UTC${offsetString})`
  } catch {
    return timezone
  }
}

/**
 * Get timezone offset in minutes
 */
function getTimezoneOffset(timezone: string): number {
  const now = new Date()
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tz = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  return (tz.getTime() - utc.getTime()) / (1000 * 60)
}

/**
 * Format offset as +/-HH:MM
 */
function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-'
  const absMinutes = Math.abs(minutes)
  const hours = Math.floor(absMinutes / 60)
  const mins = absMinutes % 60
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Auto-detect user's timezone from browser
 */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

