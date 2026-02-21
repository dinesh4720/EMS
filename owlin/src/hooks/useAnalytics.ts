import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/api'

export const useDashboardStats = () => {
  const [stats, setStats] = useState<{
    totalUsers: number
    activeSessions: number
    eventsToday: number
    eventsThisHour: number
  } | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await analyticsApi.getDashboardStats()
        // Handle { success: true, stats: {...} } format
        const data = response.stats || response
        setStats(data)
        setError(null)
      } catch (err) {
        console.error('[Owlin] Failed to fetch stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  return { stats, isLoading, error }
}
