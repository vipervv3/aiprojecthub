import SimpleDashboard from '@/components/dashboard/simple-dashboard'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function DashboardPage() {
  return (
    <RequireAuth>
      <AppLayout>
        <SimpleDashboard />
      </AppLayout>
    </RequireAuth>
  )
}


