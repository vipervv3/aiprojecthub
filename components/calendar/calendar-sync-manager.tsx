'use client'

import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, Trash2, X, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { toast } from 'sonner'
import { getCalendarProviderInfo } from '@/lib/services/ics-sync-service'

interface CalendarSync {
  id: string
  name: string
  provider: 'outlook' | 'google' | 'apple' | 'other'
  ics_url: string
  color: string
  enabled: boolean
  last_synced?: string
}

interface CalendarSyncManagerProps {
  onClose: () => void
  onSync: () => void
}

export function CalendarSyncManager({ onClose, onSync }: CalendarSyncManagerProps) {
  const { user } = useAuth()
  const [syncs, setSyncs] = useState<CalendarSync[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'other' as 'outlook' | 'google' | 'apple' | 'other',
    icsUrl: '',
    color: '#6B7280'
  })
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  useEffect(() => {
    loadSyncs()
  }, [])

  const loadSyncs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/calendar-sync?userId=${user?.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setSyncs(data.syncs || [])
      } else {
        console.error('Error loading syncs:', data.error)
      }
    } catch (error) {
      console.error('Error loading syncs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSync = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.icsUrl) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/calendar-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          name: formData.name,
          provider: formData.provider,
          icsUrl: formData.icsUrl,
          color: formData.color
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Calendar synced successfully')
        setFormData({ name: '', provider: 'other', icsUrl: '', color: '#6B7280' })
        setShowAddForm(false)
        await loadSyncs()
        onSync() // Refresh the calendar view
      } else {
        toast.error(data.error || 'Failed to sync calendar')
      }
    } catch (error) {
      console.error('Error adding sync:', error)
      toast.error('Failed to add calendar sync')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefresh = async (syncId: string) => {
    try {
      setRefreshing(syncId)
      const response = await fetch('/api/calendar-sync', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncId, action: 'refresh' })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Calendar refreshed')
        await loadSyncs()
        onSync() // Refresh the calendar view
      } else {
        toast.error(data.error || 'Failed to refresh calendar')
      }
    } catch (error) {
      console.error('Error refreshing sync:', error)
      toast.error('Failed to refresh calendar')
    } finally {
      setRefreshing(null)
    }
  }

  const handleToggle = async (syncId: string) => {
    try {
      const response = await fetch('/api/calendar-sync', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncId, action: 'toggle' })
      })

      if (response.ok) {
        await loadSyncs()
        onSync() // Refresh the calendar view
        toast.success('Calendar sync updated')
      } else {
        toast.error('Failed to update calendar sync')
      }
    } catch (error) {
      console.error('Error toggling sync:', error)
      toast.error('Failed to update calendar sync')
    }
  }

  const handleDelete = async (syncId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}? This will delete all synced events.`)) {
      return
    }

    try {
      const response = await fetch(`/api/calendar-sync?syncId=${syncId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Calendar sync removed')
        await loadSyncs()
        onSync() // Refresh the calendar view
      } else {
        toast.error('Failed to remove calendar sync')
      }
    } catch (error) {
      console.error('Error deleting sync:', error)
      toast.error('Failed to remove calendar sync')
    }
  }

  const providerInfo = getCalendarProviderInfo(formData.provider)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sync External Calendars</h2>
            <p className="text-sm text-gray-600 mt-1">Connect Outlook, Google Calendar, or any iCal feed</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Sync */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add Calendar Sync</span>
            </button>
          ) : (
            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Add New Calendar</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddSync} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calendar Provider</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="outlook">Outlook / Microsoft 365</option>
                    <option value="google">Google Calendar</option>
                    <option value="apple">Apple iCloud Calendar</option>
                    <option value="other">Other (iCal/ICS feed)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{providerInfo.instructions}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calendar Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Work Calendar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ICS/iCal Feed URL *</label>
                  <input
                    type="url"
                    value={formData.icsUrl}
                    onChange={(e) => setFormData({ ...formData, icsUrl: e.target.value })}
                    placeholder={providerInfo.urlPattern}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Paste the ICS/iCal URL from your calendar provider</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">Events will be displayed in this color</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? 'Syncing...' : 'Add Calendar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Syncs */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Connected Calendars</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : syncs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No calendars synced yet</p>
                <p className="text-sm mt-1">Add your first calendar to get started</p>
              </div>
            ) : (
              syncs.map((sync) => (
                <div
                  key={sync.id}
                  className={`border rounded-lg p-4 flex items-center justify-between ${
                    sync.enabled ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: sync.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{sync.name}</h4>
                        {sync.enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{sync.provider} Calendar</p>
                      {sync.last_synced && (
                        <p className="text-xs text-gray-400 mt-1">
                          Last synced: {new Date(sync.last_synced).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRefresh(sync.id)}
                      disabled={refreshing === sync.id}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                      title="Refresh calendar"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing === sync.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleToggle(sync.id)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        sync.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sync.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleDelete(sync.id, sync.name)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove calendar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p>
              <strong>How to get your calendar URL:</strong><br />
              <span className="text-xs">
                Outlook: Calendar → Share → Publish → Copy ICS link | 
                Google: Settings → Calendar → Secret address in iCal format | 
                Apple: Share calendar → Enable "Public Calendar"
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}




