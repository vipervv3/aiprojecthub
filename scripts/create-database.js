const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDatabase() {
  try {
    console.log('🔗 Connecting to Supabase...')
    
    // Test connection by trying to access auth
    const { data: users, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('❌ Failed to connect to Supabase:', authError.message)
      return
    }
    
    console.log('✅ Connected to Supabase successfully!')
    console.log(`📊 Found ${users.length} existing users`)
    
    // Create the database schema
    const schema = `
      -- Enable necessary extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Users table (extends auth.users)
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email VARCHAR UNIQUE NOT NULL,
        name VARCHAR NOT NULL,
        avatar_url TEXT,
        preferences JSONB DEFAULT '{}',
        timezone VARCHAR DEFAULT 'UTC',
        notification_preferences JSONB DEFAULT '{
          "email_daily_summary": true,
          "smart_alerts": true,
          "morning_notifications": true,
          "push_notifications": true,
          "morning_notification_time": "08:00"
        }',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Projects table
      CREATE TABLE IF NOT EXISTS public.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        status VARCHAR DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        due_date TIMESTAMP WITH TIME ZONE,
        owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        team_members UUID[] DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Tasks table
      CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        description TEXT,
        status VARCHAR DEFAULT 'todo',
        priority VARCHAR DEFAULT 'medium',
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        due_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Meetings table
      CREATE TABLE IF NOT EXISTS public.meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        location VARCHAR,
        meeting_url TEXT,
        organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        attendees UUID[] DEFAULT '{}',
        status VARCHAR DEFAULT 'scheduled',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Activity log table
      CREATE TABLE IF NOT EXISTS public.activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        action VARCHAR NOT NULL,
        entity_type VARCHAR NOT NULL,
        entity_id UUID,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Notifications table
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title VARCHAR NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_organizer_id ON public.meetings(organizer_id);
      CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
      
      -- Enable Row Level Security
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies
      CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
      CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = ANY(team_members));
      CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
      CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);
      CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = owner_id);
      
      CREATE POLICY "Users can view assigned tasks" ON public.tasks FOR SELECT USING (auth.uid() = assignee_id OR auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id));
      CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = assignee_id OR auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id));
      CREATE POLICY "Users can update assigned tasks" ON public.tasks FOR UPDATE USING (auth.uid() = assignee_id OR auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id));
      CREATE POLICY "Users can delete assigned tasks" ON public.tasks FOR DELETE USING (auth.uid() = assignee_id OR auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id));
      
      CREATE POLICY "Users can view own meetings" ON public.meetings FOR SELECT USING (auth.uid() = organizer_id OR auth.uid() = ANY(attendees));
      CREATE POLICY "Users can create meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = organizer_id);
      CREATE POLICY "Users can update own meetings" ON public.meetings FOR UPDATE USING (auth.uid() = organizer_id);
      CREATE POLICY "Users can delete own meetings" ON public.meetings FOR DELETE USING (auth.uid() = organizer_id);
      
      CREATE POLICY "Users can view own activity" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
    `
    
    console.log('📝 Creating database schema...')
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          const { error } = await supabase.rpc('exec', { sql: statement })
          if (error) {
            console.warn(`⚠️  Warning for statement ${i + 1}:`, error.message)
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.warn(`⚠️  Warning for statement ${i + 1}:`, err.message)
        }
      }
    }
    
    console.log('🎉 Database setup completed!')
    console.log('📋 Next steps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Authentication > Users')
    console.log('3. Try registering a new user in your app')
    console.log('4. Check the Tables section to see your new tables')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
  }
}

// Run the setup
createDatabase()