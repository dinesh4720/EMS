// Owlin Tracking SDK Types

export type EventType =
  | 'click'
  | 'hover'
  | 'scroll'
  | 'navigation'
  | 'form_submit'
  | 'form_focus'
  | 'api_call'
  | 'error'
  | 'custom'

export interface OwlinConfig {
  apiKey: string
  apiUrl?: string
  wsUrl?: string
  autoTrack?: boolean
  debug?: boolean
  samplingRate?: number // 0-1, default 1 (track all events)
  flushInterval?: number // milliseconds, default 5000
  batchSize?: number // default 10
  userId?: string
  userName?: string
  userRole?: string
}

export interface OwlinEvent {
  type: EventType
  elementType?: string
  elementId?: string
  elementText?: string
  page: string
  action: string
  data?: Record<string, unknown>
}

export interface OwlinSession {
  id: string
  userId?: string
  startTime: Date
  events: OwlinEvent[]
}

export interface QueuedEvent extends OwlinEvent {
  timestamp: Date
  sessionId: string
  userId?: string
}
