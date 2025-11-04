import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

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


