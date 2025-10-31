'use client'

import { useState } from 'react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  DragOverEvent,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CheckCircle, Clock, Circle, MoreVertical, User } from 'lucide-react'
import TaskCard from './task-card'
import { format } from 'date-fns'

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

interface KanbanBoardProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, newStatus: string) => void
  onView?: (task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  selectedTasks?: string[]
  onSelectTask?: (taskId: string) => void
}

const columns = [
  {
    id: 'todo',
    title: 'To Do',
    icon: Circle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  }
]

// Droppable Column Component
function DroppableColumn({ 
  column, 
  tasks, 
  isOver,
  onView,
  onEdit,
  onDelete,
  selectedTasks,
  onSelectTask
}: { 
  column: typeof columns[0], 
  tasks: Task[], 
  isOver: boolean,
  onView?: (task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  selectedTasks?: string[]
  onSelectTask?: (taskId: string) => void
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`bg-white rounded-lg border-2 transition-all duration-200 ${
        isOver 
          ? 'border-blue-400 bg-blue-50 shadow-lg' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Column Header */}
      <div className={`p-4 border-b border-gray-200 ${column.bgColor} ${
        isOver ? 'bg-blue-100' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <column.icon className={`h-5 w-5 ${column.color}`} />
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
            <span className="bg-white text-gray-600 text-sm px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="p-4 min-h-[400px]">
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                isSelected={selectedTasks?.includes(task.id)}
                onSelect={onSelectTask}
              />
            ))}
            
            {tasks.length === 0 && (
              <div className={`text-center py-8 text-gray-500 transition-colors ${
                isOver ? 'text-blue-600' : ''
              }`}>
                <column.icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {isOver ? 'Drop task here' : 'No tasks'}
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export default function KanbanBoard({ tasks, onTaskUpdate, onView, onEdit, onDelete, selectedTasks, onSelectTask }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)

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

  // Custom collision detection that prioritizes columns over tasks
  const customCollisionDetection = (args: any) => {
    // First, check for pointer collision with columns
    const pointerCollisions = pointerWithin(args)
    const columnCollisions = pointerCollisions.filter((collision: any) => 
      ['todo', 'in_progress', 'completed'].includes(collision.id as string)
    )
    
    if (columnCollisions.length > 0) {
      console.log('🎯 Column collision detected:', columnCollisions[0].id)
      return columnCollisions
    }
    
    // If no column collision, use rect intersection
    const rectCollisions = rectIntersection(args)
    const columnRectCollisions = rectCollisions.filter((collision: any) => 
      ['todo', 'in_progress', 'completed'].includes(collision.id as string)
    )
    
    if (columnRectCollisions.length > 0) {
      console.log('🎯 Column rect collision detected:', columnRectCollisions[0].id)
      return columnRectCollisions
    }
    
    console.log('⚠️ No column collision, using default')
    return pointerCollisions
  }

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

  const handleDragCancel = () => {
    setActiveTask(null)
    setOverColumn(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setOverColumn(null)

    if (!over) {
      console.log('❌ No drop target detected')
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as string

    console.log('🎯 Drag End Event:', { taskId, overId: over.id, newStatus })

    // Validate the status
    const validStatuses = ['todo', 'in_progress', 'completed']
    if (!validStatuses.includes(newStatus)) {
      console.log('❌ Invalid drop target - not a valid column')
      return
    }

    // Only update if status actually changed
    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      console.log('❌ Task not found')
      return
    }

    if (task.status === newStatus) {
      console.log('⚠️ Status unchanged:', newStatus)
      return
    }

    console.log('✅ Status changed from', task.status, 'to', newStatus)
    console.log('📤 Calling onTaskUpdate:', { taskId, newStatus })
    onTaskUpdate(taskId, newStatus)
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const getColumnCount = (status: string) => {
    return getTasksByStatus(status).length
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id)
          const isOver = overColumn === column.id

          return (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              isOver={isOver}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              selectedTasks={selectedTasks}
              onSelectTask={onSelectTask}
            />
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 transform rotate-2 scale-105">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}





