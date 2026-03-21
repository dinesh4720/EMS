import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Chip, useDisclosure, Button,
  Select, SelectItem, Textarea
} from '@heroui/react';
import { LogOut, Trash2, Plus, Edit, Search } from 'lucide-react';
import { frontDeskApi, studentsApi } from '../../services/api';
import FormInput from '../../components/FormInput';
import { validatePhone, validateRequired } from '../../utils/validations';
import toast from 'react-hot-toast';

const VISITOR_REASONS = [
  { key: 'PARENT_MEETING', label: 'Parent Meeting', needsGatePass: true, needsAppointment: false, needsStudentMapping: true },
  { key: 'STUDENT_PICKUP_DROP_OFF', label: 'Student Pickup/Drop-off', needsGatePass: true, needsAppointment: false, needsStudentMapping: true },
  { key: 'SCHOOL_VISIT_INQUIRY', label: 'School Visit/Inquiry', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
  { key: 'DELIVERY_VENDOR', label: 'Delivery/Vendor', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
  { key: 'OFFICIAL_BUSINESS', label: 'Official Business', needsGatePass: false, needsAppointment: true, needsStudentMapping: false },
  { key: 'VOLUNTEER_EVENT', label: 'Volunteer/Event', needsGatePass: false, needsAppointment: true, needsStudentMapping: false },
  { key: 'OTHER', label: 'Other', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
];

const VisitorLog = forwardRef((props, ref) => {
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentLookupQuery, setStudentLookupQuery] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    phoneNumber: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toTimeString().slice(0, 5),
    reasonForVisit: '',
    concernedPerson: '',
    studentId: '',
    studentName: '',
    parentMapping: false,
    gatePassRequired: false,
    appointmentRequired: false,
    otherPurpose: '',
    companyName: '',
    deliveryPerson: '',
    notes: '',
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
    loadStudents();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (formData.reasonForVisit !== 'PARENT_MEETING' && formData.reasonForVisit !== 'STUDENT_PICKUP_DROP_OFF') {
      return;
    }

    const timeoutId = setTimeout(() => {
      loadStudents(studentLookupQuery);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [formData.reasonForVisit, isOpen, studentLookupQuery]);

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

  const loadStudents = async (query = '') => {
    try {
      setStudentsLoading(true);
      const response = await studentsApi.list({
        page: 1,
        limit: 20,
        status: 'active',
        search: query || undefined,
      });
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setStudentsLoading(false);
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

    if (!formData.reasonForVisit) {
      newErrors.reasonForVisit = 'Reason is required';
    }

    if (formData.reasonForVisit === 'OTHER' && !formData.otherPurpose?.trim()) {
      newErrors.otherPurpose = 'Please specify the purpose';
    }

    if (formData.reasonForVisit === 'DELIVERY_VENDOR' && !formData.companyName?.trim()) {
      newErrors.companyName = 'Company name is required for delivery/vendor';
    }

    setErrors(newErrors);
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
      case 'email':
        if (value && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) error = 'Invalid email address';
        break;
      case 'reasonForVisit':
        if (!value) error = 'Reason is required';
        break;
      case 'otherPurpose':
        if (formData.reasonForVisit === 'OTHER' && !value.trim()) error = 'Please specify the purpose';
        break;
      case 'companyName':
        if (formData.reasonForVisit === 'DELIVERY_VENDOR' && !value.trim()) error = 'Company name is required';
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
      const submitData = {
        ...formData,
        reason: formData.reasonForVisit === 'OTHER' ? formData.otherPurpose : formData.reasonForVisit,
      };

      if (editingId) {
        await frontDeskApi.updateVisitor(editingId, submitData);
        toast.success('Visitor updated successfully');
      } else {
        await frontDeskApi.createVisitor(submitData);
        toast.success('Visitor checked in successfully');
      }
      onClose();
      resetForm();
      loadVisitors();
    } catch (error) {
      toast.error('Failed to save visitor');
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

  const handleEdit = (visitor) => {
    if (!visitor) return; // Null check
    setEditingId(visitor._id);
    setStudentLookupQuery(visitor.studentName || '');
    setFormData({
      visitorName: visitor.visitorName || '',
      phoneNumber: visitor.phoneNumber || '',
      email: visitor.email || '',
      date: visitor.date || new Date().toISOString().split('T')[0],
      checkInTime: visitor.checkInTime || new Date().toTimeString().slice(0, 5),
      reasonForVisit: visitor.reasonForVisit || '',
      concernedPerson: visitor.concernedPerson || '',
      studentId: visitor.studentId || '',
      studentName: visitor.studentName || '',
      parentMapping: visitor.parentMapping || false,
      gatePassRequired: visitor.gatePassRequired || false,
      appointmentRequired: visitor.appointmentRequired || false,
      otherPurpose: visitor.otherPurpose || '',
      companyName: visitor.companyName || '',
      deliveryPerson: visitor.deliveryPerson || '',
      notes: visitor.notes || '',
    });

    if (visitor.studentId && !students.some(s => String(s._id || s.id) === String(visitor.studentId))) {
      studentsApi.getById(visitor.studentId)
        .then((student) => {
          if (student) {
            setStudents(prev => {
              if (prev.some(item => String(item._id || item.id) === String(student._id || student.id))) {
                return prev;
              }
              return [student, ...prev];
            });
          }
        })
        .catch(() => {});
    }
    onOpen();
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

  const handleReasonChange = (reason) => {
    const selectedReason = VISITOR_REASONS.find(r => r.key === reason);
    setFormData({
      ...formData,
      reasonForVisit: reason,
      gatePassRequired: selectedReason?.needsGatePass || false,
      appointmentRequired: selectedReason?.needsAppointment || false,
    });
  };

  const handleStudentSelect = (studentId) => {
    const student = students.find(s => String(s._id || s.id) === String(studentId));
    if (student) {
      setFormData({
        ...formData,
        studentId,
        studentName: student.name,
        parentMapping: true,
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setStudentLookupQuery('');
    setFormData({
      visitorName: '',
      phoneNumber: '',
      email: '',
      date: new Date().toISOString().split('T')[0],
      checkInTime: new Date().toTimeString().slice(0, 5),
      reasonForVisit: '',
      concernedPerson: '',
      studentId: '',
      studentName: '',
      parentMapping: false,
      gatePassRequired: false,
      appointmentRequired: false,
      otherPurpose: '',
      companyName: '',
      deliveryPerson: '',
      notes: '',
    });
  };

  const getReasonLabel = (reason) => {
    const found = VISITOR_REASONS.find(r => r.key === reason);
    return found?.label || reason;
  };

  const filteredVisitors = visitors.filter(visitor =>
    (visitor.visitorName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (visitor.phoneNumber?.includes(searchTerm)) ||
    (visitor.concernedPerson?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || []; // Ensure array is never null

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <Input
          placeholder="Search visitors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Search size={16} />}
          className="max-w-xs"
          isClearable
          onClear={() => setSearchTerm('')}
        />
        <Button color="primary" startContent={<Plus size={16} />} onPress={onOpen}>
          Add New Visitor
        </Button>
      </div>
      <Table aria-label="Visitor log table" removeWrapper>
        <TableHeader>
          <TableColumn>VISITOR NAME</TableColumn>
          <TableColumn>PHONE</TableColumn>
          <TableColumn>REASON</TableColumn>
          <TableColumn>CONCERNED PERSON</TableColumn>
          <TableColumn>STUDENT</TableColumn>
          <TableColumn>CHECK IN</TableColumn>
          <TableColumn>CHECK OUT</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          items={filteredVisitors}
          isLoading={loading}
          emptyContent="No visitors today"
        >
          {(visitor) => (
            <TableRow key={visitor._id}>
              <TableCell>{visitor.visitorName}</TableCell>
              <TableCell>{visitor.phoneNumber || '-'}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">{getReasonLabel(visitor.reasonForVisit)}</Chip>
              </TableCell>
              <TableCell>{visitor.concernedPerson || '-'}</TableCell>
              <TableCell>{visitor.studentName || '-'}</TableCell>
              <TableCell>{visitor.checkInTime}</TableCell>
              <TableCell>{visitor.checkOutTime || '-'}</TableCell>
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
                    color="primary"
                    variant="light"
                    isIconOnly
                    onPress={() => handleEdit(visitor)}
                  >
                    <Edit size={14} />
                  </Button>
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

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Visitor' : 'New Visitor'}</ModalHeader>
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
                  setFormData({ ...formData, phoneNumber: val });
                  validateField('phoneNumber', val);
                }}
                maxLength={10}
                error={errors.phoneNumber}
              />
              <FormInput
                label="Email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, email: val }));
                  validateField('email', val);
                }}
                error={errors.email}
              />
              <Select
                label="Reason for Visit"
                placeholder="Select reason"
                selectedKeys={formData.reasonForVisit ? [formData.reasonForVisit] : []}
                onChange={(e) => {
                  handleReasonChange(e.target.value);
                  validateField('reasonForVisit', e.target.value);
                }}
                isRequired
                isInvalid={!!errors.reasonForVisit}
                errorMessage={errors.reasonForVisit}
              >
                {VISITOR_REASONS.map((reason) => (
                  <SelectItem key={reason.key} value={reason.key}>
                    {reason.label}
                  </SelectItem>
                ))}
              </Select>
              {formData.reasonForVisit === 'OTHER' && (
                <FormInput
                  label="Please Specify"
                  placeholder="Enter purpose"
                  value={formData.otherPurpose}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, otherPurpose: val }));
                    validateField('otherPurpose', val);
                  }}
                  required
                  error={errors.otherPurpose}
                  className="col-span-2"
                />
              )}
              {formData.reasonForVisit === 'DELIVERY_VENDOR' && (
                <>
                  <FormInput
                    label="Company Name"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, companyName: val }));
                      validateField('companyName', val);
                    }}
                    required
                    error={errors.companyName}
                  />
                  <FormInput
                    label="Delivery Person"
                    placeholder="Enter delivery person name"
                    value={formData.deliveryPerson}
                    onChange={(e) => setFormData({ ...formData, deliveryPerson: e.target.value })}
                  />
                </>
              )}
              {(formData.reasonForVisit === 'PARENT_MEETING' || formData.reasonForVisit === 'STUDENT_PICKUP_DROP_OFF') && (
                <div className="col-span-2 space-y-3">
                  <Input
                    label="Search Student (Optional)"
                    placeholder="Search by student name, roll no, or admission ID"
                    value={studentLookupQuery}
                    onChange={(e) => setStudentLookupQuery(e.target.value)}
                  />
                  <Select
                    placeholder={studentsLoading ? "Searching students..." : "Select student to auto-fill visitor info"}
                    selectedKeys={formData.studentId ? [String(formData.studentId)] : []}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    isDisabled={studentsLoading}
                    isClearable
                  >
                    {students.map((student) => (
                      <SelectItem key={String(student._id || student.id)} value={String(student._id || student.id)}>
                        {student.name} {student.admissionId ? `(${student.admissionId})` : ''} - Parent: {student.parentName || 'N/A'}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )}
              {formData.studentName && (
                <div className="col-span-2 bg-default-100 p-3 rounded-lg">
                  <p className="text-sm text-default-600">Student: <span className="font-medium">{formData.studentName}</span></p>
                  <p className="text-sm text-default-600">Parent: <span className="font-medium">{students.find(s => String(s._id || s.id) === String(formData.studentId))?.parentName || 'N/A'}</span></p>
                </div>
              )}
              <FormInput
                label="Date"
                type="date"
                value={formData.date}
                readOnly
                className="bg-default-100 cursor-not-allowed"
              />
              <FormInput
                label="Check In Time"
                type="time"
                value={formData.checkInTime}
                readOnly
                className="bg-default-100 cursor-not-allowed"
              />
              <FormInput
                label="Concerned Person"
                placeholder="Person to meet"
                value={formData.concernedPerson}
                onChange={(e) => setFormData({ ...formData, concernedPerson: e.target.value })}
                wrapperClassName="col-span-2"
              />
              {formData.gatePassRequired && (
                <div className="col-span-2 bg-warning-50 border border-warning-200 p-3 rounded-lg">
                  <p className="text-sm text-warning-700">⚠️ Gate Pass Required for this visit type</p>
                </div>
              )}
              {formData.appointmentRequired && (
                <div className="col-span-2 bg-secondary-50 border border-secondary-200 p-3 rounded-lg">
                  <p className="text-sm text-secondary-700">📅 Appointment Required for this visit type</p>
                </div>
              )}
              <Textarea
                label="Notes"
                placeholder="Additional notes (optional)"
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
              {editingId ? 'Update' : 'Check In'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

VisitorLog.displayName = 'VisitorLog';

export default VisitorLog;
