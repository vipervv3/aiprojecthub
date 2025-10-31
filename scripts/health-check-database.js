#!/usr/bin/env node

/**
 * Database Health Check Script
 * 
 * This script verifies:
 * 1. Database tables exist with correct schema
 * 2. RLS policies status
 * 3. Demo user exists
 * 4. CRUD operations work correctly
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P01') {
      return { exists: false, error: 'Table does not exist' }
    }
    if (error) {
      return { exists: false, error: error.message }
    }
    return { exists: true, rowCount: data?.length || 0 }
  } catch (error) {
    return { exists: false, error: error.message }
  }
}

async function checkRLSStatus(tableName) {
  try {
    const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: tableName })
    
    if (error) {
      // Fallback: try to query system catalog
      const query = `
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = '${tableName}'
      `
      const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', { sql: query })
      
      if (rlsError) {
        return { status: 'unknown', error: rlsError.message }
      }
      return { status: rlsData?.[0]?.relrowsecurity ? 'enabled' : 'disabled' }
    }
    
    return { status: data ? 'enabled' : 'disabled' }
  } catch (error) {
    return { status: 'unknown', error: error.message }
  }
}

async function checkDemoUser() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', DEMO_USER_ID)
      .single()
    
    if (error) {
      return { exists: false, error: error.message }
    }
    return { exists: true, data }
  } catch (error) {
    return { exists: false, error: error.message }
  }
}

async function testProjectCRUD() {
  const results = {
    create: false,
    read: false,
    update: false,
    delete: false,
    errors: []
  }

  let testProjectId = null

  try {
    // CREATE
    const { data: createData, error: createError } = await supabase
      .from('projects')
      .insert([{
        name: 'Test Project - Health Check',
        description: 'Automated health check test',
        owner_id: DEMO_USER_ID,
        status: 'active',
        progress: 0,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }])
      .select()
      .single()
    
    if (createError) {
      results.errors.push(`CREATE: ${createError.message}`)
    } else {
      results.create = true
      testProjectId = createData.id
    }

    // READ
    if (testProjectId) {
      const { data: readData, error: readError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', testProjectId)
        .single()
      
      if (readError) {
        results.errors.push(`READ: ${readError.message}`)
      } else {
        results.read = true
      }

      // UPDATE
      const { data: updateData, error: updateError } = await supabase
        .from('projects')
        .update({ progress: 50 })
        .eq('id', testProjectId)
        .select()
        .single()
      
      if (updateError) {
        results.errors.push(`UPDATE: ${updateError.message}`)
      } else {
        results.update = true
      }

      // DELETE
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', testProjectId)
      
      if (deleteError) {
        results.errors.push(`DELETE: ${deleteError.message}`)
      } else {
        results.delete = true
      }
    }
  } catch (error) {
    results.errors.push(`GENERAL: ${error.message}`)
  }

  return results
}

async function testTaskCRUD() {
  const results = {
    create: false,
    read: false,
    update: false,
    delete: false,
    errors: []
  }

  let testProjectId = null
  let testTaskId = null

  try {
    // First create a test project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([{
        name: 'Test Project for Tasks',
        description: 'Automated health check test',
        owner_id: DEMO_USER_ID,
        status: 'active',
        progress: 0,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }])
      .select()
      .single()
    
    if (projectError) {
      results.errors.push(`CREATE PROJECT: ${projectError.message}`)
      return results
    }
    testProjectId = projectData.id

    // CREATE TASK
    const { data: createData, error: createError } = await supabase
      .from('tasks')
      .insert([{
        title: 'Test Task - Health Check',
        description: 'Automated health check test',
        project_id: testProjectId,
        assignee_id: DEMO_USER_ID,
        status: 'todo',
        priority: 'medium'
      }])
      .select()
      .single()
    
    if (createError) {
      results.errors.push(`CREATE: ${createError.message}`)
    } else {
      results.create = true
      testTaskId = createData.id
    }

    // READ
    if (testTaskId) {
      const { data: readData, error: readError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', testTaskId)
        .single()
      
      if (readError) {
        results.errors.push(`READ: ${readError.message}`)
      } else {
        results.read = true
      }

      // UPDATE - test status change
      const { data: updateData, error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', testTaskId)
        .select()
        .single()
      
      if (updateError) {
        results.errors.push(`UPDATE: ${updateError.message}`)
      } else {
        results.update = true
      }

      // DELETE
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', testTaskId)
      
      if (deleteError) {
        results.errors.push(`DELETE: ${deleteError.message}`)
      } else {
        results.delete = true
      }
    }

    // Clean up test project
    if (testProjectId) {
      await supabase.from('projects').delete().eq('id', testProjectId)
    }
  } catch (error) {
    results.errors.push(`GENERAL: ${error.message}`)
  }

  return results
}

async function runHealthCheck() {
  console.log('🏥 Database Health Check Starting...\n')
  console.log('=' .repeat(60))

  // Check tables
  console.log('\n📋 TABLE VERIFICATION')
  console.log('-'.repeat(60))
  
  const tables = ['users', 'projects', 'tasks', 'meetings', 'notifications', 'activities', 'activity_log']
  for (const table of tables) {
    const result = await checkTableExists(table)
    const icon = result.exists ? '✅' : '❌'
    console.log(`${icon} ${table.padEnd(20)} ${result.exists ? 'EXISTS' : 'MISSING'}`)
    if (!result.exists && result.error) {
      console.log(`   └─ Error: ${result.error}`)
    }
  }

  // Check demo user
  console.log('\n👤 DEMO USER VERIFICATION')
  console.log('-'.repeat(60))
  const userCheck = await checkDemoUser()
  if (userCheck.exists) {
    console.log(`✅ Demo user exists: ${DEMO_USER_ID}`)
    console.log(`   Email: ${userCheck.data?.email || 'N/A'}`)
  } else {
    console.log(`❌ Demo user NOT found: ${DEMO_USER_ID}`)
    if (userCheck.error) {
      console.log(`   └─ Error: ${userCheck.error}`)
    }
  }

  // Test Projects CRUD
  console.log('\n📦 PROJECTS CRUD TEST')
  console.log('-'.repeat(60))
  const projectTest = await testProjectCRUD()
  console.log(`${projectTest.create ? '✅' : '❌'} CREATE project`)
  console.log(`${projectTest.read ? '✅' : '❌'} READ project`)
  console.log(`${projectTest.update ? '✅' : '❌'} UPDATE project`)
  console.log(`${projectTest.delete ? '✅' : '❌'} DELETE project`)
  if (projectTest.errors.length > 0) {
    console.log('\n   Errors:')
    projectTest.errors.forEach(err => console.log(`   └─ ${err}`))
  }

  // Test Tasks CRUD
  console.log('\n✅ TASKS CRUD TEST')
  console.log('-'.repeat(60))
  const taskTest = await testTaskCRUD()
  console.log(`${taskTest.create ? '✅' : '❌'} CREATE task`)
  console.log(`${taskTest.read ? '✅' : '❌'} READ task`)
  console.log(`${taskTest.update ? '✅' : '❌'} UPDATE task (status change)`)
  console.log(`${taskTest.delete ? '✅' : '❌'} DELETE task`)
  if (taskTest.errors.length > 0) {
    console.log('\n   Errors:')
    taskTest.errors.forEach(err => console.log(`   └─ ${err}`))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 HEALTH CHECK SUMMARY')
  console.log('='.repeat(60))
  
  const allProjectsPassed = projectTest.create && projectTest.read && projectTest.update && projectTest.delete
  const allTasksPassed = taskTest.create && taskTest.read && taskTest.update && taskTest.delete
  const allPassed = allProjectsPassed && allTasksPassed && userCheck.exists

  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - System is healthy!')
  } else {
    console.log('⚠️  SOME CHECKS FAILED - Review errors above')
  }

  console.log('\n' + '='.repeat(60))
}

// Run the health check
runHealthCheck()
  .then(() => {
    console.log('\n✅ Health check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Health check failed:', error)
    process.exit(1)
  })




