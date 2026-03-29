import { useState, useEffect, useCallback } from 'react'
import { accessLogsApi, projectsApi } from '../services/api'
import type { AccessLog, AccessLogStats, Project } from '../types'

export default function AccessLogs() {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [stats, setStats] = useState<AccessLogStats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 50

  // Filters
  const [filterProject, setFilterProject] = useState('')
  const [filterMethod, setFilterMethod] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { limit, offset: page * limit }
      if (filterProject) params.projectId = filterProject
      if (filterMethod) params.method = filterMethod
      const result = await accessLogsApi.getLogs(params)
      setLogs(result.logs)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, filterProject, filterMethod])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  useEffect(() => {
    accessLogsApi.getStats().then(setStats).catch(console.error)
    projectsApi.getProjects().then((r) => setProjects(r.projects)).catch(console.error)
  }, [])

  const statusColor = (code: number) => {
    if (code < 300) return 'text-green-600 bg-green-50'
    if (code < 400) return 'text-blue-600 bg-blue-50'
    if (code < 500) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const methodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'text-blue-600',
      POST: 'text-green-600',
      PATCH: 'text-yellow-600',
      PUT: 'text-orange-600',
      DELETE: 'text-red-600',
    }
    return colors[method] ?? 'text-gray-600'
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Access Logs</h1>
        <p className="text-sm text-gray-500 mt-1">API request history across all projects</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalRequests.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">Error Rate</p>
            <p className={`text-2xl font-bold ${stats.errorRate > 5 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats.errorRate}%
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">Avg Response</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}ms</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">Last Hour</p>
            <p className="text-2xl font-bold text-gray-900">{stats.requestsLastHour}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterProject} onChange={(e) => { setFilterProject(e.target.value); setPage(0) }}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white"
        >
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={filterMethod} onChange={(e) => { setFilterMethod(e.target.value); setPage(0) }}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white"
        >
          <option value="">All Methods</option>
          {['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Time</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Project</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Method</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Endpoint</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Time</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Events</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No logs found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 text-xs">{log.projectName ?? <span className="text-gray-300">—</span>}</td>
                  <td className={`px-4 py-2 text-xs font-mono font-medium ${methodColor(log.method)}`}>{log.method}</td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-600 max-w-[200px] truncate">{log.endpoint}</td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${statusColor(log.statusCode)}`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{log.responseTimeMs}ms</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{log.eventCount ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-gray-400 font-mono">{log.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">{total} total logs</p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-500">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
