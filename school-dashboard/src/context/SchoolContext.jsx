/**
 * SchoolContext
 *
 * A focused context for school-level settings and configuration.
 * Wraps SettingsContext data and exposes it via `useSchool()`.
 *
 * Use `useSchool()` in new code instead of `useApp()` when you only
 * need school settings, theme, events, academic year, fee heads, etc.
 * `useApp()` continues to expose everything for backward compatibility.
 */
import { createContext, useContext } from "react";
import { useSettings } from "./SettingsContext";

const SchoolContext = createContext(null);

/**
 * SchoolProvider — must be rendered inside SettingsProvider.
 * Bridges SettingsContext data into a dedicated SchoolContext.
 */
export function SchoolProvider({ children }) {
  const settings = useSettings();
  return <SchoolContext.Provider value={settings}>{children}</SchoolContext.Provider>;
}

/**
 * useSchool — access school-level settings and configuration.
 *
 * Returns:
 *  schoolSettings, currentAcademicYear, themeSettings,
 *  events, announcements, feePayments, leaveTypes, feeHeads,
 *  isBeforeSchoolHours,
 *  updateSchoolSettings, addSubject, updateSubject, deleteSubject,
 *  addEvent, updateEvent, deleteEvent, getEventsForDate,
 *  addFeePayment, syncFeePaymentLocal, getStudentFeeHistory, addAnnouncement,
 *  addLeaveType, updateLeaveType, deleteLeaveType,
 *  addFeeHead, updateFeeHead, deleteFeeHead,
 *  updateThemeSettings, resetThemeSettings
 */
export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used within SchoolProvider (AppProvider)");
  return ctx;
}
