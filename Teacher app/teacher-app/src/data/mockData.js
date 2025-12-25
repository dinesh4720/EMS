// Mock Data for Teacher App
// This serves as fallback and demo data

export const mockClasses = [
  { id: 1, name: 'Class 10-A', subject: 'Mathematics', time: '8:00 AM', role: 'class_teacher', studentCount: 45, room: '101' },
  { id: 2, name: 'Class 9-B', subject: 'Mathematics', time: '9:00 AM', role: 'subject_teacher', studentCount: 42, room: '203' },
  { id: 3, name: 'Class 8-A', subject: 'Mathematics', time: '10:30 AM', role: 'subject_teacher', studentCount: 40, room: '105' },
  { id: 4, name: 'Class 10-B', subject: 'Mathematics', time: '11:30 AM', role: 'subject_teacher', studentCount: 44, room: '102' },
  { id: 5, name: 'Class 7-C', subject: 'Mathematics', time: '2:00 PM', role: 'subject_teacher', studentCount: 38, room: '301' },
];

export const mockStudents = {
  1: [
    { id: 101, name: 'Aarav Sharma', roll: 1, attendance: 92, recentMarks: 85, photo: null, parentPhone: '9876543210', remarks: [] },
    { id: 102, name: 'Ananya Patel', roll: 2, attendance: 88, recentMarks: 92, photo: null, parentPhone: '9876543211', remarks: [] },
    { id: 103, name: 'Arjun Singh', roll: 3, attendance: 95, recentMarks: 78, photo: null, parentPhone: '9876543212', remarks: [] },
    { id: 104, name: 'Diya Gupta', roll: 4, attendance: 90, recentMarks: 88, photo: null, parentPhone: '9876543213', remarks: [] },
    { id: 105, name: 'Ishaan Kumar', roll: 5, attendance: 85, recentMarks: 72, photo: null, parentPhone: '9876543214', remarks: [] },
    { id: 106, name: 'Kavya Reddy', roll: 6, attendance: 93, recentMarks: 95, photo: null, parentPhone: '9876543215', remarks: [] },
    { id: 107, name: 'Lakshya Jain', roll: 7, attendance: 78, recentMarks: 65, photo: null, parentPhone: '9876543216', remarks: ['Needs attention in algebra'] },
    { id: 108, name: 'Meera Nair', roll: 8, attendance: 96, recentMarks: 90, photo: null, parentPhone: '9876543217', remarks: [] },
    { id: 109, name: 'Nikhil Verma', roll: 9, attendance: 82, recentMarks: 70, photo: null, parentPhone: '9876543218', remarks: [] },
    { id: 110, name: 'Priya Mehta', roll: 10, attendance: 91, recentMarks: 82, photo: null, parentPhone: '9876543219', remarks: [] },
    { id: 111, name: 'Rahul Agarwal', roll: 11, attendance: 87, recentMarks: 75, photo: null, parentPhone: '9876543220', remarks: [] },
    { id: 112, name: 'Sanya Kapoor', roll: 12, attendance: 94, recentMarks: 88, photo: null, parentPhone: '9876543221', remarks: [] },
  ],
  2: [
    { id: 201, name: 'Aditya Rao', roll: 1, attendance: 90, recentMarks: 80, photo: null, parentPhone: '9876543230', remarks: [] },
    { id: 202, name: 'Bhavya Shah', roll: 2, attendance: 85, recentMarks: 75, photo: null, parentPhone: '9876543231', remarks: [] },
    { id: 203, name: 'Chirag Desai', roll: 3, attendance: 92, recentMarks: 82, photo: null, parentPhone: '9876543232', remarks: [] },
  ],
};

export const mockTasks = [
  { id: '1', title: 'Prepare Unit Test papers', dueDate: '2025-01-20', done: false, notes: 'Chapter 5-8', category: 'task' },
  { id: '2', title: 'Submit monthly report', dueDate: '2025-01-25', done: false, notes: '', category: 'task' },
  { id: '3', title: 'Parent meeting preparation', dueDate: '2025-01-22', done: true, notes: 'Prepare progress cards', category: 'task' },
];

export const mockLessonPlans = {
  1: [
    { id: 'lp1', title: 'Quadratic Equations', topic: 'Algebra', description: 'Introduction to quadratic equations and their solutions', dueDate: '2025-01-18', files: [], status: 'completed' },
    { id: 'lp2', title: 'Trigonometry Basics', topic: 'Trigonometry', description: 'Sin, Cos, Tan introduction with real-world examples', dueDate: '2025-01-22', files: [], status: 'pending' },
    { id: 'lp3', title: 'Coordinate Geometry', topic: 'Geometry', description: 'Distance formula and section formula', dueDate: '2025-01-28', files: [], status: 'overdue' },
  ],
};

export const mockHomework = {
  1: [
    { id: 'hw1', title: 'Practice Set - Quadratic Equations', description: 'Solve exercises 5.1 and 5.2', dueDate: '2025-01-20', files: [], voiceNote: null },
    { id: 'hw2', title: 'Trigonometry Worksheet', description: 'Complete the attached worksheet', dueDate: '2025-01-25', files: ['worksheet.pdf'], voiceNote: null },
  ],
};

export const mockTests = {
  1: [
    { id: 't1', name: 'Unit Test 1 - Algebra', description: 'Chapters 1-4', maxMarks: 50, date: '2025-01-15', lessons: ['Quadratic Equations'] },
    { id: 't2', name: 'Weekly Quiz 3', description: 'Quick assessment on recent topics', maxMarks: 20, date: '2025-01-18', lessons: [] },
  ],
};

export const mockMarks = {
  t1: { 101: '42', 102: '48', 103: '35', 104: '44', 105: '30', 106: '49', 107: '28', 108: '45', 109: '32', 110: '40' },
  t2: { 101: '18', 102: '19', 103: '15', 104: '17', 105: '14', 106: '20', 107: '12', 108: '18', 109: '13', 110: '16' },
};

export const mockAnnouncements = {
  1: [
    { id: 'a1', title: 'Holiday Notice', description: 'School closed on 26th Jan for Republic Day', date: '2025-01-17', students: 'all', voiceNote: null },
    { id: 'a2', title: 'PTM Reminder', description: 'Parent-Teacher Meeting scheduled for 28th Jan', date: '2025-01-20', students: 'all', voiceNote: null },
  ],
};

export const mockAlerts = [
  { id: 1, type: 'substitution', message: 'Cover Class 7-A at 2:00 PM (Science)', action: null, note: 'Mr. Sharma is on leave. Please collect keys from reception.', priority: 'high' },
  { id: 2, type: 'action', message: 'Mark entry pending: Unit Test 1', action: 'ClassWorkspace', params: { classId: 1, className: 'Class 10-A', initialTab: 3 }, priority: 'high' },
  { id: 3, type: 'action', message: 'Lesson plan overdue: Coordinate Geometry', action: 'ClassWorkspace', params: { classId: 1, className: 'Class 10-A', initialTab: 2 }, priority: 'medium' },
  { id: 4, type: 'attendance', message: 'Attendance pending: Class 9-B', action: 'ClassWorkspace', params: { classId: 2, className: 'Class 9-B', initialTab: 0 }, priority: 'high' },
];

// Class Teacher specific data
export const mockClassTeacherData = {
  1: {
    lowAttendanceStudents: [
      { id: 107, name: 'Lakshya Jain', roll: 7, attendance: 78 },
      { id: 109, name: 'Nikhil Verma', roll: 9, attendance: 82 },
      { id: 105, name: 'Ishaan Kumar', roll: 5, attendance: 85 },
    ],
    failedStudents: [
      { id: 107, name: 'Lakshya Jain', roll: 7, subject: 'Mathematics', marks: 28, maxMarks: 50 },
      { id: 105, name: 'Ishaan Kumar', roll: 5, subject: 'Mathematics', marks: 30, maxMarks: 50 },
    ],
    feePendingStudents: [
      { id: 103, name: 'Arjun Singh', roll: 3, pendingAmount: 15000, dueDate: '2025-01-15' },
      { id: 107, name: 'Lakshya Jain', roll: 7, pendingAmount: 25000, dueDate: '2025-01-10' },
      { id: 111, name: 'Rahul Agarwal', roll: 11, pendingAmount: 10000, dueDate: '2025-01-20' },
    ],
    classStrength: 45,
    presentToday: 42,
    averageAttendance: 89,
  },
};

export const mockNotes = [
  { id: 'n1', content: 'Prepare extra worksheets for weak students', createdAt: '2025-01-15' },
  { id: 'n2', content: 'Follow up with Lakshya\'s parents about attendance', createdAt: '2025-01-16' },
];

export const mockLeaveBalance = {
  casual: 8,
  sick: 10,
  earned: 15,
  taken: { casual: 2, sick: 0, earned: 0 },
};

export const mockSalarySlips = [
  { id: 's1', month: 'December 2024', gross: 65000, deductions: 5000, net: 60000, status: 'paid', paidOn: '2025-01-01' },
  { id: 's2', month: 'November 2024', gross: 65000, deductions: 5000, net: 60000, status: 'paid', paidOn: '2024-12-01' },
  { id: 's3', month: 'October 2024', gross: 65000, deductions: 5000, net: 60000, status: 'paid', paidOn: '2024-11-01' },
];

export const mockNotifications = [
  { id: 'notif1', title: 'Attendance Reminder', message: 'Please mark attendance for Class 10-A', time: '10 mins ago', read: false },
  { id: 'notif2', title: 'New Circular', message: 'Annual Day preparations to begin from Feb 1st', time: '2 hours ago', read: false },
  { id: 'notif3', title: 'Leave Approved', message: 'Your casual leave for Jan 30 has been approved', time: '1 day ago', read: true },
];
