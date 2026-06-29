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
import { clearStoredUser, getStoredUser } from "../utils/authSession";
import { isSuperAdminRole } from "../utils/roleUtils";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { StudentsProvider, useStudents } from "./StudentsContext";
import { ClassesProvider, useClasses } from "./ClassesContext";
import { StaffProvider, useStaff } from "./StaffContext";
import { AttendanceProvider, useAttendance } from "./AttendanceContext";
import { SettingsProvider, useSettings } from "./SettingsContext";
import { SchoolProvider } from "./SchoolContext";
import { AcademicYearProvider, useAcademicYear } from "./AcademicYearContext";
import {
  extractRoleNames,
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
  const { t } = useTranslation();
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

  // Pull minimal state from domain contexts needed for orchestration
  const {
    setStudents,
    updateStudentLocal,
  } = useStudents();

  const {
    setClasses,
    setClassesFromQuery,
    updateClassLocal,
  } = useClasses();

  const {
    staff,
    setStaff,
    setStaffFromQuery,
    updateStaffLocal,
  } = useStaff();

  const {
    setStaffAttendance,
    setStaffAttendanceFromQuery,
  } = useAttendance();

  const { storedYear, setSelectedAcademicYear } = useAcademicYear();

  const {
    currentAcademicYear,
    setSettingsFromQuery,
    syncFeePaymentLocal,
  } = useSettings();

  const appQueryKey = useMemo(
    () => [
      "app-context-data",
      sessionVersion,
      storedUser?.id ?? "anonymous",
      storedUser?.schoolId ?? "unknown",
      roleKey,
    ],
    [roleKey, sessionVersion, storedUser?.id, storedUser?.schoolId]
  );

  const settingsQueryKey = useMemo(
    () => ["app-settings-data", sessionVersion, storedUser?.id ?? "anonymous", storedUser?.schoolId ?? "unknown"],
    [sessionVersion, storedUser?.id, storedUser?.schoolId]
  );

  const appDataQuery = useQuery({
    queryKey: appQueryKey,
    enabled: Boolean(storedUser?.id) && !isSuperAdmin,
    placeholderData: (previousData) => previousData,
    queryFn: ({ signal }) =>
      fetchRoleAwareAppData({
        user: storedUser,
        includeStudents: false,
        signal,
      }),
  });

  const settingsDataQuery = useQuery({
    queryKey: settingsQueryKey,
    enabled: Boolean(storedUser?.id) && !isSuperAdmin,
    placeholderData: (previousData) => previousData,
    queryFn: ({ signal }) => fetchAppSettingsData({ signal }),
  });

  const loading = Boolean(storedUser?.id) && !isSuperAdmin && appDataQuery.isPending;
  const settingsLoading =
    Boolean(storedUser?.id) && !isSuperAdmin && settingsDataQuery.isPending;

  const refetch = useCallback(
    async (skipCache = false, _retryCount = 0, _options = {}) => {
      if (!storedUser?.id || isSuperAdmin) return null;

      return queryClient.fetchQuery({
        queryKey: appQueryKey,
        // Force a fresh fetch — staleTime: 0 prevents returning cached data
        staleTime: 0,
        queryFn: ({ signal }) =>
          fetchRoleAwareAppData({
            user: storedUser,
            skipCache,
            includeStudents: false,
            signal,
          }),
      });
    },
    [isSuperAdmin, queryClient, appQueryKey, storedUser]
  );

  const refetchSettings = useCallback(async () => {
    if (!storedUser?.id || isSuperAdmin) return null;
    return queryClient.fetchQuery({
      queryKey: settingsQueryKey,
      queryFn: ({ signal }) => fetchAppSettingsData({ signal }),
    });
  }, [isSuperAdmin, queryClient, settingsQueryKey, storedUser?.id]);

  // Clear domain state on logout / super admin
  useEffect(() => {
    if (!storedUser?.id || isSuperAdmin) {
      setStaff([]);
      setStudents([]);
      setClasses([]);
      setStaffAttendance({});
      setError(null);
    }
  }, [
    isSuperAdmin,
    storedUser?.id,
    setStaff,
    setStudents,
    setClasses,
    setStaffAttendance,
  ]);

  // Sync app query results into domain contexts
  useEffect(() => {
    if (!appDataQuery.data) return;
    setStaffFromQuery(appDataQuery.data.staff || []);
    setClassesFromQuery(appDataQuery.data.classes || []);
    setStaffAttendanceFromQuery(appDataQuery.data.staffAttendance || {});
    setError(null);
  }, [
    appDataQuery.data,
    setStaffFromQuery,
    setClassesFromQuery,
    setStaffAttendanceFromQuery,
  ]);

  // Sync settings query results into settings context
  useEffect(() => {
    if (!settingsDataQuery.data) return;
    setSettingsFromQuery(settingsDataQuery.data);
  }, [settingsDataQuery.data, setSettingsFromQuery]);

  // [PAG-05] Global student hydration removed — per-screen pages now own their
  // own server-paginated fetches through `studentsApi.list` + `usePaginatedQuery`.

  // App data error handling
  useEffect(() => {
    const message = appDataQuery.error?.message;
    if (!message) {
      appErrorToastRef.current = null;
      return;
    }
    if (message === "Unauthorized" || message === "Authentication required") {
      clearStoredUser();
      setSessionVersion(v => v + 1);
      return;
    }
    setError(message);
    if (appErrorToastRef.current !== message) {
      toast.error(t('toast.error.failedToLoadData', { message, defaultValue: `Failed to load data: ${message}` }));
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
      toast.error(t('toast.error.failedToLoadSettings', 'Failed to load settings'));
      settingsErrorToastRef.current = message;
    }
  }, [settingsDataQuery.error]);

  // Session sync (login / logout / cross-tab)
  useEffect(() => {
    const syncSession = () => {
      setSessionVersion((current) => current + 1);
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
  }, [queryClient]);

  // Socket.IO real-time updates
  useSocketSync({
    userId: storedUser?.id,
    staff,
    updateStaffLocal,
    updateStudentLocal,
    updateClassLocal,
    setStaffAttendance,
    syncFeePaymentLocal,
    setStudents,
  });

  // ---------------------------------------------------------------------------
  // Slim cross-cutting context value — domain data lives in domain contexts
  // ---------------------------------------------------------------------------

  // Resolved selected year: persisted value (from sessionStorage) or current school year
  const selectedAcademicYear = storedYear || currentAcademicYear;

  const value = useMemo(
    () => ({
      // Global loading / error state
      loading,
      settingsLoading,
      error,
      // Global refetch triggers
      refetch,
      refetchSettings,
      // Academic year (cross-cutting: bridges AcademicYearContext + SettingsContext)
      currentAcademicYear,
      selectedAcademicYear,
      setSelectedAcademicYear,
      // Onboarding UI state
      showOnboarding,
      setShowOnboarding,
    }),
    [
      loading, settingsLoading, error,
      refetch, refetchSettings,
      currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear,
      showOnboarding, setShowOnboarding,
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
    <AcademicYearProvider>
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
    </AcademicYearProvider>
  );
}

// ---------------------------------------------------------------------------
// Public hooks
// ---------------------------------------------------------------------------

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  const students = useStudents();
  const staff = useStaff();
  const classes = useClasses();
  const attendance = useAttendance();
  const settings = useSettings();
  return {
    ...students,
    ...staff,
    ...classes,
    ...attendance,
    ...settings,
    ...context,
  };
};

/**
 * useAppMeta — slim access to cross-cutting app state ONLY:
 *   loading, settingsLoading, error,
 *   refetch, refetchSettings,
 *   currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear,
 *   showOnboarding, setShowOnboarding.
 *
 * Unlike useApp(), this subscribes only to AppContext — a memoized, slim
 * value — and NOT to the five domain contexts (students/staff/classes/
 * attendance/settings). Components that need only the cross-cutting fields
 * above should use this hook so they no longer re-render on every socket
 * tick, fee payment, attendance mark, or window-refocus refetch (PERF-03).
 *
 * If you need domain data (students, staff, classes, schoolSettings, …),
 * use the focused domain hook instead: useStudents/useStaff/useClasses/
 * useAttendance/useSettings/useSchool.
 */
export const useAppMeta = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppMeta must be used within AppProvider");
  return context;
};

// Re-export domain hooks so consumers can import from a single location.
// Prefer importing from domain context files directly in new code.
export { useStudents } from "./StudentsContext";
export { useStaff } from "./StaffContext";
export { useClasses } from "./ClassesContext";
export { useAttendance } from "./AttendanceContext";
export { useSettings } from "./SettingsContext";
export { useSchool } from "./SchoolContext";
export { useAcademicYear } from "./AcademicYearContext";
