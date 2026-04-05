import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  Card,
  CardBody,
  Chip,
} from '@heroui/react';
import { Save, Bell, Clock, DollarSign, Calendar, BookOpen, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const REMINDER_TYPES = [
  { key: 'fee', label: 'Fee Reminder', icon: DollarSign, color: 'warning' },
  { key: 'attendance', label: 'Attendance Alert', icon: Users, color: 'danger' },
  { key: 'academic', label: 'Academic Reminder', icon: BookOpen, color: 'primary' },
  { key: 'event', label: 'Event Reminder', icon: Calendar, color: 'success' },
];

const TRIGGER_CONDITIONS = {
  fee: [
    { key: 'overdue', label: 'Fee Overdue' },
    { key: 'due_soon', label: 'Fee Due Soon (3 days)' },
    { key: 'partial_payment', label: 'Partial Payment' },
    { key: 'no_payment', label: 'No Payment' },
  ],
  attendance: [
    { key: 'absent_3_days', label: 'Absent 3+ Consecutive Days' },
    { key: 'below_75', label: 'Attendance Below 75%' },
    { key: 'absent_today', label: 'Absent Today' },
  ],
  academic: [
    { key: 'assignment_due', label: 'Assignment Due' },
    { key: 'exam_scheduled', label: 'Exam Scheduled' },
    { key: 'grades_declined', label: 'Grades Declined' },
  ],
  event: [
    { key: 'before_event', label: 'Before Event' },
    { key: 'after_event', label: 'After Event' },
    { key: 'event_today', label: 'Event Today' },
  ],
};

const VARIABLES = {
  fee: ['{student_name}', '{fee_amount}', '{due_date}', '{class_name}', '{academic_year}'],
  attendance: ['{student_name}', '{attendance_percentage}', '{absent_days}', '{class_name}'],
  academic: ['{student_name}', '{assignment_name}', '{due_date}', '{subject}', '{class_name}'],
  event: ['{student_name}', '{event_name}', '{event_date}', '{event_time}', '{venue}'],
};

export default function ReminderForm({
  isOpen,
  onClose,
  onSave,
  editData = null,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    type: 'fee',
    trigger: '',
    message: '',
    recipients: [{ type: 'parents' }],
    channels: ['inapp', 'sms'],
    active: true,
    startDate: null,
    endDate: null,
    frequency: 'once',
  });

  const [, setSelectedTemplate] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (editData) {
      setFormData({
        title: editData.title || '',
        type: editData.type || 'fee',
        trigger: editData.trigger || '',
        message: editData.message || '',
        recipients: editData.recipients || [{ type: 'parents' }],
        channels: editData.channels || ['inapp', 'sms'],
        active: editData.active !== undefined ? editData.active : true,
        startDate: editData.startDate?.split('T')[0] || null,
        endDate: editData.endDate?.split('T')[0] || null,
        frequency: editData.frequency || 'once',
      });
    }
  }, [editData]);

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      trigger: '',
      message: '',
    }));
    setSelectedTemplate(null);
  };

  const handleRecipientChange = (type) => {
    setFormData(prev => {
      const exists = prev.recipients.find(r => r.type === type);
      if (exists) {
        return {
          ...prev,
          recipients: prev.recipients.filter(r => r.type !== type)
        };
      }
      return {
        ...prev,
        recipients: [...prev.recipients, { type }]
      };
    });
  };

  const handleChannelToggle = (channel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      message: prev.message + variable
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = t('toast.error.pleaseFillInTitleAndMessage');
    if (!formData.message.trim()) newErrors.message = t('toast.error.pleaseFillInTitleAndMessage');
    if (!formData.trigger) newErrors.trigger = t('toast.error.pleaseSelectATriggerCondition');
    if (formData.recipients.length === 0) newErrors.recipients = t('toast.error.pleaseSelectRecipients');
    if (formData.channels.length === 0) newErrors.channels = t('toast.error.pleaseSelectAtLeastOneChannel');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.title || newErrors.message) toast.error(t('toast.error.pleaseFillInTitleAndMessage'));
      else if (newErrors.trigger) toast.error(t('toast.error.pleaseSelectATriggerCondition'));
      else if (newErrors.recipients) toast.error(t('toast.error.pleaseSelectRecipients'));
      else if (newErrors.channels) toast.error(t('toast.error.pleaseSelectAtLeastOneChannel'));
      return;
    }

    const payload = {
      ...formData,
      createdBy: 'current_user_id', // Replace with actual user ID
    };

    onSave(payload);
  };

  const selectedTypeData = REMINDER_TYPES.find(t => t.key === formData.type);
  const TypeIcon = selectedTypeData?.icon || Bell;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setErrors({}); }}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-semibold">
            {editData ? 'Edit Reminder' : 'Create Reminder'}
          </h3>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.reminderType')}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {REMINDER_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.key}
                    isPressable
                    className={`border-2 transition-all ${
                      formData.type === type.key
                        ? `border-${type.color} bg-${type.color}/10`
                        : 'border-default-200'
                    }`}
                    onPress={() => handleTypeChange(type.key)}
                  >
                    <CardBody className="py-3 flex flex-col items-center gap-2">
                      <Icon size={24} className={`text-${type.color}`} />
                      <span className="text-xs font-medium text-center">{type.label}</span>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <Input
            label={t('pages.title1')}
            placeholder={t('pages.enterReminderTitle')}
            value={formData.title}
            onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors(prev => ({ ...prev, title: '' })); }}
            variant="bordered"
            isRequired
            startContent={<TypeIcon size={18} />}
            isInvalid={!!errors.title}
            errorMessage={errors.title}
          />

          {/* Trigger Condition */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.triggerCondition')}</label>
            <Select
              placeholder={t('pages.selectWhenToSendThisReminder')}
              selectedKeys={formData.trigger ? [formData.trigger] : []}
              onSelectionChange={(keys) => { setFormData({ ...formData, trigger: Array.from(keys)[0] }); setErrors(prev => ({ ...prev, trigger: '' })); }}
              variant="bordered"
              isRequired
              isInvalid={!!errors.trigger}
              errorMessage={errors.trigger}
            >
              {TRIGGER_CONDITIONS[formData.type]?.map((condition) => (
                <SelectItem key={condition.key}>{condition.label}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Message Template */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.message1')}</label>
            <Textarea
              placeholder={t('pages.enterReminderMessage1')}
              value={formData.message}
              onChange={(e) => { setFormData({ ...formData, message: e.target.value }); setErrors(prev => ({ ...prev, message: '' })); }}
              variant="bordered"
              minRows={4}
              isRequired
              isInvalid={!!errors.message}
              errorMessage={errors.message}
            />

            {/* Variable Suggestions */}
            {VARIABLES[formData.type] && (
              <div className="mt-2">
                <p className="text-xs text-default-500 mb-1">{t('pages.clickToInsertVariables')}</p>
                <div className="flex flex-wrap gap-1">
                  {VARIABLES[formData.type].map((variable) => (
                    <Chip
                      key={variable}
                      size="sm"
                      variant="flat"
                      className="cursor-pointer"
                      onPress={() => insertVariable(variable)}
                    >
                      {variable}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.sendTo')}</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'parents', label: 'Parents' },
                { key: 'students', label: 'Students' },
                { key: 'staff', label: 'Staff' },
              ].map((recipient) => (
                <Checkbox size="sm"
                  key={recipient.key}
                  isSelected={formData.recipients.some(r => r.type === recipient.key)}
                  onValueChange={() => { handleRecipientChange(recipient.key); setErrors(prev => ({ ...prev, recipients: '' })); }}
                >
                  {recipient.label}
                </Checkbox>
              ))}
            </div>
            {errors.recipients && <p className="text-xs text-red-500 mt-1">{errors.recipients}</p>}
          </div>

          {/* Channels */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.sendVia')}</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'inapp', label: 'In-App' },
                { key: 'sms', label: 'SMS' },
                { key: 'email', label: 'Email' },
                { key: 'whatsapp', label: 'WhatsApp' },
              ].map((channel) => (
                <Checkbox size="sm"
                  key={channel.key}
                  isSelected={formData.channels.includes(channel.key)}
                  onValueChange={() => { handleChannelToggle(channel.key); setErrors(prev => ({ ...prev, channels: '' })); }}
                >
                  {channel.label}
                </Checkbox>
              ))}
            </div>
            {errors.channels && <p className="text-xs text-red-500 mt-1">{errors.channels}</p>}
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.startDate1')}</label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                variant="bordered"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.endDate1')}</label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                variant="bordered"
              />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.frequency')}</label>
            <Select
              selectedKeys={[formData.frequency]}
              onSelectionChange={(keys) => setFormData({ ...formData, frequency: Array.from(keys)[0] })}
              variant="bordered"
            >
              <SelectItem key="once">{t('pages.once')}</SelectItem>
              <SelectItem key="daily">{t('pages.daily')}</SelectItem>
              <SelectItem key="weekly">{t('pages.weekly')}</SelectItem>
              <SelectItem key="monthly">{t('pages.monthly')}</SelectItem>
            </Select>
          </div>

          {/* Active Status */}
          <Checkbox size="sm"
            isSelected={formData.active}
            onValueChange={(checked) => setFormData({ ...formData, active: checked })}
          >
            Active (Enable this reminder)
          </Checkbox>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="flat"
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            startContent={<Save size={16} />}
          >
            {editData ? 'Update' : 'Create'} Reminder
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
