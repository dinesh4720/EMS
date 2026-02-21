// Owlin Tracker Server

import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { store } from './store'
import { BatchEventsRequest, Event, Session, User } from './types'

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
  },
})

const PORT = process.env.PORT || 3002
const API_KEY = process.env.API_KEY || 'owlin-dev-key'

// Middleware
app.use(express.json())

// API Key validation middleware
const validateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' })
  }
  next()
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Batch events endpoint (for SDK)
app.post('/events/batch', validateApiKey, (req: express.Request<{}, {}, BatchEventsRequest>, res) => {
  const { events, sessionId, userId, userName, userRole } = req.body

  // Update or create session
  const session: Session = {
    id: sessionId,
    userId,
    userName,
    userRole,
    startTime: store.getSession(sessionId)?.startTime || new Date(),
    currentPage: events[events.length - 1]?.page,
    eventCount: (store.getSession(sessionId)?.eventCount || 0) + events.length,
    lastActivity: new Date(),
  }
  store.addOrUpdateSession(session)

  // Update or create user
  const user: User = {
    id: userId,
    name: userName || 'Anonymous',
    role: userRole || 'user',
    loginTime: store.getUser(userId)?.loginTime || new Date(),
    lastSeen: new Date(),
  }
  store.addOrUpdateUser(user)

  // Process events
  events.forEach(eventData => {
    const event: Event = {
      id: `${sessionId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      ...eventData,
      timestamp: new Date(eventData.timestamp),
      userId,
      sessionId,
      userName,
      userRole,
    }
    store.addEvent(event)

    // Emit live event
    io.emit('event:new', {
      ...event,
      userName: user.name,
      userRole: user.role,
    })
  })

  res.json({ received: events.length })
})

// Get events
app.get('/events', (req, res) => {
  const { limit, userId, sessionId, type } = req.query
  let events = store.getEvents(Number(limit) || 100)

  if (userId) {
    events = events.filter(e => e.userId === userId)
  }
  if (sessionId) {
    events = events.filter(e => e.sessionId === sessionId)
  }
  if (type) {
    events = events.filter(e => e.type === type)
  }

  res.json(events)
})

// Get events by session
app.get('/events/session/:sessionId', (req, res) => {
  const events = store.getEventsBySession(req.params.sessionId)
  res.json(events)
})

// Get events by user
app.get('/events/user/:userId', (req, res) => {
  const events = store.getEventsByUser(req.params.userId)
  res.json(events)
})

// Get active sessions
app.get('/sessions/active', (req, res) => {
  const sessions = store.getActiveSessions()
  res.json(sessions)
})

// Get users
app.get('/users', (req, res) => {
  const users = store.getAllUsers()
  res.json(users)
})

// Get user by ID
app.get('/users/:userId', (req, res) => {
  const user = store.getUser(req.params.userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

// Analytics endpoints
app.get('/analytics/stats', (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thisHour = new Date()
  thisHour.setMinutes(0, 0, 0)

  res.json({
    totalUsers: store.getAllUsers().length,
    activeSessions: store.getActiveSessions().length,
    eventsToday: store.getEventCount(today),
    eventsThisHour: store.getEventCount(thisHour),
  })
})

app.get('/analytics', (req, res) => {
  res.json({
    totalEvents: store.getEvents().length,
    totalSessions: store.sessionsSize(),
    uniqueUsers: store.getAllUsers().length,
    averageSessionDuration: 0, // TODO: calculate
    topPages: store.getTopPages(10),
    topEvents: [], // TODO: implement
    hourlyActivity: [], // TODO: implement
  })
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Send current active sessions
  socket.emit('sessions:active', store.getActiveSessions())

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Start server
httpServer.listen(PORT, () => {
  console.log(`Owlin tracker server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
