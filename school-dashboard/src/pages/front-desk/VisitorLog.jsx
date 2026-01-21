import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Chip, useDisclosure, Button
} from '@heroui/react';
import { LogOut, Trash2, Plus } from 'lucide-react';
import { frontDeskApi } from '../../services/api';
import { validatePhone, validateRequired } from '../../utils/validations';
import toast from 'react-hot-toast';

const VisitorLog = forwardRef((props, ref) => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    visitorName: '',
    phoneNumber: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toTimeString().slice(0, 5),
    reasonForVisit: '',
    concernedPerson: '',
  });

  // Expose the openModal function to parent
  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetForm();
      onOpen();
    }
  }));

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      const response = await frontDeskApi.getVisitorsToday();
      setVisitors(response);
    } catch (error) {
      console.error('Failed to load visitors:', error);
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Visitor name is required';
    }

    // Phone validation
    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
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
      await frontDeskApi.createVisitor(formData);
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
      await frontDeskApi.updateVisitor(id, {
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
      await frontDeskApi.deleteVisitor(id);
      toast.success('Visitor record deleted');
      loadVisitors();
    } catch (error) {
      toast.error('Failed to delete visitor record');
    }
  };

  const resetForm = () => {
    setErrors({});
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
      <div className="flex justify-end mb-4">
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          Add New Visitor
        </Button>
      </div>
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
                label="Date"
                type="date"
                value={formData.date}
                isReadOnly
                classNames={{
                  input: "bg-default-100 cursor-not-allowed"
                }}
              />
              <Input
                label="Check In Time"
                type="time"
                value={formData.checkInTime}
                isReadOnly
                classNames={{
                  input: "bg-default-100 cursor-not-allowed"
                }}
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
});

VisitorLog.displayName = 'VisitorLog';

export default VisitorLog;
