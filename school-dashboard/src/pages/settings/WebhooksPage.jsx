import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Chip, Button, Modal, ModalContent, ModalHeader,
  ModalBody, ModalFooter, Input, Checkbox, CheckboxGroup,
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import {
  Webhook, Plus, Trash2, Play, Copy, CheckCircle, XCircle, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, Clock,
} from 'lucide-react';
import { request } from '../../services/api';
import { MinimalButton } from '../../components/ui';
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
    try {
      const res = await request('/webhooks');
      setWebhooks(Array.isArray(res) ? res : res?.data || []);
    } catch {
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch supported event types from backend (falls back to FALLBACK_EVENTS on error)
  useEffect(() => {
    request('/webhooks/events')
      .then(res => {
        const events = Array.isArray(res) ? res : res?.events || [];
        if (events.length > 0) setAllEvents(events);
      })
      .catch(() => { /* use fallback */ });
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

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
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
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
      setDeliveryLogs(p => ({ ...p, [id]: { ...p[id], open: false } }));
      return;
    }
    setDeliveryLogs(p => ({ ...p, [id]: { open: true, logs: current?.logs || [], loading: true } }));
    try {
      const res = await request(`/webhooks/${id}/logs?limit=10`);
      setDeliveryLogs(p => ({
        ...p,
        [id]: { open: true, logs: res?.logs || [], loading: false },
      }));
    } catch {
      setDeliveryLogs(p => ({ ...p, [id]: { open: true, logs: [], loading: false } }));
      toast.error('Failed to load delivery logs');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Webhooks</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Receive real-time event notifications via HTTP POST</p>
        </div>
        <MinimalButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          Add Webhook
        </MinimalButton>
      </div>

      {loading ? (
        <TablePageSkeleton />
      ) : webhooks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
          <Webhook size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
          <p className="text-gray-500 dark:text-zinc-400 mb-1 font-medium">No webhooks configured</p>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mb-4">Add a webhook to receive event notifications</p>
          <MinimalButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Add First Webhook
          </MinimalButton>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => {
            const logState = deliveryLogs[wh._id];
            return (
              <Card
                key={wh._id}
                shadow="sm"
                className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800"
              >
                <CardBody className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono text-gray-800 dark:text-zinc-200 truncate">{wh.url}</code>
                        <Chip
                          size="sm"
                          variant="flat"
                          className={wh.isActive
                            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                          }
                        >
                          {wh.isActive ? 'Active' : 'Disabled'}
                        </Chip>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(wh.events || []).map(ev => (
                          <span
                            key={ev}
                            className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-mono"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTest(wh._id)}
                        disabled={testing === wh._id}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-50"
                        title="Send test ping"
                      >
                        {testing === wh._id
                          ? <RefreshCw size={15} className="text-blue-400 animate-spin" />
                          : <Play size={15} className="text-blue-500" />
                        }
                      </button>
                      <button
                        onClick={() => handleToggle(wh._id, wh.isActive)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        title={wh.isActive ? 'Disable' : 'Enable'}
                      >
                        {wh.isActive
                          ? <CheckCircle size={15} className="text-green-500" />
                          : <XCircle size={15} className="text-gray-400" />
                        }
                      </button>
                      <button
                        onClick={() => toggleDeliveryLogs(wh._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        title="View delivery logs"
                      >
                        {logState?.open
                          ? <ChevronUp size={15} className="text-gray-500 dark:text-zinc-400" />
                          : <ChevronDown size={15} className="text-gray-500 dark:text-zinc-400" />
                        }
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, id: wh._id })}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Delivery log panel */}
                  {logState?.open && (
                    <div className="mt-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">Recent Deliveries</p>
                      {logState.loading ? (
                        <div className="flex items-center gap-2 py-2">
                          <RefreshCw size={12} className="animate-spin text-gray-400" />
                          <span className="text-xs text-gray-400">Loading logs...</span>
                        </div>
                      ) : logState.logs.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-zinc-500">No delivery logs yet</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {logState.logs.map((log, i) => (
                            <div
                              key={log._id || i}
                              className="flex items-start justify-between gap-2 p-2 rounded bg-gray-50 dark:bg-zinc-900 text-xs"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      log.success ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                  />
                                  <span className="font-mono text-gray-700 dark:text-zinc-300">{log.event}</span>
                                  <span className="text-gray-400 dark:text-zinc-500">
                                    HTTP {log.responseStatus || '—'}
                                  </span>
                                </div>
                                {log.error && (
                                  <p className="text-red-500 dark:text-red-400 mt-0.5 truncate ml-3.5">{log.error}</p>
                                )}
                              </div>
                              <span className="text-gray-400 dark:text-zinc-500 shrink-0 flex items-center gap-1">
                                <Clock size={10} />
                                {log.createdAt ? formatDateTime(log.createdAt) : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); }}
        size="lg"
        scrollBehavior="inside"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <Webhook size={20} className="text-gray-600 dark:text-zinc-300" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Add Webhook</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-normal">Configure an outbound webhook endpoint</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6 py-4 space-y-4">
            <Input
              label="Endpoint URL *"
              placeholder={t('settings.webhookUrlPlaceholder')}
              value={form.url}
              onChange={e => { setForm(p => ({ ...p, url: e.target.value })); setErrors(prev => ({ ...prev, url: '' })); }}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100 font-mono', inputWrapper: 'dark:border-zinc-700' }}
              isInvalid={!!errors.url}
              errorMessage={errors.url}
            />
            <Input
              label="Secret (optional — auto-generated if empty)"
              placeholder={t('settings.webhookSecretPlaceholder')}
              value={form.secret}
              onChange={e => setForm(p => ({ ...p, secret: e.target.value }))}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100 font-mono', inputWrapper: 'dark:border-zinc-700' }}
            />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Events to subscribe *</p>
              <CheckboxGroup
                value={form.events}
                onChange={val => { setForm(p => ({ ...p, events: val })); setErrors(prev => ({ ...prev, events: '' })); }}
                classNames={{ wrapper: 'grid grid-cols-2 gap-1' }}
                isInvalid={!!errors.events}
                errorMessage={errors.events}
              >
                {allEvents.map(ev => (
                  <Checkbox key={ev} value={ev} classNames={{ label: 'font-mono text-sm text-gray-700 dark:text-zinc-300' }}>
                    {ev}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => { setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); }}>Cancel</Button>
            <Button
              className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              onPress={handleCreate}
              isLoading={saving}
            >
              Create Webhook
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Secret reveal modal (shown once after creation) */}
      {newSecret && (
        <Modal
          isOpen={!!newSecret}
          onClose={() => setNewSecret(null)}
          size="md"
          classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
        >
          <ModalContent>
            <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Save Your Webhook Secret</h3>
            </ModalHeader>
            <ModalBody className="py-4 space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                This secret will not be shown again. Copy it now and store it securely.
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm font-mono text-gray-800 dark:text-zinc-200 break-all">
                  {newSecret}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(newSecret); toast.success('Copied!'); }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <Copy size={16} className="text-gray-500" />
                </button>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
              <Button className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900" onPress={() => setNewSecret(null)}>
                I've saved it
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-white dark:bg-zinc-950' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-100 dark:border-zinc-800 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Delete Webhook</h3>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              This will permanently delete the webhook and all delivery logs. This cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
            <Button variant="light" onPress={() => setDeleteModal({ open: false, id: null })} isDisabled={isDeleting}>Cancel</Button>
            <Button color="danger" onPress={handleDelete} isLoading={isDeleting} isDisabled={isDeleting}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
