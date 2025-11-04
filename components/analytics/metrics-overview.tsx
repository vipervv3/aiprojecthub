'use client'

import { 
  FolderOpen, 
  CheckSquare, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Award,
  BarChart3
} from 'lucide-react'

interface AnalyticsData {
  totalProjects: number
  totalTasks: number
  completedTasks: number
  activeProjects: number
  teamMembers: number
  productivityTrend: number
  averageCompletionTime: number
  projectSuccessRate: number
}

interface MetricsOverviewProps {
  data: AnalyticsData
}

export default function MetricsOverview({ data }: MetricsOverviewProps) {
  const metrics = [
    {
      title: 'Total Projects',
      value: data.totalProjects,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Tasks',
      value: data.totalTasks,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Completed Tasks',
      value: data.completedTasks,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Active Projects',
      value: data.activeProjects,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'Team Members',
      value: data.teamMembers,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: '0%',
      trendUp: false
    },
    {
      title: 'Productivity Trend',
      value: `${Math.round(data.productivityTrend)}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: '+3%',
      trendUp: true
    },
    {
      title: 'Avg. Completion Time',
      value: `${data.averageCompletionTime} days`,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '-12%',
      trendUp: false
    },
    {
      title: 'Project Success Rate',
      value: `${Math.round(data.projectSuccessRate)}%`,
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: '+7%',
      trendUp: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    metric.trendUp ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}






















