'use client'

import { TrendingUp, Users, Target, Award, Clock } from 'lucide-react'

interface TeamPerformanceProps {
  data: any
}

export default function TeamPerformance({ data }: TeamPerformanceProps) {
  // Mock team performance data
  const teamMetrics = [
    {
      title: 'Team Productivity',
      value: '87%',
      change: '+5%',
      changeUp: true,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Collaboration Score',
      value: '92%',
      change: '+3%',
      changeUp: true,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Goal Achievement',
      value: '78%',
      change: '+8%',
      changeUp: true,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'On-Time Delivery',
      value: '85%',
      change: '+2%',
      changeUp: true,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  const teamMembers = [
    {
      name: 'You',
      role: 'Project Manager',
      tasksCompleted: data.completedTasks,
      productivity: '95%',
      avatar: '👤',
      status: 'active'
    },
    {
      name: 'AI Assistant',
      role: 'AI Helper',
      tasksCompleted: Math.floor(data.completedTasks * 0.3),
      productivity: '100%',
      avatar: '🤖',
      status: 'active'
    }
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Team Performance</h3>
        <p className="card-description">
          Team productivity and collaboration metrics
        </p>
      </div>
      
      <div className="card-content">
        {/* Team Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {teamMetrics.map((metric, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-600">{metric.title}</p>
              </div>
              <div className={`text-xs font-medium ${
                metric.changeUp ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
              </div>
            </div>
          ))}
        </div>

        {/* Team Members */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Team Members</h4>
          <div className="space-y-3">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-600">{member.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{member.tasksCompleted}</p>
                    <p className="text-xs text-gray-600">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{member.productivity}</p>
                    <p className="text-xs text-gray-600">Productivity</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Goals */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Team Goals</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">Complete 100 tasks this month</span>
                <span className="font-medium text-gray-900">{data.completedTasks}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((data.completedTasks / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">Maintain 80% productivity score</span>
                <span className="font-medium text-gray-900">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '87%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">Deliver projects on time</span>
                <span className="font-medium text-gray-900">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '85%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






















