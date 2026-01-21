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

export default function AnnouncementForm({
  isOpen,
  onClose,
  onSave,
  editData = null,
}) {
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
        return [{ type: 'all' }];
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
      toast.error('File size must be less than 5MB');
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

      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
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
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    if (formData.channels.length === 0) {
      toast.error('Please select at least one channel');
      return;
    }

    if (formData.recipients.length === 0) {
      toast.error('Please select recipients');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        status: schedule ? 'scheduled' : 'draft',
        sentBy: 'current_user_id', // Replace with actual user ID
      };

      if (schedule && formData.scheduledFor) {
        payload.scheduledFor = new Date(formData.scheduledFor);
      }

      if (editData?._id) {
        await announcementsApi.update(editData._id, payload);
        toast.success('Announcement updated successfully');
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
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in title and content');
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
          sentBy: 'current_user_id',
        });
        await announcementsApi.send(created._id);
      }

      toast.success('Announcement sent successfully');
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
            label="Title"
            placeholder="Enter announcement title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            variant="bordered"
            isRequired
          />

          {/* Content */}
          <Textarea
            label="Content"
            placeholder="Enter announcement content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            variant="bordered"
            minRows={6}
            isRequired
          />

          {/* Recipients */}
          <div>
            <label className="text-sm font-medium mb-2 block">Recipients</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Whole School' },
                { key: 'staff', label: 'Staff' },
                { key: 'students', label: 'Students' },
                { key: 'parents', label: 'Parents' },
              ].map((recipient) => (
                <Checkbox
                  key={recipient.key}
                  isSelected={formData.recipients.some(r => r.type === recipient.key)}
                  onValueChange={() => handleRecipientChange(recipient.key)}
                >
                  {recipient.label}
                </Checkbox>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="text-sm font-medium mb-2 block">Send Via</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'inapp', label: 'In-App' },
                { key: 'email', label: 'Email' },
                { key: 'sms', label: 'SMS' },
                { key: 'whatsapp', label: 'WhatsApp' },
              ].map((channel) => (
                <Checkbox
                  key={channel.key}
                  isSelected={formData.channels.includes(channel.key)}
                  onValueChange={() => handleChannelToggle(channel.key)}
                >
                  {channel.label}
                </Checkbox>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-4">
            <Checkbox
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
            <label className="text-sm font-medium mb-2 block">Attachments</label>
            <div className="space-y-2">
              {formData.attachments.map((attachment, index) => (
                <Card key={index} size="sm">
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
