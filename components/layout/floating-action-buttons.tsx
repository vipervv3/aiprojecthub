'use client'

import { useState } from 'react'
import { Bot, Mic, X } from 'lucide-react'

export default function FloatingActionButtons() {
  const [isRecording, setIsRecording] = useState(false)

  const handleStartRecording = () => {
    setIsRecording(true)
    // TODO: Implement voice recording functionality
    setTimeout(() => setIsRecording(false), 3000)
  }

  const handleAIAssistant = () => {
    // TODO: Open AI assistant modal
    console.log('Open AI assistant')
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-4">
      {/* AI Assistant Button */}
      <button
        onClick={handleAIAssistant}
        className="fab fab-secondary w-14 h-14 flex items-center justify-center group"
        title="AI Assistant"
      >
        <Bot className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Voice Recording Button */}
      <button
        onClick={handleStartRecording}
        className={`fab fab-primary w-14 h-14 flex items-center justify-center group ${
          isRecording ? 'animate-pulse-slow' : ''
        }`}
        title={isRecording ? 'Recording...' : 'Start Recording'}
        disabled={isRecording}
      >
        {isRecording ? (
          <X className="h-6 w-6 group-hover:scale-110 transition-transform" />
        ) : (
          <Mic className="h-6 w-6 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse">
          <div className="w-full h-full bg-red-500 rounded-full animate-ping"></div>
        </div>
      )}
    </div>
  )
}






















