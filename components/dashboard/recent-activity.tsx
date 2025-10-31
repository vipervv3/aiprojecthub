'use client'

import { CheckCircle, Calendar, FileText, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityProps {
  activities: any[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'created':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'updated':
        return <Calendar className="h-4 w-4 text-orange-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityText = (activity: any) => {
    const { action, entity_type, details } = activity
    const entityName = details?.name || details?.title || 'item'
    
    switch (action) {
      case 'completed':
        return `Completed ${entity_type}: ${entityName}`
      case 'created':
        return `Created ${entity_type}: ${entityName}`
      case 'updated':
        return `Updated ${entity_type}: ${entityName}`
      default:
        return `${action} ${entity_type}: ${entityName}`
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Recent Activity</h3>
          <button className="text-sm text-primary hover:text-primary/80">
            View all
          </button>
        </div>
      </div>
      
      <div className="card-content">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <CheckCircle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(() => {
                      try {
                        const date = new Date(activity.created_at)
                        if (isNaN(date.getTime())) {
                          return 'Recently'
                        }
                        return formatDistanceToNow(date, { addSuffix: true })
                      } catch (error) {
                        return 'Recently'
                      }
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


