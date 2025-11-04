import SimpleProjectsPage from '@/components/projects/simple-projects-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Projects() {
  return (
    <RequireAuth>
      <AppLayout>
        <SimpleProjectsPage />
      </AppLayout>
    </RequireAuth>
  )
}


