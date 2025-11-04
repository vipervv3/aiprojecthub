'use client'

import { Lightbulb, ArrowRight } from 'lucide-react'

interface SmartRecommendationsProps {
  insights: any[]
}

export default function SmartRecommendations({ insights }: SmartRecommendationsProps) {
  const recommendations = [
    {
      id: 1,
      title: "Optimize Task Prioritization",
      description: "Consider using AI-powered task prioritization to improve team efficiency by 15%",
      priority: "high",
      category: "Productivity"
    },
    {
      id: 2,
      title: "Schedule Team Check-ins",
      description: "Regular standup meetings could help reduce project delays and improve communication",
      priority: "medium",
      category: "Communication"
    },
    {
      id: 3,
      title: "Implement Time Tracking",
      description: "Track time spent on tasks to better estimate future project timelines",
      priority: "low",
      category: "Planning"
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Smart Recommendations</h3>
        <p className="card-description">
          AI-generated suggestions to improve your project management
        </p>
      </div>
      
      <div className="card-content">
        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-gray-500">Project recommendations will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div 
                key={recommendation.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {recommendation.title}
                      </h4>
                      <span className={`badge ${getPriorityColor(recommendation.priority)} text-xs`}>
                        {recommendation.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {recommendation.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {recommendation.category}
                      </span>
                      <button className="text-xs text-primary hover:text-primary/80 flex items-center">
                        View Details
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {recommendations.length > 0 && (
          <div className="mt-6 text-center">
            <button className="btn btn-outline">
              Load More Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  )
}






















