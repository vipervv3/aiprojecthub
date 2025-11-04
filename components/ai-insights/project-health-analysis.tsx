'use client'

import { useState, useEffect } from 'react'
import { Brain, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

interface Project {
  id: string
  name: string
  progress: number
  status: string
}

interface ProjectHealthAnalysisProps {
  insights: any[]
}

export default function ProjectHealthAnalysis({ insights }: ProjectHealthAnalysisProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, progress, status')
        .eq('owner_id', user?.id)
        .order('name')

      if (error) throw error

      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = () => {
    if (!selectedProject) return
    // TODO: Implement project health analysis
    console.log('Analyzing project:', selectedProject)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Project Health Analysis</h3>
        <p className="card-description">
          Get AI-powered insights about your project's health and performance
        </p>
      </div>
      
      <div className="card-content">
        {/* Project Selection */}
        <div className="mb-6">
          <label htmlFor="project-select" className="label">
            Select Project
          </label>
          <div className="relative">
            <select
              id="project-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input appearance-none pr-8"
              disabled={loading}
            >
              <option value="">Choose a project to analyze...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Analysis Button */}
        <button
          onClick={handleAnalyze}
          disabled={!selectedProject || loading}
          className="btn btn-primary w-full"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            'Analyze Project Health'
          )}
        </button>

        {/* Placeholder Content */}
        {!selectedProject && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-gray-500">Select a project to view AI insights</p>
          </div>
        )}

        {/* Analysis Results */}
        {selectedProject && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Analysis Results</h4>
            <p className="text-sm text-gray-600">
              Click "Analyze Project Health" to generate AI-powered insights for this project.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}






















