import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { staffApi, studentsApi, classesApi, classesEnhancedApi, settingsApi, teacherAssignmentsApi, teacherTimetableApi, staffAttendanceApi, calendarEventsApi } from "../services/api";
import toast from "react-hot-toast";
import { CURRENT_ACADEMIC_YEAR } from "../utils/constants";
import { clearStoredUser, getStoredUser, getStoredAuthToken } from "../utils/authSession";
import { isSuperAdminRole } from "../utils/roleUtils";
import { showErrorToast } from "../utils/errorHandling";
import { syncSchoolLanguage } from "../i18n";

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

const ADMIN_LIKE_ROLES = new Set(["admin", "principal", "vice principal", "vice-principal", "super admin", "superadmin"]);
const TEACHER_ROLES = new Set(["teacher"]);

function normalizeClassName(name = "") {
  return String(name).replace(/^Class\s+/i, "").trim();
}

function extractRoleNames(roleValue) {
  if (Array.isArray(roleValue)) {
    return roleValue
      .flatMap((role) => extractRoleNames(role))
      .filter(Boolean);
  }

  if (typeof roleValue !== "string") {
    return [];
  }

  return [roleValue.toLowerCase().trim()];
}

function hasAnyRole(user, allowedRoles) {
  return extractRoleNames(user?.role).some((role) => allowedRoles.has(role));
}

function formatClassLabel(className, section) {
  const normalizedName = normalizeClassName(className);
  if (!normalizedName) {
    return null;
  }

  return section ? `${normalizedName}-${section}` : normalizedName;
}

function normalizeStaffMember(staffMember, fallbackUser = null) {
  const source = staffMember || fallbackUser;
  if (!source) {
    return null;
  }

  return {
    ...source,
    id: String(source.id || source._id || ""),
    role: source.role || fallbackUser?.role || [],
    status: source.status || "active",
    picture: source.picture || source.photo || fallbackUser?.picture || null,
    photo: source.photo || source.picture || fallbackUser?.picture || null,
  };
}

function normalizeClassRecord(classItem, fallbackClassTeacherId = null) {
  if (!classItem) {
    return null;
  }

  const sourceName = classItem.className || classItem.name || "";
  const normalizedName = normalizeClassName(sourceName);
  const classTeacherId = classItem.classTeacherId || (classItem.isClassTeacher ? fallbackClassTeacherId : null);
  const studentCount = classItem.studentCount ?? classItem.strength ?? classItem.students ?? 0;

  return {
    ...classItem,
    id: String(classItem.id || classItem._id || ""),
    name: normalizedName,
    section: classItem.section || "",
    classTeacherId: classTeacherId ? String(classTeacherId) : null,
    strength: studentCount,
    studentCount,
    attendance: classItem.attendance ?? 0,
  };
}

function normalizeStudentRecord(student, classLookup = new Map()) {
  if (!student) {
    return null;
  }

  const classId = String(student.classId?._id || student.classId || "");
  const relatedClass = classLookup.get(classId);
  const classLabel = student.class || formatClassLabel(relatedClass?.name, relatedClass?.section);
  const className = student.className || (relatedClass ? `Class ${relatedClass.name}${relatedClass.section ? ` ${relatedClass.section}` : ""}` : null);

  return {
    ...student,
    id: String(student.id || student._id || ""),
    classId,
    class: classLabel,
    className,
    feeStatus: student.feeStatus || "pending",
    status: student.status || "active",
  };
}

function dedupeById(items = []) {
  const deduped = new Map();

  items.forEach((item) => {
    if (item?.id) {
      deduped.set(String(item.id), item);
    }
  });

  return Array.from(deduped.values());
}

const STUDENT_PRELOAD_PATH_PATTERNS = [
  /^\/$/,
  /^\/analytics(?:\/|$)/,
  /^\/classes(?:\/|$)/,
  /^\/messaging(?:\/|$)/,
  /^\/settings\/subscription(?:\/|$)/,
  /^\/students\/.+/,
];

function shouldHydrateStudentsForPath(pathname = "") {
  if (/^\/students\/?$/.test(pathname)) {
    return false;
  }

  return STUDENT_PRELOAD_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

async function fetchStaffAttendanceData() {
  try {
    const attendanceData = await staffAttendanceApi.getAll();
    const transformedData = {};

    if (Array.isArray(attendanceData)) {
      attendanceData.forEach((record) => {
        const { staffId, date, status, checkInTime, checkOutTime, reason } = record;

        if (!transformedData[staffId]) {
          transformedData[staffId] = {};
        }

        transformedData[staffId][date] = {
          status,
          inTime: checkInTime || "-",
          outTime: checkOutTime || "-",
          reason: reason || "",
        };
      });
    }

    return transformedData;
  } catch (error) {
    console.error("Failed to fetch staff attendance:", error);
    return {};
  }
}

async function loadAllStudentsForContext(skipCache = false) {
  const firstPage = await studentsApi.list({
    page: 1,
    limit: 100,
  }, { skipCache });

  const allStudents = [...(firstPage.data || [])];
  const totalPages = firstPage.pagination?.totalPages || 1;

  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const results = await Promise.all(
      remainingPages.map((page) =>
        studentsApi.list({ page, limit: 100 }, { skipCache })
      )
    );
    results.forEach((pageResult) => {
      allStudents.push(...(pageResult.data || []));
    });
  }

  return allStudents;
}

async function fetchTeacherScopedAppData(user, teacherTimetableYear, skipCache = false, options = {}) {
  const includeStudents = options.includeStudents ?? true;
  const [staffProfile, assignedClassRefs] = await Promise.all([
    staffApi.getById(user.id).catch(() => user),
    staffApi.getClasses(user.id).catch(() => []),
    teacherTimetableApi.get(user.id, teacherTimetableYear).catch(() => null),
  ]);

  const normalizedStaffProfile = normalizeStaffMember(staffProfile, user);
  const classMap = new Map();

  (user.classes || []).forEach((classItem) => {
    const normalizedClass = normalizeClassRecord(classItem, user.id);
    if (normalizedClass?.id) {
      classMap.set(normalizedClass.id, normalizedClass);
    }
  });

  (assignedClassRefs || []).forEach((classItem) => {
    const normalizedClass = normalizeClassRecord(classItem, user.id);
    if (normalizedClass?.id) {
      classMap.set(normalizedClass.id, {
        ...(classMap.get(normalizedClass.id) || {}),
        ...normalizedClass,
      });
    }
  });

  const classIds = Array.from(classMap.keys());
  const detailedClasses = await Promise.all(
    classIds.map((classId) => classesApi.getById(classId).catch(() => null))
  );

  detailedClasses.forEach((classItem) => {
    const normalizedClass = normalizeClassRecord(classItem);
    if (normalizedClass?.id) {
      classMap.set(normalizedClass.id, {
        ...(classMap.get(normalizedClass.id) || {}),
        ...normalizedClass,
      });
    }
  });

  const normalizedClasses = Array.from(classMap.values());
  let normalizedStudents = [];

  if (includeStudents) {
    const classLookup = new Map(normalizedClasses.map((classItem) => [String(classItem.id), classItem]));
    const studentsByClass = await Promise.all(
      normalizedClasses.map((classItem) => classesApi.getStudents(classItem.id).catch(() => []))
    );

    normalizedStudents = dedupeById(
      studentsByClass
        .flat()
        .map((student) => normalizeStudentRecord(student, classLookup))
        .filter(Boolean)
    );
  }

  return {
    staff: normalizedStaffProfile ? [normalizedStaffProfile] : [],
    students: normalizedStudents,
    classes: normalizedClasses,
    staffAttendance: {},
    includeStudents,
  };
}

async function fetchOperationalAppData(user, skipCache = false, options = {}) {
  const includeStudents = options.includeStudents ?? true;
  const [staffProfile, studentsData, classesData] = await Promise.all([
    staffApi.getById(user.id).catch(() => user),
    includeStudents ? loadAllStudentsForContext(skipCache) : Promise.resolve([]),
    classesApi.getAll(skipCache),
  ]);

  const normalizedClasses = (Array.isArray(classesData) ? classesData : [])
    .map((classItem) => normalizeClassRecord(classItem))
    .filter(Boolean);
  const classLookup = new Map(normalizedClasses.map((classItem) => [String(classItem.id), classItem]));
  const normalizedStudents = (Array.isArray(studentsData) ? studentsData : [])
    .map((student) => normalizeStudentRecord(student, classLookup))
    .filter(Boolean);
  const normalizedStaffProfile = normalizeStaffMember(staffProfile, user);

  return {
    staff: normalizedStaffProfile ? [normalizedStaffProfile] : [],
    students: normalizedStudents,
    classes: normalizedClasses,
    staffAttendance: {},
    includeStudents,
  };
}

async function fetchAdministrativeAppData(skipCache = false, options = {}) {
  const includeStudents = options.includeStudents ?? true;
  const [staffData, studentsData, classesData, nextStaffAttendance] = await Promise.all([
    staffApi.getAll(skipCache),
    includeStudents ? loadAllStudentsForContext(skipCache) : Promise.resolve([]),
    classesApi.getAll(skipCache),
    fetchStaffAttendanceData(),
  ]);

  const normalizedClasses = (Array.isArray(classesData) ? classesData : [])
    .map((classItem) => normalizeClassRecord(classItem))
    .filter(Boolean);
  const classLookup = new Map(normalizedClasses.map((classItem) => [String(classItem.id), classItem]));
  const normalizedStudents = (Array.isArray(studentsData) ? studentsData : [])
    .map((student) => normalizeStudentRecord(student, classLookup))
    .filter(Boolean);
  const normalizedStaff = (Array.isArray(staffData) ? staffData : [])
    .map((staffMember) => normalizeStaffMember(staffMember))
    .filter(Boolean);

  return {
    staff: normalizedStaff,
    students: normalizedStudents,
    classes: normalizedClasses,
    staffAttendance: nextStaffAttendance,
    includeStudents,
  };
}

async function fetchRoleAwareAppData({ user, teacherTimetableYear, skipCache = false, includeStudents = true }) {
  if (hasAnyRole(user, ADMIN_LIKE_ROLES)) {
    return fetchAdministrativeAppData(skipCache, { includeStudents });
  }

  if (hasAnyRole(user, TEACHER_ROLES)) {
    return fetchTeacherScopedAppData(user, teacherTimetableYear, skipCache, { includeStudents });
  }

  return fetchOperationalAppData(user, skipCache, { includeStudents });
}

async function fetchAppSettingsData() {
  const [schoolData, holidaysData, leaveTypesData, feeHeadsData, subjectsData, calendarEventsData] = await Promise.all([
    settingsApi.getSchoolSettings().catch(() => null),
    settingsApi.getHolidays().catch(() => []),
    settingsApi.getLeaveTypes().catch(() => []),
    settingsApi.getFeeHeads().catch(() => []),
    settingsApi.getSubjects().catch(() => []),
    calendarEventsApi.getAll().catch(() => []),
  ]);

  const holidayEvents = (holidaysData || []).map((holiday) => ({
    id: holiday.id,
    title: holiday.name,
    date: holiday.date,
    type: "holiday",
    startTime: "",
    endTime: "",
    allDay: true,
    holidayType: holiday.type || "National",
  }));

  const calendarEvents = (calendarEventsData || []).map((event) => ({
    id: event.id,
    title: event.title,
    date: event.date,
    type: event.type || "event",
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    allDay: event.allDay || false,
  }));

  return {
    schoolSettings: {
      ...initialSchoolSettings,
      ...(schoolData || {}),
      subjects: subjectsData.length > 0 ? subjectsData : (schoolData?.subjects || initialSchoolSettings.subjects),
    },
    events: [...holidayEvents, ...calendarEvents],
    leaveTypes: leaveTypesData || [],
    feeHeads: feeHeadsData || [],
  };
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const location = useLocation();
  const shouldPreloadStudents = shouldHydrateStudentsForPath(location.pathname);
  const queryClient = useQueryClient();
  const appErrorToastRef = useRef(null);
  const settingsErrorToastRef = useRef(null);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [staffAttendance, setStaffAttendance] = useState({});
  const [studentAttendance, setStudentAttendance] = useState({});
  const [schoolSettings, setSchoolSettings] = useState(initialSchoolSettings);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [studentsHydrated, setStudentsHydrated] = useState(false);
  const storedUser = useMemo(() => getStoredUser(), [sessionVersion]);
  const isSuperAdmin = isSuperAdminRole(storedUser?.role);
  const roleKey = useMemo(
    () => extractRoleNames(storedUser?.role).sort().join(","),
    [storedUser?.role]
  );

  const teacherTimetableYear = schoolSettings?.academicYear || CURRENT_ACADEMIC_YEAR;
  const appQueryKey = useMemo(() => ([
    "app-context-data",
    sessionVersion,
    storedUser?.id ?? "anonymous",
    roleKey,
    shouldPreloadStudents,
    teacherTimetableYear,
  ]), [roleKey, sessionVersion, shouldPreloadStudents, storedUser?.id, teacherTimetableYear]);
  const settingsQueryKey = useMemo(() => ([
    "app-settings-data",
    sessionVersion,
    storedUser?.id ?? "anonymous",
  ]), [sessionVersion, storedUser?.id]);

  const appDataQuery = useQuery({
    queryKey: appQueryKey,
    enabled: Boolean(storedUser?.id) && !isSuperAdmin,
    placeholderData: (previousData) => previousData,
    queryFn: () => fetchRoleAwareAppData({
      user: storedUser,
      teacherTimetableYear,
      includeStudents: shouldPreloadStudents,
    }),
  });
  const settingsDataQuery = useQuery({
    queryKey: settingsQueryKey,
    enabled: Boolean(storedUser?.id) && !isSuperAdmin,
    placeholderData: (previousData) => previousData,
    queryFn: fetchAppSettingsData,
  });
  const loading = Boolean(storedUser?.id) && !isSuperAdmin && appDataQuery.isPending;
  const settingsLoading = Boolean(storedUser?.id) && !isSuperAdmin && settingsDataQuery.isPending;

  const invalidateAppData = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["app-context-data"] });
  }, [queryClient]);

  const invalidateSettingsData = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["app-settings-data"] });
  }, [queryClient]);

  const refetch = useCallback(async (skipCache = false, _retryCount = 0, options = {}) => {
    const includeStudents = options.includeStudents ?? shouldPreloadStudents;

    if (!storedUser?.id || isSuperAdmin) {
      return null;
    }

    return queryClient.fetchQuery({
      queryKey: [
        "app-context-data",
        sessionVersion,
        storedUser.id,
        roleKey,
        includeStudents,
        teacherTimetableYear,
      ],
      queryFn: () => fetchRoleAwareAppData({
        user: storedUser,
        teacherTimetableYear,
        skipCache,
        includeStudents,
      }),
    });
  }, [isSuperAdmin, queryClient, roleKey, sessionVersion, shouldPreloadStudents, storedUser, teacherTimetableYear]);

  const refetchSettings = useCallback(async () => {
    if (!storedUser?.id || isSuperAdmin) {
      return null;
    }

    return queryClient.fetchQuery({
      queryKey: settingsQueryKey,
      queryFn: fetchAppSettingsData,
    });
  }, [isSuperAdmin, queryClient, settingsQueryKey, storedUser?.id]);

  useEffect(() => {
    if (!storedUser?.id || isSuperAdmin) {
      setStaff([]);
      setStudents([]);
      setClasses([]);
      setEvents([]);
      setStaffAttendance({});
      setStudentsHydrated(false);
      setSchoolSettings(initialSchoolSettings);
      setError(null);
    }
  }, [isSuperAdmin, storedUser?.id]);

  useEffect(() => {
    if (!appDataQuery.data) {
      return;
    }

    setStaff(appDataQuery.data.staff || []);
    setClasses(appDataQuery.data.classes || []);
    setStaffAttendance(appDataQuery.data.staffAttendance || {});

    if (appDataQuery.data.includeStudents) {
      setStudents(appDataQuery.data.students || []);
      setStudentsHydrated(true);
    }

    setError(null);
  }, [appDataQuery.data]);

  useEffect(() => {
    if (!settingsDataQuery.data) {
      return;
    }

    const settings = settingsDataQuery.data.schoolSettings || initialSchoolSettings;
    setSchoolSettings(settings);
    syncSchoolLanguage(settings.language?.defaultLanguage);
    setEvents(settingsDataQuery.data.events || []);

    if ((settingsDataQuery.data.leaveTypes || []).length > 0) {
      setLeaveTypes(settingsDataQuery.data.leaveTypes);
    }

    if ((settingsDataQuery.data.feeHeads || []).length > 0) {
      setFeeHeads(settingsDataQuery.data.feeHeads);
    }
  }, [settingsDataQuery.data]);

  useEffect(() => {
    const message = appDataQuery.error?.message;

    if (!message) {
      appErrorToastRef.current = null;
      return;
    }

    if (message === "Unauthorized" || message === "Authentication required") {
      clearStoredUser();
      return;
    }

    setError(message);

    if (appErrorToastRef.current !== message) {
      toast.error(`Failed to load data: ${message}`);
      appErrorToastRef.current = message;
    }
  }, [appDataQuery.error]);

  useEffect(() => {
    const message = settingsDataQuery.error?.message;

    if (!message) {
      settingsErrorToastRef.current = null;
      return;
    }

    if (settingsErrorToastRef.current !== message) {
      toast.error("Failed to load settings");
      settingsErrorToastRef.current = message;
    }
  }, [settingsDataQuery.error]);

  useEffect(() => {
    const syncSession = () => {
      setSessionVersion((current) => current + 1);
      setStudentsHydrated(false);
      setError(null);
    };

    const handleStorageChange = (event) => {
      if (event.key === "app_user") {
        syncSession();
      }
    };

    const handleLogin = () => {
      syncSession();
    };

    const handleSessionCleared = () => {
      queryClient.clear();
      syncSession();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-logged-in", handleLogin);
    window.addEventListener("auth-session-cleared", handleSessionCleared);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-logged-in", handleLogin);
      window.removeEventListener("auth-session-cleared", handleSessionCleared);
    };
  }, [queryClient]);

  const currentAcademicYear = schoolSettings?.academicYear || CURRENT_ACADEMIC_YEAR;

  // Initialize Socket.IO for real-time updates when user is available
  useEffect(() => {
    const user = getStoredUser();
    if (!user?.id) {
      return;
    }

    // Import and initialize socket service
    import('../services/socketServiceEnhanced').then(({ default: socketService }) => {
      // Make it globally available
      window.socketService = socketService;

      // Connect socket
      socketService.connect(getStoredAuthToken());

      // Test listeners
      socketService.on('authenticated', () => {
      });

      socketService.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      socketService.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      // Set up global real-time update listeners
      socketService.on('staff_updated', (data) => {
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
        updateStudentLocal(data.studentId, {
          name: data.name,
          classId: data.classId,
          rollNo: data.rollNo,
          photo: data.photo,
          status: data.status
        });
      });

      socketService.on('class_updated', (data) => {
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
        if (data.type === 'staff') {
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
        // Trigger a refetch for the affected class/date
        // Components listening to this can refresh their data
      });

      // Fee payment events
      socketService.on('fee_payment_created', (data) => {
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
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Fee Heads State
  const [feeHeads, setFeeHeads] = useState([]);

  const [staffSalaries, setStaffSalaries] = useState({});

  const [payrollHistory, setPayrollHistory] = useState([]);

  // Additional Staff Data
  const [lessonPlans, setLessonPlans] = useState([]);

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
      void invalidateAppData();
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
      void invalidateAppData();
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
      void invalidateAppData();
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
      void invalidateAppData();
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
      void invalidateAppData();
      return finalUpdates;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStudent = async (id) => {
    try {
      const result = await studentsApi.delete(id);
      setStudents(prev => prev.filter(s => String(s.id) !== String(id)));
      void invalidateAppData();
      return result;
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
      void invalidateAppData();
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
      void invalidateAppData();
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
      void invalidateAppData();
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
        void invalidateSettingsData();
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
        void invalidateSettingsData();
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
        void invalidateSettingsData();
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
        void invalidateSettingsData();
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
        void invalidateSettingsData();
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
        void invalidateSettingsData();
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
      void invalidateSettingsData();
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
      void invalidateSettingsData();
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
      const updated = await settingsApi.updateSubject(id, updates);
      setSchoolSettings(prev => ({
        ...prev,
        subjects: prev.subjects.map(s => {
          const subjectId = s.id || s._id;
          return String(subjectId) === String(id) ? updated : s;
        })
      }));
      void invalidateSettingsData();
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
      await settingsApi.deleteSubject(id);
      setSchoolSettings(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => {
          const subjectId = s.id || s._id;
          const match = String(subjectId) !== String(id);
          return match;
        })
      }));
      void invalidateSettingsData();
      toast.success('Subject deleted successfully');
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
      void invalidateSettingsData();
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
      void invalidateSettingsData();
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
      void invalidateSettingsData();
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
      void invalidateSettingsData();
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
      void invalidateSettingsData();
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
      void invalidateSettingsData();
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
      const user = getStoredUser() || {};
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
      const user = getStoredUser() || {};

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
      const user = getStoredUser() || {};
      
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
    staffAttendance, studentAttendance, schoolSettings, currentAcademicYear,
    leaveTypes, feeHeads,
    loading, error, settingsLoading, refetch, refetchSettings,
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
    staffAttendance, studentAttendance, schoolSettings, currentAcademicYear,
    leaveTypes, feeHeads,
    loading, error, settingsLoading, refetch, refetchSettings,
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





