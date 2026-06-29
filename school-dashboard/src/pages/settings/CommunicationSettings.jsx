import { useState, useEffect, useMemo, useCallback } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import { Input, Switch, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Divider, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import { Save, Plus, Edit, Search, X, MessageSquare, Mail, Send } from "lucide-react";
import { settingsApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { SkeletonTable } from '../../components/ui/Skeleton';
import logger from '../../utils/logger';


// BUG-11: provider defaults to '' so user must explicitly choose — never assume Twilio
// AUDIT-645: Never store raw secrets (apiKey, password) in React state — DevTools exposure risk.
// Instead, track `hasApiKey`/`hasPassword` booleans; only send new values on explicit change.
const DEFAULT_SMS = { enabled: false, provider: '', senderId: '', hasApiKey: false };
const DEFAULT_EMAIL = { enabled: false, provider: '', smtpHost: '', port: '587', username: '', hasPassword: false };
const DEFAULT_SMS_DRAFT = { ...DEFAULT_SMS, apiKey: '' };
const DEFAULT_EMAIL_DRAFT = { ...DEFAULT_EMAIL, password: '' };

export default function CommunicationSettings() {
  const { t } = useTranslation();
  const [editingSection, setEditingSection] = useState(null);
  const [smsConfig, setSmsConfig] = useState(DEFAULT_SMS);
  const [emailConfig, setEmailConfig] = useState(DEFAULT_EMAIL);
  // AUDIT-645: Track whether secrets exist server-side without storing the actual values
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // STUB-06: keep the full backend records so the editor can populate every
  // field on Edit (the table only renders id/name/type/variables).
  const [templateRecords, setTemplateRecords] = useState({ email: [], sms: [] });
  // STUB-06: Add/Edit template modal state.
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Track editable draft values — drafts hold the new secret input (initially empty)
  const [smsDraft, setSmsDraft] = useState(DEFAULT_SMS_DRAFT);
  const [emailDraft, setEmailDraft] = useState(DEFAULT_EMAIL_DRAFT);

  // Test-send recipients + loading flags (STUB-07)
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testSmsRecipient, setTestSmsRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    settingsApi.getCommunicationSettings({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data) {
          // AUDIT-645: Strip secrets from state, only track existence flags
          const sms = data.sms || DEFAULT_SMS;
          const email = data.email || DEFAULT_EMAIL;
          const safeSms = { enabled: sms.enabled, provider: sms.provider, senderId: sms.senderId, hasApiKey: !!sms.apiKey };
          const safeEmail = { enabled: email.enabled, provider: email.provider, smtpHost: email.smtpHost, port: email.port, username: email.username, hasPassword: !!email.password };
          setSmsConfig(safeSms);
          setEmailConfig(safeEmail);
          // Drafts get empty secret fields — user must re-enter to change
          setSmsDraft({ ...safeSms, apiKey: '' });
          setEmailDraft({ ...safeEmail, password: '' });
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        logger.error('Failed to load communication settings:', err);
        toast.error(t('toast.error.failedToLoadCommunicationSettings'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSettings(false);
      });
    return () => controller.abort();
  }, []);

  // AUDIT-127: Warn before leaving with unsaved edits
  useEffect(() => {
    const handler = (e) => { if (editingSection) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editingSection]);

  // Fetch email + SMS templates from backend
  useEffect(() => {
    let cancelled = false;
    setLoadingTemplates(true);
    Promise.all([
      settingsApi.getEmailTemplates().catch(() => []),
      settingsApi.getSmsTemplates().catch(() => []),
    ])
      .then(([emailTemplates, smsTemplates]) => {
        if (cancelled) return;
        const safeEmail = Array.isArray(emailTemplates) ? emailTemplates : [];
        const safeSms = Array.isArray(smsTemplates) ? smsTemplates : [];
        // STUB-06: retain the full records for the editor modal.
        setTemplateRecords({ email: safeEmail, sms: safeSms });
        const merged = [
          ...safeEmail.map((t) => ({
            id: t._id,
            name: t.name,
            type: 'Email',
            variables: (t.variables || []).map((v) => `{${v}}`).join(', '),
          })),
          ...safeSms.map((t) => ({
            id: t._id,
            name: t.name,
            type: 'SMS',
            variables: (t.variables || []).map((v) => `{${v}}`).join(', '),
          })),
        ];
        setTemplates(merged);
      })
      .catch((err) => {
        logger.error('Failed to load templates:', err);
        if (!cancelled) toast.error(t('toast.error.failedToLoadTemplates', 'Failed to load templates'));
      })
      .finally(() => { if (!cancelled) setLoadingTemplates(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(tmpl => {
      const matchesSearch = tmpl.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || tmpl.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [templates, searchQuery, typeFilter]);

  const ITEMS_PER_LOAD = 10;
  const { visibleItems: visibleTemplates, hasMore, isLoadingMore, loaderRef } = useEntityFetch(
    filteredTemplates,
    [searchQuery, typeFilter]
  );

  const handleSave = async (section) => {
    setSaving(true);
    try {
      // AUDIT-645: Build payload — only include secret fields if user entered a new value
      const smsPayload = section === 'sms'
        ? { enabled: smsDraft.enabled, provider: smsDraft.provider, senderId: smsDraft.senderId, ...(smsDraft.apiKey ? { apiKey: smsDraft.apiKey } : {}) }
        : { enabled: smsConfig.enabled, provider: smsConfig.provider, senderId: smsConfig.senderId };
      const emailPayload = section === 'email'
        ? { enabled: emailDraft.enabled, provider: emailDraft.provider, smtpHost: emailDraft.smtpHost, port: emailDraft.port, username: emailDraft.username, ...(emailDraft.password ? { password: emailDraft.password } : {}) }
        : { enabled: emailConfig.enabled, provider: emailConfig.provider, smtpHost: emailConfig.smtpHost, port: emailConfig.port, username: emailConfig.username };
      const payload = { sms: smsPayload, email: emailPayload };
      const updated = await settingsApi.updateCommunicationSettings(payload);
      if (updated) {
        // Strip secrets from stored state, only keep existence flags
        const uSms = updated.sms || smsPayload;
        const uEmail = updated.email || emailPayload;
        const safeSms = { enabled: uSms.enabled, provider: uSms.provider, senderId: uSms.senderId, hasApiKey: !!uSms.apiKey || (section === 'sms' ? !!smsDraft.apiKey || smsConfig.hasApiKey : smsConfig.hasApiKey) };
        const safeEmail = { enabled: uEmail.enabled, provider: uEmail.provider, smtpHost: uEmail.smtpHost, port: uEmail.port, username: uEmail.username, hasPassword: !!uEmail.password || (section === 'email' ? !!emailDraft.password || emailConfig.hasPassword : emailConfig.hasPassword) };
        setSmsConfig(safeSms);
        setEmailConfig(safeEmail);
        setSmsDraft({ ...safeSms, apiKey: '' });
        setEmailDraft({ ...safeEmail, password: '' });
      }
      toast.success(t('toast.success.settingsSaved'));
      setEditingSection(null);
    } catch (error) {
      toast.error(t('toast.error.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = useCallback((section) => {
    if (section === 'sms') setSmsDraft({ ...smsConfig, apiKey: '' });
    else setEmailDraft({ ...emailConfig, password: '' });
    setEditingSection(null);
  }, [smsConfig, emailConfig]);

  // STUB-06: refresh the templates list from the backend after a create/update.
  const refreshTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const [emailTemplates, smsTemplates] = await Promise.all([
        settingsApi.getEmailTemplates().catch(() => []),
        settingsApi.getSmsTemplates().catch(() => []),
      ]);
      const safeEmail = Array.isArray(emailTemplates) ? emailTemplates : [];
      const safeSms = Array.isArray(smsTemplates) ? smsTemplates : [];
      setTemplateRecords({ email: safeEmail, sms: safeSms });
      setTemplates([
        ...safeEmail.map((t) => ({
          id: t._id,
          name: t.name,
          type: 'Email',
          variables: (t.variables || []).map((v) => `{${v}}`).join(', '),
        })),
        ...safeSms.map((t) => ({
          id: t._id,
          name: t.name,
          type: 'SMS',
          variables: (t.variables || []).map((v) => `{${v}}`).join(', '),
        })),
      ]);
    } catch (err) {
      logger.error('Failed to refresh templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // STUB-06: template editor modal handlers.
  const handleOpenCreateTemplate = useCallback(() => {
    setEditingTemplate({
      channel: 'email',
      name: '',
      type: 'custom',
      subject: '',
      htmlBody: '',
      textBody: '',
      body: '',
      variables: '',
      isActive: true,
    });
    setTemplateModalOpen(true);
  }, []);

  const handleOpenEditTemplate = useCallback((row) => {
    // row is the display object; look up the full record for the channel.
    const channel = row.type.toLowerCase() === 'email' ? 'email' : 'sms';
    const record = templateRecords[channel].find((r) => r._id === row.id);
    if (!record) {
      toast.error(t('toast.error.failedToLoadTemplates', 'Failed to load template'));
      return;
    }
    setEditingTemplate({
      _id: record._id,
      channel,
      name: record.name || '',
      type: record.type || 'custom',
      subject: record.subject || '',
      htmlBody: record.htmlBody || '',
      textBody: record.textBody || '',
      body: record.body || '',
      variables: (record.variables || []).map((v) => `{${v}}`).join(', '),
      isActive: record.isActive !== false,
    });
    setTemplateModalOpen(true);
  }, [templateRecords, t]);

  const handleCloseTemplateModal = useCallback(() => {
    if (savingTemplate) return;
    setTemplateModalOpen(false);
    setEditingTemplate(null);
  }, [savingTemplate]);

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    const name = (editingTemplate.name || '').trim();
    if (!name) {
      toast.error(t('toast.error.failedToSaveTemplate', 'Enter a template name'));
      return;
    }
    // Parse variables — accept {var}, var, comma-separated.
    const variables = (editingTemplate.variables || '')
      .split(',')
      .map((v) => v.trim().replace(/^\{|\}$/g, ''))
      .filter(Boolean);

    const isEmail = editingTemplate.channel === 'email';
    const payload = { name, type: editingTemplate.type, variables, isActive: editingTemplate.isActive };
    if (isEmail) {
      payload.subject = (editingTemplate.subject || '').trim();
      payload.htmlBody = editingTemplate.htmlBody || '';
      if (!payload.subject || !payload.htmlBody) {
        toast.error(t('toast.error.failedToSaveTemplate', 'Subject and HTML body are required for email templates'));
        return;
      }
    } else {
      payload.body = editingTemplate.body || '';
      if (!payload.body) {
        toast.error(t('toast.error.failedToSaveTemplate', 'Message body is required for SMS templates'));
        return;
      }
    }

    setSavingTemplate(true);
    try {
      if (editingTemplate._id) {
        if (isEmail) await settingsApi.updateEmailTemplate(editingTemplate._id, payload);
        else await settingsApi.updateSmsTemplate(editingTemplate._id, payload);
        toast.success(t('toast.success.templateUpdatedSuccessfully', 'Template updated'));
      } else {
        if (isEmail) await settingsApi.createEmailTemplate(payload);
        else await settingsApi.createSmsTemplate(payload);
        toast.success(t('toast.success.templateCreatedSuccessfully', 'Template created'));
      }
      setTemplateModalOpen(false);
      setEditingTemplate(null);
      await refreshTemplates();
    } catch (err) {
      toast.error(err?.message || t('toast.error.failedToSaveTemplate', 'Failed to save template'));
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleTestEmail = async () => {
    const recipient = testEmailRecipient.trim();
    if (!recipient) {
      toast.error(t('toast.error.enterTestEmailAddress', 'Enter an email address to test'));
      return;
    }
    setTestingEmail(true);
    try {
      const result = await settingsApi.testEmail({ to: recipient });
      if (result?.success === false) {
        toast.error(result?.message || t('toast.error.failedToSendTestEmail', 'Failed to send test email'));
      } else {
        toast.success(t('toast.success.testEmailSent', `Test email sent to ${recipient}`));
      }
    } catch (err) {
      toast.error(err?.message || t('toast.error.failedToSendTestEmail', 'Failed to send test email'));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async () => {
    const recipient = testSmsRecipient.trim();
    if (!recipient) {
      toast.error(t('toast.error.enterTestSmsNumber', 'Enter a phone number to test'));
      return;
    }
    setTestingSms(true);
    try {
      const result = await settingsApi.testSms({ to: recipient });
      if (result?.success === false) {
        toast.error(result?.message || t('toast.error.failedToSendTestSms', 'Failed to send test SMS'));
      } else {
        toast.success(t('toast.success.testSmsSent', `Test SMS sent to ${recipient}`));
      }
    } catch (err) {
      toast.error(err?.message || t('toast.error.failedToSendTestSms', 'Failed to send test SMS'));
    } finally {
      setTestingSms(false);
    }
  };

  const SectionHeader = ({ title, description, icon: Icon, section, isEnabled, onToggle }) => (
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${editingSection === section ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-fg">{title}</h3>
          <p className="text-xs text-fg-muted">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Switch
          size="sm"
          isSelected={isEnabled}
          onValueChange={onToggle}
          isDisabled={editingSection !== section}
          classNames={{ wrapper: "group-data-[selected=true]:bg-primary" }}
        />
        {editingSection === section ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-sm text-danger hover:text-[var(--danger)] font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--danger-bg)] transition-colors"
              onClick={() => handleCancel(section)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm bg-primary text-white font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
              onClick={() => handleSave(section)}
              disabled={saving}
            >
              {saving ? <Spinner size="sm" color="white" /> : <Save size={14} />}
              Save
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-primary font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--accent-bg)] transition-colors disabled:opacity-50"
            onClick={() => setEditingSection(section)}
            disabled={editingSection !== null}
          >
            <Edit size={16} />
            Edit
          </button>
        )}
      </div>
    </div>
  );

  const tableClassNames = useMemo(() => ({
    base: "overflow-visible [&_table]:border-spacing-0",
    thead: "[&>tr]:first:shadow-none",
    th: "bg-surface-2 text-fg-muted font-medium text-xs uppercase tracking-wider h-12 border-b border-border-token",
    td: "py-4 border-b border-border-token",
    tbody: "[&>tr:last-child>td]:border-none"
  }), []);

  if (loadingSettings) {
    return (
      <TablePageSkeleton />
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-token pb-6">
        <div>
          <h2 className="text-2xl font-bold text-fg">{t('pages.communicationChannels')}</h2>
          <p className="text-sm text-fg-muted mt-1">{t('pages.configureSmsGatewaysAndEmailSmtpSettings')}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* SMS Section */}
        <section className={`rounded-xl border transition-all duration-300 ${editingSection === 'sms' ? 'border-primary ring-1 ring-primary bg-surface' : 'border-border-token bg-surface'}`}>
          <div className="p-6">
            <SectionHeader
              title={t('pages.sMSConfiguration')}
              description="Manage SMS gateway integration"
              icon={MessageSquare}
              section="sms"
              isEnabled={editingSection === 'sms' ? smsDraft.enabled : smsConfig.enabled}
              onToggle={(val) => setSmsDraft(prev => ({ ...prev, enabled: val }))}
            />

            {(editingSection === 'sms' ? smsDraft.enabled : smsConfig.enabled) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-2 animate-fade-in">
                {editingSection === 'sms' ? (
                  <>
                    <Select
                      label={t('pages.sMSProvider')}
                      selectedKeys={[smsDraft.provider]}
                      onSelectionChange={(keys) => setSmsDraft(prev => ({ ...prev, provider: Array.from(keys)[0] }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ trigger: "bg-surface border-border-token" }}
                    >
                      <SelectItem key="twilio">{t('pages.twilio')}</SelectItem>
                      <SelectItem key="msg91">{t('pages.mSG91')}</SelectItem>
                      <SelectItem key="textlocal">{t('pages.textLocal')}</SelectItem>
                    </Select>
                    <Input
                      label={t('pages.senderId')}
                      placeholder={t('pages.sCHOOL')}
                      value={smsDraft.senderId}
                      onValueChange={(val) => setSmsDraft(prev => ({ ...prev, senderId: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                    />
                    <Input
                      label={t('pages.aPIKey')}
                      type="password"
                      value={smsDraft.apiKey}
                      onValueChange={(val) => setSmsDraft(prev => ({ ...prev, apiKey: val }))}
                      placeholder={smsConfig.hasApiKey ? 'Leave blank to keep current key' : t('pages.enterApiKey')}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                      className="md:col-span-2"
                    />
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.sMSProvider')}</span>
                      <p className="font-medium text-fg capitalize">{smsConfig.provider || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.senderId')}</span>
                      <p className="font-medium text-fg">{smsConfig.senderId || '—'}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.aPIKey')}</span>
                      <p className="font-medium text-fg">{smsConfig.hasApiKey ? '••••••••' : 'Not configured'}</p>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 p-4 bg-[var(--ok-bg)] rounded-xl border border-[var(--ok-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ok)]">
                      {smsConfig.hasApiKey ? 'Configured' : 'Not configured'}
                    </p>
                    <p className="text-xs text-[var(--ok)]">
                      {smsConfig.senderId ? `Sender: ${smsConfig.senderId}` : 'Add API key to enable SMS'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      type="tel"
                      aria-label={t('pages.testSmsRecipient', 'Test recipient phone')}
                      placeholder="919876543210"
                      value={testSmsRecipient}
                      onValueChange={setTestSmsRecipient}
                      variant="bordered"
                      size="sm"
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                      className="max-w-[180px]"
                    />
                    <button
                      type="button"
                      onClick={handleTestSms}
                      disabled={testingSms || !testSmsRecipient.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-surface text-[var(--ok)] rounded-lg border border-[var(--ok-border)] text-xs font-medium hover:bg-[var(--ok-bg)] dark:hover:bg-[var(--ok-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {testingSms ? <Spinner size="sm" color="default" /> : <Send size={12} />}
                      {t('pages.testSms')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!(editingSection === 'sms' ? smsDraft.enabled : smsConfig.enabled) && (
              <div className="p-8 text-center text-fg-faint bg-surface-2 rounded-lg border border-dashed border-border-token">
                <p>{t('pages.sMSNotificationsAreCurrentlyDisabled')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Email Section */}
        <section className={`rounded-xl border transition-all duration-300 ${editingSection === 'email' ? 'border-primary ring-1 ring-primary bg-surface' : 'border-border-token bg-surface'}`}>
          <div className="p-6">
            <SectionHeader
              title={t('pages.emailConfiguration')}
              description="Configure SMTP for email delivery"
              icon={Mail}
              section="email"
              isEnabled={editingSection === 'email' ? emailDraft.enabled : emailConfig.enabled}
              onToggle={(val) => setEmailDraft(prev => ({ ...prev, enabled: val }))}
            />

            {(editingSection === 'email' ? emailDraft.enabled : emailConfig.enabled) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-2 animate-fade-in">
                {editingSection === 'email' ? (
                  <>
                    <Select
                      label={t('pages.emailProvider')}
                      selectedKeys={[emailDraft.provider]}
                      onSelectionChange={(keys) => setEmailDraft(prev => ({ ...prev, provider: Array.from(keys)[0] }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ trigger: "bg-surface border-border-token" }}
                      className="md:col-span-2"
                    >
                      <SelectItem key="smtp">{t('pages.sMTP')}</SelectItem>
                      <SelectItem key="sendgrid">{t('pages.sendGrid')}</SelectItem>
                      <SelectItem key="mailgun">{t('pages.mailgun')}</SelectItem>
                    </Select>
                    <Input
                      label={t('pages.sMTPHost')}
                      placeholder={t('settings.smtpHostPlaceholder')}
                      value={emailDraft.smtpHost}
                      onValueChange={(val) => setEmailDraft(prev => ({ ...prev, smtpHost: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                    />
                    <Input
                      label={t('pages.port')}
                      placeholder={t('settings.smtpPortPlaceholder')}
                      value={emailDraft.port}
                      onValueChange={(val) => setEmailDraft(prev => ({ ...prev, port: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                    />
                    <Input
                      label="Username/Email"
                      placeholder={t('settings.smtpEmailPlaceholder')}
                      value={emailDraft.username}
                      onValueChange={(val) => setEmailDraft(prev => ({ ...prev, username: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                    />
                    <Input
                      label={t('pages.password')}
                      type="password"
                      placeholder={emailConfig.hasPassword ? 'Leave blank to keep current password' : t('pages.enterPassword')}
                      value={emailDraft.password}
                      onValueChange={(val) => setEmailDraft(prev => ({ ...prev, password: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                    />
                  </>
                ) : (
                  <>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.emailProvider')}</span>
                      <p className="font-medium text-fg capitalize">{emailConfig.provider || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.sMTPHost')}</span>
                      <p className="font-medium text-fg">{emailConfig.smtpHost || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.port')}</span>
                      <p className="font-medium text-fg">{emailConfig.port || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.username')}</span>
                      <p className="font-medium text-fg">{emailConfig.username || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">{t('pages.password')}</span>
                      <p className="font-medium text-fg">{emailConfig.hasPassword ? '••••••••' : 'Not configured'}</p>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 mt-2">
                  <Input
                    type="email"
                    aria-label={t('pages.testEmailRecipient', 'Test recipient email')}
                    placeholder="you@school.com"
                    value={testEmailRecipient}
                    onValueChange={setTestEmailRecipient}
                    variant="bordered"
                    size="sm"
                    classNames={{ inputWrapper: "bg-surface border-border-token" }}
                    className="sm:max-w-[240px]"
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail || !testEmailRecipient.trim()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--accent-bg)] text-[var(--accent)] rounded-lg border border-[var(--accent-border)] text-sm font-medium hover:bg-[var(--accent-bg)] dark:hover:bg-[var(--accent-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {testingEmail ? <Spinner size="sm" color="default" /> : <Send size={14} />}
                    {t('pages.sendTestEmail')}
                  </button>
                </div>
              </div>
            )}
            {!(editingSection === 'email' ? emailDraft.enabled : emailConfig.enabled) && (
              <div className="p-8 text-center text-fg-faint bg-surface-2 rounded-lg border border-dashed border-border-token">
                <p>{t('pages.emailNotificationsAreCurrentlyDisabled')}</p>
              </div>
            )}
          </div>
        </section>

        <Divider className="my-8" />

        {/* Templates Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Edit size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-fg">{t('pages.messageTemplates')}</h3>
                <p className="text-xs text-fg-muted">{t('pages.manageSmsAndEmailTemplates')}</p>
              </div>
            </div>
            <button onClick={handleOpenCreateTemplate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring,var(--color-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]">
              <Plus size={16} aria-hidden="true" />
              <span>{t('pages.addTemplate')}</span>
            </button>
          </div>

          <div className="bg-surface border border-border-token rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-surface-2/50 border-b border-border-token py-4 px-6">
              <div className="w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-surface rounded-lg border border-border-token hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                  <Search size={16} className="text-fg-faint" aria-hidden="true" />
                  <input
                    type="text"
                    aria-label={t('pages.searchTemplates')}
                    placeholder={t('pages.searchTemplates')}
                    className="flex-1 bg-transparent outline-none text-sm text-fg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" aria-label="Clear search" onClick={() => setSearchQuery("")} className="inline-flex items-center justify-center min-h-[28px] min-w-[28px] hover:bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring,var(--color-primary))]">
                      <X size={14} className="text-fg-faint" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <Select
                  size="sm"
                  placeholder={t('pages.allTypes1')}
                  selectedKeys={new Set([typeFilter])}
                  onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0])}
                  className="w-full sm:w-[140px]"
                  variant="bordered"
                  classNames={{
                    trigger: "bg-surface border-border-token",
                  }}
                >
                  <SelectItem key="all">{t('pages.allTypes1')}</SelectItem>
                  <SelectItem key="sms">SMS</SelectItem>
                  <SelectItem key="email">{t('pages.email1')}</SelectItem>
                </Select>
              </div>
            </div>

            {/* Table */}
            <Table
              aria-label={t('aria.misc.templates')}
              removeWrapper
              radius="none"
              classNames={tableClassNames}
            >
              <TableHeader>
                <TableColumn scope="col">{t('pages.tEMPLATEName')}</TableColumn>
                <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
                <TableColumn scope="col">{t('pages.vARIABLES')}</TableColumn>
                <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loadingTemplates}
                loadingContent={<SkeletonTable columns={4} rows={5} />}
                emptyContent={
                  <div className="text-center py-12">
                    <p className="text-fg-faint text-sm">{t('pages.noTemplatesFoundMatchingYourSearch')}</p>
                  </div>
                }
              >
                {visibleTemplates.map((tmpl) => (
                  <TableRow key={tmpl.id}>
                    <TableCell>
                      <span className="text-fg font-medium text-sm">{tmpl.name}</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={tmpl.type === "SMS" ? "primary" : "secondary"}
                        classNames={{ base: "h-6", content: "text-xs font-medium" }}
                      >
                        {tmpl.type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-fg-muted font-mono bg-surface-2 px-2 py-1 rounded-md border border-border-token inline-block max-w-[200px] truncate">
                        {tmpl.variables}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <button type="button" aria-label={t('pages.editTemplate', 'Edit template')} onClick={() => handleOpenEditTemplate(tmpl)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-[var(--accent-bg)] dark:hover:bg-[var(--accent-bg)] transition-all duration-200 cursor-pointer text-fg-faint hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring,var(--color-primary))]">
                          <Edit size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Lazy loading indicator */}
            <div ref={loaderRef} className="flex justify-center py-4 bg-surface-2/30">
              {isLoadingMore && <Spinner size="sm" color="primary" />}
              {!hasMore && filteredTemplates.length > ITEMS_PER_LOAD && (
                <span className="text-fg-faint text-xs">{t('pages.allTemplatesLoaded')}</span>
              )}
            </div>
          </div>

          {/* Variables Helper */}
          <div className="mt-8 p-6 bg-surface-2 rounded-xl border border-border-token border-dashed">
            <h4 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              Available Variables
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {["{student}", "{parent}", "{class}", "{amount}", "{date}", "{time}", "{teacher}", "{school}"].map((v) => (
                <Chip
                  key={`variable-${v}`}
                  size="sm"
                  variant="flat"
                  className="cursor-pointer hover:bg-surface-2 hover:shadow-sm transition-all border border-transparent hover:border-border-token"
                  classNames={{ base: "h-7 bg-surface shadow-sm border border-border-token ", content: "text-xs font-mono font-medium text-fg" }}
                >
                  {v}
                </Chip>
              ))}
            </div>
            <p className="text-xs text-fg-muted">
              These variables can be used in your SMS and Email templates. They are dynamically replaced with actual data when sending.
            </p>
          </div>
        </section>
      </div>

      {/* STUB-06: Add/Edit template modal */}
      <Modal isOpen={templateModalOpen} onClose={handleCloseTemplateModal} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editingTemplate?._id
                  ? t('pages.editTemplate', 'Edit template')
                  : t('pages.addTemplate', 'Add template')}
              </ModalHeader>
              <ModalBody className="gap-4">
                {editingTemplate && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label={t('pages.templateChannel', 'Channel')}
                        isDisabled={!!editingTemplate._id}
                        selectedKeys={[editingTemplate.channel]}
                        onSelectionChange={(keys) => setEditingTemplate({
                          ...editingTemplate,
                          channel: Array.from(keys)[0] === 'sms' ? 'sms' : 'email',
                        })}
                        variant="bordered"
                        labelPlacement="outside"
                        classNames={{ trigger: "bg-surface border-border-token" }}
                      >
                        <SelectItem key="email">{t('pages.email1', 'Email')}</SelectItem>
                        <SelectItem key="sms">SMS</SelectItem>
                      </Select>
                      <Select
                        label={t('pages.templateType', 'Type')}
                        selectedKeys={[editingTemplate.type]}
                        onSelectionChange={(keys) => setEditingTemplate({
                          ...editingTemplate,
                          type: Array.from(keys)[0] || 'custom',
                        })}
                        variant="bordered"
                        labelPlacement="outside"
                        classNames={{ trigger: "bg-surface border-border-token" }}
                      >
                        {(editingTemplate.channel === 'email'
                          ? ['welcome', 'fee_reminder', 'attendance_alert', 'announcement', 'exam_result', 'custom']
                          : ['fee_reminder', 'attendance_alert', 'announcement', 'exam_result', 'welcome', 'otp', 'custom']
                        ).map((v) => (
                          <SelectItem key={v}>
                            {v.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <Input
                      label={t('pages.tEMPLATEName', 'Template name')}
                      value={editingTemplate.name}
                      onValueChange={(val) => setEditingTemplate({ ...editingTemplate, name: val })}
                      variant="bordered"
                      labelPlacement="outside"
                      placeholder="Welcome message"
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                    />
                    {editingTemplate.channel === 'email' ? (
                      <>
                        <Input
                          label={t('pages.templateSubject', 'Subject')}
                          value={editingTemplate.subject}
                          onValueChange={(val) => setEditingTemplate({ ...editingTemplate, subject: val })}
                          variant="bordered"
                          labelPlacement="outside"
                          placeholder="Welcome to {school}"
                          classNames={{ inputWrapper: "bg-surface border-border-token" }}
                        />
                        <Textarea
                          label={t('pages.templateHtmlBody', 'HTML body')}
                          value={editingTemplate.htmlBody}
                          onValueChange={(val) => setEditingTemplate({ ...editingTemplate, htmlBody: val })}
                          variant="bordered"
                          labelPlacement="outside"
                          placeholder="<p>Hello {parent},</p>"
                          minRows={5}
                          classNames={{ inputWrapper: "bg-surface border-border-token" }}
                        />
                        <Textarea
                          label={t('pages.templateTextBody', 'Plain-text body (optional)')}
                          value={editingTemplate.textBody}
                          onValueChange={(val) => setEditingTemplate({ ...editingTemplate, textBody: val })}
                          variant="bordered"
                          labelPlacement="outside"
                          minRows={3}
                          classNames={{ inputWrapper: "bg-surface border-border-token" }}
                        />
                      </>
                    ) : (
                      <Textarea
                        label={t('pages.templateSmsBody', 'Message body')}
                        value={editingTemplate.body}
                        onValueChange={(val) => setEditingTemplate({ ...editingTemplate, body: val })}
                        variant="bordered"
                        labelPlacement="outside"
                        placeholder="Dear {parent}, {student} was absent today."
                        minRows={5}
                        maxLength={1600}
                        description={`${(editingTemplate.body || '').length}/1600`}
                        classNames={{ inputWrapper: "bg-surface border-border-token" }}
                      />
                    )}
                    <Input
                      label={t('pages.templateVariables', 'Variables')}
                      value={editingTemplate.variables}
                      onValueChange={(val) => setEditingTemplate({ ...editingTemplate, variables: val })}
                      variant="bordered"
                      labelPlacement="outside"
                      placeholder="{student}, {parent}, {amount}"
                      description={t('pages.templateVariablesHint', 'Comma-separated. Braces are optional.')}
                      classNames={{ inputWrapper: "bg-surface border-border-token" }}
                    />
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={savingTemplate}
                  className="text-sm text-danger hover:text-[var(--danger)] font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--danger-bg)] transition-colors disabled:opacity-50"
                >
                  {t('pages.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="flex items-center gap-1.5 text-sm bg-primary text-white font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {savingTemplate ? <Spinner size="sm" color="white" /> : <Save size={14} />}
                  {editingTemplate?._id
                    ? t('pages.saveTemplate', 'Save template')
                    : t('pages.createTemplate', 'Create template')}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
