import { useEffect, useState } from 'react';
import { Flag, Plus, X } from 'lucide-react';
import { featureFlagsAdminApi } from '../../services/api';

const EMPTY_FLAG = { key: '', description: '', defaultEnabled: false, plan: 'starter' };
const PLAN_OPTIONS = ['starter', 'growth', 'enterprise'];

function FlagRow({ flag, onToggle, onDelete, saving }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Flag size={14} className="shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="font-mono text-sm font-medium text-gray-900 dark:text-zinc-100">{flag.key}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
            {flag.plan || 'all'}
          </span>
        </div>
        {flag.description && (
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{flag.description}</p>
        )}
        {flag.schoolOverrides?.length > 0 && (
          <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
            {flag.schoolOverrides.length} school override{flag.schoolOverrides.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggle(flag)}
          disabled={saving[flag.key]}
          className={`relative h-6 w-11 rounded-full transition ${
            flag.defaultEnabled
              ? 'bg-emerald-500 dark:bg-emerald-600'
              : 'bg-gray-300 dark:bg-zinc-600'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-zinc-200 ${
              flag.defaultEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
        <button
          type="button"
          onClick={() => onDelete(flag.key)}
          disabled={saving[flag.key]}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function FeatureFlagsPanel() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FLAG);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await featureFlagsAdminApi.getAll();
      setFlags(data.flags || []);
    } catch (err) {
      setError(err.message || 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (flag) => {
    setSaving((prev) => ({ ...prev, [flag.key]: true }));
    try {
      await featureFlagsAdminApi.update(flag.key, { defaultEnabled: !flag.defaultEnabled });
      await load();
    } catch (err) {
      setError(err.message || 'Toggle failed');
    } finally {
      setSaving((prev) => ({ ...prev, [flag.key]: false }));
    }
  };

  const handleDelete = async (key) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await featureFlagsAdminApi.delete(key);
      await load();
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await featureFlagsAdminApi.create(form);
      setForm(EMPTY_FLAG);
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">Feature Flags</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Control feature rollout globally and per school.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
        >
          <Plus size={14} /> New Flag
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="flag_key (snake_case)"
              required
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={form.defaultEnabled}
                onChange={(e) => setForm({ ...form, defaultEnabled: e.target.checked })}
                className="rounded"
              />
              Enabled by default
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setForm(EMPTY_FLAG); }}
                className="rounded-xl px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-slate-950 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
          Loading feature flags...
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <FlagRow
              key={flag.key}
              flag={flag}
              onToggle={handleToggle}
              onDelete={handleDelete}
              saving={saving}
            />
          ))}
          {flags.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No feature flags defined.</div>
          )}
        </div>
      )}
    </div>
  );
}
