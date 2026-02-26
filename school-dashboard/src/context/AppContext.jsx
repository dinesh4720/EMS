import { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { staffApi, studentsApi, classesApi, classesEnhancedApi, settingsApi, teacherAssignmentsApi, teacherTimetableApi, staffAttendanceApi, calendarEventsApi } from "../services/api";
import toast from "react-hot-toast";

// NOTE: These are minimal fallback values only.
// The application fetches actual data from the API on mount.
// These defaults prevent errors before data is loaded.
const initialSchoolSettings = {
  name: "",
  address: "",
  phone: "",
  email: "",
  udiseNo: "",
  affiliationNo: "",
  logo: null,
  boardOfEducation: "",
  principalSignature: null,
  correspondentSignature: null,
  academicYear: "",
  academicYearStart: "",
  academicYearEnd: "",
  schoolStartTime: "",
  schoolEndTime: "",
  periodDuration: 45,
  periodsPerDay: 8,
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  subjects: [],
};

const AppContext = createContext();

export function AppProvider({ children }) {
  // State - now fetched from API
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [staffAttendance, setStaffAttendance] = useState({});
  const [studentAttendance, setStudentAttendance] = useState({});
  const [schoolSettings, setSchoolSettings] = useState(initialSchoolSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch staff attendance from API
  const fetchStaffAttendance = useCallback(async () => {
    try {
      console.log('📡 Fetching staff attendance from API...');
      const attendanceData = await staffAttendanceApi.getAll();

      console.log('📡 Raw attendance data received:', attendanceData?.length || 0, 'records');
      if (attendanceData && attendanceData.length > 0) {
        console.log('📡 Sample record:', attendanceData[0]);
      }

      // Backend returns array: { staffId, date, status, checkInTime, checkOutTime, reason }
      // Webapp expects nested structure: { staffId: { date: { status, inTime, outTime, reason } } }
      const transformedData = {};
      if (Array.isArray(attendanceData)) {
        attendanceData.forEach(record => {
          const { staffId, date, status, checkInTime, checkOutTime, reason } = record;
          if (!transformedData[staffId]) {
            transformedData[staffId] = {};
          }
          transformedData[staffId][date] = {
            status,
            inTime: checkInTime || '-',
            outTime: checkOutTime || '-',
            reason: reason || ''
          };
        });
      }

      console.log('✅ Staff attendance transformed:', Object.keys(transformedData).length, 'staff members');
      console.log('✅ Staff attendance keys:', Object.keys(transformedData));
      setStaffAttendance(transformedData);
    } catch (err) {
      console.error('❌ Failed to fetch staff attendance:', err);
      // Don't show toast for this - it's not critical
      setStaffAttendance({});
    }
  }, []);

  // Fetch data from API on mount
  const fetchData = useCallback(async (skipCache = false, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      console.log('🔄 Starting to fetch data...');
      // Only set loading to true if this is not a background refresh
      if (retryCount === 0) {
        setLoading(true);
      }

      console.log('📡 Fetching from API...');
      const [staffData, studentsData, classesData] = await Promise.all([
        staffApi.getAll(skipCache),
        studentsApi.getAll(skipCache),
        classesApi.getAll(skipCache),
      ]);

      // Ensure we always have arrays
      const safeStaffData = Array.isArray(staffData) ? staffData : [];
      const safeStudentsData = Array.isArray(studentsData) ? studentsData : [];
      const safeClassesData = Array.isArray(classesData) ? classesData : [];

      console.log('✅ Data fetched successfully:', {
        staff: safeStaffData.length,
        students: safeStudentsData.length,
        classes: safeClassesData.length
      });

      setStaff(safeStaffData);
      setStudents(safeStudentsData);
      setClasses(safeClassesData.map(c => ({
        ...c,
        name: c.name.replace('Class ', ''),
        strength: c.studentCount || 0,
        classTeacherId: c.classTeacherId,
        attendance: 0, // FIXED: Use 0 instead of random until real calculation available
        // TODO: Calculate from actual student attendance data
      })));

      // Fetch staff attendance after staff data is loaded
      await fetchStaffAttendance();

      setError(null);
    } catch (err) {
      console.error('❌ Failed to fetch data:', err);
      console.error('Error details:', err.message);

      // If unauthorized, clear session and let AuthContext handle redirect
      if (err.message === 'Unauthorized' || err.message === 'Authentication required') {
        console.warn('⚠️ Token expired or invalid, clearing session');
        sessionStorage.removeItem('app_user');
        // Don't show error toast for auth issues, let login page handle it
      } else {
        // Retry logic for network errors
        if (retryCount < MAX_RETRIES && (err.message?.includes('network') || err.message?.includes('fetch'))) {
          console.log(`🔄 Retrying fetch (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return fetchData(skipCache, retryCount + 1);
        }
        
        setError(err.message);
        toast.error('Failed to load data: ' + err.message);
      }
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  }, [fetchStaffAttendance]);

  // Fetch all settings from API
  const fetchSettings = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      setSettingsLoading(true);
      const [schoolData, holidaysData, leaveTypesData, feeHeadsData, subjectsData, calendarEventsData] = await Promise.all([
        settingsApi.getSchoolSettings().catch(() => null),
        settingsApi.getHolidays().catch(() => []),
        settingsApi.getLeaveTypes().catch(() => []),
        settingsApi.getFeeHeads().catch(() => []),
        settingsApi.getSubjects().catch(() => []),
        calendarEventsApi.getAll().catch(() => []),
      ]);

      if (schoolData) {
        setSchoolSettings(prev => ({ ...prev, ...schoolData }));
      }

      // Merge holidays and calendar events
      const holidayEvents = (holidaysData || []).map(h => ({
        id: h.id,
        title: h.name,
        date: h.date,
        type: 'holiday',
        startTime: '',
        endTime: '',
        allDay: true,
        holidayType: h.type || 'National',
      }));

      const calendarEvents = (calendarEventsData || []).map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        type: e.type || 'event',
        startTime: e.startTime || '',
        endTime: e.endTime || '',
        allDay: e.allDay || false,
      }));

      setEvents([...holidayEvents, ...calendarEvents]);

      if (leaveTypesData.length > 0) {
        setLeaveTypes(leaveTypesData);
      }

      if (feeHeadsData.length > 0) {
        setFeeHeads(feeHeadsData);
      }

      if (subjectsData.length > 0) {
        setSchoolSettings(prev => ({ ...prev, subjects: subjectsData }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      
      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && (err.message?.includes('network') || err.message?.includes('fetch'))) {
        console.log(`🔄 Retrying fetchSettings (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchSettings(retryCount + 1);
      }
      
      toast.error('Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch data if user is authenticated (has token in sessionStorage)
    const storedUser = sessionStorage.getItem('app_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Only fetch if we have a valid token
        if (userData.token) {
          fetchData();
          fetchSettings();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Invalid stored user data:', err);
        setLoading(false);
      }
    } else {
      // If not authenticated, just set loading to false
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Listen for storage events to detect login from other tabs or login event
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'app_user' && e.newValue) {
        // User just logged in, fetch data
        fetchData();
        fetchSettings();
      }
    };

    // Also listen for a custom event for same-tab login
    const handleLogin = () => {
      // Verify token exists before fetching
      const storedUser = sessionStorage.getItem('app_user');
      console.log('🔍 handleLogin called, checking sessionStorage...');

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('📋 User data found:', {
            hasToken: !!userData.token,
            userId: userData.id,
            name: userData.name
          });

          if (userData.token) {
            console.log('✅ Token found, fetching data after login');
            fetchData();
            fetchSettings();
          } else {
            console.warn('⚠️ No token found in user data');
          }
        } catch (err) {
          console.error('❌ Error parsing user data:', err);
        }
      } else {
        console.warn('⚠️ No user data in sessionStorage');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-logged-in', handleLogin);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-logged-in', handleLogin);
    };
  }, [fetchData, fetchSettings]);

  // Initialize Socket.IO for real-time updates when user is available
  useEffect(() => {
    // Get user from sessionStorage
    const userStr = sessionStorage.getItem('app_user');
    if (!userStr) {
      console.log('⚠️ No user found in sessionStorage, skipping socket initialization');
      return;
    }

    let user;
    try {
      user = JSON.parse(userStr);
      if (!user || !user.id) {
        console.log('⚠️ Invalid user data in sessionStorage');
        return;
      }
    } catch (err) {
      console.error('❌ Failed to parse user from sessionStorage:', err);
      return;
    }

    console.log('🔌 AppContext: Initializing socket for user:', user.id);

    // Import and initialize socket service
    import('../services/socketServiceEnhanced').then(({ default: socketService }) => {
      console.log('✅ Socket service imported');

      // Make it globally available
      window.socketService = socketService;

      // Connect socket
      socketService.connect(user.id, 'staff');

      // Test listeners
      socketService.on('authenticated', () => {
        console.log('✅ Socket authenticated successfully');
      });

      socketService.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      socketService.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      // Set up global real-time update listeners
      socketService.on('staff_updated', (data) => {
        console.log('📢 Global: Staff updated', data);
        updateStaffLocal(data.staffId, {
          name: data.name,
          role: data.role,
          department: data.department,
          status: data.status,
          phone: data.phone,
          email: data.email,
          picture: data.picture
        });
      });

      socketService.on('student_updated', (data) => {
        console.log('📢 Global: Student updated', data);
        updateStudentLocal(data.studentId, {
          name: data.name,
          classId: data.classId,
          rollNo: data.rollNo,
          photo: data.photo,
          status: data.status
        });
      });

      socketService.on('class_updated', (data) => {
        console.log('📢 Global: Class updated', data);

        // If class teacher is being updated, fetch teacher details
        if (data.classTeacherId !== undefined) {
          const teacher = staff.find(s =>
            String(s.id) === String(data.classTeacherId) || String(s._id) === String(data.classTeacherId)
          );

          updateClassLocal(data.classId, {
            name: data.name,
            section: data.section,
            classTeacherId: data.classTeacherId,
            teacher: teacher?.name,
            teacherPhoto: teacher?.picture
          });
        } else {
          updateClassLocal(data.classId, {
            name: data.name,
            section: data.section,
            classTeacherId: data.classTeacherId
          });
        }
      });

      // Attendance events
      socketService.on('attendance_updated', (data) => {
        console.log('📢 Global: Attendance updated', data);
        console.log('📢 Attendance data - staffId:', data.staffId, 'Date:', data.date, 'Status:', data.status);

        if (data.type === 'staff') {
          console.log('📢 Processing staff attendance update for staffId:', data.staffId);
          console.log('📢 Current staff list has', staff.length, 'members');

          setStaffAttendance(prev => {
            // If status is 'unmarked' or null, remove the record to let the default take over
            if (!data.status || data.status === 'unmarked') {
              const updated = { ...prev };
              if (updated[data.staffId]?.[data.date]) {
                delete updated[data.staffId][data.date];
                // If no more dates for this staff, remove the staff entry
                if (Object.keys(updated[data.staffId] || {}).length === 0) {
                  delete updated[data.staffId];
                }
              }
              console.log('📢 Removed attendance record for', data.staffId, 'on', data.date, '(unmarked)');
              return updated;
            }

            // Otherwise, update with the new status
            const updated = {
              ...prev,
              [data.staffId]: {
                ...(prev[data.staffId] || {}),
                [data.date]: {
                  status: data.status,
                  inTime: data.inTime,
                  outTime: data.outTime,
                  reason: data.reason
                }
              }
            };
            console.log('📢 Updated staffAttendance for', data.staffId, 'on', data.date);
            console.log('📢 New attendance state:', updated[data.staffId]?.[data.date]);
            return updated;
          });
        } else if (data.type === 'student') {
          setStudentAttendance(prev => ({
            ...prev,
            [data.studentId]: {
              ...prev[data.studentId],
              [data.date]: data.status
            }
          }));
        }
      });

      socketService.on('attendance_bulk_updated', (data) => {
        console.log('📢 Global: Bulk attendance updated', data);
        // Trigger a refetch for the affected class/date
        // Components listening to this can refresh their data
      });

      // Fee payment events
      socketService.on('fee_payment_created', (data) => {
        console.log('📢 Global: Fee payment created', data);
        // Update fee payments list
        setFeePayments(prev => [...prev, {
          id: data.paymentId,
          studentId: data.studentId,
          amount: data.amount,
          date: data.paymentDate,
          status: 'paid'
        }]);

        // Update student fee status
        updateStudentLocal(data.studentId, {
          feeStatus: 'paid'
        });
      });

      // Student creation events
      socketService.on('student_created', (data) => {
        console.log('📢 Global: Student created', data);
        setStudents(prev => [...prev, {
          id: data.id,
          name: data.name,
          admissionId: data.admissionId,
          class: data.class,
          status: 'active',
          feeStatus: 'pending',
          timestamp: data.timestamp
        }]);
      });
    }).catch(err => {
      console.error('❌ Failed to import socket service:', err);
    });

    return () => {
      // Cleanup socket on unmount
      if (window.socketService) {
        console.log('🔌 Disconnecting socket...');
        window.socketService.off('student_created');
        window.socketService.disconnect();
      }
    };
  }, []); // Empty dependency - socket listeners are set up once

  // Salary State
  const [salarySettings, setSalarySettings] = useState({
    disburseDate: "",
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

  // Leave Types State
  const [leaveTypes, setLeaveTypes] = useState([
    { id: 1, name: "Sick Leave", applicableTo: "both", quota: 12, requiresApproval: true, approver: "reporter" },
    { id: 2, name: "Casual Leave", applicableTo: "staff", quota: 10, requiresApproval: true, approver: "reporter" },
    { id: 3, name: "Earned Leave", applicableTo: "staff", quota: 15, requiresApproval: true, approver: "principal" },
    { id: 4, name: "Medical Leave", applicableTo: "students", quota: 20, requiresApproval: false, approver: "none" },
  ]);

  // Fee Heads State
  const [feeHeads, setFeeHeads] = useState([
    { id: 1, name: "Tuition Fee", category: "Academic", mandatory: true, amount: 15000 },
    { id: 2, name: "Transport Fee", category: "Transport", mandatory: false, amount: 3000 },
    { id: 3, name: "Library Fee", category: "Academic", mandatory: true, amount: 500 },
    { id: 4, name: "Lab Fee", category: "Academic", mandatory: true, amount: 2000 },
    { id: 5, name: "Sports Fee", category: "Extra-curricular", mandatory: false, amount: 1000 },
    { id: 6, name: "Exam Fee", category: "Academic", mandatory: true, amount: 1500 },
  ]);

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

      // Ensure picture from updates is always included in state update
      // This is critical for instant photo reflection after upload
      const finalUpdates = { ...updated };
      if (updates.picture) {
        finalUpdates.picture = updates.picture;
      }

      setStaff(prev => prev.map(s => String(s.id) === String(id) ? finalUpdates : s));
      return finalUpdates;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update staff in state without API call (for real-time updates)
  const updateStaffLocal = (id, updates) => {
    setStaff(prev => prev.map(s => {
      if (String(s.id) === String(id)) {
        return { ...s, ...updates };
      }
      return s;
    }));
  };

  // Update student in state without API call (for real-time updates)
  const updateStudentLocal = (id, updates) => {
    setStudents(prev => prev.map(s => {
      if (String(s.id) === String(id)) {
        return { ...s, ...updates };
      }
      return s;
    }));
  };

  // Update class in state without API call (for real-time updates)
  const updateClassLocal = (id, updates) => {
    setClasses(prev => prev.map(c => {
      if (String(c.id) === String(id)) {
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  const deleteStaff = async (id) => {
    try {
      await staffApi.delete(id);
      setStaff(prev => prev.filter(s => String(s.id) !== String(id)));
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

  const getStaffById = (id) => Array.isArray(staff) ? staff.find(s => s.id === id || s.id === String(id)) : undefined;

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

      // Ensure photo from updates is always included in state update
      // This is critical for instant photo reflection after upload
      const finalUpdates = { ...updated };
      if (updates.photo) {
        finalUpdates.photo = updates.photo;
      }

      setStudents(prev => prev.map(s => String(s.id) === String(id) ? { ...s, ...finalUpdates } : s));
      return finalUpdates;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStudent = async (id) => {
    try {
      const result = await studentsApi.delete(id);
      // Soft delete: remove from local state but API returns trash info
      setStudents(prev => prev.filter(s => String(s.id) !== String(id)));
      return result; // Return result for undo functionality
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getStudentById = (id) => Array.isArray(students) ? students.find(s => String(s.id) === String(id)) : undefined;
  // FIXED: Use String() comparison for ObjectId matching and filter by active status
  const getStudentsByClass = (classId) => Array.isArray(students) ? students.filter(s =>
    String(s.classId) === String(classId) &&
    (s.status || 'active') === 'active' &&
    s.isDeleted !== true
  ) : [];

  // Class functions - now using API
  const addClass = async (newClass) => {
    try {
      const created = await classesApi.create(newClass);
      setClasses(prev => [...prev, { ...created, name: created.name.replace('Class ', ''), strength: 0, attendance: 0 }]);
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

  const getClassById = (id) => Array.isArray(classes) ? classes.find(c => c.id === id) : undefined;

  // Event functions - with API integration
  const addEvent = async (newEvent) => {
    // If it's a holiday, use holiday API
    if (newEvent.type === 'holiday') {
      try {
        const holidayData = {
          name: newEvent.title,
          date: newEvent.date,
          type: newEvent.holidayType || 'National',
        };
        const created = await settingsApi.createHoliday(holidayData);
        const eventWithId = {
          id: created.id,
          title: created.name,
          date: created.date,
          type: 'holiday',
          startTime: '',
          endTime: '',
          allDay: true,
          holidayType: created.type,
        };
        setEvents(prev => [...prev, eventWithId]);
        toast.success('Holiday added successfully');
        return eventWithId;
      } catch (err) {
        console.error('Failed to add holiday:', err);
        toast.error('Failed to add holiday');
        throw err;
      }
    } else {
      // For non-holiday events, use calendar events API
      // Create a local event first for immediate display
      const localEvent = {
        id: `temp-${Date.now()}`,
        title: newEvent.title,
        date: newEvent.date,
        type: newEvent.type || 'event',
        startTime: newEvent.startTime || '',
        endTime: newEvent.endTime || '',
        allDay: newEvent.allDay || false
      };

      // Optimistically add to local state
      setEvents(prev => [...prev, localEvent]);

      try {
        const created = await calendarEventsApi.create({
          title: newEvent.title,
          date: newEvent.date,
          type: newEvent.type || 'event',
          startTime: newEvent.startTime || '',
          endTime: newEvent.endTime || '',
          allDay: newEvent.allDay || false
        });

        // Replace temp event with the real one from API
        setEvents(prev => prev.map(e => e.id === localEvent.id ? created : e));
        toast.success('Event added successfully');
        return created;
      } catch (err) {
        console.error('Failed to save event to server:', err);
        // Keep the local event but show warning
        toast.error('Event saved locally (server unavailable)');
        return localEvent;
      }
    }
  };

  const updateEvent = async (id, updates) => {
    const event = events.find(e => e.id === id);
    if (event && event.type === 'holiday') {
      try {
        const holidayData = {
          name: updates.title || event.title,
          date: updates.date || event.date,
          type: updates.holidayType || event.holidayType,
        };
        await settingsApi.updateHoliday(id, holidayData);
        setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        toast.success('Holiday updated successfully');
      } catch (err) {
        console.error('Failed to update holiday:', err);
        toast.error('Failed to update holiday');
        throw err;
      }
    } else {
      try {
        await calendarEventsApi.update(id, updates);
        setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        toast.success('Event updated successfully');
      } catch (err) {
        console.error('Failed to update event:', err);
        toast.error('Failed to update event');
        throw err;
      }
    }
  };

  const deleteEvent = async (id) => {
    const event = events.find(e => e.id === id);
    if (event && event.type === 'holiday') {
      try {
        await settingsApi.deleteHoliday(id);
        setEvents(prev => prev.filter(e => e.id !== id));
        toast.success('Holiday deleted successfully');
      } catch (err) {
        console.error('Failed to delete holiday:', err);
        toast.error('Failed to delete holiday');
        throw err;
      }
    } else {
      try {
        await calendarEventsApi.delete(id);
        setEvents(prev => prev.filter(e => e.id !== id));
        toast.success('Event deleted successfully');
      } catch (err) {
        console.error('Failed to delete event:', err);
        toast.error('Failed to delete event');
        throw err;
      }
    }
  };

  const getEventsForDate = (date) => Array.isArray(events) ? events.filter(e => e.date === date) : [];

  // Fee functions
  const addFeePayment = (payment) => {
    const paymentWithId = { ...payment, id: Date.now() };
    setFeePayments(prev => [...prev, paymentWithId]);
    // Update student fee status
    setStudents(prev => prev.map(s => s.id === payment.studentId ? { ...s, feeStatus: "paid" } : s));
    return paymentWithId;
  };

  const getStudentFeeHistory = (studentId) => Array.isArray(feePayments) ? feePayments.filter(p => p.studentId === studentId) : [];

  // Announcement functions
  const addAnnouncement = (announcement) => {
    const announcementWithId = { ...announcement, id: Date.now() };
    setAnnouncements(prev => [...prev, announcementWithId]);
    return announcementWithId;
  };

  // School Settings functions - with API integration
  const updateSchoolSettings = async (updates) => {
    try {
      const updated = await settingsApi.updateSchoolSettings(updates);
      setSchoolSettings(prev => ({ ...prev, ...updated }));
      toast.success('School settings updated successfully');
      return updated;
    } catch (err) {
      console.error('Failed to update school settings:', err);
      toast.error('Failed to update school settings');
      throw err;
    }
  };

  const addSubject = async (subject) => {
    try {
      const created = await settingsApi.createSubject(subject);
      setSchoolSettings(prev => ({ ...prev, subjects: [...prev.subjects, created] }));
      toast.success('Subject added successfully');
      return created;
    } catch (err) {
      console.error('Failed to add subject:', err);
      toast.error('Failed to add subject');
      // Fallback to local state
      const subjectWithId = { ...subject, id: nextSubjectId };
      setSchoolSettings(prev => ({ ...prev, subjects: [...prev.subjects, subjectWithId] }));
      setNextSubjectId(prev => prev + 1);
      return subjectWithId;
    }
  };

  const updateSubject = async (id, updates) => {
    try {
      console.log('✏️ Updating subject:', id, 'with:', updates);
      const updated = await settingsApi.updateSubject(id, updates);
      setSchoolSettings(prev => ({
        ...prev,
        subjects: prev.subjects.map(s => {
          const subjectId = s.id || s._id;
          return String(subjectId) === String(id) ? updated : s;
        })
      }));
      toast.success('Subject updated successfully');
      return updated;
    } catch (err) {
      console.error('Failed to update subject:', err);
      toast.error('Failed to update subject');
      // Fallback to local state
      setSchoolSettings(prev => ({
        ...prev,
        subjects: prev.subjects.map(s => {
          const subjectId = s.id || s._id;
          return String(subjectId) === String(id) ? { ...s, ...updates } : s;
        })
      }));
    }
  };

  const deleteSubject = async (id) => {
    try {
      console.log('🗑️ Deleting subject:', id, 'Current subjects:', schoolSettings.subjects);
      await settingsApi.deleteSubject(id);
      setSchoolSettings(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => {
          const subjectId = s.id || s._id;
          const match = String(subjectId) !== String(id);
          console.log(`Filtering subject: ${subjectId} vs ${id} = ${match}`);
          return match;
        })
      }));
      toast.success('Subject deleted successfully');
      console.log('✅ Subject deleted, remaining:', schoolSettings.subjects?.filter(s => String(s.id || s._id) !== String(id)));
    } catch (err) {
      console.error('❌ Failed to delete subject:', err);
      toast.error('Failed to delete subject');
      throw err;
    }
  };

  // Salary Logic
  const updateSalarySettings = (type, action, item) => { // type: 'earnings' | 'deductions' | 'general', action: 'add' | 'remove' | 'update'
    setSalarySettings(prev => {
      if (action === "add") {
        return { ...prev, [type]: [...prev[type], { id: item.name.toLowerCase().replace(/\s+/g, ''), ...item }] };
      } else if (action === "remove") {
        return { ...prev, [type]: prev[type].filter(i => i.id !== item.id) };
      } else if (action === "update") {
        return { ...prev, ...item };
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

  const getPayrollForMonth = (month) => Array.isArray(payrollHistory) ? payrollHistory.find(p => p.month === month) : undefined;

  // Leave Types functions - with API integration
  const addLeaveType = async (leaveType) => {
    try {
      const created = await settingsApi.createLeaveType(leaveType);
      setLeaveTypes(prev => [...prev, created]);
      toast.success('Leave type added successfully');
      return created;
    } catch (err) {
      console.error('Failed to add leave type:', err);
      toast.error('Failed to add leave type');
      // Fallback to local state
      const leaveTypeWithId = { ...leaveType, id: Date.now() };
      setLeaveTypes(prev => [...prev, leaveTypeWithId]);
      return leaveTypeWithId;
    }
  };

  const updateLeaveType = async (id, updates) => {
    try {
      const updated = await settingsApi.updateLeaveType(id, updates);
      setLeaveTypes(prev => prev.map(lt => lt.id === id ? updated : lt));
      toast.success('Leave type updated successfully');
      return updated;
    } catch (err) {
      console.error('Failed to update leave type:', err);
      toast.error('Failed to update leave type');
      // Fallback to local state
      setLeaveTypes(prev => prev.map(lt => lt.id === id ? { ...lt, ...updates } : lt));
    }
  };

  const deleteLeaveType = async (id) => {
    try {
      await settingsApi.deleteLeaveType(id);
      setLeaveTypes(prev => prev.filter(lt => lt.id !== id));
      toast.success('Leave type deleted successfully');
    } catch (err) {
      console.error('Failed to delete leave type:', err);
      toast.error('Failed to delete leave type');
      throw err;
    }
  };

  // Fee Heads functions - with API integration
  const addFeeHead = async (feeHead) => {
    try {
      const created = await settingsApi.createFeeHead(feeHead);
      setFeeHeads(prev => [...prev, created]);
      toast.success('Fee head added successfully');
      return created;
    } catch (err) {
      console.error('Failed to add fee head:', err);
      toast.error('Failed to add fee head');
      // Fallback to local state
      const feeHeadWithId = { ...feeHead, id: Date.now() };
      setFeeHeads(prev => [...prev, feeHeadWithId]);
      return feeHeadWithId;
    }
  };

  const updateFeeHead = async (id, updates) => {
    try {
      const updated = await settingsApi.updateFeeHead(id, updates);
      setFeeHeads(prev => prev.map(fh => fh.id === id ? updated : fh));
      toast.success('Fee head updated successfully');
      return updated;
    } catch (err) {
      console.error('Failed to update fee head:', err);
      toast.error('Failed to update fee head');
      // Fallback to local state
      setFeeHeads(prev => prev.map(fh => fh.id === id ? { ...fh, ...updates } : fh));
    }
  };

  const deleteFeeHead = async (id) => {
    try {
      await settingsApi.deleteFeeHead(id);
      setFeeHeads(prev => prev.filter(fh => fh.id !== id));
      toast.success('Fee head deleted successfully');
    } catch (err) {
      console.error('Failed to delete fee head:', err);
      toast.error('Failed to delete fee head');
      throw err;
    }
  };

  const isBeforeSchoolHours = useMemo(() => {
    const now = new Date();
    const [startHour, startMin] = schoolSettings.schoolStartTime.split(":").map(Number);
    const schoolStart = new Date();
    schoolStart.setHours(startHour, startMin, 0, 0);
    return now < schoolStart;
  }, [schoolSettings.schoolStartTime]);

  // Attendance functions
  const fetchStaffAttendanceForDate = useCallback(async (date) => {
    try {
      const data = await staffAttendanceApi.getByDate(date);
      setStaffAttendance(prev => {
        const updated = { ...prev };
        data.forEach(record => {
          const staffId = record.staffId instanceof Object ? record.staffId._id : record.staffId;
          if (!updated[staffId]) updated[staffId] = {};

          updated[staffId][record.date] = {
            status: record.status,
            inTime: record.inTime || record.checkInTime || '-',
            outTime: record.outTime || record.checkOutTime || '-',
            reason: record.reason || '',
            regularization: record.regularization
          };
        });
        return updated;
      });
      return data;
    } catch (err) {
      console.error('Failed to fetch staff attendance for date:', err);
      // Don't throw, just return empty to fail gracefully
      return [];
    }
  }, []);

  const fetchStaffAttendanceByStaff = useCallback(async (staffId, startDate, endDate) => {
    try {
      const data = await staffAttendanceApi.getByStaff(staffId, startDate, endDate);
      setStaffAttendance(prev => {
        const updated = { ...prev };
        if (!updated[staffId]) updated[staffId] = {};

        data.forEach(record => {
          updated[staffId][record.date] = {
            status: record.status,
            inTime: record.inTime || record.checkInTime || '-',
            outTime: record.outTime || record.checkOutTime || '-',
            reason: record.reason || '',
            regularization: record.regularization
          };
        });
        return updated;
      });
      return data;
    } catch (err) {
      console.error('Failed to fetch staff attendance history:', err);
      return [];
    }
  }, []);

  const markStaffAttendance = async (staffId, date, status, inTime = "-", outTime = "-", reason = "") => {
    // Optimistic update
    setStaffAttendance(prev => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {}),
        [date]: { status, inTime, outTime, reason }
      }
    }));

    try {
      const user = JSON.parse(sessionStorage.getItem('app_user') || '{}');
      await staffAttendanceApi.mark({
        staffId,
        date,
        status,
        checkInTime: inTime,
        checkOutTime: outTime,
        reason,
        markedBy: user.id
      });
      toast.success('Attendance marked successfully');
    } catch (err) {
      console.error('Failed to mark attendance on server:', err);
      toast.error('Failed to save attendance');
      // Ideally revert state here, but for now we keep optimistic update
    }
  };

  const markStudentAttendance = (studentId, date, status) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [date]: { status } }
    }));
  };

  const getStaffAttendanceForDate = (date) => {
    const result = {};
    if (Array.isArray(staff)) {
      staff.forEach(s => {
        result[s.id] = staffAttendance[s.id]?.[date] || { status: "unmarked", inTime: "-", outTime: "-" };
      });
    }
    return result;
  };

  const markAllStaffAttendance = async (date, status, specificStaffIds = null, reason = "", inTime = null, outTime = null) => {
    // Determine target IDs
    const targetStaffIds = specificStaffIds || (Array.isArray(staff) ? staff.filter(s => s.status === "active").map(s => s.id) : []);

    const checkIn = inTime || (status === "present" ? "09:00" : "-");
    const checkOut = outTime || "-";

    // Optimistic update
    setStaffAttendance(prev => {
      const newAtt = { ...prev };
      targetStaffIds.forEach(id => {
        if (!newAtt[id]) newAtt[id] = {};
        newAtt[id][date] = {
          status,
          inTime: checkIn,
          outTime: checkOut,
          reason
        };
      });
      return newAtt;
    });

    try {
      const user = JSON.parse(sessionStorage.getItem('app_user') || '{}');

      await staffAttendanceApi.markBulk({
        date,
        staffIds: targetStaffIds,
        status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        reason,
        markedBy: user.id
      });
      toast.success('Bulk attendance marked successfully');
    } catch (err) {
      console.error('Failed to bulk mark attendance:', err);
      toast.error('Failed to save bulk attendance');
    }
  };

  // Regularization functions
  const requestRegularization = async (staffId, date, requestedStatus, reason) => {
    try {
      const user = JSON.parse(sessionStorage.getItem('app_user') || '{}');
      
      // The backend endpoint is PUT /:id/regularize where :id is staffId
      // It needs date, status, checkInTime, checkOutTime, reason, regularizedBy in body
      const response = await staffAttendanceApi.regularize(staffId, {
        date: date,
        status: requestedStatus,
        checkInTime: requestedStatus === 'present' ? '09:00' : '-',
        checkOutTime: '-',
        reason: reason,
        regularizedBy: user.id
      });

      // Update local state
      setStaffAttendance(prev => ({
        ...prev,
        [staffId]: {
          ...(prev[staffId] || {}),
          [date]: {
            status: requestedStatus,
            inTime: response.checkInTime || '-',
            outTime: response.checkOutTime || '-',
            reason: reason,
            regularization: response.regularization
          }
        }
      }));

      toast.success('Attendance regularized successfully');
      return response;
    } catch (err) {
      console.error('Regularization failed:', err);
      toast.error('Failed to regularize attendance');
      throw err;
    }
  };

  const approveRegularization = async (staffId, date, data) => {
    // Since current backend supports direct regularization, this might be redundant or same as above
    // keeping placeholder for future enhancement
    return requestRegularization(staffId, date, data.status, data.note);
  };

  const fetchPendingRegularizations = async () => {
    // Backend doesn't have this endpoint yet in this project version
    // returning empty for now
    return [];
  };

  const getMonthlyAttendance = (staffId, year, month) => {
    const staffAtt = staffAttendance[staffId] || {};
    let present = 0, absent = 0, leave = 0, halfday = 0;
    Object.entries(staffAtt).forEach(([date, data]) => {
      const d = new Date(date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (data.status === "present") present++;
        else if (data.status === "absent") absent++;
        else if (data.status === "leave") leave++;
        else if (data.status === "halfday") halfday++;
      }
    });
    return { present, absent, leave, halfday, total: present + absent + leave + halfday };
  };

  // Computed values
  const teachers = useMemo(() => Array.isArray(staff) ? staff.filter(s => {
    const roles = Array.isArray(s.role) ? s.role : [s.role];
    return roles.includes("Teacher") && s.status === "active";
  }) : [], [staff]);

  const classesWithTeachers = useMemo(() => {
    if (!Array.isArray(classes) || !Array.isArray(staff) || !Array.isArray(students)) return [];
    return classes.map(c => ({
      ...c,
      teacher: staff.find(s =>
        String(s.id) === String(c.classTeacherId) || String(s._id) === String(c.classTeacherId)
      )?.name || "Unassigned",
      teacherPhoto: staff.find(s =>
        String(s.id) === String(c.classTeacherId) || String(s._id) === String(c.classTeacherId)
      )?.picture || null,
      // FIXED: Use String() comparison for ObjectId matching and filter by active status
      studentCount: students.filter(s =>
        String(s.classId) === String(c.id) &&
        (s.status || 'active') === 'active' &&
        s.isDeleted !== true
      ).length,
    }));
  }, [classes, staff, students]);

  const feeDefaulters = useMemo(() => Array.isArray(students) ? students.filter(s => s.feeStatus === "overdue" || s.feeStatus === "pending") : [], [students]);

  const dashboardStats = useMemo(() => ({
    totalStaff: Array.isArray(staff) ? staff.length : 0,
    activeStaff: Array.isArray(staff) ? staff.filter(s => s.status === "active").length : 0,
    totalStudents: Array.isArray(students) ? students.length : 0,
    totalClasses: Array.isArray(classes) ? classes.length : 0,
    totalTeachers: teachers.length,
    feeDefaultersCount: feeDefaulters.length,
    upcomingEvents: Array.isArray(events) ? events.filter(e => new Date(e.date) >= new Date()).length : 0,
  }), [staff, students, classes, teachers, feeDefaulters, events]);

  // Theme Management (simplified - no color changing)
  const initialThemeSettings = {
    mode: "light",
    fontFamily: "Inter",
    fontSizeScale: 1,
    borderRadius: 12,
    reduceMotion: false,
  };

  const [themeSettings, setThemeSettings] = useState(() => {
    const saved = localStorage.getItem("themeSettings");
    return saved ? JSON.parse(saved) : initialThemeSettings;
  });

  const updateThemeSettings = (newSettings) => {
    setThemeSettings(newSettings);
    localStorage.setItem("themeSettings", JSON.stringify(newSettings));
  };

  const resetThemeSettings = () => {
    setThemeSettings(initialThemeSettings);
    localStorage.setItem("themeSettings", JSON.stringify(initialThemeSettings));
  };

  // Apply theme settings (font, border radius, etc.)
  useEffect(() => {
    const root = document.documentElement;

    // Apply Font
    root.style.setProperty('--font-sans', `"${themeSettings.fontFamily}", sans-serif`);

    // Apply Border Radius
    root.style.setProperty('--nextui-radius-small', `${themeSettings.borderRadius * 0.5}px`);
    root.style.setProperty('--nextui-radius-medium', `${themeSettings.borderRadius}px`);
    root.style.setProperty('--nextui-radius-large', `${themeSettings.borderRadius * 1.5}px`);

    // Apply Font Scale
    root.style.fontSize = `${themeSettings.fontSizeScale * 100}%`;

  }, [themeSettings]);

  const value = useMemo(() => ({
    // Data
    staff, students, classes, events, feePayments, announcements,
    staffAttendance, studentAttendance, schoolSettings,
    leaveTypes, feeHeads,
    loading, error, settingsLoading, refetch: fetchData, refetchSettings: fetchSettings,
    // Computed
    teachers, classesWithTeachers, feeDefaulters, dashboardStats, isBeforeSchoolHours,
    // Staff actions
    addStaff, updateStaff, updateStaffLocal, deleteStaff, toggleStaffStatus, getStaffById,
    // Student actions
    addStudent, updateStudent, updateStudentLocal, deleteStudent, getStudentById, getStudentsByClass,
    // Class actions
    addClass, updateClass, updateClassLocal, deleteClass, getClassById,
    // Event actions
    addEvent, updateEvent, deleteEvent, getEventsForDate,
    // Fee actions
    addFeePayment, getStudentFeeHistory,
    // Announcement actions
    addAnnouncement,
    // Attendance actions
    markStaffAttendance, markStudentAttendance, getStaffAttendanceForDate,
    markAllStaffAttendance, getMonthlyAttendance,
    fetchStaffAttendanceForDate, fetchStaffAttendanceByStaff,
    requestRegularization, approveRegularization, fetchPendingRegularizations,
    // School Settings actions
    updateSchoolSettings, addSubject, updateSubject, deleteSubject,
    // Leave Types actions
    addLeaveType, updateLeaveType, deleteLeaveType,
    // Fee Heads actions
    addFeeHead, updateFeeHead, deleteFeeHead,
    // Salary functions
    salarySettings, staffSalaries, payrollHistory,
    updateSalarySettings, updateStaffSalary, processPayroll, getPayrollForMonth,
    // Academic & other actions
    lessonPlans, documents, remarks,
    addLessonPlan, addDocument, addRemark,
    // APIs
    classesApi, classesEnhancedApi, teacherAssignmentsApi, teacherTimetableApi,
    // Theme
    themeSettings, updateThemeSettings, resetThemeSettings,
    // Onboarding
    showOnboarding, setShowOnboarding
  }), [
    staff, students, classes, events, feePayments, announcements,
    staffAttendance, studentAttendance, schoolSettings,
    leaveTypes, feeHeads,
    loading, error, settingsLoading,
    teachers, classesWithTeachers, feeDefaulters, dashboardStats, isBeforeSchoolHours,
    salarySettings, staffSalaries, payrollHistory,
    lessonPlans, documents, remarks,
    themeSettings,
    showOnboarding
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
