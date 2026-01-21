import { useState, useEffect } from 'react';
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

const CHANNEL_ICONS = {
  email: { icon: Mail, color: 'primary', label: 'Email' },
  sms: { icon: MessageSquare, color: 'secondary', label: 'SMS' },
  whatsapp: { icon: Phone, color: 'success', label: 'WhatsApp' },
  inApp: { icon: Bell, color: 'warning', label: 'In-App' },
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

const NOTIFICATION_LABELS = {
  parent: {
    fee_reminders: 'Fee Payment Reminders',
    attendance_alerts: 'Attendance Alerts',
    announcement_updates: 'School Announcements',
    exam_results: 'Exam Results',
    homework_notifications: 'Homework Notifications',
    event_reminders: 'Event Reminders',
  },
  staff: {
    announcement_updates: 'School Announcements',
    meeting_reminders: 'Meeting Reminders',
    student_attendance: 'Student Attendance Updates',
    payroll_notifications: 'Payroll Notifications',
    holiday_calendars: 'Holiday Calendars',
  },
  student: {
    assignment_reminders: 'Assignment Reminders',
    exam_schedules: 'Exam Schedules',
    attendance_alerts: 'Attendance Alerts',
    announcement_updates: 'School Announcements',
    event_notifications: 'Event Notifications',
  },
  admin: {
    system_alerts: 'System Alerts',
    enrollment_notifications: 'New Enrollments',
    staff_updates: 'Staff Updates',
    payment_alerts: 'Payment Alerts',
    daily_reports: 'Daily Reports',
  },
};

export default function NotificationSettings({ userRole = 'staff' }) {
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

  const loadPreferences = async () => {
    try {
      // In a real app, fetch from API
      // const data = await notificationsApi.getPreferences();
      // setPreferences(data.preferences || DEFAULT_PREFERENCES[userRole]);
      // setQuietHoursEnabled(data.quietHours?.enabled || false);
      // setQuietHoursStart(data.quietHours?.start || '22:00');
      // setQuietHoursEnd(data.quietHours?.end || '08:00');
      // setDigestFrequency(data.digestFrequency || 'immediate');
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

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
      // In a real app, save to API
      // await notificationsApi.updatePreferences({
      //   role: userRole,
      //   preferences,
      //   quietHours: {
      //     enabled: quietHoursEnabled,
      //     start: quietHoursStart,
      //     end: quietHoursEnd,
      //   },
      //   digestFrequency,
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Notification preferences saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all preferences to default?')) return;

    try {
      // In a real app, reset via API
      // await notificationsApi.resetPreferences(userRole);

      setPreferences(DEFAULT_PREFERENCES[userRole]);
      setQuietHoursEnabled(false);
      setQuietHoursStart('22:00');
      setQuietHoursEnd('08:00');
      setDigestFrequency('immediate');

      toast.success('Preferences reset to default');
      setHasChanges(false);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast.error('Failed to reset preferences');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Notification Settings</h2>
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
                <h3 className="font-semibold">Quiet Hours</h3>
                <p className="text-sm text-default-500">
                  Disable notifications during specific hours
                </p>
              </div>
            </div>
            <Switch
              isSelected={quietHoursEnabled}
              onValueChange={setQuietHoursEnabled}
              size="lg"
            >
              {quietHoursEnabled ? 'Enabled' : 'Disabled'}
            </Switch>
          </div>

          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input
                type="time"
                label="Start Time"
                value={quietHoursStart}
                onValueChange={setQuietHoursStart}
                variant="bordered"
              />
              <Input
                type="time"
                label="End Time"
                value={quietHoursEnd}
                onValueChange={setQuietHoursEnd}
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
            <h3 className="font-semibold mb-2">Digest Frequency</h3>
            <p className="text-sm text-default-500 mb-4">
              Choose how often you receive notification summaries
            </p>
            <Select
              label="Frequency"
              placeholder="Select frequency"
              selectedKeys={[digestFrequency]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setDigestFrequency(value);
                setHasChanges(true);
              }}
              variant="bordered"
              className="max-w-xs"
            >
              <SelectItem key="immediate">Immediate</SelectItem>
              <SelectItem key="hourly">Hourly Digest</SelectItem>
              <SelectItem key="daily">Daily Digest</SelectItem>
              <SelectItem key="weekly">Weekly Digest</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Channel Preferences by Category */}
      <Card className="border border-default-200">
        <CardBody className="gap-6">
          <div>
            <h3 className="font-semibold mb-4">Notification Channels</h3>
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
              <p className="font-medium text-sm">You have unsaved changes</p>
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
    </div>
  );
}
