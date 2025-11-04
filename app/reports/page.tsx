import EnhancedReportsPage from '@/components/reports/enhanced-reports-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Reports() {
  return (
    <RequireAuth>
      <AppLayout>
        <EnhancedReportsPage />
      </AppLayout>
    </RequireAuth>
  )
}
