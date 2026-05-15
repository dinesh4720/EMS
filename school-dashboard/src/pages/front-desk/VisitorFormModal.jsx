import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Modal,
  Input,
  Select,
  Textarea,
  Combobox,
  Button,
  Alert,
} from '../../components/ui';
import { frontDeskApi, studentsApi } from '../../services/api';
import { toCurrentTimeString } from '../../utils/dateFormatter';
import { parseFormSchema } from '../../validators/formSchemas';
import { createVisitorSchema, updateVisitorSchema } from '../../validators/frontDeskSchemas';
import {
  VISITOR_REASONS,
  visitorReasonOptions,
  getVisitorReasonMeta,
} from './frontDeskConstants';
import logger from '../../utils/logger';

const todayIso = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  name: '',
  phone: '',
  email: '',
  date: todayIso(),
  checkInTime: toCurrentTimeString(),
  purpose: '',
  whomToMeet: '',
  studentId: '',
  studentName: '',
  gatePassRequired: false,
  appointmentRequired: false,
  otherPurpose: '',
  companyName: '',
  deliveryPerson: '',
  notes: '',
});

const visitorToForm = (visitor) => ({
  name: visitor?.name || visitor?.visitorName || '',
  phone: visitor?.phone || visitor?.phoneNumber || '',
  email: visitor?.email || '',
  date: visitor?.date || todayIso(),
  checkInTime: visitor?.checkInTime || toCurrentTimeString(),
  purpose: visitor?.purpose || visitor?.reasonForVisit || '',
  whomToMeet: visitor?.whomToMeet || visitor?.concernedPerson || '',
  studentId: visitor?.studentId || '',
  studentName: visitor?.studentName || '',
  gatePassRequired: !!visitor?.gatePassRequired,
  appointmentRequired: !!visitor?.appointmentRequired,
  otherPurpose: visitor?.otherPurpose || '',
  companyName: visitor?.companyName || '',
  deliveryPerson: visitor?.deliveryPerson || '',
  notes: visitor?.notes || '',
});

export default function VisitorFormModal({ isOpen, onClose, visitor, onSaved }) {
  const { t } = useTranslation();
  const isEditing = !!visitor?._id;
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const lastLoadedQuery = useRef(null);

  const reasonMeta = useMemo(() => getVisitorReasonMeta(form.purpose), [form.purpose]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(visitor ? visitorToForm(visitor) : emptyForm());
    setStudentSearch(visitor?.studentName || '');
    setErrors({});
  }, [isOpen, visitor]);

  useEffect(() => {
    if (!isOpen) return;
    if (!reasonMeta?.needsStudentMapping) return;

    const handle = setTimeout(() => {
      const query = studentSearch.trim();
      if (lastLoadedQuery.current === query) return;
      lastLoadedQuery.current = query;
      setStudentsLoading(true);
      studentsApi
        .list({ page: 1, limit: 20, status: 'active', search: query || undefined })
        .then((response) => setStudents(response?.data || []))
        .catch((error) => logger.error('Failed to load students:', error))
        .finally(() => setStudentsLoading(false));
    }, 250);

    return () => clearTimeout(handle);
  }, [isOpen, reasonMeta?.needsStudentMapping, studentSearch]);

  useEffect(() => {
    if (!visitor?.studentId) return;
    const exists = students.some(
      (item) => String(item._id || item.id) === String(visitor.studentId)
    );
    if (exists) return;
    studentsApi
      .getById(visitor.studentId)
      .then((student) => {
        if (!student) return;
        setStudents((prev) => {
          const id = String(student._id || student.id);
          if (prev.some((item) => String(item._id || item.id) === id)) return prev;
          return [student, ...prev];
        });
      })
      .catch(() => {});
  }, [visitor?.studentId, students]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleReasonChange = (value) => {
    const meta = VISITOR_REASONS.find((reason) => reason.key === value);
    setForm((prev) => ({
      ...prev,
      purpose: value,
      gatePassRequired: meta?.needsGatePass || false,
      appointmentRequired: meta?.needsAppointment || false,
      otherPurpose: value === 'OTHER' ? prev.otherPurpose : '',
      companyName: value === 'DELIVERY_VENDOR' ? prev.companyName : '',
      deliveryPerson: value === 'DELIVERY_VENDOR' ? prev.deliveryPerson : '',
      studentId: meta?.needsStudentMapping ? prev.studentId : '',
      studentName: meta?.needsStudentMapping ? prev.studentName : '',
    }));
    setErrors((prev) => ({ ...prev, purpose: undefined }));
  };

  const handleStudentSelect = (id) => {
    const student = students.find((item) => String(item._id || item.id) === String(id));
    if (!student) {
      setForm((prev) => ({ ...prev, studentId: '', studentName: '' }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      studentId: String(student._id || student.id),
      studentName: student.name,
    }));
  };

  const buildCreatePayload = () => ({
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email?.trim() || undefined,
    purpose: form.purpose,
    whomToMeet: form.whomToMeet?.trim() || undefined,
    studentId: form.studentId || undefined,
    gatePassRequired: !!form.gatePassRequired,
    appointmentRequired: !!form.appointmentRequired,
    otherPurpose: form.purpose === 'OTHER' ? form.otherPurpose.trim() : undefined,
    companyName: form.companyName?.trim() || undefined,
    deliveryPerson: form.deliveryPerson?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
  });

  const buildUpdatePayload = () => ({
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email?.trim() || undefined,
    whomToMeet: form.whomToMeet?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
  });

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;

    const schema = isEditing ? updateVisitorSchema : createVisitorSchema;
    const payload = isEditing ? buildUpdatePayload() : buildCreatePayload();
    const result = parseFormSchema(schema, payload);

    if (!result.success) {
      setErrors(result.errors);
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await frontDeskApi.updateVisitor(visitor._id, payload);
        toast.success(t('toast.success.visitorUpdatedSuccessfully'));
      } else {
        await frontDeskApi.createVisitor(payload);
        toast.success(t('toast.success.visitorCheckedInSuccessfully'));
      }
      onSaved?.();
      onClose();
    } catch (error) {
      logger.error('Failed to save visitor:', error);
      toast.error(error?.response?.data?.message || t('toast.error.failedToSaveVisitor'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentOptions = students.map((student) => {
    const id = String(student._id || student.id);
    const adm = student.admissionId ? ` (${student.admissionId})` : '';
    const parent = student.parentName ? ` · Parent: ${student.parentName}` : '';
    return { value: id, label: `${student.name}${adm}${parent}` };
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title={isEditing ? 'Edit Visitor' : 'New Visitor Check-In'}
      description={
        isEditing
          ? 'Update the visitor record below.'
          : 'Capture visitor details to log entry into the school.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {isEditing ? 'Update Visitor' : 'Check In Visitor'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Visitor Name"
          required
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="Full name"
          error={errors.name}
          autoComplete="off"
        />
        <Input
          label="Phone Number"
          required
          value={form.phone}
          onChange={(e) => setField('phone', e.target.value.replace(/[^0-9+\-\s()]/g, ''))}
          placeholder="10-digit phone number"
          error={errors.phone}
          inputMode="tel"
          maxLength={20}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          placeholder="Optional"
          error={errors.email}
          wrapperClassName="sm:col-span-2"
        />
        {!isEditing && (
          <Select
            label="Reason for Visit"
            required
            value={form.purpose}
            onChange={(e) => handleReasonChange(e.target.value)}
            options={visitorReasonOptions}
            placeholder="Select a reason"
            error={errors.purpose}
            wrapperClassName="sm:col-span-2"
          />
        )}
        {!isEditing && form.purpose === 'OTHER' && (
          <Input
            label="Specify Purpose"
            required
            value={form.otherPurpose}
            onChange={(e) => setField('otherPurpose', e.target.value)}
            placeholder="Describe the purpose of visit"
            error={errors.otherPurpose}
            wrapperClassName="sm:col-span-2"
          />
        )}
        {!isEditing && form.purpose === 'DELIVERY_VENDOR' && (
          <>
            <Input
              label="Company Name"
              required
              value={form.companyName}
              onChange={(e) => setField('companyName', e.target.value)}
              placeholder="Vendor or company"
              error={errors.companyName}
            />
            <Input
              label="Delivery Person"
              value={form.deliveryPerson}
              onChange={(e) => setField('deliveryPerson', e.target.value)}
              placeholder="Optional"
              error={errors.deliveryPerson}
            />
          </>
        )}
        {!isEditing && reasonMeta?.needsStudentMapping && (
          <div className="sm:col-span-2 space-y-2">
            <Input
              label="Search Student (optional)"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search by name, roll, or admission ID"
              hint={studentsLoading ? 'Searching students…' : undefined}
            />
            <Combobox
              label="Linked Student"
              options={studentOptions}
              value={form.studentId || undefined}
              onChange={(val) => handleStudentSelect(val)}
              placeholder={studentsLoading ? 'Loading…' : 'Select student to link this visit'}
              searchPlaceholder="Type to filter…"
              emptyMessage={studentsLoading ? 'Loading…' : 'No students match'}
              clearable
              className="w-full"
              triggerClassName="w-full"
            />
          </div>
        )}
        <Input
          label="Date"
          type="date"
          value={form.date}
          readOnly
          disabled
        />
        <Input
          label="Check-In Time"
          type="time"
          value={form.checkInTime}
          readOnly
          disabled
        />
        <Input
          label="Whom to Meet"
          value={form.whomToMeet}
          onChange={(e) => setField('whomToMeet', e.target.value)}
          placeholder="Person or department"
          error={errors.whomToMeet}
          wrapperClassName="sm:col-span-2"
        />
        {form.gatePassRequired && (
          <Alert
            variant="warning"
            title="Gate pass required"
            className="sm:col-span-2"
          >
            This visit type requires a gate pass to be issued separately.
          </Alert>
        )}
        {form.appointmentRequired && (
          <Alert
            variant="info"
            title="Appointment required"
            className="sm:col-span-2"
          >
            This visit type usually requires a prior appointment.
          </Alert>
        )}
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder="Additional notes (optional)"
          rows={3}
          error={errors.notes}
          wrapperClassName="sm:col-span-2"
        />
      </form>
    </Modal>
  );
}

VisitorFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  visitor: PropTypes.object,
  onSaved: PropTypes.func,
};
