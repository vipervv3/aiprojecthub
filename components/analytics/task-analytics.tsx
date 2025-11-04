'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface TaskAnalyticsProps {
  data: any
}

export default function TaskAnalytics({ data }: TaskAnalyticsProps) {
  // Mock data for task completion over time
  const taskCompletionData = [
    { week: 'Week 1', completed: 12, created: 15 },
    { week: 'Week 2', completed: 18, created: 12 },
    { week: 'Week 3', completed: 22, created: 18 },
    { week: 'Week 4', completed: 16, created: 14 }
  ]

  // Mock data for task priority distribution
  const priorityData = [
    { name: 'Low', value: 15, color: '#10b981' },
    { name: 'Medium', value: 25, color: '#f59e0b' },
    { name: 'High', value: 12, color: '#ef4444' },
    { name: 'Urgent', value: 8, color: '#dc2626' }
  ]

  // Mock data for task status
  const statusData = [
    { name: 'Completed', value: data.completedTasks, color: '#10b981' },
    { name: 'In Progress', value: Math.floor(data.totalTasks * 0.3), color: '#3b82f6' },
    { name: 'To Do', value: Math.floor(data.totalTasks * 0.2), color: '#6b7280' }
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Task Analytics</h3>
        <p className="card-description">
          Task completion trends and priority distribution
        </p>
      </div>
      
      <div className="card-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Completion Over Time */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Task Completion Trend</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="created" fill="#3b82f6" name="Created" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Priority Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Task Priority Distribution</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {priorityData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Status Overview */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Task Status Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statusData.map((status, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold" style={{ color: status.color }}>
                  {status.value}
                </div>
                <div className="text-sm text-gray-600">{status.name}</div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(status.value / data.totalTasks) * 100}%`,
                        backgroundColor: status.color
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Completion Time */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Average Completion Time</h4>
              <p className="text-sm text-gray-600">Time from creation to completion</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {data.averageCompletionTime} days
              </div>
              <div className="text-sm text-gray-600">Avg. Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






















