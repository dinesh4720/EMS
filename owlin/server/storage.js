/**
 * In-memory storage for events and sessions
 * with optional file persistence
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, 'data.json')

/**
 * EventStore - Manages storage of events, users, and sessions
 */
export class EventStore {
  #events = []
  #users = new Map()
  #sessions = new Map()
  #persistenceEnabled = false
  #dirty = false
  #persistTimeout = null

  constructor(options = {}) {
    this.#persistenceEnabled = options.persist !== false
    this.#init()
  }

  async #init() {
    if (this.#persistenceEnabled) {
      await this.#loadFromFile()
    }
  }

  /**
   * Add a new event
   */
  addEvent(event) {
    this.#events.push({
      ...event,
      index: this.#events.length
    })
    this.#dirty = true
    this.#persistDebounced()
    return event
  }

  /**
   * Get events with pagination and filtering
   */
  getEvents(options = {}) {
    const {
      limit = 100,
      offset = 0,
      userId,
      sessionId,
      type,
      category,
      startDate,
      endDate
    } = options

    let filtered = [...this.#events]

    // Apply filters
    if (userId) {
      filtered = filtered.filter(e => e.userId === userId)
    }
    if (sessionId) {
      filtered = filtered.filter(e => e.sessionId === sessionId)
    }
    if (type) {
      filtered = filtered.filter(e => e.type === type)
    }
    if (category) {
      filtered = filtered.filter(e => e.category === category)
    }
    if (startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(startDate))
    }
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(endDate))
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    // Apply pagination
    const total = filtered.length
    const data = filtered.slice(offset, offset + limit)

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  }

  /**
   * Get single event by ID
   */
  getEventById(id) {
    return this.#events.find(e => e.id === id) || null
  }

  /**
   * Get or create user
   */
  getUser(userId, metadata = {}) {
    if (!this.#users.has(userId)) {
      this.#users.set(userId, {
        id: userId,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        eventCount: 0,
        sessions: [],
        metadata
      })
    } else {
      // Update metadata if provided
      const user = this.#users.get(userId)
      if (metadata && Object.keys(metadata).length > 0) {
        user.metadata = { ...user.metadata, ...metadata }
      }
    }

    const user = this.#users.get(userId)
    user.lastSeen = new Date().toISOString()
    user.eventCount++
    this.#dirty = true

    return user
  }

  /**
   * Get all users
   */
  getUsers(options = {}) {
    const { limit = 50, offset = 0 } = options
    const users = Array.from(this.#users.values())
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))

    return {
      data: users.slice(offset, offset + limit),
      pagination: {
        total: users.length,
        limit,
        offset,
        hasMore: offset + limit < users.length
      }
    }
  }

  /**
   * Get user by ID
   */
  getUserById(userId) {
    return this.#users.get(userId) || null
  }

  /**
   * Start a new session
   */
  startSession(userId, metadata = {}) {
    const sessionId = crypto.randomUUID()
    const session = {
      id: sessionId,
      userId,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      eventCount: 0,
      pages: [],
      metadata
    }

    this.#sessions.set(sessionId, session)

    // Add session to user
    const user = this.getUser(userId)
    user.sessions.push(sessionId)

    this.#dirty = true
    this.#persistDebounced()

    return session
  }

  /**
   * End a session
   */
  endSession(sessionId) {
    const session = this.#sessions.get(sessionId)
    if (!session) {
      return null
    }

    session.endTime = new Date().toISOString()
    session.duration = new Date(session.endTime) - new Date(session.startTime)

    this.#dirty = true
    this.#persistDebounced()

    return session
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.#sessions.get(sessionId) || null
  }

  /**
   * Get all sessions
   */
  getSessions(options = {}) {
    const { userId, limit = 50, offset = 0, active } = options

    let sessions = Array.from(this.#sessions.values())

    if (userId) {
      sessions = sessions.filter(s => s.userId === userId)
    }

    if (active === true) {
      sessions = sessions.filter(s => !s.endTime)
    }

    // Sort by start time descending
    sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

    return {
      data: sessions.slice(offset, offset + limit),
      pagination: {
        total: sessions.length,
        limit,
        offset,
        hasMore: offset + limit < sessions.length
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(options = {}) {
    const { startDate, endDate } = options
    let events = [...this.#events]

    if (startDate) {
      events = events.filter(e => new Date(e.timestamp) >= new Date(startDate))
    }
    if (endDate) {
      events = events.filter(e => new Date(e.timestamp) <= new Date(endDate))
    }

    // Calculate stats
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const todayEvents = events.filter(e => e.timestamp >= today)

    // Event type breakdown
    const eventsByType = {}
    events.forEach(e => {
      eventsByType[e.type] = (eventsByType[e.type] || 0) + 1
    })

    // Page views
    const pageViews = events.filter(e => e.type === 'page_view')
    const uniquePages = new Set(pageViews.map(e => e.page)).size

    // Active sessions (sessions without endTime that started today)
    const activeSessions = Array.from(this.#sessions.values())
      .filter(s => !s.endTime && s.startTime >= today)
      .length

    // Error rate
    const errorEvents = events.filter(e => e.category === 'error').length
    const errorRate = events.length > 0 ? (errorEvents / events.length * 100).toFixed(2) : 0

    // Average session duration
    const completedSessions = Array.from(this.#sessions.values()).filter(s => s.endTime)
    const avgDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length
      : 0

    return {
      total: {
        events: events.length,
        users: this.#users.size,
        sessions: this.#sessions.size
      },
      today: {
        events: todayEvents.length,
        pageViews: pageViews.filter(e => e.timestamp >= today).length,
        uniquePages,
        activeSessions
      },
      breakdown: {
        byType: eventsByType,
        errorRate: parseFloat(errorRate)
      },
      performance: {
        avgSessionDuration: Math.round(avgDuration)
      }
    }
  }

  /**
   * Get user activity timeline
   */
  getUserActivity(userId, options = {}) {
    const { hours = 24 } = options
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const userEvents = this.#events
      .filter(e => e.userId === userId && new Date(e.timestamp) >= since)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return userEvents
  }

  /**
   * Get page usage statistics
   */
  getPageUsage(options = {}) {
    const { timeRange = 'all' } = options
    let events = [...this.#events]

    // Filter by time range
    const now = new Date()
    if (timeRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      events = events.filter(e => new Date(e.timestamp) >= today)
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      events = events.filter(e => new Date(e.timestamp) >= weekAgo)
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      events = events.filter(e => new Date(e.timestamp) >= monthAgo)
    }

    // Count page visits
    const pageCounts = {}
    events.forEach(event => {
      let pagePath = null
      
      // Extract page path from different event structures
      if (typeof event.page === 'string') {
        pagePath = event.page
      } else if (event.page && event.page.path) {
        pagePath = event.page.path
      } else if (event.page && event.page.url) {
        try {
          const url = new URL(event.page.url)
          pagePath = url.pathname
        } catch (e) {
          pagePath = event.page.url
        }
      }

      if (pagePath) {
        // Clean up the path
        pagePath = pagePath.replace(/\/$/, '') || '/'
        pageCounts[pagePath] = (pageCounts[pagePath] || 0) + 1
      }
    })

    // Convert to array and sort by count
    const rankedPages = Object.entries(pageCounts)
      .map(([page, count]) => ({
        page,
        visits: count,
        percentage: events.length > 0 ? ((count / events.length) * 100).toFixed(2) : 0
      }))
      .sort((a, b) => b.visits - a.visits)

    return {
      pages: rankedPages,
      totalEvents: events.length,
      uniquePages: rankedPages.length
    }
  }

  /**
   * Clear all data
   */
  async clear() {
    this.#events = []
    this.#users.clear()
    this.#sessions.clear()
    this.#dirty = true

    if (this.#persistenceEnabled) {
      try {
        await fs.unlink(DATA_FILE)
      } catch {
        // File might not exist
      }
    }
  }

  /**
   * Persist data to file
   */
  async #persist() {
    if (!this.#persistenceEnabled || !this.#dirty) return

    try {
      const data = {
        events: this.#events,
        users: Array.from(this.#users.entries()),
        sessions: Array.from(this.#sessions.entries()),
        savedAt: new Date().toISOString()
      }

      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
      this.#dirty = false
    } catch (error) {
      console.error('Failed to persist data:', error.message)
    }
  }

  /**
   * Debounced persistence
   */
  #persistDebounced() {
    if (this.#persistTimeout) {
      clearTimeout(this.#persistTimeout)
    }

    this.#persistTimeout = setTimeout(() => {
      this.#persist()
    }, 1000)
  }

  /**
   * Load data from file
   */
  async #loadFromFile() {
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8')
      const data = JSON.parse(content)

      this.#events = data.events || []
      this.#users = new Map(data.users || [])
      this.#sessions = new Map(data.sessions || [])

      console.log(`Loaded ${this.#events.length} events, ${this.#users.size} users, ${this.#sessions.size} sessions`)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load data:', error.message)
      }
    }
  }

  /**
   * Force immediate persistence
   */
  async flush() {
    await this.#persist()
  }
}

// Singleton instance
let storeInstance = null

/**
 * Get or create the event store instance
 */
export function getEventStore(options) {
  if (!storeInstance) {
    storeInstance = new EventStore(options)
  }
  return storeInstance
}
