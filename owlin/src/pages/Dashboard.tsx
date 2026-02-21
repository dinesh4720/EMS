import { useDashboardStats } from '../hooks/useAnalytics'
import { useLiveSessions } from '../hooks/useLiveSessions'
import { useEffect, useState } from 'react'
import { analyticsApi, adminApi } from '../services/api'
import { Link } from 'react-router-dom'
import { getSafeDisplayName } from '../utils/objectIdHelper'

export default function Dashboard() {
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const { liveSessions } = useLiveSessions()
  const [topPages, setTopPages] = useState<Array<{ page: string; visits: number }>>([])
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    fetchTopPages()
  }, [])

  const fetchTopPages = async () => {
    try {
      const response = await analyticsApi.getPageUsage('today')
      if (response.data.success) {
        setTopPages(response.data.data.pages.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to fetch top pages:', error)
    }
  }

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all tracking data? This action cannot be undone.')) {
      return
    }

    setIsClearing(true)
    try {
      await adminApi.clearAllData()
      alert('All data cleared successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear data:', error)
      alert('Failed to clear data. Check console for details.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Owlin Tracker Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time user activity monitoring</p>
        </div>
        <button
          onClick={handleClearData}
          disabled={isClearing}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isClearing ? 'Clearing...' : 'Clear All Data'}
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {statsLoading ? '...' : (stats?.totalUsers ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Active Sessions</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {statsLoading ? '...' : (stats?.activeSessions ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Events Today</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {statsLoading ? '...' : (stats?.eventsToday ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Events This Hour</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {statsLoading ? '...' : (stats?.eventsThisHour ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Live Sessions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Live Sessions</h2>
          {liveSessions.length === 0 ? (
            <p className="text-gray-500">No active sessions. Start using school-dashboard to see events.</p>
          ) : (
            <div className="space-y-2">
              {liveSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {getSafeDisplayName({ name: session.userName, id: session.userId }, 'id')}
                    </p>
                    <p className="text-sm text-gray-500">{session.currentPage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{session.eventCount} events</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Pages Today */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Top Pages Today</h2>
            <Link
              to="/page-usage"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {topPages.length === 0 ? (
            <p className="text-gray-500">No page data available yet.</p>
          ) : (
            <div className="space-y-3">
              {topPages.map((page, index) => (
                <div key={page.page} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-gray-900 truncate">{page.page}</p>
                  </div>
                  <div className="text-sm font-semibold text-gray-600">
                    {page.visits}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">How to test:</h3>
        <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
          <li>Make sure the Owlin server is running on port 4001</li>
          <li>Open school-dashboard in another tab and log in</li>
          <li>Click around in school-dashboard - events will appear here</li>
          <li>Check the browser console in school-dashboard for [Owlin] logs</li>
        </ol>
      </div>
    </div>
  )
}
