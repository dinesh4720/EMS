import { useEffect, useState, useMemo } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { changelogAdminApi } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../utils/dateFormatter';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const CATEGORY_COLORS = {
  new_feature: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  improvement: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  bug_fix: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  announcement: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

const EMPTY_ENTRY = { title: '', body: '', version: '', category: 'new_feature', isPublished: false };

export default function ChangelogPanel() {
  const { t } = useTranslation();
  const CATEGORY_LABELS = useMemo(() => ({
    new_feature: t('constants.changelog.newFeature'),
    improvement: t('constants.changelog.improvement'),
    bug_fix: t('constants.changelog.bugFix'),
    announcement: t('constants.changelog.announcement'),
  }), [t]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [submitting, setSubmitting] = useState(false);
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await changelogAdminApi.getAll();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message || 'Failed to load changelog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_ENTRY);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (entry) => {
    setForm({
      title: entry.title,
      body: entry.body,
      version: entry.version,
      category: entry.category,
      isPublished: entry.isPublished,
    });
    setEditingId(entry._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await changelogAdminApi.update(editingId, form);
      } else {
        await changelogAdminApi.create(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_ENTRY);
      await load();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Changelog Entry',
      message: 'Are you sure you want to delete this changelog entry? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await changelogAdminApi.delete(id);
          await load();
        } catch (err) {
          setError(err.message || 'Delete failed');
        }
      },
    });
  };

  const togglePublish = async (entry) => {
    try {
      await changelogAdminApi.update(entry._id, { isPublished: !entry.isPublished });
      await load();
    } catch (err) {
      setError(err.message || 'Update failed');
    }
  };

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">{t('pages.changelog')}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Manage release notes and platform announcements.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
        >
          <Plus size={14} /> New Entry
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t('pages.title1')}
              required
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <input
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              placeholder={t('pages.versionEG240')}
              required
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder={t('pages.changelogBodyPlaceholder')}
            required
            rows={3}
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded"
                />
                Published
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_ENTRY); }}
                className="rounded-xl px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-slate-950 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
          Loading changelog...
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry._id}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100">{entry.title}</h3>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-zinc-700 dark:text-zinc-300">
                      v{entry.version}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[entry.category] || 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </span>
                    {!entry.isPublished && (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500 dark:bg-zinc-700 dark:text-zinc-400">{t('pages.draft')}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">{entry.body}</p>
                  {entry.publishedAt && (
                    <div className="mt-2 text-xs text-gray-400 dark:text-zinc-500">
                      {formatShortDate(entry.publishedAt)}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => togglePublish(entry)}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
                    title={entry.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {entry.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(entry)}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
                    title={t('pages.edit1')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry._id)}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    title={t('pages.delete1')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">{t('pages.noChangelogEntriesYet')}</div>
          )}
        </div>
      )}

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
