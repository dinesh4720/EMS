import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import logger from "../../utils/logger";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Chip, useDisclosure, Select, SelectItem, Checkbox, Button
} from '@heroui/react';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { frontDeskApi, staffApi, announcementsApi } from '../../services/api';
import FormInput from '../../components/FormInput';
import { validatePhone, validateFutureDate, validateDateRange } from '../../utils/validations';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../utils/dateFormatter';

const AppointmentsList = forwardRef(({ onSave, ...props }, ref) => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const loadAppointments = async () => {
    try {
      const response = await frontDeskApi.getAppointments();
      setAppointments(response);
    } catch (error) {
      logger.error('Failed to load appointments:', error);
      toast.error(t('toast.error.failedToLoadAppointments'));
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async () => {
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

  const handleDelete = async (id) => {
    if (!confirm(t('confirm.deleteAppointment'))) return;
    try {
      await frontDeskApi.deleteAppointment(id);
      toast.success(t('toast.success.appointmentDeleted'));
      loadAppointments();
      onSave?.();
    } catch (error) {
      toast.error(t('toast.error.failedToDeleteAppointment'));
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.visitorName?.toLowerCase().includes(term) ||
      a.phoneNumber?.includes(searchTerm) ||
      a.purpose?.toLowerCase().includes(term) ||
      a.meetingWith?.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <Input
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Search size={16} />}
          className="max-w-xs"
          isClearable
          onClear={() => setSearchTerm('')}
        />
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          New Appointment
        </Button>
      </div>
      <Table aria-label={t('aria.tables.appointments')} removeWrapper>
        <TableHeader>
          <TableColumn scope="col">{t('pages.vISITORName')}</TableColumn>
          <TableColumn scope="col">{t('pages.pHONE')}</TableColumn>
          <TableColumn scope="col">{t('pages.pURPOSE')}</TableColumn>
          <TableColumn scope="col">{t('pages.fROM')}</TableColumn>
          <TableColumn scope="col">TO</TableColumn>
          <TableColumn scope="col">{t('pages.mEETINGWith')}</TableColumn>
          <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
          <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
        </TableHeader>
        <TableBody
          items={filteredAppointments}
          isLoading={loading}
          emptyContent="No appointments"
        >
          {(appointment) => (
            <TableRow key={appointment._id}>
              <TableCell>{appointment.visitorName}</TableCell>
              <TableCell>{appointment.phoneNumber || '-'}</TableCell>
              <TableCell>{appointment.purpose || '-'}</TableCell>
              <TableCell>{formatDateTime(appointment.fromDateTime)}</TableCell>
              <TableCell>{formatDateTime(appointment.toDateTime)}</TableCell>
              <TableCell>{getStaffName(appointment.meetingWith)}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={getStatusColor(appointment.status)}
                  variant="flat"
                >
                  {appointment.status}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="warning"
                    variant="light"
                    isIconOnly
                    onPress={() => handleEdit(appointment)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    isIconOnly
                    onPress={() => handleDelete(appointment._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Appointment' : 'New Appointment'}</ModalHeader>
          <ModalBody>
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
                selectedKeys={formData.meetingWith ? [formData.meetingWith] : []}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, meetingWith: val }));
                  validateField('meetingWith', val);
                }}
                isRequired
                isInvalid={!!errors.meetingWith}
                errorMessage={errors.meetingWith}
              >
                {staff.map((member) => (
                  <SelectItem key={member._id} value={member._id}>
                    {member.name} {member.role ? `(${member.role})` : ''}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label={t('pages.status2')}
                placeholder={t('pages.selectStatus1')}
                selectedKeys={[formData.status]}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <SelectItem key="scheduled" value="scheduled">{t('pages.scheduled')}</SelectItem>
                <SelectItem key="completed" value="completed">{t('pages.completed')}</SelectItem>
                <SelectItem key="cancelled" value="cancelled">{t('pages.cancelled')}</SelectItem>
              </Select>
              <Textarea
                label={t('pages.notes1')}
                placeholder={t('pages.enterNotesOptional')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="col-span-2"
                rows={2}
              />
              <div className="col-span-2 border-t border-default-200 pt-4 mt-2">
                <p className="text-sm font-medium text-default-700 mb-3">{t('pages.additionalOptions')}</p>
                <div className="space-y-3">
                  <Checkbox size="sm"
                    isSelected={formData.assignAsTask}
                    onValueChange={(value) => setFormData({ ...formData, assignAsTask: value })}
                  >
                    Assign as Task (Creates a task for the meeting)
                  </Checkbox>
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
                        selectedKeys={[formData.taskPriority]}
                        onChange={(e) => setFormData({ ...formData, taskPriority: e.target.value })}
                      >
                        <SelectItem key="low" value="low">{t('pages.low')}</SelectItem>
                        <SelectItem key="medium" value="medium">{t('pages.medium')}</SelectItem>
                        <SelectItem key="high" value="high">{t('pages.high')}</SelectItem>
                        <SelectItem key="urgent" value="urgent">{t('pages.urgent')}</SelectItem>
                      </Select>
                    </div>
                  )}
                  <div className="border border-default-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-default-700 mb-2">📤 Share via Internal Messaging</p>
                    <Select
                      label="Share with staff members"
                      placeholder={t('pages.selectStaffToNotify')}
                      selectionMode="multiple"
                      selectedKeys={new Set(formData.shareWithStaff || [])}
                      onSelectionChange={(keys) => setFormData({ ...formData, shareWithStaff: Array.from(keys) })}
                      size="sm"
                    >
                      {staff.map((member) => (
                        <SelectItem key={member._id} value={member._id}>
                          {member.name} {member.role ? `(${member.role})` : ''}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

AppointmentsList.displayName = 'AppointmentsList';

export default AppointmentsList;
