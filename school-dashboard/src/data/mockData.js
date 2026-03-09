import { CURRENT_ACADEMIC_YEAR } from "../utils/constants";

export const dashboardData = {
  criticalAlerts: {
    pendingStaffAttendance: 12,
    pendingStudentAttendance: 45,
    feeDefaulters: { over7Days: 23, over15Days: 15, over30Days: 8 },
    pendingApprovals: 7
  },
  todaySnapshot: {
    staffAttendance: 92,
    studentAttendance: 88,
    feeCollected: 125000,
    activeClasses: 24,
    totalStrength: 1250,
    presentToday: 1100
  },
  quickStats: {
    monthlyFeeTarget: 500000,
    monthlyFeeCollected: 385000,
    avgAttendance: 91,
    newAdmissions: 12,
    staffOnLeave: 3
  },
  recentPayments: [
    { id: 1, student: "Rahul Sharma", class: "10-A", amount: 15000, time: "10:30 AM" },
    { id: 2, student: "Priya Patel", class: "8-B", amount: 12000, time: "10:15 AM" },
    { id: 3, student: "Amit Kumar", class: "12-C", amount: 18000, time: "09:45 AM" },
    { id: 4, student: "Sneha Gupta", class: "6-A", amount: 10000, time: "09:30 AM" },
    { id: 5, student: "Vikram Singh", class: "9-B", amount: 14000, time: "09:00 AM" }
  ],
  recentAnnouncements: [
    { id: 1, title: "Parent-Teacher Meeting", date: "Dec 18", recipients: "All Parents" },
    { id: 2, title: "Winter Break Notice", date: "Dec 15", recipients: "All" },
    { id: 3, title: "Fee Reminder", date: "Dec 14", recipients: "Defaulters" }
  ],
  parentCommunications: [
    { id: 1, parent: "Mr. Sharma", subject: "Leave Request", status: "pending" },
    { id: 2, parent: "Mrs. Patel", subject: "Fee Query", status: "resolved" },
    { id: 3, parent: "Mr. Kumar", subject: "Transport Issue", status: "pending" }
  ]
};

export const staffData = [
  { id: 1, code: "EMP001", name: "Rajesh Kumar", role: "Teacher", department: "Mathematics", classes: ["10-A", "10-B"], status: "active", phone: "9876543210", email: "rajesh@school.com", joinDate: "2020-06-15" },
  { id: 2, code: "EMP002", name: "Priya Singh", role: "Teacher", department: "English", classes: ["8-A", "9-A"], status: "active", phone: "9876543211", email: "priya@school.com", joinDate: "2019-04-10" },
  { id: 3, code: "EMP003", name: "Amit Verma", role: "Admin", department: "Administration", classes: [], status: "active", phone: "9876543212", email: "amit@school.com", joinDate: "2018-01-20" },
  { id: 4, code: "EMP004", name: "Sunita Devi", role: "Teacher", department: "Science", classes: ["7-A", "7-B"], status: "inactive", phone: "9876543213", email: "sunita@school.com", joinDate: "2021-08-01" },
  { id: 5, code: "EMP005", name: "Vikram Patel", role: "Teacher", department: "Hindi", classes: ["6-A", "6-B"], status: "active", phone: "9876543214", email: "vikram@school.com", joinDate: "2022-03-15" },
  { id: 6, code: "EMP006", name: "Neha Sharma", role: "Teacher", department: "Social Studies", classes: ["9-A", "9-B"], status: "active", phone: "9876543215", email: "neha@school.com", joinDate: "2021-02-10" },
  { id: 7, code: "EMP007", name: "Arun Gupta", role: "Teacher", department: "Computer", classes: ["10-A", "8-A"], status: "active", phone: "9876543216", email: "arun@school.com", joinDate: "2020-07-22" },
  { id: 8, code: "EMP008", name: "Kavita Reddy", role: "Accountant", department: "Administration", classes: [], status: "active", phone: "9876543217", email: "kavita@school.com", joinDate: "2019-11-05" },
  { id: 9, code: "EMP009", name: "Suresh Nair", role: "Teacher", department: "Physical Education", classes: ["6-A", "7-A", "8-A"], status: "active", phone: "9876543218", email: "suresh@school.com", joinDate: "2018-06-18" },
  { id: 10, code: "EMP010", name: "Meera Joshi", role: "Teacher", department: "Science", classes: ["8-B", "9-B"], status: "active", phone: "9876543219", email: "meera@school.com", joinDate: "2022-01-12" },
  { id: 11, code: "EMP011", name: "Rahul Mehta", role: "Librarian", department: "Administration", classes: [], status: "active", phone: "9876543220", email: "rahul@school.com", joinDate: "2017-09-01" },
  { id: 12, code: "EMP012", name: "Anjali Das", role: "Teacher", department: "English", classes: ["6-B", "7-B"], status: "active", phone: "9876543221", email: "anjali@school.com", joinDate: "2023-04-15" },
  { id: 13, code: "EMP013", name: "Deepak Rao", role: "Teacher", department: "Mathematics", classes: ["9-A", "8-B"], status: "inactive", phone: "9876543222", email: "deepak@school.com", joinDate: "2020-03-20" },
  { id: 14, code: "EMP014", name: "Pooja Iyer", role: "Lab Assistant", department: "Science", classes: [], status: "active", phone: "9876543223", email: "pooja@school.com", joinDate: "2021-07-08" },
  { id: 15, code: "EMP015", name: "Sanjay Pillai", role: "Teacher", department: "Hindi", classes: ["8-A", "10-B"], status: "active", phone: "9876543224", email: "sanjay@school.com", joinDate: "2019-08-25" },
];

export const staffAttendanceData = [
  { id: 1, staffId: 1, name: "Rajesh Kumar", date: "2024-12-16", status: "present", inTime: "08:30", outTime: "16:00" },
  { id: 2, staffId: 2, name: "Priya Singh", date: "2024-12-16", status: "present", inTime: "08:25", outTime: "16:05" },
  { id: 3, staffId: 3, name: "Amit Verma", date: "2024-12-16", status: "absent", inTime: "-", outTime: "-" },
  { id: 4, staffId: 4, name: "Sunita Devi", date: "2024-12-16", status: "leave", inTime: "-", outTime: "-" },
  { id: 5, staffId: 5, name: "Vikram Patel", date: "2024-12-16", status: "present", inTime: "08:45", outTime: "-" },
];

export const classesData = [
  { id: 1, name: "Class 6", section: "A", strength: 20, teacher: "Vikram Patel", attendanceToday: 91, feePending: 5 },
  { id: 2, name: "Class 6", section: "B", strength: 20, teacher: "Vikram Patel", attendanceToday: 88, feePending: 3 },
  { id: 3, name: "Class 7", section: "A", strength: 20, teacher: "Sunita Devi", attendanceToday: 85, feePending: 8 },
  { id: 4, name: "Class 8", section: "A", strength: 20, teacher: "Priya Singh", attendanceToday: 93, feePending: 2 },
  { id: 5, name: "Class 9", section: "A", strength: 20, teacher: "Priya Singh", attendanceToday: 90, feePending: 6 },
  { id: 6, name: "Class 10", section: "A", strength: 20, teacher: "Rajesh Kumar", attendanceToday: 95, feePending: 4 },
  { id: 7, name: "Class 10", section: "B", strength: 20, teacher: "Rajesh Kumar", attendanceToday: 89, feePending: 7 },
];

// Helper to generate students for each class
const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Ananya", "Diya", "Myra", "Sara", "Aanya", "Aadhya", "Pari", "Kiara", "Riya", "Anvi"];
const lastNames = ["Sharma", "Patel", "Kumar", "Singh", "Gupta", "Verma", "Reddy", "Joshi", "Mehta", "Shah", "Rao", "Nair", "Iyer", "Pillai", "Menon", "Das", "Bose", "Sen", "Roy", "Dutta"];
const feeStatuses = ["paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "pending", "pending", "pending", "pending", "overdue", "overdue"];
const studentStatuses = ["active", "active", "active", "active", "active", "active", "active", "active", "active", "active", "active", "active", "active", "active", "active", "active", "inactive", "inactive", "transferred", "transferred"];
const classes = ["6-A", "6-B", "7-A", "8-A", "9-A", "10-A", "10-B"];

const generateStudents = () => {
  const students = [];
  let id = 1;
  classes.forEach(cls => {
    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[(i + classes.indexOf(cls)) % lastNames.length];
      students.push({
        id: id,
        name: `${firstName} ${lastName}`,
        class: cls,
        rollNo: i + 1,
        parentPhone: `98765${String(43000 + id).padStart(5, '0')}`,
        feeStatus: feeStatuses[i % feeStatuses.length],
        status: studentStatuses[i % studentStatuses.length]
      });
      id++;
    }
  });
  return students;
};

export const studentsData = generateStudents();

export const timetableData = {
  periods: [
    { id: 1, name: "Period 1", start: "08:00", end: "08:45" },
    { id: 2, name: "Period 2", start: "08:45", end: "09:30" },
    { id: 3, name: "Break", start: "09:30", end: "09:45", isBreak: true },
    { id: 4, name: "Period 3", start: "09:45", end: "10:30" },
    { id: 5, name: "Period 4", start: "10:30", end: "11:15" },
    { id: 6, name: "Lunch", start: "11:15", end: "12:00", isBreak: true },
    { id: 7, name: "Period 5", start: "12:00", end: "12:45" },
    { id: 8, name: "Period 6", start: "12:45", end: "13:30" },
  ],
  schedule: {
    "10-A": {
      Monday: ["Math", "English", null, "Science", "Hindi", null, "PT", "Art"],
      Tuesday: ["English", "Math", null, "Hindi", "Science", null, "Computer", "Library"],
      Wednesday: ["Science", "Hindi", null, "Math", "English", null, "Music", "PT"],
      Thursday: ["Hindi", "Science", null, "English", "Math", null, "Art", "Computer"],
      Friday: ["Math", "English", null, "Science", "Hindi", null, "Library", "Music"],
    }
  }
};

export const feeHeads = [
  { id: 1, name: "Tuition Fee", amount: 5000, frequency: "monthly" },
  { id: 2, name: "Transport Fee", amount: 2000, frequency: "monthly" },
  { id: 3, name: "Lab Fee", amount: 1000, frequency: "quarterly" },
  { id: 4, name: "Library Fee", amount: 500, frequency: "yearly" },
  { id: 5, name: "Sports Fee", amount: 1500, frequency: "yearly" },
];

export const feeStructure = [
  { id: 1, class: "Class 6", tuition: 4000, transport: 1500, lab: 800, total: 6300 },
  { id: 2, class: "Class 7", tuition: 4200, transport: 1500, lab: 900, total: 6600 },
  { id: 3, class: "Class 8", tuition: 4500, transport: 1800, lab: 1000, total: 7300 },
  { id: 4, class: "Class 9", tuition: 5000, transport: 2000, lab: 1200, total: 8200 },
  { id: 5, class: "Class 10", tuition: 5500, transport: 2000, lab: 1500, total: 9000 },
];

export const feeDefaulters = [
  { id: 1, student: "Sneha Gupta", class: "10-A", pending: 18000, dueDate: "2024-11-15", days: 31 },
  { id: 2, student: "Ravi Verma", class: "9-A", pending: 12000, dueDate: "2024-11-25", days: 21 },
  { id: 3, student: "Pooja Sharma", class: "8-A", pending: 8000, dueDate: "2024-12-01", days: 15 },
  { id: 4, student: "Karan Singh", class: "7-A", pending: 6500, dueDate: "2024-12-05", days: 11 },
  { id: 5, student: "Neha Patel", class: "6-B", pending: 5000, dueDate: "2024-12-10", days: 6 },
];

export const announcements = [
  { id: 1, title: "Parent-Teacher Meeting", content: "PTM scheduled for Dec 20th", target: "All Parents", status: "sent", date: "2024-12-15", channel: "SMS + App" },
  { id: 2, title: "Winter Break", content: "School closed from Dec 25 to Jan 1", target: "All", status: "scheduled", date: "2024-12-18", channel: "App" },
  { id: 3, title: "Fee Reminder", content: "Please clear pending dues", target: "Defaulters", status: "sent", date: "2024-12-14", channel: "SMS" },
];

export const communicationLogs = [
  { id: 1, type: "SMS", recipient: "Mr. Sharma", student: "Rahul Sharma", message: "Absence notification", status: "delivered", date: "2024-12-16 10:30" },
  { id: 2, type: "Email", recipient: "Mrs. Patel", student: "Priya Patel", message: "Fee reminder", status: "delivered", date: "2024-12-16 09:15" },
  { id: 3, type: "SMS", recipient: "Mr. Kumar", student: "Amit Kumar", message: "PTM reminder", status: "failed", date: "2024-12-15 14:00" },
];

export const institutionSettings = {
  name: "ABC Public School",
  address: "123 Education Lane, City",
  phone: "1234567890",
  email: "info@abcschool.com",
  academicYear: CURRENT_ACADEMIC_YEAR,
  logo: null
};

export const roles = [
  { id: 1, name: "Super Admin", permissions: ["all"] },
  { id: 2, name: "Admin", permissions: ["staff", "classes", "fees", "communication"] },
  { id: 3, name: "Teacher", permissions: ["attendance", "classes.view", "communication.send"] },
  { id: 4, name: "Accountant", permissions: ["fees"] },
];
