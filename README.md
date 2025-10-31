# AI ProjectHub - Intelligent Management

A sophisticated AI-powered project management platform that combines intelligent task management, meeting intelligence, and advanced analytics with AI-driven insights and automation.

## 🚀 Features

### Core Functionality
- **AI-Powered Recording System** - Bulletproof recording with multiple backup systems
- **Intelligent Task Extraction** - Multi-AI service integration (Groq, OpenAI, AssemblyAI)
- **Advanced Transcription** - AssemblyAI with OpenAI Whisper fallback
- **Project Management** - Full Kanban board with team collaboration
- **Meeting Intelligence** - Calendar sync, recording, and AI analysis
- **Smart Notifications** - AI intelligent morning notifications and alerts

### AI Features
- **Pre-screening Analysis** - Detect actionable items before processing
- **Smart Task Generation** - Context-aware titles and descriptions
- **Emergency Recovery** - Failed upload detection and retry mechanisms
- **Multi-format Audio Support** - Automatic conversion and processing
- **AI Insights** - Project health analysis and recommendations

### Advanced Notification System
- **Morning Notifications** - AI-generated personalized daily summaries
- **Smart Alerts** - Proactive notifications about deadlines and risks
- **Email Integration** - Beautiful HTML email notifications
- **In-app Notifications** - Real-time updates with badges
- **Intelligent Scheduling** - AI-driven notification timing

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 + React 19 with App Router
- **Backend**: Supabase (Database, Auth, Real-time, Storage)
- **AI Services**: Multi-provider integration with intelligent fallbacks
- **Styling**: Tailwind CSS with modern UI components
- **Drag & Drop**: @dnd-kit for Kanban board functionality
- **Notifications**: Resend for email, cron jobs for scheduling
- **Deployment**: Vercel with edge functions

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-projecthub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI Services
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   ASSEMBLYAI_API_KEY=your_assemblyai_api_key

   # Email Service
   RESEND_API_KEY=your_resend_api_key

   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `lib/database/schema.sql` in your Supabase SQL editor
   - Enable Row Level Security policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Key Pages

### Dashboard
- **Intelligent Overview** - AI-powered metrics and insights
- **Recent Activity Feed** - Real-time project updates
- **AI Assistant** - Voice recording and insights access
- **Active Projects** - Progress tracking with visual indicators

### Tasks (Kanban Board)
- **Smart Prioritization** - AI-driven task promotion
- **Drag & Drop** - Intuitive task management
- **Auto-Prioritization** - "urgent (auto)" tags based on AI analysis
- **Advanced Filtering** - Status, priority, and project filters

### AI Insights
- **Project Health Analysis** - AI-driven assessment
- **Smart Recommendations** - Personalized improvements
- **Productivity Trends** - Performance tracking
- **Burnout Risk Detection** - Proactive team wellness

### Meetings
- **Voice Recording** - AI-processed meeting capture
- **Intelligent Summaries** - Comprehensive meeting analysis
- **Task Extraction** - Automatic action item creation
- **Calendar Integration** - Meeting scheduling and sync

## 🤖 AI Integration

### Multi-Provider Setup
The application uses multiple AI providers with intelligent fallbacks:

```typescript
const AI_PROVIDERS = {
  primary: 'openai',      // GPT-4 for complex analysis
  secondary: 'groq',      // Fast inference for real-time tasks
  transcription: 'assemblyai', // Advanced audio processing
  fallback: 'openai-whisper',  // Backup transcription
}
```

### Morning Notifications
AI-powered morning notifications that:
- Analyze user's project data and activity
- Generate personalized content and recommendations
- Schedule intelligent alerts based on user patterns
- Send beautiful HTML email summaries

### Smart Task Extraction
Intelligent task extraction from meetings:
- Pre-screening analysis to detect actionable items
- Context-aware task titles and descriptions
- AI-determined priority levels and due dates
- Automatic project categorization

## 🔔 Notification System

### Morning Notifications
- **Daily Summaries** - AI-generated personalized content
- **Project Updates** - Key metrics and progress
- **Task Reminders** - Today's priorities and deadlines
- **AI Insights** - Recommendations and health analysis

### Smart Alerts
- **Urgent Task Alerts** - Immediate attention required
- **Deadline Reminders** - 24-hour advance warnings
- **Project Health Alerts** - Risk detection and mitigation
- **Team Efficiency** - Collaboration insights

### Email Integration
Beautiful HTML emails with:
- Responsive design for all devices
- AI-generated content and recommendations
- Interactive elements and call-to-action buttons
- Personalized metrics and progress indicators

## 🗄️ Database Schema

### Key Tables
- **users** - User profiles and preferences
- **projects** - Project management and tracking
- **tasks** - Task management with AI priorities
- **recording_sessions** - Voice recording metadata
- **meetings** - Meeting intelligence and analysis
- **ai_insights** - AI-generated insights and recommendations
- **notifications** - Notification system management
- **notification_schedules** - AI intelligent scheduling

### Security
- Row Level Security (RLS) enabled on all tables
- User-specific data access policies
- Secure API endpoints with authentication
- Encrypted sensitive data storage

## 🚀 Deployment

### Vercel Deployment

1. **Fork this repository** to your GitHub account

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your forked repository
   - Set up environment variables in Vercel dashboard

3. **Environment Variables** (Set in Vercel):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   ASSEMBLYAI_API_KEY=your_assemblyai_api_key
   RESEND_API_KEY=your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Deploy**: Vercel will automatically deploy on every push to main

### Live Demo

- **GitHub Repository**: [https://github.com/vipervv3/cursoraitask](https://github.com/vipervv3/cursoraitask)
- **Live Application**: [https://cursoraitask.vercel.app/](https://cursoraitask.vercel.app/)

### Demo Mode

The application includes a demo mode that works without external dependencies:

- **Email**: demo@aiprojecthub.com
- **Password**: demo123

## 📊 Monitoring & Analytics

### Performance Metrics
- Page load times < 2 seconds
- AI processing response < 5 seconds
- 99.9% uptime target
- Mobile performance score > 90

### User Engagement
- Daily active users tracking
- Task completion rates
- Meeting recording usage
- AI insight adoption

## 🔒 Security Features

### Data Protection
- End-to-end encryption for sensitive data
- Secure file upload validation
- API rate limiting and protection
- Input sanitization and validation

### Authentication Security
- JWT token management
- Session timeout handling
- Biometric data protection
- Multi-factor authentication support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Next.js 15 and React 19
- Powered by Supabase for backend services
- AI capabilities provided by OpenAI, Groq, and AssemblyAI
- Email services by Resend
- UI components inspired by modern design systems

---

**AI ProjectHub** - Intelligent project management for the modern team.
