import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Chip, Button, Modal, ModalContent, ModalHeader,
  ModalBody, ModalFooter, Input, Select, SelectItem, Textarea,
  Breadcrumbs, BreadcrumbItem,
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import {
  Mail, Plus, Eye, Trash2, Send, Home, AlertCircle, Clock, CheckCircle, FlaskConical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { PageLayout, MinimalButton, Skeleton, SkeletonText } from '../../components/ui';
import toast from 'react-hot-toast';
import { formatShortDate, formatDateTime} from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS = {
  draft: 'bg-surface-2 text-fg-muted',
  scheduled: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
  sending: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
  sent: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
  partial: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
  failed: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
};

const GROUP_TYPES = [
  { key: 'all_parents', label: 'All Parents' },
  { key: 'by_class', label: 'By Class' },
  { key: 'fee_defaulters', label: 'Fee Defaulters' },
  { key: 'attendance_below', label: 'Low Attendance' },
];

const EMPTY_FORM = {
  name: '', subject: '', htmlBody: '', textBody: '',
  targetCriteria: { groupType: 'all_parents', classIds: [], attendanceThreshold: 75 },
  scheduledFor: '',
};

export default function EmailCampaignsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});

  // Preview state
  const [previewModal, setPreviewModal] = useState({ open: false, id: null, html: '', loading: false });

  // Test-send state
  const [testModal, setTestModal] = useState({ open: false, id: null, email: '', sending: false });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, clRes] = await Promise.all([
        request('/email-campaigns'),
        request('/classes'),
      ]);
      setCampaigns(Array.isArray(cRes) ? cRes : cRes?.campaigns || cRes?.data || []);
      setClasses(clRes?.classes || clRes || []);
    } catch {
      toast.error('Failed to load email campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Campaign name is required';
    if (!form.subject) newErrors.subject = 'Email subject is required';
    if (!form.htmlBody) newErrors.htmlBody = 'Email body is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Name, subject and body are required');
      return;
    }
    setSaving(true);
    try {
      await request('/email-campaigns', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          scheduledFor: form.scheduledFor || null,
        }),
      });
      toast.success('Campaign created');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      fetchData();
    } catch (e) {
      toast.error(e?.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id) => {
    setSending(id);
    try {
      await request(`/email-campaigns/${id}/send`, { method: 'POST' });
      toast.success('Campaign sent successfully');
      fetchData();
    } catch (e) {
      toast.error(e?.message || 'Failed to send campaign');
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async () => {
    try {
      await request(`/email-campaigns/${deleteModal.id}`, { method: 'DELETE' });
      toast.success('Campaign deleted');
      setDeleteModal({ open: false, id: null });
      fetchData();
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  const handlePreview = async (id) => {
    setPreviewModal({ open: true, id, html: '', loading: true });
    try {
      const res = await request(`/email-campaigns/${id}/preview-html`);
      const html = typeof res === 'string' ? res : res?.html || res?.htmlBody || '';
      setPreviewModal(p => ({ ...p, html, loading: false }));
    } catch (e) {
      toast.error(e?.message || 'Failed to load preview');
      setPreviewModal({ open: false, id: null, html: '', loading: false });
    }
  };

  const handleTestSend = async () => {
    const email = testModal.email?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    setTestModal(p => ({ ...p, sending: true }));
    try {
      await request(`/email-campaigns/${testModal.id}/test`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast.success(`Test email sent to ${email}`);
      setTestModal({ open: false, id: null, email: '', sending: false });
    } catch (e) {
      toast.error(e?.message || 'Failed to send test email');
      setTestModal(p => ({ ...p, sending: false }));
    }
  };

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent' || c.status === 'partial').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate('/messaging')}>Messaging</BreadcrumbItem>
          <BreadcrumbItem>Email Campaigns</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      <PageLayout
        header={{ title: 'Email Campaigns', description: 'Send targeted email campaigns to parents' }}
        actions={
          <MinimalButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New Campaign
          </MinimalButton>
        }
        noPadding
      >
        <div className="p-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, cls: 'bg-surface-2 border-divider text-fg' },
              { label: 'Sent', value: stats.sent, cls: 'bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-900 text-green-700 dark:text-green-300' },
              { label: 'Scheduled', value: stats.scheduled, cls: 'bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300' },
              { label: 'Drafts', value: stats.draft, cls: 'bg-surface-2 border-divider text-fg-muted' },
            ].map(s => (
              <div key={s.label} className={`rounded-lg p-3 border ${s.cls}`}>
                <p className="text-xs opacity-70">{s.label}</p>
                <p className="text-xl font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <TablePageSkeleton />
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border-token rounded-xl">
              <Mail size={40} className="mx-auto mb-3 text-fg-faint" />
              <p className="text-fg-muted mb-4">No email campaigns yet</p>
              <MinimalButton icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
                Create First Campaign
              </MinimalButton>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => {
                const sentCount = c.stats?.sent ?? c.analytics?.sentCount ?? 0;
                const failedCount = c.stats?.failed ?? c.analytics?.failedCount ?? 0;
                return (
                  <Card
                    key={c._id}
                    shadow="sm"
                    className="bg-surface border border-border-token"
                  >
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-fg truncate">{c.name}</h3>
                            <Chip size="sm" variant="flat" className={STATUS_COLORS[c.status] || ''}>
                              {c.status}
                            </Chip>
                          </div>
                          <p className="text-sm text-fg-muted truncate mb-1">Subject: {c.subject}</p>
                          <div className="flex items-center gap-3 text-xs text-fg-faint">
                            <span className="capitalize">{c.targetCriteria?.groupType?.replace(/_/g, ' ')}</span>
                            {c.scheduledFor && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {formatDateTime(c.scheduledFor)}
                              </span>
                            )}
                            {c.sentAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle size={11} />
                                Sent {formatShortDate(c.sentAt)}
                              </span>
                            )}
                            {(c.status === 'sent' || c.status === 'partial' || c.status === 'failed') && (
                              <span>{sentCount} sent · {failedCount} failed</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Preview button */}
                          <button
                            type="button"
                            onClick={() => handlePreview(c._id)}
                            className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors min-w-[32px] min-h-[32px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            aria-label="Preview email"
                            title="Preview email"
                          >
                            <Eye size={15} className="text-fg-muted" aria-hidden="true" />
                          </button>
                          {/* Test send button */}
                          <button
                            type="button"
                            onClick={() => setTestModal({ open: true, id: c._id, email: '', sending: false })}
                            className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors min-w-[32px] min-h-[32px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            aria-label="Send test email"
                            title="Send test email"
                          >
                            <FlaskConical size={15} className="text-purple-500" aria-hidden="true" />
                          </button>
                          {(c.status === 'draft' || c.status === 'scheduled') && (
                            <button
                              type="button"
                              onClick={() => handleSend(c._id)}
                              disabled={sending === c._id}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-50 min-w-[32px] min-h-[32px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                              aria-label="Send now"
                              title="Send now"
                            >
                              <Send size={15} className={sending === c._id ? 'text-fg-faint animate-pulse motion-reduce:animate-none' : 'text-blue-500'} aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, id: c._id })}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors min-w-[32px] min-h-[32px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            aria-label="Delete campaign"
                            title="Delete"
                          >
                            <Trash2 size={15} className="text-red-400" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageLayout>

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); }}
        size="2xl"
        scrollBehavior="inside"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-surface' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-divider py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-2 rounded-lg">
                <Mail size={20} className="text-fg-muted" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-fg">New Email Campaign</h3>
                <p className="text-sm text-fg-muted font-normal">Send targeted emails to parents</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6 py-4 space-y-4">
            <Input
              label="Campaign Name *"
              placeholder={t('messaging.campaignNamePlaceholder')}
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(prev => ({ ...prev, name: '' })); }}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
              isInvalid={!!errors.name}
              errorMessage={errors.name}
            />
            <Input
              label="Email Subject *"
              placeholder={t('messaging.emailSubjectPlaceholder')}
              value={form.subject}
              onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(prev => ({ ...prev, subject: '' })); }}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
              isInvalid={!!errors.subject}
              errorMessage={errors.subject}
            />
            <Textarea
              label="Email Body (HTML) *"
              placeholder={t('messaging.emailBodyPlaceholder')}
              value={form.htmlBody}
              onChange={e => { setForm(p => ({ ...p, htmlBody: e.target.value })); setErrors(prev => ({ ...prev, htmlBody: '' })); }}
              variant="bordered"
              minRows={5}
              classNames={{ input: 'dark:text-zinc-100 font-mono text-xs', inputWrapper: 'dark:border-zinc-700' }}
              isInvalid={!!errors.htmlBody}
              errorMessage={errors.htmlBody}
            />
            <Select
              label="Target Group *"
              selectedKeys={[form.targetCriteria.groupType]}
              onSelectionChange={keys => setForm(p => ({
                ...p,
                targetCriteria: { ...p.targetCriteria, groupType: [...keys][0] || 'all_parents' },
              }))}
              variant="bordered"
              classNames={{ trigger: 'dark:border-zinc-700' }}
            >
              {GROUP_TYPES.map(g => (
                <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
              ))}
            </Select>

            {form.targetCriteria.groupType === 'attendance_below' && (
              <Input
                label="Attendance Threshold (%)"
                type="number"
                min={0}
                max={100}
                value={String(form.targetCriteria.attendanceThreshold)}
                onChange={e => setForm(p => ({
                  ...p,
                  targetCriteria: { ...p.targetCriteria, attendanceThreshold: Number(e.target.value) },
                }))}
                variant="bordered"
                classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
              />
            )}

            <Input
              label="Schedule For (optional — sends immediately if empty)"
              type="datetime-local"
              value={form.scheduledFor}
              onChange={e => setForm(p => ({ ...p, scheduledFor: e.target.value }))}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
            />
          </ModalBody>
          <ModalFooter className="border-t border-divider">
            <Button variant="light" onPress={() => { setCreateOpen(false); setForm(EMPTY_FORM); setErrors({}); }}>Cancel</Button>
            <Button
              className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              onPress={handleCreate}
              isLoading={saving}
            >
              Create Campaign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModal.open}
        onClose={() => setPreviewModal({ open: false, id: null, html: '', loading: false })}
        size="3xl"
        scrollBehavior="inside"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-surface' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-divider py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-2 rounded-lg">
                <Eye size={20} className="text-fg-muted" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-fg">Email Preview</h3>
                <p className="text-sm text-fg-muted font-normal">Rendered with sample data</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-0 py-0">
            {previewModal.loading ? (
              <div className="px-6 py-6 space-y-4">
                <Skeleton variant="text" className="h-5 w-1/3" />
                <SkeletonText lines={6} />
                <Skeleton variant="rect" className="h-32 w-full" />
              </div>
            ) : (
              <iframe
                srcDoc={previewModal.html}
                className="w-full h-[500px] border-0"
                sandbox="allow-same-origin"
                title="Email preview"
              />
            )}
          </ModalBody>
          <ModalFooter className="border-t border-divider">
            <Button variant="light" onPress={() => setPreviewModal({ open: false, id: null, html: '', loading: false })}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Test Send Modal */}
      <Modal
        isOpen={testModal.open}
        onClose={() => setTestModal({ open: false, id: null, email: '', sending: false })}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-surface' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-divider py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                <FlaskConical size={20} className="text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-fg">Send Test Email</h3>
                <p className="text-sm text-fg-muted font-normal">Preview with sample data</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <Input
              label="Send test to *"
              placeholder={t('messaging.testEmailPlaceholder')}
              type="email"
              value={testModal.email}
              onChange={e => setTestModal(p => ({ ...p, email: e.target.value }))}
              variant="bordered"
              classNames={{ input: 'dark:text-zinc-100', inputWrapper: 'dark:border-zinc-700' }}
            />
            <p className="text-xs text-fg-faint mt-1">
              Placeholders ({"{{parentName}}"}, {"{{studentName}}"}) will be replaced with sample values.
            </p>
          </ModalBody>
          <ModalFooter className="border-t border-divider">
            <Button variant="light" onPress={() => setTestModal({ open: false, id: null, email: '', sending: false })}>Cancel</Button>
            <Button
              className="bg-purple-600 text-white"
              onPress={handleTestSend}
              isLoading={testModal.sending}
            >
              Send Test
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        size="sm"
        classNames={{ backdrop: 'bg-black/30', base: 'bg-surface' }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-divider py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-fg">Delete Campaign</h3>
            </div>
          </ModalHeader>
          <ModalBody className="py-4">
            <p className="text-sm text-fg-muted">This will permanently delete the campaign. This cannot be undone.</p>
          </ModalBody>
          <ModalFooter className="border-t border-divider">
            <Button variant="light" onPress={() => setDeleteModal({ open: false, id: null })}>Cancel</Button>
            <Button color="danger" onPress={handleDelete}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
