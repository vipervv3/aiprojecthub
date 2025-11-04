/**
 * Authentication Utilities for API Routes
 * Ensures secure user authentication and authorization
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Get authenticated user from Next.js API request
 * Returns null if user is not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get the authorization token from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Get the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Create an authenticated Supabase client for API routes
 * This client will respect Row Level Security policies
 */
export function createAuthenticatedSupabaseClient(request: NextRequest) {
  // Get the authorization token from the request
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided')
  }

  const token = authHeader.replace('Bearer ', '')

  // Create Supabase client with the user's token
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
}

/**
 * Verify that the current user owns a project
 */
export async function verifyProjectOwnership(
  request: NextRequest,
  projectId: string
): Promise<{ authorized: boolean; userId?: string }> {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return { authorized: false }
    }

    const supabase = createAuthenticatedSupabaseClient(request)
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return { authorized: false }
    }

    return {
      authorized: project.owner_id === user.id,
      userId: user.id
    }
  } catch (error) {
    console.error('Error verifying project ownership:', error)
    return { authorized: false }
  }
}

/**
 * Verify that the current user owns a task (through project ownership)
 */
export async function verifyTaskOwnership(
  request: NextRequest,
  taskId: string
): Promise<{ authorized: boolean; userId?: string }> {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return { authorized: false }
    }

    const supabase = createAuthenticatedSupabaseClient(request)
    
    // Get task with project information
    const { data: task, error } = await supabase
      .from('tasks')
      .select('project_id, projects(owner_id)')
      .eq('id', taskId)
      .single()

    if (error || !task) {
      return { authorized: false }
    }

    // Check if user owns the project
    const projectOwnerId = (task.projects as any)?.owner_id
    
    return {
      authorized: projectOwnerId === user.id,
      userId: user.id
    }
  } catch (error) {
    console.error('Error verifying task ownership:', error)
    return { authorized: false }
  }
}

