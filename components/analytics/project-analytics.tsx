'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface ProjectAnalyticsProps {
  data: any
}

export default function ProjectAnalytics({ data }: ProjectAnalyticsProps) {
  // Mock data for project status distribution
  const projectStatusData = [
    { name: 'Active', value: data.activeProjects, color: '#3b82f6' },
    { name: 'Completed', value: data.totalProjects - data.activeProjects, color: '#10b981' },
    { name: 'On Hold', value: 0, color: '#f59e0b' }
  ]

  // Mock data for project progress
  const projectProgressData = [
    { name: 'Project A', progress: 85 },
    { name: 'Project B', progress: 60 },
    { name: 'Project C', progress: 30 },
    { name: 'Project D', progress: 95 },
    { name: 'Project E', progress: 45 }
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Project Analytics</h3>
        <p className="card-description">
          Project status distribution and progress tracking
        </p>
      </div>
      
      <div className="card-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Project Status</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {projectStatusData.map((item, index) => (
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

          {/* Project Progress */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Project Progress</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#666"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value}%`, 'Progress']}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Project Success Rate */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Project Success Rate</h4>
              <p className="text-sm text-gray-600">Based on completed vs total projects</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(data.projectSuccessRate)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${data.projectSuccessRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






















