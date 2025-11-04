'use client'

import { Brain } from 'lucide-react'

export default function AIInsightsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
        <p className="mt-2 text-gray-600">
          Intelligent analysis and recommendations for your projects
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
          <Brain className="h-4 w-4 text-purple-600" />
        </div>
        <span className="text-sm font-medium text-purple-600">AI Powered</span>
      </div>
    </div>
  )
}






















