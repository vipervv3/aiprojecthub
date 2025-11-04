import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createAuthenticatedSupabaseClient } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Get authenticated user from token, not from query params
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use authenticated Supabase client (respects RLS)
    const supabase = createAuthenticatedSupabaseClient(request)

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    return NextResponse.json(projects || [])
  } catch (error) {
    console.error('Error in projects API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

