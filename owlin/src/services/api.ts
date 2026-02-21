import axios from 'axios'
import { Event, AnalyticsFilter } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Events API
export const eventsApi = {
  getEvents: async (filter?: AnalyticsFilter): Promise<{ events: Event[], pagination: { total: number } }> => {
    const response = await api.get('/events', { params: filter })
    return response.data
  },

  getEventById: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`)
    return response.data
  },
}

// Analytics API - using /stats endpoint from server
export const analyticsApi = {
  getAnalytics: async (filter?: AnalyticsFilter): Promise<{ data: unknown }> => {
    // Server doesn't have /analytics, use /stats instead
    const response = await api.get('/stats', { params: filter })
    return { data: response.data }
  },

  getDashboardStats: async (): Promise<{
    stats: {
      totalUsers: number
      activeSessions: number
      eventsToday: number
      eventsThisHour: number
    }
  }> => {
    const response = await api.get('/stats')
    return response.data
  },

  getPageUsage: async (timeRange: string = 'all'): Promise<{
    data: {
      success: boolean
      data: {
        pages: Array<{
          page: string
          visits: number
          percentage: string
        }>
        totalEvents: number
        uniquePages: number
      }
      timeRange: string
    }
  }> => {
    const response = await api.get('/analytics/page-usage', { params: { range: timeRange } })
    return response
  },
}

// Sessions API
export const sessionsApi = {
  getActiveSessions: async (): Promise<{
    sessions: Array<{
      id: string
      userId: string
      userName: string
      startTime: string
      currentPage: string
      eventCount: number
    }>
  }> => {
    const response = await api.get('/sessions', { params: { active: true } })
    return response.data
  },
}

// Users API
export const usersApi = {
  getUsers: async (): Promise<{
    users: Array<{
      id: string
      name: string
      email: string
      role: string
      loginTime: string
    }>
  }> => {
    const response = await api.get('/users')
    return response.data
  },

  getUserById: async (id: string): Promise<{
    user: {
      id: string
      name: string
      email: string
      role: string
      loginTime: string
    }
  }> => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
}

// Admin API
export const adminApi = {
  clearAllData: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/data')
    return response.data
  },
}

export default api
