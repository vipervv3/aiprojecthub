import TasksPage from '@/components/tasks/tasks-page'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'

export default function Tasks() {
  return (
    <RequireAuth>
      <AppLayout>
        <TasksPage />
      </AppLayout>
    </RequireAuth>
  )
}
