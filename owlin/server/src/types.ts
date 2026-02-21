// Server Types

export interface Event {
  id: string
  type: string
  timestamp: Date
  userId: string
  sessionId: string
  elementType?: string
  elementId?: string
  elementText?: string
  page: string
  action: string
  data?: Record<string, unknown>
  userName?: string
  userRole?: string
}

export interface Session {
  id: string
  userId: string
  userName?: string
  userRole?: string
  startTime: Date
  endTime?: Date
  currentPage?: string
  eventCount: number
  lastActivity: Date
}

export interface User {
  id: string
  name: string
  email?: string
  role: string
  loginTime: Date
  lastSeen: Date
}

export interface BatchEventsRequest {
  events: Array<{
    type: string
    elementType?: string
    elementId?: string
    elementText?: string
    page: string
    action: string
    data?: Record<string, unknown>
    timestamp: Date
  }>
  sessionId: string
  userId: string
  userName?: string
  userRole?: string
}
