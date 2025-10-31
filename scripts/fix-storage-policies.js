#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://xekyfsnxrnfkdvrcsiye.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'
)

async function fixStoragePolicies() {
  console.log('🔧 Fixing Storage Policies...\n')
  
  // SQL to fix storage policies
  const sql = `
-- Drop existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%meeting%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Create permissive policy
CREATE POLICY "Allow all operations for meeting recordings"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'meeting-recordings')
WITH CHECK (bucket_id = 'meeting-recordings');

-- Ensure bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'meeting-recordings';
`

  // Try via REST API using service role key
  try {
    const response = await fetch('https://xekyfsnxrnfkdvrcsiye.supabase.co/rest/v1/rpc/exec', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    })
    
    console.log('Response status:', response.status)
    const result = await response.text()
    console.log('Response:', result)
    
  } catch (error) {
    console.log('API method failed:', error.message)
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('\n📋 MANUAL SETUP REQUIRED')
  console.log('\nPlease run this in Supabase SQL Editor:')
  console.log('https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql/new')
  console.log('\n' + '='.repeat(70))
  console.log(sql)
  console.log('='.repeat(70))
  console.log('\nAfter running: HARD REFRESH browser (Ctrl+Shift+R)')
}

fixStoragePolicies()




