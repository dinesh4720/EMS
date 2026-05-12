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
import { frontDeskApi, staffApi, studentsApi } from '../../services/api';
import { toCurrentTimeString, toDateInputValue } from '../../utils/dateFormatter';
import { parseFormSchema } from '../../validators/formSchemas';
import { createGatePassSchema } from '../../validators/frontDeskSchemas';
import {
  approvedByOptions,
  gatePassReasonOptions,
  leavingWithOptions,
} from './frontDeskConstants';
import logger from '../../utils/logger';

const todayIso = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  studentId: '',
  reason: '',
  otherReason: '',
  leavingDate: todayIso(),
  leavingTime: toCurrentTimeString(),
  expectedReturnDate: '',
  expectedReturnTime: '',
  leavingWith: '',
  escortName: '',
  escortRelation: '',
  escortPhone: '',
  approvedBy: '',
  approvedByStaffId: '',
  notes: '',
});

const gatePassToForm = (gp) => ({
  studentId: gp?.studentId ? String(gp.studentId) : '',
  reason: gp?.reason || '',
  otherReason: gp?.otherReason || '',
  leavingDate: toDateInputValue(gp?.leavingDate) || todayIso(),
  leavingTime: gp?.leavingTime || toCurrentTimeString(),
  expectedReturnDate: toDateInputValue(gp?.expectedReturnDate) || '',
  expectedReturnTime: gp?.expectedReturnTime || '',
  leavingWith: gp?.leavingWith || '',
  escortName: gp?.escortName || '',
  escortRelation: gp?.escortRelation || '',
  escortPhone: gp?.escortPhone || '',
  approvedBy: gp?.approvedBy || '',
  approvedByStaffId: gp?.approvedByStaffId ? String(gp.approvedByStaffId) : '',
  notes: gp?.notes || '',
});

export default function GatePassFormModal({ isOpen, onClose, gatePass, onSaved }) {
  const { t } = useTranslation();
  const isEditing = !!gatePass?._id;
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const lastStudentQuery = useRef(null);

  const [staff, setStaff] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(gatePass ? gatePassToForm(gatePass) : emptyForm());
    setStudentSearch(gatePass?.studentName || '');
    setErrors({});
  }, [isOpen, gatePass]);

  useEffect(() => {
    if (!isOpen) return;
    staffApi
      .getAll()
      .then((response) => setStaff(Array.isArray(response) ? response : response?.data || []))
      .catch((err) => logger.error('Failed to load staff:', err));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = setTimeout(() => {
      const query = studentSearch.trim();
      if (lastStudentQuery.current === query) return;
      lastStudentQuery.current = query;
      setStudentsLoading(true);
      studentsApi
        .list({ page: 1, limit: 20, status: 'active', search: query || undefined })
        .then((response) => setStudents(response?.data || []))
        .catch((err) => logger.error('Failed to load students:', err))
        .finally(() => setStudentsLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [isOpen, studentSearch]);

  useEffect(() => {
    if (!gatePass?.studentId) return;
    const exists = students.some(
      (item) => String(item._id || item.id) === String(gatePass.studentId)
    );
    if (exists) return;
    studentsApi
      .getById(gatePass.studentId)
      .then((student) => {
        if (!student) return;
        setStudents((prev) => {
          const id = String(student._id || student.id);
          if (prev.some((item) => String(item._id || item.id) === id)) return prev;
          return [student, ...prev];
        });
      })
      .catch(() => {});
  }, [gatePass?.studentId, students]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const selectedStudent = useMemo(
    () =>
      students.find((item) => String(item._id || item.id) === String(form.studentId)) || null,
    [students, form.studentId]
  );

  const selectedStaff = useMemo(
    () =>
      staff.find((item) => String(item._id || item.id) === String(form.approvedByStaffId)) || null,
    [staff, form.approvedByStaffId]
  );

  const studentOptions = students.map((student) => {
    const id = String(student._id || student.id);
    const adm = student.admissionId ? ` (${student.admissionId})` : '';
    const cls = student.classId?.name || student.class || '';
    return {
      value: id,
      label: `${student.name}${adm}`,
      description: cls || undefined,
    };
  });

  const staffOptions = staff.map((member) => {
    const id = String(member._id || member.id);
    return {
      value: id,
      label: member.name,
      description: member.role || member.designation || undefined,
    };
  });

  const handleApprovedByChange = (value) => {
    setForm((prev) => ({
      ...prev,
      approvedBy: value,
      approvedByStaffId: '',
    }));
    if (errors.approvedBy) setErrors((prev) => ({ ...prev, approvedBy: undefined }));
  };

  const buildPayload = () => {
    const student = selectedStudent;
    const staffMember = selectedStaff;
    return {
      studentId: form.studentId,
      studentName: student?.name || gatePass?.studentName || '',
      class: student?.classId?.name || student?.class || gatePass?.class || '',
      section: student?.classId?.section || student?.section || gatePass?.section || '',
      reason: form.reason,
      otherReason: form.reason === 'OTHER' ? form.otherReason.trim() : '',
      leavingDate: form.leavingDate,
      leavingTime: form.leavingTime,
      expectedReturnDate: form.expectedReturnDate || '',
      expectedReturnTime: form.expectedReturnTime || '',
      leavingWith: form.leavingWith,
      escortName: form.leavingWith === 'OTHERS' ? form.escortName.trim() : '',
      escortRelation: form.leavingWith === 'OTHERS' ? form.escortRelation.trim() : '',
      escortPhone: form.leavingWith === 'OTHERS' ? form.escortPhone.trim() : '',
      approvedBy: form.approvedBy,
      approvedByStaffId: form.approvedByStaffId,
      approvedByName: staffMember?.name || gatePass?.approvedByName || '',
      notes: form.notes?.trim() || '',
    };
  };

  const validateForZod = () => {
    return {
      studentId: form.studentId,
      reason: form.reason || undefined,
      otherReason: form.otherReason,
      leavingDate: form.leavingDate,
      leavingTime: form.leavingTime,
      expectedReturnDate: form.expectedReturnDate,
      expectedReturnTime: form.expectedReturnTime,
      leavingWith: form.leavingWith || undefined,
      escortName: form.escortName,
      escortRelation: form.escortRelation,
      escortPhone: form.escortPhone,
      approvedBy: form.approvedBy || undefined,
      approvedByStaffId: form.approvedByStaffId,
      notes: form.notes,
    };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;

    const result = parseFormSchema(createGatePassSchema, validateForZod());
    if (!result.success) {
      setErrors(result.errors);
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting') || 'Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEditing) {
        await frontDeskApi.updateGatePass(gatePass._id, payload);
        toast.success(t('toast.success.gatePassUpdatedSuccessfully'));
      } else {
        await frontDeskApi.createGatePass(payload);
        toast.success(t('toast.success.gatePassIssuedSuccessfully'));
      }
      onSaved?.();
      onClose();
    } catch (err) {
      logger.error('Failed to save gate pass:', err);
      toast.error(err?.response?.data?.message || 'Failed to save gate pass');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title={isEditing ? 'Edit Gate Pass' : 'Issue Gate Pass'}
      description={
        isEditing
          ? 'Update the gate pass details below.'
          : 'Capture details to authorise a student leaving school premises.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {isEditing ? 'Update Gate Pass' : 'Issue Gate Pass'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-2">
          <Input
            label="Search Student"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Search by name, roll, or admission ID"
            hint={studentsLoading ? 'Searching students…' : undefined}
          />
          <Combobox
            label="Student"
            options={studentOptions}
            value={form.studentId || undefined}
            onChange={(val) => setField('studentId', val || '')}
            placeholder={studentsLoading ? 'Loading…' : 'Select a student'}
            searchPlaceholder="Type to filter…"
            emptyMessage={studentsLoading ? 'Loading…' : 'No students match'}
            clearable
            className="w-full"
            triggerClassName="w-full"
          />
          {errors.studentId ? (
            <p role="alert" className="text-xs text-[var(--color-error)]">
              {errors.studentId}
            </p>
          ) : null}
        </div>

        {selectedStudent ? (
          <Alert variant="info" className="sm:col-span-2">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                <strong>Student:</strong> {selectedStudent.name}
              </span>
              <span>
                <strong>Class:</strong>{' '}
                {selectedStudent.classId?.name || selectedStudent.class || '—'}
                {selectedStudent.classId?.section || selectedStudent.section
                  ? ` · ${selectedStudent.classId?.section || selectedStudent.section}`
                  : ''}
              </span>
              {selectedStudent.admissionId ? (
                <span>
                  <strong>Admission ID:</strong> {selectedStudent.admissionId}
                </span>
              ) : null}
            </div>
          </Alert>
        ) : null}

        <Select
          label="Reason"
          required
          value={form.reason}
          onChange={(e) => setField('reason', e.target.value)}
          options={gatePassReasonOptions}
          placeholder="Select a reason"
          error={errors.reason}
        />
        {form.reason === 'OTHER' ? (
          <Input
            label="Specify Reason"
            required
            value={form.otherReason}
            onChange={(e) => setField('otherReason', e.target.value)}
            placeholder="Describe the reason"
            error={errors.otherReason}
          />
        ) : (
          <div className="hidden sm:block" aria-hidden="true" />
        )}

        <Input
          label="Leaving Date"
          type="date"
          required
          value={form.leavingDate}
          onChange={(e) => setField('leavingDate', e.target.value)}
          error={errors.leavingDate}
        />
        <Input
          label="Leaving Time"
          type="time"
          required
          value={form.leavingTime}
          onChange={(e) => setField('leavingTime', e.target.value)}
          error={errors.leavingTime}
        />
        <Input
          label="Expected Return Date"
          type="date"
          value={form.expectedReturnDate}
          onChange={(e) => setField('expectedReturnDate', e.target.value)}
          error={errors.expectedReturnDate}
        />
        <Input
          label="Expected Return Time"
          type="time"
          value={form.expectedReturnTime}
          onChange={(e) => setField('expectedReturnTime', e.target.value)}
          error={errors.expectedReturnTime}
        />

        <Select
          label="Leaving With"
          required
          value={form.leavingWith}
          onChange={(e) => setField('leavingWith', e.target.value)}
          options={leavingWithOptions}
          placeholder="Select who is picking up"
          error={errors.leavingWith}
        />
        {form.leavingWith === 'OTHERS' ? (
          <>
            <Input
              label="Escort Name"
              required
              value={form.escortName}
              onChange={(e) => setField('escortName', e.target.value)}
              placeholder="Name of escort"
              error={errors.escortName}
            />
            <Input
              label="Escort Relation"
              value={form.escortRelation}
              onChange={(e) => setField('escortRelation', e.target.value)}
              placeholder="e.g. Uncle, Driver"
              error={errors.escortRelation}
            />
            <Input
              label="Escort Phone"
              value={form.escortPhone}
              onChange={(e) => setField('escortPhone', e.target.value.replace(/[^0-9+\-\s()]/g, ''))}
              placeholder="Phone number"
              inputMode="tel"
              maxLength={20}
              error={errors.escortPhone}
            />
          </>
        ) : (
          <div className="hidden sm:block" aria-hidden="true" />
        )}

        <Select
          label="Approved By"
          required
          value={form.approvedBy}
          onChange={(e) => handleApprovedByChange(e.target.value)}
          options={approvedByOptions}
          placeholder="Select approver role"
          error={errors.approvedBy}
        />
        <Combobox
          label="Staff Member"
          options={staffOptions}
          value={form.approvedByStaffId || undefined}
          onChange={(val) => setField('approvedByStaffId', val || '')}
          placeholder="Select the approving staff member"
          searchPlaceholder="Type to filter staff…"
          emptyMessage="No staff match"
          clearable
          className="w-full"
          triggerClassName="w-full"
        />
        {errors.approvedByStaffId ? (
          <p role="alert" className="text-xs text-[var(--color-error)] sm:col-span-2 -mt-3">
            {errors.approvedByStaffId}
          </p>
        ) : null}

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

GatePassFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  gatePass: PropTypes.object,
  onSaved: PropTypes.func,
};
