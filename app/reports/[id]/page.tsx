import ProjectReportDetailPage from '@/components/reports/project-report-detail-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function ProjectReportDetail() {
  return (
    <RequireAuth>
      <AppLayout>
        <ProjectReportDetailPage />
      </AppLayout>
    </RequireAuth>
  )
}

