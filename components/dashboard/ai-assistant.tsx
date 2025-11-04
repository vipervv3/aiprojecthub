'use client'

import { useState } from 'react'
import { Mic, BarChart3 } from 'lucide-react'

export default function AIAssistant() {
  const [isRecording, setIsRecording] = useState(false)

  const handleStartRecording = () => {
    setIsRecording(true)
    // TODO: Implement voice recording functionality
    setTimeout(() => setIsRecording(false), 3000)
  }

  return (
    <div className="card bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-blue-100 mb-4">
              Ready to help you manage your projects more efficiently
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleStartRecording}
                className={`btn btn-sm ${
                  isRecording 
                    ? 'bg-white text-blue-600 animate-pulse-slow' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                disabled={isRecording}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isRecording ? 'Recording...' : 'Start Voice Recording'}
              </button>
              
              <button className="btn btn-sm bg-white/20 text-white hover:bg-white/30">
                <BarChart3 className="h-4 w-4 mr-2" />
                View AI Insights
              </button>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                <div className="text-4xl">🤖</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






















