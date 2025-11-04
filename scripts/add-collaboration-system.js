/**
 * Migration script to add collaboration system
 * This creates the project_members table and updates RLS policies
 * 
 * Run with: node scripts/add-collaboration-system.js
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function runMigration() {
  console.log('🚀 Starting collaboration system migration...\n')

  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
  }

  console.log('📝 Supabase URL:', supabaseUrl)
  console.log('')

  // Read SQL file
  const sqlFilePath = path.join(__dirname, 'add-collaboration-system.sql')
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')

  // Split SQL by statement (basic split on semicolons)
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`)

  // Execute each statement
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    const statementPreview = statement.substring(0, 80).replace(/\s+/g, ' ') + '...'
    
    console.log(`[${i + 1}/${statements.length}] Executing: ${statementPreview}`)

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: statement + ';' })
      })

      // Try alternative endpoint if first one doesn't work
      if (!response.ok) {
        const postgrestUrl = `${supabaseUrl}/rest/v1/`
        const response2 = await fetch(postgrestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.pgrst.object+json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ query: statement + ';' })
        })

        if (!response2.ok) {
          console.log(`⚠️  Warning: Could not execute via API (this is normal)`)
          console.log(`   Please run the SQL manually in Supabase SQL Editor`)
        } else {
          console.log('✅ Success')
          successCount++
        }
      } else {
        console.log('✅ Success')
        successCount++
      }
    } catch (error) {
      console.log(`⚠️  Warning: ${error.message}`)
      errorCount++
    }
    console.log('')
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary:')
  console.log('='.repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`⚠️  Warnings: ${errorCount}`)
  console.log('='.repeat(60))

  console.log('\n📝 IMPORTANT: Manual SQL Execution Required')
  console.log('='.repeat(60))
  console.log('Due to Supabase API limitations, please follow these steps:')
  console.log('')
  console.log('1. Open Supabase Dashboard: https://app.supabase.com')
  console.log('2. Navigate to your project')
  console.log('3. Go to SQL Editor')
  console.log('4. Open and run: scripts/add-collaboration-system.sql')
  console.log('')
  console.log('The SQL file contains all necessary migrations for:')
  console.log('  • Creating project_members table')
  console.log('  • Setting up Row Level Security policies')
  console.log('  • Adding collaboration permissions')
  console.log('  • Migrating existing projects')
  console.log('='.repeat(60))
  console.log('')
  console.log('✨ After running the SQL, your collaboration system will be ready!')
  console.log('')
}

// Run migration
runMigration()
  .then(() => {
    console.log('🎉 Migration script completed!')
    console.log('')
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })







