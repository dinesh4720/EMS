/**
 * Owlin Tracker - Backend Server
 * Receives, stores, and serves tracking events
 */

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { getEventStore } from './storage.js'
import { validateEvent, validateSession, createEvent, EventType, EventCategory } from './types.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:4000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }
})

const PORT = process.env.PORT || 4001
const store = getEventStore({ persist: true })

// Middleware
app.use(cors({
  origin: ['http://localhost:4000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))
app.use(express.json())

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// ===== API ROUTES =====

/**
 * POST /api/events
 * Receive a new tracking event
 */
app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body
    console.log('[Server] Received single event:', eventData.type || eventData)

    // Handle batch format { events: [...] }
    if (eventData.events && Array.isArray(eventData.events)) {
      console.log('[Server] Batch format detected, redirecting to batch handler')
      const events = eventData.events
      const createdEvents = []

      for (const evt of events) {
        const event = createEvent(evt)

        // Update user metadata from event app data
        if (event.userId) {
          const userMetadata = evt.userMetadata || {}
          if (event.app?.user) Object.assign(userMetadata, event.app.user)
          store.getUser(event.userId, userMetadata)
        }

        const storedEvent = store.addEvent(event)
        createdEvents.push(storedEvent)

        // Enrich with user data before broadcasting
        const user = store.getUserById(event.userId)
        const enrichedEvent = {
          ...storedEvent,
          userName: user?.metadata?.name || event.userId,
          userEmail: user?.metadata?.email || null,
          userRole: user?.metadata?.role || null
        }
        io.emit('event:new', enrichedEvent)
      }

      return res.status(201).json({
        success: true,
        created: createdEvents.length,
        events: createdEvents
      })
    }

    // Create and validate event
    const event = createEvent(eventData)
    const validation = validateEvent(event)

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid event data',
        details: validation.errors
      })
    }

    // Store the event
    const storedEvent = store.addEvent(event)

    // Update user with metadata from event
    if (event.userId) {
      const userMetadata = req.body.userMetadata || {}
      // Extract user info from event if available
      if (event.app?.user) {
        Object.assign(userMetadata, event.app.user)
      }

      console.log('[Server] Updating user metadata:', {
        userId: event.userId,
        metadata: userMetadata,
        hasAppUser: !!event.app?.user,
        appUser: event.app?.user
      })

      store.getUser(event.userId, userMetadata)
    }

    // Track page in session
    if (event.sessionId && event.page) {
      const session = store.getSession(event.sessionId)
      if (session && !session.pages.includes(event.page)) {
        session.pages.push(event.page)
      }
    }

    // Enrich event with user data before broadcasting
    const user = store.getUserById(event.userId)
    const enrichedEvent = {
      ...storedEvent,
      userName: user?.metadata?.name || event.userId,
      userEmail: user?.metadata?.email || null,
      userRole: user?.metadata?.role || null
    }

    // Broadcast to all connected clients
    io.emit('event:new', enrichedEvent)
    console.log('[Server] Event stored and broadcast:', enrichedEvent.type, enrichedEvent.id)

    res.status(201).json({
      success: true,
      event: storedEvent
    })
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({
      error: 'Failed to create event',
      message: error.message
    })
  }
})

/**
 * POST /api/events/batch
 * Receive multiple events at once
 */
app.post('/api/events/batch', async (req, res) => {
  try {
    const { events } = req.body
    console.log('[Server] Received batch of', events?.length || 0, 'events')

    if (!Array.isArray(events)) {
      console.log('[Server] Invalid batch format:', typeof events)
      return res.status(400).json({
        error: 'Events must be an array'
      })
    }

    // ── PASS 1: Update user metadata from ALL events first ──────────────────
    // This ensures that even if user_identify and click events arrive in the
    // same batch, the user store is populated before we enrich any events.
    for (const eventData of events) {
      if (!eventData.userId) continue

      // Collect metadata from all available sources
      const metadata = {}

      // Top-level userMetadata (most reliable — set on every event by the SDK)
      if (eventData.userMetadata && typeof eventData.userMetadata === 'object') {
        Object.assign(metadata, eventData.userMetadata)
      }
      // Nested in app.user
      if (eventData.app?.user && typeof eventData.app.user === 'object') {
        Object.assign(metadata, eventData.app.user)
      }
      // From user_properties event
      if (eventData.type === 'user_properties' && eventData.properties) {
        Object.assign(metadata, eventData.properties)
      }

      if (Object.keys(metadata).length > 0) {
        store.getUser(eventData.userId, metadata)
        if (metadata.name) {
          console.log('[Server] Batch pass1 - Updated user:', eventData.userId, '->', metadata.name)
        }
      }
    }

    // ── PASS 2: Store events and collect results ────────────────────────────
    const createdEvents = []
    const errors = []

    for (const eventData of events) {
      try {
        const event = createEvent(eventData)
        const validation = validateEvent(event)

        if (!validation.valid) {
          errors.push({ event: eventData, errors: validation.errors })
          continue
        }

        const storedEvent = store.addEvent(event)
        createdEvents.push(storedEvent)
      } catch (error) {
        errors.push({ event: eventData, error: error.message })
      }
    }

    // Enrich events with user data before broadcasting — user store was already
    // updated in Pass 1, so getUserById should now return the correct name.
    const enrichedCreatedEvents = createdEvents.map(storedEvent => {
      const user = store.getUserById(storedEvent.userId)
      const embeddedMeta = storedEvent.userMetadata || storedEvent.app?.user || {}
      return {
        ...storedEvent,
        userName: user?.metadata?.name || embeddedMeta.name || null,
        userEmail: user?.metadata?.email || embeddedMeta.email || null,
        userRole: user?.metadata?.role || embeddedMeta.role || null,
      }
    })

    // Broadcast batch summary
    io.emit('events:batch', {
      count: enrichedCreatedEvents.length,
      events: enrichedCreatedEvents
    })

    res.status(201).json({
      success: true,
      created: createdEvents.length,
      failed: errors.length,
      events: createdEvents,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error creating batch events:', error)
    res.status(500).json({
      error: 'Failed to create events',
      message: error.message
    })
  }
})

/**
 * GET /api/events
 * Get all events with pagination and filtering
 */
app.get('/api/events', (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
      userId: req.query.userId,
      sessionId: req.query.sessionId,
      type: req.query.type,
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    }

    const result = store.getEvents(options)

    // Enrich events with user data — check user store first, then fall back
    // to metadata embedded in the event itself (app.user or userMetadata)
    const enrichedEvents = result.data.map(event => {
      const user = store.getUserById(event.userId)
      const embeddedMeta = event.userMetadata || event.app?.user || {}
      const name = user?.metadata?.name || embeddedMeta.name || null
      const email = user?.metadata?.email || embeddedMeta.email || null
      const role = user?.metadata?.role || embeddedMeta.role || null
      return {
        ...event,
        userName: name,
        userEmail: email,
        userRole: role,
      }
    })

    res.json({
      success: true,
      events: enrichedEvents,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message
    })
  }
})

/**
 * GET /api/events/:id
 * Get a single event by ID
 */
app.get('/api/events/:id', (req, res) => {
  try {
    const event = store.getEventById(req.params.id)

    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    res.json({
      success: true,
      event
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({
      error: 'Failed to fetch event',
      message: error.message
    })
  }
})

/**
 * GET /api/users
 * Get all tracked users
 */
app.get('/api/users', (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    }

    const result = store.getUsers(options)

    // Flatten user metadata for easier consumption
    const enrichedUsers = result.data.map(user => ({
      id: user.id,
      name: user.metadata?.name || user.id,
      email: user.metadata?.email || null,
      role: user.metadata?.role || null,
      loginTime: user.firstSeen,
      lastSeen: user.lastSeen,
      eventCount: user.eventCount,
      sessions: user.sessions
    }))

    res.json({
      success: true,
      users: enrichedUsers,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    })
  }
})

/**
 * POST /api/users/identify
 * Pre-register a user with their metadata in the server store.
 * Called immediately when a user logs in so that subsequent events
 * can be enriched with the correct username right away.
 */
app.post('/api/users/identify', (req, res) => {
  try {
    const { userId, metadata = {} } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    // Upsert user with provided metadata
    const user = store.getUser(userId, metadata)

    console.log('[Server] User identified:', userId, metadata?.name || '(no name)')

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.metadata?.name || userId,
        email: user.metadata?.email || null,
        role: user.metadata?.role || null,
      }
    })
  } catch (error) {
    console.error('Error identifying user:', error)
    res.status(500).json({
      error: 'Failed to identify user',
      message: error.message
    })
  }
})

/**
 * GET /api/users/:id
 * Get user details with activity
 */
app.get('/api/users/:id', (req, res) => {
  try {
    const user = store.getUserById(req.params.id)

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    const hours = parseInt(req.query.hours) || 24
    const activity = store.getUserActivity(req.params.id, { hours })

    res.json({
      success: true,
      user: {
        ...user,
        recentActivity: activity
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    })
  }
})

/**
 * GET /api/sessions
 * Get all sessions
 */
app.get('/api/sessions', (req, res) => {
  try {
    const options = {
      userId: req.query.userId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      active: req.query.active === 'true' ? true : undefined
    }

    const result = store.getSessions(options)

    // Enrich sessions with user data
    const enrichedSessions = result.data.map(session => {
      const user = store.getUserById(session.userId)
      return {
        ...session,
        userName: user?.metadata?.name || session.userId,
        userEmail: user?.metadata?.email || null,
        userRole: user?.metadata?.role || null
      }
    })

    res.json({
      success: true,
      sessions: enrichedSessions,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    res.status(500).json({
      error: 'Failed to fetch sessions',
      message: error.message
    })
  }
})

/**
 * GET /api/sessions/:id
 * Get session details
 */
app.get('/api/sessions/:id', (req, res) => {
  try {
    const session = store.getSession(req.params.id)

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      })
    }

    res.json({
      success: true,
      session
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    res.status(500).json({
      error: 'Failed to fetch session',
      message: error.message
    })
  }
})

/**
 * POST /api/session/start
 * Start a new user session
 */
app.post('/api/session/start', (req, res) => {
  try {
    const { userId, metadata } = req.body

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      })
    }

    const session = store.startSession(userId, metadata)

    io.emit('session:started', session)

    res.status(201).json({
      success: true,
      session
    })
  } catch (error) {
    console.error('Error starting session:', error)
    res.status(500).json({
      error: 'Failed to start session',
      message: error.message
    })
  }
})

/**
 * POST /api/session/end
 * End a user session
 */
app.post('/api/session/end', (req, res) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId is required'
      })
    }

    const session = store.endSession(sessionId)

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      })
    }

    io.emit('session:ended', session)

    res.json({
      success: true,
      session
    })
  } catch (error) {
    console.error('Error ending session:', error)
    res.status(500).json({
      error: 'Failed to end session',
      message: error.message
    })
  }
})

/**
 * GET /api/stats
 * Get dashboard statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const fullStats = store.getStats()

    // Format for dashboard
    const stats = {
      totalUsers: fullStats.total?.users || 0,
      activeSessions: fullStats.today?.activeSessions || 0,
      eventsToday: fullStats.today?.events || 0,
      eventsThisHour: fullStats.hourly?.events || 0
    }

    console.log('[Server] Stats requested:', stats)

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    })
  }
})

/**
 * GET /api/analytics/page-usage
 * Get page usage statistics ranked by visits
 */
app.get('/api/analytics/page-usage', (req, res) => {
  try {
    const timeRange = req.query.range || 'all' // all, today, week, month
    const pageUsage = store.getPageUsage({ timeRange })

    res.json({
      success: true,
      data: pageUsage,
      timeRange
    })
  } catch (error) {
    console.error('Error fetching page usage:', error)
    res.status(500).json({
      error: 'Failed to fetch page usage',
      message: error.message
    })
  }
})

/**
 * DELETE /api/data
 * Clear all stored data
 */
app.delete('/api/data', async (req, res) => {
  try {
    await store.clear()

    io.emit('data:cleared', {
      timestamp: new Date().toISOString()
    })

    res.json({
      success: true,
      message: 'All data cleared'
    })
  } catch (error) {
    console.error('Error clearing data:', error)
    res.status(500).json({
      error: 'Failed to clear data',
      message: error.message
    })
  }
})

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// ===== WEBSOCKET HANDLERS =====

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Join a room for user-specific updates
  socket.on('user:subscribe', (userId) => {
    const room = `user:${userId}`
    socket.join(room)
    console.log(`Socket ${socket.id} joined room: ${room}`)
  })

  // Join a room for session-specific updates
  socket.on('session:subscribe', (sessionId) => {
    const room = `session:${sessionId}`
    socket.join(room)
    console.log(`Socket ${socket.id} joined room: ${room}`)
  })

  // Leave room
  socket.on('leave', (room) => {
    socket.leave(room)
    console.log(`Socket ${socket.id} left room: ${room}`)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })

  // Echo for testing
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() })
  })
})

// ===== ERROR HANDLING =====

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// ===== SERVER STARTUP =====

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   Owlin Tracker - Backend Server        ║
╠═══════════════════════════════════════════╣
║   Port: ${PORT}                           ║
║   CORS: 4000, 5173, 5174                 ║
║   Persistence: Enabled                   ║
╚═══════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await store.flush()
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await store.flush()
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
