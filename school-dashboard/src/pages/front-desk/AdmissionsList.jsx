import { useState, useEffect } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem,
  Chip, useDisclosure, Textarea, Checkbox, Tabs, Tab, Button
} from '@heroui/react';
import { Edit, Trash2, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

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

export default function AdmissionsList() {
  const [admissions, setAdmissions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [formData, setFormData] = useState({
    studentName: '',
    dateOfBirth: '',
    parentName: '',
    phoneNumber: '',
    email: '',
    classApplyingFor: '',
    assessmentRequired: false,
    assignedTeacher: '',
    testDate: '',
    testTime: '',
    testResult: 'pending',
    source: 'walk-in',
    status: 'inquiry-logged',
    admissionDecision: 'pending',
    decisionRemarks: '',
  });

  useEffect(() => {
    loadAdmissions();
    loadStaff();
  }, []);

  const loadAdmissions = async () => {
    try {
      const response = await api.get('/front-desk/admissions');
      setAdmissions(response.data);
    } catch (error) {
      toast.error('Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaff(response.data.filter(s => s.role === 'Teacher'));
    } catch (error) {
      console.error('Failed to load staff');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/front-desk/admissions/${editingId}`, formData);
        toast.success('Admission updated successfully');
      } else {
        await api.post('/front-desk/admissions', formData);
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
      assessmentRequired: admission.assessmentRequired || false,
      assignedTeacher: admission.assignedTeacher?._id || '',
      testDate: admission.testDate || '',
      testTime: admission.testTime || '',
      testResult: admission.testResult || 'pending',
      source: admission.source || 'walk-in',
      status: admission.status || 'inquiry-logged',
      admissionDecision: admission.admissionDecision || 'pending',
      decisionRemarks: admission.decisionRemarks || '',
    });
    onOpen();
  };

  const handleView = (admission) => {
    setSelectedAdmission(admission);
    onDetailOpen();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this admission inquiry?')) return;
    try {
      await api.delete(`/front-desk/admissions/${id}`);
      toast.success('Admission inquiry deleted');
      loadAdmissions();
    } catch (error) {
      toast.error('Failed to delete admission inquiry');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      studentName: '',
      dateOfBirth: '',
      parentName: '',
      phoneNumber: '',
      email: '',
      classApplyingFor: '',
      assessmentRequired: false,
      assignedTeacher: '',
      testDate: '',
      testTime: '',
      testResult: 'pending',
      source: 'walk-in',
      status: 'inquiry-logged',
      admissionDecision: 'pending',
      decisionRemarks: '',
    });
  };

  const getStatusColor = (status) => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status);
    return statusObj?.color || 'default';
  };

  return (
    <>
      <Table aria-label="Admissions table" removeWrapper>
            <TableHeader>
              <TableColumn>STUDENT NAME</TableColumn>
              <TableColumn>PARENT NAME</TableColumn>
              <TableColumn>PHONE</TableColumn>
              <TableColumn>CLASS</TableColumn>
              <TableColumn>SOURCE</TableColumn>
              <TableColumn>STATUS</TableColumn>
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
                    <div className="flex gap-2">
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
                  <Input
                    label="Student Name"
                    placeholder="Enter student name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    isRequired
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                  <Input
                    label="Parent/Guardian Name"
                    placeholder="Enter parent name"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <Input
                    label="Class Applying For"
                    placeholder="e.g., Class 5"
                    value={formData.classApplyingFor}
                    onChange={(e) => setFormData({ ...formData, classApplyingFor: e.target.value })}
                  />
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
                  <Checkbox
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
                        onChange={(e) => setFormData({ ...formData, assignedTeacher: e.target.value })}
                      >
                        {staff.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        label="Test Date"
                        type="date"
                        value={formData.testDate}
                        onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                      />
                      <Input
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
    </>
  );
}
