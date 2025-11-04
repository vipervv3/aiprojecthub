import ProjectDetailsPage from '@/components/projects/project-details-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function ProjectDetailPage() {
  return (
    <RequireAuth>
      <AppLayout>
        <ProjectDetailsPage />
      </AppLayout>
    </RequireAuth>
  )
}


















