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
  Card,
  CardBody,
  Chip,
  Divider,
} from '@heroui/react';
import { Save, FileText, Plus, Edit, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../../../hooks/useConfirmDialog';

const DEFAULT_TEMPLATES = {
  fee: [
    {
      id: 'fee_overdue_1',
      title: 'Fee Overdue Notice - First Reminder',
      message: 'Dear {parent_name},\n\nThis is a reminder that the fee of {fee_amount} for {student_name} is overdue. The due date was {due_date}. Please clear the dues at the earliest.\n\nPrincipal\n{school_name}',
      trigger: 'overdue',
      isDefault: true,
    },
    {
      id: 'fee_overdue_2',
      title: 'Fee Overdue Notice - Final Reminder',
      message: 'URGENT: Dear {parent_name},\n\nThe fee of {fee_amount} for {student_name} is pending since {due_date}. Please pay immediately to avoid late fees.\n\nAccounts Department\n{school_name}',
      trigger: 'overdue',
      isDefault: false,
    },
  ],
  attendance: [
    {
      id: 'attendance_warning',
      title: 'Attendance Warning',
      message: 'Dear {parent_name},\n\nThis is to inform you that {student_name} has been absent for {absent_days} consecutive days. Attendance is currently at {attendance_percentage}%.\n\nPlease ensure regular attendance.\n\nClass Teacher\n{school_name}',
      trigger: 'absent_3_days',
      isDefault: true,
    },
  ],
  academic: [
    {
      id: 'assignment_due',
      title: 'Assignment Due Reminder',
      message: 'Dear {student_name},\n\nReminder: Your assignment "{assignment_name}" for {subject} is due on {due_date}. Please submit it on time.\n\nSubject Teacher\n{school_name}',
      trigger: 'assignment_due',
      isDefault: true,
    },
  ],
  event: [
    {
      id: 'event_reminder',
      title: 'Upcoming Event Reminder',
      message: 'Dear {student_name},\n\nThis is a reminder about the upcoming event "{event_name}" scheduled on {event_date} at {event_time} in {venue}. Please ensure your presence.\n\nEvent Coordinator\n{school_name}',
      trigger: 'before_event',
      isDefault: true,
    },
  ],
};

export default function ReminderTemplates({
  isOpen,
  onClose,
  type,
  onSelectTemplate,
}) {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isOpen && type) {
      loadTemplates();
    }
  }, [isOpen, type]);

  const loadTemplates = () => {
    // In a real app, fetch from API
    // For now, use default templates
    setTemplates(DEFAULT_TEMPLATES[type] || []);
  };

  const handleSelect = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleSetDefault = (templateId) => {
    setTemplates(prev => prev.map(t => ({
      ...t,
      isDefault: t.id === templateId
    })));
    toast.success(t('toast.success.defaultTemplateUpdated'));
  };

  const handleDelete = (templateId) => {
    showConfirm({
      title: 'Delete Template',
      message: t('confirm.deleteReminderTemplate'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success(t('toast.success.templateDeleted'));
      },
    });
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate.title || !editingTemplate.message) {
      toast.error(t('toast.error.pleaseFillInAllFields'));
      return;
    }

    const newTemplate = {
      ...editingTemplate,
      id: `custom_${Date.now()}`,
      isDefault: false,
    };

    setTemplates(prev => [...prev, newTemplate]);
    setShowCreateModal(false);
    setEditingTemplate(null);
    toast.success(t('toast.success.templateCreated'));
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold">
              Reminder Templates
            </h3>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => {
                setEditingTemplate({ title: '', message: '', trigger: '' });
                setShowCreateModal(true);
              }}
              startContent={<Plus size={14} />}
            >
              New Template
            </Button>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto mb-4 text-default-300" />
              <p className="text-default-400">{t('pages.noTemplatesFound')}</p>
              <p className="text-sm text-default-500">{t('pages.createATemplateToGetStarted')}</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card
                key={template.id}
                isPressable
                className="border-2 border-transparent hover:border-primary transition-all cursor-pointer"
                onPress={() => handleSelect(template)}
              >
                <CardBody className="gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{template.title}</h4>
                        {template.isDefault && (
                          <Chip size="sm" color="primary" variant="flat" startContent={<Star size={12} />}>
                            Default
                          </Chip>
                        )}
                      </div>
                      <p className="text-xs text-default-500 whitespace-pre-line line-clamp-3">
                        {template.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {!template.isDefault && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={(e) => {
                            e.stopPropagation();
                            handleSetDefault(template.id);
                          }}
                        >
                          <Star size={14} className="text-default-400" />
                        </Button>
                      )}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={(e) => {
                          e.stopPropagation();
                          setEditingTemplate(template);
                          setShowCreateModal(true);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <Divider />

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-default-400">{t('pages.clickToUseThisTemplate')}</p>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => handleSelect(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </ModalBody>

        <ModalFooter>
          <Button onPress={onClose}>{t('pages.close2')}</Button>
        </ModalFooter>
      </ModalContent>

      {/* Create/Edit Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
        }}
        size="md"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {editingTemplate?.id?.includes('custom') ? 'Edit Template' : 'Create Template'}
            </h3>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <Input
              label={t('pages.templateTitle')}
              placeholder={t('pages.enterTemplateTitle')}
              value={editingTemplate?.title || ''}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
              variant="bordered"
            />

            <Textarea
              label={t('pages.message1')}
              placeholder={t('pages.enterMessageTemplate')}
              value={editingTemplate?.message || ''}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
              variant="bordered"
              minRows={6}
            />

            <p className="text-xs text-default-500">
              Available variables: {type === 'fee' ? '{student_name}, {fee_amount}, {due_date}' :
              type === 'attendance' ? '{student_name}, {attendance_percentage}, {absent_days}' :
              type === 'academic' ? '{student_name}, {assignment_name}, {due_date}' :
              '{student_name}, {event_name}, {event_date}'}
            </p>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setShowCreateModal(false);
                setEditingTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSaveTemplate}
              startContent={<Save size={16} />}
            >
              Save Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
    <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
}
