import { getDateLocale } from '../../../i18n/index';

/** Friendly display labels for entity types. */
export const TYPE_LABELS = {
  Student: 'Student',
  Staff: 'Staff',
  Class: 'Class',
  Exam: 'Exam',
  ExamSchedule: 'Exam Schedule',
  Homework: 'Homework',
  CBSEReportCard: 'CBSE Report Card',
  CCEConfig: 'CCE Config',
  FeeHead: 'Fee Head',
  FeeTemplate: 'Fee Template',
  FeeRefund: 'Fee Refund',
  FeeRule: 'Fee Rule',
  Announcement: 'Announcement',
  Admission: 'Admission',
  CallLog: 'Call Log',
  Feedback: 'Feedback',
  Appointment: 'Appointment',
  GatePass: 'Gate Pass',
  Visitor: 'Visitor',
  Asset: 'Asset',
  AssetCategory: 'Asset Category',
  Vendor: 'Vendor',
  MaintenanceLog: 'Maintenance Log',
  ProcurementRequest: 'Procurement',
  AssetAudit: 'Asset Audit',
  Hostel: 'Hostel',
  HostelRoom: 'Hostel Room',
  TransportRoute: 'Transport Route',
  Vehicle: 'Vehicle',
  Book: 'Book',
  IntakeForm: 'Intake Form',
  FormAssignment: 'Form Assignment',
  FormSubmission: 'Form Submission',
  EmailCampaign: 'Email Campaign',
  Coupon: 'Coupon',
  Changelog: 'Changelog',
  BulkCleanup: 'Bulk Cleanup',
};

/** Grouped type options for the filter dropdown. */
export const TYPE_GROUPS = [
  { label: 'Core', types: ['Student', 'Staff', 'Class'] },
  { label: 'Academic', types: ['Exam', 'ExamSchedule', 'Homework', 'CBSEReportCard', 'CCEConfig'] },
  { label: 'Financial', types: ['FeeHead', 'FeeTemplate', 'FeeRefund', 'FeeRule'] },
  { label: 'Operations', types: ['Announcement', 'GatePass', 'Visitor'] },
  { label: 'Front Desk', types: ['Admission', 'CallLog', 'Feedback', 'Appointment'] },
  { label: 'Inventory', types: ['Asset', 'AssetCategory', 'Vendor', 'MaintenanceLog', 'ProcurementRequest', 'AssetAudit'] },
  { label: 'Facilities', types: ['Hostel', 'HostelRoom', 'TransportRoute', 'Vehicle', 'Book'] },
  { label: 'Forms', types: ['IntakeForm', 'FormAssignment', 'FormSubmission'] },
  { label: 'Other', types: ['EmailCampaign', 'Coupon', 'Changelog', 'BulkCleanup'] },
];

/** Chip color for an entity type. */
export const getTypeColor = (type) => {
  const colors = {
    Student: "primary",
    Staff: "secondary",
    Class: "success",
    Exam: "warning",
    ExamSchedule: "warning",
    Homework: "warning",
    CBSEReportCard: "warning",
    CCEConfig: "warning",
    FeeHead: "danger",
    FeeTemplate: "danger",
    FeeRefund: "danger",
    FeeRule: "danger",
    Announcement: "primary",
    Admission: "secondary",
    CallLog: "secondary",
    Feedback: "secondary",
    Appointment: "secondary",
    GatePass: "secondary",
    Visitor: "secondary",
    Asset: "success",
    AssetCategory: "success",
    Vendor: "success",
    MaintenanceLog: "success",
    ProcurementRequest: "success",
    AssetAudit: "success",
    Hostel: "default",
    HostelRoom: "default",
    TransportRoute: "default",
    Vehicle: "default",
    Book: "default",
    IntakeForm: "primary",
    FormAssignment: "primary",
    FormSubmission: "primary",
    EmailCampaign: "warning",
    Coupon: "danger",
    Changelog: "default",
    BulkCleanup: "default",
  };
  return colors[type] || "default";
};

/** Chip color based on days remaining before permanent deletion. */
export const getExpiryColor = (days) => {
  if (days <= 3) return "danger";
  if (days <= 7) return "warning";
  return "success";
};

/** Days remaining until permanent deletion (Infinity when no expiry). */
export const getDaysRemaining = (expiresAt) => {
  if (!expiresAt) return Infinity;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/** Locale-aware date+time formatter for the trash table. */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
