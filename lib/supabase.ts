import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Get environment variables - fail fast if missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // Server-side: throw error
    throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  } else {
    // Client-side: log warning but don't throw (allows app to load)
    console.warn('⚠️ Missing Supabase environment variables. Some features may not work.')
  }
}

// Create authenticated browser client (respects RLS and user sessions)
// This client automatically includes the user's JWT token in requests
let supabase: any = null
let supabaseAdmin: any = null

// Only create clients if we have valid URLs
if (supabaseUrl && supabaseUrl.startsWith('http')) {
  try {
    // ✅ Use browser client with auth persistence for RLS to work
    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
    console.log('Supabase authenticated client created successfully')
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    supabase = null
  }

  try {
    // Admin client bypasses RLS (for server-side operations only)
    supabaseAdmin = createSupabaseClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    console.log('Supabase admin client created successfully')
  } catch (error) {
    console.warn('Failed to create Supabase admin client:', error)
    supabaseAdmin = null
  }
} else {
  console.warn('Invalid Supabase URL, skipping client creation')
}

// Function to create a Supabase client (for API routes)
// This uses the admin client to bypass RLS for server-side operations
export function createClient() {
  return supabaseAdmin || createSupabaseClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export { supabase, supabaseAdmin }


