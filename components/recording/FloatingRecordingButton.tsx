'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { useAuth } from '@/app/providers'

interface FloatingRecordingButtonProps {
  onStartRecording: () => void
  isRecording?: boolean
  recordingTime?: number
}

export default function FloatingRecordingButton({
  onStartRecording,
  isRecording = false,
  recordingTime = 0
}: FloatingRecordingButtonProps) {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide button on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Don't show if user is not logged in
  if (!user) {
    return null
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      {/* Recording status tooltip */}
      {isRecording && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg p-3 min-w-[160px] animate-fade-in">
          <div className="text-sm font-medium text-gray-900 mb-1">Recording...</div>
          <div className="text-2xl font-bold text-red-600">{formatTime(recordingTime)}</div>
          <div className="text-xs text-gray-500 mt-1">Click to manage</div>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={onStartRecording}
        data-recording-button="true"
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg 
          transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4
          ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300'
          }
        `}
        aria-label={isRecording ? 'Recording in progress' : 'Start recording'}
        title={isRecording ? 'Recording in progress - Click to manage' : 'Start recording meeting'}
      >
        {isRecording ? (
          <>
            {/* Pulsing indicator */}
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
            <MicOff className="h-7 w-7 text-white relative z-10" />
          </>
        ) : (
          <Mic className="h-7 w-7 text-white" />
        )}
      </button>

      {/* Recording indicator dot (always visible when recording) */}
      {isRecording && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
      )}

      {/* Hover tooltip (when not recording) */}
      {!isRecording && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Record Meeting
        </div>
      )}
    </div>
  )
}

// Add animation styles to globals.css or tailwind.config.js
// animate-fade-in: opacity-0 to opacity-100

