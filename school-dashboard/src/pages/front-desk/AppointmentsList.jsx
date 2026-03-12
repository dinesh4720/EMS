import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Chip, useDisclosure, Select, SelectItem, Checkbox, Button
} from '@heroui/react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { frontDeskApi, staffApi } from '../../services/api';
import FormInput from '../../components/FormInput';
import { validatePhone, validateFutureDate, validateDateRange } from '../../utils/validations';
import toast from 'react-hot-toast';

const AppointmentsList = forwardRef((props, ref) => {
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
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
      console.error('Failed to load appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll();
      setStaff(response);
    } catch (error) {
      console.error('Failed to load staff:', error);
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
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    try {
      if (editingId) {
        await frontDeskApi.updateAppointment(editingId, formData);
        toast.success('Appointment updated successfully');
      } else {
        await frontDeskApi.createAppointment(formData);
        toast.success('Appointment created successfully');
      }

      if (formData.assignAsTask) {
        toast.info('Task will be created for the assigned staff member');
      }

      if (formData.shareWithStaff?.length > 0) {
        toast.info(`Appointment will be shared with ${formData.shareWithStaff.length} staff member(s)`);
      }

      onClose();
      resetForm();
      loadAppointments();
    } catch (error) {
      toast.error('Failed to save appointment');
    }
  };

  const handleEdit = (appointment) => {
    setEditingId(appointment._id);
    setFormData({
      visitorName: appointment.visitorName,
      phoneNumber: appointment.phoneNumber || '',
      purpose: appointment.purpose || '',
      fromDateTime: appointment.fromDateTime,
      toDateTime: appointment.toDateTime,
      meetingWith: appointment.meetingWith || '',
      notes: appointment.notes || '',
      status: appointment.status || 'scheduled',
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await frontDeskApi.deleteAppointment(id);
      toast.success('Appointment deleted');
      loadAppointments();
    } catch (error) {
      toast.error('Failed to delete appointment');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          New Appointment
        </Button>
      </div>
      <Table aria-label="Appointments table" removeWrapper>
        <TableHeader>
          <TableColumn>VISITOR NAME</TableColumn>
          <TableColumn>PHONE</TableColumn>
          <TableColumn>PURPOSE</TableColumn>
          <TableColumn>FROM</TableColumn>
          <TableColumn>TO</TableColumn>
          <TableColumn>MEETING WITH</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          items={appointments}
          isLoading={loading}
          emptyContent="No appointments"
        >
          {(appointment) => (
            <TableRow key={appointment._id}>
              <TableCell>{appointment.visitorName}</TableCell>
              <TableCell>{appointment.phoneNumber || '-'}</TableCell>
              <TableCell>{appointment.purpose || '-'}</TableCell>
              <TableCell>{new Date(appointment.fromDateTime).toLocaleString()}</TableCell>
              <TableCell>{new Date(appointment.toDateTime).toLocaleString()}</TableCell>
              <TableCell>{appointment.meetingWith || '-'}</TableCell>
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
                label="Visitor Name"
                placeholder="Enter visitor name"
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
                label="Phone Number"
                placeholder="Enter 10-digit phone number"
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
                label="Purpose"
                placeholder="Enter purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                wrapperClassName="col-span-2"
              />
              <FormInput
                label="From Date & Time"
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
                label="To Date & Time"
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
                label="Meeting With"
                placeholder="Select staff member"
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
                  <SelectItem key={member.name} value={member.name}>
                    {member.name} {member.role ? `(${member.role})` : ''}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Status"
                placeholder="Select status"
                selectedKeys={[formData.status]}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <SelectItem key="scheduled" value="scheduled">Scheduled</SelectItem>
                <SelectItem key="completed" value="completed">Completed</SelectItem>
                <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
              </Select>
              <Textarea
                label="Notes"
                placeholder="Enter notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="col-span-2"
                rows={2}
              />
              <div className="col-span-2 border-t border-default-200 pt-4 mt-2">
                <p className="text-sm font-medium text-default-700 mb-3">Additional Options</p>
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
                        label="Task Title"
                        placeholder="Enter task title"
                        value={formData.taskTitle}
                        onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                        required={formData.assignAsTask}
                      />
                      <Select
                        label="Task Priority"
                        placeholder="Select priority"
                        selectedKeys={[formData.taskPriority]}
                        onChange={(e) => setFormData({ ...formData, taskPriority: e.target.value })}
                      >
                        <SelectItem key="low" value="low">Low</SelectItem>
                        <SelectItem key="medium" value="medium">Medium</SelectItem>
                        <SelectItem key="high" value="high">High</SelectItem>
                        <SelectItem key="urgent" value="urgent">Urgent</SelectItem>
                      </Select>
                    </div>
                  )}
                  <div className="bg-secondary-50 border border-secondary-200 p-3 rounded-lg">
                    <p className="text-sm text-secondary-700">📤 Share to Internal Messaging</p>
                    <p className="text-xs text-secondary-600 mt-1">Feature coming soon - share appointment with multiple staff members</p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
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
