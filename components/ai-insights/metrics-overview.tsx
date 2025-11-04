'use client'

import { TrendingUp, Target, AlertTriangle, Clock } from 'lucide-react'

interface Metrics {
  productivityTrend: number
  teamEfficiency: number
  burnoutRisk: string
  upcomingDeadlines: number
}

export default function MetricsOverview({ metrics }: { metrics: Metrics }) {
  const metricsData = [
    {
      title: 'Productivity Trend',
      value: `${metrics.productivityTrend}%`,
      subtitle: 'Down from last week',
      icon: TrendingUp,
      color: metrics.productivityTrend >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.productivityTrend >= 0 ? 'bg-green-50' : 'bg-red-50',
      iconColor: metrics.productivityTrend >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Team Efficiency',
      value: `${metrics.teamEfficiency}%`,
      subtitle: 'Overall progress',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      showProgress: true,
      progress: metrics.teamEfficiency
    },
    {
      title: 'Burnout Risk',
      value: metrics.burnoutRisk,
      subtitle: 'At Risk',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Upcoming Deadlines',
      value: metrics.upcomingDeadlines.toString(),
      subtitle: 'Next 7 days',
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <div key={index} className="card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                <p className="text-sm text-gray-500">{metric.subtitle}</p>
                
                {metric.showProgress && (
                  <div className="mt-2">
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill bg-blue-500`}
                        style={{ width: `${metric.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-full ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}






















