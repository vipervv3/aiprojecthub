# AI ProjectHub - Complete Rebuild Prompt

## 🎯 Project Overview
Rebuild a sophisticated AI-powered project management platform that combines intelligent task management, meeting intelligence, and advanced analytics. The application should provide a comprehensive solution for project teams with AI-driven insights and automation.

## 🏗️ Technical Architecture

### Core Tech Stack
- **Frontend**: Next.js 15 + React 19 with App Router
- **Backend**: Supabase (Database, Auth, Real-time, Storage)
- **AI Services**: Multi-provider integration with intelligent fallbacks
- **Styling**: Tailwind CSS with modern UI components
- **Deployment**: Vercel with edge functions

### AI Service Integration
```typescript
// Multi-AI Provider Configuration
const AI_PROVIDERS = {
  primary: 'openai', // GPT-4 for complex analysis
  secondary: 'groq', // Fast inference for real-time tasks
  transcription: 'assemblyai', // Advanced audio processing
  fallback: 'openai-whisper', // Backup transcription
  embedding: 'openai-ada-002' // Vector embeddings for search
}
```

## 📱 Core Features to Implement

### 1. Authentication & User Management
- **Modern Login Interface**: Clean, professional design with biometric options
- **Multi-factor Authentication**: Email + SMS/App-based 2FA
- **Biometric Integration**: Fingerprint/Face ID setup post-login
- **User Profiles**: Avatar, preferences, notification settings

### 2. Dashboard & Navigation
- **Intelligent Dashboard**: Welcome message, key metrics, recent activity
- **Smart Navigation**: Left sidebar with badges for notifications
- **Key Metrics Cards**: Total projects, active tasks, completed tasks, team members
- **AI Assistant Integration**: Voice recording and insights access
- **Recent Activity Feed**: Real-time updates with timestamps
- **Active Projects Overview**: Progress bars and quick access

### 3. Project Management System
- **Project Cards Interface**: Grid layout with completion status
- **Project Creation**: Detailed project setup with team assignment
- **Progress Tracking**: Visual progress bars and percentage completion
- **Team Collaboration**: Member assignment and role management
- **Project Status**: Active, completed, on-hold, archived
- **Budget Tracking**: Allocated vs. spent with visual indicators

### 4. Advanced Task Management (Kanban Board)
- **Three-Column Layout**: To Do, In Progress, Completed
- **Smart Prioritization**: AI-driven task promotion and urgency detection
- **Task Cards**: Rich task details with descriptions, due dates, assignees
- **Auto-Prioritization**: "urgent (auto)" tags based on AI analysis
- **Drag & Drop**: Intuitive task movement between columns
- **Task Filtering**: Status, priority, project, assignee filters
- **Bulk Actions**: Select all, bulk status updates

### 5. AI-Powered Recording System
- **Voice Recording Interface**: Modal-based recording with multiple backup systems
- **Multi-format Support**: MP3, WAV, M4A with automatic conversion
- **Chunked Upload**: Large file handling with progress indicators
- **Emergency Recovery**: Failed upload detection and retry mechanisms
- **Recording Management**: Session IDs, metadata, and status tracking

### 6. Advanced Transcription & Analysis
- **Primary**: AssemblyAI for high-quality transcription
- **Fallback**: OpenAI Whisper for reliability
- **Real-time Processing**: Live transcription during meetings
- **Multi-language Support**: Automatic language detection
- **Speaker Identification**: Multiple speaker recognition
- **Confidence Scoring**: Transcription quality metrics

### 7. Intelligent Task Extraction
- **Pre-screening Analysis**: Detect actionable items before processing
- **Smart Task Generation**: Context-aware task titles and descriptions
- **Priority Assignment**: AI-determined urgency levels
- **Project Association**: Automatic project categorization
- **Due Date Estimation**: AI-suggested deadlines
- **Assignee Recommendations**: Smart team member assignment

### 8. Meeting Intelligence
- **Calendar Integration**: Google Calendar, Outlook sync
- **Meeting Scheduling**: In-app calendar with team availability
- **Recording Sessions**: Automatic meeting capture
- **AI Summaries**: Comprehensive meeting analysis
- **Action Item Extraction**: Automatic task creation from discussions
- **Follow-up Management**: Meeting reminders and follow-ups

### 9. AI Insights & Analytics
- **Project Health Analysis**: AI-driven project assessment
- **Smart Recommendations**: Personalized improvement suggestions
- **Productivity Trends**: Performance tracking and insights
- **Team Efficiency Metrics**: Collaboration effectiveness
- **Burnout Risk Detection**: Proactive team wellness monitoring
- **Deadline Alerts**: Upcoming deadline notifications

### 10. Notification System
- **Email Notifications**: Daily summaries and alerts
- **In-app Notifications**: Real-time updates and badges
- **Smart Alerts**: Proactive risk and deadline notifications
- **Cron Job Integration**: Scheduled email summaries
- **Notification Preferences**: Customizable alert settings
- **Push Notifications**: Mobile app integration

### 11. Reports & Analytics
- **Comprehensive Reports**: Project overview with detailed metrics
- **Export Functionality**: PDF, CSV, Excel export options
- **Budget Tracking**: Financial reporting and analysis
- **Team Performance**: Individual and team productivity metrics
- **Project Status Reports**: Visual status indicators and progress
- **Custom Dashboards**: Configurable analytics views

## 🗄️ Database Schema Design

### Core Tables
```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  budget_allocated DECIMAL,
  budget_spent DECIMAL DEFAULT 0,
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id),
  assignee_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'todo',
  priority VARCHAR DEFAULT 'medium',
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Recording Sessions
CREATE TABLE recording_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER,
  transcription_status VARCHAR DEFAULT 'pending',
  transcription_text TEXT,
  ai_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meeting Intelligence
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER,
  recording_session_id UUID REFERENCES recording_sessions(id),
  summary TEXT,
  action_items JSONB DEFAULT '[]',
  attendees JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Insights
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  insight_type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  priority VARCHAR DEFAULT 'medium',
  actionable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Project policies
CREATE POLICY "Users can view owned projects" ON projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update owned projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

-- Task policies
CREATE POLICY "Users can view project tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Similar policies for other tables...
```

## 🎨 UI/UX Design Requirements

### Design System
- **Color Palette**: Blue primary (#3B82F6), with accent colors for status indicators
- **Typography**: Clean, modern fonts with proper hierarchy
- **Spacing**: Consistent 8px grid system
- **Components**: Reusable component library with consistent styling

### Key Interface Elements
1. **Navigation Sidebar**: Collapsible with notification badges
2. **Dashboard Cards**: Metric cards with icons and trend indicators
3. **Kanban Board**: Drag-and-drop task management
4. **Project Grid**: Card-based project overview
5. **Recording Modal**: Clean recording interface with status indicators
6. **AI Insights Panel**: Expandable sections for different insight types
7. **Floating Action Buttons**: AI assistant and voice recording access

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Adaptive layouts for tablet screens
- **Desktop Enhancement**: Full feature set on larger screens
- **Offline Capabilities**: Service worker for offline functionality

## 🔧 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Next.js 15 setup with App Router
- [ ] Supabase integration and database setup
- [ ] Authentication system with biometric options
- [ ] Basic UI components and design system
- [ ] User dashboard with key metrics

### Phase 2: Core Features (Weeks 3-4)
- [ ] Project management system
- [ ] Task management with Kanban board
- [ ] Basic AI integration setup
- [ ] Recording system foundation
- [ ] Notification system

### Phase 3: AI Integration (Weeks 5-6)
- [ ] Multi-AI provider integration
- [ ] Advanced transcription system
- [ ] Intelligent task extraction
- [ ] Meeting intelligence features
- [ ] AI insights generation

### Phase 4: Advanced Features (Weeks 7-8)
- [ ] Advanced analytics and reporting
- [ ] Calendar integration
- [ ] Team collaboration features
- [ ] Mobile optimization
- [ ] Performance optimization

### Phase 5: Polish & Launch (Weeks 9-10)
- [ ] Error handling and resilience
- [ ] Security hardening
- [ ] Performance testing
- [ ] Documentation
- [ ] Deployment and monitoring

## 🚀 Deployment & Monitoring

### Production Setup
- **Hosting**: Vercel with edge functions
- **Database**: Supabase production instance
- **CDN**: Vercel edge network
- **Monitoring**: Sentry for error tracking
- **Analytics**: Vercel Analytics integration

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Email
RESEND_API_KEY=your_resend_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass

# Storage
SUPABASE_STORAGE_BUCKET=recordings
```

## 📋 Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- API route testing with Jest
- Database function testing
- AI service integration testing

### Integration Testing
- End-to-end user flows
- AI service fallback scenarios
- Real-time collaboration testing
- Mobile device testing

### Performance Testing
- Load testing for concurrent users
- File upload stress testing
- AI processing performance
- Database query optimization

## 🔒 Security Considerations

### Data Protection
- End-to-end encryption for sensitive data
- Secure file upload validation
- API rate limiting
- Input sanitization and validation

### Authentication Security
- JWT token management
- Session timeout handling
- Biometric data protection
- Multi-factor authentication

### AI Service Security
- API key rotation
- Request/response logging
- Data anonymization
- Compliance with privacy regulations

## 📚 Documentation Requirements

### Technical Documentation
- API documentation with OpenAPI specs
- Database schema documentation
- AI service integration guides
- Deployment and maintenance guides

### User Documentation
- Feature guides and tutorials
- FAQ and troubleshooting
- Video demonstrations
- Best practices guide

## 🎯 Success Metrics

### Performance KPIs
- Page load times < 2 seconds
- AI processing response < 5 seconds
- 99.9% uptime target
- Mobile performance score > 90

### User Engagement
- Daily active users
- Task completion rates
- Meeting recording usage
- AI insight adoption

### Technical Metrics
- Error rates < 0.1%
- API response times
- Database query performance
- AI service reliability

---

This comprehensive rebuild prompt captures all the sophisticated features visible in the screenshots and provides a complete roadmap for rebuilding the AI ProjectHub application with modern technologies and best practices.

