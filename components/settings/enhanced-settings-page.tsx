'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Settings, User, Bell, Shield, Palette, Globe, Save, Eye, EyeOff, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useTheme } from '@/lib/theme-provider'
import { dataService } from '@/lib/data-service'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    projectUpdates: boolean
    taskAssignments: boolean
    deadlineReminders: boolean
    weeklyReports: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'team'
    showOnlineStatus: boolean
    allowDirectMessages: boolean
  }
  dashboard: {
    defaultView: 'overview' | 'projects' | 'tasks' | 'calendar'
    showWidgets: string[]
    refreshInterval: number
  }
}

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  bio?: string
  avatar_url?: string
  role: string
  department?: string
  timezone: string
  preferences: UserPreferences
}

const SettingSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
    {children}
  </div>
)

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; label: string; description?: string }> = ({ 
  enabled, 
  onChange, 
  label, 
  description 
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
      {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation ${
        enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-200 transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
)

export default function EnhancedSettingsPage() {
  const { user } = useAuth()
  const { theme: currentTheme, setTheme: setThemeProvider } = useTheme()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'privacy'>('profile')

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      
      if (!user) return
      
      // Load user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (userError) {
        console.error('Error loading user from database:', userError)
      }
      
      // Default preferences structure
      const defaultPreferences = {
        theme: 'light' as const,
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h' as const,
        notifications: {
          email: true,
          push: true,
          sms: false,
          projectUpdates: true,
          taskAssignments: true,
          deadlineReminders: true,
          weeklyReports: false
        },
        // Email notification preferences (required for morning notifications)
        email_daily_summary: true,
        morning_notifications: true,
        privacy: {
          profileVisibility: 'team' as const,
          showOnlineStatus: true,
          allowDirectMessages: true
        },
        dashboard: {
          defaultView: 'overview' as const,
          showWidgets: ['projects', 'tasks', 'recentActivity'],
          refreshInterval: 30
        }
      }
      
      // Merge database preferences with defaults
      const mergedPreferences = userData?.preferences 
        ? { ...defaultPreferences, ...userData.preferences }
        : defaultPreferences
      
      // Sync theme from database to ThemeProvider, but if no saved theme, use light
      const savedTheme = mergedPreferences.theme || 'light'
      if (savedTheme !== currentTheme) {
        setThemeProvider(savedTheme as 'light' | 'dark' | 'system')
      }
      
      // Merge notification_preferences into preferences (for morning notifications)
      const notificationPrefs = userData?.notification_preferences || {}
      // Set defaults to true if not set (users should receive notifications by default)
      mergedPreferences.email_daily_summary = notificationPrefs.email_daily_summary ?? true
      mergedPreferences.morning_notifications = notificationPrefs.morning_notifications ?? true
      
      // Extract profile fields from preferences (since these columns don't exist in users table)
      const profileData = mergedPreferences.profile || {}
      
      // Build user profile from database and auth data
      const userProfile: UserProfile = {
        id: user.id,
        name: userData?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: profileData.phone || user.user_metadata?.phone || '',
        location: profileData.location || user.user_metadata?.location || '',
        bio: profileData.bio || user.user_metadata?.bio || '',
        avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url,
        role: profileData.role || user.user_metadata?.role || 'Member',
        department: profileData.department || user.user_metadata?.department || '',
        timezone: userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferences: mergedPreferences
      }
      
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user profile:', error)
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }, [user, currentTheme, setThemeProvider])

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user, loadUserProfile])

  const handleSaveProfile = async () => {
    if (!profile || !user) return
    
    try {
      setSaving(true)
      
      // Store profile fields in preferences.profile (since these columns don't exist in users table)
      const updatedPreferences = {
        ...profile.preferences,
        profile: {
          phone: profile.phone || '',
          location: profile.location || '',
          bio: profile.bio || '',
          role: profile.role || 'Member',
          department: profile.department || ''
        }
      }
      
      // Update the users table in database
      // Only update name (which exists) and store other fields in preferences
      const { error: dbError } = await dataService.updateUserProfile(user.id, {
        name: profile.name,
        preferences: updatedPreferences
      })
      
      if (dbError) throw dbError
      
      // Also update Supabase Auth user metadata (for consistency)
      if (supabase) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            name: profile.name,
            phone: profile.phone,
            location: profile.location,
            bio: profile.bio,
            role: profile.role,
            department: profile.department
          }
        })
        
        if (authError) {
          console.warn('Error updating auth metadata:', authError)
          // Don't throw, database update is more important
        }
      }
      
      toast.success('Profile updated successfully!')
      
      // Reload profile data to reflect changes
      await loadUserProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!profile || !user) return
    
    try {
      setSaving(true)
      
      // Build notification_preferences object (required for morning notifications)
      const notificationPreferences = {
        email_daily_summary: profile.preferences.email_daily_summary ?? true,
        morning_notifications: profile.preferences.morning_notifications ?? true,
        smart_alerts: profile.preferences.notifications?.push ?? true,
        push_notifications: profile.preferences.notifications?.push ?? true,
        morning_notification_time: profile.preferences.morning_notification_time || '08:00',
        ...profile.preferences.notifications
      }
      
      // Save preferences to database
      const result = await dataService.updateUserProfile(user.id, {
        preferences: profile.preferences,
        notification_preferences: notificationPreferences,
        timezone: profile.preferences.timezone
      })
      
      if (result.error) throw result.error
      
      // Ensure theme is synced to ThemeProvider
      if (profile.preferences.theme) {
        setThemeProvider(profile.preferences.theme)
      }
      
      toast.success('Preferences saved successfully')
      
      // Reload profile data to confirm changes
      await loadUserProfile()
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Unable to load settings</h3>
          <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'preferences', label: 'Preferences', icon: Palette },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'privacy', label: 'Privacy', icon: Shield }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <SettingSection title="Personal Information" icon={<User className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 touch-manipulation"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </SettingSection>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <SettingSection title="Appearance" icon={<Palette className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                  <select
                    value={profile.preferences.theme || 'light'}
                    onChange={(e) => {
                      const newTheme = e.target.value as 'light' | 'dark' | 'system'
                      setProfile({ 
                        ...profile, 
                        preferences: { 
                          ...profile.preferences, 
                          theme: newTheme
                        } 
                      })
                      // Immediately apply theme change
                      setThemeProvider(newTheme)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Changes apply immediately
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                  <select
                    value={profile.preferences.language}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      preferences: { 
                        ...profile.preferences, 
                        language: e.target.value 
                      } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                  <select
                    value={profile.preferences.timezone}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      preferences: { 
                        ...profile.preferences, 
                        timezone: e.target.value 
                      } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Format</label>
                  <select
                    value={profile.preferences.timeFormat}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      preferences: { 
                        ...profile.preferences, 
                        timeFormat: e.target.value as any 
                      } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="12h">12-hour</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 touch-manipulation"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </SettingSection>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <SettingSection title="Notification Preferences" icon={<Bell className="h-5 w-5" />}>
              <div className="space-y-4">
                <ToggleSwitch
                  enabled={profile.preferences.notifications?.email ?? true}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      notifications: { 
                        ...profile.preferences.notifications, 
                        email: enabled 
                      },
                      email_daily_summary: enabled,
                      morning_notifications: enabled
                    } 
                  })}
                  label="Email Notifications"
                  description="Receive notifications via email (includes morning notifications)"
                />
                <ToggleSwitch
                  enabled={profile.preferences.notifications.push}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      notifications: { 
                        ...profile.preferences.notifications, 
                        push: enabled 
                      } 
                    } 
                  })}
                  label="Push Notifications"
                  description="Receive push notifications in your browser"
                />
                <ToggleSwitch
                  enabled={profile.preferences.notifications.sms}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      notifications: { 
                        ...profile.preferences.notifications, 
                        sms: enabled 
                      } 
                    } 
                  })}
                  label="SMS Notifications"
                  description="Receive notifications via SMS"
                />
                <hr className="my-4" />
                <ToggleSwitch
                  enabled={profile.preferences.notifications.projectUpdates}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      notifications: { 
                        ...profile.preferences.notifications, 
                        projectUpdates: enabled 
                      } 
                    } 
                  })}
                  label="Project Updates"
                  description="Get notified when projects you're involved in are updated"
                />
                <ToggleSwitch
                  enabled={profile.preferences.notifications.taskAssignments}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      notifications: { 
                        ...profile.preferences.notifications, 
                        taskAssignments: enabled 
                      } 
                    } 
                  })}
                  label="Task Assignments"
                  description="Get notified when new tasks are assigned to you"
                />
                <ToggleSwitch
                  enabled={profile.preferences.notifications.deadlineReminders}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      notifications: { 
                        ...profile.preferences.notifications, 
                        deadlineReminders: enabled 
                      } 
                    } 
                  })}
                  label="Deadline Reminders"
                  description="Get reminded about upcoming deadlines"
                />
                <ToggleSwitch
                  enabled={profile.preferences.notifications.weeklyReports}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      notifications: { 
                        ...profile.preferences.notifications, 
                        weeklyReports: enabled 
                      } 
                    } 
                  })}
                  label="Weekly Reports"
                  description="Receive weekly summary reports"
                />
              </div>
              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Notifications'}
                </button>
              </div>
            </SettingSection>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <SettingSection title="Privacy Settings" icon={<Shield className="h-5 w-5" />}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                  <select
                    value={profile.preferences.privacy.profileVisibility}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      preferences: { 
                        ...profile.preferences, 
                        privacy: { 
                          ...profile.preferences.privacy, 
                          profileVisibility: e.target.value as any 
                        } 
                      } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="team">Team Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <ToggleSwitch
                  enabled={profile.preferences.privacy.showOnlineStatus}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      privacy: { 
                        ...profile.preferences.privacy, 
                        showOnlineStatus: enabled 
                      } 
                    } 
                  })}
                  label="Show Online Status"
                  description="Let others see when you're online"
                />
                <ToggleSwitch
                  enabled={profile.preferences.privacy.allowDirectMessages}
                  onChange={(enabled) => setProfile({ 
                    ...profile, 
                    preferences: { 
                      ...profile.preferences, 
                      privacy: { 
                        ...profile.preferences.privacy, 
                        allowDirectMessages: enabled 
                      } 
                    } 
                  })}
                  label="Allow Direct Messages"
                  description="Allow team members to send you direct messages"
                />
              </div>
              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </div>
            </SettingSection>
          </div>
        )}

      </div>
    </div>
  )
}














