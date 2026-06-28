/**
 * useSocketSync.js
 *
 * Initializes the Socket.IO connection and maps real-time server events
 * to local state mutations in domain contexts.
 */

import { useEffect, useRef } from "react";
import { getStoredUser } from "../../utils/authSession";
import logger from "../../utils/logger";

/**
 * @param {object} handlers - Stable setter/updater functions from domain contexts
 */
export function useSocketSync({
  userId,
  staff,
  updateStaffLocal,
  updateStudentLocal,
  updateClassLocal,
  setStaffAttendance,
  syncFeePaymentLocal,
  setStudents,
}) {
  // [AUDIT-537] Use refs for ALL handler dependencies to avoid stale closures.
  // [AUDIT-780] Merged into a single ref updated synchronously during render.
  // Two separate useEffects created a window between updates where a socket event
  // could fire with a mix of fresh and stale values (race condition). Updating the
  // ref directly during render is safe because socket events are async — they always
  // fire after the current render is fully committed, so syncRef.current is never
  // stale when any handler executes.
  const syncRef = useRef({ staff, updateStaffLocal, updateStudentLocal, updateClassLocal, setStaffAttendance, syncFeePaymentLocal, setStudents });
  syncRef.current = { staff, updateStaffLocal, updateStudentLocal, updateClassLocal, setStaffAttendance, syncFeePaymentLocal, setStudents };

  useEffect(() => {
    // Re-run when userId changes (logout sets it to undefined, login sets a new id).
    // getStoredUser() is the authoritative source; userId is only the dep trigger.
    const user = getStoredUser();
    if (!user?.id) return;

    // [AUDIT-793] Named callbacks so cleanup can pass exact references to off().
    // Previously, anonymous callbacks were passed to socketService.on() and then
    // off(event) was called without a callback — indexOf(undefined) always returns -1,
    // so no listeners were ever removed. On logout→login cycles, stale callbacks
    // accumulated in the module-level singleton's listeners Map.
    const onConnectError = (err) => {
      logger.error("Socket connection error:", err);
    };
    const onError = (err) => {
      logger.error("Socket error:", err);
    };
    const onStaffUpdated = (data) => {
      syncRef.current.updateStaffLocal(data.staffId, {
        name: data.name,
        role: data.role,
        department: data.department,
        status: data.status,
        phone: data.phone,
        email: data.email,
        picture: data.picture,
      });
    };
    const onStudentUpdated = (data) => {
      syncRef.current.updateStudentLocal(data.studentId, {
        name: data.name,
        classId: data.classId,
        rollNo: data.rollNo,
        photo: data.photo,
        status: data.status,
      });
    };
    const onClassUpdated = (data) => {
      // Only update teacher assignment fields from socket — don't overwrite
      // name/section since they were normalized on initial load and the raw
      // DB values (e.g. "Class 3") would break display.
      const updates = {};
      if (data.classTeacherId !== undefined) {
        updates.classTeacherId = data.classTeacherId || null;
        const teacher = syncRef.current.staff.find(
          (s) =>
            String(s.id) === String(data.classTeacherId) ||
            String(s._id) === String(data.classTeacherId)
        );
        updates.teacher = teacher?.name || null;
        updates.teacherPhoto = teacher?.picture || null;
      }
      if (Object.keys(updates).length > 0) {
        syncRef.current.updateClassLocal(data.classId, updates);
      }
    };
    const onAttendanceUpdated = (data) => {
      if (data.type === "staff") {
        syncRef.current.setStaffAttendance((prev) => {
          if (!data.status || data.status === "unmarked") {
            const updated = { ...prev };
            if (updated[data.staffId]?.[data.date]) {
              delete updated[data.staffId][data.date];
              if (Object.keys(updated[data.staffId] || {}).length === 0) {
                delete updated[data.staffId];
              }
            }
            return updated;
          }
          return {
            ...prev,
            [data.staffId]: {
              ...(prev[data.staffId] || {}),
              [data.date]: {
                status: data.status,
                inTime: data.inTime,
                outTime: data.outTime,
                reason: data.reason,
              },
            },
          };
        });
      }
    };
    const onFeePaymentCreated = (data) => {
      syncRef.current.syncFeePaymentLocal({
        id: data.paymentId,
        studentId: data.studentId,
        amount: data.amount,
        date: data.paymentDate,
        status: "paid",
      });
      syncRef.current.updateStudentLocal(data.studentId, { feeStatus: "paid" });
    };
    const onStudentCreated = (data) => {
      syncRef.current.setStudents((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          admissionId: data.admissionId,
          class: data.class,
          status: "active",
          feeStatus: "pending",
          timestamp: data.timestamp,
        },
      ]);
    };

    // [MEM-08] Guard against the unmount race with the dynamic import. If the
    // effect is cleaned up (fast logout→login, or StrictMode mount→unmount→mount)
    // before import() resolves, capturedService is still null at cleanup time, so
    // the cleanup removes nothing. Without this flag, the late .then() would then
    // register 8 listeners on the shared singleton that nothing ever removes.
    let active = true;
    let capturedService = null;
    import("../../services/socketServiceEnhanced")
      .then(({ default: socketService }) => {
        // Effect already torn down — do not connect or register orphan listeners.
        if (!active) return;
        capturedService = socketService;
        socketService.connect();

        socketService.on("connect_error", onConnectError);
        socketService.on("error", onError);
        socketService.on("staff_updated", onStaffUpdated);
        socketService.on("student_updated", onStudentUpdated);
        socketService.on("class_updated", onClassUpdated);
        socketService.on("attendance_updated", onAttendanceUpdated);
        socketService.on("fee_payment_created", onFeePaymentCreated);
        socketService.on("student_created", onStudentCreated);
      })
      .catch((err) => {
        logger.error("Failed to import socket service:", err);
      });

    // [AUDIT-793] Pass the exact named callback references to off() so listeners
    // are actually removed from the singleton's Map on unmount.
    return () => {
      // [MEM-08] Mark inactive so a still-pending import() resolves to a no-op
      // instead of registering listeners after this effect was torn down.
      active = false;
      if (capturedService) {
        capturedService.off("connect_error", onConnectError);
        capturedService.off("error", onError);
        capturedService.off("staff_updated", onStaffUpdated);
        capturedService.off("student_updated", onStudentUpdated);
        capturedService.off("class_updated", onClassUpdated);
        capturedService.off("attendance_updated", onAttendanceUpdated);
        capturedService.off("fee_payment_created", onFeePaymentCreated);
        capturedService.off("student_created", onStudentCreated);
        // Do NOT call disconnect() here — socketService is a shared singleton also used
        // by ChatNotificationContext. Disconnecting here kills real-time updates app-wide.
        // Logout teardown is handled by AuthContext via socketService.destroyAll().
      }
    };
  }, [userId]); // Re-run when the logged-in user changes (logout→login without page reload).
}
