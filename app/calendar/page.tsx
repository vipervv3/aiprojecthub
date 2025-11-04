import EnhancedCalendarPage from '@/components/calendar/enhanced-calendar-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Calendar() {
  return (
    <RequireAuth>
      <AppLayout>
        <EnhancedCalendarPage />
      </AppLayout>
    </RequireAuth>
  )
}
