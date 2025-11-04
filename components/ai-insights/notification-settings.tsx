'use client'

import { useState } from 'react'
import { Mail, Bell, Send } from 'lucide-react'

interface NotificationSettingsProps {
  onSendDailySummary: () => Promise<void>
  onSendTestEmail: () => Promise<void>
}

export default function NotificationSettings({ 
  onSendDailySummary, 
  onSendTestEmail 
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    emailDailySummary: true,
    smartAlerts: true
  })

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">AI Notification Settings</h3>
        <p className="card-description">
          Configure how you receive AI-powered insights and recommendations
        </p>
      </div>
      
      <div className="card-content space-y-6">
        {/* Email Daily Summary */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Email Daily Summary</h4>
            <p className="text-sm text-gray-500">
              Receive daily project insights and recommendations via email
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailDailySummary}
              onChange={(e) => handleSettingChange('emailDailySummary', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Smart Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Smart Alerts</h4>
            <p className="text-sm text-gray-500">
              Get proactive notifications about deadlines and project risks
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.smartAlerts}
              onChange={(e) => handleSettingChange('smartAlerts', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
          <button
            onClick={onSendDailySummary}
            className="btn btn-primary flex items-center"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Daily Summary Email
          </button>
          
          <button
            onClick={onSendTestEmail}
            className="btn btn-outline flex items-center"
          >
            <Bell className="h-4 w-4 mr-2" />
            Send Test Email
          </button>
        </div>
      </div>
    </div>
  )
}






















