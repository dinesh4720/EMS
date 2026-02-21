import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/api'

type TimeRange = 'all' | 'today' | 'week' | 'month'

interface PageUsageData {
  page: string
  visits: number
  percentage: string
}

export default function PageUsage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [data, setData] = useState<PageUsageData[]>([])
  const [totalEvents, setTotalEvents] = useState(0)
  const [uniquePages, setUniquePages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPageUsage()
  }, [timeRange])

  const fetchPageUsage = async () => {
    setIsLoading(true)
    try {
      const response = await analyticsApi.getPageUsage(timeRange)
      if (response.data.success) {
        setData(response.data.data.pages)
        setTotalEvents(response.data.data.totalEvents)
        setUniquePages(response.data.data.uniquePages)
      }
    } catch (error) {
      console.error('Failed to fetch page usage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBarWidth = (visits: number) => {
    if (data.length === 0) return '0%'
    const maxVisits = Math.max(...data.map(d => d.visits))
    return `${(visits / maxVisits) * 100}%`
  }

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-yellow-500'
    if (index === 1) return 'bg-gray-400'
    if (index === 2) return 'bg-orange-600'
    return 'bg-blue-500'
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Page Usage Analytics</h1>
        <p className="text-gray-500 mt-1">Most visited pages ranked by usage</p>
      </header>

      {/* Time Range Filter */}
      <div className="mb-6 flex gap-2">
        {(['all', 'today', 'week', 'month'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-500 mb-1">Total Events</div>
          <div className="text-3xl font-bold text-gray-900">{totalEvents.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-500 mb-1">Unique Pages</div>
          <div className="text-3xl font-bold text-gray-900">{uniquePages}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-500 mb-1">Avg Visits/Page</div>
          <div className="text-3xl font-bold text-gray-900">
            {uniquePages > 0 ? Math.round(totalEvents / uniquePages) : 0}
          </div>
        </div>
      </div>

      {/* Page Rankings */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading page usage data...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Page Rankings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No page usage data available for this time range.
              </div>
            ) : (
              data.map((item, index) => (
                <div key={item.page} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full ${getRankColor(
                        index
                      )} flex items-center justify-center text-white font-bold`}
                    >
                      {index + 1}
                    </div>

                    {/* Page Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-mono text-sm text-gray-900 truncate">
                          {item.page}
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <span className="text-sm font-semibold text-gray-900">
                            {item.visits.toLocaleString()} visits
                          </span>
                          <span className="text-sm text-gray-500">{item.percentage}%</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${getRankColor(index)} h-2 rounded-full transition-all duration-500`}
                          style={{ width: getBarWidth(item.visits) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
