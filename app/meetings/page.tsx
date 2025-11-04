import EnhancedMeetingsPage from '@/components/meetings/enhanced-meetings-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Meetings() {
  return (
    <RequireAuth>
      <AppLayout>
        <EnhancedMeetingsPage />
      </AppLayout>
    </RequireAuth>
  )
}


