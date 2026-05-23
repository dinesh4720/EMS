import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  Save,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { notificationsApi } from '../../../../services/api';
import {
  Alert,
  Card,
  Chip,
  Divider,
  ErrorState,
  Input,
  MinimalButton,
  SectionHeading,
  Select,
  Skeleton,
  Switch,
} from '../../../../components/ui';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';
import logger from '../../../../utils/logger';
import { cn } from '../../../../utils/cn';

const CHANNEL_META = {
  email: {
    icon: Mail,
    label: 'Email',
    activeClasses: 'border-[var(--info)] bg-[var(--info-bg)]',
    iconClasses: 'text-[var(--info)]',
  },
  sms: {
    icon: MessageSquare,
    label: 'SMS',
    activeClasses: 'border-[var(--accent)] bg-[var(--accent-bg)]',
    iconClasses: 'text-[var(--accent)]',
  },
  whatsapp: {
    icon: Phone,
    label: 'WhatsApp',
    activeClasses: 'border-[var(--ok)] bg-[var(--ok-bg)]',
    iconClasses: 'text-[var(--ok)]',
  },
  inApp: {
    icon: Bell,
    label: 'In-App',
    activeClasses: 'border-[var(--warn)] bg-[var(--warn-bg)]',
    iconClasses: 'text-[var(--warn)]',
  },
};

const CHANNEL_KEYS = ['email', 'sms', 'whatsapp', 'inApp'];

const CATEGORY_MAP = {
  fee_reminders: 'payment',
  attendance_alerts: 'attendance',
  announcement_updates: 'announcement',
  exam_results: 'academic',
  homework_notifications: 'work',
  event_reminders: 'event',
  meeting_reminders: 'work',
  student_attendance: 'attendance',
  payroll_notifications: 'salary',
  holiday_calendars: 'event',
  assignment_reminders: 'work',
  exam_schedules: 'academic',
  event_notifications: 'event',
  system_alerts: 'emergency',
  enrollment_notifications: 'academic',
  staff_updates: 'work',
  payment_alerts: 'payment',
  daily_reports: 'work',
};

const DEFAULT_PREFERENCES = {
  parent: {
    fee_reminders: { email: true, sms: true, whatsapp: false, inApp: true },
    attendance_alerts: { email: true, sms: true, whatsapp: false, inApp: true },
    announcement_updates: { email: true, sms: false, whatsapp: false, inApp: true },
    exam_results: { email: true, sms: true, whatsapp: false, inApp: true },
    homework_notifications: { email: false, sms: false, whatsapp: false, inApp: true },
    event_reminders: { email: true, sms: false, whatsapp: false, inApp: true },
  },
  staff: {
    announcement_updates: { email: true, sms: true, whatsapp: false, inApp: true },
    meeting_reminders: { email: true, sms: true, whatsapp: false, inApp: true },
    student_attendance: { email: true, sms: false, whatsapp: false, inApp: true },
    payroll_notifications: { email: true, sms: false, whatsapp: false, inApp: true },
    holiday_calendars: { email: true, sms: false, whatsapp: false, inApp: true },
  },
  student: {
    assignment_reminders: { email: true, sms: true, whatsapp: false, inApp: true },
    exam_schedules: { email: true, sms: true, whatsapp: false, inApp: true },
    attendance_alerts: { email: true, sms: false, whatsapp: false, inApp: true },
    announcement_updates: { email: true, sms: false, whatsapp: false, inApp: true },
    event_notifications: { email: true, sms: false, whatsapp: false, inApp: true },
  },
  admin: {
    system_alerts: { email: true, sms: true, whatsapp: false, inApp: true },
    enrollment_notifications: { email: true, sms: false, whatsapp: false, inApp: true },
    staff_updates: { email: true, sms: false, whatsapp: false, inApp: true },
    payment_alerts: { email: true, sms: true, whatsapp: false, inApp: true },
    daily_reports: { email: true, sms: false, whatsapp: false, inApp: false },
  },
};

export default function NotificationSettings({ userRole = 'staff' }) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const NOTIFICATION_LABELS = useMemo(
    () => ({
      parent: {
        fee_reminders: t('constants.notifications.labels.parent.feeReminders'),
        attendance_alerts: t('constants.notifications.labels.parent.attendanceAlerts'),
        announcement_updates: t('constants.notifications.labels.parent.announcementUpdates'),
        exam_results: t('constants.notifications.labels.parent.examResults'),
        homework_notifications: t('constants.notifications.labels.parent.homeworkNotifications'),
        event_reminders: t('constants.notifications.labels.parent.eventReminders'),
      },
      staff: {
        announcement_updates: t('constants.notifications.labels.staff.announcementUpdates'),
        meeting_reminders: t('constants.notifications.labels.staff.meetingReminders'),
        student_attendance: t('constants.notifications.labels.staff.studentAttendance'),
        payroll_notifications: t('constants.notifications.labels.staff.payrollNotifications'),
        holiday_calendars: t('constants.notifications.labels.staff.holidayCalendars'),
      },
      student: {
        assignment_reminders: t('constants.notifications.labels.student.assignmentReminders'),
        exam_schedules: t('constants.notifications.labels.student.examSchedules'),
        attendance_alerts: t('constants.notifications.labels.student.attendanceAlerts'),
        announcement_updates: t('constants.notifications.labels.student.announcementUpdates'),
        event_notifications: t('constants.notifications.labels.student.eventNotifications'),
      },
      admin: {
        system_alerts: t('constants.notifications.labels.admin.systemAlerts'),
        enrollment_notifications: t('constants.notifications.labels.admin.enrollmentNotifications'),
        staff_updates: t('constants.notifications.labels.admin.staffUpdates'),
        payment_alerts: t('constants.notifications.labels.admin.paymentAlerts'),
        daily_reports: t('constants.notifications.labels.admin.dailyReports'),
      },
    }),
    [t],
  );

  const [preferences, setPreferences] = useState(
    DEFAULT_PREFERENCES[userRole] || DEFAULT_PREFERENCES.staff,
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [digestFrequency, setDigestFrequency] = useState('immediate');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getPreferences();
      if (data) {
        if (data.preferences && data.preferences.length > 0) {
          const roleDefaults = DEFAULT_PREFERENCES[userRole] || DEFAULT_PREFERENCES.staff;
          const rolePrefs = { ...roleDefaults };
          data.preferences.forEach(({ notifications }) => {
            if (!notifications) return;
            notifications.forEach(({ type, channels }) => {
              if (type && rolePrefs[type] && channels) {
                rolePrefs[type] = {
                  email: channels.email ?? false,
                  sms: channels.sms ?? false,
                  whatsapp: channels.whatsapp ?? false,
                  inApp: channels.inapp ?? true,
                };
              }
            });
          });
          setPreferences(rolePrefs);
        }
        if (data.quietHours) {
          setQuietHoursEnabled(data.quietHours.enabled ?? false);
          setQuietHoursStart(data.quietHours.startTime || '22:00');
          setQuietHoursEnd(data.quietHours.endTime || '08:00');
        }
        if (data.digestFrequency) {
          setDigestFrequency(
            data.digestFrequency === 'instant' ? 'immediate' : data.digestFrequency,
          );
        }
      }
    } catch (err) {
      logger.error('Error loading preferences:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences, reloadKey]);

  const handleChannelToggle = (category, channel) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const prefArray = Object.entries(preferences).map(([frontendCat, channels]) => ({
        category: CATEGORY_MAP[frontendCat] || 'announcement',
        notifications: [
          {
            type: frontendCat,
            channels: {
              email: channels.email,
              sms: channels.sms,
              whatsapp: channels.whatsapp,
              inapp: channels.inApp,
            },
            enabled: true,
          },
        ],
      }));

      await notificationsApi.updatePreferences({
        preferences: prefArray,
        quietHours: {
          enabled: quietHoursEnabled,
          startTime: quietHoursStart,
          endTime: quietHoursEnd,
        },
        digestFrequency: digestFrequency === 'immediate' ? 'instant' : digestFrequency,
      });
      toast.success(t('toast.success.notificationPreferencesSavedSuccessfully'));
      setHasChanges(false);
    } catch (err) {
      logger.error('Error saving preferences:', err);
      toast.error(t('toast.error.failedToSavePreferences'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    showConfirm({
      title: 'Reset Preferences',
      message: t('confirm.resetPreferences'),
      variant: 'warning',
      confirmText: 'Reset',
      onConfirm: async () => {
        try {
          await notificationsApi.resetPreferences();
          setPreferences(DEFAULT_PREFERENCES[userRole] || DEFAULT_PREFERENCES.staff);
          setQuietHoursEnabled(false);
          setQuietHoursStart('22:00');
          setQuietHoursEnd('08:00');
          setDigestFrequency('immediate');
          toast.success(t('toast.success.preferencesResetToDefault'));
          setHasChanges(false);
        } catch (err) {
          logger.error('Error resetting preferences:', err);
          toast.error(t('toast.error.failedToResetPreferences'));
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rect" className="h-20 w-full" />
        <Skeleton variant="rect" className="h-20 w-full" />
        <Skeleton variant="rect" className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => setReloadKey((prev) => prev + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        size="md"
        description="Customize how you receive notifications"
        actions={
          <>
            <MinimalButton
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              Reset
            </MinimalButton>
            <MinimalButton
              size="sm"
              icon={<Save size={14} />}
              onClick={handleSave}
              disabled={!hasChanges}
              loading={saving}
            >
              Save changes
            </MinimalButton>
          </>
        }
      >
        {t('pages.notificationSettings')}
      </SectionHeading>

      {/* Quiet Hours */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[var(--warn-bg)] flex items-center justify-center shrink-0">
              <Clock size={18} className="text-[var(--warn)]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-fg">
                {t('pages.quietHours')}
              </h3>
              <p className="text-xs text-fg-muted">
                Disable notifications during specific hours
              </p>
              {quietHoursEnabled && (
                <p className="text-xs text-fg-muted mt-1 font-mono tabular-nums">
                  {quietHoursStart} – {quietHoursEnd}
                  {quietHoursStart > quietHoursEnd && (
                    <span className="ml-1 text-fg-faint">(next day)</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <Switch
            size="lg"
            checked={quietHoursEnabled}
            onChange={(e) => {
              setQuietHoursEnabled(e.target.checked);
              setHasChanges(true);
            }}
            aria-label="Toggle quiet hours"
          />
        </div>

        {quietHoursEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              type="time"
              label={t('pages.startTime1')}
              value={quietHoursStart}
              onChange={(e) => {
                setQuietHoursStart(e.target.value);
                setHasChanges(true);
              }}
              className="font-mono tabular-nums"
            />
            <Input
              type="time"
              label={t('pages.endTime1')}
              value={quietHoursEnd}
              onChange={(e) => {
                setQuietHoursEnd(e.target.value);
                setHasChanges(true);
              }}
              className="font-mono tabular-nums"
            />
          </div>
        )}
      </Card>

      {/* Digest Frequency */}
      <Card padding="md">
        <h3 className="font-semibold text-sm text-fg mb-1">
          {t('pages.digestFrequency')}
        </h3>
        <p className="text-xs text-fg-muted mb-4">
          Choose how often you receive notification summaries
        </p>
        <Select
          label={t('pages.frequency')}
          value={digestFrequency}
          onChange={(e) => {
            setDigestFrequency(e.target.value);
            setHasChanges(true);
          }}
          options={[
            { value: 'immediate', label: t('pages.immediate') },
            { value: 'hourly', label: t('pages.hourlyDigest') },
            { value: 'daily', label: t('pages.dailyDigest') },
            { value: 'weekly', label: t('pages.weeklyDigest') },
          ]}
          wrapperClassName="max-w-xs"
        />
      </Card>

      {/* Channel Preferences Matrix */}
      <Card padding="md">
        <div>
          <h3 className="font-semibold text-sm text-fg mb-1">
            {t('pages.notificationChannels')}
          </h3>
          <p className="text-xs text-fg-muted">
            Select which channels to use for each notification type
          </p>
        </div>

        <Divider className="my-4" />

        {/* Desktop / tablet: matrix grid */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-token">
                <th scope="col" className="text-left font-medium text-fg-muted py-2 pr-3">
                  Event
                </th>
                {CHANNEL_KEYS.map((channel) => {
                  const meta = CHANNEL_META[channel];
                  const Icon = meta.icon;
                  return (
                    <th
                      key={channel}
                      scope="col"
                      className="text-center font-medium text-fg-muted py-2 px-2"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={14} className={meta.iconClasses} aria-hidden="true" />
                        <span>{meta.label}</span>
                      </div>
                    </th>
                  );
                })}
                <th scope="col" className="text-right font-medium text-fg-muted py-2 pl-3 w-24">
                  Active
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(preferences).map(([category, channels]) => {
                const activeCount = Object.values(channels).filter(Boolean).length;
                return (
                  <tr
                    key={category}
                    className="border-b border-border-token last:border-b-0 hover:bg-surface-2/40 transition-colors"
                  >
                    <th
                      scope="row"
                      className="text-left font-medium text-fg py-3 pr-3 align-middle"
                    >
                      {NOTIFICATION_LABELS[userRole]?.[category] || category}
                    </th>
                    {CHANNEL_KEYS.map((channel) => {
                      const enabled = !!channels[channel];
                      const meta = CHANNEL_META[channel];
                      return (
                        <td key={channel} className="py-3 px-2 text-center align-middle">
                          <Switch
                            size="sm"
                            checked={enabled}
                            onChange={() => handleChannelToggle(category, channel)}
                            wrapperClassName="inline-flex"
                            aria-label={`Toggle ${meta.label} for ${
                              NOTIFICATION_LABELS[userRole]?.[category] || category
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-3 pl-3 text-right align-middle">
                      {activeCount > 0 ? (
                        <Chip
                          size="sm"
                          color="success"
                          startContent={<CheckCircle size={12} aria-hidden="true" />}
                        >
                          {activeCount}/{CHANNEL_KEYS.length}
                        </Chip>
                      ) : (
                        <span className="text-xs text-fg-faint">Off</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked list */}
        <div className="md:hidden space-y-4">
          {Object.entries(preferences).map(([category, channels]) => {
            const activeCount = Object.values(channels).filter(Boolean).length;
            return (
              <div
                key={category}
                className="rounded-lg border border-border-token p-3 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-sm text-fg">
                    {NOTIFICATION_LABELS[userRole]?.[category] || category}
                  </h4>
                  {activeCount > 0 && (
                    <Chip
                      size="sm"
                      color="success"
                      startContent={<CheckCircle size={12} aria-hidden="true" />}
                    >
                      {activeCount}/{CHANNEL_KEYS.length}
                    </Chip>
                  )}
                </div>
                <div className="space-y-2">
                  {CHANNEL_KEYS.map((channel) => {
                    const enabled = !!channels[channel];
                    const meta = CHANNEL_META[channel];
                    const Icon = meta.icon;
                    return (
                      <label
                        key={channel}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md cursor-pointer',
                          'focus-within:ring-2 focus-within:ring-accent/30',
                        )}
                      >
                        <Icon
                          size={16}
                          className={enabled ? meta.iconClasses : 'text-fg-faint'}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-fg">{meta.label}</span>
                        <Switch
                          size="sm"
                          checked={enabled}
                          onChange={() => handleChannelToggle(category, channel)}
                          wrapperClassName="ml-auto"
                          aria-label={`Toggle ${meta.label} for ${category}`}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {hasChanges && (
        <Alert
          variant="warning"
          title={t('pages.youHaveUnsavedChanges')}
          action={
            <MinimalButton size="sm" onClick={handleSave} loading={saving}>
              Save now
            </MinimalButton>
          }
        >
          Don&apos;t forget to save your notification preferences
        </Alert>
      )}

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
