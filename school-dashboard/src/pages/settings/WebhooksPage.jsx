import { useState, useEffect, useCallback } from 'react';
import {
  Webhook, Plus, Trash2, Play, Copy, CheckCircle, XCircle, RefreshCw,
  ChevronDown, ChevronUp, Clock,
} from 'lucide-react';
import { request } from '../../services/api';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  Modal,
  SectionHeading,
  SkeletonCard,
} from '../../components/ui';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';

const FALLBACK_EVENTS = [
  'student.created', 'student.updated', 'student.deleted',
  'fee.paid', 'fee.overdue',
  'attendance.marked',
  'exam.published',
  'result.entered',
  'staff.created',
  'announcement.sent',
];

const EMPTY_FORM = { url: '', events: [], isActive: true, secret: '' };

export default function WebhooksPage() {
  const { t } = useTranslation();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [testing, setTesting] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [allEvents, setAllEvents] = useState(FALLBACK_EVENTS);

  // Delivery log state: { [webhookId]: { open, logs, loading } }
  const [deliveryLogs, setDeliveryLogs] = useState({});

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await request('/webhooks');
      setWebhooks(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      setLoadError(e?.message || 'Failed to load webhooks');
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    request('/webhooks/events')
      .then(res => {
        const events = Array.isArray(res) ? res : res?.events || [];
        if (events.length > 0) setAllEvents(events);
      })
      .catch(() => { /* use fallback */ });
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const closeCreateModal = () => {
    setCreateOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleCreate = async () => {
    const newErrors = {};
    if (!form.url) newErrors.url = 'Endpoint URL is required';
    if (form.events.length === 0) newErrors.events = 'Select at least one event';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('URL and at least one event are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.secret) delete payload.secret;
      const res = await request('/webhooks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res?.secret) setNewSecret(res.secret);
      toast.success('Webhook created');
      closeCreateModal();
      fetchWebhooks();
    } catch (e) {
      toast.error(e?.message || 'Failed to create webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/webhooks/${deleteModal.id}`, { method: 'DELETE' });
      toast.success('Webhook deleted');
      setDeleteModal({ open: false, id: null });
      fetchWebhooks();
    } catch {
      toast.error('Failed to delete webhook');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await request(`/webhooks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchWebhooks();
    } catch {
      toast.error('Failed to update webhook');
    }
  };

  const handleTest = async (id) => {
    setTesting(id);
    try {
      const res = await request(`/webhooks/${id}/test`, { method: 'POST' });
      if (res?.success) {
        toast.success('Test delivery succeeded');
      } else {
        toast.error(res?.message || 'Test delivery failed');
      }
    } catch (e) {
      toast.error(e?.message || 'Test delivery failed');
    } finally {
      setTesting(null);
    }
  };

  const toggleDeliveryLogs = async (id) => {
    const current = deliveryLogs[id];
    if (current?.open) {
      setDeliveryLogs(prev => ({ ...prev, [id]: { ...prev[id], open: false } }));
      return;
    }
    setDeliveryLogs(prev => ({ ...prev, [id]: { open: true, logs: current?.logs || [], loading: true } }));
    try {
      const res = await request(`/webhooks/${id}/logs?limit=10`);
      setDeliveryLogs(prev => ({
        ...prev,
        [id]: { open: true, logs: res?.logs || [], loading: false },
      }));
    } catch {
      setDeliveryLogs(prev => ({ ...prev, [id]: { open: true, logs: [], loading: false } }));
      toast.error('Failed to load delivery logs');
    }
  };

  const toggleEvent = (event) => {
    setForm(prev => {
      const next = prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event];
      return { ...prev, events: next };
    });
    setErrors(prev => ({ ...prev, events: '' }));
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        description="Receive real-time event notifications via HTTP POST"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Add Webhook
          </Button>
        }
      >
        Webhooks
      </SectionHeading>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={`webhook-skeleton-${i}`} />
          ))}
        </div>
      ) : loadError ? (
        <Alert variant="danger" title="Couldn't load webhooks">
          {loadError}
        </Alert>
      ) : webhooks.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={Webhook}
            title="No webhooks configured"
            description="Add a webhook to receive event notifications"
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => setCreateOpen(true)}
              >
                Add First Webhook
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => {
            const logState = deliveryLogs[wh._id];
            return (
              <Card key={wh._id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="text-sm font-mono text-fg truncate">
                        {wh.url}
                      </code>
                      <Chip
                        size="sm"
                        color={wh.isActive ? 'success' : 'neutral'}
                      >
                        {wh.isActive ? 'Active' : 'Disabled'}
                      </Chip>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(wh.events || []).map(ev => (
                        <span
                          key={ev}
                          className="px-2 py-0.5 rounded text-xs bg-surface-2 text-fg-muted font-mono"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton
                      aria-label="Send test ping"
                      onClick={() => handleTest(wh._id)}
                      disabled={testing === wh._id}
                      size="sm"
                      icon={
                        testing === wh._id
                          ? <RefreshCw size={15} className="animate-spin" />
                          : <Play size={15} />
                      }
                    />
                    <IconButton
                      aria-label={wh.isActive ? 'Disable webhook' : 'Enable webhook'}
                      onClick={() => handleToggle(wh._id, wh.isActive)}
                      size="sm"
                      icon={
                        wh.isActive
                          ? <CheckCircle size={15} className="text-[var(--ok)]" />
                          : <XCircle size={15} className="text-fg-faint" />
                      }
                    />
                    <IconButton
                      aria-label={logState?.open ? 'Hide delivery logs' : 'View delivery logs'}
                      onClick={() => toggleDeliveryLogs(wh._id)}
                      size="sm"
                      icon={logState?.open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    />
                    <IconButton
                      aria-label="Delete webhook"
                      onClick={() => setDeleteModal({ open: true, id: wh._id })}
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={15} />}
                    />
                  </div>
                </div>

                {logState?.open && (
                  <div className="mt-3 border-t border-divider pt-3">
                    <p className="text-xs font-medium text-fg-muted mb-2">
                      Recent Deliveries
                    </p>
                    {logState.loading ? (
                      <div className="flex items-center gap-2 py-2">
                        <RefreshCw size={12} className="animate-spin text-fg-faint" />
                        <span className="text-xs text-fg-faint">Loading logs...</span>
                      </div>
                    ) : logState.logs.length === 0 ? (
                      <p className="text-xs text-fg-faint">
                        No delivery logs yet
                      </p>
                    ) : (
                      <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                        {logState.logs.map((log, i) => (
                          <li
                            key={log._id || i}
                            className="flex items-start justify-between gap-2 p-2 rounded bg-surface-2 text-xs"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    log.success ? 'bg-[var(--ok)]' : 'bg-[var(--danger)]'
                                  }`}
                                  aria-hidden="true"
                                />
                                <span className="font-mono text-fg">
                                  {log.event}
                                </span>
                                <span className="text-fg-faint">
                                  HTTP {log.responseStatus || '—'}
                                </span>
                              </div>
                              {log.error && (
                                <p className="text-[var(--danger)] mt-0.5 truncate ml-3.5">
                                  {log.error}
                                </p>
                              )}
                            </div>
                            <span className="text-fg-faint shrink-0 flex items-center gap-1">
                              <Clock size={10} aria-hidden="true" />
                              {log.createdAt ? formatDateTime(log.createdAt) : '—'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={closeCreateModal}
        size="lg"
        title="Add Webhook"
        description="Configure an outbound webhook endpoint"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreateModal}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>
              Create Webhook
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Endpoint URL"
            required
            placeholder={t('settings.webhookUrlPlaceholder')}
            value={form.url}
            onChange={(e) => {
              setForm(prev => ({ ...prev, url: e.target.value }));
              setErrors(prev => ({ ...prev, url: '' }));
            }}
            error={errors.url}
            type="url"
          />
          <Input
            label="Secret (optional — auto-generated if empty)"
            placeholder={t('settings.webhookSecretPlaceholder')}
            value={form.secret}
            onChange={(e) => setForm(prev => ({ ...prev, secret: e.target.value }))}
          />
          <fieldset>
            <legend className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
              Events to subscribe<span className="ml-0.5 text-[var(--color-error)]">*</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allEvents.map(ev => (
                <Checkbox
                  key={ev}
                  checked={form.events.includes(ev)}
                  onChange={() => toggleEvent(ev)}
                  label={<span className="font-mono text-sm">{ev}</span>}
                />
              ))}
            </div>
            {errors.events && (
              <p role="alert" className="text-xs text-[var(--color-error)] mt-2">
                {errors.events}
              </p>
            )}
          </fieldset>
        </div>
      </Modal>

      {/* Secret reveal modal */}
      <Modal
        isOpen={!!newSecret}
        onClose={() => setNewSecret(null)}
        size="md"
        title="Save Your Webhook Secret"
        footer={
          <Button variant="primary" onClick={() => setNewSecret(null)}>
            I&apos;ve saved it
          </Button>
        }
      >
        <div className="space-y-3">
          <Alert variant="warning">
            This secret will not be shown again. Copy it now and store it securely.
          </Alert>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-surface-2 rounded-lg text-sm font-mono text-fg break-all">
              {newSecret}
            </code>
            <IconButton
              aria-label="Copy secret"
              icon={<Copy size={16} />}
              variant="secondary"
              onClick={() => {
                if (newSecret) {
                  navigator.clipboard.writeText(newSecret);
                  toast.success('Copied!');
                }
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Webhook"
        message="This will permanently delete the webhook and all delivery logs. This cannot be undone."
        variant="danger"
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
