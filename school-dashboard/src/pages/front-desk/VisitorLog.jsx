import { useState, useEffect } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Chip, useDisclosure, Button
} from '@heroui/react';
import { LogOut, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function VisitorLog() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    visitorName: '',
    phoneNumber: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toTimeString().slice(0, 5),
    reasonForVisit: '',
    concernedPerson: '',
  });

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      const response = await api.get('/front-desk/visitors/today');
      setVisitors(response.data);
    } catch (error) {
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/front-desk/visitors', formData);
      toast.success('Visitor checked in successfully');
      onClose();
      resetForm();
      loadVisitors();
    } catch (error) {
      toast.error('Failed to check in visitor');
    }
  };

  const handleCheckout = async (id) => {
    try {
      await api.put(`/front-desk/visitors/${id}/checkout`, {
        checkOutTime: new Date().toTimeString().slice(0, 5),
      });
      toast.success('Visitor checked out successfully');
      loadVisitors();
    } catch (error) {
      toast.error('Failed to check out visitor');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this visitor record?')) return;
    try {
      await api.delete(`/front-desk/visitors/${id}`);
      toast.success('Visitor record deleted');
      loadVisitors();
    } catch (error) {
      toast.error('Failed to delete visitor record');
    }
  };

  const resetForm = () => {
    setFormData({
      visitorName: '',
      phoneNumber: '',
      date: new Date().toISOString().split('T')[0],
      checkInTime: new Date().toTimeString().slice(0, 5),
      reasonForVisit: '',
      concernedPerson: '',
    });
  };

  return (
    <>
      <Table aria-label="Visitor log table" removeWrapper>
            <TableHeader>
              <TableColumn>VISITOR NAME</TableColumn>
              <TableColumn>PHONE</TableColumn>
              <TableColumn>CHECK IN</TableColumn>
              <TableColumn>CHECK OUT</TableColumn>
              <TableColumn>REASON</TableColumn>
              <TableColumn>CONCERNED PERSON</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={visitors}
              isLoading={loading}
              emptyContent="No visitors today"
            >
              {(visitor) => (
                <TableRow key={visitor._id}>
                  <TableCell>{visitor.visitorName}</TableCell>
                  <TableCell>{visitor.phoneNumber || '-'}</TableCell>
                  <TableCell>{visitor.checkInTime}</TableCell>
                  <TableCell>{visitor.checkOutTime || '-'}</TableCell>
                  <TableCell>{visitor.reasonForVisit || '-'}</TableCell>
                  <TableCell>{visitor.concernedPerson || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={visitor.status === 'checked-in' ? 'success' : 'default'}
                      variant="flat"
                    >
                      {visitor.status === 'checked-in' ? 'In' : 'Out'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {visitor.status === 'checked-in' && (
                        <Button
                          size="sm"
                          color="warning"
                          variant="flat"
                          startContent={<LogOut size={14} />}
                          onPress={() => handleCheckout(visitor._id)}
                        >
                          Check Out
                        </Button>
                      )}
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        isIconOnly
                        onPress={() => handleDelete(visitor._id)}
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
          <ModalHeader>New Visitor</ModalHeader>
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
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                isRequired
              />
              <Input
                label="Check In Time"
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                isRequired
              />
              <Input
                label="Reason for Visit"
                placeholder="Enter reason"
                value={formData.reasonForVisit}
                onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                className="col-span-2"
              />
              <Input
                label="Concerned Person"
                placeholder="Person to meet"
                value={formData.concernedPerson}
                onChange={(e) => setFormData({ ...formData, concernedPerson: e.target.value })}
                className="col-span-2"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              Check In
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
