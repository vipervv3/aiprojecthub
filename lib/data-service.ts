// Data service for handling both Supabase and local storage data
import { supabase } from './supabase'

export interface Project {
  id: string
  name: string
  description: string
  status: string
  progress: number
  due_date?: string
  team_members?: string[]
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  project_id: string
  assignee_id?: string
  ai_priority_score?: number
  is_ai_generated?: boolean
  estimated_hours?: number
  actual_hours?: number
  tags?: any[]
  completed_at?: string | null
  created_at: string
  updated_at: string
  project?: { name: string }
  projects?: { name: string }
  assignee?: any
}

export interface Activity {
  id: string
  action: string
  entity_type: string
  entity_id: string
  user_id: string
  created_at: string
}

class DataService {
  private supabase: any = null

  constructor() {
    this.supabase = supabase
    console.log('DataService initialized with supabase:', !!this.supabase)
  }

  // Get projects data
  async getProjects(userId: string): Promise<Project[]> {
    console.log('Loading projects data for user:', userId)
    
    if (this.supabase) {
      try {
        // For demo purposes, use a fixed UUID for the demo user
        const ownerId = userId === 'demo-user' ? '550e8400-e29b-41d4-a716-446655440000' : userId
        
        const { data, error } = await this.supabase
          .from('projects')
          .select('*')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.warn('Failed to fetch projects from Supabase:', error)
        } else {
          console.log('Loaded projects from Supabase:', data?.length || 0)
          return data || []
        }
      } catch (error) {
        console.warn('Error fetching projects from Supabase:', error)
      }
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      const localProjects = localStorage.getItem('projects')
      if (localProjects) {
        try {
          const parsed = JSON.parse(localProjects)
          console.log('Loaded projects from local storage:', parsed.length)
          return parsed
        } catch (error) {
          console.warn('Failed to parse local projects:', error)
        }
      }
    }

    // Return empty array if no data available
    console.log('No projects found, returning empty array')
    return []
  }

  // Get tasks data
  async getTasks(userId: string): Promise<Task[]> {
    console.log('Loading tasks data for user:', userId)
    
    if (this.supabase) {
      try {
        // For demo purposes, use a fixed UUID for the demo user
        const assigneeId = userId === 'demo-user' ? '550e8400-e29b-41d4-a716-446655440000' : userId
        
        // ✅ Get user's projects first
        const { data: projects, error: projectsError } = await this.supabase
          .from('projects')
          .select('id')
          .eq('owner_id', userId)
        
        const projectIds = projects?.map(p => p.id) || []
        
        // ✅ Query tasks by assignee_id OR project_id (to include AI-generated tasks)
        // First, get tasks assigned to user
        const { data: tasksByAssignee, error: assigneeError } = await this.supabase
          .from('tasks')
          .select('*')
          .eq('assignee_id', assigneeId)
        
        // Then, get tasks in user's projects (if any projects exist)
        let tasksByProject: any[] = []
        if (projectIds.length > 0) {
          const { data: projectTasks, error: projectError } = await this.supabase
            .from('tasks')
            .select('*')
            .in('project_id', projectIds)
          
          if (!projectError && projectTasks) {
            tasksByProject = projectTasks
          }
        }
        
        // Combine and deduplicate tasks
        const allTasks = [...(tasksByAssignee || []), ...tasksByProject]
        const uniqueTasks = allTasks.filter((task, index, self) => 
          index === self.findIndex(t => t.id === task.id)
        )
        
        // Sort by created_at
        uniqueTasks.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        const data = uniqueTasks
        const error = assigneeError
        
        if (error) {
          console.warn('Failed to fetch tasks from Supabase:', error)
        } else {
          console.log('Loaded tasks from Supabase:', data?.length || 0)
          console.log(`   Tasks by assignee: ${data?.filter(t => t.assignee_id === assigneeId).length || 0}`)
          console.log(`   Tasks by project: ${data?.filter(t => t.project_id && projectIds.includes(t.project_id)).length || 0}`)
          return data || []
        }
      } catch (error) {
        console.warn('Error fetching tasks from Supabase:', error)
      }
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      const localTasks = localStorage.getItem('tasks')
      if (localTasks) {
        try {
          const parsed = JSON.parse(localTasks)
          console.log('Loaded tasks from local storage:', parsed.length)
          return parsed
        } catch (error) {
          console.warn('Failed to parse local tasks:', error)
        }
      }
    }

    // Return empty array if no data available
    console.log('No tasks found, returning empty array')
    return []
  }

  // Get activity data
  async getActivities(userId: string): Promise<Activity[]> {
    console.log('Loading activities data for user:', userId)
    
    if (this.supabase) {
      try {
        // For demo purposes, use a fixed UUID for the demo user
        const userIdToUse = userId === 'demo-user' ? '550e8400-e29b-41d4-a716-446655440000' : userId
        
        const { data, error } = await this.supabase
          .from('activity_log')  // ✅ Fixed: was 'activities', should be 'activity_log'
          .select('*')
          .eq('user_id', userIdToUse)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) {
          console.warn('Failed to fetch activities from Supabase:', error)
        } else {
          console.log('Loaded activities from Supabase:', data?.length || 0)
          return data || []
        }
      } catch (error) {
        console.warn('Error fetching activities from Supabase:', error)
      }
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      const localActivities = localStorage.getItem('activities')
      if (localActivities) {
        try {
          const parsed = JSON.parse(localActivities)
          console.log('Loaded activities from local storage:', parsed.length)
          return parsed
        } catch (error) {
          console.warn('Failed to parse local activities:', error)
        }
      }
    }

    // Return empty array if no data available
    console.log('No activities found, returning empty array')
    return []
  }

  // Save data to local storage as backup
  saveToLocalStorage(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save to local storage:', error)
    }
  }

  // Create a new project
  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<Project> {
    console.log('Creating project for user:', userId)
    
    if (this.supabase) {
      try {
        // For demo purposes, use a fixed UUID for the demo user
        const ownerId = userId === 'demo-user' ? '550e8400-e29b-41d4-a716-446655440000' : userId
        
        // Prepare data for insertion, filtering out undefined values (except due_date which is now required)
        const insertData = {
          ...projectData,
          owner_id: ownerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Remove undefined values to avoid database errors (except due_date which is now required)
        Object.keys(insertData).forEach(key => {
          if ((insertData as any)[key] === undefined && key !== 'due_date') {
            delete (insertData as any)[key]
          }
        })

        const { data, error } = await this.supabase
          .from('projects')
          .insert([insertData])
          .select()
          .single()
        
        if (error) {
          console.warn('Failed to create project in Supabase:', error)
          throw error
        } else {
          console.log('Project created in Supabase:', data)
          return data
        }
      } catch (error) {
        console.warn('Error creating project in Supabase:', error)
        throw error
      }
    }

    // Fallback to local storage
    const newProject: Project = {
      id: Date.now().toString(),
      ...projectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (typeof window !== 'undefined') {
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]')
      existingProjects.push(newProject)
      localStorage.setItem('projects', JSON.stringify(existingProjects))
    }
    
    console.log('Project created in local storage:', newProject)
    return newProject
  }

  // Update a project
  async updateProject(userId: string, project: Project): Promise<Project> {
    console.log('Updating project:', project.id)
    
    if (this.supabase) {
      try {
        // For demo purposes, use a fixed UUID for the demo user
        const ownerId = userId === 'demo-user' ? '550e8400-e29b-41d4-a716-446655440000' : userId
        
        const { data, error } = await this.supabase
          .from('projects')
          .update({
            ...project,
            updated_at: new Date().toISOString()
          })
          .eq('id', project.id)
          .eq('owner_id', ownerId)
          .select()
          .single()
        
        if (error) {
          console.warn('Failed to update project in Supabase:', error)
          throw error
        } else {
          console.log('Project updated in Supabase:', data)
          return data
        }
      } catch (error) {
        console.warn('Error updating project in Supabase:', error)
        throw error
      }
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]')
      const updatedProjects = existingProjects.map((p: Project) => 
        p.id === project.id ? { ...project, updated_at: new Date().toISOString() } : p
      )
      localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }
    
    console.log('Project updated in local storage:', project)
    return project
  }

  // Delete a project
  async deleteProject(userId: string, projectId: string): Promise<void> {
    console.log('Deleting project:', projectId)
    
    if (this.supabase) {
      try {
        // For demo purposes, use a fixed UUID for the demo user
        const ownerId = userId === 'demo-user' ? '550e8400-e29b-41d4-a716-446655440000' : userId
        
        const { error } = await this.supabase
          .from('projects')
          .delete()
          .eq('id', projectId)
          .eq('owner_id', ownerId)
        
        if (error) {
          console.warn('Failed to delete project in Supabase:', error)
          throw error
        } else {
          console.log('Project deleted from Supabase')
        }
      } catch (error) {
        console.warn('Error deleting project in Supabase:', error)
        throw error
      }
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]')
      const filteredProjects = existingProjects.filter((p: Project) => p.id !== projectId)
      localStorage.setItem('projects', JSON.stringify(filteredProjects))
    }
    
    console.log('Project deleted from local storage')
  }

  // Create a new task
  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<Task> {
    console.log('Creating task for user:', userId)
    
    if (this.supabase) {
      try {
        // For demo purposes, use a fixed UUID for the demo user
        const assigneeId = userId === 'demo-user' ? '550e8400-e29b-41d4-a716-446655440000' : userId
        
        // Prepare data for insertion, filtering out undefined values
        const insertData = {
          ...taskData,
          assignee_id: assigneeId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Remove undefined values to avoid database errors
        Object.keys(insertData).forEach(key => {
          if ((insertData as any)[key] === undefined) {
            delete (insertData as any)[key]
          }
        })

        const { data, error } = await this.supabase
          .from('tasks')
          .insert([insertData])
          .select()
          .single()
        
        if (error) {
          console.warn('Failed to create task in Supabase:', error)
          throw error
        } else {
          console.log('Task created in Supabase:', data)
          return data
        }
      } catch (error) {
        console.warn('Error creating task in Supabase:', error)
        throw error
      }
    }

    // Fallback to local storage
    const newTask: Task = {
      id: Date.now().toString(),
      ...taskData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (typeof window !== 'undefined') {
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      existingTasks.push(newTask)
      localStorage.setItem('tasks', JSON.stringify(existingTasks))
    }
    
    console.log('Task created in local storage:', newTask)
    return newTask
  }

  // Update a task
  async updateTask(userId: string, task: Task): Promise<Task> {
    console.log('Updating task:', task.id)
    
    if (this.supabase) {
      try {
        // Only send fields that should be updated (exclude nested objects and invalid fields)
        const updateData: any = {
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          due_date: task.due_date || null,
          project_id: task.project_id,
          updated_at: new Date().toISOString()
        }

        // Add optional fields if they exist
        if (task.ai_priority_score !== undefined) updateData.ai_priority_score = task.ai_priority_score
        if (task.is_ai_generated !== undefined) updateData.is_ai_generated = task.is_ai_generated
        if (task.estimated_hours !== undefined) updateData.estimated_hours = task.estimated_hours
        if (task.actual_hours !== undefined) updateData.actual_hours = task.actual_hours
        if (task.tags !== undefined) updateData.tags = task.tags
        if (task.completed_at !== undefined) updateData.completed_at = task.completed_at

        console.log('Update data being sent:', JSON.stringify(updateData, null, 2))
        console.log('Status value:', updateData.status, 'Type:', typeof updateData.status)

        const { data, error } = await this.supabase
          .from('tasks')
          .update(updateData)
          .eq('id', task.id)
          .eq('assignee_id', userId)
          .select()
          .single()
        
        if (error) {
          console.warn('Failed to update task in Supabase:', error)
          throw error
        } else {
          console.log('Task updated in Supabase:', data)
          return data
        }
      } catch (error) {
        console.warn('Error updating task in Supabase:', error)
        throw error
      }
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      const updatedTasks = existingTasks.map((t: Task) => 
        t.id === task.id ? { ...task, updated_at: new Date().toISOString() } : t
      )
      localStorage.setItem('tasks', JSON.stringify(updatedTasks))
    }
    
    console.log('Task updated in local storage:', task)
    return task
  }

  // Delete a task
  async deleteTask(userId: string, taskId: string): Promise<void> {
    console.log('Deleting task:', taskId)
    
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('assignee_id', userId)
        
        if (error) {
          console.warn('Failed to delete task in Supabase:', error)
          throw error
        } else {
          console.log('Task deleted from Supabase')
        }
      } catch (error) {
        console.warn('Error deleting task in Supabase:', error)
        throw error
      }
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      const filteredTasks = existingTasks.filter((t: Task) => t.id !== taskId)
      localStorage.setItem('tasks', JSON.stringify(filteredTasks))
    }
    
    console.log('Task deleted from local storage')
  }

  // Update user profile
  async updateUserProfile(userId: string, profileData: any): Promise<{ error?: any }> {
    console.log('Updating user profile:', userId, profileData)
    
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('users')
          .update(profileData)
          .eq('id', userId)
        
        if (error) {
          console.warn('Failed to update user profile in Supabase:', error)
          return { error }
        }
        
        console.log('User profile updated in Supabase')
        return {}
      } catch (error) {
        console.warn('Error updating user profile in Supabase:', error)
        return { error }
      }
    }

    // Fallback to local storage for profile data
    if (typeof window !== 'undefined') {
      try {
        const existingProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
        const updatedProfile = { ...existingProfile, ...profileData, updated_at: new Date().toISOString() }
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
        console.log('User profile updated in local storage')
        return {}
      } catch (error) {
        console.error('Error updating profile in local storage:', error)
        return { error }
      }
    }
    
    return {}
  }
}

export const dataService = new DataService()
