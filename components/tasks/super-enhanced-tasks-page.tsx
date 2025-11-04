'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, Clock, AlertTriangle, 
  Calendar, Users, Flag, BarChart3, Grid, List, SortAsc, SortDesc, 
  Download, Upload, Tag, MessageSquare, Attachment, Star, Archive,
  MoreHorizontal, Target, TrendingUp, Zap, Brain
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import { dataService } from '@/lib/data-service'
import { toast } from 'sonner'

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
  tags?: string[]
  attachments?: Array<{ id: string; name: string; url: string }>
  comments?: Array<{ id: string; user: string; message: string; created_at: string }>
  estimated_hours?: number
  actual_hours?: number
  dependencies?: string[]
  subtasks?: Task[]
}

interface TaskFilters {
  status: string
  priority: string
  assignee: string
  project: string
  tags: string[]
  dateRange: string
  aiGenerated: boolean | null
}

interface TaskStats {
  total: number
  completed: number
  inProgress: number
  overdue: number
  highPriority: number
  avgCompletionTime: number
}

const TaskCard: React.FC<{ 
  task: Task; 
  onEdit: (task: Task) => void; 
  onDelete: (taskId: string) => void;
  onView: (task: Task) => void;
  onToggleStatus: (taskId: string) => void;
}> = ({ task, onEdit, onDelete, onView, onToggleStatus }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'todo': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'

  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
      isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(task.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              task.status === 'completed' 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {task.status === 'completed' && <CheckCircle className="h-3 w-3" />}
          </button>
          <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        {task.due_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          </div>
        )}
        {task.assignee_id && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Assigned</span>
          </div>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span>{task.tags.length} tags</span>
          </div>
        )}
        {task.ai_priority_score && (
          <div className="flex items-center gap-1 text-purple-600">
            <Brain className="h-3 w-3" />
            <span>AI: {Math.round(task.ai_priority_score * 100)}%</span>
          </div>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(task)}
            className="p-1 text-gray-400 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-400 hover:text-green-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {task.estimated_hours && (
          <div className="text-xs text-gray-500">
            {task.actual_hours || 0}/{task.estimated_hours}h
          </div>
        )}
      </div>
    </div>
  )
}

const TaskStats: React.FC<{ stats: TaskStats }> = ({ stats }) => {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-600" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
      </div>
    </div>
  )
}

export default function SuperEnhancedTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at' | 'title'>('due_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    project: 'all',
    tags: [],
    dateRange: 'all',
    aiGenerated: null
  })
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    highPriority: 0,
    avgCompletionTime: 0
  })

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [tasks])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const tasksData = await dataService.getTasks(user?.id || '')
      
      // Enhance tasks with additional mock data
      const enhancedTasks: Task[] = tasksData.map(task => ({
        ...task,
        tags: ['development', 'frontend', 'urgent'].slice(0, Math.floor(Math.random() * 3) + 1),
        attachments: Math.random() > 0.7 ? [
          { id: '1', name: 'design.pdf', url: '#' },
          { id: '2', name: 'requirements.docx', url: '#' }
        ] : [],
        comments: Math.random() > 0.5 ? [
          { id: '1', user: 'John Doe', message: 'Looking good!', created_at: new Date().toISOString() }
        ] : [],
        estimated_hours: Math.floor(Math.random() * 40) + 8,
        actual_hours: Math.floor(Math.random() * 20),
        ai_priority_score: Math.random(),
        is_ai_generated: Math.random() > 0.8
      }))
      
      setTasks(enhancedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < new Date()
    }).length
    const highPriority = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length

    setStats({
      total,
      completed,
      inProgress,
      overdue,
      highPriority,
      avgCompletionTime: 0 // TODO: Calculate based on completion times
    })
  }

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setTasks(prev => [newTask, ...prev])
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const handleEditTask = (task: Task) => {
    // TODO: Open edit modal
    toast.info('Edit functionality coming soon')
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    toast.success('Task deleted successfully')
  }

  const handleViewTask = (task: Task) => {
    // TODO: Open view modal
    toast.info('View functionality coming soon')
  }

  const handleToggleStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'todo' : 'completed'
        return { ...task, status: newStatus, updated_at: new Date().toISOString() }
      }
      return task
    }))
  }

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filters.status === 'all' || task.status === filters.status
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority
      const matchesAI = filters.aiGenerated === null || (filters.aiGenerated === task.is_ai_generated)
      
      return matchesSearch && matchesStatus && matchesPriority && matchesAI
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_VALUE
          bValue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_VALUE
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder]
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder]
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-2">Manage and track your tasks with advanced features</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Task
            </button>
          </div>
        </div>

        {/* Stats */}
        <TaskStats stats={stats} />

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created_at">Created Date</option>
              <option value="title">Title</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </button>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filters.aiGenerated}
                  onChange={(e) => setFilters({ ...filters, aiGenerated: e.target.value === 'all' ? null : e.target.value === 'true' })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tasks</option>
                  <option value="true">AI Generated</option>
                  <option value="false">Manual</option>
                </select>

                <button
                  onClick={() => setFilters({
                    status: 'all',
                    priority: 'all',
                    assignee: 'all',
                    project: 'all',
                    tags: [],
                    dateRange: 'all',
                    aiGenerated: null
                  })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Grid/List */}
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== null && (Array.isArray(f) ? f.length > 0 : true))
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first task'
              }
            </p>
            {(!searchTerm && Object.values(filters).every(f => f === 'all' || f === null || (Array.isArray(f) && f.length === 0))) && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Create Task
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onView={handleViewTask}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* AI Insights */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Task Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Smart Prioritization</h4>
              <p className="text-sm text-gray-600">
                {tasks.filter(t => t.ai_priority_score).length} tasks have AI-generated priority scores
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Completion Prediction</h4>
              <p className="text-sm text-gray-600">
                AI predicts 85% completion rate for current workload
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Resource Optimization</h4>
              <p className="text-sm text-gray-600">
                Suggested task reordering could save 2.5 hours this week
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




















