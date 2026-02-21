// In-memory store for events and sessions
// In production, replace with a proper database

import { Event, Session, User } from './types'

class DataStore {
  private events: Event[] = []
  private sessions: Map<string, Session> = new Map()
  private users: Map<string, User> = new Map()

  // Events
  addEvent(event: Event): void {
    this.events.push(event)
    // Keep only last 10000 events in memory
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000)
    }
  }

  getEvents(limit = 100): Event[] {
    return this.events.slice(-limit)
  }

  getEventsByUser(userId: string, limit = 100): Event[] {
    return this.events
      .filter(e => e.userId === userId)
      .slice(-limit)
  }

  getEventsBySession(sessionId: string, limit = 100): Event[] {
    return this.events
      .filter(e => e.sessionId === sessionId)
      .slice(-limit)
  }

  getEventsByType(type: string, limit = 100): Event[] {
    return this.events
      .filter(e => e.type === type)
      .slice(-limit)
  }

  // Sessions
  addOrUpdateSession(session: Session): void {
    this.sessions.set(session.id, session)
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId)
  }

  getActiveSessions(): Session[] {
    const now = new Date()
    const activeThreshold = 30 * 60 * 1000 // 30 minutes

    return Array.from(this.sessions.values()).filter(
      s => (now.getTime() - s.lastActivity.getTime()) < activeThreshold
    )
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.endTime = new Date()
      this.sessions.set(sessionId, session)
    }
  }

  // Users
  addOrUpdateUser(user: User): void {
    this.users.set(user.id, user)
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId)
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values())
  }

  // Analytics
  getEventCount(startTime?: Date, endTime?: Date): number {
    let events = this.events
    if (startTime) {
      events = events.filter(e => e.timestamp >= startTime)
    }
    if (endTime) {
      events = events.filter(e => e.timestamp <= endTime)
    }
    return events.length
  }

  getEventsByHour(): Map<number, number> {
    const hourlyCounts = new Map<number, number>()

    this.events.forEach(event => {
      const hour = event.timestamp.getHours()
      const count = hourlyCounts.get(hour) || 0
      hourlyCounts.set(hour, count + 1)
    })

    return hourlyCounts
  }

  getTopPages(limit = 10): Array<{ page: string; count: number }> {
    const pageCounts = new Map<string, number>()

    this.events.forEach(event => {
      const count = pageCounts.get(event.page) || 0
      pageCounts.set(event.page, count + 1)
    })

    return Array.from(pageCounts.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
}

export const store = new DataStore()
