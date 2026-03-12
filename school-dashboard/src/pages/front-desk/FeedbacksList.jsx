import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Chip, useDisclosure,
  Select, SelectItem, Checkbox, Button, Tabs, Tab
} from '@heroui/react';
import { Edit, Trash2, Plus, MessageSquare } from 'lucide-react';
import { frontDeskApi, staffApi } from '../../services/api';
import { validatePhone } from '../../utils/validations';
import toast from 'react-hot-toast';

const FEEDBACK_CATEGORIES = {
  STAFF: {
    key: 'STAFF',
    label: 'Staff Related',
    subcategories: ['TEACHER', 'ADMIN', 'SUPPORT_STAFF', 'OTHER']
  },
  FACILITIES: {
    key: 'FACILITIES',
    label: 'Facilities',
    subcategories: ['CLASSROOM', 'LAB', 'PLAYGROUND', 'SANITATION', 'OTHER']
  },
  MANAGEMENT: {
    key: 'MANAGEMENT',
    label: 'Management',
    subcategories: ['PRINCIPAL', 'ADMINISTRATION', 'FEES', 'POLICY', 'OTHER']
  }
};

const SUBCATEGORY_LABELS = {
  TEACHER: 'Teacher Issue',
  ADMIN: 'Admin Staff Issue',
  SUPPORT_STAFF: 'Support Staff Issue',
  CLASSROOM: 'Classroom Issue',
  LAB: 'Laboratory Issue',
  PLAYGROUND: 'Playground Issue',
  SANITATION: 'Sanitation/Hygiene Issue',
  PRINCIPAL: 'Principal Office',
  ADMINISTRATION: 'Administration',
  FEES: 'Fee Related',
  POLICY: 'School Policy',
  OTHER: 'Other'
};

const SOURCE_OPTIONS = ['PARENT_APP', 'STUDENT_APP', 'TEACHER_APP', 'WALK_IN', 'PHONE', 'EMAIL'];

const FeedbacksList = forwardRef((props, ref) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    try {
      const submitData = {
        ...formData,
        category: formData.category && formData.subcategory
          ? `${formData.category}_${formData.subcategory}`
          : formData.category,
      };

      if (editingId) {
        await frontDeskApi.updateFeedback(editingId, submitData);
        toast.success('Feedback updated successfully');
      } else {
        await frontDeskApi.createFeedback(submitData);
        toast.success('Feedback created successfully');
      }

      if (formData.assignAsTask && formData.assignedStaff) {
        // TODO: Create task from feedback
        toast.info('Task creation feature coming soon');
      }

      if (formData.shareWithStaff?.length > 0) {
        // TODO: Share via internal messaging
        toast.info('Share feature coming soon');
      }

      onClose();
      resetForm();
      loadFeedbacks();
    } catch (error) {
      toast.error('Failed to save feedback');
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

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <Chip size="sm" variant="flat" color="primary">Parent App</Chip>
          <Chip size="sm" variant="flat" color="secondary">Student App</Chip>
          <Chip size="sm" variant="flat" color="success">Teacher App</Chip>
          <span className="text-xs text-default-400 ml-2">Feedbacks from apps sync automatically</span>
        </div>
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
          <TableColumn>SOURCE</TableColumn>
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
              <TableCell className="font-medium">{feedback.name}</TableCell>
              <TableCell>{feedback.phoneNumber || '-'}</TableCell>
              <TableCell>{feedback.date}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">{getCategoryLabel(feedback.category)}</Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color="default">{getSourceLabel(feedback.source)}</Chip>
              </TableCell>
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

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Feedback' : 'New Feedback'}</ModalHeader>
          <ModalBody>
            <Tabs>
              <Tab key="basic" title="Basic Info">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Name"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    isRequired
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                    startContent={<MessageSquare size={14} />}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phoneNumber: val });
                      if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                    }}
                    maxLength={10}
                    isInvalid={!!errors.phoneNumber}
                    errorMessage={errors.phoneNumber}
                  />
                  <Select
                    label="Category"
                    placeholder="Select category"
                    selectedKeys={formData.category ? [formData.category] : []}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value, subcategory: '' });
                      if (errors.category) setErrors({ ...errors, category: '' });
                    }}
                    isRequired
                    isInvalid={!!errors.category}
                    errorMessage={errors.category}
                  >
                    {Object.values(FEEDBACK_CATEGORIES).map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                  {formData.category && (
                    <Select
                      label="Subcategory"
                      placeholder="Select subcategory"
                      selectedKeys={formData.subcategory ? [formData.subcategory] : []}
                      onChange={(e) => {
                        setFormData({ ...formData, subcategory: e.target.value });
                        if (errors.subcategory) setErrors({ ...errors, subcategory: '' });
                      }}
                      isRequired
                      isInvalid={!!errors.subcategory}
                      errorMessage={errors.subcategory}
                    >
                      {FEEDBACK_CATEGORIES[formData.category]?.subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {SUBCATEGORY_LABELS[sub] || sub}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                  <Select
                    label="Source"
                    placeholder="Select source"
                    selectedKeys={[formData.source]}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    {SOURCE_OPTIONS.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace(/_/g, ' ')}
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
                    <SelectItem key="in_progress" value="in_progress">In Progress</SelectItem>
                    <SelectItem key="resolved" value="resolved">Resolved</SelectItem>
                    <SelectItem key="closed" value="closed">Closed</SelectItem>
                  </Select>
                </div>
              </Tab>
              <Tab key="assignment" title="Assignment">
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <Select
                    label="Assigned Staff"
                    placeholder="Select staff member"
                    selectedKeys={formData.assignedStaff ? [formData.assignedStaff] : []}
                    onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
                  >
                    {staff.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))}
                  </Select>
                  <Checkbox size="sm"
                    isSelected={formData.notifyStaff}
                    onValueChange={(value) => setFormData({ ...formData, notifyStaff: value })}
                  >
                    Notify Assigned Staff
                  </Checkbox>
                  <Checkbox size="sm"
                    isSelected={formData.assignAsTask}
                    onValueChange={(value) => setFormData({ ...formData, assignAsTask: value })}
                  >
                    Assign as Task (Creates a task for the staff member)
                  </Checkbox>
                  {formData.assignAsTask && (
                    <>
                      <Input
                        label="Task Title"
                        placeholder="Enter task title"
                        value={formData.taskTitle}
                        onChange={(e) => {
                          setFormData({ ...formData, taskTitle: e.target.value });
                          if (errors.taskTitle) setErrors({ ...errors, taskTitle: '' });
                        }}
                        isRequired={formData.assignAsTask}
                        isInvalid={!!errors.taskTitle}
                        errorMessage={errors.taskTitle}
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
                    </>
                  )}
                  <Textarea
                    label="Notes"
                    placeholder="Enter feedback details"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                  <div className="bg-secondary-50 border border-secondary-200 p-3 rounded-lg">
                    <p className="text-sm text-secondary-700">📤 Share to Internal Messaging</p>
                    <p className="text-xs text-secondary-600 mt-1">Feature coming soon - share feedback with multiple staff members via internal messaging</p>
                  </div>
                </div>
              </Tab>
            </Tabs>
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
