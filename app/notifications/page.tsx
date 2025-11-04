import EnhancedNotificationsPage from '@/components/notifications/enhanced-notifications-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Notifications() {
  return (
    <RequireAuth>
      <AppLayout>
        <EnhancedNotificationsPage />
      </AppLayout>
    </RequireAuth>
  )
}