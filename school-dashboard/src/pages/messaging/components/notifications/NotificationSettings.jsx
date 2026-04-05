import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardBody,
  Button,
  Switch,
  Select,
  SelectItem,
  Divider,
  Chip,
  Tabs,
  Tab,
  Input,
} from '@heroui/react';
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
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';

const CHANNEL_ICONS = {
  email: { icon: Mail, color: 'primary', label: 'Email' },
  sms: { icon: MessageSquare, color: 'secondary', label: 'SMS' },
  whatsapp: { icon: Phone, color: 'success', label: 'WhatsApp' },
  inApp: { icon: Bell, color: 'warning', label: 'In-App' },
};

// Maps frontend category keys to backend category enum values
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
  // Parent preferences
  parent: {
    fee_reminders: { email: true, sms: true, whatsapp: false, inApp: true },
    attendance_alerts: { email: true, sms: true, whatsapp: false, inApp: true },
    announcement_updates: { email: true, sms: false, whatsapp: false, inApp: true },
    exam_results: { email: true, sms: true, whatsapp: false, inApp: true },
    homework_notifications: { email: false, sms: false, whatsapp: false, inApp: true },
    event_reminders: { email: true, sms: false, whatsapp: false, inApp: true },
  },
  // Staff preferences
  staff: {
    announcement_updates: { email: true, sms: true, whatsapp: false, inApp: true },
    meeting_reminders: { email: true, sms: true, whatsapp: false, inApp: true },
    student_attendance: { email: true, sms: false, whatsapp: false, inApp: true },
    payroll_notifications: { email: true, sms: false, whatsapp: false, inApp: true },
    holiday_calendars: { email: true, sms: false, whatsapp: false, inApp: true },
  },
  // Student preferences
  student: {
    assignment_reminders: { email: true, sms: true, whatsapp: false, inApp: true },
    exam_schedules: { email: true, sms: true, whatsapp: false, inApp: true },
    attendance_alerts: { email: true, sms: false, whatsapp: false, inApp: true },
    announcement_updates: { email: true, sms: false, whatsapp: false, inApp: true },
    event_notifications: { email: true, sms: false, whatsapp: false, inApp: true },
  },
  // Admin preferences
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
  const NOTIFICATION_LABELS = useMemo(() => ({
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
  }), [t]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES[userRole] || DEFAULT_PREFERENCES.staff);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [digestFrequency, setDigestFrequency] = useState('immediate');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userRole]);

  const loadPreferences = useCallback(async () => {
    try {
      const data = await notificationsApi.getPreferences();
      if (data) {
        // Parse backend preferences array into frontend { category: { channel: bool } } format.
        // Each notification entry is stored with type = frontend category key.
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
          // Backend uses startTime/endTime field names
          setQuietHoursStart(data.quietHours.startTime || '22:00');
          setQuietHoursEnd(data.quietHours.endTime || '08:00');
        }
        if (data.digestFrequency) {
          // Backend enum uses 'instant', frontend UI uses 'immediate'
          setDigestFrequency(data.digestFrequency === 'instant' ? 'immediate' : data.digestFrequency);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Fall back to defaults — don't show error toast since this is non-critical
    }
  }, [userRole]);

  const handleChannelToggle = (category, channel) => {
    setPreferences(prev => ({
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
      // Convert frontend { category: { channel: bool } } to backend array format.
      // Each entry uses the frontend category key as notification type for round-trip fidelity.
      const prefArray = Object.entries(preferences).map(([frontendCat, channels]) => ({
        category: CATEGORY_MAP[frontendCat] || 'announcement',
        notifications: [{
          type: frontendCat,
          channels: {
            email: channels.email,
            sms: channels.sms,
            whatsapp: channels.whatsapp,
            inapp: channels.inApp,  // backend field is 'inapp' (lowercase)
          },
          enabled: true,
        }],
      }));

      await notificationsApi.updatePreferences({
        preferences: prefArray,
        quietHours: {
          enabled: quietHoursEnabled,
          startTime: quietHoursStart,  // backend uses startTime/endTime
          endTime: quietHoursEnd,
        },
        // Backend enum uses 'instant'; frontend UI uses 'immediate'
        digestFrequency: digestFrequency === 'immediate' ? 'instant' : digestFrequency,
      });
      toast.success(t('toast.success.notificationPreferencesSavedSuccessfully'));
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
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
        } catch (error) {
          console.error('Error resetting preferences:', error);
          toast.error(t('toast.error.failedToResetPreferences'));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t('pages.notificationSettings')}</h2>
          <p className="text-sm text-default-500 mt-1">
            Customize how you receive notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            onPress={handleReset}
            startContent={<RotateCcw size={16} />}
            isDisabled={!hasChanges || saving}
          >
            Reset
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            startContent={<Save size={16} />}
            isDisabled={!hasChanges}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Quiet Hours */}
      <Card className="border border-default-200">
        <CardBody className="gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock size={20} className="text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">{t('pages.quietHours')}</h3>
                <p className="text-sm text-default-500">
                  Disable notifications during specific hours
                </p>
              </div>
            </div>
            <Switch
              isSelected={quietHoursEnabled}
              onValueChange={(v) => { setQuietHoursEnabled(v); setHasChanges(true); }}
              size="lg"
            >
              {quietHoursEnabled ? 'Enabled' : 'Disabled'}
            </Switch>
          </div>

          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input
                type="time"
                label={t('pages.startTime1')}
                value={quietHoursStart}
                onValueChange={(v) => { setQuietHoursStart(v); setHasChanges(true); }}
                variant="bordered"
              />
              <Input
                type="time"
                label={t('pages.endTime1')}
                value={quietHoursEnd}
                onValueChange={(v) => { setQuietHoursEnd(v); setHasChanges(true); }}
                variant="bordered"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Digest Frequency */}
      <Card className="border border-default-200">
        <CardBody className="gap-4">
          <div>
            <h3 className="font-semibold mb-2">{t('pages.digestFrequency')}</h3>
            <p className="text-sm text-default-500 mb-4">
              Choose how often you receive notification summaries
            </p>
            <Select
              label={t('pages.frequency')}
              placeholder={t('pages.selectFrequency')}
              selectedKeys={[digestFrequency]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setDigestFrequency(value);
                setHasChanges(true);
              }}
              variant="bordered"
              className="max-w-xs"
            >
              <SelectItem key="immediate">{t('pages.immediate')}</SelectItem>
              <SelectItem key="hourly">{t('pages.hourlyDigest')}</SelectItem>
              <SelectItem key="daily">{t('pages.dailyDigest')}</SelectItem>
              <SelectItem key="weekly">{t('pages.weeklyDigest')}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Channel Preferences by Category */}
      <Card className="border border-default-200">
        <CardBody className="gap-6">
          <div>
            <h3 className="font-semibold mb-4">{t('pages.notificationChannels')}</h3>
            <p className="text-sm text-default-500">
              Select which channels to use for each notification type
            </p>
          </div>

          <Divider />

          <div className="space-y-6">
            {Object.entries(preferences).map(([category, channels]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">
                      {NOTIFICATION_LABELS[userRole]?.[category] || category}
                    </h4>
                  </div>
                  {Object.values(channels).filter(Boolean).length > 0 && (
                    <Chip size="sm" color="success" variant="flat" startContent={<CheckCircle size={12} />}>
                      {Object.values(channels).filter(Boolean).length} channels
                    </Chip>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(channels).map(([channel, enabled]) => {
                    const ChannelIcon = CHANNEL_ICONS[channel]?.icon || Bell;
                    const channelColor = CHANNEL_ICONS[channel]?.color || 'default';
                    const channelLabel = CHANNEL_ICONS[channel]?.label || channel;

                    return (
                      <div
                        key={channel}
                        className={`
                          flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer
                          ${enabled
                            ? `border-${channelColor} bg-${channelColor}/5`
                            : 'border-default-200 hover:border-default-300'
                          }
                        `}
                        onClick={() => handleChannelToggle(category, channel)}
                      >
                        <ChannelIcon size={16} className={`text-${channelColor}`} />
                        <span className="text-sm font-medium">{channelLabel}</span>
                        <Switch
                          size="sm"
                          isSelected={enabled}
                          onValueChange={() => handleChannelToggle(category, channel)}
                          classNames={{
                            wrapper: 'ml-auto',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Summary Card */}
      {hasChanges && (
        <Card className="bg-warning/10 border-warning/20">
          <CardBody className="flex items-center gap-3">
            <Save size={20} className="text-warning flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">{t('pages.youHaveUnsavedChanges')}</p>
              <p className="text-xs text-default-500">
                Don't forget to save your notification preferences
              </p>
            </div>
            <Button
              color="warning"
              size="sm"
              onPress={handleSave}
              isLoading={saving}
            >
              Save Now
            </Button>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}
