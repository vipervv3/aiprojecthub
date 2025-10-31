'use client'

import { ReactNode } from 'react'
import Sidebar from './sidebar'
import FloatingRecordingButton from '@/components/recording/FloatingRecordingButton'
import { useRecording } from '@/app/recording-provider'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { startRecording } = useRecording()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Floating Recording Button */}
      <FloatingRecordingButton
        onStartRecording={startRecording}
        isRecording={false}
        recordingTime={0}
      />
      
      {/* Recording Widget is now in RecordingProvider - persists across pages */}
    </div>
  )
}


