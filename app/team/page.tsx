import EnhancedTeamPage from '@/components/team/enhanced-team-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Team() {
  return (
    <RequireAuth>
      <AppLayout>
        <EnhancedTeamPage />
      </AppLayout>
    </RequireAuth>
  )
}
