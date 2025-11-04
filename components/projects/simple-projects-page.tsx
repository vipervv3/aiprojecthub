'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Users, 
  MoreVertical,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
// import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import { dataService } from '@/lib/data-service'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  progress: number
  due_date?: string
  team_members?: any[]
  created_at: string
}

const ProjectCard: React.FC<{ 
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
  onView: (project: Project) => void
  onMeetingPrep: (project: Project) => void
}> = ({ project, onEdit, onDelete, onView, onMeetingPrep }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FolderOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Owner
              </span>
              {project.status === 'active' && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  active
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{Array.isArray(project.team_members) ? project.team_members.length : 1} member</p>
              <p>Due: {formatDate(project.due_date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">{project.progress}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all" 
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => onView(project)}
          className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation"
        >
          View Project
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onMeetingPrep(project)}
            className="p-2 hover:bg-purple-100 rounded-lg text-gray-600 hover:text-purple-600"
            title="Generate AI Meeting Prep"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button 
            onClick={() => onEdit(project)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800"
            title="Edit project"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(project.id)}
            className="p-2 hover:bg-red-100 rounded-lg text-gray-600 hover:text-red-600"
            title="Delete project"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const CreateProjectModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onCreate: (project: Omit<Project, 'id' | 'created_at'>) => void
}> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    due_date: '',
    team_members: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    if (!formData.due_date.trim()) {
      alert('Please select a due date for the project')
      return
    }

    // Prepare data for submission - due_date is now required
    const submitData = {
      ...formData,
      due_date: formData.due_date
    }

    onCreate(submitData)
    setFormData({
      name: '',
      description: '',
      status: 'active',
      due_date: '',
      team_members: []
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter project name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 touch-manipulation"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EditProjectModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onUpdate: (project: Omit<Project, 'id' | 'created_at'>) => void
  project: Project | null
}> = ({ isOpen, onClose, onUpdate, project }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    due_date: '',
    team_members: []
  })

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        due_date: project.due_date || '',
        team_members: project.team_members || []
      })
    }
  }, [project])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    if (!formData.due_date.trim()) {
      alert('Please select a due date for the project')
      return
    }

    // Prepare data for submission - due_date is now required
    const submitData = {
      ...formData,
      due_date: formData.due_date
    }

    onUpdate(submitData)
    onClose()
  }

  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter project name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Update Project
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SimpleProjectsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showMeetingPrepModal, setShowMeetingPrepModal] = useState(false)
  const [meetingPrepProject, setMeetingPrepProject] = useState<Project | null>(null)
  const [meetingPrepData, setMeetingPrepData] = useState<string>('')
  const [generatingPrep, setGeneratingPrep] = useState(false)

  useEffect(() => {
    const loadProjects = async () => {
      if (user) {
        try {
          setLoadingData(true)
          const userId = user.id || 'demo-user'
          const projectsData = await dataService.getProjects(userId)
          setProjects(projectsData)
        } catch (error) {
          console.error('Error loading projects:', error)
          // Mock data for demo
          setProjects([
            {
              id: '1',
              name: 'Project 1',
              description: 'Project 1 description',
              status: 'active',
              progress: 0,
              due_date: '2025-08-30',
              team_members: [],
              created_at: '2024-01-01'
            },
            {
              id: '2',
              name: 'FO Summit',
              description: 'FO Summit project',
              status: 'active',
              progress: 67,
              due_date: '2025-09-03',
              team_members: [1, 2],
              created_at: '2024-01-15'
            }
          ])
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadProjects()
  }, [user])

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    try {
      const userId = user?.id || 'demo-user'
      
      // Save to data service first
      const savedProject = await dataService.createProject(projectData, userId)
      
      // Add to local state with the saved project
      setProjects([savedProject, ...projects])
      
      console.log('Project created successfully:', savedProject)
    } catch (error) {
      console.error('Error creating project:', error)
      // Show error message to user
      alert('Failed to create project. Please try again.')
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  const handleUpdateProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    if (!editingProject) return
    
    try {
      const userId = user?.id || 'demo-user'
      const updatedProjectData = {
        ...editingProject,
        ...projectData
      }
      
      // Update in data service first
      await dataService.updateProject(userId, updatedProjectData)
      
      // Update local state
      setProjects(projects.map(project => 
        project.id === editingProject.id ? updatedProjectData : project
      ))
      
      console.log('Project updated successfully:', updatedProjectData)
      
      // Close modal and reset editing project
      setShowEditModal(false)
      setEditingProject(null)
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project. Please try again.')
    }
  }

  const handleViewProject = (project: Project) => {
    router.push(`/projects/${project.id}`)
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      return
    }
    
    try {
      const userId = user?.id || 'demo-user'
      
      // Delete from data service first
      await dataService.deleteProject(userId, id)
      
      // Remove from local state
      setProjects(projects.filter(p => p.id !== id))
      
      console.log('Project deleted successfully:', id)
    } catch (error) {
      console.error('Error deleting project:', error)
      // Show error message to user
      alert('Failed to delete project. Please try again.')
    }
  }

  const handleMeetingPrep = async (project: Project) => {
    setMeetingPrepProject(project)
    setShowMeetingPrepModal(true)
    setGeneratingPrep(true)
    setMeetingPrepData('')
    
    try {
      // Get project tasks
      const userId = user?.id || 'demo-user'
      const tasks = await dataService.getTasks(userId)
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      
      // Calculate statistics
      const completedTasks = projectTasks.filter(t => t.status === 'completed')
      const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress')
      const todoTasks = projectTasks.filter(t => t.status === 'todo')
      const overdueTasks = projectTasks.filter(t => {
        if (!t.due_date || t.status === 'completed') return false
        return new Date(t.due_date) < new Date()
      })
      const urgentTasks = projectTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed')
      
      // Generate meeting prep content
      const prep = `# 🎯 Meeting Prep: ${project.name}

## 📊 Project Overview
- **Status:** ${project.status.charAt(0).toUpperCase() + project.status.slice(1)}
- **Progress:** ${project.progress}% Complete
- **Due Date:** ${project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
- **Team Members:** ${Array.isArray(project.team_members) ? project.team_members.length : 1}

## ✅ Completed Items (${completedTasks.length})
${completedTasks.length > 0 ? completedTasks.map(t => `- ✓ ${t.title}`).join('\n') : '- No completed tasks yet'}

## 🚧 In Progress (${inProgressTasks.length})
${inProgressTasks.length > 0 ? inProgressTasks.map(t => `- 🔄 ${t.title}${t.due_date ? ` (Due: ${new Date(t.due_date).toLocaleDateString()})` : ''}`).join('\n') : '- No tasks in progress'}

## 📋 Pending Tasks (${todoTasks.length})
${todoTasks.length > 0 ? todoTasks.map(t => `- ⏳ ${t.title}${t.due_date ? ` (Due: ${new Date(t.due_date).toLocaleDateString()})` : ''}`).join('\n') : '- No pending tasks'}

## ⚠️ Urgent & Overdue
${urgentTasks.length > 0 ? '**Urgent Tasks:**\n' + urgentTasks.map(t => `- 🔥 ${t.title}`).join('\n') : ''}
${overdueTasks.length > 0 ? '\n**Overdue Tasks:**\n' + overdueTasks.map(t => `- ⏰ ${t.title} (Due: ${new Date(t.due_date!).toLocaleDateString()})`).join('\n') : ''}
${urgentTasks.length === 0 && overdueTasks.length === 0 ? '- No urgent or overdue tasks ✨' : ''}

## 🎯 Key Metrics
- **Completion Rate:** ${projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0}%
- **Total Tasks:** ${projectTasks.length}
- **On Track:** ${overdueTasks.length === 0 ? 'Yes ✅' : 'No ⚠️'}

## 💡 Discussion Points
${project.progress < 25 ? '- Project is in early stages - discuss initial setup and resource allocation' : ''}
${project.progress >= 25 && project.progress < 75 ? '- Project is progressing - review milestones and address blockers' : ''}
${project.progress >= 75 ? '- Project nearing completion - focus on final deliverables and quality checks' : ''}
${overdueTasks.length > 0 ? `- Address ${overdueTasks.length} overdue task(s) - reassign or extend deadlines` : ''}
${urgentTasks.length > 0 ? `- Prioritize ${urgentTasks.length} urgent task(s) - allocate resources` : ''}
${inProgressTasks.length > 5 ? '- High number of concurrent tasks - consider focusing efforts' : ''}
${todoTasks.length > 10 ? '- Large backlog - prioritize and break down tasks' : ''}

## 📅 Next Steps
1. Review completed work and celebrate wins
2. Discuss blockers for in-progress tasks
3. Prioritize upcoming tasks
4. Assign resources and set deadlines
5. Update project timeline if needed

## 🎤 Meeting Agenda
1. **Project Status Review** (5 min)
2. **Completed Work Showcase** (10 min)
3. **Blockers & Challenges** (15 min)
4. **Upcoming Tasks Planning** (15 min)
5. **Q&A and Action Items** (10 min)

---
*Generated on ${new Date().toLocaleString()}*`
      
      setMeetingPrepData(prep)
    } catch (error) {
      console.error('Error generating meeting prep:', error)
      setMeetingPrepData('# Error\n\nFailed to generate meeting prep. Please try again.')
    } finally {
      setGeneratingPrep(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to access projects.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome, {user?.user_metadata?.name || 'Omar'}!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Your personal projects and collaborations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors touch-manipulation w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            New Project
          </button>
        </div>

        {/* My Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Projects</h2>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {projects.length} owned
              </span>
            </div>
          </div>
          
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first project</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onView={handleViewProject}
                  onMeetingPrep={handleMeetingPrep}
                />
              ))}
            </div>
          )}
        </div>

        {/* Collaborated Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Collaborated Projects</h2>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                0 collaborated
              </span>
            </div>
          </div>
          
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collaborations yet</h3>
            <p className="text-gray-600">You haven't been invited to any projects yet</p>
          </div>
        </div>

        {/* Privacy & Access Control Section */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy & Access Control</h3>
              <p className="text-gray-700">
                You can only see projects you own or projects where you've been added as a collaborator. 
                Each user's projects are completely private and isolated from other users.
              </p>
            </div>
          </div>
        </div>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />

        <EditProjectModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingProject(null)
          }}
          onUpdate={handleUpdateProject}
          project={editingProject}
        />

        {/* Meeting Prep Modal */}
        {showMeetingPrepModal && meetingPrepProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI Meeting Prep</h2>
                  <p className="text-sm text-gray-600 mt-1">{meetingPrepProject.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowMeetingPrepModal(false)
                    setMeetingPrepProject(null)
                    setMeetingPrepData('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {generatingPrep ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600">Generating meeting prep...</p>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                      {meetingPrepData}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(meetingPrepData)
                    alert('Meeting prep copied to clipboard!')
                  }}
                  disabled={generatingPrep}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    setShowMeetingPrepModal(false)
                    setMeetingPrepProject(null)
                    setMeetingPrepData('')
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
