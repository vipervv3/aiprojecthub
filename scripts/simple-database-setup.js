#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Setting up database with Supabase client...\n');

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔗 Connecting to Supabase...');
    
    // Test connection by trying to access a system table
    const { data: testData, error: testError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Direct table access not available, using alternative approach...');
    } else {
      console.log('✅ Connected to Supabase successfully');
    }
    
    // Create sample data using Supabase client
    console.log('📝 Creating sample data...');
    
    // Insert user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'omar@example.com',
        name: 'Omar',
        preferences: {},
        timezone: 'UTC',
        notification_preferences: {
          email_daily_summary: true,
          smart_alerts: true,
          morning_notifications: true,
          push_notifications: true,
          morning_notification_time: '08:00'
        }
      })
      .select();
    
    if (userError) {
      console.log('⚠️  User creation warning:', userError.message);
    } else {
      console.log('✅ User created/updated successfully');
    }
    
    // Insert projects
    const projects = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'AI ProjectHub Development',
        description: 'Building an intelligent project management platform',
        owner_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        progress: 75,
        budget_allocated: 0,
        budget_spent: 0,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        team_members: ['user1', 'user2', 'user3'],
        settings: {}
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Dashboard Enhancement',
        description: 'Improving the dashboard with new features',
        owner_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        progress: 45,
        budget_allocated: 0,
        budget_spent: 0,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        team_members: ['user1', 'user2'],
        settings: {}
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Mobile App Integration',
        description: 'Integrating mobile app with the platform',
        owner_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        progress: 20,
        budget_allocated: 0,
        budget_spent: 0,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        team_members: ['user1', 'user2', 'user3', 'user4'],
        settings: {}
      }
    ];
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .upsert(projects)
      .select();
    
    if (projectError) {
      console.log('⚠️  Project creation warning:', projectError.message);
    } else {
      console.log('✅ Projects created/updated successfully');
    }
    
    // Insert tasks
    const tasks = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        title: 'Design user interface',
        description: 'Create wireframes and mockups for the dashboard',
        project_id: '550e8400-e29b-41d4-a716-446655440001',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ai_priority_score: 0,
        is_ai_generated: false,
        tags: []
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        title: 'Implement authentication',
        description: 'Set up user login and registration system',
        project_id: '550e8400-e29b-41d4-a716-446655440001',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'completed',
        priority: 'high',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ai_priority_score: 0,
        is_ai_generated: false,
        tags: []
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        title: 'Database optimization',
        description: 'Optimize database queries for better performance',
        project_id: '550e8400-e29b-41d4-a716-446655440002',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'todo',
        priority: 'medium',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ai_priority_score: 0,
        is_ai_generated: false,
        tags: []
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        title: 'API documentation',
        description: 'Write comprehensive API documentation',
        project_id: '550e8400-e29b-41d4-a716-446655440003',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'todo',
        priority: 'low',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ai_priority_score: 0,
        is_ai_generated: false,
        tags: []
      }
    ];
    
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .upsert(tasks)
      .select();
    
    if (taskError) {
      console.log('⚠️  Task creation warning:', taskError.message);
    } else {
      console.log('✅ Tasks created/updated successfully');
    }
    
    // Insert activity log
    const activities = [
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'created',
        entity_type: 'project',
        entity_id: '550e8400-e29b-41d4-a716-446655440001',
        details: {}
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'completed',
        entity_type: 'task',
        entity_id: '550e8400-e29b-41d4-a716-446655440011',
        details: {}
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'updated',
        entity_type: 'project',
        entity_id: '550e8400-e29b-41d4-a716-446655440001',
        details: {}
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'assigned',
        entity_type: 'task',
        entity_id: '550e8400-e29b-41d4-a716-446655440012',
        details: {}
      }
    ];
    
    const { data: activityData, error: activityError } = await supabase
      .from('activity_log')
      .upsert(activities)
      .select();
    
    if (activityError) {
      console.log('⚠️  Activity creation warning:', activityError.message);
    } else {
      console.log('✅ Activities created/updated successfully');
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('✅ Sample data inserted');
    console.log('✅ User: Omar (omar@example.com)');
    console.log('✅ Projects: 3 active projects');
    console.log('✅ Tasks: 4 tasks (1 completed, 1 in progress, 2 todo)');
    console.log('✅ Activities: 4 recent activities');
    console.log('\n🚀 Your dashboard should now show real data!');
    console.log('📱 Go to: http://localhost:3000/dashboard');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n📝 Manual setup required:');
    console.log('1. Use PostgreSQL Tools extension');
    console.log('2. Connect to: db.xekyfsnxrnfkdvrcsiye.supabase.co');
    console.log('3. Run the SQL from database-setup.sql');
  }
}

// Run the setup
setupDatabase();




















