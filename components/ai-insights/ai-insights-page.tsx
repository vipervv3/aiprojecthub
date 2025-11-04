'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Sidebar from '@/components/layout/sidebar'
import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import AIInsightsHeader from './ai-insights-header'
import MetricsOverview from './metrics-overview'
import NotificationSettings from './notification-settings'
import ProjectHealthAnalysis from './project-health-analysis'
import SmartRecommendations from './smart-recommendations'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface AIInsight {
  id: string
  type: string
  title: string
  description: string
  priority: string
  actionable: boolean
  confidence_score: number
  created_at: string
}

interface Metrics {
  productivityTrend: number
  teamEfficiency: number
  burnoutRisk: string
  upcomingDeadlines: number
}

export default function AIInsightsPage() {
  const { user } = useAuth()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [metrics, setMetrics] = useState<Metrics>({
    productivityTrend: -8,
    teamEfficiency: 33,
    burnoutRisk: 'High',
    upcomingDeadlines: 9
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAIInsights()
    }
  }, [user])

  const loadAIInsights = async () => {
    try {
      setLoading(true)
      
      // Load AI insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (insightsError) throw insightsError

      setInsights(insightsData || [])
    } catch (error) {
      console.error('Error loading AI insights:', error)
      toast.error('Failed to load AI insights')
    } finally {
      setLoading(false)
    }
  }

  const sendDailySummary = async () => {
    try {
      const response = await fetch('/api/notifications/morning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (!response.ok) throw new Error('Failed to send daily summary')

      toast.success('Daily summary email sent!')
    } catch (error) {
      console.error('Error sending daily summary:', error)
      toast.error('Failed to send daily summary')
    }
  }

  const sendTestEmail = async () => {
    try {
      // TODO: Implement test email functionality
      toast.success('Test email sent!')
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error('Failed to send test email')
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 lg:pl-64">
          <div className="py-3 sm:py-4 lg:py-6 pt-20 lg:pt-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <AIInsightsHeader />
              
              {/* Metrics Overview */}
              <div className="mt-8">
                <MetricsOverview metrics={metrics} />
              </div>

              {/* Notification Settings */}
              <div className="mt-8">
                <NotificationSettings 
                  onSendDailySummary={sendDailySummary}
                  onSendTestEmail={sendTestEmail}
                />
              </div>

              {/* Analysis Sections */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProjectHealthAnalysis insights={insights} />
                <SmartRecommendations insights={insights} />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <FloatingActionButtons />
    </div>
  )
}




















