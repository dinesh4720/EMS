import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Check, ChevronRight, X } from 'lucide-react';
import { frontDeskApi } from '../../services/api';
import logger from '../../utils/logger';
import { admissionSchema } from '../../validators/frontDeskSchemas';
import { parseFormSchema } from '../../validators/formSchemas';
import {
  DECISION_OPTIONS,
  FALLBACK_CLASSES,
  HSC_GROUP_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  TEST_RESULT_OPTIONS,
  emptyAdmissionForm,
  isHigherSecondary,
} from './admissionsConstants';

const SECTIONS = [
  { id: 'basic', label: 'Basic info' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'decision', label: 'Decision' },
  { id: 'payment', label: 'Payment' },
  { id: 'actions', label: 'Actions' },
];

const admissionToForm = (admission) => ({
  studentName: admission.studentName || '',
  dateOfBirth: admission.dateOfBirth || '',
  parentName: admission.parentName || '',
  phoneNumber: (admission.phoneNumber || '').replace(/\D/g, '').slice(0, 10),
  email: admission.email || '',
  classApplyingFor: admission.classApplyingFor || '',
  hscGroup: admission.hscGroup || '',
  assessmentRequired: !!admission.assessmentRequired,
  assignedTeacher: admission.assignedTeacher?._id || admission.assignedTeacher || '',
  testDate: admission.testDate || '',
  testTime: admission.testTime || '',
  testResult: admission.testResult || 'pending',
  source: admission.source || 'walk-in',
  status: admission.status || 'inquiry-logged',
  admissionDecision: admission.admissionDecision || 'pending',
  decisionRemarks: admission.decisionRemarks || '',
  paymentStatus: admission.paymentStatus || 'unpaid',
  paymentMode: admission.paymentMode || '',
  paymentAmount: admission.paymentAmount ?? '',
  paymentDate: admission.paymentDate || '',
  transactionId: admission.transactionId || '',
});

const buildPayload = (form) => {
  const payload = { ...form };
  payload.phoneNumber = (payload.phoneNumber || '').replace(/\D/g, '').slice(0, 10);
  if (!payload.assessmentRequired) payload.assignedTeacher = null;
  return payload;
};

function Field({ label, required, hint, error, span2, children }) {
  return (
    <div className={`field ${span2 ? 'span-2' : ''}`}>
      <label className="field__label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {error ? (
        <span className="field__hint" style={{ color: 'var(--danger)' }} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.node.isRequired,
  required: PropTypes.bool,
  hint: PropTypes.node,
  error: PropTypes.node,
  span2: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default function AdmissionFormModal({
  isOpen,
  onClose,
  admission,
  staff,
  availableClasses,
  onSaved,
}) {
  const { t } = useTranslation();
  const isEditing = !!admission?._id;
  const [form, setForm] = useState(emptyAdmissionForm());
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(admission ? admissionToForm(admission) : emptyAdmissionForm());
    setErrors({});
    setActiveSection('basic');
  }, [isOpen, admission]);

  // ESC closes
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Scroll-spy for section nav
  useEffect(() => {
    if (!isOpen) return undefined;
    const root = mainRef.current;
    if (!root) return undefined;
    const targets = SECTIONS.map((s) =>
      document.getElementById(`admission-section-${s.id}`)
    ).filter(Boolean);
    if (!targets.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace('admission-section-', '');
          setActiveSection(id);
        }
      },
      { root, rootMargin: '-60px 0px -60% 0px', threshold: [0, 0.1, 0.5] }
    );
    targets.forEach((tgt) => obs.observe(tgt));
    return () => obs.disconnect();
  }, [isOpen]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const classOptions = useMemo(() => {
    const list = availableClasses?.length ? availableClasses : FALLBACK_CLASSES;
    return list.map((cls) => ({
      value: cls,
      label: Number.isNaN(Number(cls)) ? cls : `Class ${cls}`,
    }));
  }, [availableClasses]);

  const teacherOptions = useMemo(
    () => (staff || []).map((teacher) => ({ value: teacher._id, label: teacher.name })),
    [staff]
  );

  const showHscGroup = isHigherSecondary(form.classApplyingFor);

  // Section completion — simple heuristic: required fields present
  const sectionDone = useMemo(() => ({
    basic:
      !!form.studentName &&
      !!form.parentName &&
      form.phoneNumber?.length === 10 &&
      !!form.classApplyingFor,
    assessment: !form.assessmentRequired || (!!form.assignedTeacher && !!form.testDate),
    decision: form.admissionDecision !== 'pending',
    payment: form.paymentStatus !== 'unpaid',
    actions: false,
  }), [form]);

  const goToSection = (id) => {
    setActiveSection(id);
    document
      .getElementById(`admission-section-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;
    const payload = buildPayload(form);
    const result = parseFormSchema(admissionSchema, payload);
    if (!result.success) {
      setErrors(result.errors);
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting'));
      const firstErrField = Object.keys(result.errors)[0];
      if (firstErrField) {
        const sectionOf = {
          studentName: 'basic', dateOfBirth: 'basic', parentName: 'basic',
          phoneNumber: 'basic', email: 'basic', classApplyingFor: 'basic',
          hscGroup: 'basic', source: 'basic', status: 'basic',
          assignedTeacher: 'assessment', testDate: 'assessment',
          testTime: 'assessment', testResult: 'assessment',
          admissionDecision: 'decision', decisionRemarks: 'decision',
          paymentStatus: 'payment', paymentMode: 'payment',
          paymentAmount: 'payment', paymentDate: 'payment',
          transactionId: 'payment',
        };
        goToSection(sectionOf[firstErrField] || 'basic');
      }
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await frontDeskApi.updateAdmission(admission._id, payload);
        toast.success(t('toast.success.admissionUpdatedSuccessfully'));
      } else {
        await frontDeskApi.createAdmission(payload);
        toast.success(t('toast.success.admissionInquiryCreatedSuccessfully'));
      }
      onSaved?.();
      onClose();
    } catch (err) {
      logger.error('Failed to save admission:', err);
      toast.error(t('toast.error.failedToSaveAdmission'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendFormLink = async () => {
    if (!isEditing && !form.phoneNumber && !form.email) {
      toast.error(t('toast.error.pleaseAddPhoneNumberOrEmailToSendFormLink'));
      return;
    }
    setIsSendingLink(true);
    try {
      const contactInfo = form.phoneNumber || form.email;
      if (
        isEditing &&
        (form.status === 'inquiry-logged' || form.status === 'form-sent')
      ) {
        const updated = { ...buildPayload(form), status: 'form-sent' };
        await frontDeskApi.updateAdmission(admission._id, updated);
        setForm((prev) => ({ ...prev, status: 'form-sent' }));
        onSaved?.();
      }
      toast.success(
        `Status updated to "Form Sent" for ${contactInfo}. Actual link delivery requires backend integration.`,
        { duration: 4000 }
      );
    } catch (err) {
      logger.error('Failed to send form link:', err);
      toast.error(t('toast.error.failedToUpdateAdmissionStatus'));
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleConvertToStudent = async () => {
    if (!isEditing) return;
    try {
      const data = await frontDeskApi.convertToStudent(admission._id);
      toast.success(data?.message || 'Student created successfully!');
      onSaved?.();
      onClose();
    } catch (err) {
      logger.error('Failed to convert to student:', err);
      toast.error(err?.message || 'Failed to convert to student');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="composer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit admission enquiry' : 'New admission enquiry'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="composer">
        <div className="composer__head">
          <button
            type="button"
            className="iconbtn"
            style={{ width: 24, height: 24 }}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={13} />
          </button>
          <div className="composer__crumbs">
            <span>Front desk</span>
            <ChevronRight size={11} style={{ color: 'var(--fg-faint)' }} aria-hidden />
            <span>Admissions</span>
            <ChevronRight size={11} style={{ color: 'var(--fg-faint)' }} aria-hidden />
            <span className="here">{isEditing ? 'Edit enquiry' : 'New enquiry'}</span>
          </div>
          <div style={{ flex: 1 }} />
          <span className="kbd">esc</span>
        </div>

        <div className="composer__body">
          <nav className="composer__nav" aria-label="Sections">
            <div className="composer__nav-title">Sections</div>
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goToSection(s.id)}
                className={`cnav ${activeSection === s.id ? 'is-active' : ''} ${sectionDone[s.id] ? 'is-done' : ''}`}
                aria-current={activeSection === s.id ? 'true' : undefined}
              >
                <span className="cnav__num" aria-hidden>
                  {sectionDone[s.id] ? <Check size={10} strokeWidth={2.5} /> : i + 1}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="composer__main" ref={mainRef}>
            <h2 className="composer__title">
              {isEditing ? 'Edit admission enquiry' : 'New admission enquiry'}
            </h2>
            <p className="composer__sub">
              {isEditing
                ? 'Update enquiry details, schedule assessment, or record payment.'
                : 'Capture the details of a new admission enquiry.'}
            </p>

            <form onSubmit={handleSubmit}>
              <section id="admission-section-basic" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Basic info</div>
                    <div className="section__hint">Student, parent, and contact details.</div>
                  </div>
                </div>
                <div className="fgrid">
                  <Field label="Student name" required error={errors.studentName}>
                    <input
                      className={`input ${errors.studentName ? 'input--err' : ''}`}
                      value={form.studentName}
                      onChange={(e) => setField('studentName', e.target.value)}
                      placeholder="Enter student name"
                    />
                  </Field>
                  <Field label="Date of birth" error={errors.dateOfBirth}>
                    <input
                      className={`input ${errors.dateOfBirth ? 'input--err' : ''}`}
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setField('dateOfBirth', e.target.value)}
                      max={`${new Date().getFullYear() - 1}-12-31`}
                    />
                  </Field>
                  <Field label="Parent/guardian name" required error={errors.parentName}>
                    <input
                      className={`input ${errors.parentName ? 'input--err' : ''}`}
                      value={form.parentName}
                      onChange={(e) => setField('parentName', e.target.value)}
                      placeholder="Enter parent name"
                    />
                  </Field>
                  <Field label="Phone" required error={errors.phoneNumber}>
                    <input
                      className={`input mono tnum ${errors.phoneNumber ? 'input--err' : ''}`}
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phoneNumber}
                      onChange={(e) =>
                        setField('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="10-digit number"
                    />
                  </Field>
                  <Field label="Email" error={errors.email} span2>
                    <input
                      className={`input ${errors.email ? 'input--err' : ''}`}
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      placeholder="parent@example.com"
                    />
                  </Field>
                  <Field label="Class applying for" required error={errors.classApplyingFor}>
                    <select
                      className={`select ${errors.classApplyingFor ? 'input--err' : ''}`}
                      value={form.classApplyingFor}
                      onChange={(e) => setField('classApplyingFor', e.target.value)}
                    >
                      <option value="">Select class…</option>
                      {classOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                  {showHscGroup && (
                    <Field label="HSC group (optional)" error={errors.hscGroup}>
                      <select
                        className="select"
                        value={form.hscGroup}
                        onChange={(e) => setField('hscGroup', e.target.value)}
                      >
                        <option value="">Select group…</option>
                        {HSC_GROUP_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label="Source">
                    <select
                      className="select"
                      value={form.source}
                      onChange={(e) => setField('source', e.target.value)}
                    >
                      {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      className="select"
                      value={form.status}
                      onChange={(e) => setField('status', e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>

              <section id="admission-section-assessment" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Assessment</div>
                    <div className="section__hint">Optional — required only if you test the student.</div>
                  </div>
                </div>
                <label className="row gap-2" style={{ marginBottom: 12, alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.assessmentRequired}
                    onChange={(e) => setField('assessmentRequired', e.target.checked)}
                  />
                  <span>Assessment required</span>
                </label>
                {form.assessmentRequired && (
                  <div className="fgrid">
                    <Field label="Assign to teacher" required error={errors.assignedTeacher}>
                      <select
                        className={`select ${errors.assignedTeacher ? 'input--err' : ''}`}
                        value={form.assignedTeacher || ''}
                        onChange={(e) => setField('assignedTeacher', e.target.value)}
                      >
                        <option value="">Select teacher…</option>
                        {teacherOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Test date" error={errors.testDate}>
                      <input
                        className={`input ${errors.testDate ? 'input--err' : ''}`}
                        type="date"
                        value={form.testDate}
                        onChange={(e) => setField('testDate', e.target.value)}
                      />
                    </Field>
                    <Field label="Test time">
                      <input
                        className="input"
                        type="time"
                        value={form.testTime}
                        onChange={(e) => setField('testTime', e.target.value)}
                      />
                    </Field>
                    <Field label="Test result">
                      <select
                        className="select"
                        value={form.testResult}
                        onChange={(e) => setField('testResult', e.target.value)}
                      >
                        {TEST_RESULT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </section>

              <section id="admission-section-decision" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Decision</div>
                    <div className="section__hint">Approve, reject, or keep pending.</div>
                  </div>
                </div>
                <div className="fgrid">
                  <Field label="Admission decision">
                    <select
                      className="select"
                      value={form.admissionDecision}
                      onChange={(e) => setField('admissionDecision', e.target.value)}
                    >
                      {DECISION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Decision remarks" error={errors.decisionRemarks} span2>
                    <textarea
                      className="textarea"
                      value={form.decisionRemarks}
                      onChange={(e) => setField('decisionRemarks', e.target.value)}
                      rows={3}
                      placeholder="Optional remarks…"
                    />
                  </Field>
                </div>
              </section>

              <section id="admission-section-payment" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Payment</div>
                    <div className="section__hint">Record form fee / admission fee payment.</div>
                  </div>
                </div>
                <div className="fgrid">
                  <Field label="Payment status" span2>
                    <select
                      className="select"
                      value={form.paymentStatus}
                      onChange={(e) => setField('paymentStatus', e.target.value)}
                    >
                      {PAYMENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                  {form.paymentStatus === 'paid' && (
                    <>
                      <Field label="Payment mode">
                        <select
                          className="select"
                          value={form.paymentMode}
                          onChange={(e) => setField('paymentMode', e.target.value)}
                        >
                          <option value="">Select mode…</option>
                          {PAYMENT_MODE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Amount">
                        <input
                          className="input mono tnum"
                          type="number"
                          value={form.paymentAmount}
                          onChange={(e) => setField('paymentAmount', e.target.value)}
                          placeholder="0"
                        />
                      </Field>
                      <Field label="Payment date">
                        <input
                          className="input"
                          type="date"
                          value={form.paymentDate}
                          onChange={(e) => setField('paymentDate', e.target.value)}
                          max={new Date().toLocaleDateString('en-CA')}
                        />
                      </Field>
                      <Field label="Transaction ID">
                        <input
                          className="input mono tnum"
                          value={form.transactionId}
                          onChange={(e) => setField('transactionId', e.target.value)}
                          placeholder="TXN…"
                        />
                      </Field>
                    </>
                  )}
                </div>
              </section>

              <section id="admission-section-actions" className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Actions</div>
                    <div className="section__hint">Send form link or convert to a student record.</div>
                  </div>
                </div>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={handleSendFormLink}
                    disabled={isSendingLink}
                  >
                    {isSendingLink ? 'Sending…' : 'Send form link'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm btn--accent"
                    onClick={handleConvertToStudent}
                    disabled={!isEditing || form.status !== 'fee-paid'}
                    title={form.status !== 'fee-paid' ? 'Available once fee is paid' : undefined}
                  >
                    Add as new student
                  </button>
                </div>
                {form.status !== 'fee-paid' && (
                  <p className="subtle" style={{ fontSize: 12, marginTop: 8 }}>
                    Admission must be approved and fee paid before adding as a student.
                  </p>
                )}
              </section>
            </form>
          </div>
        </div>

        <div className="composer__foot">
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn--ghost subtle" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (isEditing ? 'Updating…' : 'Creating…')
              : (isEditing ? 'Save changes' : 'Create enquiry')}
            {!isSubmitting && <ChevronRight size={11} />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

AdmissionFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  admission: PropTypes.object,
  staff: PropTypes.array,
  availableClasses: PropTypes.array,
  onSaved: PropTypes.func,
};
