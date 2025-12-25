import { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { staffApi, studentsApi, classesApi } from "../services/api";

const initialEvents = [
  { id: 1, title: "Winter Break Starts", date: "2025-12-25", type: "holiday", startTime: "", endTime: "", allDay: true },
  { id: 2, title: "Parent-Teacher Meeting", date: "2025-12-20", type: "meeting", startTime: "10:00", endTime: "13:00", allDay: false },
  { id: 3, title: "Final Exams Begin", date: "2025-12-18", type: "exam", startTime: "09:00", endTime: "12:00", allDay: false },
  { id: 4, title: "Annual Day", date: "2025-12-28", type: "event", startTime: "16:00", endTime: "20:00", allDay: false },
  { id: 5, title: "New Year Holiday", date: "2026-01-01", type: "holiday", startTime: "", endTime: "", allDay: true },
];

const initialFeePayments = [
  { id: 1, studentId: 1, amount: 15000, date: "2025-12-16", month: "December", status: "paid" },
  { id: 2, studentId: 3, amount: 15000, date: "2025-12-15", month: "December", status: "paid" },
  { id: 3, studentId: 5, amount: 15000, date: "2025-12-14", month: "December", status: "paid" },
];

const initialAnnouncements = [
  { id: 1, title: "Parent-Teacher Meeting", content: "PTM scheduled for Dec 20th", target: "All Parents", status: "sent", date: "2025-12-15", channel: "SMS + App" },
  { id: 2, title: "Winter Break", content: "School closed from Dec 25 to Jan 1", target: "All", status: "scheduled", date: "2025-12-18", channel: "App" },
  { id: 3, title: "Fee Reminder", content: "Please clear pending dues", target: "Defaulters", status: "sent", date: "2025-12-14", channel: "SMS" },
];

const initialSchoolSettings = {
  name: "Springfield High School",
  address: "123 Education Lane, Springfield",
  phone: "1234567890",
  email: "info@springfieldhigh.edu",
  academicYear: "2024-25",
  schoolStartTime: "08:00",
  schoolEndTime: "14:30",
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  subjects: [
    { id: 1, name: "Mathematics", code: "MATH" },
    { id: 2, name: "English", code: "ENG" },
    { id: 3, name: "Hindi", code: "HIN" },
    { id: 4, name: "Science", code: "SCI" },
    { id: 5, name: "Social Studies", code: "SST" },
    { id: 6, name: "Computer Science", code: "CS" },
    { id: 7, name: "Physical Education", code: "PE" },
    { id: 8, name: "Art", code: "ART" },
    { id: 9, name: "Music", code: "MUS" },
  ],
};

const AppContext = createContext();

export function AppProvider({ children }) {
  // State - now fetched from API
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState(initialEvents);
  const [feePayments, setFeePayments] = useState(initialFeePayments);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [staffAttendance, setStaffAttendance] = useState({});
  const [studentAttendance, setStudentAttendance] = useState({});
  const [schoolSettings, setSchoolSettings] = useState(initialSchoolSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API on mount
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [staffData, studentsData, classesData] = await Promise.all([
        staffApi.getAll(),
        studentsApi.getAll(),
        classesApi.getAll(),
      ]);
      setStaff(staffData);
      setStudents(studentsData);
      setClasses(classesData.map(c => ({
        ...c,
        name: c.name.replace('Class ', ''),
        strength: c.studentCount || 0,
        classTeacherId: c.classTeacherId,
        attendance: 85 + Math.floor(Math.random() * 10),
      })));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Salary State
  const [salarySettings, setSalarySettings] = useState({
    earnings: [
      { id: "basic", name: "Basic Salary" },
      { id: "hra", name: "HRA" },
      { id: "transport", name: "Transport Allowance" },
      { id: "special", name: "Special Allowance" }
    ],
    deductions: [
      { id: "pf", name: "Provident Fund" },
      { id: "pt", name: "Professional Tax" },
      { id: "tds", name: "TDS" }
    ]
  });

  const [staffSalaries, setStaffSalaries] = useState({
    1: { basic: 35000, hra: 14000, transport: 5000, special: 2000, pf: 1800, pt: 200, tds: 1500 },
    2: { basic: 32000, hra: 12800, transport: 5000, special: 2000, pf: 1800, pt: 200, tds: 1200 },
    3: { basic: 45000, hra: 18000, transport: 8000, special: 5000, pf: 1800, pt: 200, tds: 3000 },
    4: { basic: 28000, hra: 11200, transport: 4000, special: 2000, pf: 1800, pt: 200, tds: 0 },
    5: { basic: 30000, hra: 12000, transport: 4000, special: 2000, pf: 1800, pt: 200, tds: 500 },
    6: { basic: 31000, hra: 12400, transport: 4500, special: 2000, pf: 1800, pt: 200, tds: 600 },
    7: { basic: 33000, hra: 13200, transport: 5000, special: 2500, pf: 1800, pt: 200, tds: 900 },
    8: { basic: 38000, hra: 15200, transport: 6000, special: 3000, pf: 1800, pt: 200, tds: 1800 },
    9: { basic: 29000, hra: 11600, transport: 4000, special: 2000, pf: 1800, pt: 200, tds: 300 },
    10: { basic: 30000, hra: 12000, transport: 4500, special: 2000, pf: 1800, pt: 200, tds: 500 },
    11: { basic: 25000, hra: 10000, transport: 3500, special: 1500, pf: 1800, pt: 200, tds: 0 },
    12: { basic: 28000, hra: 11200, transport: 4000, special: 2000, pf: 1800, pt: 200, tds: 200 },
    13: { basic: 32000, hra: 12800, transport: 5000, special: 2000, pf: 1800, pt: 200, tds: 1000 },
    14: { basic: 22000, hra: 8800, transport: 3000, special: 1500, pf: 1800, pt: 200, tds: 0 },
    15: { basic: 31000, hra: 12400, transport: 4500, special: 2000, pf: 1800, pt: 200, tds: 700 },
  });

  const [payrollHistory, setPayrollHistory] = useState([
    { id: 1, month: "November 2025", totalStaff: 15, totalPayout: 485000, status: "completed", date: "2025-11-30" }
  ]);

  // Additional Staff Data
  const [lessonPlans, setLessonPlans] = useState([
    { id: 1, staffId: 1, subject: "Mathematics", class: "10-A", topic: "Quadratic Equations", status: "Completed", date: "2024-03-10" },
    { id: 2, staffId: 1, subject: "Mathematics", class: "10-B", topic: "Trigonometry", status: "Pending", date: "2024-03-12" },
  ]);

  const [documents, setDocuments] = useState([
    { id: 1, staffId: 1, name: "Employment Contract.pdf", type: "Contract", uploadDate: "2023-01-15", size: "2.4 MB" },
    { id: 2, staffId: 1, name: "ID Proof.jpg", type: "ID", uploadDate: "2023-01-15", size: "1.2 MB" },
    { id: 3, staffId: 1, name: "Degree Certificate.pdf", type: "Qualification", uploadDate: "2023-01-15", size: "3.5 MB" },
  ]);

  const [remarks, setRemarks] = useState([
    { id: 1, staffId: 1, studentId: 1, student: "John Doe", class: "10-A", remark: "Excellent performance in recent test.", date: "2024-03-10" },
    { id: 2, staffId: 1, studentId: 2, student: "Jane Smith", class: "10-B", remark: "Needs improvement in homework submission.", date: "2024-03-08" },
  ]);

  const addLessonPlan = (plan) => setLessonPlans(prev => [plan, ...prev]);
  const addDocument = (doc) => setDocuments(prev => [doc, ...prev]);
  const addRemark = (remark) => setRemarks(prev => [remark, ...prev]);

  // ID counters (for local entities only)
  const [nextSubjectId, setNextSubjectId] = useState(10);
  const [nextEventId, setNextEventId] = useState(6);

  // Staff functions - now using API
  const addStaff = async (newStaff) => {
    try {
      const created = await staffApi.create(newStaff);
      setStaff(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStaff = async (id, updates) => {
    try {
      const updated = await staffApi.update(id, updates);
      setStaff(prev => prev.map(s => s.id === id ? updated : s));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStaff = async (id) => {
    try {
      await staffApi.delete(id);
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleStaffStatus = async (id) => {
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      const newStatus = staffMember.status === "active" ? "inactive" : "active";
      await updateStaff(id, { ...staffMember, status: newStatus });
    }
  };

  const getStaffById = (id) => staff.find(s => s.id === id || s.id === String(id));

  // Student functions - now using API
  const addStudent = async (newStudent) => {
    try {
      const created = await studentsApi.create(newStudent);
      setStudents(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStudent = async (id, updates) => {
    try {
      const updated = await studentsApi.update(id, updates);
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStudent = async (id) => {
    try {
      await studentsApi.delete(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getStudentById = (id) => students.find(s => String(s.id) === String(id));
  const getStudentsByClass = (classId) => students.filter(s => s.classId === classId);

  // Class functions - now using API
  const addClass = async (newClass) => {
    try {
      const created = await classesApi.create(newClass);
      setClasses(prev => [...prev, { ...created, name: created.name.replace('Class ', ''), strength: 0, attendance: 85 }]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateClass = async (id, updates) => {
    try {
      const updated = await classesApi.update(id, updates);
      setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteClass = async (id) => {
    try {
      await classesApi.delete(id);
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getClassById = (id) => classes.find(c => c.id === id);

  // Event functions
  const addEvent = (newEvent) => {
    const eventWithId = { ...newEvent, id: nextEventId };
    setEvents(prev => [...prev, eventWithId]);
    setNextEventId(prev => prev + 1);
    return eventWithId;
  };

  const updateEvent = (id, updates) => setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  const deleteEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id));
  const getEventsForDate = (date) => events.filter(e => e.date === date);

  // Fee functions
  const addFeePayment = (payment) => {
    const paymentWithId = { ...payment, id: Date.now() };
    setFeePayments(prev => [...prev, paymentWithId]);
    // Update student fee status
    setStudents(prev => prev.map(s => s.id === payment.studentId ? { ...s, feeStatus: "paid" } : s));
    return paymentWithId;
  };

  const getStudentFeeHistory = (studentId) => feePayments.filter(p => p.studentId === studentId);

  // Announcement functions
  const addAnnouncement = (announcement) => {
    const announcementWithId = { ...announcement, id: Date.now() };
    setAnnouncements(prev => [...prev, announcementWithId]);
    return announcementWithId;
  };

  // School Settings functions
  const updateSchoolSettings = (updates) => setSchoolSettings(prev => ({ ...prev, ...updates }));

  const addSubject = (subject) => {
    const subjectWithId = { ...subject, id: nextSubjectId };
    setSchoolSettings(prev => ({ ...prev, subjects: [...prev.subjects, subjectWithId] }));
    setNextSubjectId(prev => prev + 1);
    return subjectWithId;
  };

  const updateSubject = (id, updates) => {
    setSchoolSettings(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const deleteSubject = (id) => {
    setSchoolSettings(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== id)
    }));
  };

  // Salary Logic
  const updateSalarySettings = (type, action, item) => { // type: 'earnings' | 'deductions', action: 'add' | 'remove' | 'update'
    setSalarySettings(prev => {
      if (action === "add") {
        return { ...prev, [type]: [...prev[type], { id: item.name.toLowerCase().replace(/\s+/g, ''), ...item }] };
      } else if (action === "remove") {
        return { ...prev, [type]: prev[type].filter(i => i.id !== item.id) };
      }
      return prev;
    });
  };

  const updateStaffSalary = (staffId, salaryData) => {
    setStaffSalaries(prev => ({ ...prev, [staffId]: salaryData }));
  };

  const processPayroll = (month, staffList) => {
    const newRecord = {
      id: Date.now(),
      month,
      totalStaff: staffList.length,
      totalPayout: staffList.reduce((acc, curr) => acc + curr.netSalary, 0),
      status: "completed",
      date: new Date().toISOString().split('T')[0],
      details: staffList
    };
    setPayrollHistory(prev => [newRecord, ...prev]);
    return newRecord;
  };

  const getPayrollForMonth = (month) => payrollHistory.find(p => p.month === month);

  const isBeforeSchoolHours = useMemo(() => {
    const now = new Date();
    const [startHour, startMin] = schoolSettings.schoolStartTime.split(":").map(Number);
    const schoolStart = new Date();
    schoolStart.setHours(startHour, startMin, 0, 0);
    return now < schoolStart;
  }, [schoolSettings.schoolStartTime]);

  // Attendance functions
  const markStaffAttendance = (staffId, date, status, inTime = "-", outTime = "-") => {
    setStaffAttendance(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], [date]: { status, inTime, outTime } }
    }));
  };

  const markStudentAttendance = (studentId, date, status) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [date]: { status } }
    }));
  };

  const getStaffAttendanceForDate = (date) => {
    const result = {};
    staff.forEach(s => {
      result[s.id] = staffAttendance[s.id]?.[date] || { status: "unmarked", inTime: "-", outTime: "-" };
    });
    return result;
  };

  const markAllStaffAttendance = (date, status) => {
    setStaffAttendance(prev => {
      const newAtt = { ...prev };
      staff.filter(s => s.status === "active").forEach(s => {
        newAtt[s.id] = {
          ...newAtt[s.id],
          [date]: { status, inTime: status === "present" ? "08:30" : "-", outTime: "-" }
        };
      });
      return newAtt;
    });
  };

  const getMonthlyAttendance = (staffId, year, month) => {
    const staffAtt = staffAttendance[staffId] || {};
    let present = 0, absent = 0, leave = 0;
    Object.entries(staffAtt).forEach(([date, data]) => {
      const d = new Date(date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (data.status === "present") present++;
        else if (data.status === "absent") absent++;
        else if (data.status === "leave") leave++;
      }
    });
    return { present, absent, leave, total: present + absent + leave };
  };

  // Computed values
  const teachers = useMemo(() => staff.filter(s => s.role === "Teacher" && s.status === "active"), [staff]);

  const classesWithTeachers = useMemo(() => classes.map(c => ({
    ...c,
    teacher: staff.find(s => s.id === c.classTeacherId)?.name || "Unassigned",
    studentCount: students.filter(s => s.classId === c.id).length,
  })), [classes, staff, students]);

  const feeDefaulters = useMemo(() => students.filter(s => s.feeStatus === "overdue" || s.feeStatus === "pending"), [students]);

  const dashboardStats = useMemo(() => ({
    totalStaff: staff.length,
    activeStaff: staff.filter(s => s.status === "active").length,
    totalStudents: students.length,
    totalClasses: classes.length,
    totalTeachers: teachers.length,
    feeDefaultersCount: feeDefaulters.length,
    upcomingEvents: events.filter(e => new Date(e.date) >= new Date()).length,
  }), [staff, students, classes, teachers, feeDefaulters, events]);

  const value = {
    // Data
    staff, students, classes, events, feePayments, announcements,
    staffAttendance, studentAttendance, schoolSettings,
    loading, error, refetch: fetchData,
    // Computed
    teachers, classesWithTeachers, feeDefaulters, dashboardStats, isBeforeSchoolHours,
    // Staff actions
    addStaff, updateStaff, deleteStaff, toggleStaffStatus, getStaffById,
    // Student actions
    addStudent, updateStudent, deleteStudent, getStudentById, getStudentsByClass,
    // Class actions
    addClass, updateClass, deleteClass, getClassById,
    // Event actions
    addEvent, updateEvent, deleteEvent, getEventsForDate,
    // Fee actions
    addFeePayment, getStudentFeeHistory,
    // Announcement actions
    addAnnouncement,
    // Attendance actions
    markStaffAttendance, markStudentAttendance, getStaffAttendanceForDate,
    markAllStaffAttendance, getMonthlyAttendance,
    // School Settings actions
    updateSchoolSettings, addSubject, updateSubject, deleteSubject,
    // Salary functions
    salarySettings, staffSalaries, payrollHistory,
    updateSalarySettings, updateStaffSalary, processPayroll, getPayrollForMonth,
    // Academic & other actions
    lessonPlans, documents, remarks,
    addLessonPlan, addDocument, addRemark
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
