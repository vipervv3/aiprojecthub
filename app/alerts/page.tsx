import AlertsPage from '@/components/alerts/alerts-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Alerts() {
  return (
    <RequireAuth>
      <AppLayout>
        <AlertsPage />
      </AppLayout>
    </RequireAuth>
  )
}

