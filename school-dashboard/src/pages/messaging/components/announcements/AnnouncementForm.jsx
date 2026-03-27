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
  Progress,
} from '@heroui/react';
import { Send, Clock, Upload, X, FileText } from 'lucide-react';
import { announcementsApi, uploadApi } from '../../../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function AnnouncementForm({
  isOpen,
  onClose,
  onSave,
  editData = null,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    recipients: [{ type: 'all' }],
    channels: ['inapp'],
    scheduledFor: null,
    attachments: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || '',
        content: editData.content || '',
        recipients: editData.recipients || [{ type: 'all' }],
        channels: editData.channels || ['inapp'],
        scheduledFor: editData.scheduledFor || null,
        attachments: editData.attachments || [],
      });
    }
  }, [editData]);

  const handleRecipientChange = (type) => {
    setFormData(prev => {
      const exists = prev.recipients.find(r => r.type === type);
      if (type === 'all') {
        return { ...prev, recipients: [{ type: 'all' }] };
      }
      const newRecipients = prev.recipients.filter(r => r.type !== 'all');
      if (exists) {
        return {
          ...prev,
          recipients: newRecipients.filter(r => r.type !== type)
        };
      }
      return {
        ...prev,
        recipients: [...newRecipients, { type }]
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

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('toast.error.fileSizeMustBeLessThan5mb'));
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      const response = await uploadApi.uploadFile(file);

      // Simulate progress for UX
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setUploadProgress(i);
      }

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, {
          name: file.name,
          url: response.url,
          type: file.type
        }]
      }));

      toast.success(t('toast.success.fileUploadedSuccessfully'));
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('toast.error.failedToUploadFile'));
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (schedule = false) => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = t('toast.error.pleaseFillInTitleAndContent');
    if (!formData.content.trim()) newErrors.content = t('toast.error.pleaseFillInTitleAndContent');
    if (formData.channels.length === 0) newErrors.channels = t('toast.error.pleaseSelectAtLeastOneChannel');
    if (formData.recipients.length === 0) newErrors.recipients = t('toast.error.pleaseSelectRecipients');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.title || newErrors.content) toast.error(t('toast.error.pleaseFillInTitleAndContent'));
      else if (newErrors.channels) toast.error(t('toast.error.pleaseSelectAtLeastOneChannel'));
      else if (newErrors.recipients) toast.error(t('toast.error.pleaseSelectRecipients'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        status: schedule ? 'scheduled' : 'draft',
      };

      if (schedule && formData.scheduledFor) {
        payload.scheduledFor = new Date(formData.scheduledFor);
      }

      if (editData?._id) {
        await announcementsApi.update(editData._id, payload);
        toast.success(t('toast.success.announcementUpdatedSuccessfully'));
      } else {
        await announcementsApi.create(payload);
        toast.success(schedule ? 'Announcement scheduled' : 'Announcement created');
      }

      onSave();
      handleClose();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(error.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = t('toast.error.pleaseFillInTitleAndContent');
    if (!formData.content.trim()) newErrors.content = t('toast.error.pleaseFillInTitleAndContent');
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('toast.error.pleaseFillInTitleAndContent'));
      return;
    }

    setLoading(true);

    try {
      if (editData?._id) {
        await announcementsApi.send(editData._id);
      } else {
        // Create first, then send
        const created = await announcementsApi.create({
          ...formData,
          status: 'sent',
        });
        await announcementsApi.send(created._id);
      }

      toast.success(t('toast.success.announcementSentSuccessfully'));
      onSave();
      handleClose();
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error(error.message || 'Failed to send announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      recipients: [{ type: 'all' }],
      channels: ['inapp'],
      scheduledFor: null,
      attachments: [],
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-semibold">
            {editData ? 'Edit Announcement' : 'Create Announcement'}
          </h3>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Title */}
          <Input
            label={t('pages.title1')}
            placeholder={t('pages.enterAnnouncementTitle')}
            value={formData.title}
            onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors(prev => ({ ...prev, title: '' })); }}
            variant="bordered"
            isRequired
            isInvalid={!!errors.title}
            errorMessage={errors.title}
          />

          {/* Content */}
          <Textarea
            label={t('pages.content')}
            placeholder={t('pages.enterAnnouncementContent')}
            value={formData.content}
            onChange={(e) => { setFormData({ ...formData, content: e.target.value }); setErrors(prev => ({ ...prev, content: '' })); }}
            variant="bordered"
            minRows={6}
            isRequired
            isInvalid={!!errors.content}
            errorMessage={errors.content}
          />

          {/* Recipients */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.recipients')}</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Whole School' },
                { key: 'staff', label: 'Staff' },
                { key: 'students', label: 'Students' },
                { key: 'parents', label: 'Parents' },
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
                { key: 'email', label: 'Email' },
                { key: 'sms', label: 'SMS' },
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
          <div className="flex items-center gap-4">
            <Checkbox size="sm"
              isSelected={!!formData.scheduledFor}
              onValueChange={(checked) =>
                setFormData({ ...formData, scheduledFor: checked ? '' : null })
              }
            >
              Schedule for later
            </Checkbox>
            {formData.scheduledFor !== null && (
              <Input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                variant="bordered"
                size="sm"
                className="max-w-[250px]"
              />
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-zinc-300">{t('pages.attachments')}</label>
            <div className="space-y-2">
              {formData.attachments.map((attachment, index) => (
                <Card key={attachment.name || index} size="sm">
                  <CardBody className="flex flex-row items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      <span className="text-sm">{attachment.name}</span>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => handleRemoveAttachment(index)}
                    >
                      <X size={14} />
                    </Button>
                  </CardBody>
                </Card>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  disabled={uploadingFile}
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={() => document.querySelector('input[type="file"]')?.click()}
                  isDisabled={uploadingFile}
                >
                  <Upload size={16} />
                </Button>
                <span className="text-sm text-default-500">
                  {uploadingFile ? `Uploading... ${uploadProgress}%` : 'Upload file'}
                </span>
              </label>
              {uploadingFile && (
                <Progress value={uploadProgress} size="sm" color="primary" />
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="flat"
            onPress={handleClose}
            isDisabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="default"
            variant="flat"
            onPress={() => handleSubmit(true)}
            isDisabled={loading}
            startContent={<Clock size={16} />}
          >
            {editData ? 'Update' : 'Save'} Draft
          </Button>
          {!editData && (
            <Button
              color="primary"
              onPress={handleSendNow}
              isLoading={loading}
              startContent={<Send size={16} />}
            >
              Send Now
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
