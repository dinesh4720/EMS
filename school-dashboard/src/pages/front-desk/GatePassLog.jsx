import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem,
  Button, Textarea, Autocomplete, AutocompleteItem
} from '@heroui/react';
import { Trash2, Plus, Edit, Download } from 'lucide-react';
import { frontDeskApi, studentsApi, staffApi } from '../../services/api';
import { validatePhone } from '../../utils/validations';
import toast from 'react-hot-toast';
import GatePassPrint from './GatePassPrint.jsx';

const GATE_PASS_REASONS = [
  { key: 'MEDICAL_EMERGENCY', label: 'Medical Emergency' },
  { key: 'FAMILY_EMERGENCY', label: 'Family Emergency' },
  { key: 'SPECIAL_EVENT', label: 'Special Event' },
  { key: 'EARLY_DISMISSAL', label: 'Early Dismissal' },
  { key: 'SUSPENSION_EXPULSION', label: 'Suspension/Expulsion' },
  { key: 'OTHER', label: 'Other' },
];

const LEAVING_WITH_OPTIONS = [
  { key: 'PARENTS', label: 'Parents' },
  { key: 'OTHERS', label: 'Others (Specify Below)' },
];

const APPROVED_BY_OPTIONS = [
  { key: 'CLASS_TEACHER', label: 'Class Teacher' },
  { key: 'FRONT_OFFICE', label: 'Front Office' },
  { key: 'PRINCIPAL', label: 'Principal' },
  { key: 'OTHER', label: 'Other' },
];

const GatePassLog = forwardRef((props, ref) => {
  const [gatePasses, setGatePasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedGatePassForPrint, setSelectedGatePassForPrint] = useState(null);

  // Form state
  const [studentId, setStudentId] = useState(null);
  const [reason, setReason] = useState(null);
  const [otherReason, setOtherReason] = useState('');
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split('T')[0]);
  const [leavingTime, setLeavingTime] = useState(new Date().toTimeString().slice(0, 5));
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [leavingWith, setLeavingWith] = useState(null);
  const [escortName, setEscortName] = useState('');
  const [escortRelation, setEscortRelation] = useState('');
  const [escortPhone, setEscortPhone] = useState('');
  const [approvedBy, setApprovedBy] = useState(null);
  const [approvedByStaffId, setApprovedByStaffId] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load data sequentially to avoid rate limiting
        await loadGatePasses();
        await new Promise(resolve => setTimeout(resolve, 150));

        await loadStudents();
        await new Promise(resolve => setTimeout(resolve, 150));

        await loadStaff();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetForm();
      setIsModalOpen(true);
    }
  }));

  const loadGatePasses = async () => {
    try {
      const response = await frontDeskApi.getGatePassesToday();
      setGatePasses(response);
    } catch (error) {
      console.error('Failed to load gate passes:', error);
      toast.error('Failed to load gate passes');
    }
  };

  const loadStudents = async () => {
    try {
      const response = await studentsApi.getAll();
      setStudents(response);
    } catch (error) {
      console.error('Failed to load students:', error);
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

  const resetForm = () => {
    setStudentId(null);
    setReason(null);
    setOtherReason('');
    setLeavingDate(new Date().toISOString().split('T')[0]);
    setLeavingTime(new Date().toTimeString().slice(0, 5));
    setExpectedReturnDate('');
    setExpectedReturnTime('');
    setLeavingWith(null);
    setEscortName('');
    setEscortRelation('');
    setEscortPhone('');
    setApprovedBy(null);
    setApprovedByStaffId(null);
    setNotes('');
    setEditingId(null);
  };

  const getSelectedStudent = () => {
    if (!studentId || !students) return null;
    return students.find(s => (s._id || s.id) === studentId);
  };

  const getSelectedStaff = () => {
    if (!approvedByStaffId || !staff) return null;
    return staff.find(s => (s._id || s.id) === approvedByStaffId);
  };

  const handleSubmit = async () => {
    try {
      const student = getSelectedStudent();
      const staffMember = getSelectedStaff();

      if (!student) {
        toast.error('Please select a student');
        return;
      }

      if (!reason) {
        toast.error('Please select a reason');
        return;
      }

      if (reason === 'OTHER' && !otherReason) {
        toast.error('Please specify the reason');
        return;
      }

      if (!leavingWith) {
        toast.error('Please select who the student is leaving with');
        return;
      }

      if (leavingWith === 'OTHERS' && !escortName) {
        toast.error('Please enter escort name');
        return;
      }

      if (leavingWith === 'OTHERS' && escortPhone && !validatePhone(escortPhone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }

      if (!approvedBy) {
        toast.error('Please select who approved this gate pass');
        return;
      }

      if (!approvedByStaffId) {
        toast.error('Please select a staff member');
        return;
      }

      const formData = {
        studentId: student._id || student.id,
        studentName: student.name,
        class: student.class || '',
        section: student.section || '',
        reason,
        otherReason: reason === 'OTHER' ? otherReason : '',
        leavingDate,
        leavingTime,
        expectedReturnDate,
        expectedReturnTime,
        leavingWith,
        escortName: leavingWith === 'OTHERS' ? escortName : '',
        escortRelation: leavingWith === 'OTHERS' ? escortRelation : '',
        escortPhone: leavingWith === 'OTHERS' ? escortPhone : '',
        approvedBy,
        approvedByStaffId: staffMember._id || staffMember.id,
        approvedByName: staffMember.name,
        notes,
      };

      if (editingId) {
        await frontDeskApi.updateGatePass(editingId, formData);
        toast.success('Gate pass updated successfully');
      } else {
        await frontDeskApi.createGatePass(formData);
        toast.success('Gate pass issued successfully');
      }

      setIsModalOpen(false);
      resetForm();
      loadGatePasses();
    } catch (error) {
      console.error('Failed to save gate pass:', error);
      toast.error(error.response?.data?.message || 'Failed to save gate pass');
    }
  };

  const handleEdit = (gatePass) => {
    if (!gatePass) return; // Null check
    setEditingId(gatePass._id);
    setStudentId(gatePass.studentId || null);
    setReason(gatePass.reason || null);
    setOtherReason(gatePass.otherReason || '');
    setLeavingDate(gatePass.leavingDate || new Date().toISOString().split('T')[0]);
    setLeavingTime(gatePass.leavingTime || new Date().toTimeString().slice(0, 5));
    setExpectedReturnDate(gatePass.expectedReturnDate || '');
    setExpectedReturnTime(gatePass.expectedReturnTime || '');
    setLeavingWith(gatePass.leavingWith || null);
    setEscortName(gatePass.escortName || '');
    setEscortRelation(gatePass.escortRelation || '');
    setEscortPhone(gatePass.escortPhone || '');
    setApprovedBy(gatePass.approvedBy || null);
    setApprovedByStaffId(gatePass.approvedByStaffId || null);
    setNotes(gatePass.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gate pass?')) return;
    try {
      await frontDeskApi.deleteGatePass(id);
      toast.success('Gate pass deleted');
      loadGatePasses();
    } catch (error) {
      toast.error('Failed to delete gate pass');
    }
  };

  const handleDownload = (gatePass) => {
    setSelectedGatePassForPrint(gatePass);
    setIsPrintModalOpen(true);
  };

  const getReasonLabel = (reason) => {
    const found = GATE_PASS_REASONS.find(r => r.key === reason);
    return found?.label || reason || '-';
  };

  const getApprovedByLabel = (gatePass) => {
    if (gatePass.approvedByName) {
      return `${gatePass.approvedByName} (${gatePass.approvedBy?.replace(/_/g, ' ')})`;
    }
    return gatePass.approvedBy?.replace(/_/g, ' ') || '-';
  };

  const selectedStudent = getSelectedStudent();

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Issue New Gate Pass
        </Button>
      </div>

      <Table aria-label="Gate pass log table" removeWrapper>
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>CLASS</TableColumn>
          <TableColumn>REASON</TableColumn>
          <TableColumn>LEFT WITH</TableColumn>
          <TableColumn>APPROVED BY</TableColumn>
          <TableColumn>DATE & TIME</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          items={gatePasses}
          isLoading={loading}
          emptyContent="No gate passes issued today"
        >
          {(gatePass) => (
            <TableRow key={gatePass._id}>
              <TableCell className="font-medium">{gatePass.studentName || gatePass.personName}</TableCell>
              <TableCell>
                {gatePass.class ? `${gatePass.class}${gatePass.section ? ` - ${gatePass.section}` : ''}` : '-'}
              </TableCell>
              <TableCell>
                <span className="text-sm">{getReasonLabel(gatePass.reason)}</span>
              </TableCell>
              <TableCell>
                {gatePass.leavingWith === 'PARENTS'
                  ? 'Parents'
                  : gatePass.escortName
                    ? `${gatePass.escortName} (${gatePass.escortRelation || 'Other'})`
                    : gatePass.leavingWith || '-'
                }
              </TableCell>
              <TableCell>{getApprovedByLabel(gatePass)}</TableCell>
              <TableCell>
                {gatePass.leavingDate && gatePass.leavingTime
                  ? `${new Date(gatePass.leavingDate).toLocaleDateString()} ${gatePass.leavingTime}`
                  : '-'
                }
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    isIconOnly
                    onPress={() => handleEdit(gatePass)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="default"
                    variant="light"
                    isIconOnly
                    onPress={() => handleDownload(gatePass)}
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    isIconOnly
                    onPress={() => handleDelete(gatePass._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Gate Pass' : 'Issue Gate Pass'}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              {/* Student Selection */}
              <Autocomplete
                label="Select Student"
                placeholder="Search and select student"
                selectedKey={studentId ? String(studentId) : null}
                onSelectionChange={(key) => {
                  setStudentId(key || null);
                }}
                isRequired
                className="col-span-2"
              >
                {students.map((student) => (
                  <AutocompleteItem key={String(student._id || student.id)} textValue={student.name}>
                    {student.name} {student.admissionId ? `(${student.admissionId})` : ''} - {student.class || ''}
                  </AutocompleteItem>
                ))}
              </Autocomplete>

              {/* Selected Student Info */}
              {selectedStudent && (
                <>
                  <div className="col-span-2 bg-default-100 p-3 rounded-lg">
                    <p className="text-sm"><strong>Student:</strong> {selectedStudent.name}</p>
                    <p className="text-sm"><strong>Class:</strong> {selectedStudent.class} {selectedStudent.section ? `- ${selectedStudent.section}` : ''}</p>
                    {selectedStudent.admissionId && (
                      <p className="text-sm"><strong>Admission ID:</strong> {selectedStudent.admissionId}</p>
                    )}
                  </div>

                  {/* Reason */}
                  <Select
                    label="Reason"
                    placeholder="Select reason"
                    selectedKeys={reason ? [reason] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setReason(selected || null);
                    }}
                    isRequired
                  >
                    {GATE_PASS_REASONS.map((r) => (
                      <SelectItem key={r.key} value={r.key}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </Select>

                  {reason === 'OTHER' && (
                    <Input
                      label="Please Specify Reason"
                      placeholder="Enter reason"
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      isRequired
                    />
                  )}

                  {/* Leaving Date & Time */}
                  <Input
                    label="Leaving Date"
                    type="date"
                    value={leavingDate}
                    onChange={(e) => setLeavingDate(e.target.value)}
                    isRequired
                  />
                  <Input
                    label="Leaving Time"
                    type="time"
                    value={leavingTime}
                    onChange={(e) => setLeavingTime(e.target.value)}
                    isRequired
                  />

                  {/* Expected Return */}
                  <Input
                    label="Expected Return Date"
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                  />
                  <Input
                    label="Expected Return Time"
                    type="time"
                    value={expectedReturnTime}
                    onChange={(e) => setExpectedReturnTime(e.target.value)}
                  />

                  {/* Leaving With */}
                  <Select
                    label="Left With"
                    placeholder="Select who is picking up"
                    selectedKeys={leavingWith ? [leavingWith] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setLeavingWith(selected || null);
                    }}
                    isRequired
                  >
                    {LEAVING_WITH_OPTIONS.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>

                  {leavingWith === 'OTHERS' && (
                    <>
                      <Input
                        label="Escort Name"
                        placeholder="Enter escort name"
                        value={escortName}
                        onChange={(e) => setEscortName(e.target.value)}
                        isRequired
                      />
                      <Input
                        label="Escort Relation"
                        placeholder="e.g., Uncle, Aunt, Grandparent"
                        value={escortRelation}
                        onChange={(e) => setEscortRelation(e.target.value)}
                      />
                      <Input
                        label="Escort Phone"
                        placeholder="Enter phone number"
                        value={escortPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setEscortPhone(val);
                        }}
                        maxLength={10}
                      />
                    </>
                  )}

                  {/* Approved By */}
                  <Select
                    label="Approved By"
                    placeholder="Select who approved"
                    selectedKeys={approvedBy ? [approvedBy] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setApprovedBy(selected || null);
                      setApprovedByStaffId(null);
                    }}
                    isRequired
                  >
                    {APPROVED_BY_OPTIONS.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Staff Member */}
                  {approvedBy && (
                    <Autocomplete
                      label={`Select ${approvedBy === 'OTHER' ? 'Staff Member' : approvedBy.toLowerCase()}`}
                      placeholder="Search and select staff member"
                      selectedKey={approvedByStaffId ? String(approvedByStaffId) : null}
                      onSelectionChange={(key) => {
                        setApprovedByStaffId(key || null);
                      }}
                      isRequired
                    >
                      {staff.map((member) => (
                        <AutocompleteItem key={String(member._id || member.id)} textValue={member.name}>
                          {member.name} ({member.role})
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                  )}

                  {/* Notes */}
                  <Textarea
                    label="Notes"
                    placeholder="Additional notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="col-span-2"
                    rows={3}
                  />
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingId ? 'Update' : 'Issue Gate Pass'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <GatePassPrint
        gatePass={selectedGatePassForPrint}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </>
  );
});

GatePassLog.displayName = 'GatePassLog';

export default GatePassLog;
