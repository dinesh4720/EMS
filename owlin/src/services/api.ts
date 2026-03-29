import axios from 'axios'
import type { Event, AnalyticsFilter, Project, ProjectCreateResponse, AccessLog, AccessLogStats, ErrorGroup, ErrorIncident, ErrorStats } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://owlin-server.onrender.com/api/v1'
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || import.meta.env.VITE_API_KEY || 'owlin-admin-2026-super-secret'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': ADMIN_KEY,
  },
})

// ── Events API ──────────────────────────────────────────────────────────────

export const eventsApi = {
  getEvents: async (filter?: AnalyticsFilter & { limit?: number; offset?: number; type?: string }): Promise<{ events: Event[]; total: number }> => {
    const response = await api.get('/events', { params: filter })
    return response.data
  },
  getEventById: async (id: string): Promise<{ event: Event }> => {
    const response = await api.get(`/events/${id}`)
    return response.data
  },
}

// ── Analytics API ───────────────────────────────────────────────────────────

export const analyticsApi = {
  getDashboardStats: async (projectId?: string): Promise<{
    totalUsers: number
    activeSessions: number
    eventsToday: number
    eventsThisHour: number
    unresolvedErrors: number
  }> => {
    const response = await api.get('/admin/stats', { params: projectId ? { projectId } : {} })
    return response.data
  },

  getPageUsage: async (timeRange: string = 'all', projectId?: string) => {
    const response = await api.get('/stats/page-usage', { params: { timeRange, projectId } })
    return response.data
  },

  getTrends: async (params: { event?: string; interval?: string; startDate?: string; endDate?: string; projectId?: string }) => {
    const response = await api.get('/admin/analytics/trends', { params })
    return response.data
  },

  getFunnels: async (data: { steps: Array<{ event: string }>; startDate?: string; endDate?: string; projectId?: string }) => {
    const response = await api.post('/admin/analytics/funnels', data)
    return response.data
  },

  getRetention: async (params: { interval?: string; cohortCount?: number; event?: string; projectId?: string }) => {
    const response = await api.get('/admin/analytics/retention', { params })
    return response.data
  },
}

// ── Sessions API ────────────────────────────────────────────────────────────

export const sessionsApi = {
  getActiveSessions: async (): Promise<{ sessions: Array<any> }> => {
    const response = await api.get('/sessions', { params: { active: true } })
    return response.data
  },
  getSessions: async (params?: Record<string, any>): Promise<{ sessions: Array<any> }> => {
    const response = await api.get('/sessions', { params })
    return response.data
  },
}

// ── Users API ───────────────────────────────────────────────────────────────

export const usersApi = {
  getUsers: async (): Promise<{ users: Array<any> }> => {
    const response = await api.get('/users')
    return response.data
  },
  getUserById: async (id: string): Promise<{ user: any; recentEvents: any[] }> => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
}

// ── Projects API (Admin) ────────────────────────────────────────────────────

export const projectsApi = {
  getProjects: async (status?: string): Promise<{ projects: Project[] }> => {
    const response = await api.get('/admin/projects', { params: status ? { status } : {} })
    return response.data
  },
  getProject: async (id: string): Promise<{ project: Project }> => {
    const response = await api.get(`/admin/projects/${id}`)
    return response.data
  },
  createProject: async (data: {
    name: string
    description?: string
    rateLimitPerMinute?: number
    quotaEventsPerDay?: number
    retentionDays?: number
    ownerEmail?: string
  }): Promise<ProjectCreateResponse> => {
    const response = await api.post('/admin/projects', data)
    return response.data
  },
  updateProject: async (id: string, data: Record<string, any>): Promise<{ project: Project }> => {
    const response = await api.patch(`/admin/projects/${id}`, data)
    return response.data
  },
  regenerateKey: async (id: string): Promise<ProjectCreateResponse> => {
    const response = await api.post(`/admin/projects/${id}/regenerate-key`)
    return response.data
  },
  deleteProject: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/projects/${id}`)
    return response.data
  },
}

// ── Access Logs API (Admin) ─────────────────────────────────────────────────

export const accessLogsApi = {
  getLogs: async (params?: Record<string, any>): Promise<{ logs: AccessLog[]; total: number }> => {
    const response = await api.get('/admin/access-logs', { params })
    return response.data
  },
  getStats: async (): Promise<AccessLogStats> => {
    const response = await api.get('/admin/access-logs/stats')
    return response.data
  },
}

// ── Errors API (Admin) ──────────────────────────────────────────────────────

export const errorsApi = {
  getErrorGroups: async (params?: Record<string, any>): Promise<{ groups: ErrorGroup[]; total: number }> => {
    const response = await api.get('/admin/errors', { params })
    return response.data
  },
  getErrorGroup: async (fingerprint: string): Promise<ErrorGroup & { incidents: ErrorIncident[] }> => {
    const response = await api.get(`/admin/errors/${fingerprint}`)
    return response.data
  },
  getIncident: async (fingerprint: string, incidentId: string): Promise<ErrorIncident> => {
    const response = await api.get(`/admin/errors/${fingerprint}/incidents/${incidentId}`)
    return response.data
  },
  updateStatus: async (fingerprint: string, status: string): Promise<{ status: string }> => {
    const response = await api.patch(`/admin/errors/${fingerprint}`, { status })
    return response.data
  },
  getStats: async (): Promise<ErrorStats> => {
    const response = await api.get('/admin/errors/stats')
    return response.data
  },
}

// ── Admin API ───────────────────────────────────────────────────────────────

export const adminApi = {
  clearAllData: async (projectId?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/admin/data', { params: projectId ? { projectId } : {} })
    return response.data
  },
}

export default api
