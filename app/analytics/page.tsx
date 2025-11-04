import SimpleAnalyticsPage from '@/components/analytics/simple-analytics-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Analytics() {
  return (
    <RequireAuth>
      <AppLayout>
        <SimpleAnalyticsPage />
      </AppLayout>
    </RequireAuth>
  )
}




