import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import logger from "../../utils/logger";
import {
  Button,
  Chip,
  ConfirmDialog,
  DataTable,
  IconButton,
  Modal,
  MultiSelect,
  Select,
  Textarea,
  Checkbox,
} from '../../components/ui';
import { Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { frontDeskApi, staffApi, announcementsApi } from '../../services/api';
import FormInput from '../../components/FormInput';
import { validatePhone, validateFutureDate, validateDateRange } from '../../utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../utils/dateFormatter';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const AppointmentsList = forwardRef(({ onSave, ...props }, ref) => {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    phoneNumber: '',
    purpose: '',
    fromDateTime: '',
    toDateTime: '',
    meetingWith: '',
    notes: '',
    status: 'scheduled',
    assignAsTask: false,
    taskTitle: '',
    taskPriority: 'medium',
    assignedTo: '',
    shareWithStaff: [],
  });

  useEffect(() => {
    loadAppointments();
    loadStaff();
  }, []);

  // Expose the openModal function to parent
  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetForm();
      onOpen();
    }
  }));

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await frontDeskApi.getAppointments();
      setAppointments(response);
    } catch (err) {
      logger.error('Failed to load appointments:', err);
      setError(err);
      toast.error(t('toast.error.failedToLoadAppointments'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll();
      setStaff(response);
    } catch (error) {
      logger.error('Failed to load staff:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Visitor name is required';
    }
    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.fromDateTime) {
      newErrors.fromDateTime = 'Start time is required';
    }
    if (!formData.toDateTime) {
      newErrors.toDateTime = 'End time is required';
    }

    // Validate date range
    if (formData.fromDateTime && formData.toDateTime) {
      if (!validateDateRange(formData.fromDateTime, formData.toDateTime)) {
        newErrors.fromDateTime = 'Start time must be before end time';
      }
    }

    // Validate future date
    if (formData.fromDateTime && !validateFutureDate(formData.fromDateTime)) {
      newErrors.fromDateTime = 'Appointment must be in the future';
    }

    if (!formData.meetingWith) {
      newErrors.meetingWith = 'Please select who to meet';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (name, value) => {
    let error = '';
    const nameRegex = /^[a-zA-Z\s]*$/;

    switch (name) {
      case 'visitorName':
        if (!value.trim()) error = 'Visitor name is required';
        else if (!nameRegex.test(value)) error = 'Visitor name should contain only letters';
        break;
      case 'phoneNumber':
        if (value && (!validatePhone(value) || /^(\d)\1{9}$/.test(value))) error = 'Please enter a valid 10-digit phone number';
        break;
      case 'fromDateTime':
        if (!value) error = 'Start time is required';
        else if (!validateFutureDate(value)) error = 'Appointment must be in the future';
        else if (formData.toDateTime && !validateDateRange(value, formData.toDateTime)) error = 'Start time must be before end time';
        break;
      case 'toDateTime':
        if (!value) error = 'End time is required';
        else if (formData.fromDateTime && !validateDateRange(formData.fromDateTime, value)) error = 'End time must be after start time';
        break;
      case 'meetingWith':
        if (!value) error = 'Please select who to meet';
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;
    if (!validateForm()) {
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting'));
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await frontDeskApi.updateAppointment(editingId, formData);
        toast.success(t('toast.success.appointmentUpdatedSuccessfully'));
      } else {
        await frontDeskApi.createAppointment(formData);
        toast.success(t('toast.success.appointmentCreatedSuccessfully'));
      }

      if (formData.assignAsTask && formData.taskTitle?.trim()) {
        try {
          const meetingStaff = staff.find(s => s._id === formData.meetingWith);
          const assignedStaff = formData.assignedTo || meetingStaff?._id;
          if (assignedStaff) {
            await announcementsApi.create({
              title: formData.taskTitle,
              content: `Appointment task assigned to you.\n\nVisitor: ${formData.visitorName}\nPurpose: ${formData.purpose || 'N/A'}\nFrom: ${formData.fromDateTime ? formatDateTime(formData.fromDateTime) : 'N/A'}\nTo: ${formData.toDateTime ? formatDateTime(formData.toDateTime) : 'N/A'}\nPriority: ${formData.taskPriority}`.trim(),
              recipients: [{ type: 'custom', userIds: [assignedStaff] }],
              channels: ['in_app'],
            });
            toast.success('Task notification sent to assigned staff');
          }
        } catch (taskErr) {
          logger.error('Appointment task error:', taskErr);
          toast.error('Appointment saved but failed to send task notification');
        }
      }

      if (formData.shareWithStaff?.length > 0) {
        try {
          await announcementsApi.create({
            title: `Appointment: ${formData.visitorName}`,
            content: `An appointment has been shared with you.\n\nVisitor: ${formData.visitorName}\nPhone: ${formData.phoneNumber || 'N/A'}\nPurpose: ${formData.purpose || 'N/A'}\nFrom: ${formData.fromDateTime ? formatDateTime(formData.fromDateTime) : 'N/A'}\nTo: ${formData.toDateTime ? formatDateTime(formData.toDateTime) : 'N/A'}\nMeeting With: ${getStaffName(formData.meetingWith)}`.trim(),
            recipients: [{ type: 'custom', userIds: formData.shareWithStaff }],
            channels: ['in_app'],
          });
          toast.success(`Appointment shared with ${formData.shareWithStaff.length} staff member(s)`);
        } catch (shareErr) {
          logger.error('Appointment share error:', shareErr);
          toast.error('Appointment saved but failed to share with staff');
        }
      }

      onClose();
      resetForm();
      loadAppointments();
      onSave?.();
    } catch (error) {
      toast.error(t('toast.error.failedToSaveAppointment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (appointment) => {
    setEditingId(appointment._id);
    setFormData({
      visitorName: appointment.visitorName || '',
      phoneNumber: appointment.phoneNumber || '',
      purpose: appointment.purpose || '',
      fromDateTime: appointment.fromDateTime || '',
      toDateTime: appointment.toDateTime || '',
      meetingWith: appointment.meetingWith || '',
      notes: appointment.notes || '',
      status: appointment.status || 'scheduled',
    });
    onOpen();
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Appointment',
      message: t('confirm.deleteAppointment'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await frontDeskApi.deleteAppointment(id);
          toast.success(t('toast.success.appointmentDeleted'));
          loadAppointments();
          onSave?.();
        } catch (error) {
          toast.error(t('toast.error.failedToDeleteAppointment'));
        }
      },
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setFormData({
      visitorName: '',
      phoneNumber: '',
      purpose: '',
      fromDateTime: '',
      toDateTime: '',
      meetingWith: '',
      notes: '',
      status: 'scheduled',
      assignAsTask: false,
      taskTitle: '',
      taskPriority: 'medium',
      assignedTo: '',
      shareWithStaff: [],
    });
  };

  const getStaffName = (meetingWith) => {
    if (!meetingWith) return '-';
    // Look up by ID first (new format)
    const byId = staff.find(s => s._id === meetingWith);
    if (byId) return byId.name;
    // Fallback: might be a legacy name string
    return meetingWith;
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  // Schedule conflict detection — two scheduled appointments collide when their
  // [fromDateTime, toDateTime) ranges overlap AND target the same staff member.
  const conflictIdsByStaff = useMemo(() => {
    const set = new Set();
    const active = appointments.filter(
      (a) => (a.status || 'scheduled') === 'scheduled' && a.fromDateTime && a.toDateTime
    );
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const a = active[i];
        const b = active[j];
        if (!a.meetingWith || a.meetingWith !== b.meetingWith) continue;
        const aFrom = new Date(a.fromDateTime).getTime();
        const aTo = new Date(a.toDateTime).getTime();
        const bFrom = new Date(b.fromDateTime).getTime();
        const bTo = new Date(b.toDateTime).getTime();
        if (Number.isNaN(aFrom) || Number.isNaN(bFrom)) continue;
        if (aFrom < bTo && bFrom < aTo) {
          set.add(a._id);
          set.add(b._id);
        }
      }
    }
    return set;
  }, [appointments]);

  const conflictCount = conflictIdsByStaff.size;

  const columns = useMemo(() => [
    {
      key: 'visitorName',
      label: t('pages.vISITORName'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.visitorName}</span>
          {conflictIdsByStaff.has(row._id) && (
            <span className="fd-conflict" title="Time conflict with another scheduled appointment for this staff member">
              <AlertTriangle size={10} aria-hidden="true" />
              conflict
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      label: t('pages.pHONE'),
      accessor: (row) => row.phoneNumber || '-',
    },
    {
      key: 'purpose',
      label: t('pages.pURPOSE'),
      accessor: (row) => row.purpose || '-',
    },
    {
      key: 'fromDateTime',
      label: t('pages.fROM'),
      render: (row) => formatDateTime(row.fromDateTime),
    },
    {
      key: 'toDateTime',
      label: 'TO',
      render: (row) => formatDateTime(row.toDateTime),
    },
    {
      key: 'meetingWith',
      label: t('pages.mEETINGWith'),
      accessor: (row) => getStaffName(row.meetingWith),
    },
    {
      key: 'status',
      label: t('pages.sTATUS'),
      align: 'center',
      render: (row) => (
        <Chip size="sm" color={getStatusChipColor(row.status)}>
          {row.status}
        </Chip>
      ),
    },
  ], [conflictIdsByStaff, t]);

  const rowActions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        aria-label="Edit appointment"
        icon={<Edit size={14} />}
        onClick={() => handleEdit(row)}
        size="sm"
      />
      <IconButton
        aria-label="Delete appointment"
        icon={<Trash2 size={14} />}
        onClick={() => handleDelete(row._id)}
        size="sm"
        variant="danger"
      />
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {conflictCount > 0 && (
            <span className="fd-conflict" role="status" aria-live="polite">
              <AlertTriangle size={11} aria-hidden="true" />
              {conflictCount} scheduling conflict{conflictCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={onOpen}>
          New Appointment
        </Button>
      </div>

      <DataTable
        ariaLabel={t('aria.tables.appointments')}
        columns={columns}
        data={appointments}
        keyField="_id"
        loading={loading}
        error={error}
        onRetry={loadAppointments}
        searchable
        searchKeys={['visitorName', 'phoneNumber', 'purpose', 'meetingWith']}
        searchPlaceholder="Search appointments…"
        emptyState={{
          title: 'No appointments',
          description: 'Create an appointment to schedule a visitor meeting.',
          action: (
            <Button icon={<Plus size={16} />} size="sm" onClick={onOpen}>
              New Appointment
            </Button>
          ),
        }}
        rowActions={rowActions}
        pagination
        defaultPageSize={10}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingId ? 'Edit Appointment' : 'New Appointment'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label={t('pages.visitorName')}
            placeholder={t('pages.enterVisitorName')}
            value={formData.visitorName}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, visitorName: val }));
              validateField('visitorName', val);
            }}
            required
            error={errors.visitorName}
          />
          <FormInput
            label={t('pages.phoneNumber')}
            placeholder={t('pages.enter10DigitPhoneNumber')}
            value={formData.phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setFormData(prev => ({ ...prev, phoneNumber: val }));
              validateField('phoneNumber', val);
            }}
            maxLength={10}
            error={errors.phoneNumber}
          />
          <FormInput
            label={t('pages.purpose1')}
            placeholder={t('pages.enterPurpose')}
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            wrapperClassName="col-span-2"
          />
          <FormInput
            label={t('pages.fromDateTime')}
            type="datetime-local"
            value={formData.fromDateTime}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, fromDateTime: val }));
              validateField('fromDateTime', val);
            }}
            required
            error={errors.fromDateTime}
          />
          <FormInput
            label={t('pages.toDateTime')}
            type="datetime-local"
            value={formData.toDateTime}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, toDateTime: val }));
              validateField('toDateTime', val);
            }}
            required
            error={errors.toDateTime}
          />
          <Select
            label={t('pages.meetingWith1')}
            placeholder={t('pages.selectStaffMember')}
            value={formData.meetingWith}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, meetingWith: val }));
              validateField('meetingWith', val);
            }}
            required
            error={errors.meetingWith}
          >
            {staff.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name} {member.role ? `(${member.role})` : ''}
              </option>
            ))}
          </Select>
          <Select
            label={t('pages.status2')}
            placeholder={t('pages.selectStatus1')}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="scheduled">{t('pages.scheduled')}</option>
            <option value="completed">{t('pages.completed')}</option>
            <option value="cancelled">{t('pages.cancelled')}</option>
          </Select>
          <Textarea
            label={t('pages.notes1')}
            placeholder={t('pages.enterNotesOptional')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            wrapperClassName="col-span-2"
            rows={2}
          />
          <div className="col-span-2 border-t border-divider pt-4 mt-2">
            <p className="text-sm font-medium text-fg mb-3">{t('pages.additionalOptions')}</p>
            <div className="space-y-3">
              <Checkbox
                size="sm"
                label="Assign as Task (Creates a task for the meeting)"
                checked={formData.assignAsTask}
                onChange={(e) => setFormData({ ...formData, assignAsTask: e.target.checked })}
              />
              {formData.assignAsTask && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <FormInput
                    label={t('pages.taskTitle')}
                    placeholder={t('pages.enterTaskTitle')}
                    value={formData.taskTitle}
                    onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                    required={formData.assignAsTask}
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
                </div>
              )}
              <div className="border border-divider rounded-lg p-3">
                <p className="text-sm font-medium text-fg mb-2">📤 Share via Internal Messaging</p>
                <MultiSelect
                  label="Share with staff members"
                  placeholder={t('pages.selectStaffToNotify')}
                  options={staff.map((member) => ({
                    value: member._id,
                    label: `${member.name} ${member.role ? `(${member.role})` : ''}`,
                  }))}
                  value={formData.shareWithStaff || []}
                  onChange={(vals) => setFormData({ ...formData, shareWithStaff: vals })}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
});

AppointmentsList.displayName = 'AppointmentsList';

export default AppointmentsList;
