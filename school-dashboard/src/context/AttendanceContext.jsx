import { createContext, useContext, useState, useCallback } from "react";
import { staffAttendanceApi, attendanceApi } from "../services/api";
import { getStoredUser } from "../utils/authSession";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import logger from "../utils/logger";
import { isActiveStaff } from "../pages/staffs/utils/staffHelpers";

// TODO [AUDIT-64]: This context provides staff and student attendance state management
// (optimistic updates, bulk marking, regularization) but the main Attendance.jsx page
// does not consume it — it manages its own local state and API calls directly.
// Consider wiring Attendance.jsx to use markStudentAttendance / studentAttendance
// from this context for consistent state across the app, or remove the student
// attendance portion if it's not needed outside of individual marking.
export const AttendanceContext = createContext();

export function AttendanceProvider({ children, staff }) {
  const { t } = useTranslation();
  const [staffAttendance, setStaffAttendance] = useState({});
  const [studentAttendance, setStudentAttendance] = useState({});

  // Called by AppContextCore when query data arrives
  const setStaffAttendanceFromQuery = useCallback((data) => {
    setStaffAttendance(data);
  }, []);

  const fetchStaffAttendanceForDate = useCallback(async (date) => {
    try {
      const data = await staffAttendanceApi.getByDate(date);
      setStaffAttendance((prev) => {
        const updated = { ...prev };
        data.forEach((record) => {
          const staffId =
            record.staffId instanceof Object ? record.staffId._id : record.staffId;
          // Spread nested object to avoid mutating the shared prev[staffId] reference
          updated[staffId] = {
            ...(prev[staffId] || {}),
            [record.date]: {
              status: record.status,
              inTime: record.inTime || record.checkInTime || "-",
              outTime: record.outTime || record.checkOutTime || "-",
              reason: record.reason || "",
              regularization: record.regularization,
            },
          };
        });
        return updated;
      });
      return data;
    } catch (err) {
      logger.error("Failed to fetch staff attendance for date:", err);
      throw err;
    }
  }, []);

  const fetchStaffAttendanceByStaff = useCallback(async (staffId, startDate, endDate) => {
    try {
      const data = await staffAttendanceApi.getByStaff(staffId, startDate, endDate);
      setStaffAttendance((prev) => {
        // Build new date entries without mutating the shared prev[staffId] reference
        const dateEntries = {};
        data.forEach((record) => {
          dateEntries[record.date] = {
            status: record.status,
            inTime: record.inTime || record.checkInTime || "-",
            outTime: record.outTime || record.checkOutTime || "-",
            reason: record.reason || "",
            regularization: record.regularization,
          };
        });
        return {
          ...prev,
          [staffId]: { ...(prev[staffId] || {}), ...dateEntries },
        };
      });
      return data;
    } catch (err) {
      logger.error("Failed to fetch staff attendance history:", err);
      return [];
    }
  }, []);

  const markStaffAttendance = async (
    staffId,
    date,
    status,
    inTime = "-",
    outTime = "-",
    reason = ""
  ) => {
    // Save previous state for rollback
    const prevAttendance = staffAttendance;

    // Optimistic update
    setStaffAttendance((prev) => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {}),
        [date]: { status, inTime, outTime, reason },
      },
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
        markedBy: user.id,
      });
      toast.success(t('toast.success.attendanceSavedSuccessfully', 'Attendance marked successfully'));
    } catch (err) {
      logger.error("Failed to mark attendance on server:", err);
      toast.error(t('toast.error.failedToMarkAttendance', 'Failed to save attendance'));
      // Revert optimistic update on failure
      setStaffAttendance(prevAttendance);
    }
  };

  const markStudentAttendance = async (studentId, date, status, classId) => {
    // Optimistic update
    setStudentAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [date]: { status } },
    }));

    // Extract plain ID if classId is a populated object
    const resolvedClassId = classId?._id || classId;

    try {
      await attendanceApi.mark({
        studentId,
        classId: resolvedClassId,
        date,
        status,
        clientTimestamp: new Date().toISOString(),
      });
      toast.success(t('toast.success.studentAttendanceMarked', 'Student attendance marked'));
    } catch (err) {
      logger.error("Failed to mark student attendance on server:", err);
      toast.error(t('toast.error.failedToSaveStudentAttendance', 'Failed to save student attendance'));
      // Revert optimistic update on failure — spread to avoid mutating the shared nested object
      setStudentAttendance((prev) => {
        if (!prev[studentId]?.[date]) return prev;
        const { [date]: _removed, ...restDates } = prev[studentId];
        return { ...prev, [studentId]: restDates };
      });
    }
  };

  const getStaffAttendanceForDate = (date) => {
    const result = {};
    if (Array.isArray(staff)) {
      staff.forEach((s) => {
        result[s.id] = staffAttendance[s.id]?.[date] || {
          status: "unmarked",
          inTime: "-",
          outTime: "-",
        };
      });
    }
    return result;
  };

  const markAllStaffAttendance = async (
    date,
    status,
    specificStaffIds = null,
    reason = "",
    inTime = null,
    outTime = null
  ) => {
    const targetStaffIds =
      specificStaffIds ||
      (Array.isArray(staff)
        ? staff.filter((s) => isActiveStaff(s)).map((s) => s.id)
        : []);

    // Use actual current time for present, not hardcoded 09:00
    const checkIn = inTime || (status === "present" ? new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : "-");
    const checkOut = outTime || "-";

    // Save previous state for rollback
    const prevAttendance = staffAttendance;

    // Optimistic update — spread each nested object so prev[id] is never mutated in place
    setStaffAttendance((prev) => {
      const newAtt = { ...prev };
      targetStaffIds.forEach((id) => {
        newAtt[id] = { ...(prev[id] || {}), [date]: { status, inTime: checkIn, outTime: checkOut, reason } };
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
        markedBy: user.id,
      });
      toast.success(t('toast.success.bulkAttendanceMarkedSuccessfully', 'Bulk attendance marked successfully'));
    } catch (err) {
      logger.error("Failed to bulk mark attendance:", err);
      toast.error(t('toast.error.failedToSaveBulkAttendance', 'Failed to save bulk attendance'));
      // Revert optimistic update on failure
      setStaffAttendance(prevAttendance);
    }
  };

  const requestRegularization = async (staffId, date, requestedStatus, reason) => {
    try {
      const user = getStoredUser() || {};
      const response = await staffAttendanceApi.regularize(staffId, {
        date,
        status: requestedStatus,
        checkInTime: requestedStatus === "present" ? "09:00" : "-",
        checkOutTime: "-",
        reason,
        regularizedBy: user.id,
      });

      setStaffAttendance((prev) => ({
        ...prev,
        [staffId]: {
          ...(prev[staffId] || {}),
          [date]: {
            status: requestedStatus,
            inTime: response.checkInTime || "-",
            outTime: response.checkOutTime || "-",
            reason,
            regularization: response.regularization,
          },
        },
      }));

      toast.success(t('toast.success.attendanceRegularizedSuccessfully', 'Attendance regularized successfully'));
      return response;
    } catch (err) {
      logger.error("Regularization failed:", err);
      toast.error(t('toast.error.failedToRegularizeAttendance', 'Failed to regularize attendance'));
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

  const value = {
    staffAttendance,
    studentAttendance,
    setStaffAttendance,
    setStudentAttendance,
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
  };

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error("useAttendance must be used within AttendanceProvider");
  return context;
};
