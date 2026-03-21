import { useEffect, useState } from 'react'
import { sessionsApi } from '../services/api'
import { formatDate } from '../utils'
import { getSafeDisplayName, getSafeInitials } from '../utils/objectIdHelper'

interface Session {
  id: string
  userId: string
  userName?: string
  userRole?: string
  startTime: string
  endTime?: string
  duration?: number
  eventCount: number
  pages?: string[]
  metadata?: Record<string, unknown>
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const response = await sessionsApi.getActiveSessions()
      if (response.sessions) {
        setSessions(response.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const toggleSession = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId)
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">User Sessions</h1>
        <p className="text-gray-500 mt-1">View user sessions and their activities</p>
      </header>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading sessions...</div>
      ) : (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              No active sessions found.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Session Header */}
                <button
                  onClick={() => toggleSession(session.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {getSafeInitials(session.userName, 'U')}
                    </div>

                    {/* Session Info */}
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">
                        {getSafeDisplayName({ name: session.userName, id: session.userId }, 'id')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.userRole && (
                          <span className="mr-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {session.userRole}
                          </span>
                        )}
                        Started {formatDate(session.startTime)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Events</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {session.eventCount}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Duration</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {session.duration ? formatDuration(session.duration) : 'Active'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Pages</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {session.pages?.length || 0}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedSession === session.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Session Details */}
                {expandedSession === session.id && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Session Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Session ID:</span>
                          <span className="ml-2 font-mono text-gray-900">{session.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">User ID:</span>
                          <span className="ml-2 font-mono text-gray-900">{session.userId}</span>
                        </div>
                        {session.endTime && (
                          <div>
                            <span className="text-gray-500">Ended:</span>
                            <span className="ml-2 text-gray-900">
                              {formatDate(session.endTime)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {session.pages && session.pages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          Pages Visited ({session.pages.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {session.pages.map((page, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 font-mono"
                            >
                              {page}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
