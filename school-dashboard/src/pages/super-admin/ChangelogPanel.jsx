import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Select,
  Skeleton,
} from '../../components/ui';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { changelogAdminApi } from '../../services/api';
import { formatShortDate } from '../../utils/dateFormatter';

const CATEGORY_CHIP_COLOR = {
  new_feature: 'success',
  improvement: 'info',
  bug_fix: 'warning',
  announcement: 'primary',
};

const EMPTY_ENTRY = {
  title: '',
  body: '',
  version: '',
  category: 'new_feature',
  isPublished: false,
};

export default function ChangelogPanel() {
  const { t } = useTranslation();
  const CATEGORY_LABELS = useMemo(
    () => ({
      new_feature: t('constants.changelog.newFeature'),
      improvement: t('constants.changelog.improvement'),
      bug_fix: t('constants.changelog.bugFix'),
      announcement: t('constants.changelog.announcement'),
    }),
    [t]
  );
  const categoryOptions = useMemo(
    () => Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
    [CATEGORY_LABELS]
  );

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [submitting, setSubmitting] = useState(false);
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const titleInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await changelogAdminApi.getAll();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message || t('pages.failedToLoadChangelog'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (showForm && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showForm, editingId]);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_ENTRY);
  };

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
      closeForm();
      await load();
    } catch (err) {
      setError(err.message || t('pages.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: t('pages.deleteChangelogEntry'),
      message: t('pages.deleteChangelogEntryMessage'),
      variant: 'danger',
      confirmText: t('common.delete') || 'Delete',
      onConfirm: async () => {
        try {
          await changelogAdminApi.delete(id);
          await load();
        } catch (err) {
          setError(err.message || t('pages.deleteFailed'));
        }
      },
    });
  };

  const togglePublish = async (entry) => {
    try {
      await changelogAdminApi.update(entry._id, { isPublished: !entry.isPublished });
      await load();
    } catch (err) {
      setError(err.message || t('pages.updateFailed'));
    }
  };

  return (
    <Card padding="md" radius="lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
            <BookOpen size={16} aria-hidden="true" className="text-fg-muted" />
            {t('pages.changelog')}
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {t('pages.manageReleaseNotesAndPlatformAnnouncements')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<Plus size={14} aria-hidden="true" />}
          onClick={openCreate}
        >
          {t('pages.newEntry')}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {showForm && (
        <Card padding="md" radius="lg" className="mb-5 bg-surface-2">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t('pages.title1')}
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                ref={titleInputRef}
              />
              <Input
                label={t('pages.version')}
                required
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder={t('pages.versionEG240')}
              />
            </div>
            <Textarea
              label={t('pages.body')}
              required
              rows={3}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={t('pages.changelogBodyPlaceholder')}
            />
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <Select
                  label={t('pages.category')}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  options={categoryOptions}
                  wrapperClassName="min-w-[180px]"
                />
                <Checkbox
                  label={t('pages.published')}
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                  {editingId ? (t('common.update') || 'Update') : (t('common.create') || 'Create')}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`changelog-skel-${i}`}
              className="rounded-lg border border-divider p-4"
            >
              <Skeleton variant="text" className="h-4 w-1/3" />
              <Skeleton variant="text" className="mt-2 h-3 w-2/3" />
              <Skeleton variant="text" className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : error && entries.length === 0 ? (
        <ErrorState error={error} onRetry={load} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t('pages.noChangelogEntriesYet')}
          description={t('pages.changelogEmptyDescription')}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry._id} padding="md" radius="lg" className="bg-surface-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-fg">{entry.title}</h3>
                    <Chip size="sm" color="neutral">v{entry.version}</Chip>
                    <Chip size="sm" color={CATEGORY_CHIP_COLOR[entry.category] || 'neutral'}>
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </Chip>
                    {!entry.isPublished && (
                      <Chip size="sm" color="neutral">{t('pages.draft')}</Chip>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{entry.body}</p>
                  {entry.publishedAt && (
                    <div className="mt-2 text-xs text-fg-faint">
                      {formatShortDate(entry.publishedAt)}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconButton
                    aria-label={entry.isPublished ? t('pages.unpublish') || 'Unpublish' : t('pages.publish') || 'Publish'}
                    title={entry.isPublished ? t('pages.unpublish') || 'Unpublish' : t('pages.publish') || 'Publish'}
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePublish(entry)}
                    icon={entry.isPublished ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                  />
                  <IconButton
                    aria-label={t('pages.edit1')}
                    title={t('pages.edit1')}
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(entry)}
                    icon={<Pencil size={14} aria-hidden="true" />}
                  />
                  <IconButton
                    aria-label={t('pages.delete1')}
                    title={t('pages.delete1')}
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(entry._id)}
                    icon={<Trash2 size={14} aria-hidden="true" />}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </Card>
  );
}
