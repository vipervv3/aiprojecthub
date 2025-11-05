'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Sidebar from '@/components/layout/sidebar'
import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import { toast } from 'react-hot-toast'
import { dataService } from '@/lib/data-service'
import { Plus, Edit, Trash2, Eye, Calendar, Flag, User, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  ai_priority_score?: number
  is_ai_generated?: boolean
  due_date?: string
  project_id: string
  assignee_id?: string
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
}

export default function EnhancedTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  useEffect(() => {
    if (user) {
      loadTasks()
      loadProjects()
    }
  }, [user])

  const loadTasks = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        setTasks([])
        return
      }

      // Load tasks using data service
      const tasksData = await dataService.getTasks(user.id || 'demo-user')
      setTasks(tasksData)
      
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      if (!user) return

      const projectsData = await dataService.getProjects(user.id || 'demo-user')
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      if (!user) {
        toast.error('You must be logged in to create tasks')
        return
      }

      // Create task using data service
      const newTask = await dataService.createTask({
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        ai_priority_score: taskData.ai_priority_score || 0,
        is_ai_generated: taskData.is_ai_generated || false,
        due_date: taskData.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        project_id: taskData.project_id || projects[0]?.id || '',
        assignee_id: taskData.assignee_id || user?.id
      }, user.id || 'demo-user')

      if (newTask) {
        setTasks(prev => [newTask, ...prev])
        toast.success('Task created successfully')
        setShowCreateModal(false)
      } else {
        toast.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const handleEditTask = async (taskData: Partial<Task>) => {
    try {
      if (!selectedTask) return

      const updatedTask = {
        ...selectedTask,
        ...taskData,
        updated_at: new Date().toISOString()
      }

      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t))
      toast.success('Task updated successfully')
      setShowEditModal(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (!window.confirm('Are you sure you want to delete this task?')) {
        return
      }

      // Call API to delete task
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task')
      }

      // Update local state
      setTasks(prev => prev.filter(t => t.id !== taskId))
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete task')
    }
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
    setShowViewModal(true)
  }

  const handleEditTaskClick = (task: Task) => {
    setSelectedTask(task)
    setShowEditModal(true)
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      ))
      toast.success('Task status updated')
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority
    return statusMatch && priorityMatch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <CheckCircle className="h-4 w-4" />
      case 'medium': return <Clock className="h-4 w-4" />
      case 'high': return <Flag className="h-4 w-4" />
      case 'urgent': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                <p className="text-gray-600 mt-2">Manage your tasks and track progress</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Task
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {['all', 'todo', 'in_progress', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700">Priority:</span>
                {['all', 'low', 'medium', 'high', 'urgent'].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setFilterPriority(priority)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                      filterPriority === priority
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Project: {projects.find(p => p.id === task.project_id)?.name || 'Unknown'}</span>
                        </div>
                        {task.ai_priority_score && (
                          <div className="flex items-center gap-1">
                            <span>AI Score: {task.ai_priority_score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewTask(task)}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditTaskClick(task)}
                        className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-2 text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Status Update */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Quick update:</span>
                    {['todo', 'in_progress', 'completed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(task.id, status as Task['status'])}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          task.status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <CheckCircle className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">
                  {filterStatus === 'all' && filterPriority === 'all'
                    ? "Get started by creating your first task"
                    : `No tasks match the current filters`
                  }
                </p>
                {filterStatus === 'all' && filterPriority === 'all' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <FloatingActionButtons />

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => {
            setShowEditModal(false)
            setSelectedTask(null)
          }}
          onSubmit={handleEditTask}
        />
      )}

      {/* View Task Modal */}
      {showViewModal && selectedTask && (
        <ViewTaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => {
            setShowViewModal(false)
            setSelectedTask(null)
          }}
          onEdit={() => {
            setShowViewModal(false)
            setShowEditModal(true)
          }}
          onDelete={() => {
            setShowViewModal(false)
            handleDeleteTask(selectedTask.id)
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}

// Create Task Modal Component
function CreateTaskModal({ projects, onClose, onSubmit }: { 
  projects: Project[], 
  onClose: () => void, 
  onSubmit: (data: Partial<Task>) => void 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    project_id: projects[0]?.id || '',
    ai_priority_score: 0,
    is_ai_generated: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Task Modal Component
function EditTaskModal({ task, projects, onClose, onSubmit }: { 
  task: Task, 
  projects: Project[], 
  onClose: () => void, 
  onSubmit: (data: Partial<Task>) => void 
}) {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date || '',
    project_id: task.project_id,
    ai_priority_score: task.ai_priority_score || 0,
    is_ai_generated: task.is_ai_generated || false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Update Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// View Task Modal Component
function ViewTaskModal({ task, projects, onClose, onEdit, onDelete }: { 
  task: Task, 
  projects: Project[], 
  onClose: () => void, 
  onEdit: () => void, 
  onDelete: () => void 
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const project = projects.find(p => p.id === task.project_id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{task.description}</p>
          </div>

          {/* Project */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project</h3>
            <p className="text-gray-600">{project?.name || 'Unknown Project'}</p>
          </div>

          {/* Due Date */}
          {task.due_date && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Due Date</h3>
              <p className="text-gray-600">{new Date(task.due_date).toLocaleDateString()}</p>
            </div>
          )}

          {/* AI Information */}
          {(task.ai_priority_score || task.is_ai_generated) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Information</h3>
              <div className="space-y-2">
                {task.ai_priority_score && (
                  <p className="text-gray-600">AI Priority Score: {task.ai_priority_score}</p>
                )}
                {task.is_ai_generated && (
                  <p className="text-gray-600">This task was AI generated</p>
                )}
              </div>
            </div>
          )}

          {/* Created/Updated */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Created: {new Date(task.created_at).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Updated: {new Date(task.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Task
          </button>
          <button
            onClick={onDelete}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Task
          </button>
        </div>
      </div>
    </div>
  )
}
