import { useState, useEffect, useCallback } from 'react'
import { projectsApi } from '../services/api'
import type { Project } from '../types'
import { formatDistanceToNow } from 'date-fns'

type StatusFilter = 'all' | 'active' | 'suspended' | 'archived'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Create form
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const { projects } = await projectsApi.getProjects(filter === 'all' ? undefined : filter)
      setProjects(projects)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    setCreating(true)
    try {
      const result = await projectsApi.createProject({
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        ownerEmail: formEmail.trim() || undefined,
      })
      setNewKey(result.rawApiKey)
      setFormName('')
      setFormDesc('')
      setFormEmail('')
      setShowCreate(false)
      fetchProjects()
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await projectsApi.updateProject(id, { status })
      fetchProjects()
    } catch (err) {
      console.error('Failed to update project:', err)
    }
  }

  const handleRegenKey = async (id: string, name: string) => {
    if (!confirm(`Regenerate API key for "${name}"? The old key will stop working immediately.`)) return
    try {
      const result = await projectsApi.regenerateKey(id)
      setNewKey(result.rawApiKey)
    } catch (err) {
      console.error('Failed to regenerate key:', err)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}" and ALL its data? This cannot be undone.`)) return
    try {
      await projectsApi.deleteProject(id)
      fetchProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-gray-100 text-gray-500',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage API keys and client access</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Create Project
        </button>
      </div>

      {/* API Key Reveal Modal */}
      {newKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2e] border border-white/10 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">API Key Created</h3>
            <p className="text-sm text-red-600 mb-4">
              Copy this key now. It will NOT be shown again.
            </p>
            <div className="bg-gray-50 border rounded-lg p-3 font-mono text-sm break-all">
              {newKey}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={copyKey}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={() => { setNewKey(null); setCopied(false) }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2e] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Project</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. School Dashboard"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What this project tracks"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                <input
                  type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="owner@example.com"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit" disabled={creating || !formName.trim()}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create & Generate API Key'}
                </button>
                <button
                  type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {(['all', 'active', 'suspended', 'archived'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Projects Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No projects yet</p>
          <p className="text-sm mt-1">Create a project to start tracking events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      {statusBadge(p.status)}
                    </div>
                    {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.status === 'active' ? (
                    <button onClick={() => handleStatusChange(p.id, 'suspended')}
                      className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-md hover:bg-yellow-100">
                      Suspend
                    </button>
                  ) : p.status === 'suspended' ? (
                    <button onClick={() => handleStatusChange(p.id, 'active')}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100">
                      Activate
                    </button>
                  ) : null}
                  <button onClick={() => handleRegenKey(p.id, p.name)}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100">
                    Regen Key
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)}
                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100">
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-3 text-xs text-gray-400">
                <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">{p.apiKeyPrefix}</span>
                <span>{p.totalEvents.toLocaleString()} events</span>
                <span>Rate: {p.rateLimitPerMinute}/min</span>
                <span>Retention: {p.retentionDays}d</span>
                {p.lastEventAt && <span>Last event: {formatDistanceToNow(new Date(p.lastEventAt), { addSuffix: true })}</span>}
                {p.ownerEmail && <span>{p.ownerEmail}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
