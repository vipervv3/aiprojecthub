'use client'

import { useState } from 'react'
import { Eye, Edit, Share, Trash2, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'

interface Project {
  id: string
  name: string
  description: string
  status: string
  progress: number
  budget_allocated: number
  budget_spent: number
  start_date: string
  due_date: string
  created_at: string
  updated_at: string
}

interface ProjectCardProps {
  project: Project
  onUpdate: (projectId: string, updates: Partial<Project>) => Promise<void>
  onDelete: (projectId: string) => Promise<void>
  index: number
}

export default function ProjectCard({ project, onUpdate, onDelete, index }: ProjectCardProps) {
  const [showActions, setShowActions] = useState(false)

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200'
    if (progress < 30) return 'bg-red-500'
    if (progress < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'M/d/yyyy')
  }

  const formatBudget = (amount: number) => {
    if (amount === 0) return '$0K'
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    return `$${Math.round(amount / 1000)}K`
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await onDelete(project.id)
    }
  }

  return (
    <div 
      className="card hover:shadow-lg transition-shadow animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-content">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {project.name}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className="badge badge-default text-xs">Owner</span>
              <span className={`badge ${getStatusColor(project.status)} text-xs`}>
                {project.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Created {formatDate(project.created_at)}
            </p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Eye className="h-4 w-4 mr-2" />
                    View Project
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Share className="h-4 w-4 mr-2" />
                    Share Project
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Info */}
        <div className="space-y-3 mb-4">
          {/* Members */}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span>1 member</span>
          </div>

          {/* Due Date */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Due: {formatDate(project.due_date)}</span>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{project.progress}% complete</span>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${getProgressColor(project.progress)}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Budget */}
          {project.budget_allocated > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Budget</span>
              <span className="text-gray-900 font-medium">
                {formatBudget(project.budget_spent)} / {formatBudget(project.budget_allocated)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button className="flex items-center text-sm text-primary hover:text-primary/80">
            <Eye className="h-4 w-4 mr-1" />
            View
          </button>
          
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Edit className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Share className="h-4 w-4" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}






















