import { useState, useEffect } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Chip, useDisclosure, Select, SelectItem, Button
} from '@heroui/react';
import { Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await api.get('/front-desk/appointments');
      setAppointments(response.data);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/front-desk/appointments/${editingId}`, formData);
        toast.success('Appointment updated successfully');
      } else {
        await api.post('/front-desk/appointments', formData);
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
      await api.delete(`/front-desk/appointments/${id}`);
      toast.success('Appointment deleted');
      loadAppointments();
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  const resetForm = () => {
    setEditingId(null);
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
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                isRequired
              />
              <Input
                label="Phone Number"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, fromDateTime: e.target.value })}
                isRequired
              />
              <Input
                label="To Date & Time"
                type="datetime-local"
                value={formData.toDateTime}
                onChange={(e) => setFormData({ ...formData, toDateTime: e.target.value })}
                isRequired
              />
              <Input
                label="Meeting With"
                placeholder="Enter person name"
                value={formData.meetingWith}
                onChange={(e) => setFormData({ ...formData, meetingWith: e.target.value })}
              />
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
}
