import { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Chip, useDisclosure,
  Select, SelectItem, Checkbox
} from '@heroui/react';
import { Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function FeedbacksList() {
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

  const loadFeedbacks = async () => {
    try {
      const response = await api.get('/front-desk/feedbacks');
      setFeedbacks(response.data);
    } catch (error) {
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to load staff');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/front-desk/feedbacks/${editingId}`, formData);
        toast.success('Feedback updated successfully');
      } else {
        await api.post('/front-desk/feedbacks', formData);
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
      await api.delete(`/front-desk/feedbacks/${id}`);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare size={24} />
            Feedbacks
          </h1>
          <p className="text-sm text-default-500 mt-1">Collect and manage feedback</p>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={onOpen}>
          New Feedback
        </Button>
      </div>

      <Card>
        <CardBody>
          <Table aria-label="Feedbacks table">
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
        </CardBody>
      </Card>

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
                  <SelectItem key={member.id} value={member.id}>
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
    </div>
  );
}
