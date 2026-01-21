import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Chip, useDisclosure,
  Select, SelectItem, Checkbox, Button
} from '@heroui/react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { frontDeskApi, staffApi } from '../../services/api';
import toast from 'react-hot-toast';

const FeedbacksList = forwardRef((props, ref) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    category: '',
    assignedStaff: '',
    notifyStaff: false,
    status: 'open',
    notes: '',
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
      setFeedbacks(response);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
      toast.error('Failed to load feedbacks');
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

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await frontDeskApi.updateFeedback(editingId, formData);
        toast.success('Feedback updated successfully');
      } else {
        await frontDeskApi.createFeedback(formData);
        toast.success('Feedback created successfully');
      }
      onClose();
      resetForm();
      loadFeedbacks();
    } catch (error) {
      toast.error('Failed to save feedback');
    }
  };

  const handleEdit = (feedback) => {
    setEditingId(feedback._id);
    setFormData({
      name: feedback.name,
      phoneNumber: feedback.phoneNumber || '',
      category: feedback.category || '',
      assignedStaff: feedback.assignedStaff?._id || '',
      notifyStaff: false,
      status: feedback.status || 'open',
      notes: feedback.notes || '',
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await frontDeskApi.deleteFeedback(id);
      toast.success('Feedback deleted');
      loadFeedbacks();
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phoneNumber: '',
      category: '',
      assignedStaff: '',
      notifyStaff: false,
      status: 'open',
      notes: '',
    });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          New Feedback
        </Button>
      </div>
      <Table aria-label="Feedbacks table" removeWrapper>
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>PHONE</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>ASSIGNED TO</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              items={feedbacks}
              isLoading={loading}
              emptyContent="No feedbacks"
            >
              {(feedback) => (
                <TableRow key={feedback._id}>
                  <TableCell>{feedback.name}</TableCell>
                  <TableCell>{feedback.phoneNumber || '-'}</TableCell>
                  <TableCell>{feedback.date}</TableCell>
                  <TableCell>{feedback.category || '-'}</TableCell>
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

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Feedback' : 'New Feedback'}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="Enter name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Input
                label="Phone Number"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
              <Input
                label="Category"
                placeholder="e.g., Complaint, Suggestion"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <Select
                label="Assigned Staff"
                placeholder="Select staff"
                selectedKeys={formData.assignedStaff ? [formData.assignedStaff] : []}
                onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
              >
                {staff.map((member) => (
                  <SelectItem key={member._id} value={member._id}>
                    {member.name} ({member.role})
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Status"
                placeholder="Select status"
                selectedKeys={[formData.status]}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <SelectItem key="open" value="open">Open</SelectItem>
                <SelectItem key="resolved" value="resolved">Resolved</SelectItem>
              </Select>
              <Checkbox
                isSelected={formData.notifyStaff}
                onValueChange={(value) => setFormData({ ...formData, notifyStaff: value })}
              >
                Notify Assigned Staff
              </Checkbox>
              <Textarea
                label="Notes"
                placeholder="Enter feedback details"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="col-span-2"
                rows={4}
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

FeedbacksList.displayName = 'FeedbacksList';

export default FeedbacksList;
