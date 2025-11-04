import EnhancedSettingsPage from '@/components/settings/enhanced-settings-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Settings() {
  return (
    <RequireAuth>
      <AppLayout>
        <EnhancedSettingsPage />
      </AppLayout>
    </RequireAuth>
  )
}
