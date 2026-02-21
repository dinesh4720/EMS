import { useEffect, useState } from 'react'
import { socketService } from '../services/socket'
import { eventsApi } from '../services/api'
import { formatDate } from '../utils'

export default function Events() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial events (click only)
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      try {
        const response = await eventsApi.getEvents()
        const data = response.events || (response as any).data || []
        const allEvents = Array.isArray(data) ? data : []
        setEvents(allEvents.filter((e: any) => e.type === 'click').slice(0, 200))
      } catch (err) {
        console.error('[Events] Failed to fetch events:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Subscribe to real-time events via socket
  useEffect(() => {
    socketService.connect()

    const handleNewEvent = (event: any) => {
      if (event.type !== 'click') return
      setEvents(prev => {
        if (prev.some(e => e.id === event.id)) return prev
        return [event, ...prev].slice(0, 200)
      })
    }

    const handleBatchEvents = (data: any) => {
      if (data.events && Array.isArray(data.events)) {
        const clickEvents = data.events.filter((e: any) => e.type === 'click')
        if (clickEvents.length === 0) return
        setEvents(prev => {
          const existingIds = new Set(prev.map((e: any) => e.id))
          const newEvents = clickEvents.filter((e: any) => !existingIds.has(e.id))
          if (newEvents.length === 0) return prev
          return [...newEvents, ...prev].slice(0, 200)
        })
      }
    }

    socketService.on('event:new', handleNewEvent)
    socketService.on('events:batch', handleBatchEvents)

    return () => {
      socketService.off('event:new', handleNewEvent)
      socketService.off('events:batch', handleBatchEvents)
    }
  }, [])

  return (
    <div className="p-6">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Click Events</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Tracking buttons, tabs, links, rows and other interactive elements
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          Live
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 text-gray-500 py-12 justify-center">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading events…
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Click Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  {/* Time */}
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </td>

                  {/* Click Type — kind of element clicked */}
                  <td className="px-4 py-3">
                    <ClickTypeBadge kind={getElementKind(event)} />
                  </td>

                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                        {getInitials(event.userName || event.app?.user?.name || event.userMetadata?.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-gray-900 font-medium truncate">
                          {getDisplayName(event)}
                        </div>
                        {event.userRole && (
                          <div className="text-xs text-gray-400 truncate">{event.userRole}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Comment — human-readable description of what was clicked */}
                  <td className="px-4 py-3 text-gray-700">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{getClickComment(event)}</span>
                      <span className="text-xs text-gray-400">{formatPagePath(event.page)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {events.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🖱️</div>
              <p className="text-gray-500 font-medium">No click events yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Click buttons, tabs, or rows in the school dashboard to see events here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const KIND_STYLES: Record<string, string> = {
  'Tab': 'bg-purple-100 text-purple-700',
  'Button': 'bg-blue-100 text-blue-700',
  'Icon Button': 'bg-slate-100 text-slate-600',
  'Link': 'bg-cyan-100 text-cyan-700',
  'Row': 'bg-amber-100 text-amber-700',
  'List Item': 'bg-orange-100 text-orange-700',
  'Checkbox': 'bg-green-100 text-green-700',
  'Radio': 'bg-green-100 text-green-700',
  'Dropdown': 'bg-pink-100 text-pink-700',
  'Menu Item': 'bg-violet-100 text-violet-700',
}

function ClickTypeBadge({ kind }: { kind: string }) {
  const cls = KIND_STYLES[kind] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {kind}
    </span>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Check if a string looks like a MongoDB ObjectId (24 hex chars) */
function isObjectId(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false
  return /^[a-f\d]{24}$/i.test(str)
}

/** Return a human-readable display name, never showing raw ObjectIds */
function getDisplayName(event: any): string {
  // 1. Server-enriched userName field
  const userName = event.userName
  if (userName && !isObjectId(userName)) return userName

  // 2. Embedded in event payload (app.user.name or userMetadata.name)
  const embeddedName = event.app?.user?.name || event.userMetadata?.name
  if (embeddedName && !isObjectId(embeddedName)) return embeddedName

  // 3. userId — only show if it's not an ObjectId
  const userId = event.userId
  if (userId && !isObjectId(userId)) return userId

  // 4. Last resort: shorten the ObjectId
  if (userId) return `User …${userId.slice(-6)}`
  return 'Unknown'
}

/** Return initials from a name (skip if it's an ObjectId) */
function getInitials(name: string | null | undefined): string {
  if (!name || isObjectId(name)) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/** Get the element kind from the event */
function getElementKind(event: any): string {
  return event.element?.kind || 'Element'
}

/**
 * Build a human-readable "comment" describing what was clicked.
 * Examples:
 *   "Clicked 'Students' tab"
 *   "Clicked 'Edit' button"
 *   "Clicked row: Aarav (ADM2024161)"
 *   "Clicked 'Delete' icon button"
 */
function getClickComment(event: any): string {
  const el = event.element
  if (!el) return 'Clicked something'

  const kind = el.kind || 'Element'
  const label = el.label || el.text || ''

  if (!label) return `Clicked ${kind.toLowerCase()}`

  // Truncate long labels
  const shortLabel = label.length > 50 ? label.substring(0, 50) + '…' : label

  switch (kind) {
    case 'Tab': return `Switched to "${shortLabel}" tab`
    case 'Button': return `Clicked "${shortLabel}"`
    case 'Icon Button': return `Clicked ${shortLabel ? `"${shortLabel}"` : 'icon'} button`
    case 'Link': return `Navigated to "${shortLabel}"`
    case 'Row': return `Opened: ${shortLabel}`
    case 'List Item': return `Selected: ${shortLabel}`
    case 'Checkbox': return `Toggled "${shortLabel}"`
    case 'Radio': return `Selected "${shortLabel}"`
    case 'Dropdown': return `Opened "${shortLabel}" dropdown`
    case 'Menu Item': return `Clicked menu: "${shortLabel}"`
    default: return `Clicked "${shortLabel}"`
  }
}

/** Format page path — prefer title over raw path with ObjectIds */
function formatPagePath(page: any): string {
  if (!page) return ''

  if (typeof page === 'object') {
    if (page.title) {
      // "Aarav Kumar - Students - SchoolSync" → "Students"
      const parts = page.title.split(' - ')
      // Find the section name (not the app name and not a person's name)
      const section = parts.find((p: string) =>
        p !== 'SchoolSync' && p !== 'School Dashboard' && p.length < 30
      )
      if (section) return section
    }
    const rawPath = page.path || page.url || ''
    return shortenPath(rawPath)
  }

  if (typeof page === 'string') return shortenPath(page)
  return ''
}

/** Shorten ObjectIds in a path to last 6 chars */
function shortenPath(path: string): string {
  if (!path) return ''
  return path.replace(/\/([a-f\d]{24})/gi, (_m, id) => `/…${id.slice(-6)}`)
}
