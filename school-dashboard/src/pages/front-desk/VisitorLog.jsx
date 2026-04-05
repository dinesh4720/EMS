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
import { toCurrentTimeString } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const VISITOR_REASONS = [
  { key: 'PARENT_MEETING', label: 'Parent Meeting', needsGatePass: true, needsAppointment: false, needsStudentMapping: true },
  { key: 'STUDENT_PICKUP_DROP_OFF', label: 'Student Pickup/Drop-off', needsGatePass: true, needsAppointment: false, needsStudentMapping: true },
  { key: 'SCHOOL_VISIT_INQUIRY', label: 'School Visit/Inquiry', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
  { key: 'DELIVERY_VENDOR', label: 'Delivery/Vendor', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
  { key: 'OFFICIAL_BUSINESS', label: 'Official Business', needsGatePass: false, needsAppointment: true, needsStudentMapping: false },
  { key: 'VOLUNTEER_EVENT', label: 'Volunteer/Event', needsGatePass: false, needsAppointment: true, needsStudentMapping: false },
  { key: 'OTHER', label: 'Other', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
];

const VisitorLog = forwardRef(({ onSave, ...props }, ref) => {
  const { t } = useTranslation();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentLookupQuery, setStudentLookupQuery] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    phoneNumber: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: toCurrentTimeString(),
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
      setVisitors(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load visitors:', error);
      toast.error(t('toast.error.failedToLoadVisitors'));
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
        toast.error('Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Visitor name is required';
    }

    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber) || /^(\d)\1{9}$/.test(formData.phoneNumber)) {
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
        if (!value?.trim()) error = 'Phone number is required';
        else if (!validatePhone(value) || /^(\d)\1{9}$/.test(value)) error = 'Please enter a valid 10-digit phone number';
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

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;
    if (!validateForm()) {
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update uses backend field names: name, phone, whomToMeet, notes, etc.
        const updateData = {
          name: formData.visitorName,
          phone: formData.phoneNumber,
          email: formData.email || undefined,
          whomToMeet: formData.concernedPerson || undefined,
          notes: formData.notes || undefined,
        };
        await frontDeskApi.updateVisitor(editingId, updateData);
        toast.success(t('toast.success.visitorUpdatedSuccessfully'));
      } else {
        // Create uses backend field names: name, phone, purpose, otherPurpose, etc.
        const createData = {
          name: formData.visitorName,
          phone: formData.phoneNumber,
          email: formData.email || undefined,
          purpose: formData.reasonForVisit,
          whomToMeet: formData.concernedPerson || undefined,
          studentId: formData.studentId || undefined,
          gatePassRequired: formData.gatePassRequired,
          appointmentRequired: formData.appointmentRequired,
          otherPurpose: formData.reasonForVisit === 'OTHER' ? formData.otherPurpose : undefined,
          companyName: formData.companyName || undefined,
          deliveryPerson: formData.deliveryPerson || undefined,
          notes: formData.notes || undefined,
        };
        await frontDeskApi.createVisitor(createData);
        toast.success(t('toast.success.visitorCheckedInSuccessfully'));
      }
      onClose();
      resetForm();
      loadVisitors();
      onSave?.();
    } catch (error) {
      toast.error(t('toast.error.failedToSaveVisitor'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async (id) => {
    try {
      await frontDeskApi.checkoutVisitor(id);
      toast.success(t('toast.success.visitorCheckedOutSuccessfully'));
      loadVisitors();
      onSave?.();
    } catch (error) {
      toast.error(t('toast.error.failedToCheckOutVisitor'));
    }
  };

  const handleEdit = (visitor) => {
    if (!visitor) return; // Null check
    setEditingId(visitor._id);
    setStudentLookupQuery(visitor.studentName || '');
    setFormData({
      visitorName: visitor.name || visitor.visitorName || '',
      phoneNumber: visitor.phone || visitor.phoneNumber || '',
      email: visitor.email || '',
      date: visitor.date || new Date().toISOString().split('T')[0],
      checkInTime: visitor.checkInTime || toCurrentTimeString(),
      reasonForVisit: visitor.purpose || visitor.reasonForVisit || '',
      concernedPerson: visitor.whomToMeet || visitor.concernedPerson || '',
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

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Visitor',
      message: t('confirm.deleteVisitor'),
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await frontDeskApi.deleteVisitor(id);
          toast.success(t('toast.success.visitorRecordDeleted'));
          loadVisitors();
          onSave?.();
        } catch (error) {
          toast.error(t('toast.error.failedToDeleteVisitorRecord'));
        }
      },
    });
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
      checkInTime: toCurrentTimeString(),
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

  // Backend returns `name`/`phone`/`purpose`, but may also have legacy `visitorName`/`phoneNumber`/`reasonForVisit`
  const getVisitorName = (v) => v?.name || v?.visitorName || '';
  const getVisitorPhone = (v) => v?.phone || v?.phoneNumber || '';
  const getVisitorPurpose = (v) => v?.purpose || v?.reasonForVisit || '';

  const filteredVisitors = visitors.filter(visitor =>
    getVisitorName(visitor).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getVisitorPhone(visitor).includes(searchTerm) ||
    ((visitor.whomToMeet || visitor.concernedPerson)?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || []; // Ensure array is never null

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <Input
          placeholder={t('pages.searchVisitors')}
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
      <Table aria-label={t('aria.tables.visitorLog')} removeWrapper>
        <TableHeader>
          <TableColumn scope="col">{t('pages.vISITORName')}</TableColumn>
          <TableColumn scope="col">{t('pages.pHONE')}</TableColumn>
          <TableColumn scope="col">{t('pages.rEASON')}</TableColumn>
          <TableColumn scope="col">{t('pages.cONCERNEDPerson')}</TableColumn>
          <TableColumn scope="col">{t('pages.sTUDENT')}</TableColumn>
          <TableColumn scope="col">{t('pages.cHECKIn')}</TableColumn>
          <TableColumn scope="col">{t('pages.cHECKOut')}</TableColumn>
          <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
          <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
        </TableHeader>
        <TableBody
          items={filteredVisitors}
          isLoading={loading}
          emptyContent="No visitors today"
        >
          {(visitor) => (
            <TableRow key={visitor._id}>
              <TableCell>{getVisitorName(visitor)}</TableCell>
              <TableCell>{getVisitorPhone(visitor) || '-'}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">{getReasonLabel(getVisitorPurpose(visitor))}</Chip>
              </TableCell>
              <TableCell>{visitor.whomToMeet || visitor.concernedPerson || '-'}</TableCell>
              <TableCell>{visitor.studentName || '-'}</TableCell>
              <TableCell>{visitor.checkInTime}</TableCell>
              <TableCell>{visitor.checkOutTime || '-'}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={visitor.status === 'ACTIVE' ? 'success' : 'default'}
                  variant="flat"
                >
                  {visitor.status === 'ACTIVE' ? 'In' : 'Out'}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {visitor.status === 'ACTIVE' && (
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
                label={t('pages.visitorName')}
                placeholder={t('pages.enterVisitorName')}
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
                label={t('pages.phoneNumber')}
                placeholder={t('pages.enter10DigitPhoneNumber')}
                value={formData.phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, phoneNumber: val });
                  validateField('phoneNumber', val);
                }}
                maxLength={10}
                required
                error={errors.phoneNumber}
              />
              <FormInput
                label={t('pages.email1')}
                placeholder={t('pages.enterEmail')}
                value={formData.email}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, email: val }));
                  validateField('email', val);
                }}
                error={errors.email}
              />
              <Select
                label={t('pages.reasonForVisit')}
                placeholder={t('pages.selectReason2')}
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
                  label={t('pages.pleaseSpecify')}
                  placeholder={t('pages.enterPurpose')}
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
                    label={t('pages.companyName')}
                    placeholder={t('pages.enterCompanyName')}
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
                    label={t('pages.deliveryPerson')}
                    placeholder={t('pages.enterDeliveryPersonName')}
                    value={formData.deliveryPerson}
                    onChange={(e) => setFormData({ ...formData, deliveryPerson: e.target.value })}
                  />
                </>
              )}
              {(formData.reasonForVisit === 'PARENT_MEETING' || formData.reasonForVisit === 'STUDENT_PICKUP_DROP_OFF') && (
                <div className="col-span-2 space-y-3">
                  <Input
                    label={t('pages.searchStudentOptional')}
                    placeholder={t('pages.searchByStudentNameRollNoOrAdmissionId')}
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
                label={t('pages.date2')}
                type="date"
                value={formData.date}
                readOnly
                className="bg-default-100 cursor-not-allowed"
              />
              <FormInput
                label={t('pages.checkInTime')}
                type="time"
                value={formData.checkInTime}
                readOnly
                className="bg-default-100 cursor-not-allowed"
              />
              <FormInput
                label={t('pages.concernedPerson')}
                placeholder={t('pages.personToMeet')}
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
                label={t('pages.notes1')}
                placeholder={t('pages.additionalNotesOptional')}
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
            <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
              {editingId ? 'Update' : 'Check In'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
});

VisitorLog.displayName = 'VisitorLog';

export default VisitorLog;
