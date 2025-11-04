'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import KanbanBoard from '@/components/tasks/kanban-board'
import TaskFilters from '@/components/tasks/task-filters'
import { dataService } from '@/lib/data-service'
import { toast } from 'react-hot-toast'

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
  projects: {
    name: string
  }
  created_at: string
  updated_at: string
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    project: 'all'
  })
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadTasks()
    }
  }, [user, filters])

  const loadTasks = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        setLoading(false)
        return
      }
      
      // Load tasks from data service
      const loadedTasks = await dataService.getTasks(user.id)
      
      // Transform tasks to include projects data
      const tasksWithProjects = loadedTasks.map(task => ({
        ...task,
        projects: { name: task.project?.name || 'Unknown Project' }
      }))
      
      // Apply filters
      let filteredTasks = tasksWithProjects

      if (filters.status !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === filters.status)
      }
      
      if (filters.priority !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === filters.priority)
      }
      
      if (filters.project !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.project_id === filters.project)
      }

      setTasks(filteredTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
      
      // Fallback to demo data if loading fails
      const demoTasks = [
        {
          id: '1',
          title: 'Set up demonstration of Power Automate flow',
          description: 'Create a comprehensive demo showing the Power Automate workflow for the new process',
          status: 'in_progress' as const,
          priority: 'high' as const,
          ai_priority_score: 85,
          is_ai_generated: true,
          due_date: '2024-01-15',
          project_id: '1',
          projects: { name: 'Copilot Integration' },
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          title: 'Recreate separate section for deactivated employees',
          description: 'Build a new section to handle deactivated employee records separately',
          status: 'todo' as const,
          priority: 'urgent' as const,
          ai_priority_score: 95,
          is_ai_generated: true,
          due_date: '2024-01-12',
          project_id: '2',
          projects: { name: 'Dataverse Setup' },
          created_at: '2024-01-01T11:00:00Z',
          updated_at: '2024-01-01T11:00:00Z'
        },
        {
          id: '3',
          title: 'Coordinate evening activities for summit',
          description: 'Plan and organize evening activities for the upcoming summit event',
          status: 'completed' as const,
          priority: 'medium' as const,
          ai_priority_score: 60,
          is_ai_generated: false,
          due_date: '2024-01-10',
          project_id: '3',
          projects: { name: 'FO Summit Planning' },
          created_at: '2024-01-01T12:00:00Z',
          updated_at: '2024-01-01T12:00:00Z'
        }
      ]
      setTasks(demoTasks)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    console.log('🎯 Updating task status:', { taskId, newStatus })
    
    try {
      // Update in database
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      console.log('📡 Response status:', response.status)
      
      const result = await response.json()
      console.log('📡 Response data:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update task status')
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus as any, updated_at: new Date().toISOString() }
          : task
      ))

      console.log('✅ Task updated successfully')
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('❌ Error updating task:', error)
      toast.error('Failed to update task: ' + (error as Error).message)
    }
  }

  const handleViewTask = (task: Task) => {
    setViewTask(task)
  }

  const handleEditTask = (task: Task) => {
    setEditTask(task)
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Delete from database
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      // Update local state
      setTasks(prev => prev.filter(task => task.id !== taskId))
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(tasks.map(task => task.id))
    }
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleDeleteSelected = async () => {
    const tasksToDelete = selectedTasks.length > 0 ? selectedTasks : tasks.map(t => t.id)
    const count = tasksToDelete.length

    if (count === 0) {
      toast.error('No tasks to delete')
      return
    }

    const message = selectedTasks.length > 0
      ? `⚠️ Are you sure you want to delete ${count} selected task(s)? This action cannot be undone!`
      : `⚠️ Are you sure you want to delete ALL ${count} tasks? This action cannot be undone!`

    if (!window.confirm(message)) {
      return
    }

    try {
      // Delete tasks
      const deletePromises = tasksToDelete.map(taskId =>
        fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)

      toast.success(`Successfully deleted ${count} task(s)!`)
      setSelectedTasks([])
      loadTasks()
    } catch (error) {
      console.error('Error deleting tasks:', error)
      toast.error('Failed to delete tasks')
      loadTasks()
    }
  }

  const handleSaveEdit = async () => {
    if (!editTask) return

    try {
      const response = await fetch(`/api/tasks/${editTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editTask),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === editTask.id ? editTask : task
      ))
      
      setEditTask(null)
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-3 sm:py-4 lg:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              {/* Header */}
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    AI-powered task management with smart prioritization and intelligent insights
                  </p>
                </div>
                
                {tasks.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="btn btn-destructive flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {selectedTasks.length > 0 
                      ? `Delete Selected (${selectedTasks.length})`
                      : `Delete All (${tasks.length})`
                    }
                  </button>
                )}
              </div>

              {/* Task Selection */}
              {tasks.length > 0 && (
                <div className="mb-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTasks.length === tasks.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">
                      Select All ({tasks.length} tasks)
                      {selectedTasks.length > 0 && ` - ${selectedTasks.length} selected`}
                    </span>
                  </label>
                </div>
              )}

              {/* Task Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                        <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                      </div>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">📋</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">To Do</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {tasks.filter(t => t.status === 'todo').length}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm">⏳</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {tasks.filter(t => t.status === 'in_progress').length}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-sm">🔄</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {tasks.filter(t => t.status === 'completed').length}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Filters */}
              <div className="mb-6">
                <TaskFilters filters={filters} onFiltersChange={setFilters} />
              </div>

              {/* Kanban Board */}
              <KanbanBoard 
                tasks={tasks}
                onTaskUpdate={updateTaskStatus}
                onView={handleViewTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                selectedTasks={selectedTasks}
                onSelectTask={handleSelectTask}
              />
        </div>
      </div>
      
      {/* View Task Modal */}
      {viewTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{viewTask.title}</h2>
                <button
                  onClick={() => setViewTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900">{viewTask.description || 'No description'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-gray-900 capitalize">{viewTask.status.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    <p className="mt-1 text-gray-900 capitalize">{viewTask.priority}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Project</label>
                    <p className="mt-1 text-gray-900">{viewTask.projects.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Due Date</label>
                    <p className="mt-1 text-gray-900">{viewTask.due_date || 'Not set'}</p>
                  </div>
                </div>
                
                {viewTask.is_ai_generated && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600 font-medium">🤖 AI Generated</span>
                      {viewTask.ai_priority_score && (
                        <span className="text-sm text-purple-600">
                          Priority Score: {viewTask.ai_priority_score}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewTask(null)
                    handleEditTask(viewTask)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Task
                </button>
                <button
                  onClick={() => setViewTask(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Task Modal */}
      {editTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Edit Task</h2>
                <button
                  onClick={() => setEditTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editTask.title}
                    onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editTask.description}
                    onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editTask.status}
                      onChange={(e) => setEditTask({ ...editTask, status: e.target.value as any })}
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
                      value={editTask.priority}
                      onChange={(e) => setEditTask({ ...editTask, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={editTask.due_date ? new Date(editTask.due_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditTask(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
