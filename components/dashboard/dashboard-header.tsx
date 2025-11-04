'use client'

import { User } from '@supabase/auth-helpers-nextjs'
import { Settings } from 'lucide-react'
import NotificationCenter from '@/components/notifications/notification-center'

interface DashboardHeaderProps {
  user: User | null
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting}, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your projects today
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <NotificationCenter />
        
        <button className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
          <Settings className="h-6 w-6" />
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
