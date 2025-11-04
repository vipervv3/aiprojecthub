'use client'

import { Calendar, Clock, Users } from 'lucide-react'
import { format } from 'date-fns'

interface Meeting {
  id: string
  title: string
  description: string
  scheduled_at: string
  duration: number
  attendees: any[]
  meeting_type: string
}

interface UpcomingMeetingsProps {
  meetings: Meeting[]
  selectedMeetings: string[]
  onSelectMeeting: (meetingId: string) => void
}

export default function UpcomingMeetings({ 
  meetings, 
  selectedMeetings, 
  onSelectMeeting 
}: UpcomingMeetingsProps) {
  const formatMeetingTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: format(date, 'MMM d, yyyy'),
      time: format(date, 'h:mm a')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Upcoming Meetings ({meetings.length})
      </h2>
      
      {meetings.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No upcoming meetings scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting, index) => (
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
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {meeting.title}
                        </h3>
                        {meeting.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="badge badge-default text-xs">
                          {meeting.meeting_type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatMeetingTime(meeting.scheduled_at).date}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatMeetingTime(meeting.scheduled_at).time}</span>
                      </div>
                      
                      {meeting.duration && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{meeting.duration} min</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{meeting.attendees?.length || 0} attendees</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
