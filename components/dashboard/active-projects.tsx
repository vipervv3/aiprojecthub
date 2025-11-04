'use client'

import { FolderOpen, Eye, Edit, Share, Trash2 } from 'lucide-react'

interface ActiveProjectsProps {
  projects: any[]
}

export default function ActiveProjects({ projects }: ActiveProjectsProps) {
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200'
    if (progress < 30) return 'bg-red-500'
    if (progress < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Active Projects</h3>
          <button className="text-sm text-primary hover:text-primary/80">
            View all
          </button>
        </div>
      </div>
      
      <div className="card-content">
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FolderOpen className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500">No active projects</p>
            <button className="btn btn-primary btn-sm mt-4">
              Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div key={project.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        {project.name}
                      </h4>
                      <span className={`badge ${
                        project.status === 'active' ? 'status-active' : 'status-completed'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Due: {formatDate(project.due_date)}</span>
                      <span>1 member</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-4">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Share className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}






















