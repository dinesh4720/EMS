import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Alert,
  Button,
  Checkbox,
  Input,
  MinimalTabs,
  Modal,
  Select,
  Textarea,
} from '../../components/ui';
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
  if (!payload.assessmentRequired) {
    payload.assignedTeacher = null;
  }
  return payload;
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
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(admission ? admissionToForm(admission) : emptyAdmissionForm());
    setErrors({});
    setActiveTab('basic');
  }, [isOpen, admission]);

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

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;

    const payload = buildPayload(form);
    const result = parseFormSchema(admissionSchema, payload);
    if (!result.success) {
      setErrors(result.errors);
      toast.error(t('toast.error.pleaseFixTheErrorsBeforeSubmitting'));
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
    } catch (error) {
      logger.error('Failed to save admission:', error);
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
    } catch (error) {
      logger.error('Failed to send form link:', error);
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
    } catch (error) {
      logger.error('Failed to convert to student:', error);
      toast.error(error?.message || 'Failed to convert to student');
    }
  };

  const tabs = [
    { key: 'basic', title: t('pages.basicInfo') },
    { key: 'assessment', title: t('pages.assessment') },
    { key: 'decision', title: t('pages.decision') },
    { key: 'payment', title: t('pages.payment') },
    { key: 'actions', title: t('pages.actions1') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      title={isEditing ? 'Edit Admission Enquiry' : 'New Admission Enquiry'}
      description={
        isEditing
          ? 'Update the admission enquiry details below.'
          : 'Capture the details of a new admission enquiry.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
            {isEditing ? 'Update' : 'Create Enquiry'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <MinimalTabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('pages.studentName2')}
              required
              placeholder={t('pages.enterStudentName')}
              value={form.studentName}
              onChange={(e) => setField('studentName', e.target.value)}
              error={errors.studentName}
            />
            <Input
              label={t('pages.dateOfBirth2')}
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setField('dateOfBirth', e.target.value)}
              max={`${new Date().getFullYear() - 1}-12-31`}
              error={errors.dateOfBirth}
            />
            <Input
              label="Parent/Guardian Name"
              required
              placeholder={t('pages.enterParentName')}
              value={form.parentName}
              onChange={(e) => setField('parentName', e.target.value)}
              error={errors.parentName}
            />
            <Input
              label={t('pages.phoneNumber')}
              required
              placeholder={t('pages.enter10DigitPhoneNumber')}
              value={form.phoneNumber}
              onChange={(e) =>
                setField('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              type="tel"
              inputMode="numeric"
              maxLength={10}
              error={errors.phoneNumber}
            />
            <Input
              label={t('pages.email1')}
              type="email"
              placeholder={t('pages.enterEmail')}
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={errors.email}
              wrapperClassName="sm:col-span-2"
            />
            <Select
              label={t('pages.classApplyingFor')}
              required
              placeholder={t('pages.selectClass1')}
              value={form.classApplyingFor}
              onChange={(e) => setField('classApplyingFor', e.target.value)}
              options={classOptions}
              error={errors.classApplyingFor}
            />
            {showHscGroup && (
              <Select
                label={t('pages.hSCGroupOptional')}
                placeholder={t('pages.selectGroupIfApplicable')}
                value={form.hscGroup}
                onChange={(e) => setField('hscGroup', e.target.value)}
                options={HSC_GROUP_OPTIONS}
                error={errors.hscGroup}
              />
            )}
            <Select
              label={t('pages.source')}
              placeholder={t('pages.selectSource')}
              value={form.source}
              onChange={(e) => setField('source', e.target.value)}
              options={SOURCE_OPTIONS}
            />
            <Select
              label={t('pages.status2')}
              placeholder={t('pages.selectStatus1')}
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
            />
          </div>
        )}

        {activeTab === 'assessment' && (
          <div className="space-y-4">
            <Checkbox
              checked={form.assessmentRequired}
              onChange={(e) => setField('assessmentRequired', e.target.checked)}
              label="Assessment Required"
            />
            {form.assessmentRequired && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label={t('pages.assignToTeacher')}
                  required
                  placeholder={t('pages.selectTeacher')}
                  value={form.assignedTeacher || ''}
                  onChange={(e) => setField('assignedTeacher', e.target.value)}
                  options={teacherOptions}
                  error={errors.assignedTeacher}
                />
                <Input
                  label={t('pages.testDate')}
                  type="date"
                  value={form.testDate}
                  onChange={(e) => setField('testDate', e.target.value)}
                  error={errors.testDate}
                />
                <Input
                  label={t('pages.testTime')}
                  type="time"
                  value={form.testTime}
                  onChange={(e) => setField('testTime', e.target.value)}
                />
                <Select
                  label={t('pages.testResult')}
                  placeholder={t('pages.selectResult')}
                  value={form.testResult}
                  onChange={(e) => setField('testResult', e.target.value)}
                  options={TEST_RESULT_OPTIONS}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'decision' && (
          <div className="grid grid-cols-1 gap-4">
            <Select
              label={t('pages.admissionDecision')}
              placeholder={t('pages.selectDecision')}
              value={form.admissionDecision}
              onChange={(e) => setField('admissionDecision', e.target.value)}
              options={DECISION_OPTIONS}
            />
            <Textarea
              label={t('pages.decisionRemarks')}
              placeholder={t('pages.enterRemarksOptional')}
              value={form.decisionRemarks}
              onChange={(e) => setField('decisionRemarks', e.target.value)}
              rows={4}
              error={errors.decisionRemarks}
            />
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('pages.paymentStatus')}
              placeholder={t('pages.selectPaymentStatus')}
              value={form.paymentStatus}
              onChange={(e) => setField('paymentStatus', e.target.value)}
              options={PAYMENT_STATUS_OPTIONS}
              wrapperClassName="sm:col-span-2"
            />
            {form.paymentStatus === 'paid' && (
              <>
                <Select
                  label={t('pages.paymentMode')}
                  placeholder={t('pages.selectPaymentMode')}
                  value={form.paymentMode}
                  onChange={(e) => setField('paymentMode', e.target.value)}
                  options={PAYMENT_MODE_OPTIONS}
                />
                <Input
                  label={t('pages.paymentAmount')}
                  placeholder={t('pages.enterAmount')}
                  type="number"
                  value={form.paymentAmount}
                  onChange={(e) => setField('paymentAmount', e.target.value)}
                />
                <Input
                  label={t('pages.paymentDate1')}
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setField('paymentDate', e.target.value)}
                  max={new Date().toLocaleDateString('en-CA')}
                />
                <Input
                  label={t('pages.transactionId')}
                  placeholder={t('pages.enterTransactionId')}
                  value={form.transactionId}
                  onChange={(e) => setField('transactionId', e.target.value)}
                />
              </>
            )}
            {form.paymentStatus === 'unpaid' && (
              <Alert
                variant="warning"
                title="Payment Pending"
                className="sm:col-span-2"
              >
                {t(
                  'pages.sendPaymentLinkOrCollectPaymentWhenAdmissionIsConfirmed'
                )}
              </Alert>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            <Alert variant="info" title="Send Admission Form Link">
              <div className="space-y-3">
                <p className="text-sm">
                  Send the admission form link to the parent&apos;s email or phone.
                </p>
                <Button
                  size="sm"
                  onClick={handleSendFormLink}
                  loading={isSendingLink}
                  disabled={isSendingLink}
                >
                  Send Form Link
                </Button>
              </div>
            </Alert>
            {form.status === 'fee-paid' ? (
              <Alert variant="success" title="Add as Student">
                <div className="space-y-3">
                  <p className="text-sm">
                    {t('pages.convertThisAdmissionInquiryToAStudentRecord')}
                  </p>
                  <Button size="sm" onClick={handleConvertToStudent}>
                    Add as New Student
                  </Button>
                </div>
              </Alert>
            ) : (
              <Alert variant="info" title="Add as Student">
                <div className="space-y-3">
                  <p className="text-sm">
                    {t('pages.admissionMustBeApprovedAndFeePaidBeforeAddingAsStudent')}
                  </p>
                  <Button size="sm" disabled variant="ghost">
                    Add as New Student
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}
      </form>
    </Modal>
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
