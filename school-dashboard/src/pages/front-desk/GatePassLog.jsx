import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import logger from "../../utils/logger";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem,
  Button, Textarea, Autocomplete, AutocompleteItem
} from '@heroui/react';
import { Trash2, Plus, Edit, Download, CheckCircle, XCircle, Search, RotateCcw } from 'lucide-react';
import { frontDeskApi, studentsApi, staffApi } from '../../services/api';
import { validatePhone } from '../../utils/validations';
import toast from 'react-hot-toast';
import GatePassPrint from './GatePassPrint.jsx';
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '../../utils/dateFormatter';

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
  const { t } = useTranslation();
  const [gatePasses, setGatePasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedGatePassForPrint, setSelectedGatePassForPrint] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
        logger.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const timeoutId = setTimeout(() => {
      loadStudents(studentSearchQuery);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [isModalOpen, studentSearchQuery]);

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
      logger.error('Failed to load gate passes:', error);
      toast.error(t('toast.error.failedToLoadGatePasses'));
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
      logger.error('Failed to load students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll();
      setStaff(response);
    } catch (error) {
      logger.error('Failed to load staff:', error);
    }
  };

  const resetForm = () => {
    setStudentId(null);
    setStudentSearchQuery('');
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
    return students.find(s => String(s._id || s.id) === String(studentId));
  };

  const getSelectedStaff = () => {
    if (!approvedByStaffId || !staff) return null;
    return staff.find(s => (s._id || s.id) === approvedByStaffId);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate before setting isSubmitting to avoid permanently disabling submit
    const student = getSelectedStudent();
    const staffMember = getSelectedStaff();

    if (!student) {
      toast.error(t('toast.error.pleaseSelectAStudent'));
      return;
    }
    if (!reason) {
      toast.error(t('toast.error.pleaseSelectAReason'));
      return;
    }
    if (reason === 'OTHER' && !otherReason) {
      toast.error(t('toast.error.pleaseSpecifyTheReason'));
      return;
    }
    if (!leavingWith) {
      toast.error(t('toast.error.pleaseSelectWhoTheStudentIsLeavingWith'));
      return;
    }
    if (leavingWith === 'OTHERS' && !escortName) {
      toast.error(t('toast.error.pleaseEnterEscortName'));
      return;
    }
    if (leavingWith === 'OTHERS' && escortPhone && !validatePhone(escortPhone)) {
      toast.error(t('toast.error.pleaseEnterAValid10DigitPhoneNumber'));
      return;
    }
    if (!approvedBy) {
      toast.error(t('toast.error.pleaseSelectWhoApprovedThisGatePass'));
      return;
    }
    if (!approvedByStaffId || !staffMember) {
      toast.error(t('toast.error.pleaseSelectAStaffMember'));
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = {
        studentId: student._id || student.id,
        studentName: student.name,
        class: student.classId?.name || student.class || '',
        section: student.classId?.section || student.section || '',
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
        toast.success(t('toast.success.gatePassUpdatedSuccessfully'));
      } else {
        await frontDeskApi.createGatePass(formData);
        toast.success(t('toast.success.gatePassIssuedSuccessfully'));
      }

      setIsModalOpen(false);
      resetForm();
      loadGatePasses();
      if (props.onSave) props.onSave();
    } catch (error) {
      logger.error('Failed to save gate pass:', error);
      toast.error(error.response?.data?.message || 'Failed to save gate pass');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (gatePass) => {
    if (!gatePass) return; // Null check
    setEditingId(gatePass._id);
    setStudentId(gatePass.studentId || null);
    setStudentSearchQuery(gatePass.studentName || '');
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

    if (gatePass.studentId && !students.some(s => String(s._id || s.id) === String(gatePass.studentId))) {
      studentsApi.getById(gatePass.studentId)
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

    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('confirm.deleteGatePass'))) return;
    try {
      await frontDeskApi.deleteGatePass(id);
      toast.success(t('toast.success.gatePassDeleted'));
      loadGatePasses();
    } catch (error) {
      toast.error(t('toast.error.failedToDeleteGatePass'));
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

      <Table aria-label={t('aria.tables.gatePassLog')} removeWrapper>
        <TableHeader>
          <TableColumn scope="col">{t('pages.nAME')}</TableColumn>
          <TableColumn scope="col">{t('pages.cLASS')}</TableColumn>
          <TableColumn scope="col">{t('pages.rEASON')}</TableColumn>
          <TableColumn scope="col">{t('pages.lEFTWith')}</TableColumn>
          <TableColumn scope="col">{t('pages.aPPROVEDBy')}</TableColumn>
          <TableColumn scope="col">{t('pages.dATETime')}</TableColumn>
          <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
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
                  ? `${formatShortDate(gatePass.leavingDate)} ${gatePass.leavingTime}`
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
                label={t('pages.selectStudent')}
                placeholder={t('pages.searchAndSelectStudent')}
                selectedKey={studentId ? String(studentId) : null}
                inputValue={studentSearchQuery}
                onInputChange={setStudentSearchQuery}
                onSelectionChange={(key) => {
                  setStudentId(key || null);
                }}
                isRequired
                isLoading={studentsLoading}
                className="col-span-2"
              >
                {students.map((student) => (
                  <AutocompleteItem key={String(student._id || student.id)} textValue={student.name}>
                    {student.name} {student.admissionId ? `(${student.admissionId})` : ''} - {student.classId?.name || student.class || ''}
                  </AutocompleteItem>
                ))}
              </Autocomplete>

              {/* Selected Student Info */}
              {selectedStudent && (
                <>
                  <div className="col-span-2 bg-default-100 p-3 rounded-lg">
                    <p className="text-sm"><strong>{t('pages.student1')}</strong> {selectedStudent.name}</p>
                    <p className="text-sm"><strong>{t('pages.class2')}</strong> {selectedStudent.classId?.name || selectedStudent.class || ''} {selectedStudent.classId?.section || selectedStudent.section ? `- ${selectedStudent.classId?.section || selectedStudent.section}` : ''}</p>
                    {selectedStudent.admissionId && (
                      <p className="text-sm"><strong>{t('pages.admissionId2')}</strong> {selectedStudent.admissionId}</p>
                    )}
                  </div>

                  {/* Reason */}
                  <Select
                    label={t('pages.reason')}
                    placeholder={t('pages.selectReason2')}
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
                      label={t('pages.pleaseSpecifyReason')}
                      placeholder={t('pages.enterReason')}
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      isRequired
                    />
                  )}

                  {/* Leaving Date & Time */}
                  <Input
                    label={t('pages.leavingDate')}
                    type="date"
                    value={leavingDate}
                    onChange={(e) => setLeavingDate(e.target.value)}
                    isRequired
                  />
                  <Input
                    label={t('pages.leavingTime')}
                    type="time"
                    value={leavingTime}
                    onChange={(e) => setLeavingTime(e.target.value)}
                    isRequired
                  />

                  {/* Expected Return */}
                  <Input
                    label={t('pages.expectedReturnDate')}
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                  />
                  <Input
                    label={t('pages.expectedReturnTime')}
                    type="time"
                    value={expectedReturnTime}
                    onChange={(e) => setExpectedReturnTime(e.target.value)}
                  />

                  {/* Leaving With */}
                  <Select
                    label={t('pages.leftWith')}
                    placeholder={t('pages.selectWhoIsPickingUp')}
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
                        label={t('pages.escortName')}
                        placeholder={t('pages.enterEscortName')}
                        value={escortName}
                        onChange={(e) => setEscortName(e.target.value)}
                        isRequired
                      />
                      <Input
                        label={t('pages.escortRelation')}
                        placeholder={t('pages.escortRelationPlaceholder')}
                        value={escortRelation}
                        onChange={(e) => setEscortRelation(e.target.value)}
                      />
                      <Input
                        label={t('pages.escortPhone')}
                        placeholder={t('pages.enterPhoneNumber')}
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
                    label={t('pages.approvedBy')}
                    placeholder={t('pages.selectWhoApproved')}
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
                      placeholder={t('pages.searchAndSelectStaffMember')}
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
                    label={t('pages.notes1')}
                    placeholder={t('pages.additionalNotesOptional')}
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
            <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
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
