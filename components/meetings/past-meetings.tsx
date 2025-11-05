'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, Clock, MoreVertical, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Meeting {
  id: string
  title: string
  description: string
  scheduled_at: string
  duration: number
  recording_session_id?: string
  summary?: string
  action_items: any[]
  attendees: any[]
  meeting_type: string
  ai_insights: any
}

interface PastMeetingsProps {
  meetings: Meeting[]
  selectedMeetings: string[]
  onSelectMeeting: (meetingId: string) => void
  onDeleteMeeting: (meetingId: string) => void
}

export default function PastMeetings({ 
  meetings, 
  selectedMeetings, 
  onSelectMeeting,
  onDeleteMeeting 
}: PastMeetingsProps) {
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set())

  const toggleExpanded = (meetingId: string) => {
    setExpandedMeetings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId)
      } else {
        newSet.add(meetingId)
      }
      return newSet
    })
  }

  const formatMeetingTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: format(date, 'MMM d, yyyy'),
      time: format(date, 'h:mm a')
    }
  }

  const formatDuration = (duration: number) => {
    if (duration < 60) return `<1 min`
    return `${Math.round(duration / 60)} min`
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Past Meetings ({meetings.length})
      </h2>
      
      {meetings.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No past meetings recorded</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting, index) => {
            const isExpanded = expandedMeetings.has(meeting.id)
            const hasRecording = !!meeting.recording_session_id
            const hasAIProcessing = !!meeting.summary || !!meeting.action_items?.length

            return (
              <div 
                key={meeting.id}
                className="card hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="card-content">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedMeetings.includes(meeting.id)}
                      onChange={() => onSelectMeeting(meeting.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {meeting.title}
                            </h3>
                            {hasAIProcessing && (
                              <span className="badge badge-default text-xs">
                                AI Processed
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>{formatMeetingTime(meeting.scheduled_at).date}</span>
                            <span>{formatMeetingTime(meeting.scheduled_at).time}</span>
                            <span>{formatDuration(meeting.duration)}</span>
                            {hasRecording && (
                              <span className="text-blue-600">
                                AI-processed voice recording
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="badge status-completed text-xs">
                            Completed
                          </span>
                          <button 
                            onClick={() => onDeleteMeeting(meeting.id)}
                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                            title="Delete recording"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Content */}
                      <div className="mt-4">
                        <button
                          onClick={() => toggleExpanded(meeting.id)}
                          className="flex items-center text-sm text-primary hover:text-primary/80 mb-3"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          )}
                          {isExpanded ? 'Show Less' : 'Show Details'}
                        </button>

                        {isExpanded && (
                          <div className="space-y-4 animate-fade-in">
                            {/* Summary */}
                            {meeting.summary && (
                              <div>
                                <h4 className="text-sm font-medium text-blue-600 mb-2">Summary</h4>
                                <div className="bg-blue-50 rounded-lg p-4">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {meeting.summary}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Action Items */}
                            {meeting.action_items && meeting.action_items.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-green-600 mb-2">
                                  Tasks Created ({meeting.action_items.length})
                                </h4>
                                <div className="bg-green-50 rounded-lg p-4">
                                  <ul className="space-y-2">
                                    {meeting.action_items.slice(0, 5).map((item: any, idx: number) => {
                                      // ✅ FIX: Ensure we always render a string, never an object
                                      let itemText = ''
                                      if (typeof item === 'string') {
                                        itemText = item
                                      } else if (item && typeof item === 'object') {
                                        // If it's an object, extract the title or description
                                        itemText = item.title || item.description || item.task || 'Task'
                                      } else {
                                        itemText = String(item || 'Task')
                                      }
                                      
                                      return (
                                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                          {itemText}
                                        </li>
                                      )
                                    })}
                                    {meeting.action_items.length > 5 && (
                                      <li className="text-sm text-gray-500">
                                        +{meeting.action_items.length - 5} more tasks...
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {/* AI Insights */}
                            {meeting.ai_insights && Object.keys(meeting.ai_insights).length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-purple-600 mb-2">AI Insights</h4>
                                <div className="bg-purple-50 rounded-lg p-4">
                                  <p className="text-sm text-gray-700">
                                    {JSON.stringify(meeting.ai_insights, null, 2)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
