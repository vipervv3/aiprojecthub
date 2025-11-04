'use client'

import { createContext, useContext, useState, useRef, ReactNode } from 'react'
import MinimizableRecordingWidget from '@/components/meetings/minimizable-recording-widget'

interface RecordingContextType {
  showRecordingModal: boolean
  setShowRecordingModal: (show: boolean) => void
  startRecording: () => void
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined)

export function useRecording() {
  const context = useContext(RecordingContext)
  if (!context) {
    throw new Error('useRecording must be used within RecordingProvider')
  }
  return context
}

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [showRecordingModal, setShowRecordingModal] = useState(false)

  const startRecording = () => {
    setShowRecordingModal(true)
  }

  const handleRecordingComplete = () => {
    setShowRecordingModal(false)
  }

  return (
    <RecordingContext.Provider value={{ showRecordingModal, setShowRecordingModal, startRecording }}>
      {children}
      
      {/* Global Recording Widget - Persists across page navigation */}
      <MinimizableRecordingWidget
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
        onRecordingComplete={handleRecordingComplete}
      />
    </RecordingContext.Provider>
  )
}












