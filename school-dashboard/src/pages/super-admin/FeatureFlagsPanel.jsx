import { useEffect, useState } from 'react';
import { Flag, Plus, X } from 'lucide-react';
import { featureFlagsAdminApi } from '../../services/api';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  SectionHeading,
  Select,
  SkeletonRow,
  Switch,
} from '../../components/ui';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const EMPTY_FLAG = { key: '', description: '', defaultEnabled: false, plan: 'starter' };
const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'enterprise', label: 'Enterprise' },
];

function FlagRow({ flag, onToggle, onDelete, saving }) {
  const isSaving = Boolean(saving[flag.key]);
  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Flag
              size={14}
              className="shrink-0 text-fg-faint"
              aria-hidden="true"
            />
            <span className="font-mono text-sm font-medium text-fg">
              {flag.key}
            </span>
            <Chip size="sm" color="neutral">{flag.plan || 'all'}</Chip>
          </div>
          {flag.description && (
            <p className="mt-1 text-xs text-fg-muted">{flag.description}</p>
          )}
          {flag.schoolOverrides?.length > 0 && (
            <p className="mt-1 text-xs text-fg-faint">
              {flag.schoolOverrides.length} school override
              {flag.schoolOverrides.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={Boolean(flag.defaultEnabled)}
            onChange={() => onToggle(flag)}
            disabled={isSaving}
            size="sm"
            aria-label={`Toggle ${flag.key}`}
          />
          <IconButton
            aria-label={`Delete flag ${flag.key}`}
            onClick={() => onDelete(flag.key)}
            disabled={isSaving}
            variant="danger"
            size="sm"
            icon={<X size={14} />}
          />
        </div>
      </div>
    </Card>
  );
}

export default function FeatureFlagsPanel() {
  const { t } = useTranslation();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FLAG);
  const [creating, setCreating] = useState(false);
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

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

  const handleDelete = (key) => {
    showConfirm({
      title: 'Delete Feature Flag',
      message: `Are you sure you want to delete the feature flag "${key}"? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setSaving((prev) => ({ ...prev, [key]: true }));
        try {
          await featureFlagsAdminApi.delete(key);
          await load();
        } catch (err) {
          setError(err.message || 'Delete failed');
        } finally {
          setSaving((prev) => ({ ...prev, [key]: false }));
        }
      },
    });
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

  const closeCreate = () => {
    setShowCreate(false);
    setForm(EMPTY_FLAG);
  };

  return (
    <Card padding="md">
      <SectionHeading
        description="Control feature rollout globally and per school."
        actions={
          <Button
            variant={showCreate ? 'ghost' : 'outline'}
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowCreate((prev) => !prev)}
            aria-expanded={showCreate}
          >
            New Flag
          </Button>
        }
      >
        {t('pages.featureFlags')}
      </SectionHeading>

      {error && (
        <Alert variant="danger" className="mt-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mt-5 rounded-xl border border-border-token bg-surface-2 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Flag key"
              required
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder={t('pages.featureFlagKeyPlaceholder')}
            />
            <Select
              label="Plan"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              options={PLAN_OPTIONS}
            />
          </div>
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t('pages.descriptionOptional1')}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Switch
              checked={form.defaultEnabled}
              onChange={(e) => setForm({ ...form, defaultEnabled: e.target.checked })}
              size="sm"
              label="Enabled by default"
            />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={closeCreate}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={creating}>
                Create
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={`flag-skel-${i}`} showAvatar={false} />
            ))}
          </div>
        ) : flags.length === 0 ? (
          <EmptyState
            icon={Flag}
            title={t('pages.noFeatureFlagsDefined')}
            description="Create a flag above to start rolling out features incrementally."
          />
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
          </div>
        )}
      </div>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </Card>
  );
}
