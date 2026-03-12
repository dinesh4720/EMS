import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem,
  Chip, useDisclosure, Textarea, Checkbox, Tabs, Tab, Button
} from '@heroui/react';
import { Edit, Trash2, Eye, Plus, History } from 'lucide-react';
import { frontDeskApi, staffApi, classesApi } from '../../services/api';
import FormInput from '../../components/FormInput';
import { validatePhone, validateEmail, validateFutureDate } from '../../utils/validations';
import toast from 'react-hot-toast';
import AdmissionTracker from './AdmissionTracker.jsx';

const STATUS_OPTIONS = [
  { value: 'inquiry-logged', label: 'Inquiry Logged', color: 'default' },
  { value: 'form-sent', label: 'Form Sent', color: 'primary' },
  { value: 'form-submitted', label: 'Form Submitted', color: 'secondary' },
  { value: 'documents-verified', label: 'Documents Verified', color: 'success' },
  { value: 'test-scheduled', label: 'Test Scheduled', color: 'warning' },
  { value: 'test-cleared', label: 'Test Cleared', color: 'success' },
  { value: 'test-failed', label: 'Test Failed', color: 'danger' },
  { value: 'test-no-show', label: 'Test No Show', color: 'danger' },
  { value: 'admission-approved', label: 'Admission Approved', color: 'success' },
  { value: 'admission-rejected', label: 'Admission Rejected', color: 'danger' },
  { value: 'fee-paid', label: 'Fee Paid', color: 'success' },
  { value: 'student-admitted', label: 'Student Admitted', color: 'success' },
];

const SOURCE_OPTIONS = ['walk-in', 'call', 'website', 'reference'];

const HSC_GROUPS = ['BIOLOGY', 'COMPUTER_SCIENCE', 'COMMERCE'];

const PAYMENT_MODES = ['CASH', 'ONLINE', 'CHEQUE', 'INCLUDED_IN_FORM'];

const AdmissionsList = forwardRef((props, ref) => {
  const [admissions, setAdmissions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isTrackerOpen, onOpen: onTrackerOpen, onClose: onTrackerClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [selectedAdmissionForTracker, setSelectedAdmissionForTracker] = useState(null);
  const [formData, setFormData] = useState({
    studentName: '',
    dateOfBirth: '',
    parentName: '',
    phoneNumber: '',
    email: '',
    classApplyingFor: '',
    hscGroup: '',
    assessmentRequired: false,
    assignedTeacher: '',
    testDate: '',
    testTime: '',
    testResult: 'pending',
    source: 'walk-in',
    status: 'inquiry-logged',
    admissionDecision: 'pending',
    decisionRemarks: '',
    paymentStatus: 'unpaid',
    paymentMode: '',
    paymentAmount: '',
    paymentDate: '',
    transactionId: '',
  });

  useEffect(() => {
    loadAdmissions();
    loadStaff();
    loadClasses();
  }, []);

  // Expose the openModal function to parent
  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetForm();
      onOpen();
    }
  }));

  const loadAdmissions = async () => {
    try {
      const response = await frontDeskApi.getAdmissions();
      setAdmissions(response);
    } catch (error) {
      console.error('Failed to load admissions:', error);
      toast.error('Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll();
      setStaff(response.filter(s => s.role === 'Teacher'));
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classesApi.getAll();
      if (Array.isArray(response)) {
        // Extract unique class names (ignoring sections)
        const uniqueNames = [...new Set(response.map(c => c.name.replace('Class ', '')))].sort();
        setAvailableClasses(uniqueNames);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    } else if (!nameRegex.test(formData.studentName)) {
      newErrors.studentName = 'Student name should contain only letters';
    }

    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Parent name is required';
    } else if (!nameRegex.test(formData.parentName)) {
      newErrors.parentName = 'Parent name should contain only letters';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber) || /^(\d)\1{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.classApplyingFor) {
      newErrors.classApplyingFor = 'Please enter a class';
    }
    if (formData.assessmentRequired) {
      if (!formData.assignedTeacher) {
        newErrors.assignedTeacher = 'Please assign a teacher';
      }
      if (formData.testDate && !validateFutureDate(formData.testDate)) {
        newErrors.testDate = 'Test date must be in the future';
      }
    }

    setErrors(newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (name, value) => {
    let error = '';
    const nameRegex = /^[a-zA-Z\s]*$/;

    switch (name) {
      case 'studentName':
        if (!value.trim()) error = 'Student name is required';
        else if (!nameRegex.test(value)) error = 'Student name should contain only letters';
        break;
      case 'parentName':
        if (!value.trim()) error = 'Parent name is required';
        else if (!nameRegex.test(value)) error = 'Parent name should contain only letters';
        break;
      case 'phoneNumber':
        if (!value) error = 'Phone number is required';
        else if (!validatePhone(value) || /^(\d)\1{9}$/.test(value)) error = 'Please enter a valid 10-digit phone number';
        break;
      case 'email':
        if (value && !validateEmail(value)) error = 'Invalid email address';
        break;
      case 'classApplyingFor':
        if (!value) error = 'Please enter a class';
        break;
      case 'assignedTeacher':
        if (formData.assessmentRequired && !value) error = 'Please assign a teacher';
        break;
      case 'testDate':
        if (formData.assessmentRequired && value && !validateFutureDate(value)) error = 'Test date must be in the future';
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
      // Clean up data before sending - remove assignedTeacher if not required
      const dataToSend = { ...formData };
      if (!dataToSend.assessmentRequired) {
        dataToSend.assignedTeacher = null;
      }

      if (editingId) {
        await frontDeskApi.updateAdmission(editingId, dataToSend);
        toast.success('Admission updated successfully');
      } else {
        await frontDeskApi.createAdmission(dataToSend);
        toast.success('Admission inquiry created successfully');
      }
      onClose();
      resetForm();
      loadAdmissions();
    } catch (error) {
      toast.error('Failed to save admission');
    }
  };

  const handleEdit = (admission) => {
    setEditingId(admission._id);
    setFormData({
      studentName: admission.studentName,
      dateOfBirth: admission.dateOfBirth || '',
      parentName: admission.parentName || '',
      phoneNumber: admission.phoneNumber || '',
      email: admission.email || '',
      classApplyingFor: admission.classApplyingFor || '',
      hscGroup: admission.hscGroup || '',
      assessmentRequired: admission.assessmentRequired || false,
      assignedTeacher: admission.assignedTeacher?._id || '',
      testDate: admission.testDate || '',
      testTime: admission.testTime || '',
      testResult: admission.testResult || 'pending',
      source: admission.source || 'walk-in',
      status: admission.status || 'inquiry-logged',
      admissionDecision: admission.admissionDecision || 'pending',
      decisionRemarks: admission.decisionRemarks || '',
      paymentStatus: admission.paymentStatus || 'unpaid',
      paymentMode: admission.paymentMode || '',
      paymentAmount: admission.paymentAmount || '',
      paymentDate: admission.paymentDate || '',
      transactionId: admission.transactionId || '',
    });
    onOpen();
  };

  const handleView = (admission) => {
    setSelectedAdmission(admission);
    onDetailOpen();
  };

  const handleTracker = (admission) => {
    setSelectedAdmissionForTracker(admission);
    onTrackerOpen();
  };

  const handleConvertToStudent = async (admissionId) => {
    try {
      const response = await fetch(`/api/front-desk/admissions/${admissionId}/convert-to-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Student created successfully!');
        loadAdmissions();
        onClose(); // Close modal after successful conversion
      } else {
        toast.error(data.error || 'Failed to convert to student');
      }
    } catch (error) {
      toast.error('Failed to convert to student');
    }
  };

  const handleSendFormLink = async () => {
    // Get the current admission data based on whether we're editing or viewing
    const admissionData = editingId
      ? admissions.find(a => a._id === editingId)
      : null;

    if (!admissionData && (!formData.phoneNumber && !formData.email)) {
      toast.error('Please add phone number or email to send form link');
      return;
    }

    const contactInfo = admissionData?.phoneNumber || formData.phoneNumber;
    const contactMethod = formData.email ? 'email' : 'phone';

    // Simulate sending the form link (in real implementation, this would call an API)
    toast.success(`Admission form link sent via ${contactMethod} to ${contactInfo}`, {
      duration: 3000,
      icon: '📧'
    });

    // Update status to form-sent if not already sent
    if (formData.status === 'inquiry-logged' || formData.status === 'form-sent') {
      const updatedData = { ...formData, status: 'form-sent' };
      if (editingId) {
        try {
          await frontDeskApi.updateAdmission(editingId, updatedData);
          loadAdmissions();
        } catch (error) {
          toast.error('Failed to update admission status');
        }
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this admission inquiry?')) return;
    try {
      await frontDeskApi.deleteAdmission(id);
      toast.success('Admission inquiry deleted');
      loadAdmissions();
    } catch (error) {
      toast.error('Failed to delete admission inquiry');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setFormData({
      studentName: '',
      dateOfBirth: '',
      parentName: '',
      phoneNumber: '',
      email: '',
      classApplyingFor: '',
      hscGroup: '',
      assessmentRequired: false,
      assignedTeacher: '',
      testDate: '',
      testTime: '',
      testResult: 'pending',
      source: 'walk-in',
      status: 'inquiry-logged',
      admissionDecision: 'pending',
      decisionRemarks: '',
      paymentStatus: 'unpaid',
      paymentMode: '',
      paymentAmount: '',
      paymentDate: '',
      transactionId: '',
    });
  };

  const getStatusColor = (status) => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => {
            resetForm();
            onOpen();
          }}
        >
          New Admission Inquiry
        </Button>
      </div>
      <Table aria-label="Admissions table" removeWrapper>
        <TableHeader>
          <TableColumn>STUDENT NAME</TableColumn>
          <TableColumn>PARENT NAME</TableColumn>
          <TableColumn>PHONE</TableColumn>
          <TableColumn>CLASS</TableColumn>
          <TableColumn>SOURCE</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>PAYMENT</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          items={admissions}
          isLoading={loading}
          emptyContent="No admission inquiries"
        >
          {(admission) => (
            <TableRow key={admission._id}>
              <TableCell>{admission.studentName}</TableCell>
              <TableCell>{admission.parentName || '-'}</TableCell>
              <TableCell>{admission.phoneNumber || '-'}</TableCell>
              <TableCell>{admission.classApplyingFor || '-'}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">{admission.source}</Chip>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={getStatusColor(admission.status)}
                  variant="flat"
                >
                  {STATUS_OPTIONS.find(s => s.value === admission.status)?.label || admission.status}
                </Chip>
              </TableCell>
              <TableCell>
                {admission.paymentStatus === 'paid' ? (
                  <Chip size="sm" color="success" variant="flat">
                    Paid ({admission.paymentMode || 'N/A'})
                  </Chip>
                ) : (
                  <Chip size="sm" color="warning" variant="flat">
                    Unpaid
                  </Chip>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="secondary"
                    variant="light"
                    isIconOnly
                    onPress={() => handleTracker(admission)}
                  >
                    <History size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    isIconOnly
                    onPress={() => handleView(admission)}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="warning"
                    variant="light"
                    isIconOnly
                    onPress={() => handleEdit(admission)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    isIconOnly
                    onPress={() => handleDelete(admission._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Admission' : 'New Admission Inquiry'}</ModalHeader>
          <ModalBody>
            <Tabs>
              <Tab key="basic" title="Basic Info">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormInput
                    label="Student Name"
                    placeholder="Enter student name"
                    value={formData.studentName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, studentName: val }));
                      validateField('studentName', val);
                    }}
                    required
                    error={errors.studentName}
                  />
                  <FormInput
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    max={`${new Date().getFullYear() - 1}-12-31`}
                  />
                  <FormInput
                    label="Parent/Guardian Name"
                    placeholder="Enter parent name"
                    value={formData.parentName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, parentName: val }));
                      validateField('parentName', val);
                    }}
                    required
                    error={errors.parentName}
                  />
                  <FormInput
                    label="Phone Number"
                    placeholder="Enter 10-digit phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // Allow only numbers
                      setFormData(prev => ({ ...prev, phoneNumber: val }));
                      validateField('phoneNumber', val);
                    }}
                    maxLength={10}
                    required
                    error={errors.phoneNumber}
                  />
                  <FormInput
                    label="Email"
                    type="email"
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
                    label="Class Applying For"
                    placeholder="Select Class"
                    selectedKeys={formData.classApplyingFor ? [formData.classApplyingFor] : []}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, classApplyingFor: val }));
                      validateField('classApplyingFor', val);
                    }}
                    isRequired
                    isInvalid={!!errors.classApplyingFor}
                    errorMessage={errors.classApplyingFor}
                  >
                    {availableClasses.length > 0 ? (
                      availableClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          Class {cls}
                        </SelectItem>
                      ))
                    ) : (
                      // Fallback if no classes loaded
                      ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {isNaN(cls) ? cls : `Class ${cls}`}
                        </SelectItem>
                      ))
                    )}
                  </Select>
                  {(formData.classApplyingFor?.toLowerCase().includes('hsc') || formData.classApplyingFor?.toLowerCase().includes('12') || formData.classApplyingFor?.toLowerCase().includes('11') || formData.classApplyingFor?.toLowerCase().includes('10+2')) && (
                    <Select
                      label="HSC Group (Optional)"
                      placeholder="Select group if applicable"
                      selectedKeys={formData.hscGroup ? [formData.hscGroup] : []}
                      onChange={(e) => setFormData({ ...formData, hscGroup: e.target.value })}
                    >
                      {HSC_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group.replace(/_/g, ' ')}
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
                        {source}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Status"
                    placeholder="Select status"
                    selectedKeys={[formData.status]}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </Tab>
              <Tab key="assessment" title="Assessment">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Checkbox size="sm"
                    isSelected={formData.assessmentRequired}
                    onValueChange={(value) => setFormData({ ...formData, assessmentRequired: value })}
                    className="col-span-2"
                  >
                    Assessment Required
                  </Checkbox>
                  {formData.assessmentRequired && (
                    <>
                      <Select
                        label="Assign To (Teacher)"
                        placeholder="Select teacher"
                        selectedKeys={formData.assignedTeacher ? [formData.assignedTeacher] : []}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, assignedTeacher: val }));
                          validateField('assignedTeacher', val);
                        }}
                        isRequired
                        isInvalid={!!errors.assignedTeacher}
                        errorMessage={errors.assignedTeacher}
                      >
                        {staff.map((teacher) => (
                          <SelectItem key={teacher._id} value={teacher._id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </Select>
                      <FormInput
                        label="Test Date"
                        type="date"
                        value={formData.testDate}
                        onChange={(e) => {
                          setFormData({ ...formData, testDate: e.target.value });
                          if (errors.testDate) setErrors({ ...errors, testDate: '' });
                        }}
                        error={errors.testDate}
                        max="9999-12-31"
                      />
                      <FormInput
                        label="Test Time"
                        type="time"
                        value={formData.testTime}
                        onChange={(e) => setFormData({ ...formData, testTime: e.target.value })}
                      />
                      <Select
                        label="Test Result"
                        placeholder="Select result"
                        selectedKeys={[formData.testResult]}
                        onChange={(e) => setFormData({ ...formData, testResult: e.target.value })}
                      >
                        <SelectItem key="pending" value="pending">Pending</SelectItem>
                        <SelectItem key="cleared" value="cleared">Cleared</SelectItem>
                        <SelectItem key="failed" value="failed">Failed</SelectItem>
                      </Select>
                    </>
                  )}
                </div>
              </Tab>
              <Tab key="decision" title="Decision">
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <Select
                    label="Admission Decision"
                    placeholder="Select decision"
                    selectedKeys={[formData.admissionDecision]}
                    onChange={(e) => setFormData({ ...formData, admissionDecision: e.target.value })}
                  >
                    <SelectItem key="pending" value="pending">Pending</SelectItem>
                    <SelectItem key="approved" value="approved">Approved</SelectItem>
                    <SelectItem key="rejected" value="rejected">Rejected</SelectItem>
                  </Select>
                  <Textarea
                    label="Decision Remarks"
                    placeholder="Enter remarks (optional)"
                    value={formData.decisionRemarks}
                    onChange={(e) => setFormData({ ...formData, decisionRemarks: e.target.value })}
                    rows={4}
                  />
                </div>
              </Tab>
              <Tab key="payment" title="Payment">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Select
                    label="Payment Status"
                    placeholder="Select payment status"
                    selectedKeys={[formData.paymentStatus]}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="col-span-2"
                  >
                    <SelectItem key="unpaid" value="unpaid">Unpaid</SelectItem>
                    <SelectItem key="paid" value="paid">Paid</SelectItem>
                    <SelectItem key="pending" value="pending">Pending</SelectItem>
                  </Select>
                  {formData.paymentStatus === 'paid' && (
                    <>
                      <Select
                        label="Payment Mode"
                        placeholder="Select payment mode"
                        selectedKeys={formData.paymentMode ? [formData.paymentMode] : []}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      >
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </Select>
                      <FormInput
                        label="Payment Amount"
                        placeholder="Enter amount"
                        value={formData.paymentAmount}
                        onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                        type="number"
                      />
                      <FormInput
                        label="Payment Date"
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        max={new Date().toLocaleDateString('en-CA')}
                      />
                      <FormInput
                        label="Transaction ID"
                        placeholder="Enter transaction ID"
                        value={formData.transactionId}
                        onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      />
                    </>
                  )}
                  {formData.paymentStatus === 'unpaid' && (
                    <div className="col-span-2 bg-warning-50 border border-warning-200 p-3 rounded-lg">
                      <p className="text-sm text-warning-700">⚠️ Payment Pending</p>
                      <p className="text-xs text-warning-600 mt-1">Send payment link or collect payment when admission is confirmed</p>
                    </div>
                  )}
                </div>
              </Tab>
              <Tab key="actions" title="Actions">
                <div className="space-y-4 mt-4">
                  <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg">
                    <p className="text-sm font-medium text-primary-700 mb-2">📧 Send Admission Form Link</p>
                    <p className="text-xs text-primary-600 mb-3">Send the admission form link to parent's email/phone</p>
                    <Button color="primary" size="sm" onPress={handleSendFormLink}>
                      Send Form Link
                    </Button>
                  </div>
                  {formData.status === 'admission-approved' || formData.status === 'fee-paid' ? (
                    <div className="bg-success-50 border border-success-200 p-4 rounded-lg">
                      <p className="text-sm font-medium text-success-700 mb-2">🎓 Add as Student</p>
                      <p className="text-xs text-success-600 mb-3">Convert this admission inquiry to a student record</p>
                      <Button color="success" size="sm" onPress={() => handleConvertToStudent(editingId)}>
                        Add as New Student
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-default-100 border border-default-200 p-4 rounded-lg">
                      <p className="text-sm font-medium text-default-500 mb-2">🎓 Add as Student</p>
                      <p className="text-xs text-default-400 mb-3">Admission must be approved and fee paid before adding as student</p>
                      <Button color="default" size="sm" isDisabled>
                        Add as New Student
                      </Button>
                    </div>
                  )}
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

      {/* Detail View Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="2xl">
        <ModalContent>
          <ModalHeader>Admission Details</ModalHeader>
          <ModalBody>
            {selectedAdmission && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">Student Name</p>
                    <p className="font-medium">{selectedAdmission.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Date of Birth</p>
                    <p className="font-medium">{selectedAdmission.dateOfBirth || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Parent Name</p>
                    <p className="font-medium">{selectedAdmission.parentName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Phone</p>
                    <p className="font-medium">{selectedAdmission.phoneNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Email</p>
                    <p className="font-medium">{selectedAdmission.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Class Applying For</p>
                    <p className="font-medium">{selectedAdmission.classApplyingFor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Source</p>
                    <Chip size="sm" variant="flat">{selectedAdmission.source}</Chip>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Status</p>
                    <Chip size="sm" color={getStatusColor(selectedAdmission.status)} variant="flat">
                      {STATUS_OPTIONS.find(s => s.value === selectedAdmission.status)?.label}
                    </Chip>
                  </div>
                  {selectedAdmission.assessmentRequired && (
                    <>
                      <div>
                        <p className="text-sm text-default-500">Assigned Teacher</p>
                        <p className="font-medium">{selectedAdmission.assignedTeacher?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Test Date & Time</p>
                        <p className="font-medium">
                          {selectedAdmission.testDate && selectedAdmission.testTime
                            ? `${selectedAdmission.testDate} ${selectedAdmission.testTime}`
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Test Result</p>
                        <Chip size="sm" color={selectedAdmission.testResult === 'cleared' ? 'success' : 'default'}>
                          {selectedAdmission.testResult}
                        </Chip>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-default-500">Admission Decision</p>
                    <Chip
                      size="sm"
                      color={
                        selectedAdmission.admissionDecision === 'approved'
                          ? 'success'
                          : selectedAdmission.admissionDecision === 'rejected'
                            ? 'danger'
                            : 'default'
                      }
                    >
                      {selectedAdmission.admissionDecision}
                    </Chip>
                  </div>
                  {selectedAdmission.decisionRemarks && (
                    <div className="col-span-2">
                      <p className="text-sm text-default-500">Decision Remarks</p>
                      <p className="font-medium">{selectedAdmission.decisionRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDetailClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AdmissionTracker
        admission={selectedAdmissionForTracker}
        isOpen={isTrackerOpen}
        onClose={onTrackerClose}
      />
    </>
  );
});

AdmissionsList.displayName = 'AdmissionsList';

export default AdmissionsList;
