'use client'

import { ReactNode } from 'react'
import Sidebar from './sidebar'
import FloatingRecordingButton from '@/components/recording/FloatingRecordingButton'
import GlobalSearch from '@/components/global-search'
import { useRecording } from '@/app/recording-provider'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { startRecording } = useRecording()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        {/* Mobile header with search */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <GlobalSearch />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 pt-14 lg:pt-0">
          {children}
        </main>
      </div>

      {/* Floating Recording Button */}
      <FloatingRecordingButton
        onStartRecording={startRecording}
        isRecording={false}
        recordingTime={0}
      />
      
      {/* Global Search */}
      <GlobalSearch />
      
      {/* Recording Widget is now in RecordingProvider - persists across pages */}
    </div>
  )
}


