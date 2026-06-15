import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import logger from "../../utils/logger";
import {
  Button,
  Chip,
  ConfirmDialog,
  DataTable,
  IconButton,
  Input,
  Modal,
  MultiSelect,
  Select,
  Textarea,
  Checkbox,
  Tabs,
} from '../../components/ui';
import { Edit, Trash2, Plus, MessageSquare } from 'lucide-react';
import { frontDeskApi, staffApi, announcementsApi } from '../../services/api';
import { validatePhone } from '../../utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useConfirmDialog from '../../hooks/useConfirmDialog';

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

const FeedbacksList = forwardRef(({ onSave, ...props }, ref) => {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
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
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
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
  }, [loadFeedbacks]);

  // Expose the openModal function to parent
  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetForm();
      onOpen();
    }
  }));

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await frontDeskApi.getFeedbacks();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setFeedbacks(data);
    } catch (err) {
      logger.error('Failed to load feedbacks:', err);
      setError(err);
      toast.error(t('toast.error.failedToLoadFeedbacks'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setStaff(data);
    } catch (err) {
      logger.error('Failed to load staff:', err);
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

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
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
      onSave?.();
    } catch (err) {
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

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Feedback',
      message: t('confirm.deleteFeedback'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await frontDeskApi.deleteFeedback(id);
          toast.success(t('toast.success.feedbackDeleted'));
          loadFeedbacks();
          onSave?.();
        } catch (err) {
          toast.error(t('toast.error.failedToDeleteFeedback'));
        }
      },
    });
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

  // Summary aggregations: count by status and by top-level category.
  // Powers the .fd-summary strip + per-category rating-style bars.
  const summary = useMemo(() => {
    const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const byCategory = { STAFF: 0, FACILITIES: 0, MANAGEMENT: 0 };
    feedbacks.forEach((f) => {
      const status = f.status || 'open';
      if (byStatus[status] != null) byStatus[status] += 1;
      const topCat = (f.category || '').split('_')[0];
      if (byCategory[topCat] != null) byCategory[topCat] += 1;
    });
    const total = feedbacks.length;
    const resolutionRate = total
      ? Math.round(((byStatus.resolved + byStatus.closed) / total) * 100)
      : 0;
    return { byStatus, byCategory, total, resolutionRate };
  }, [feedbacks]);

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'open': return 'warning';
      case 'in_progress': return 'primary';
      case 'resolved': return 'success';
      case 'closed': return 'neutral';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'open': return 'Open';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status || '-';
    }
  };

  const maxCategoryCount = Math.max(1, ...Object.values(summary.byCategory));

  const columns = useMemo(() => [
    {
      key: 'name',
      label: t('pages.nAME'),
      accessor: (row) => row.name,
    },
    {
      key: 'phoneNumber',
      label: t('pages.pHONE'),
      accessor: (row) => row.phoneNumber || '-',
    },
    {
      key: 'date',
      label: t('pages.dATE'),
      accessor: (row) => row.date,
    },
    {
      key: 'category',
      label: t('pages.cATEGORY'),
      render: (row) => (
        <Chip size="sm" color="neutral">{getCategoryLabel(row.category)}</Chip>
      ),
    },
    {
      key: 'source',
      label: t('pages.sOURCE'),
      render: (row) => (
        <Chip size="sm" color="neutral">{getSourceLabel(row.source)}</Chip>
      ),
    },
    {
      key: 'assignedStaff',
      label: t('pages.aSSIGNEDTo'),
      accessor: (row) => row.assignedStaff?.name || '-',
    },
    {
      key: 'status',
      label: t('pages.sTATUS'),
      align: 'center',
      render: (row) => (
        <Chip size="sm" color={getStatusChipColor(row.status)}>
          {getStatusLabel(row.status)}
        </Chip>
      ),
    },
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const rowActions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        aria-label="Edit feedback"
        icon={<Edit size={14} />}
        onClick={() => handleEdit(row)}
        size="sm"
      />
      <IconButton
        aria-label="Delete feedback"
        icon={<Trash2 size={14} />}
        onClick={() => handleDelete(row._id)}
        size="sm"
        variant="danger"
      />
    </div>
  );

  return (
    <>
      {summary.total > 0 && (
        <div className="fd-summary" role="region" aria-label="Feedback summary">
          <span className="fd-summary__item">
            Total <span className="fd-summary__item-value">{summary.total}</span>
          </span>
          <span className="fd-summary__item">
            Open <span className="fd-summary__item-value">{summary.byStatus.open}</span>
          </span>
          <span className="fd-summary__item">
            In Progress <span className="fd-summary__item-value">{summary.byStatus.in_progress}</span>
          </span>
          <span className="fd-summary__item">
            Resolved <span className="fd-summary__item-value">{summary.byStatus.resolved}</span>
          </span>
          <span className="fd-summary__item">
            Resolution Rate <span className="fd-summary__item-value">{summary.resolutionRate}%</span>
          </span>
          <div className="fd-rating" aria-label="Feedbacks by category">
            <span className="fd-rating__label">By Category</span>
            {Object.entries(summary.byCategory).map(([cat, count]) => (
              <div key={cat} className="fd-rating__row">
                <span>{FEEDBACK_CATEGORIES[cat]?.label || cat}</span>
                <div className="fd-rating__bar" aria-hidden="true">
                  <div
                    className="fd-rating__fill"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
                <span className="mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="flex gap-2 items-center flex-wrap">
          <Chip size="sm" color="primary">{t('pages.parentApp1')}</Chip>
          <Chip size="sm" color="info">{t('pages.studentApp')}</Chip>
          <Chip size="sm" color="success">{t('pages.teacherApp')}</Chip>
          <span className="text-xs text-fg-subtle">{t('pages.feedbacksFromAppsSyncAutomatically')}</span>
        </div>
      </div>

      <DataTable
        ariaLabel={t('aria.tables.feedbacks')}
        columns={columns}
        data={feedbacks}
        keyField="_id"
        loading={loading}
        error={error}
        onRetry={loadFeedbacks}
        searchable
        searchKeys={['name', 'phoneNumber', 'category', 'assignedStaff']}
        searchPlaceholder="Search feedbacks…"
        emptyState={{
          title: 'No feedbacks',
          description: 'Create a feedback record to track issues and suggestions.',
          action: (
            <Button icon={<Plus size={16} />} size="sm" onClick={onOpen}>
              New Feedback
            </Button>
          ),
        }}
        rowActions={rowActions}
        toolbarActions={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={onOpen}>
            New Feedback
          </Button>
        }
        pagination
        defaultPageSize={10}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingId ? 'Edit Feedback' : 'New Feedback'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <Tabs
          tabs={[
            { key: 'basic', title: t('pages.basicInfo') },
            { key: 'assignment', title: t('pages.assignment') },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="underline"
          className="mb-4"
        />
        {activeTab === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('pages.name1')}
              placeholder={t('pages.enterName')}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              required
              error={errors.name}
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
              error={errors.phoneNumber}
            />
            <Select
              label={t('pages.category1')}
              placeholder={t('pages.selectCategory')}
              value={formData.category}
              onChange={(e) => {
                setFormData({ ...formData, category: e.target.value, subcategory: '' });
                if (errors.category) setErrors({ ...errors, category: '' });
              }}
              required
              error={errors.category}
            >
              {Object.values(FEEDBACK_CATEGORIES).map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </Select>
            {formData.category && (
              <Select
                label={t('pages.subcategory')}
                placeholder={t('pages.selectSubcategory')}
                value={formData.subcategory}
                onChange={(e) => {
                  setFormData({ ...formData, subcategory: e.target.value });
                  if (errors.subcategory) setErrors({ ...errors, subcategory: '' });
                }}
                required
                error={errors.subcategory}
              >
                {FEEDBACK_CATEGORIES[formData.category]?.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {SUBCATEGORY_LABELS[sub] || sub}
                  </option>
                ))}
              </Select>
            )}
            <Select
              label={t('pages.source')}
              placeholder={t('pages.selectSource')}
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            >
              {SOURCE_OPTIONS.map((source) => (
                <option key={source} value={source}>
                  {source.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
            <Select
              label={t('pages.status2')}
              placeholder={t('pages.selectStatus1')}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="open">{t('pages.open')}</option>
              <option value="in_progress">{t('pages.inProgress')}</option>
              <option value="resolved">{t('pages.resolved')}</option>
              <option value="closed">{t('pages.closed')}</option>
            </Select>
          </div>
        )}
        {activeTab === 'assignment' && (
          <div className="grid grid-cols-1 gap-4">
            <Select
              label={t('pages.assignedStaff')}
              placeholder={t('pages.selectStaffMember')}
              value={formData.assignedStaff}
              onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
            >
              {staff.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </Select>
            <Checkbox
              size="sm"
              label="Notify Assigned Staff"
              checked={formData.notifyStaff}
              onChange={(e) => setFormData({ ...formData, notifyStaff: e.target.checked })}
            />
            <Checkbox
              size="sm"
              label="Assign as Task (Creates a task for the staff member)"
              checked={formData.assignAsTask}
              onChange={(e) => setFormData({ ...formData, assignAsTask: e.target.checked })}
            />
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
                  required={formData.assignAsTask}
                  error={errors.taskTitle}
                />
                <Select
                  label={t('pages.taskPriority')}
                  placeholder={t('pages.selectPriority')}
                  value={formData.taskPriority}
                  onChange={(e) => setFormData({ ...formData, taskPriority: e.target.value })}
                >
                  <option value="low">{t('pages.low')}</option>
                  <option value="medium">{t('pages.medium')}</option>
                  <option value="high">{t('pages.high')}</option>
                  <option value="urgent">{t('pages.urgent')}</option>
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
            <div className="border border-divider rounded-lg p-3">
              <p className="text-sm font-medium text-fg mb-2">📤 Share via Internal Messaging</p>
              <MultiSelect
                label={t('pages.shareWithStaff')}
                placeholder={t('pages.selectStaffToShareWith')}
                options={staff.map((member) => ({
                  value: member._id,
                  label: `${member.name} (${member.role})`,
                }))}
                value={formData.shareWithStaff || []}
                onChange={(vals) => setFormData({ ...formData, shareWithStaff: vals })}
                size="sm"
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
});

FeedbacksList.displayName = 'FeedbacksList';

export default FeedbacksList;
