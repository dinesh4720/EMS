/**
 * Front Desk shared constants — visitor + gate pass enums with UI labels.
 * Backend enum source-of-truth: EMS-backend/validators/frontDeskSchema.js
 */

export const VISITOR_REASONS = [
  { key: 'PARENT_MEETING', label: 'Parent Meeting', needsGatePass: true, needsAppointment: false, needsStudentMapping: true },
  { key: 'STUDENT_PICKUP_DROP_OFF', label: 'Student Pickup/Drop-off', needsGatePass: true, needsAppointment: false, needsStudentMapping: true },
  { key: 'SCHOOL_VISIT_INQUIRY', label: 'School Visit/Inquiry', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
  { key: 'DELIVERY_VENDOR', label: 'Delivery/Vendor', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
  { key: 'OFFICIAL_BUSINESS', label: 'Official Business', needsGatePass: false, needsAppointment: true, needsStudentMapping: false },
  { key: 'VOLUNTEER_EVENT', label: 'Volunteer/Event', needsGatePass: false, needsAppointment: true, needsStudentMapping: false },
  { key: 'OTHER', label: 'Other', needsGatePass: false, needsAppointment: false, needsStudentMapping: false },
];

export const GATE_PASS_REASONS = [
  { key: 'MEDICAL_EMERGENCY', label: 'Medical Emergency' },
  { key: 'FAMILY_EMERGENCY', label: 'Family Emergency' },
  { key: 'SPECIAL_EVENT', label: 'Special Event' },
  { key: 'EARLY_DISMISSAL', label: 'Early Dismissal' },
  { key: 'SUSPENSION_EXPULSION', label: 'Suspension/Expulsion' },
  { key: 'OTHER', label: 'Other' },
];

export const LEAVING_WITH_OPTIONS = [
  { key: 'PARENTS', label: 'Parents' },
  { key: 'OTHERS', label: 'Others (Specify Below)' },
];

export const APPROVED_BY_OPTIONS = [
  { key: 'CLASS_TEACHER', label: 'Class Teacher' },
  { key: 'FRONT_OFFICE', label: 'Front Office' },
  { key: 'PRINCIPAL', label: 'Principal' },
  { key: 'OTHER', label: 'Other' },
];

export const getVisitorReasonMeta = (key) =>
  VISITOR_REASONS.find((reason) => reason.key === key) || null;

export const getVisitorReasonLabel = (key) =>
  getVisitorReasonMeta(key)?.label || key || '';

export const getGatePassReasonLabel = (key) =>
  GATE_PASS_REASONS.find((reason) => reason.key === key)?.label || key || '';

export const getApprovedByLabel = (key) =>
  APPROVED_BY_OPTIONS.find((opt) => opt.key === key)?.label || (key ? key.replace(/_/g, ' ') : '');

const toOption = (item) => ({ value: item.key, label: item.label });

export const visitorReasonOptions = VISITOR_REASONS.map(toOption);
export const gatePassReasonOptions = GATE_PASS_REASONS.map(toOption);
export const leavingWithOptions = LEAVING_WITH_OPTIONS.map(toOption);
export const approvedByOptions = APPROVED_BY_OPTIONS.map(toOption);
