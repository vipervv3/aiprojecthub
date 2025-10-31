'use client'

import { useState } from 'react'
import { CheckCircle, Clock, Circle, ArrowRight } from 'lucide-react'

export default function DragDropDemo() {
  const [showDemo, setShowDemo] = useState(true) // Changed to true to show demo by default

  if (!showDemo) {
    return (
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">💡</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Drag & Drop Demo</h3>
              <p className="text-xs text-blue-700">
                Learn how to move tasks between columns
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDemo(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Show Demo →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🎯</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Use Drag & Drop</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs">1</span>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Grab a task:</strong> Click and hold on any task card to start dragging
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs">2</span>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Drag to new column:</strong> Move the task to a different status column
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs">3</span>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Drop to update:</strong> Release to automatically update the task status
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Circle className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">To Do</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">In Progress</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">Completed</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowDemo(false)}
            className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Got it! Hide demo
          </button>
        </div>
      </div>
    </div>
  )
}
