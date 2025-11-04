'use client'

import { useState } from 'react'
import ProjectCard from './project-card'
import CreateProjectModal from './create-project-modal'
import { FolderOpen } from 'lucide-react'

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

interface ProjectGridProps {
  projects: Project[]
  onCreateProject: (projectData: Partial<Project>) => Promise<Project>
  onUpdateProject: (projectId: string, updates: Partial<Project>) => Promise<void>
  onDeleteProject: (projectId: string) => Promise<void>
}

export default function ProjectGrid({ 
  projects, 
  onCreateProject, 
  onUpdateProject, 
  onDeleteProject 
}: ProjectGridProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      await onCreateProject(projectData)
      setShowCreateModal(false)
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <FolderOpen className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500 mb-6">Get started by creating your first project</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Create Project
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            onUpdate={onUpdateProject}
            onDelete={onDeleteProject}
            index={index}
          />
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </>
  )
}






















