/**
 * Constants for the Admission Enquiries (Front Desk) module.
 * Status / source / payment values mirror backend admission schema and the
 * Zod schema in validators/frontDeskSchemas.js.
 */

export const STATUS_OPTIONS = [
  { value: 'inquiry-logged', label: 'Inquiry Logged', color: 'neutral' },
  { value: 'form-sent', label: 'Form Sent', color: 'info' },
  { value: 'form-submitted', label: 'Form Submitted', color: 'info' },
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

export const SOURCE_OPTIONS = [
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'call', label: 'Call' },
  { value: 'website', label: 'Website' },
  { value: 'reference', label: 'Reference' },
];

export const HSC_GROUP_OPTIONS = [
  { value: 'BIOLOGY', label: 'Biology' },
  { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  { value: 'COMMERCE', label: 'Commerce' },
];

export const PAYMENT_MODE_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'INCLUDED_IN_FORM', label: 'Included in form' },
];

export const TEST_RESULT_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'failed', label: 'Failed' },
];

export const DECISION_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
];

export const FALLBACK_CLASSES = [
  'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
];

export const getStatusMeta = (value) =>
  STATUS_OPTIONS.find((s) => s.value === value) || { label: value, color: 'neutral' };

/**
 * Coarse-grained admission stages used for the .seg filter strip and the
 * kanban tracker columns. Each fine-grained status (above) maps to exactly
 * one stage here. Tones map to .status--{ok|warn|danger|info} pills.
 */
export const STAGE_OPTIONS = [
  {
    key: 'inquiry',
    label: 'Inquiry',
    tone: 'info',
    statuses: ['inquiry-logged', 'form-sent'],
  },
  {
    key: 'visited',
    label: 'Visited',
    tone: 'info',
    statuses: ['form-submitted', 'documents-verified'],
  },
  {
    key: 'applied',
    label: 'Applied',
    tone: 'warn',
    statuses: ['test-scheduled', 'test-cleared', 'test-failed', 'test-no-show'],
  },
  {
    key: 'admitted',
    label: 'Admitted',
    tone: 'ok',
    statuses: ['admission-approved', 'fee-paid', 'student-admitted'],
  },
  {
    key: 'rejected',
    label: 'Rejected',
    tone: 'danger',
    statuses: ['admission-rejected'],
  },
];

export const stageOfStatus = (status) =>
  STAGE_OPTIONS.find((stage) => stage.statuses.includes(status))?.key || 'inquiry';

export const defaultStatusForStage = (stageKey) =>
  STAGE_OPTIONS.find((s) => s.key === stageKey)?.statuses?.[0] || 'inquiry-logged';

export const isHigherSecondary = (className) => {
  if (!className) return false;
  const lower = String(className).toLowerCase();
  return (
    lower.includes('hsc') ||
    lower.includes('12') ||
    lower.includes('11') ||
    lower.includes('10+2')
  );
};

export const emptyAdmissionForm = () => ({
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
