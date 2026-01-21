import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Chip, useDisclosure, Select, SelectItem, Button
} from '@heroui/react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { frontDeskApi, staffApi } from '../../services/api';
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
              <Input
                label="Visitor Name"
                placeholder="Enter visitor name"
                value={formData.visitorName}
                onChange={(e) => {
                  setFormData({ ...formData, visitorName: e.target.value });
                  if (errors.visitorName) setErrors({ ...errors, visitorName: '' });
                }}
                isRequired
                isInvalid={!!errors.visitorName}
                errorMessage={errors.visitorName}
              />
              <Input
                label="Phone Number"
                placeholder="Enter 10-digit phone number"
                value={formData.phoneNumber}
                onChange={(e) => {
                  setFormData({ ...formData, phoneNumber: e.target.value });
                  if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                }}
                maxLength={10}
                isInvalid={!!errors.phoneNumber}
                errorMessage={errors.phoneNumber}
              />
              <Input
                label="Purpose"
                placeholder="Enter purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="col-span-2"
              />
              <Input
                label="From Date & Time"
                type="datetime-local"
                value={formData.fromDateTime}
                onChange={(e) => {
                  setFormData({ ...formData, fromDateTime: e.target.value });
                  if (errors.fromDateTime) setErrors({ ...errors, fromDateTime: '' });
                }}
                isRequired
                isInvalid={!!errors.fromDateTime}
                errorMessage={errors.fromDateTime}
              />
              <Input
                label="To Date & Time"
                type="datetime-local"
                value={formData.toDateTime}
                onChange={(e) => {
                  setFormData({ ...formData, toDateTime: e.target.value });
                  if (errors.toDateTime) setErrors({ ...errors, toDateTime: '' });
                }}
                isRequired
                isInvalid={!!errors.toDateTime}
                errorMessage={errors.toDateTime}
              />
              <Select
                label="Meeting With"
                placeholder="Select staff member"
                selectedKeys={formData.meetingWith ? [formData.meetingWith] : []}
                onChange={(e) => {
                  setFormData({ ...formData, meetingWith: e.target.value });
                  if (errors.meetingWith) setErrors({ ...errors, meetingWith: '' });
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
                rows={3}
              />
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
