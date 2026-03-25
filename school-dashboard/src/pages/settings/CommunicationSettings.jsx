import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardBody, CardHeader, Input, Switch, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner, Divider } from "@heroui/react";
import { Save, Plus, Edit, Search, X, MessageSquare, Mail } from "lucide-react";
import { settingsApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';

// BUG-11: provider defaults to '' so user must explicitly choose — never assume Twilio
const DEFAULT_SMS = { enabled: false, provider: '', senderId: '', apiKey: '' };
const DEFAULT_EMAIL = { enabled: false, provider: '', smtpHost: '', port: '587', username: '', password: '' };

export default function CommunicationSettings() {
  const { t } = useTranslation();
  const [editingSection, setEditingSection] = useState(null);
  const [smsConfig, setSmsConfig] = useState(DEFAULT_SMS);
  const [emailConfig, setEmailConfig] = useState(DEFAULT_EMAIL);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Track editable draft values
  const [smsDraft, setSmsDraft] = useState(DEFAULT_SMS);
  const [emailDraft, setEmailDraft] = useState(DEFAULT_EMAIL);

  useEffect(() => {
    settingsApi.getCommunicationSettings()
      .then((data) => {
        if (data) {
          setSmsConfig(data.sms || DEFAULT_SMS);
          setEmailConfig(data.email || DEFAULT_EMAIL);
          setSmsDraft(data.sms || DEFAULT_SMS);
          setEmailDraft(data.email || DEFAULT_EMAIL);
        }
      })
      .catch((err) => {
        console.error('Failed to load communication settings:', err);
        toast.error(t('toast.error.failedToLoadCommunicationSettings'));
      })
      .finally(() => setLoadingSettings(false));
  }, []);

  const templates = [
    { id: 1, name: "Fee Reminder", type: "SMS", variables: "{student}, {amount}, {date}" },
    { id: 2, name: "Absence Notification", type: "SMS", variables: "{student}, {date}" },
    { id: 3, name: "PTM Reminder", type: "Email", variables: "{parent}, {date}, {time}" },
    { id: 4, name: "Welcome Message", type: "SMS", variables: "{student}, {class}" },
    { id: 5, name: "Exam Notification", type: "SMS", variables: "{student}, {exam}, {date}" },
    { id: 6, name: "Result Published", type: "Email", variables: "{student}, {class}, {result}" },
  ];

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || t.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleTemplates = useMemo(() =>
    filteredTemplates.slice(0, visibleCount),
    [filteredTemplates, visibleCount]
  );

  const hasMore = visibleCount < filteredTemplates.length;

  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const handleSave = async (section) => {
    setSaving(true);
    try {
      const payload = {
        sms: section === 'sms' ? smsDraft : smsConfig,
        email: section === 'email' ? emailDraft : emailConfig,
      };
      const updated = await settingsApi.updateCommunicationSettings(payload);
      if (updated) {
        setSmsConfig(updated.sms || payload.sms);
        setEmailConfig(updated.email || payload.email);
        setSmsDraft(updated.sms || payload.sms);
        setEmailDraft(updated.email || payload.email);
      }
      toast.success(t('toast.success.settingsSaved'));
      setEditingSection(null);
    } catch (error) {
      toast.error(t('toast.error.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (section) => {
    if (section === 'sms') setSmsDraft(smsConfig);
    else setEmailDraft(emailConfig);
    setEditingSection(null);
  };

  const SectionHeader = ({ title, description, icon: Icon, section, isEnabled, onToggle }) => (
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${editingSection === section ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-default-900">{title}</h3>
          <p className="text-xs text-default-500">{description}</p>
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
              className="text-sm text-danger hover:text-danger-600 font-medium px-3 py-1.5 rounded-lg hover:bg-danger-50 transition-colors"
              onClick={() => handleCancel(section)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="flex items-center gap-1.5 text-sm bg-primary text-white font-medium px-3 py-1.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              onClick={() => handleSave(section)}
              disabled={saving}
            >
              {saving ? <Spinner size="sm" color="white" /> : <Save size={14} />}
              Save
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 text-sm text-primary font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
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

  if (loadingSettings) {
    return (
      <TablePageSkeleton />
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">{t('pages.communicationChannels')}</h2>
          <p className="text-sm text-default-500 mt-1">{t('pages.configureSmsGatewaysAndEmailSmtpSettings')}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* SMS Section */}
        <section className={`rounded-xl border transition-all duration-300 ${editingSection === 'sms' ? 'border-primary ring-1 ring-primary bg-white dark:bg-zinc-950' : 'border-default-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
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
                      classNames={{ trigger: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800" }}
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
                      classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800" }}
                    />
                    <Input
                      label={t('pages.aPIKey')}
                      type="password"
                      value={smsDraft.apiKey}
                      onValueChange={(val) => setSmsDraft(prev => ({ ...prev, apiKey: val }))}
                      placeholder={t('pages.enterApiKey')}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800" }}
                      className="md:col-span-2"
                    />
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.sMSProvider')}</span>
                      <p className="font-medium text-default-900 capitalize">{smsConfig.provider || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.senderId')}</span>
                      <p className="font-medium text-default-900">{smsConfig.senderId || '—'}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.aPIKey')}</span>
                      <p className="font-medium text-default-900">{smsConfig.apiKey ? '••••••••' : 'Not configured'}</p>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 p-4 bg-success-50 dark:bg-success-950/30 rounded-xl border border-success-200 dark:border-success-800 flex justify-between items-center mt-2">
                  <div>
                    <p className="text-sm font-semibold text-success-800 dark:text-success-200">
                      {smsConfig.apiKey ? 'Configured' : 'Not configured'}
                    </p>
                    <p className="text-xs text-success-600 dark:text-success-400">
                      {smsConfig.senderId ? `Sender: ${smsConfig.senderId}` : 'Add API key to enable SMS'}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-white dark:bg-zinc-900 text-success-700 dark:text-success-300 rounded-lg border border-success-200 dark:border-success-800 text-xs font-medium hover:bg-success-50 dark:hover:bg-success-950/50">
                    Test SMS
                  </button>
                </div>
              </div>
            )}
            {!(editingSection === 'sms' ? smsDraft.enabled : smsConfig.enabled) && (
              <div className="p-8 text-center text-default-400 bg-default-50 rounded-lg border border-dashed border-default-200">
                <p>{t('pages.sMSNotificationsAreCurrentlyDisabled')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Email Section */}
        <section className={`rounded-xl border transition-all duration-300 ${editingSection === 'email' ? 'border-primary ring-1 ring-primary bg-white dark:bg-zinc-950' : 'border-default-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'}`}>
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
                      classNames={{ trigger: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800" }}
                      className="md:col-span-2"
                    >
                      <SelectItem key="smtp">{t('pages.sMTP')}</SelectItem>
                      <SelectItem key="sendgrid">{t('pages.sendGrid')}</SelectItem>
                      <SelectItem key="mailgun">{t('pages.mailgun')}</SelectItem>
                    </Select>
                    <Input
                      label={t('pages.sMTPHost')}
                      placeholder="smtp.gmail.com"
                      value={emailDraft.smtpHost}
                      onValueChange={(val) => setEmailDraft(prev => ({ ...prev, smtpHost: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800" }}
                    />
                    <Input
                      label={t('pages.port')}
                      placeholder="587"
                      value={emailDraft.port}
                      onValueChange={(val) => setEmailDraft(prev => ({ ...prev, port: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800" }}
                    />
                    <Input
                      label="Username/Email"
                      placeholder="noreply@school.com"
                      value={emailDraft.username}
                      onValueChange={(val) => setEmailDraft(prev => ({ ...prev, username: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800" }}
                    />
                    <Input
                      label={t('pages.password')}
                      type="password"
                      placeholder={t('pages.enterPassword')}
                      value={emailDraft.password}
                      onValueChange={(val) => setEmailDraft(prev => ({ ...prev, password: val }))}
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ inputWrapper: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800" }}
                    />
                  </>
                ) : (
                  <>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.emailProvider')}</span>
                      <p className="font-medium text-default-900 capitalize">{emailConfig.provider || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.sMTPHost')}</span>
                      <p className="font-medium text-default-900">{emailConfig.smtpHost || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.port')}</span>
                      <p className="font-medium text-default-900">{emailConfig.port || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.username')}</span>
                      <p className="font-medium text-default-900">{emailConfig.username || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{t('pages.password')}</span>
                      <p className="font-medium text-default-900">{emailConfig.password ? '••••••••' : 'Not configured'}</p>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 flex justify-end mt-2">
                  <button className="px-4 py-2 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 rounded-lg border border-primary-100 dark:border-primary-800 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-950/50">
                    Send Test Email
                  </button>
                </div>
              </div>
            )}
            {!(editingSection === 'email' ? emailDraft.enabled : emailConfig.enabled) && (
              <div className="p-8 text-center text-default-400 bg-default-50 rounded-lg border border-dashed border-default-200">
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
                <h3 className="text-lg font-bold text-default-900">{t('pages.messageTemplates')}</h3>
                <p className="text-xs text-default-500">{t('pages.manageSmsAndEmailTemplates')}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors shadow-sm">
              <Plus size={16} />
              <span>{t('pages.addTemplate')}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-default-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-zinc-900/50">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-default-50/50 border-b border-default-200 dark:border-zinc-800 py-4 px-6">
              <div className="w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-default-200 dark:border-zinc-800 hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                  <Search size={16} className="text-default-400" />
                  <input
                    type="text"
                    placeholder={t('pages.searchTemplates')}
                    className="flex-1 bg-transparent outline-none text-sm text-default-900"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
                      <X size={14} className="text-default-400" />
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
                    trigger: "bg-white dark:bg-zinc-950 border-default-200 dark:border-zinc-800",
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
              classNames={{
                base: "overflow-visible [&_table]:border-spacing-0",
                thead: "[&>tr]:first:shadow-none",
                th: "bg-default-50 text-default-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200",
                td: "py-4 border-b border-default-200",
                tbody: "[&>tr:last-child>td]:border-none"
              }}
            >
              <TableHeader>
                <TableColumn scope="col">{t('pages.tEMPLATEName')}</TableColumn>
                <TableColumn scope="col">{t('pages.tYPE')}</TableColumn>
                <TableColumn scope="col">{t('pages.vARIABLES')}</TableColumn>
                <TableColumn align="end" scope="col">{t('pages.aCTIONS')}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={
                <div className="text-center py-12">
                  <p className="text-default-400 text-sm">{t('pages.noTemplatesFoundMatchingYourSearch')}</p>
                </div>
              }>
                {visibleTemplates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <span className="text-default-900 font-medium text-sm">{t.name}</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={t.type === "SMS" ? "primary" : "secondary"}
                        classNames={{ base: "h-6", content: "text-xs font-medium" }}
                      >
                        {t.type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-default-600 font-mono bg-default-50 px-2 py-1 rounded-md border border-default-200 inline-block max-w-[200px] truncate">
                        {t.variables}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <button className="p-2 bg-transparent rounded-lg border border-transparent hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all duration-200 cursor-pointer text-default-400 hover:text-primary">
                          <Edit size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Lazy loading indicator */}
            <div ref={loaderRef} className="flex justify-center py-4 bg-default-50/30">
              {isLoadingMore && <Spinner size="sm" color="primary" />}
              {!hasMore && filteredTemplates.length > ITEMS_PER_LOAD && (
                <span className="text-default-400 text-xs">{t('pages.allTemplatesLoaded')}</span>
              )}
            </div>
          </div>

          {/* Variables Helper */}
          <div className="mt-8 p-6 bg-default-50 dark:bg-zinc-900/50 rounded-xl border border-default-200 dark:border-zinc-800 border-dashed">
            <h4 className="text-sm font-semibold text-default-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              Available Variables
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {["{student}", "{parent}", "{class}", "{amount}", "{date}", "{time}", "{teacher}", "{school}"].map((v) => (
                <Chip
                  key={`variable-${v}`}
                  size="sm"
                  variant="flat"
                  className="cursor-pointer hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all border border-transparent hover:border-default-200/50"
                  classNames={{ base: "h-7 bg-white dark:bg-zinc-800 shadow-sm dark:shadow-zinc-900/50 border border-default-200 dark:border-zinc-700", content: "text-xs font-mono font-medium text-default-700" }}
                >
                  {v}
                </Chip>
              ))}
            </div>
            <p className="text-xs text-default-500">
              These variables can be used in your SMS and Email templates. They are dynamically replaced with actual data when sending.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
