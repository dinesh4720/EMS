import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import {
  classesApi,
  classesEnhancedApi,
  teacherAssignmentsApi,
  teacherTimetableApi,
} from "../services/api";
import { CURRENT_ACADEMIC_YEAR } from "../utils/constants";
import { clearStoredUser, getStoredUser } from "../utils/authSession";
import { isSuperAdminRole } from "../utils/roleUtils";
import toast from "react-hot-toast";

import { StudentsProvider, useStudents } from "./StudentsContext";
import { ClassesProvider, useClasses } from "./ClassesContext";
import { StaffProvider, useStaff } from "./StaffContext";
import { AttendanceProvider, useAttendance } from "./AttendanceContext";
import { SettingsProvider, useSettings } from "./SettingsContext";
import { SchoolProvider } from "./SchoolContext";
import {
  extractRoleNames,
  shouldHydrateStudentsForPath,
  fetchRoleAwareAppData,
  fetchAppSettingsData,
} from "./appContextHelpers";
import { useSocketSync } from "./hooks/useSocketSync";

// ---------------------------------------------------------------------------
// AppContext
// ---------------------------------------------------------------------------

const AppContext = createContext();

/**
 * AppContextCore — rendered inside all domain providers.
 * Owns react-query data loading and wires results into domain contexts.
 */
function AppContextCore({ children }) {
  const location = useLocation();
  const shouldPreloadStudents = shouldHydrateStudentsForPath(location.pathname);
  const queryClient = useQueryClient();
  const appErrorToastRef = useRef(null);
  const settingsErrorToastRef = useRef(null);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const storedUser = useMemo(() => getStoredUser(), [sessionVersion]);
  const isSuperAdmin = isSuperAdminRole(storedUser?.role);
  const roleKey = useMemo(
    () => extractRoleNames(storedUser?.role).sort().join(","),
    [storedUser?.role]
  );

  // Pull everything from domain contexts
  const {
    students,
    setStudents,
    setStudentsHydrated,
    setStudentsFromQuery,
    addStudent,
    updateStudent,
    updateStudentLocal,
    deleteStudent,
    getStudentById,
    getStudentsByClass,
  } = useStudents();

  const {
    classes,
    classesWithTeachers,
    setClasses,
    setClassesFromQuery,
    addClass,
    updateClass,
    updateClassLocal,
    deleteClass,
    getClassById,
  } = useClasses();

  const {
    staff,
    teachers,
    lessonPlans,
    documents,
    remarks,
    setStaff,
    setStaffFromQuery,
    addStaff,
    updateStaff,
    updateStaffLocal,
    deleteStaff,
    toggleStaffStatus,
    getStaffById,
    addLessonPlan,
    addDocument,
    addRemark,
    salarySettings,
    staffSalaries,
    payrollHistory,
    updateSalarySettings,
    updateStaffSalary,
    processPayroll,
    getPayrollForMonth,
  } = useStaff();

  const {
    staffAttendance,
    studentAttendance,
    setStaffAttendance,
    setStaffAttendanceFromQuery,
    fetchStaffAttendanceForDate,
    fetchStaffAttendanceByStaff,
    markStaffAttendance,
    markStudentAttendance,
    getStaffAttendanceForDate,
    markAllStaffAttendance,
    requestRegularization,
    approveRegularization,
    fetchPendingRegularizations,
    getMonthlyAttendance,
  } = useAttendance();

  const {
    schoolSettings,
    currentAcademicYear,
    events,
    feePayments,
    announcements,
    leaveTypes,
    feeHeads,
    isBeforeSchoolHours,
    setSettingsFromQuery,
    updateSchoolSettings,
    addSubject,
    updateSubject,
    deleteSubject,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    addFeePayment,
    getStudentFeeHistory,
    addAnnouncement,
    addLeaveType,
    updateLeaveType,
    deleteLeaveType,
    addFeeHead,
    updateFeeHead,
    deleteFeeHead,
    themeSettings,
    updateThemeSettings,
    resetThemeSettings,
  } = useSettings();

  const teacherTimetableYear = schoolSettings?.academicYear || CURRENT_ACADEMIC_YEAR;

  const appQueryKey = useMemo(
    () => [
      "app-context-data",
      sessionVersion,
      storedUser?.id ?? "anonymous",
      roleKey,
      shouldPreloadStudents,
      teacherTimetableYear,
    ],
    [roleKey, sessionVersion, shouldPreloadStudents, storedUser?.id, teacherTimetableYear]
  );

  const settingsQueryKey = useMemo(
    () => ["app-settings-data", sessionVersion, storedUser?.id ?? "anonymous"],
    [sessionVersion, storedUser?.id]
  );

  const appDataQuery = useQuery({
    queryKey: appQueryKey,
    enabled: Boolean(storedUser?.id) && !isSuperAdmin,
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      fetchRoleAwareAppData({
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
  const settingsLoading =
    Boolean(storedUser?.id) && !isSuperAdmin && settingsDataQuery.isPending;

  const refetch = useCallback(
    async (skipCache = false, _retryCount = 0, options = {}) => {
      const includeStudents = options.includeStudents ?? shouldPreloadStudents;
      if (!storedUser?.id || isSuperAdmin) return null;

      return queryClient.fetchQuery({
        queryKey: [
          "app-context-data",
          sessionVersion,
          storedUser.id,
          roleKey,
          includeStudents,
          teacherTimetableYear,
        ],
        queryFn: () =>
          fetchRoleAwareAppData({
            user: storedUser,
            teacherTimetableYear,
            skipCache,
            includeStudents,
          }),
      });
    },
    [
      isSuperAdmin,
      queryClient,
      roleKey,
      sessionVersion,
      shouldPreloadStudents,
      storedUser,
      teacherTimetableYear,
    ]
  );

  const refetchSettings = useCallback(async () => {
    if (!storedUser?.id || isSuperAdmin) return null;
    return queryClient.fetchQuery({
      queryKey: settingsQueryKey,
      queryFn: fetchAppSettingsData,
    });
  }, [isSuperAdmin, queryClient, settingsQueryKey, storedUser?.id]);

  // Clear domain state on logout / super admin
  useEffect(() => {
    if (!storedUser?.id || isSuperAdmin) {
      setStaff([]);
      setStudents([]);
      setClasses([]);
      setStaffAttendance({});
      setStudentsHydrated(false);
      setError(null);
    }
  }, [
    isSuperAdmin,
    storedUser?.id,
    setStaff,
    setStudents,
    setClasses,
    setStaffAttendance,
    setStudentsHydrated,
  ]);

  // Sync app query results into domain contexts
  useEffect(() => {
    if (!appDataQuery.data) return;
    setStaffFromQuery(appDataQuery.data.staff || []);
    setClassesFromQuery(appDataQuery.data.classes || []);
    setStaffAttendanceFromQuery(appDataQuery.data.staffAttendance || {});
    if (appDataQuery.data.includeStudents) {
      setStudentsFromQuery(appDataQuery.data.students || [], true);
    }
    setError(null);
  }, [
    appDataQuery.data,
    setStaffFromQuery,
    setClassesFromQuery,
    setStaffAttendanceFromQuery,
    setStudentsFromQuery,
  ]);

  // Sync settings query results into settings context
  useEffect(() => {
    if (!settingsDataQuery.data) return;
    setSettingsFromQuery(settingsDataQuery.data);
  }, [settingsDataQuery.data, setSettingsFromQuery]);

  // App data error handling
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

  // Settings error handling
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

  // Session sync (login / logout / cross-tab)
  useEffect(() => {
    const syncSession = () => {
      setSessionVersion((current) => current + 1);
      setStudentsHydrated(false);
      setError(null);
    };

    const handleStorageChange = (event) => {
      if (event.key === "app_user") syncSession();
    };
    const handleLogin = () => syncSession();
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
  }, [queryClient, setStudentsHydrated]);

  // Socket.IO real-time updates
  useSocketSync({
    staff,
    updateStaffLocal,
    updateStudentLocal,
    updateClassLocal,
    setStaffAttendance,
    addFeePayment,
    setStudents,
  });

  // ---------------------------------------------------------------------------
  // Error-capturing wrappers — match original behavior: setError + re-throw
  // ---------------------------------------------------------------------------

  const wrapWithError = useCallback(
    (fn) =>
      async (...args) => {
        try {
          return await fn(...args);
        } catch (err) {
          setError(err.message);
          throw err;
        }
      },
    []
  );

  const addStaffSafe = useMemo(() => wrapWithError(addStaff), [wrapWithError, addStaff]);
  const updateStaffSafe = useMemo(() => wrapWithError(updateStaff), [wrapWithError, updateStaff]);
  const deleteStaffSafe = useMemo(() => wrapWithError(deleteStaff), [wrapWithError, deleteStaff]);
  const toggleStaffStatusSafe = useMemo(
    () => wrapWithError(toggleStaffStatus),
    [wrapWithError, toggleStaffStatus]
  );
  const addStudentSafe = useMemo(() => wrapWithError(addStudent), [wrapWithError, addStudent]);
  const updateStudentSafe = useMemo(
    () => wrapWithError(updateStudent),
    [wrapWithError, updateStudent]
  );
  const deleteStudentSafe = useMemo(
    () => wrapWithError(deleteStudent),
    [wrapWithError, deleteStudent]
  );
  const addClassSafe = useMemo(() => wrapWithError(addClass), [wrapWithError, addClass]);
  const updateClassSafe = useMemo(() => wrapWithError(updateClass), [wrapWithError, updateClass]);
  const deleteClassSafe = useMemo(() => wrapWithError(deleteClass), [wrapWithError, deleteClass]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const feeDefaulters = useMemo(
    () =>
      Array.isArray(students)
        ? students.filter((s) => s.feeStatus === "overdue" || s.feeStatus === "pending")
        : [],
    [students]
  );

  const dashboardStats = useMemo(
    () => ({
      totalStaff: Array.isArray(staff) ? staff.length : 0,
      activeStaff: Array.isArray(staff) ? staff.filter((s) => s.status === "active").length : 0,
      totalStudents: Array.isArray(students) ? students.length : 0,
      totalClasses: Array.isArray(classes) ? classes.length : 0,
      totalTeachers: teachers.length,
      feeDefaultersCount: feeDefaulters.length,
      upcomingEvents: Array.isArray(events)
        ? events.filter((e) => new Date(e.date) >= new Date()).length
        : 0,
    }),
    [staff, students, classes, teachers, feeDefaulters, events]
  );

  // ---------------------------------------------------------------------------
  // Full backward-compatible context value
  // ---------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      // Data
      staff, students, classes, events, feePayments, announcements,
      staffAttendance, studentAttendance, schoolSettings, currentAcademicYear,
      leaveTypes, feeHeads,
      loading, error, settingsLoading, refetch, refetchSettings,
      // Computed
      teachers, classesWithTeachers, feeDefaulters, dashboardStats, isBeforeSchoolHours,
      // Staff actions
      addStaff: addStaffSafe,
      updateStaff: updateStaffSafe,
      updateStaffLocal,
      deleteStaff: deleteStaffSafe,
      toggleStaffStatus: toggleStaffStatusSafe,
      getStaffById,
      // Student actions
      addStudent: addStudentSafe,
      updateStudent: updateStudentSafe,
      updateStudentLocal,
      deleteStudent: deleteStudentSafe,
      getStudentById,
      getStudentsByClass,
      // Class actions
      addClass: addClassSafe,
      updateClass: updateClassSafe,
      updateClassLocal,
      deleteClass: deleteClassSafe,
      getClassById,
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
      // Salary
      salarySettings, staffSalaries, payrollHistory,
      updateSalarySettings, updateStaffSalary, processPayroll, getPayrollForMonth,
      // Academic & other
      lessonPlans, documents, remarks,
      addLessonPlan, addDocument, addRemark,
      // APIs (passed through for components that use them directly)
      classesApi, classesEnhancedApi, teacherAssignmentsApi, teacherTimetableApi,
      // Theme
      themeSettings, updateThemeSettings, resetThemeSettings,
      // Onboarding
      showOnboarding, setShowOnboarding,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      staff, students, classes, events, feePayments, announcements,
      staffAttendance, studentAttendance, schoolSettings, currentAcademicYear,
      leaveTypes, feeHeads,
      loading, error, settingsLoading, refetch, refetchSettings,
      teachers, classesWithTeachers, feeDefaulters, dashboardStats, isBeforeSchoolHours,
      salarySettings, staffSalaries, payrollHistory,
      lessonPlans, documents, remarks,
      themeSettings, showOnboarding,
      // safe wrappers — stable after first render but depend on domain fns
      addStaffSafe, updateStaffSafe, deleteStaffSafe, toggleStaffStatusSafe,
      addStudentSafe, updateStudentSafe, deleteStudentSafe,
      addClassSafe, updateClassSafe, deleteClassSafe,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---------------------------------------------------------------------------
// AppProvider — composes domain providers, then renders AppContextCore
// ---------------------------------------------------------------------------

/**
 * ClassesAndAttendanceShell — needs staff + students in scope so it can
 * pass them as props to ClassesProvider (for classesWithTeachers) and
 * AttendanceProvider (for getStaffAttendanceForDate).
 * Must be rendered inside both StaffProvider and StudentsProvider.
 */
function ClassesAndAttendanceShell({ children }) {
  const { staff } = useStaff();
  const { students } = useStudents();

  return (
    <ClassesProvider staff={staff} students={students}>
      <AttendanceProvider staff={staff}>
        {children}
      </AttendanceProvider>
    </ClassesProvider>
  );
}

export function AppProvider({ children }) {
  return (
    <StudentsProvider>
      <StaffProvider>
        <SettingsProvider>
          <SchoolProvider>
            <ClassesAndAttendanceShell>
              <AppContextCore>{children}</AppContextCore>
            </ClassesAndAttendanceShell>
          </SchoolProvider>
        </SettingsProvider>
      </StaffProvider>
    </StudentsProvider>
  );
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
