import type { Page } from '@playwright/test';

/* ═══════════════════════════════════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════════════════════════════════ */

export const ADMIN_ID      = '64b100000000000000000001';
export const TEACHER_A_ID  = '64b100000000000000000011';
export const TEACHER_B_ID  = '64b100000000000000000012';
export const ACCOUNTANT_ID = '64b100000000000000000013';
export const CLASS_10A_ID  = '64b100000000000000000101';
export const CLASS_11A_ID  = '64b100000000000000000102';
export const SCHOOL_ID     = '64b100000000000000000999';

/* ═══════════════════════════════════════════════════════════════════
 *  TYPES
 * ═══════════════════════════════════════════════════════════════════ */

export interface User {
  id: string; _id: string; name: string; email: string; role: string;
  token: string; schoolId: string; picture?: string; code?: string;
  employeeId?: string; permissions?: Record<string, boolean>;
}

export interface StaffMember {
  _id: string; id: string; name: string; email: string; phone: string;
  role: string; designation: string; department: string; status: string;
  joiningDate: string; schoolId: string; subjects?: string[];
  classTeacherOf?: string; employeeId?: string; salary?: number;
}

export interface ClassRecord {
  _id: string; id: string; name: string; section: string;
  classTeacherId: string; strengthLimit: { current: number; default: number };
  studentCount: number; attendance: number;
  averageAcademicPerformance: number; subjects: string[];
}

export interface StudentRecord {
  _id: string; id: string; name: string; classId: string;
  admissionId: string; rollNo: string; gender: string;
  dateOfBirth: string; email: string; phone: string;
  address: string; city: string; state: string; zipCode: string;
  feeStatus: string; status: string; schoolId: string;
  guardians: Array<{ name: string; relation: string; phone: string; email: string; occupation: string }>;
  documents?: Record<string, string>;
}

export interface ExamRecord {
  _id: string; id: string; name: string; classId: string;
  status: string; date: string; subjects: string[];
  schoolId: string;
}

export interface ResultRecord {
  _id: string; id: string; studentId: string; examId: string;
  subject: string; marks: number; maxMarks: number;
  grade: string; schoolId: string;
}

export interface AttendanceRecord {
  _id: string; id: string; studentId: string; classId: string;
  date: string; status: string; schoolId: string;
}

export interface RemarkRecord {
  _id: string; id: string; studentId: string; category: string;
  remark: string; date: string; schoolId: string;
}

export interface BookRecord {
  _id: string; id: string; title: string; author: string;
  isbn: string; category: string; totalCopies: number;
  availableCopies: number; status: string; schoolId: string;
}

export interface IssuedBookRecord {
  _id: string; id: string; bookId: string; studentId: string;
  issueDate: string; dueDate: string; returnDate: string | null;
  status: string; fine: number; schoolId: string;
}

export interface AnnouncementRecord {
  _id: string; id: string; title: string; content: string;
  status: string; date: string; schoolId: string;
}

export interface EmailCampaignRecord {
  _id: string; id: string; name: string; subject: string;
  status: string; targetGroup: string; sentCount: number;
  openRate: number; scheduledAt: string | null;
  targetClasses?: string[]; schoolId: string;
}

export interface ReminderRecord {
  _id: string; id: string; type: string; title: string;
  message: string; status: string; schoolId: string;
}

export interface AppointmentRecord {
  _id: string; id: string; visitorName: string; purpose: string;
  meetingWith: string; status: string; date: string; time: string;
  phoneNumber: string; notes: string; schoolId: string;
}

export interface CallLogRecord {
  _id: string; id: string; callerName: string; phoneNumber: string;
  purpose: string; title: string; callbackRequired: boolean;
  callbackDate: string | null; callbackTime: string | null;
  keyNotes: string; date: string; schoolId: string;
}

export interface FeedbackRecord {
  _id: string; id: string; name: string; category: string;
  source: string; status: string; date: string;
  response: string; schoolId: string;
}

export interface HostelRecord {
  _id: string; id: string; name: string; type: string;
  wardenName: string; wardenPhone: string;
  totalRooms: number; totalCapacity: number;
  occupancy: number; status: string; schoolId: string;
}

export interface HostelRoomRecord {
  _id: string; id: string; hostelId: string; roomNumber: string;
  floor: number; type: string; capacity: number;
  occupants: string[]; status: string; schoolId: string;
}

export interface HostelAllocationRecord {
  _id: string; id: string; hostelId: string; roomId: string;
  studentId: string; studentName: string; admissionNo: string;
  roomNumber: string; hostelName: string;
  startDate: string; monthlyFee: number; schoolId: string;
}

export interface InventoryAssetRecord {
  _id: string; id: string; name: string; category: string;
  assetTag: string; serialNumber: string; location: string;
  assignedTo: string; quantity: number; minimumQuantity: number;
  purchasePrice: number; condition: string; status: string;
  warrantyExpiry: string | null; schoolId: string;
}

export interface InventoryVendorRecord {
  _id: string; id: string; name: string; contactPerson: string;
  phone: string; email: string; category: string;
  isActive: boolean; schoolId: string;
}

export interface HomeworkRecord {
  _id: string; id: string; title: string; description: string;
  subject: string; classId: string; teacherId: string;
  status: string; dueDate: string;
  attachments: Array<{ name: string; url: string; type: string }>;
  submissions: number; schoolId: string;
}

export interface CalendarEventRecord {
  _id: string; id: string; title: string; type: string;
  date: string; startTime: string; endTime: string;
  description: string; schoolId: string;
}

export interface VisitorRecord {
  _id: string; id: string; name: string; phone: string;
  purpose: string; toMeet: string; status: string;
  checkInTime: string; checkOutTime: string | null; schoolId: string;
}

export interface GatePassRecord {
  _id: string; id: string; studentId: string; studentName: string;
  reason: string; status: string; issuedAt: string;
  approvedBy: string; schoolId: string;
}

export interface StaffAttendanceRecord {
  _id: string; id: string; staffId: string; date: string;
  status: string; schoolId: string;
}

export interface PayrollRunRecord {
  _id: string; id: string; month: string; year: number;
  status: string; totalAmount: number; processedCount: number;
  schoolId: string;
}

export interface ConversationRecord {
  _id: string; id: string; type: string;
  otherParticipant: { userId: string; name: string; avatar: string | null; online: boolean; lastSeen: string; userType: string };
  lastMessage: { content: string; type: string; timestamp: string };
  unreadCount: number;
  participants: Array<{ userId: string; name: string; userType: string }>;
}

export interface MockState {
  user: User;
  staff: StaffMember[];
  classes: ClassRecord[];
  students: StudentRecord[];
  exams: ExamRecord[];
  results: ResultRecord[];
  attendance: AttendanceRecord[];
  remarks: RemarkRecord[];
  books: BookRecord[];
  issuedBooks: IssuedBookRecord[];
  announcements: AnnouncementRecord[];
  emailCampaigns: EmailCampaignRecord[];
  reminders: ReminderRecord[];
  appointments: AppointmentRecord[];
  callLogs: CallLogRecord[];
  feedbacks: FeedbackRecord[];
  hostels: HostelRecord[];
  hostelRooms: HostelRoomRecord[];
  hostelAllocations: HostelAllocationRecord[];
  inventoryAssets: InventoryAssetRecord[];
  inventoryVendors: InventoryVendorRecord[];
  homework: HomeworkRecord[];
  calendarEvents: CalendarEventRecord[];
  visitors: VisitorRecord[];
  gatePasses: GatePassRecord[];
  staffAttendance: StaffAttendanceRecord[];
  payrollRuns: PayrollRunRecord[];
  conversations: ConversationRecord[];
  chatMessages: Record<string, unknown[]>;
  feeHeads: Array<Record<string, unknown>>;
  feeTemplates: Array<Record<string, unknown>>;
  classFeeStructures: Array<Record<string, unknown>>;
  studentFeeStructures: Map<string, Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  timetables: Array<Record<string, unknown>>;
  transportRoutes: Array<Record<string, unknown>>;
  transportVehicles: Array<Record<string, unknown>>;
  holidays: Array<Record<string, unknown>>;
  subjects: Array<Record<string, unknown>>;
  schoolSettings: Record<string, unknown>;
  requestLog: Set<string>;
  /* counters */
  studentCounter: number;
  examCounter: number;
  resultCounter: number;
  bookCounter: number;
  issuedBookCounter: number;
  announcementCounter: number;
  appointmentCounter: number;
  callLogCounter: number;
  feedbackCounter: number;
  hostelCounter: number;
  hostelRoomCounter: number;
  hostelAllocationCounter: number;
  inventoryAssetCounter: number;
  inventoryVendorCounter: number;
  homeworkCounter: number;
  calendarEventCounter: number;
  visitorCounter: number;
  gatePassCounter: number;
  emailCampaignCounter: number;
  reminderCounter: number;
  paymentCounter: number;
}

/* ═══════════════════════════════════════════════════════════════════
 *  ID HELPER
 * ═══════════════════════════════════════════════════════════════════ */

function objectId(prefix: string, counter: number): string {
  return `${prefix}${String(counter).padStart(6, '0')}`;
}

/* ═══════════════════════════════════════════════════════════════════
 *  createMockState
 * ═══════════════════════════════════════════════════════════════════ */

export function createMockState(): MockState {
  const user: User = {
    id: ADMIN_ID, _id: ADMIN_ID,
    name: 'Dinesh Admin', email: 'admin@schoolsync.test',
    role: 'admin', token: 'mock-jwt-token-admin',
    schoolId: SCHOOL_ID,
    permissions: {
      students: true, classes: true, staff: true, attendance: true,
      academics: true, fees: true, messaging: true, frontDesk: true,
      library: true, settings: true, analytics: true, reports: true,
      timetable: true, hostel: true, transport: true, inventory: true,
      homework: true, calendar: true, payroll: true, aiAssistant: true,
      superAdmin: false, intakeForms: true, dataTools: true,
    },
  };

  const staff: StaffMember[] = [
    {
      _id: TEACHER_A_ID, id: TEACHER_A_ID, name: 'Ananya Sharma',
      email: 'ananya@schoolsync.test', phone: '9876543210',
      role: 'teacher', designation: 'Senior Teacher', department: 'Science',
      status: 'active', joiningDate: '2023-06-15', schoolId: SCHOOL_ID,
      subjects: ['Mathematics', 'Science'], classTeacherOf: CLASS_10A_ID,
      employeeId: 'EMP-001', salary: 45000,
    },
    {
      _id: TEACHER_B_ID, id: TEACHER_B_ID, name: 'Ravi Menon',
      email: 'ravi@schoolsync.test', phone: '9876543211',
      role: 'teacher', designation: 'Teacher', department: 'Arts',
      status: 'active', joiningDate: '2024-01-10', schoolId: SCHOOL_ID,
      subjects: ['English', 'Social Studies'], classTeacherOf: CLASS_11A_ID,
      employeeId: 'EMP-002', salary: 40000,
    },
    {
      _id: ACCOUNTANT_ID, id: ACCOUNTANT_ID, name: 'Priya Menon',
      email: 'priya@schoolsync.test', phone: '9876543212',
      role: 'accountant', designation: 'Accountant', department: 'Finance',
      status: 'active', joiningDate: '2024-03-01', schoolId: SCHOOL_ID,
      employeeId: 'EMP-003', salary: 35000,
    },
  ];

  const classes: ClassRecord[] = [
    {
      _id: CLASS_10A_ID, id: CLASS_10A_ID, name: '10', section: 'A',
      classTeacherId: TEACHER_A_ID,
      strengthLimit: { current: 40, default: 40 },
      studentCount: 0, attendance: 0, averageAcademicPerformance: 0,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
    },
    {
      _id: CLASS_11A_ID, id: CLASS_11A_ID, name: '11', section: 'A',
      classTeacherId: TEACHER_B_ID,
      strengthLimit: { current: 40, default: 40 },
      studentCount: 0, attendance: 0, averageAcademicPerformance: 0,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
    },
  ];

  return {
    user,
    staff,
    classes,
    students: [],
    exams: [],
    results: [],
    attendance: [],
    remarks: [],
    books: [],
    issuedBooks: [],
    announcements: [],
    emailCampaigns: [],
    reminders: [],
    appointments: [],
    callLogs: [],
    feedbacks: [],
    hostels: [],
    hostelRooms: [],
    hostelAllocations: [],
    inventoryAssets: [],
    inventoryVendors: [],
    homework: [],
    calendarEvents: [],
    visitors: [],
    gatePasses: [],
    staffAttendance: [],
    payrollRuns: [],
    conversations: [],
    chatMessages: {},
    feeHeads: [
      { _id: 'fh-tuition', id: 'fh-tuition', name: 'Tuition Fee', type: 'tuition', amount: 5000, schoolId: SCHOOL_ID },
      { _id: 'fh-transport', id: 'fh-transport', name: 'Transport Fee', type: 'transport', amount: 2000, schoolId: SCHOOL_ID },
    ],
    feeTemplates: [],
    classFeeStructures: [],
    studentFeeStructures: new Map(),
    payments: [],
    timetables: [],
    transportRoutes: [],
    transportVehicles: [],
    holidays: [
      { _id: 'hol-1', name: 'Republic Day', date: '2026-01-26', type: 'national' },
      { _id: 'hol-2', name: 'Holi', date: '2026-03-14', type: 'festival' },
    ],
    subjects: [
      { _id: 'sub-math', name: 'Mathematics', code: 'MATH' },
      { _id: 'sub-sci', name: 'Science', code: 'SCI' },
      { _id: 'sub-eng', name: 'English', code: 'ENG' },
      { _id: 'sub-ss', name: 'Social Studies', code: 'SS' },
    ],
    schoolSettings: {
      schoolName: 'SchoolSync Demo School',
      academicYear: '2025-2026',
      academicYearStart: '2025-06-01',
      academicYearEnd: '2026-05-31',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      language: 'en',
      attendanceType: 'daily',
      gradingSystem: 'percentage',
    },
    requestLog: new Set(),
    studentCounter: 0, examCounter: 0, resultCounter: 0, bookCounter: 0,
    issuedBookCounter: 0, announcementCounter: 0, appointmentCounter: 0,
    callLogCounter: 0, feedbackCounter: 0, hostelCounter: 0,
    hostelRoomCounter: 0, hostelAllocationCounter: 0,
    inventoryAssetCounter: 0, inventoryVendorCounter: 0,
    homeworkCounter: 0, calendarEventCounter: 0, visitorCounter: 0,
    gatePassCounter: 0, emailCampaignCounter: 0, reminderCounter: 0,
    paymentCounter: 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════
 *  SEED FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════ */

export function seedStudent(
  state: MockState,
  overrides: Partial<StudentRecord> & { feeStatus?: string } = {},
): StudentRecord {
  state.studentCounter++;
  const id = overrides.id || objectId('stu-', state.studentCounter);
  const student: StudentRecord = {
    _id: id, id,
    name: overrides.name || `Student ${state.studentCounter}`,
    classId: overrides.classId || CLASS_10A_ID,
    admissionId: overrides.admissionId || `ADM-${String(state.studentCounter).padStart(4, '0')}`,
    rollNo: overrides.rollNo || String(state.studentCounter),
    gender: overrides.gender || 'Male',
    dateOfBirth: overrides.dateOfBirth || '2011-08-14',
    email: overrides.email || `student${state.studentCounter}@test.com`,
    phone: overrides.phone || `98765${String(state.studentCounter).padStart(5, '0')}`,
    address: overrides.address || '123 School Street',
    city: overrides.city || 'Bangalore',
    state: overrides.state || 'Karnataka',
    zipCode: overrides.zipCode || '560001',
    feeStatus: overrides.feeStatus || 'pending',
    status: overrides.status || 'active',
    schoolId: SCHOOL_ID,
    guardians: overrides.guardians || [{
      name: `Parent of Student ${state.studentCounter}`,
      relation: 'father', phone: `91000${String(state.studentCounter).padStart(5, '0')}`,
      email: `parent${state.studentCounter}@test.com`, occupation: 'Engineer',
    }],
  };
  state.students.push(student);
  // Update class student count
  const cls = state.classes.find((c) => c.id === student.classId);
  if (cls) cls.studentCount++;
  return student;
}

export function seedStudentWithFees(
  state: MockState,
  overrides: Partial<StudentRecord> & { feeStatus?: string } = {},
): StudentRecord {
  const student = seedStudent(state, overrides);
  // Auto-create a basic fee structure for this student
  state.studentFeeStructures.set(student.id, {
    _id: `sfs-${student.id}`, studentId: student.id,
    totalFee: 7000, paidAmount: student.feeStatus === 'paid' ? 7000 : student.feeStatus === 'overdue' ? 0 : 2000,
    balanceAmount: student.feeStatus === 'paid' ? 0 : student.feeStatus === 'overdue' ? 7000 : 5000,
    status: student.feeStatus || 'pending', schoolId: SCHOOL_ID,
  });
  return student;
}

export function seedAttendanceForClass(
  state: MockState,
  classId: string,
  date: string,
  overrides: Record<string, string> = {},
): void {
  const classStudents = state.students.filter((s) => s.classId === classId);
  for (const s of classStudents) {
    const status = overrides[s.id] || 'present';
    state.attendance.push({
      _id: `att-${s.id}-${date}`, id: `att-${s.id}-${date}`,
      studentId: s.id, classId, date, status, schoolId: SCHOOL_ID,
    });
  }
}

export function seedExam(
  state: MockState,
  overrides: Partial<ExamRecord> = {},
): ExamRecord {
  state.examCounter++;
  const id = overrides.id || objectId('exam-', state.examCounter);
  const exam: ExamRecord = {
    _id: id, id,
    name: overrides.name || `Exam ${state.examCounter}`,
    classId: overrides.classId || CLASS_10A_ID,
    status: overrides.status || 'scheduled',
    date: overrides.date || '2026-04-01',
    subjects: overrides.subjects || ['Mathematics', 'Science', 'English'],
    schoolId: SCHOOL_ID,
  };
  state.exams.push(exam);
  return exam;
}

export function seedResult(
  state: MockState,
  studentId: string,
  examId: string,
  subject: string,
  marks: number,
  maxMarks = 100,
): ResultRecord {
  state.resultCounter++;
  const id = objectId('res-', state.resultCounter);
  const grade = marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B+' : marks >= 60 ? 'B' : marks >= 50 ? 'C' : 'F';
  const result: ResultRecord = {
    _id: id, id, studentId, examId, subject, marks, maxMarks, grade, schoolId: SCHOOL_ID,
  };
  state.results.push(result);
  return result;
}

export function seedBook(
  state: MockState,
  overrides: Partial<BookRecord> = {},
): BookRecord {
  state.bookCounter++;
  const id = overrides.id || objectId('book-', state.bookCounter);
  const book: BookRecord = {
    _id: id, id,
    title: overrides.title || `Book ${state.bookCounter}`,
    author: overrides.author || 'Unknown Author',
    isbn: overrides.isbn || `978-00-0000-${String(state.bookCounter).padStart(3, '0')}-0`,
    category: overrides.category || 'General',
    totalCopies: overrides.totalCopies ?? 10,
    availableCopies: overrides.availableCopies ?? 10,
    status: overrides.status || 'available',
    schoolId: SCHOOL_ID,
  };
  state.books.push(book);
  return book;
}

export function seedIssuedBook(
  state: MockState,
  bookId: string,
  studentId: string,
  overrides: Partial<IssuedBookRecord> = {},
): IssuedBookRecord {
  state.issuedBookCounter++;
  const id = objectId('iss-', state.issuedBookCounter);
  const record: IssuedBookRecord = {
    _id: id, id, bookId, studentId,
    issueDate: overrides.issueDate || '2026-03-01',
    dueDate: overrides.dueDate || '2026-03-28',
    returnDate: overrides.returnDate || null,
    status: overrides.status || 'issued',
    fine: overrides.fine ?? 0,
    schoolId: SCHOOL_ID,
  };
  state.issuedBooks.push(record);
  return record;
}

export function seedAnnouncement(
  state: MockState,
  overrides: Partial<AnnouncementRecord> = {},
): AnnouncementRecord {
  state.announcementCounter++;
  const id = objectId('ann-', state.announcementCounter);
  const record: AnnouncementRecord = {
    _id: id, id,
    title: overrides.title || `Announcement ${state.announcementCounter}`,
    content: overrides.content || 'Announcement content here',
    status: overrides.status || 'sent',
    date: overrides.date || new Date().toISOString(),
    schoolId: SCHOOL_ID,
  };
  state.announcements.push(record);
  return record;
}

export function seedEmailCampaign(
  state: MockState,
  overrides: Partial<EmailCampaignRecord> = {},
): EmailCampaignRecord {
  state.emailCampaignCounter++;
  const id = objectId('ec-', state.emailCampaignCounter);
  const record: EmailCampaignRecord = {
    _id: id, id,
    name: overrides.name || `Campaign ${state.emailCampaignCounter}`,
    subject: overrides.subject || 'Campaign subject',
    status: overrides.status || 'draft',
    targetGroup: overrides.targetGroup || 'all_parents',
    sentCount: overrides.sentCount ?? 0,
    openRate: overrides.openRate ?? 0,
    scheduledAt: overrides.scheduledAt || null,
    targetClasses: overrides.targetClasses,
    schoolId: SCHOOL_ID,
  };
  state.emailCampaigns.push(record);
  return record;
}

export function seedReminder(
  state: MockState,
  overrides: Partial<ReminderRecord> = {},
): ReminderRecord {
  state.reminderCounter++;
  const id = objectId('rem-', state.reminderCounter);
  const record: ReminderRecord = {
    _id: id, id,
    type: overrides.type || 'general',
    title: overrides.title || `Reminder ${state.reminderCounter}`,
    message: overrides.message || 'Reminder message',
    status: overrides.status || 'pending',
    schoolId: SCHOOL_ID,
  };
  state.reminders.push(record);
  return record;
}

export function seedAppointment(
  state: MockState,
  overrides: Partial<AppointmentRecord> = {},
): AppointmentRecord {
  state.appointmentCounter++;
  const id = objectId('apt-', state.appointmentCounter);
  const record: AppointmentRecord = {
    _id: id, id,
    visitorName: overrides.visitorName || `Visitor ${state.appointmentCounter}`,
    purpose: overrides.purpose || 'General Meeting',
    meetingWith: overrides.meetingWith || 'Admin',
    status: overrides.status || 'scheduled',
    date: overrides.date || new Date().toISOString().split('T')[0],
    time: overrides.time || '10:00',
    phoneNumber: overrides.phoneNumber || `98765${String(state.appointmentCounter).padStart(5, '0')}`,
    notes: overrides.notes || '',
    schoolId: SCHOOL_ID,
  };
  state.appointments.push(record);
  return record;
}

export function seedCallLog(
  state: MockState,
  overrides: Partial<CallLogRecord> = {},
): CallLogRecord {
  state.callLogCounter++;
  const id = objectId('cl-', state.callLogCounter);
  const record: CallLogRecord = {
    _id: id, id,
    callerName: overrides.callerName || `Caller ${state.callLogCounter}`,
    phoneNumber: overrides.phoneNumber || `98765${String(state.callLogCounter).padStart(5, '0')}`,
    purpose: overrides.purpose || 'GENERAL',
    title: overrides.title || '',
    callbackRequired: overrides.callbackRequired ?? false,
    callbackDate: overrides.callbackDate || null,
    callbackTime: overrides.callbackTime || null,
    keyNotes: overrides.keyNotes || '',
    date: overrides.date || new Date().toISOString(),
    schoolId: SCHOOL_ID,
  };
  state.callLogs.push(record);
  return record;
}

export function seedFeedback(
  state: MockState,
  overrides: Partial<FeedbackRecord> = {},
): FeedbackRecord {
  state.feedbackCounter++;
  const id = objectId('fb-', state.feedbackCounter);
  const record: FeedbackRecord = {
    _id: id, id,
    name: overrides.name || `Feedback Author ${state.feedbackCounter}`,
    category: overrides.category || 'GENERAL',
    source: overrides.source || 'WALK_IN',
    status: overrides.status || 'open',
    date: overrides.date || new Date().toISOString().split('T')[0],
    response: overrides.response || '',
    schoolId: SCHOOL_ID,
  };
  state.feedbacks.push(record);
  return record;
}

export function seedHostel(
  state: MockState,
  overrides: Partial<HostelRecord> = {},
): HostelRecord {
  state.hostelCounter++;
  const id = overrides.id || objectId('hostel-', state.hostelCounter);
  const record: HostelRecord = {
    _id: id, id,
    name: overrides.name || `Hostel ${state.hostelCounter}`,
    type: overrides.type || 'boys',
    wardenName: overrides.wardenName || 'Mr. Warden',
    wardenPhone: overrides.wardenPhone || '9100000000',
    totalRooms: overrides.totalRooms ?? 10,
    totalCapacity: overrides.totalCapacity ?? 40,
    occupancy: overrides.occupancy ?? 0,
    status: overrides.status || 'active',
    schoolId: SCHOOL_ID,
  };
  state.hostels.push(record);
  return record;
}

export function seedHostelRoom(
  state: MockState,
  hostelId: string,
  overrides: Partial<HostelRoomRecord> = {},
): HostelRoomRecord {
  state.hostelRoomCounter++;
  const id = objectId('hroom-', state.hostelRoomCounter);
  const record: HostelRoomRecord = {
    _id: id, id, hostelId,
    roomNumber: overrides.roomNumber || `R${state.hostelRoomCounter}`,
    floor: overrides.floor ?? 1,
    type: overrides.type || 'double',
    capacity: overrides.capacity ?? 2,
    occupants: overrides.occupants || [],
    status: overrides.status || 'available',
    schoolId: SCHOOL_ID,
  };
  state.hostelRooms.push(record);
  return record;
}

export function seedHostelAllocation(
  state: MockState,
  overrides: Partial<HostelAllocationRecord> = {},
): HostelAllocationRecord {
  state.hostelAllocationCounter++;
  const id = objectId('halloc-', state.hostelAllocationCounter);
  const record: HostelAllocationRecord = {
    _id: id, id,
    hostelId: overrides.hostelId || '',
    roomId: overrides.roomId || '',
    studentId: overrides.studentId || '',
    studentName: overrides.studentName || '',
    admissionNo: overrides.admissionNo || '',
    roomNumber: overrides.roomNumber || '',
    hostelName: overrides.hostelName || '',
    startDate: overrides.startDate || new Date().toISOString().split('T')[0],
    monthlyFee: overrides.monthlyFee ?? 5000,
    schoolId: SCHOOL_ID,
  };
  state.hostelAllocations.push(record);
  return record;
}

export function seedInventoryAsset(
  state: MockState,
  overrides: Partial<InventoryAssetRecord> = {},
): InventoryAssetRecord {
  state.inventoryAssetCounter++;
  const id = overrides.id || objectId('inv-', state.inventoryAssetCounter);
  const record: InventoryAssetRecord = {
    _id: id, id,
    name: overrides.name || `Asset ${state.inventoryAssetCounter}`,
    category: overrides.category || 'GENERAL',
    assetTag: overrides.assetTag || `TAG-${state.inventoryAssetCounter}`,
    serialNumber: overrides.serialNumber || '',
    location: overrides.location || 'Store Room',
    assignedTo: overrides.assignedTo || '',
    quantity: overrides.quantity ?? 1,
    minimumQuantity: overrides.minimumQuantity ?? 1,
    purchasePrice: overrides.purchasePrice ?? 1000,
    condition: overrides.condition || 'GOOD',
    status: overrides.status || 'ACTIVE',
    warrantyExpiry: overrides.warrantyExpiry || null,
    schoolId: SCHOOL_ID,
  };
  state.inventoryAssets.push(record);
  return record;
}

export function seedInventoryVendor(
  state: MockState,
  overrides: Partial<InventoryVendorRecord> = {},
): InventoryVendorRecord {
  state.inventoryVendorCounter++;
  const id = objectId('vendor-', state.inventoryVendorCounter);
  const record: InventoryVendorRecord = {
    _id: id, id,
    name: overrides.name || `Vendor ${state.inventoryVendorCounter}`,
    contactPerson: overrides.contactPerson || 'Contact Person',
    phone: overrides.phone || `98765${String(state.inventoryVendorCounter).padStart(5, '0')}`,
    email: overrides.email || `vendor${state.inventoryVendorCounter}@test.com`,
    category: overrides.category || 'General',
    isActive: overrides.isActive ?? true,
    schoolId: SCHOOL_ID,
  };
  state.inventoryVendors.push(record);
  return record;
}

export function seedHomework(
  state: MockState,
  overrides: Partial<HomeworkRecord> = {},
): HomeworkRecord {
  state.homeworkCounter++;
  const id = objectId('hw-', state.homeworkCounter);
  const record: HomeworkRecord = {
    _id: id, id,
    title: overrides.title || `Homework ${state.homeworkCounter}`,
    description: overrides.description || 'Complete the exercises',
    subject: overrides.subject || 'Mathematics',
    classId: overrides.classId || CLASS_10A_ID,
    teacherId: overrides.teacherId || TEACHER_A_ID,
    status: overrides.status || 'active',
    dueDate: overrides.dueDate || '2026-03-28T23:59:59.000Z',
    attachments: overrides.attachments || [],
    submissions: overrides.submissions ?? 0,
    schoolId: SCHOOL_ID,
  };
  state.homework.push(record);
  return record;
}

export function seedCalendarEvent(
  state: MockState,
  overrides: Partial<CalendarEventRecord> = {},
): CalendarEventRecord {
  state.calendarEventCounter++;
  const id = objectId('evt-', state.calendarEventCounter);
  const record: CalendarEventRecord = {
    _id: id, id,
    title: overrides.title || `Event ${state.calendarEventCounter}`,
    type: overrides.type || 'event',
    date: overrides.date || new Date().toISOString().split('T')[0],
    startTime: overrides.startTime || '09:00',
    endTime: overrides.endTime || '10:00',
    description: overrides.description || '',
    schoolId: SCHOOL_ID,
  };
  state.calendarEvents.push(record);
  return record;
}

export function seedBulkImportJobs(state: MockState): void {
  // no-op placeholder for bulk import seed
}

/* ═══════════════════════════════════════════════════════════════════
 *  installMockApi
 * ═══════════════════════════════════════════════════════════════════ */

export async function installMockApi(page: Page, state: MockState): Promise<void> {
  // Set up authenticated session in browser storage
  await page.addInitScript((u: string) => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('owlinTrackerEnabled', 'false');
    sessionStorage.setItem('app_user', u);
  }, JSON.stringify(state.user));

  // Intercept all API calls
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();

    // Log the request
    state.requestLog.add(`${method} /api${path}`);

    let body: Record<string, unknown> | null = null;
    try { body = method !== 'GET' ? JSON.parse(route.request().postData() || '{}') : null; } catch { /* */ }

    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    const jsonList = (items: unknown[]) =>
      json({ data: items, total: items.length, page: 1, limit: 100 });

    /* ── Auth ── */
    if (path === '/auth/session')    return json(state.user);
    if (path === '/auth/login')      return json({ ...state.user, token: state.user.token });
    if (path === '/auth/logout')     return json({ message: 'Logged out' });
    if (path === '/auth/2fa/verify') return json({ ...state.user, token: state.user.token });

    /* ── Students ── */
    if (path === '/students' && method === 'GET') return jsonList(state.students);
    if (path.match(/^\/students\/([^/]+)$/) && method === 'GET') {
      const id = path.split('/')[2];
      const student = state.students.find((s) => s.id === id);
      return student ? json(student) : json({ error: 'Not found' }, 404);
    }
    if (path === '/students' && method === 'POST') {
      const s = seedStudent(state, body as Partial<StudentRecord>);
      return json(s, 201);
    }
    if (path.match(/^\/students\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const idx = state.students.findIndex((s) => s.id === id);
      if (idx >= 0) { Object.assign(state.students[idx], body); return json(state.students[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/students\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      state.students = state.students.filter((s) => s.id !== id);
      return json({ message: 'Deleted' });
    }
    if (path.match(/^\/students\/([^/]+)\/remarks/))   return json(state.remarks.filter((r) => r.studentId === path.split('/')[2]));
    if (path.match(/^\/students\/([^/]+)\/attendance/)) return json(state.attendance.filter((a) => a.studentId === path.split('/')[2]));
    if (path.match(/^\/students\/([^/]+)\/results/))    return json(state.results.filter((r) => r.studentId === path.split('/')[2]));
    if (path.match(/^\/students\/([^/]+)\/ratings/))    return json({ ratings: { academics: 4, discipline: 3, attendance: 5, sports: 3, arts: 4 } });
    if (path.match(/^\/students\/([^/]+)\/documents/))  return json({ documents: {} });
    if (path.match(/^\/students\/([^/]+)\/certificates/)) return json({ certificates: [] });
    if (path.match(/^\/students\/([^/]+)\/fees/)) {
      const id = path.split('/')[2];
      const fs = state.studentFeeStructures.get(id);
      return json(fs || { totalFee: 0, paidAmount: 0, balanceAmount: 0, status: 'pending' });
    }

    /* ── Classes ── */
    if (path === '/classes' && method === 'GET') return jsonList(state.classes);
    if (path.match(/^\/classes\/([^/]+)$/) && method === 'GET') {
      const id = path.split('/')[2];
      const cls = state.classes.find((c) => c.id === id);
      return cls ? json(cls) : json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/classes\/([^/]+)\/students/)) {
      const id = path.split('/')[2];
      return jsonList(state.students.filter((s) => s.classId === id));
    }
    if (path.match(/^\/classes\/([^/]+)\/attendance/)) {
      const id = path.split('/')[2];
      return json(state.attendance.filter((a) => a.classId === id));
    }
    if (path.match(/^\/classes\/([^/]+)\/timetable/)) {
      const id = path.split('/')[2];
      const tt = state.timetables.find((t: Record<string, unknown>) => t.classId === id);
      return json(tt || { classId: id, periods: [], schedule: {} });
    }

    /* ── Staff ── */
    if (path === '/staff' && method === 'GET')  return jsonList(state.staff);
    if (path.match(/^\/staff\/([^/]+)$/) && method === 'GET') {
      const id = path.split('/')[2];
      const s = state.staff.find((st) => st.id === id);
      return s ? json(s) : json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/staff\/([^/]+)\/attendance/)) return json(state.staffAttendance.filter((a) => a.staffId === path.split('/')[2]));
    if (path.match(/^\/staff\/([^/]+)\/timetable/))  return json({ timetable: [] });
    if (path.match(/^\/staff\/([^/]+)\/assignments/)) return json({ assignments: [] });

    /* ── Attendance ── */
    if (path === '/attendance' && method === 'GET')  return json(state.attendance);
    if (path === '/attendance' && method === 'POST') return json({ message: 'Saved' }, 201);
    if (path.match(/^\/attendance\/class\//))        return json(state.attendance.filter((a) => a.classId === path.split('/')[3]));
    if (path === '/staff-attendance')                return json(state.staffAttendance);

    /* ── Exams / Results ── */
    if (path === '/exams' && method === 'GET')  return jsonList(state.exams);
    if (path.match(/^\/exams\/([^/]+)$/) && method === 'GET') {
      const id = path.split('/')[2];
      const e = state.exams.find((ex) => ex.id === id);
      return e ? json(e) : json({ error: 'Not found' }, 404);
    }
    if (path === '/exams' && method === 'POST') {
      const e = seedExam(state, body as Partial<ExamRecord>);
      return json(e, 201);
    }
    if (path === '/results' && method === 'GET')  return json(state.results);
    if (path.match(/^\/results\/exam\//))         return json(state.results.filter((r) => r.examId === path.split('/')[3]));

    /* ── Fees ── */
    if (path === '/fee-heads')        return json(state.feeHeads);
    if (path === '/fee-structures')   return json(state.classFeeStructures);
    if (path === '/fee-templates')    return json(state.feeTemplates);
    if (path.match(/^\/student-fees/)) {
      const id = path.split('/')[2];
      if (id) {
        const fs = state.studentFeeStructures.get(id);
        return json(fs || { totalFee: 0, paidAmount: 0, balanceAmount: 0, status: 'pending' });
      }
      return json([...state.studentFeeStructures.values()]);
    }
    if (path === '/fees' || path === '/fee-payments')  return json(state.payments);
    if (path === '/fee-settings')     return json({ lateFeeEnabled: false, lateFeeAmount: 50, gracePeriodDays: 7 });

    /* ── Announcements & Messaging ── */
    if (path === '/announcements' && method === 'GET')  return jsonList(state.announcements);
    if (path === '/announcements' && method === 'POST') {
      const a = seedAnnouncement(state, body as Partial<AnnouncementRecord>);
      return json(a, 201);
    }
    if (path === '/email-campaigns')     return jsonList(state.emailCampaigns);
    if (path === '/reminders')           return jsonList(state.reminders);
    if (path === '/reminder-templates')  return json([]);
    if (path === '/email-templates')     return json([]);
    if (path === '/sms-templates')       return json([]);
    if (path === '/conversations')       return json(state.conversations);
    if (path.match(/^\/conversations\/([^/]+)\/messages/)) {
      const convId = path.split('/')[2];
      return json(state.chatMessages[convId] || []);
    }
    if (path === '/messages')            return json([]);

    /* ── Front Desk ── */
    if (path === '/visitors')       return jsonList(state.visitors);
    if (path === '/gate-passes')    return jsonList(state.gatePasses);
    if (path === '/appointments' && method === 'GET')  return jsonList(state.appointments);
    if (path === '/appointments' && method === 'POST') {
      const a = seedAppointment(state, body as Partial<AppointmentRecord>);
      return json(a, 201);
    }
    if (path.match(/^\/appointments\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const idx = state.appointments.findIndex((a) => a.id === id);
      if (idx >= 0) { Object.assign(state.appointments[idx], body); return json(state.appointments[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/appointments\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      state.appointments = state.appointments.filter((a) => a.id !== id);
      return json({ message: 'Deleted' });
    }
    if (path === '/call-logs' && method === 'GET')  return jsonList(state.callLogs);
    if (path === '/call-logs' && method === 'POST') {
      const c = seedCallLog(state, body as Partial<CallLogRecord>);
      return json(c, 201);
    }
    if (path === '/feedbacks' && method === 'GET')  return jsonList(state.feedbacks);
    if (path === '/feedbacks' && method === 'POST') {
      const f = seedFeedback(state, body as Partial<FeedbackRecord>);
      return json(f, 201);
    }
    if (path.match(/^\/feedbacks\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const idx = state.feedbacks.findIndex((f) => f.id === id);
      if (idx >= 0) { Object.assign(state.feedbacks[idx], body); return json(state.feedbacks[idx]); }
      return json({ error: 'Not found' }, 404);
    }

    /* ── Library ── */
    if (path === '/library/books' && method === 'GET')  return jsonList(state.books);
    if (path === '/library/books' && method === 'POST') {
      const b = seedBook(state, body as Partial<BookRecord>);
      return json(b, 201);
    }
    if (path.match(/^\/library\/books\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[3];
      const idx = state.books.findIndex((b) => b.id === id);
      if (idx >= 0) { Object.assign(state.books[idx], body); return json(state.books[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/library\/books\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      state.books = state.books.filter((b) => b.id !== id);
      return json({ message: 'Deleted' });
    }
    if (path === '/library/issued' || path === '/library/issues') return jsonList(state.issuedBooks);
    if (path.match(/^\/library\/issue/i) && method === 'POST') {
      const ib = seedIssuedBook(state, (body as Record<string, string>).bookId, (body as Record<string, string>).studentId, body as Partial<IssuedBookRecord>);
      return json(ib, 201);
    }
    if (path.match(/^\/library\/return/i) && method === 'POST') {
      const bookId = (body as Record<string, string>).issuedBookId;
      const idx = state.issuedBooks.findIndex((ib) => ib.id === bookId);
      if (idx >= 0) { state.issuedBooks[idx].status = 'returned'; state.issuedBooks[idx].returnDate = new Date().toISOString(); }
      return json({ message: 'Returned' });
    }
    if (path === '/library/stats') return json({ totalBooks: state.books.length, totalIssued: state.issuedBooks.filter((ib) => ib.status === 'issued').length, overdue: state.issuedBooks.filter((ib) => ib.status === 'overdue').length });

    /* ── Hostels ── */
    if (path === '/hostels' && method === 'GET')  return jsonList(state.hostels);
    if (path === '/hostels' && method === 'POST') {
      const h = seedHostel(state, body as Partial<HostelRecord>);
      return json(h, 201);
    }
    if (path.match(/^\/hostels\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const idx = state.hostels.findIndex((h) => h.id === id);
      if (idx >= 0) { Object.assign(state.hostels[idx], body); return json(state.hostels[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/hostels\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      state.hostels = state.hostels.filter((h) => h.id !== id);
      return json({ message: 'Deleted' });
    }
    if (path === '/hostel-rooms' || path.match(/^\/hostels\/([^/]+)\/rooms/)) {
      if (method === 'POST') {
        const hostelId = path.includes('/rooms') ? path.split('/')[2] : (body as Record<string, string>).hostelId;
        const r = seedHostelRoom(state, hostelId, body as Partial<HostelRoomRecord>);
        return json(r, 201);
      }
      const hostelId = path.includes('/rooms') ? path.split('/')[2] : null;
      return jsonList(hostelId ? state.hostelRooms.filter((r) => r.hostelId === hostelId) : state.hostelRooms);
    }
    if (path === '/hostel-allocations') {
      if (method === 'POST') {
        const a = seedHostelAllocation(state, body as Partial<HostelAllocationRecord>);
        return json(a, 201);
      }
      return jsonList(state.hostelAllocations);
    }

    /* ── Inventory ── */
    if (path === '/inventory/assets' && method === 'GET')  return jsonList(state.inventoryAssets);
    if (path === '/inventory/assets' && method === 'POST') {
      const a = seedInventoryAsset(state, body as Partial<InventoryAssetRecord>);
      return json(a, 201);
    }
    if (path.match(/^\/inventory\/assets\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[3];
      const idx = state.inventoryAssets.findIndex((a) => a.id === id);
      if (idx >= 0) { Object.assign(state.inventoryAssets[idx], body); return json(state.inventoryAssets[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/inventory\/assets\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      state.inventoryAssets = state.inventoryAssets.filter((a) => a.id !== id);
      return json({ message: 'Deleted' });
    }
    if (path === '/inventory/vendors' && method === 'GET')  return jsonList(state.inventoryVendors);
    if (path === '/inventory/vendors' && method === 'POST') {
      const v = seedInventoryVendor(state, body as Partial<InventoryVendorRecord>);
      return json(v, 201);
    }
    if (path === '/inventory/maintenance')  return json({ data: [], total: 0 });
    if (path === '/inventory/procurement')  return json({ data: [], total: 0 });
    if (path === '/inventory/audits')       return json({ data: [], total: 0 });
    if (path === '/inventory/reports')      return json({ totals: { totalItems: 0, totalPurchaseValue: 0, totalCurrentValue: 0 }, categoryBreakdown: [], conditionSummary: [] });

    /* ── Homework ── */
    if (path === '/homework' && method === 'GET')  return jsonList(state.homework);
    if (path === '/homework' && method === 'POST') {
      const h = seedHomework(state, body as Partial<HomeworkRecord>);
      return json(h, 201);
    }
    if (path.match(/^\/homework\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const idx = state.homework.findIndex((h) => h.id === id);
      if (idx >= 0) { Object.assign(state.homework[idx], body); return json(state.homework[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/homework\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      state.homework = state.homework.filter((h) => h.id !== id);
      return json({ message: 'Deleted' });
    }

    /* ── Calendar ── */
    if (path === '/calendar/events' && method === 'GET')  return jsonList(state.calendarEvents);
    if (path === '/calendar/events' && method === 'POST') {
      const e = seedCalendarEvent(state, body as Partial<CalendarEventRecord>);
      return json(e, 201);
    }
    if (path.match(/^\/calendar\/events\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[3];
      const idx = state.calendarEvents.findIndex((e) => e.id === id);
      if (idx >= 0) { Object.assign(state.calendarEvents[idx], body); return json(state.calendarEvents[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/calendar\/events\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      state.calendarEvents = state.calendarEvents.filter((e) => e.id !== id);
      return json({ message: 'Deleted' });
    }

    /* ── Timetable ── */
    if (path === '/timetable' || path.match(/^\/timetable\//)) {
      if (method === 'POST') return json({ message: 'Saved' }, 201);
      return json(state.timetables);
    }
    if (path === '/timetable-wizard' || path.match(/^\/timetable-wizard\//)) {
      return json({ classes: state.classes, timetables: state.timetables, conflicts: [] });
    }

    /* ── Transport ── */
    if (path === '/transport/routes' && method === 'GET')  return jsonList(state.transportRoutes);
    if (path === '/transport/routes' && method === 'POST') {
      const r = { _id: `tr-${Date.now()}`, id: `tr-${Date.now()}`, ...body, schoolId: SCHOOL_ID };
      state.transportRoutes.push(r);
      return json(r, 201);
    }
    if (path.match(/^\/transport\/routes\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[3];
      const idx = state.transportRoutes.findIndex((r: Record<string, unknown>) => r.id === id || r._id === id);
      if (idx >= 0) { Object.assign(state.transportRoutes[idx], body); return json(state.transportRoutes[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/transport\/routes\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      state.transportRoutes = state.transportRoutes.filter((r: Record<string, unknown>) => r.id !== id && r._id !== id);
      return json({ message: 'Deleted' });
    }
    if (path.match(/^\/transport\/routes\/([^/]+)\/students/)) {
      if (method === 'POST') return json({ message: 'Assigned' }, 201);
      return json([]);
    }
    if (path === '/transport/vehicles' && method === 'GET')  return jsonList(state.transportVehicles);
    if (path === '/transport/vehicles' && method === 'POST') {
      const v = { _id: `tv-${Date.now()}`, id: `tv-${Date.now()}`, ...body, schoolId: SCHOOL_ID };
      state.transportVehicles.push(v);
      return json(v, 201);
    }
    if (path.match(/^\/transport\/vehicles\/([^/]+)$/) && method === 'PUT') {
      const id = path.split('/')[3];
      const idx = state.transportVehicles.findIndex((v: Record<string, unknown>) => v.id === id || v._id === id);
      if (idx >= 0) { Object.assign(state.transportVehicles[idx], body); return json(state.transportVehicles[idx]); }
      return json({ error: 'Not found' }, 404);
    }
    if (path.match(/^\/transport\/vehicles\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      state.transportVehicles = state.transportVehicles.filter((v: Record<string, unknown>) => v.id !== id && v._id !== id);
      return json({ message: 'Deleted' });
    }

    /* ── Settings ── */
    if (path === '/settings' || path.match(/^\/settings\//)) {
      if (method === 'PUT' || method === 'PATCH') { Object.assign(state.schoolSettings, body); return json(state.schoolSettings); }
      return json(state.schoolSettings);
    }
    if (path === '/holidays')     return json(state.holidays);
    if (path === '/subjects')     return json(state.subjects);
    if (path === '/permissions')  return json(state.user.permissions);
    if (path === '/communication-settings') return json({ emailEnabled: true, smsEnabled: true, pushEnabled: true, whatsappEnabled: false });

    /* ── Analytics / Dashboard ── */
    if (path === '/dashboard/stats' || path === '/analytics') {
      const active = state.students.filter((s) => s.status === 'active');
      return json({
        totalStudents: state.students.length,
        activeStudents: active.length,
        totalStaff: state.staff.length,
        totalClasses: state.classes.length,
        attendanceRate: 92,
        feeCollectionRate: 78,
        genderDistribution: { Male: active.filter((s) => s.gender === 'Male').length, Female: active.filter((s) => s.gender === 'Female').length },
        classWiseStrength: state.classes.map((c) => ({ classId: c.id, name: `${c.name}-${c.section}`, count: state.students.filter((s) => s.classId === c.id && s.status === 'active').length })),
        feeStatusBreakdown: { paid: state.students.filter((s) => s.feeStatus === 'paid').length, pending: state.students.filter((s) => s.feeStatus === 'pending').length, overdue: state.students.filter((s) => s.feeStatus === 'overdue').length },
        recentAnnouncements: state.announcements.slice(0, 5),
        upcomingEvents: state.calendarEvents.slice(0, 5),
      });
    }
    if (path === '/analytics/attendance')   return json({ overall: 92, classWise: [] });
    if (path === '/analytics/fees')         return json({ collected: 0, pending: 0, overdue: 0, classWise: [] });
    if (path === '/analytics/academics')    return json({ averageScore: 75, passRate: 88, subjectWise: [] });
    if (path === '/analytics/trends')       return json({ enrollmentTrend: [], attendanceTrend: [], feeTrend: [] });

    /* ── Reports ── */
    if (path === '/reports' || path.match(/^\/reports\//)) return json({ data: [], total: 0 });
    if (path.match(/^\/reports\/export/))   return json({ downloadUrl: '/mock/report.pdf' });

    /* ── Payroll ── */
    if (path === '/payroll' || path === '/payroll/runs')  return jsonList(state.payrollRuns);
    if (path.match(/^\/payroll\//))  return json({ records: [], summary: { totalAmount: 0, processedCount: 0 } });

    /* ── AI Assistant ── */
    if (path === '/ai' || path.match(/^\/ai\//)) return json({ response: 'I am the AI assistant. How can I help you?', suggestions: [] });

    /* ── Notifications ── */
    if (path === '/notifications')  return json({ data: [], unreadCount: 0 });
    if (path === '/notification-preferences')  return json({ email: true, push: true, sms: false });

    /* ── Intake Forms ── */
    if (path === '/intake-forms' || path.match(/^\/intake-forms\//)) {
      if (path.includes('/assignments'))  return json([]);
      if (path.includes('/submissions'))  return json([]);
      return json({ forms: [], total: 0 });
    }

    /* ── Super Admin ── */
    if (path.match(/^\/super-admin/)) {
      if (path.includes('/schools'))     return json({ data: [], total: 0 });
      if (path.includes('/feature-flags')) return json([]);
      if (path.includes('/jobs'))        return json({ data: [], total: 0 });
      if (path.includes('/changelog'))   return json([]);
      if (path.includes('/growth'))      return json({ signups: [], conversions: [], metrics: {} });
      if (path.includes('/health'))      return json({ schools: [] });
      return json({});
    }

    /* ── Data Tools ── */
    if (path === '/data-tools' || path.match(/^\/data-tools\//)) {
      if (path.includes('/import'))  return json({ jobs: [], total: 0 });
      if (path.includes('/export'))  return json({ downloadUrl: '/mock/export.csv' });
      if (path.includes('/backup'))  return json({ lastBackup: null, schedule: 'daily', backups: [] });
      if (path.includes('/gdpr'))    return json({ dataExportRequests: [], deletionRequests: [], consentLogs: [] });
      if (path.includes('/audit-log'))  return json({ data: [], total: 0 });
      return json({});
    }

    /* ── Promotion ── */
    if (path === '/promotion' || path.match(/^\/promotion\//)) {
      if (path.includes('/rules'))      return json({ minAttendancePercent: 75, feeRequirement: 'none' });
      if (path.includes('/eligible'))   return json(state.students.filter((s) => s.status === 'active'));
      if (method === 'POST')            return json({ promoted: 0, detained: 0, message: 'Promotion completed' });
      return json([]);
    }

    /* ── Feature Flags ── */
    if (path === '/feature-flags') return json({});

    /* ── Catch-all ── */
    // eslint-disable-next-line no-console
    console.log(`[Mock API] Unmocked route: ${method} ${path}`);
    return json({});
  });
}

/* ═══════════════════════════════════════════════════════════════════
 *  ASSERTION HELPERS
 * ═══════════════════════════════════════════════════════════════════ */

export function expectRequestLog(state: MockState, expected: string[]): void {
  for (const entry of expected) {
    let found = false;
    for (const log of state.requestLog) {
      if (log.includes(entry) || log === entry) { found = true; break; }
    }
    if (!found) {
      throw new Error(`Expected request log to contain "${entry}"\nActual log:\n${[...state.requestLog].join('\n')}`);
    }
  }
}
