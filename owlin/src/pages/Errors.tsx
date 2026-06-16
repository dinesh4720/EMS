import { useState, useEffect, useCallback } from 'react'
import { errorsApi } from '../services/api'
import type { ErrorGroup, ErrorIncident, ErrorStats } from '../types'
import { formatDistanceToNow } from 'date-fns'

type View = 'list' | 'detail' | 'incident'

export default function Errors() {
  const [view, setView] = useState<View>('list')
  const [groups, setGroups] = useState<ErrorGroup[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('unresolved')
  const [moduleFilter, setModuleFilter] = useState('')

  // Detail view
  const [selectedGroup, setSelectedGroup] = useState<(ErrorGroup & { incidents: ErrorIncident[] }) | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<ErrorIncident | null>(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { limit: 50 }
      if (statusFilter) params.status = statusFilter
      if (moduleFilter) params.module = moduleFilter
      const result = await errorsApi.getErrorGroups(params)
      setGroups(result.groups)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to fetch errors:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, moduleFilter])

  useEffect(() => { fetchGroups() }, [fetchGroups])
  useEffect(() => { errorsApi.getStats().then(setStats).catch(console.error) }, [])

  const openDetail = async (fingerprint: string) => {
    try {
      const detail = await errorsApi.getErrorGroup(fingerprint)
      setSelectedGroup(detail)
      setView('detail')
    } catch (err) {
      console.error('Failed to fetch error detail:', err)
    }
  }

  const openIncident = (incident: ErrorIncident) => {
    setSelectedIncident(incident)
    setView('incident')
  }

  const handleStatusUpdate = async (fingerprint: string, status: string) => {
    await errorsApi.updateStatus(fingerprint, status)
    fetchGroups()
    if (selectedGroup) {
      selectedGroup.status = status as 'unresolved' | 'resolved' | 'ignored'
      setSelectedGroup({ ...selectedGroup })
    }
  }

  const severityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      error: 'bg-red-100 text-red-700',
      warning: 'bg-yellow-100 text-yellow-700',
      unhandled_rejection: 'bg-orange-100 text-orange-700',
      api_error: 'bg-purple-100 text-purple-700',
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[severity] ?? 'bg-gray-100'}`}>{severity.replace('_', ' ')}</span>
  }

  const breadcrumbIcon = (type: string) => {
    const icons: Record<string, string> = {
      navigation: '🧭', click: '👆', api_call: '🌐', error: '❌',
      form_submit: '📝', input: '⌨️', custom: '⚡',
    }
    return icons[type] ?? '•'
  }

  // ── Incident View (Journey Timeline) ──────────────────────────────────────
  if (view === 'incident' && selectedIncident) {
    const inc = selectedIncident
    return (
      <div className="p-6 max-w-4xl">
        <button onClick={() => setView('detail')} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1">
          &larr; Back to error group
        </button>

        {/* Error Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            {severityBadge(inc.severity)}
            <span className="text-xs text-gray-500">{inc.source}</span>
            {inc.module && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{inc.module}</span>}
          </div>
          <h2 className="text-lg font-bold text-red-900 font-mono">{inc.message}</h2>
          {inc.file && <p className="text-sm text-red-700 mt-1 font-mono">{inc.file}:{inc.line}</p>}
          <p className="text-xs text-gray-500 mt-2">{new Date(inc.timestamp).toLocaleString()}</p>
        </div>

        {/* User & Device Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-xs font-medium text-gray-500 mb-2">User</h3>
            <p className="font-medium text-gray-900">{inc.userName ?? 'Unknown'}</p>
            {inc.userRole && <p className="text-sm text-gray-500">{inc.userRole}</p>}
            {inc.userId && <p className="text-xs text-gray-400 font-mono mt-1">{inc.userId}</p>}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Device</h3>
            <p className="text-sm text-gray-700">{inc.browser ?? 'Unknown browser'}</p>
            <p className="text-sm text-gray-500">{inc.os ?? 'Unknown OS'}</p>
            {inc.viewport && <p className="text-xs text-gray-400 mt-1">{inc.viewport.width}x{inc.viewport.height}</p>}
          </div>
        </div>

        {/* API Error */}
        {inc.apiError && (
          <div className="bg-white rounded-lg border p-4 mb-6">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Backend Error</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm font-medium text-blue-600">{(inc.apiError as any).method}</span>
              <span className="font-mono text-sm text-gray-600">{(inc.apiError as any).url}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${
                (inc.apiError as any).statusCode >= 500 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{(inc.apiError as any).statusCode}</span>
            </div>
            {(inc.apiError as any).responseBody && (
              <pre className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 overflow-x-auto max-h-32">
                {(inc.apiError as any).responseBody}
              </pre>
            )}
          </div>
        )}

        {/* USER JOURNEY TIMELINE — The Key Feature */}
        {inc.breadcrumbs && inc.breadcrumbs.length > 0 && (
          <div className="bg-white rounded-lg border p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">User Journey</h3>
            <div className="space-y-0">
              {inc.breadcrumbs.map((b, i) => {
                const isError = b.type === 'error'
                const isApi = b.type === 'api_call'
                return (
                  <div key={i} className={`flex items-start gap-3 py-2 ${i < inc.breadcrumbs!.length - 1 ? 'border-l-2 border-gray-200 ml-3 pl-6' : 'border-l-2 border-red-300 ml-3 pl-6'} ${isError ? 'bg-red-50 -mx-4 px-10 rounded' : ''}`}>
                    <span className="text-base flex-shrink-0 -ml-9">{breadcrumbIcon(b.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isError ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                        {b.detail}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{b.time}</p>
                    </div>
                    {isApi && b.detail && (
                      <span className={`text-xs font-mono px-1 rounded ${
                        b.detail.includes('200') || b.detail.includes('201') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {b.detail.match(/\d{3}/)?.[0] ?? ''}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stack Trace */}
        {inc.stackTrace && (
          <div className="bg-white rounded-lg border p-4 mb-6">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Stack Trace</h3>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-64">
              {inc.stackTrace}
            </pre>
          </div>
        )}

        {/* Console Errors */}
        {inc.consoleErrors && inc.consoleErrors.length > 0 && (
          <div className="bg-white rounded-lg border p-4 mb-6">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Console Output</h3>
            <div className="space-y-1">
              {inc.consoleErrors.map((ce, i) => (
                <div key={i} className={`text-xs font-mono px-2 py-1 rounded ${
                  (ce as any).level === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  [{(ce as any).level}] {(ce as any).message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screenshot */}
        {inc.screenshotUrl && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Screenshot at Time of Error</h3>
            <img src={inc.screenshotUrl} alt="Error screenshot" className="rounded-lg border max-w-full" />
          </div>
        )}
      </div>
    )
  }

  // ── Detail View (Error Group) ─────────────────────────────────────────────
  if (view === 'detail' && selectedGroup) {
    const g = selectedGroup
    return (
      <div className="p-6">
        <button onClick={() => { setView('list'); setSelectedGroup(null) }} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1">
          &larr; Back to errors
        </button>

        <div className="bg-white rounded-lg border p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{g.module}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                g.status === 'unresolved' ? 'bg-red-100 text-red-700' :
                g.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>{g.status}</span>
            </div>
            <div className="flex gap-2">
              {g.status !== 'resolved' && (
                <button onClick={() => handleStatusUpdate(g.fingerprint, 'resolved')}
                  className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">
                  Mark Resolved
                </button>
              )}
              {g.status !== 'ignored' && (
                <button onClick={() => handleStatusUpdate(g.fingerprint, 'ignored')}
                  className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                  Ignore
                </button>
              )}
              {g.status !== 'unresolved' && (
                <button onClick={() => handleStatusUpdate(g.fingerprint, 'unresolved')}
                  className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">
                  Reopen
                </button>
              )}
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 font-mono">{g.message}</h2>
          {g.file && <p className="text-sm text-gray-500 font-mono mt-1">{g.file}:{g.line}</p>}
          <div className="flex gap-6 mt-3 text-sm text-gray-500">
            <span>{g.count} occurrences</span>
            <span>{g.userCount} users affected</span>
            <span>First: {formatDistanceToNow(new Date(g.firstSeen), { addSuffix: true })}</span>
            <span>Last: {formatDistanceToNow(new Date(g.lastSeen), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Incidents List */}
        <h3 className="text-sm font-medium text-gray-900 mb-3">Occurrences</h3>
        <div className="space-y-2">
          {(g as any).incidents?.map((inc: ErrorIncident) => (
            <div
              key={inc.id}
              onClick={() => openIncident(inc)}
              className="bg-white rounded-lg border p-3 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {severityBadge(inc.severity)}
                  <span className="text-sm text-gray-700">{inc.userName ?? inc.userId ?? 'Unknown user'}</span>
                  {inc.module && <span className="text-xs text-gray-400">{inc.module}</span>}
                </div>
                <span className="text-xs text-gray-400">{new Date(inc.timestamp).toLocaleString()}</span>
              </div>
              {inc.page && <p className="text-xs text-gray-500 mt-1 font-mono">{inc.page}</p>}
              {inc.breadcrumbs && (
                <p className="text-xs text-gray-400 mt-1">{inc.breadcrumbs.length} breadcrumbs &middot; Click to view journey</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── List View ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Errors</h1>
        <p className="text-sm text-gray-500 mt-1">Frontend & backend errors with user journey context</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">Unresolved</p>
            <p className={`text-2xl font-bold ${stats.unresolved > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats.unresolved}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">Incidents Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.incidentsToday}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">Total Groups</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalGroups}</p>
          </div>
        </div>
      )}

      {/* Top Modules */}
      {stats && stats.byModule.length > 0 && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h3 className="text-xs font-medium text-gray-500 mb-2">Errors by Module</h3>
          <div className="flex flex-wrap gap-2">
            {stats.byModule.map((m) => (
              <button
                key={m.module}
                onClick={() => setModuleFilter(m.module === moduleFilter ? '' : m.module)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  moduleFilter === m.module ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m.module} ({m.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {['unresolved', 'resolved', 'ignored', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Error Groups */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-lg">No errors!</p>
          <p className="text-sm mt-1">Everything is running smoothly</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <div
              key={g.id}
              onClick={() => openDetail(g.fingerprint)}
              className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{g.module}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    g.status === 'unresolved' ? 'bg-red-100 text-red-700' :
                    g.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{g.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{g.count}x</span>
                  <span>{g.userCount} users</span>
                  <span>{formatDistanceToNow(new Date(g.lastSeen), { addSuffix: true })}</span>
                </div>
              </div>
              <p className="font-mono text-sm text-gray-900 mt-2 truncate">{g.message}</p>
              {g.file && <p className="text-xs text-gray-400 font-mono mt-1">{g.file}:{g.line}</p>}
              {g.lastPage && <p className="text-xs text-gray-400 mt-1">Page: {g.lastPage}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
