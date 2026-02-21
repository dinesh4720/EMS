import { io, Socket } from 'socket.io-client'
import { LiveEvent, LiveSession } from '../types'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

class SocketService {
  private socket: Socket | null = null
  // Stores all registered callbacks so we can re-register them on reconnect
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map()

  connect() {
    if (this.socket) return // Already connecting or connected

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id)
      // Re-register all stored listeners after (re)connect so none are missed
      this.listeners.forEach((callbacks, eventName) => {
        callbacks.forEach(cb => this.socket?.on(eventName, cb))
      })
    })

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
    })
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  // ── Typed convenience methods ──────────────────────────────────────────────

  onLiveEvent(callback: (event: LiveEvent) => void) {
    this.on('event:new', callback as (data: unknown) => void)
  }

  offLiveEvent(callback: (event: LiveEvent) => void) {
    this.off('event:new', callback as (data: unknown) => void)
  }

  onLiveSessionJoin(callback: (session: LiveSession) => void) {
    this.on('session:join', callback as (data: unknown) => void)
  }

  offLiveSessionJoin(callback: (session: LiveSession) => void) {
    this.off('session:join', callback as (data: unknown) => void)
  }

  onLiveSessionLeave(callback: (sessionId: string) => void) {
    this.on('session:leave', callback as (data: unknown) => void)
  }

  offLiveSessionLeave(callback: (sessionId: string) => void) {
    this.off('session:leave', callback as (data: unknown) => void)
  }

  onLiveSessionUpdate(callback: (session: LiveSession) => void) {
    this.on('session:update', callback as (data: unknown) => void)
  }

  offLiveSessionUpdate(callback: (session: LiveSession) => void) {
    this.off('session:update', callback as (data: unknown) => void)
  }

  // ── Room management ────────────────────────────────────────────────────────

  joinRoom(room: string) {
    this.socket?.emit('join:room', room)
  }

  leaveRoom(room: string) {
    this.socket?.emit('leave:room', room)
  }

  // ── Generic listener API ───────────────────────────────────────────────────

  /**
   * Register a listener for a socket event.
   * Safe to call before connect() — the listener will be registered
   * on the socket once it connects (or immediately if already connected).
   */
  on(eventName: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, [])
    }
    const list = this.listeners.get(eventName)!
    if (!list.includes(callback)) {
      list.push(callback)
    }
    // Register immediately if socket already exists
    if (this.socket) {
      this.socket.on(eventName, callback)
    }
  }

  off(eventName: string, callback: (data: unknown) => void) {
    const list = this.listeners.get(eventName)
    if (list) {
      const idx = list.indexOf(callback)
      if (idx > -1) list.splice(idx, 1)
    }
    this.socket?.off(eventName, callback)
  }

  removeAllListeners() {
    this.listeners.forEach((callbacks, eventName) => {
      callbacks.forEach(cb => this.socket?.off(eventName, cb))
    })
    this.listeners.clear()
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const socketService = new SocketService()
export const socket = socketService // Alias for convenience
