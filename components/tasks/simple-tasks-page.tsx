'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { 
  Plus, 
  CheckSquare, 
  Calendar, 
  User, 
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Circle,
  Trash2
} from 'lucide-react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter
} from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
// import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import { dataService } from '@/lib/data-service'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  project_id: string
  created_at: string
}

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

function TaskCard({ 
  task,
  projects,
  onEdit,
  onDelete,
  onStatusChange,
  onView = () => {},
  isDragging = false,
  isSelected = false,
  onSelect
}: { 
  task: Task
  projects: Project[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  onView?: (task: Task) => void
  isDragging?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const project = projects.find(p => p.id === task.project_id)
  const projectName = project ? project.name : 'Unknown Project'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'todo': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-orange-100 text-orange-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = !!(task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed')

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 ${
        isDragging || isSortableDragging 
          ? 'opacity-50 shadow-xl scale-105 border-blue-400 bg-blue-50' 
          : 'hover:shadow-lg hover:scale-[1.02]'
      } ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'} ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect(task.id)
            }}
            className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        )}
        <div 
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex-1"
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'todo' : 'completed')}
              className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.status === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              {task.status === 'completed' && <CheckCircle className="h-3 w-3" />}
            </button>
          
            <div className="flex-1 min-w-0">
              <h3 
                onClick={() => onView(task)}
                className={`text-sm font-medium text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors ${
                  task.status === 'completed' ? 'line-through text-gray-500' : ''
                }`}
                title="Click to view details"
              >
                {task.title}
              </h3>
              <p className="text-xs text-gray-600 mb-2">{projectName}</p>
              
              {task.description && (
                <p className="text-xs text-gray-600 mb-2">{task.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOverdue && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      urgent (auto)
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Due {formatDate(task.due_date)}</span>
                    </div>
                  )}
                  <User className="h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => onView(task)}
                    className="p-1 hover:bg-blue-100 rounded-lg text-gray-400 hover:text-blue-600"
                    title="View task details"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEdit(task)}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                    title="Edit task"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-1 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-600"
                    title="Delete task"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CreateTaskModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onCreate: (task: Omit<Task, 'id' | 'created_at'>) => void
  projects?: Project[]
}> = ({ isOpen, onClose, onCreate, projects = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    project_id: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a task title')
      return
    }
    if (!formData.project_id) {
      alert('Please select a project')
      return
    }

    // Prepare data for submission - omit empty due_date
    const submitData = {
      ...formData,
      due_date: formData.due_date.trim() ? formData.due_date : undefined
    }

    onCreate(submitData)
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      project_id: ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Droppable Column Component
const DroppableColumn: React.FC<{
  id: string
  title: string
  count: number
  tasks: Task[]
  projects: Project[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  onView?: (task: Task) => void
  isOver: boolean
  selectedTasks?: string[]
  onSelect?: (id: string) => void
}> = ({ id, title, count, tasks, projects, onEdit, onDelete, onStatusChange, onView = () => {}, isOver, selectedTasks = [], onSelect }) => {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`bg-gray-50 p-4 rounded-lg min-h-96 border-2 transition-all duration-200 ${
        isOver 
          ? 'border-blue-400 bg-blue-100 shadow-lg' 
          : 'border-transparent'
      }`}
    >
      <h3 className="font-semibold text-gray-900 mb-4">{title} ({count})</h3>
      <SortableContext
        items={tasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {count === 0 ? (
            <div className={`text-center py-8 transition-colors ${
              isOver ? 'text-blue-600' : 'text-gray-500'
            }`}>
              <p className="text-sm">{isOver ? 'Drop task here' : 'No tasks'}</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projects={projects}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                isSelected={selectedTasks.includes(task.id)}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

const EditTaskModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onUpdate: (task: Omit<Task, 'id' | 'created_at'>) => void
  task: Task | null
  projects: Project[]
}> = ({ isOpen, onClose, onUpdate, task, projects = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    project_id: ''
  })

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
        project_id: task.project_id || ''
      })
    }
  }, [task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    if (!formData.project_id) {
      alert('Please select a project')
      return
    }

    // Prepare data for submission - omit empty due_date
    const submitData = {
      ...formData,
      due_date: formData.due_date.trim() ? formData.due_date : undefined
    }

    onUpdate(submitData)
    onClose()
  }

  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Update Task
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

export default function SimpleTasksPage() {
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          setLoadingData(true)
          const userId = user.id || 'demo-user'
          const [tasksData, projectsData] = await Promise.all([
            dataService.getTasks(userId),
            dataService.getProjects(userId)
          ])
          setTasks(tasksData)
          setProjects(projectsData)
          
          // If no projects loaded, use mock data for demo
          if (projectsData.length === 0) {
            setProjects([
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'AI ProjectHub Development',
                description: 'Main development project',
                status: 'active',
                progress: 75,
                due_date: '2025-12-31',
                team_members: [],
                created_at: '2024-01-01'
              },
              {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Dashboard Enhancement',
                description: 'Enhance dashboard features',
                status: 'active',
                progress: 60,
                due_date: '2025-11-30',
                team_members: [],
                created_at: '2024-01-15'
              }
            ])
          }
        } catch (error) {
          console.error('Error loading data:', error)
          // Mock data for demo
          setTasks([
            {
              id: '1',
              title: 'Organize a meeting to discuss the summit agenda',
              description: 'Plan and schedule meeting to discuss summit agenda',
              status: 'todo',
              priority: 'medium',
              due_date: '2025-09-28',
              assignee: 'John Smith',
              created_at: '2024-01-15'
            },
            {
              id: '2',
              title: 'Schedule a meeting to discuss food items for the summit',
              description: 'Organize meeting for food planning',
              status: 'todo',
              priority: 'high',
              due_date: '2025-09-29',
              assignee: 'Sarah Johnson',
              created_at: '2024-01-16'
            },
            {
              id: '3',
              title: 'Organize finalizing meetings for summit preparation',
              description: 'Finalize all summit preparation meetings',
              status: 'todo',
              priority: 'medium',
              due_date: '2025-10-05',
              assignee: 'Mike Chen',
              created_at: '2024-01-10'
            },
            {
              id: '4',
              title: 'Plan meeting to discuss summit agenda',
              description: 'Plan comprehensive summit agenda meeting',
              status: 'todo',
              priority: 'medium',
              due_date: '2025-09-28',
              assignee: 'Mike Chen',
              created_at: '2024-01-10'
            },
            {
              id: '5',
              title: 'Set up meeting to discuss summit activities',
              description: 'Organize activities planning meeting',
              status: 'todo',
              priority: 'medium',
              due_date: '2025-09-30',
              assignee: 'Mike Chen',
              created_at: '2024-01-10'
            },
            {
              id: '6',
              title: 'Finalize summit logistics',
              description: 'Complete all summit logistics planning',
              status: 'todo',
              priority: 'high',
              due_date: '2025-10-01',
              assignee: 'Mike Chen',
              created_at: '2024-01-10'
            },
            {
              id: '7',
              title: 'Coordinate with venue for summit setup',
              description: 'Finalize venue arrangements',
              status: 'todo',
              priority: 'medium',
              due_date: '2025-10-02',
              assignee: 'Mike Chen',
              created_at: '2024-01-10'
            },
            {
              id: '8',
              title: 'Prepare summit presentation materials',
              description: 'Create all presentation materials',
              status: 'todo',
              priority: 'low',
              due_date: '2025-10-03',
              assignee: 'Mike Chen',
              created_at: '2024-01-10'
            },
            {
              id: '9',
              title: 'Send email to GMs about summit',
              description: 'Notify all GMs about upcoming summit',
              status: 'completed',
              priority: 'high',
              due_date: '2025-09-25',
              assignee: 'Mike Chen',
              created_at: '2024-01-10'
            },
            {
              id: '10',
              title: 'Update summit documentation',
              description: 'Update all summit-related documentation',
              status: 'completed',
              priority: 'medium',
              due_date: '2025-09-26',
              assignee: 'Mike Chen',
              created_at: '2024-01-10'
            }
          ])
          
          // Mock projects for demo (when database fails)
          setProjects([
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'AI ProjectHub Development',
              description: 'Main development project',
              status: 'active',
              progress: 75,
              due_date: '2025-12-31',
              team_members: [],
              created_at: '2024-01-01'
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              name: 'Dashboard Enhancement',
              description: 'Enhance dashboard features',
              status: 'active',
              progress: 60,
              due_date: '2025-11-30',
              team_members: [],
              created_at: '2024-01-15'
            }
          ])
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadData()
  }, [user])

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    try {
      const userId = user?.id || 'demo-user'
      
      // Save to data service first
      const savedTask = await dataService.createTask(taskData, userId)
      
      // Add to local state with the saved task
      setTasks([savedTask, ...tasks])
      
      console.log('Task created successfully:', savedTask)
    } catch (error) {
      console.error('Error creating task:', error)
      // Show error message to user
      alert('Failed to create task. Please try again.')
    }
  }

  const handleViewTask = (task: Task) => {
    setViewingTask(task)
    setShowViewModal(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditModal(true)
  }

  const handleUpdateTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    if (!editingTask) return
    
    try {
      const userId = user?.id || 'demo-user'
      const updatedTaskData = {
        ...editingTask,
        ...taskData
      }
      
      // Update in data service first
      await dataService.updateTask(userId, updatedTaskData)
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? updatedTaskData : task
      ))
      
      console.log('Task updated successfully:', updatedTaskData)
      
      // Close modal and reset editing task
      setShowEditModal(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task. Please try again.')
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }
    
    try {
      const userId = user?.id || 'demo-user'
      
      // Delete from data service first
      await dataService.deleteTask(userId, id)
      
      // Remove from local state
      setTasks(tasks.filter(t => t.id !== id))
      
      console.log('Task deleted successfully:', id)
    } catch (error) {
      console.error('Error deleting task:', error)
      // Show error message to user
      alert('Failed to delete task. Please try again.')
    }
  }

  const handleToggleSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(tasks.map(t => t.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedTasks.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedTasks.length} selected task(s)? This action cannot be undone.`)) {
      return
    }
    
    try {
      const userId = user?.id || 'demo-user'
      
      // Delete selected tasks
      const deletePromises = selectedTasks.map(taskId => dataService.deleteTask(userId, taskId))
      await Promise.all(deletePromises)
      
      // Remove from local state
      setTasks(tasks.filter(t => !selectedTasks.includes(t.id)))
      
      // Clear selection
      setSelectedTasks([])
      
      console.log('Selected tasks deleted successfully')
      alert(`Successfully deleted ${deletePromises.length} task(s)`)
    } catch (error) {
      console.error('Error deleting selected tasks:', error)
      alert('Failed to delete some tasks. Please try again.')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const userId = user?.id || 'demo-user'
      const taskToUpdate = tasks.find(task => task.id === id)
      
      if (!taskToUpdate) {
        console.error('Task not found:', id)
        return
      }

      // Validate status value - only allow valid database values
      const validStatuses = ['todo', 'in_progress', 'completed']
      if (!validStatuses.includes(newStatus)) {
        console.error('Invalid status value:', newStatus)
        alert(`Invalid status: ${newStatus}. Only todo, in_progress, and completed are allowed for drag & drop.`)
        return
      }
      
      // Create clean task object without nested objects
      const updatedTask: any = {
        id: taskToUpdate.id,
        title: taskToUpdate.title,
        description: taskToUpdate.description || '',
        status: newStatus,
        priority: taskToUpdate.priority,
        due_date: taskToUpdate.due_date || null,
        project_id: taskToUpdate.project_id,
        assignee_id: taskToUpdate.assignee_id,
        created_at: taskToUpdate.created_at
      }

      // Handle completed_at field
      if (newStatus === 'completed') {
        updatedTask.completed_at = new Date().toISOString()
      } else {
        updatedTask.completed_at = null
      }

      // Add optional fields if they exist
      if (taskToUpdate.ai_priority_score !== undefined) {
        updatedTask.ai_priority_score = taskToUpdate.ai_priority_score
      }
      if (taskToUpdate.is_ai_generated !== undefined) {
        updatedTask.is_ai_generated = taskToUpdate.is_ai_generated
      }
      if (taskToUpdate.estimated_hours !== undefined) {
        updatedTask.estimated_hours = taskToUpdate.estimated_hours
      }
      if (taskToUpdate.actual_hours !== undefined) {
        updatedTask.actual_hours = taskToUpdate.actual_hours
      }
      if (taskToUpdate.tags !== undefined) {
        updatedTask.tags = taskToUpdate.tags
      }
      
      console.log('Updating task with data:', updatedTask)
      
      // Update in data service first
      await dataService.updateTask(userId, updatedTask)
      
      // Update local state (with projects object for display)
      setTasks(tasks.map(task => 
        task.id === id ? { ...updatedTask, projects: task.projects, updated_at: new Date().toISOString() } : task
      ))
      
      console.log('Task status updated successfully:', id, newStatus)
    } catch (error) {
      console.error('Error updating task status:', error)
      // Show error message to user
      alert('Failed to update task status. Please try again.')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(task => task.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: any) => {
    const { over } = event
    if (over && over.id !== activeTask?.status) {
      setOverColumn(over.id as string)
    } else {
      setOverColumn(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setOverColumn(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    console.log('Drag end - Active ID:', taskId, 'Over ID:', newStatus)
    console.log('Active data:', active)
    console.log('Over data:', over)

    // Validate that over.id is a valid status
    const validStatuses = ['todo', 'in_progress', 'completed']
    if (!validStatuses.includes(newStatus)) {
      console.error('Invalid drop target:', newStatus)
      return
    }

    // Only update if status actually changed
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== newStatus) {
      console.log('Updating task from', task.status, 'to', newStatus)
      handleStatusChange(taskId, newStatus)
    }
  }

  const handleDragCancel = () => {
    setActiveTask(null)
    setOverColumn(null)
  }

  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus)

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const todo = tasks.filter(t => t.status === 'todo').length
    
    return { total, completed, inProgress, todo }
  }

  const stats = getTaskStats()

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
          <p className="text-gray-600">You need to be logged in to access tasks.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-2">Smart prioritization active - overdue and urgent tasks auto-promoted</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedTasks.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
                Delete Selected ({selectedTasks.length})
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Task
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
          {tasks.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTasks.length === tasks.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">Select All</span>
            </label>
          )}
          <span>{tasks.length} tasks shown</span>
          <span>{tasks.filter(t => t.priority === 'high').length} auto-prioritized</span>
          {selectedTasks.length > 0 && (
            <span className="text-blue-600 font-medium">{selectedTasks.length} selected</span>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>All Status</option>
              <option>To Do</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>All Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>All Projects</option>
              <option>Project 1</option>
              <option>FO Summit</option>
            </select>
          </div>
        </div>

        {/* Kanban Board with Drag & Drop */}
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DroppableColumn
                id="todo"
                title="To Do"
                count={stats.todo}
                tasks={tasks.filter(t => t.status === 'todo')}
                projects={projects}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                isOver={overColumn === 'todo'}
                selectedTasks={selectedTasks}
                onSelect={handleToggleSelect}
              />
              <DroppableColumn
                id="in_progress"
                title="In Progress"
                count={stats.inProgress}
                tasks={tasks.filter(t => t.status === 'in_progress')}
                projects={projects}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                isOver={overColumn === 'in_progress'}
                selectedTasks={selectedTasks}
                onSelect={handleToggleSelect}
              />
              <DroppableColumn
                id="completed"
                title="Completed"
                count={stats.completed}
                tasks={tasks.filter(t => t.status === 'completed')}
                projects={projects}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                isOver={overColumn === 'completed'}
                selectedTasks={selectedTasks}
                onSelect={handleToggleSelect}
              />
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90 transform rotate-2 scale-105">
                  <TaskCard
                    task={activeTask}
                    projects={projects}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    isDragging
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
          projects={projects}
        />

        <EditTaskModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingTask(null)
          }}
          onUpdate={handleUpdateTask}
          task={editingTask}
          projects={projects}
        />

        {/* Floating Action Buttons */}
        {/* <FloatingActionButtons /> */}
      </div>
    </div>
  )
}
