import { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import logger from "../../utils/logger";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Chip, useDisclosure,
  Select, SelectItem, Checkbox, Button, Tabs, Tab
} from '@heroui/react';
import { Edit, Trash2, Plus, MessageSquare } from 'lucide-react';
import { frontDeskApi, staffApi, announcementsApi } from '../../services/api';
import { validatePhone } from '../../utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const FEEDBACK_CATEGORY_KEYS = {
  STAFF: { key: 'STAFF', subcategories: ['TEACHER', 'ADMIN', 'SUPPORT_STAFF', 'OTHER'], i18nKey: 'staff' },
  FACILITIES: { key: 'FACILITIES', subcategories: ['CLASSROOM', 'LAB', 'PLAYGROUND', 'SANITATION', 'OTHER'], i18nKey: 'facilities' },
  MANAGEMENT: { key: 'MANAGEMENT', subcategories: ['PRINCIPAL', 'ADMINISTRATION', 'FEES', 'POLICY', 'OTHER'], i18nKey: 'management' },
};
const SUBCATEGORY_I18N_KEYS = {
  TEACHER: 'teacher', ADMIN: 'admin', SUPPORT_STAFF: 'supportStaff',
  CLASSROOM: 'classroom', LAB: 'lab', PLAYGROUND: 'playground',
  SANITATION: 'sanitation', PRINCIPAL: 'principal', ADMINISTRATION: 'administration',
  FEES: 'fees', POLICY: 'policy', OTHER: 'other',
};

const SOURCE_OPTIONS = ['PARENT_APP', 'STUDENT_APP', 'TEACHER_APP', 'WALK_IN', 'PHONE', 'EMAIL'];

const FeedbacksList = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const FEEDBACK_CATEGORIES = useMemo(() => ({
    STAFF: { ...FEEDBACK_CATEGORY_KEYS.STAFF, label: t(`constants.feedback.categories.${FEEDBACK_CATEGORY_KEYS.STAFF.i18nKey}`) },
    FACILITIES: { ...FEEDBACK_CATEGORY_KEYS.FACILITIES, label: t(`constants.feedback.categories.${FEEDBACK_CATEGORY_KEYS.FACILITIES.i18nKey}`) },
    MANAGEMENT: { ...FEEDBACK_CATEGORY_KEYS.MANAGEMENT, label: t(`constants.feedback.categories.${FEEDBACK_CATEGORY_KEYS.MANAGEMENT.i18nKey}`) },
  }), [t]);
  const SUBCATEGORY_LABELS = useMemo(() => Object.fromEntries(
    Object.entries(SUBCATEGORY_I18N_KEYS).map(([key, i18nKey]) => [key, t(`constants.feedback.subcategories.${i18nKey}`)])
  ), [t]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    category: '',
    subcategory: '',
    source: 'WALK_IN',
    assignedStaff: '',
    notifyStaff: false,
    status: 'open',
    notes: '',
    assignAsTask: false,
    taskTitle: '',
    taskPriority: 'medium',
    shareWithStaff: [],
  });

  useEffect(() => {
    loadFeedbacks();
    loadStaff();
  }, []);

  // Expose the openModal function to parent
  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetForm();
      onOpen();
    }
  }));

  const loadFeedbacks = async () => {
    try {
      const response = await frontDeskApi.getFeedbacks();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setFeedbacks(data);
    } catch (error) {
      logger.error('Failed to load feedbacks:', error);
      toast.error(t('toast.error.failedToLoadFeedbacks'));
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setStaff(data);
    } catch (error) {
      logger.error('Failed to load staff:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.category && !formData.subcategory) {
      newErrors.subcategory = 'Subcategory is required';
    }

    if (formData.assignAsTask && !formData.taskTitle?.trim()) {
      newErrors.taskTitle = 'Task title is required when assigning as task';
    }

    // CRITICAL FIX: Set errors before returning
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting'));
      return;
    }
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        category: formData.category && formData.subcategory
          ? `${formData.category}_${formData.subcategory}`
          : formData.category,
      };

      if (editingId) {
        await frontDeskApi.updateFeedback(editingId, submitData);
        toast.success(t('toast.success.feedbackUpdatedSuccessfully'));
      } else {
        await frontDeskApi.createFeedback(submitData);
        toast.success(t('toast.success.feedbackCreatedSuccessfully'));
      }

      if (formData.assignAsTask && formData.assignedStaff && formData.taskTitle?.trim()) {
        try {
          const categoryLabel = getCategoryLabel(
            formData.category && formData.subcategory
              ? `${formData.category}_${formData.subcategory}`
              : formData.category
          );
          await announcementsApi.create({
            title: formData.taskTitle,
            content: `Task assigned from feedback.\n\nFeedback from: ${formData.name}\nCategory: ${categoryLabel}\nPriority: ${formData.taskPriority}\n\n${formData.notes || ''}`.trim(),
            recipients: [{ type: 'custom', userIds: [formData.assignedStaff] }],
            channels: ['in_app'],
          });
          toast.success('Task notification sent to assigned staff');
        } catch (taskErr) {
          logger.error('Task creation error:', taskErr);
          toast.error('Feedback saved but failed to send task notification');
        }
      }

      if (formData.shareWithStaff?.length > 0) {
        try {
          const categoryLabel = getCategoryLabel(
            formData.category && formData.subcategory
              ? `${formData.category}_${formData.subcategory}`
              : formData.category
          );
          await announcementsApi.create({
            title: `Feedback Shared: ${categoryLabel}`,
            content: `A feedback has been shared with you.\n\nFrom: ${formData.name}\nCategory: ${categoryLabel}\nSource: ${formData.source?.replace(/_/g, ' ')}\n\n${formData.notes || ''}`.trim(),
            recipients: [{ type: 'custom', userIds: formData.shareWithStaff }],
            channels: ['in_app'],
          });
          toast.success(`Feedback shared with ${formData.shareWithStaff.length} staff member(s)`);
        } catch (shareErr) {
          logger.error('Feedback share error:', shareErr);
          toast.error('Feedback saved but failed to share with staff');
        }
      }

      onClose();
      resetForm();
      loadFeedbacks();
    } catch (error) {
      toast.error(t('toast.error.failedToSaveFeedback'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (feedback) => {
    if (!feedback) return; // Null check
    setEditingId(feedback._id);
    // Parse category if it has subcategory
    let category = feedback.category;
    let subcategory = '';

    if (feedback.category && feedback.category.includes('_')) {
      const parts = feedback.category.split('_');
      category = parts[0];
      subcategory = parts.slice(1).join('_');
    }

    setFormData({
      name: feedback.name,
      phoneNumber: feedback.phoneNumber || '',
      category: category || '',
      subcategory: subcategory || '',
      source: feedback.source || 'WALK_IN',
      assignedStaff: feedback.assignedStaff?._id || '',
      notifyStaff: false,
      status: feedback.status || 'open',
      notes: feedback.notes || '',
      assignAsTask: false,
      taskTitle: '',
      taskPriority: 'medium',
      shareWithStaff: [],
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!confirm(t('confirm.deleteFeedback'))) return;
    try {
      await frontDeskApi.deleteFeedback(id);
      toast.success(t('toast.success.feedbackDeleted'));
      loadFeedbacks();
    } catch (error) {
      toast.error(t('toast.error.failedToDeleteFeedback'));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setFormData({
      name: '',
      phoneNumber: '',
      category: '',
      subcategory: '',
      source: 'WALK_IN',
      assignedStaff: '',
      notifyStaff: false,
      status: 'open',
      notes: '',
      assignAsTask: false,
      taskTitle: '',
      taskPriority: 'medium',
      shareWithStaff: [],
    });
  };

  const getCategoryLabel = (category) => {
    if (!category) return '-';
    if (category.includes('_')) {
      const parts = category.split('_');
      const mainCat = FEEDBACK_CATEGORIES[parts[0]];
      const subCat = SUBCATEGORY_LABELS[parts.slice(1).join('_')];
      return `${mainCat?.label || parts[0]} - ${subCat || parts.slice(1).join(' ')}`;
    }
    return FEEDBACK_CATEGORIES[category]?.label || category;
  };

  const getSourceLabel = (source) => {
    return SOURCE_OPTIONS.find(s => s === source)?.replace(/_/g, ' ') || source || '-';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <Chip size="sm" variant="flat" color="primary">{t('pages.parentApp1')}</Chip>
          <Chip size="sm" variant="flat" color="secondary">{t('pages.studentApp')}</Chip>
          <Chip size="sm" variant="flat" color="success">{t('pages.teacherApp')}</Chip>
          <span className="text-xs text-default-400 ml-2">{t('pages.feedbacksFromAppsSyncAutomatically')}</span>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          New Feedback
        </Button>
      </div>
      <Table aria-label={t('aria.tables.feedbacks')} removeWrapper>
        <TableHeader>
          <TableColumn scope="col">{t('pages.nAME')}</TableColumn>
          <TableColumn scope="col">{t('pages.pHONE')}</TableColumn>
          <TableColumn scope="col">{t('pages.dATE')}</TableColumn>
          <TableColumn scope="col">{t('pages.cATEGORY')}</TableColumn>
          <TableColumn scope="col">{t('pages.sOURCE')}</TableColumn>
          <TableColumn scope="col">{t('pages.aSSIGNEDTo')}</TableColumn>
          <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
          <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
        </TableHeader>
        <TableBody
          items={feedbacks}
          isLoading={loading}
          emptyContent="No feedbacks"
        >
          {(feedback) => (
            <TableRow key={feedback._id}>
              <TableCell className="font-medium">{feedback.name}</TableCell>
              <TableCell>{feedback.phoneNumber || '-'}</TableCell>
              <TableCell>{feedback.date}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">{getCategoryLabel(feedback.category)}</Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color="default">{getSourceLabel(feedback.source)}</Chip>
              </TableCell>
              <TableCell>{feedback.assignedStaff?.name || '-'}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={feedback.status === 'open' ? 'warning' : 'success'}
                  variant="flat"
                >
                  {feedback.status}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="warning"
                    variant="light"
                    isIconOnly
                    onPress={() => handleEdit(feedback)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    isIconOnly
                    onPress={() => handleDelete(feedback._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Feedback' : 'New Feedback'}</ModalHeader>
          <ModalBody>
            <Tabs>
              <Tab key="basic" title={t('pages.basicInfo')}>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label={t('pages.name1')}
                    placeholder={t('pages.enterName')}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    isRequired
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                    startContent={<MessageSquare size={14} />}
                  />
                  <Input
                    label={t('pages.phoneNumber')}
                    placeholder={t('pages.enterPhoneNumber')}
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phoneNumber: val });
                      if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                    }}
                    maxLength={10}
                    isInvalid={!!errors.phoneNumber}
                    errorMessage={errors.phoneNumber}
                  />
                  <Select
                    label={t('pages.category1')}
                    placeholder={t('pages.selectCategory')}
                    selectedKeys={formData.category ? [formData.category] : []}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value, subcategory: '' });
                      if (errors.category) setErrors({ ...errors, category: '' });
                    }}
                    isRequired
                    isInvalid={!!errors.category}
                    errorMessage={errors.category}
                  >
                    {Object.values(FEEDBACK_CATEGORIES).map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                  {formData.category && (
                    <Select
                      label={t('pages.subcategory')}
                      placeholder={t('pages.selectSubcategory')}
                      selectedKeys={formData.subcategory ? [formData.subcategory] : []}
                      onChange={(e) => {
                        setFormData({ ...formData, subcategory: e.target.value });
                        if (errors.subcategory) setErrors({ ...errors, subcategory: '' });
                      }}
                      isRequired
                      isInvalid={!!errors.subcategory}
                      errorMessage={errors.subcategory}
                    >
                      {FEEDBACK_CATEGORIES[formData.category]?.subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {SUBCATEGORY_LABELS[sub] || sub}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                  <Select
                    label={t('pages.source')}
                    placeholder={t('pages.selectSource')}
                    selectedKeys={[formData.source]}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    {SOURCE_OPTIONS.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label={t('pages.status2')}
                    placeholder={t('pages.selectStatus1')}
                    selectedKeys={[formData.status]}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <SelectItem key="open" value="open">{t('pages.open')}</SelectItem>
                    <SelectItem key="in_progress" value="in_progress">{t('pages.inProgress')}</SelectItem>
                    <SelectItem key="resolved" value="resolved">{t('pages.resolved')}</SelectItem>
                    <SelectItem key="closed" value="closed">{t('pages.closed')}</SelectItem>
                  </Select>
                </div>
              </Tab>
              <Tab key="assignment" title={t('pages.assignment')}>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <Select
                    label={t('pages.assignedStaff')}
                    placeholder={t('pages.selectStaffMember')}
                    selectedKeys={formData.assignedStaff ? [formData.assignedStaff] : []}
                    onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
                  >
                    {staff.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))}
                  </Select>
                  <Checkbox size="sm"
                    isSelected={formData.notifyStaff}
                    onValueChange={(value) => setFormData({ ...formData, notifyStaff: value })}
                  >
                    Notify Assigned Staff
                  </Checkbox>
                  <Checkbox size="sm"
                    isSelected={formData.assignAsTask}
                    onValueChange={(value) => setFormData({ ...formData, assignAsTask: value })}
                  >
                    Assign as Task (Creates a task for the staff member)
                  </Checkbox>
                  {formData.assignAsTask && (
                    <>
                      <Input
                        label={t('pages.taskTitle')}
                        placeholder={t('pages.enterTaskTitle')}
                        value={formData.taskTitle}
                        onChange={(e) => {
                          setFormData({ ...formData, taskTitle: e.target.value });
                          if (errors.taskTitle) setErrors({ ...errors, taskTitle: '' });
                        }}
                        isRequired={formData.assignAsTask}
                        isInvalid={!!errors.taskTitle}
                        errorMessage={errors.taskTitle}
                      />
                      <Select
                        label={t('pages.taskPriority')}
                        placeholder={t('pages.selectPriority')}
                        selectedKeys={[formData.taskPriority]}
                        onChange={(e) => setFormData({ ...formData, taskPriority: e.target.value })}
                      >
                        <SelectItem key="low" value="low">{t('pages.low')}</SelectItem>
                        <SelectItem key="medium" value="medium">{t('pages.medium')}</SelectItem>
                        <SelectItem key="high" value="high">{t('pages.high')}</SelectItem>
                        <SelectItem key="urgent" value="urgent">{t('pages.urgent')}</SelectItem>
                      </Select>
                    </>
                  )}
                  <Textarea
                    label={t('pages.notes1')}
                    placeholder={t('pages.enterFeedbackDetails')}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                  <div className="border border-default-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-default-700 mb-2">📤 Share via Internal Messaging</p>
                    <Select
                      label={t('pages.shareWithStaff')}
                      placeholder={t('pages.selectStaffToShareWith')}
                      selectionMode="multiple"
                      selectedKeys={new Set(formData.shareWithStaff || [])}
                      onSelectionChange={(keys) => setFormData({ ...formData, shareWithStaff: Array.from(keys) })}
                      size="sm"
                    >
                      {staff.map((member) => (
                        <SelectItem key={member._id} value={member._id}>
                          {member.name} ({member.role})
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting} isDisabled={isSubmitting}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

FeedbacksList.displayName = 'FeedbacksList';

export default FeedbacksList;
