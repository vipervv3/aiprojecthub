'use client'

import { useState, useEffect } from 'react'
import { FolderOpen, ChevronDown, Check } from 'lucide-react'
import { dataService } from '@/lib/data-service'
import { useAuth } from '@/app/providers'

interface Project {
  id: string
  name: string
  description?: string
  status: string
}

interface ProjectSelectorProps {
  selectedProjectId?: string
  onSelectProject: (projectId: string) => void
  required?: boolean
  className?: string
}

export default function ProjectSelector({
  selectedProjectId,
  onSelectProject,
  required = false,
  className = ''
}: ProjectSelectorProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const userId = user?.id || 'demo-user'
      const projectsData = await dataService.getProjects(userId)
      setProjects(projectsData.filter((p: Project) => p.status === 'active'))
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Project {required && <span className="text-red-500">*</span>}
      </label>
      
      {loading ? (
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
          <p>No active projects found. Please create a project first.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Selected project display */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${selectedProjectId 
                ? 'border-blue-300 bg-blue-50 text-blue-900' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className={`h-4 w-4 ${selectedProjectId ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-sm">
                {selectedProject ? selectedProject.name : 'Choose a project...'}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              ></div>

              {/* Options */}
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(project.id)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full px-3 py-2 text-left flex items-center justify-between
                      transition-colors hover:bg-blue-50
                      ${selectedProjectId === project.id ? 'bg-blue-100' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FolderOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </div>
                        {project.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedProjectId === project.id && (
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="mt-1 text-xs text-gray-500">
        {required 
          ? 'A project must be selected before recording'
          : 'Link this recording to a project for better organization'
        }
      </p>
    </div>
  )
}

