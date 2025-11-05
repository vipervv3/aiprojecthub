/**
 * Vercel CLI Script to Add Environment Variables
 * 
 * Prerequisites:
 * 1. Install Vercel CLI: npm i -g vercel
 * 2. Login: vercel login
 * 3. Link project: vercel link
 * 
 * Usage: node add-vercel-env-vars.js
 */

const { execSync } = require('child_process')

// All environment variables that need to be added
const envVars = {
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': 'https://xekyfsnxrnfkdvrcsiye.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w',
  
  // AI Services (REPLACE WITH YOUR ACTUAL KEYS)
  'GROQ_API_KEY': '[YOUR_GROQ_API_KEY_HERE]',
  'ASSEMBLYAI_API_KEY': '[YOUR_ASSEMBLYAI_API_KEY_HERE]',
  
  // Application
  'NEXT_PUBLIC_APP_URL': 'https://aiprojecthub.vercel.app',
}

// Environments to set for
const environments = ['production', 'preview', 'development']

console.log('🚀 Adding Environment Variables to Vercel\n')
console.log('='.repeat(60))

let successCount = 0
let errorCount = 0

for (const [key, value] of Object.entries(envVars)) {
  console.log(`\n📝 Adding: ${key}`)
  
  for (const env of environments) {
    try {
      // Escape the value for shell
      const escapedValue = value.replace(/'/g, "'\\''")
      
      // Use vercel env add command
      const command = `vercel env add ${key} ${env}`
      
      console.log(`   Setting for ${env}...`)
      
      // Note: This requires interactive input, so we'll just show the command
      console.log(`   Command: ${command}`)
      console.log(`   Value: ${value.substring(0, 20)}...${value.substring(value.length - 10)}`)
      
      successCount++
    } catch (error) {
      console.error(`   ❌ Error for ${env}:`, error.message)
      errorCount++
    }
  }
}

console.log('\n' + '='.repeat(60))
console.log('\n📊 Summary:')
console.log(`   ✅ Would add: ${successCount} variables`)
if (errorCount > 0) {
  console.log(`   ❌ Errors: ${errorCount}`)
}

console.log('\n⚠️  NOTE: Vercel CLI requires interactive input.')
console.log('   You need to manually add these via the Vercel dashboard:')
console.log('   https://vercel.com/vipervv3/aiprojecthub/settings/environment-variables')
console.log('\n   Or use the Vercel CLI interactively:')
console.log('   vercel env add GROQ_API_KEY production')
console.log('   (Then paste the value when prompted)')

