'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Sidebar from '@/components/layout/sidebar'
import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import NotificationPreferences from './notification-preferences'
import NotificationHistory from './notification-history'
import NotificationSchedule from './notification-schedule'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export default function NotificationSettingsPage() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      setPreferences(data?.notification_preferences || {})
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (newPreferences: any) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: newPreferences })
        .eq('id', user?.id)

      if (error) throw error

      setPreferences(newPreferences)
      toast.success('Preferences updated successfully')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 lg:pl-64">
          <div className="py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                <p className="mt-2 text-gray-600">
                  Manage your notification preferences and schedules
                </p>
              </div>

              {/* Notification Preferences */}
              <div className="mb-8">
                <NotificationPreferences 
                  preferences={preferences}
                  onUpdate={updatePreferences}
                />
              </div>

              {/* Notification Schedule */}
              <div className="mb-8">
                <NotificationSchedule 
                  userId={user?.id || ''}
                />
              </div>

              {/* Notification History */}
              <div className="mb-8">
                <NotificationHistory 
                  userId={user?.id || ''}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <FloatingActionButtons />
    </div>
  )
}


