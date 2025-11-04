import SimpleAIInsightsPage from '@/components/ai-insights/simple-ai-insights-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function AIInsights() {
  return (
    <RequireAuth>
      <AppLayout>
        <SimpleAIInsightsPage />
      </AppLayout>
    </RequireAuth>
  )
}


