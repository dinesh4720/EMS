import { useEffect, useState, useRef } from 'react'
import { socketService } from '../services/socket'
import { formatDate, getEventTypeColor, getEventTypeLabel } from '../utils'
import { EventType } from '../types'

const eventTypes: Array<EventType | 'all'> = ['all', 'click', 'navigation', 'form_submit', 'api_call', 'error', 'custom']

interface LiveEvent {
  id: string
  type: EventType
  timestamp: Date
  userId: string
  page: string
  elementText?: string
}

export default function LiveView() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [filter, setFilter] = useState<EventType | 'all'>('all')
  const [isPaused, setIsPaused] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    socketService.connect()
    socketService.onLiveEvent(handleNewEvent)

    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(socketService.isConnected)
    }, 1000)

    return () => {
      clearInterval(interval)
      socketService.offLiveEvent(handleNewEvent)
    }
  }, [])

  useEffect(() => {
    if (!isPaused && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [events, isPaused])

  function handleNewEvent(event: LiveEvent) {
    if (!isPaused) {
      setEvents((prev) => [event, ...prev].slice(0, 100))
    }
  }

  function clearEvents() {
    setEvents([])
  }

  const filteredEvents = events.filter(
    (e) => filter === 'all' || e.type === filter
  )

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Live View</h1>
            <p className="text-gray-500 mt-1">Real-time event stream</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Event Type</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as EventType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-gray-500"
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : getEventTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            className={`px-4 py-2 border rounded-md text-sm transition-colors ${
              isPaused
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            onClick={clearEvents}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Event Feed */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Events</span>
          <span className="text-sm text-gray-500">{filteredEvents.length}</span>
        </div>

        <div className="h-[calc(100vh-340px)] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              {isConnected ? 'Waiting for events...' : 'Connecting to server...'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEvents.map((event) => (
                <div key={event.id} className="px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{event.userId}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.elementText || event.page}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  )
}
