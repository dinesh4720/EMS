import { create } from 'zustand'
import { Event, LiveEvent, LiveSession, AnalyticsData, AnalyticsFilter } from '../types'

interface EventStore {
  // State
  events: Event[]
  liveEvents: LiveEvent[]
  liveSessions: LiveSession[]
  analytics: AnalyticsData | null
  isLoading: boolean
  error: string | null
  filter: AnalyticsFilter

  // Actions
  setEvents: (events: Event[]) => void
  addLiveEvent: (event: LiveEvent) => void
  setLiveSessions: (sessions: LiveSession[]) => void
  updateLiveSession: (sessionId: string, updates: Partial<LiveSession>) => void
  removeLiveSession: (sessionId: string) => void
  setAnalytics: (analytics: AnalyticsData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilter: (filter: AnalyticsFilter) => void
  reset: () => void
}

const initialState = {
  events: [],
  liveEvents: [],
  liveSessions: [],
  analytics: null,
  isLoading: false,
  error: null,
  filter: {},
}

export const useEventStore = create<EventStore>((set) => ({
  ...initialState,

  setEvents: (events) => set({ events }),

  addLiveEvent: (event) =>
    set((state) => ({
      liveEvents: [event, ...state.liveEvents].slice(0, 100), // Keep last 100 events
    })),

  setLiveSessions: (sessions) => set({ liveSessions: sessions }),

  updateLiveSession: (sessionId, updates) =>
    set((state) => ({
      liveSessions: state.liveSessions.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session
      ),
    })),

  removeLiveSession: (sessionId) =>
    set((state) => ({
      liveSessions: state.liveSessions.filter((s) => s.id !== sessionId),
    })),

  setAnalytics: (analytics) => set({ analytics }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setFilter: (filter) => set({ filter }),

  reset: () => set(initialState),
}))
