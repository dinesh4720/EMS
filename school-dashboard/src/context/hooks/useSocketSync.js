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
  staff,
  updateStaffLocal,
  updateStudentLocal,
  updateClassLocal,
  setStaffAttendance,
  addFeePayment,
  setStudents,
}) {
  // [AUDIT-537] Use refs for ALL handler dependencies to avoid stale closures
  // The effect runs once (empty deps) so all functions must be accessed via refs
  const staffRef = useRef(staff);
  const handlersRef = useRef({ updateStaffLocal, updateStudentLocal, updateClassLocal, setStaffAttendance, addFeePayment, setStudents });
  useEffect(() => { staffRef.current = staff; }, [staff]);
  useEffect(() => {
    handlersRef.current = { updateStaffLocal, updateStudentLocal, updateClassLocal, setStaffAttendance, addFeePayment, setStudents };
  }, [updateStaffLocal, updateStudentLocal, updateClassLocal, setStaffAttendance, addFeePayment, setStudents]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user?.id) return;

    let capturedService = null;
    import("../../services/socketServiceEnhanced")
      .then(({ default: socketService }) => {
        capturedService = socketService;
        socketService.connect();

        socketService.on("connect_error", (err) => {
          logger.error("Socket connection error:", err);
        });
        socketService.on("error", (err) => {
          logger.error("Socket error:", err);
        });

        socketService.on("staff_updated", (data) => {
          handlersRef.current.updateStaffLocal(data.staffId, {
            name: data.name,
            role: data.role,
            department: data.department,
            status: data.status,
            phone: data.phone,
            email: data.email,
            picture: data.picture,
          });
        });

        socketService.on("student_updated", (data) => {
          handlersRef.current.updateStudentLocal(data.studentId, {
            name: data.name,
            classId: data.classId,
            rollNo: data.rollNo,
            photo: data.photo,
            status: data.status,
          });
        });

        socketService.on("class_updated", (data) => {
          if (data.classTeacherId !== undefined) {
            const teacher = staffRef.current.find(
              (s) =>
                String(s.id) === String(data.classTeacherId) ||
                String(s._id) === String(data.classTeacherId)
            );
            handlersRef.current.updateClassLocal(data.classId, {
              name: data.name,
              section: data.section,
              classTeacherId: data.classTeacherId,
              teacher: teacher?.name,
              teacherPhoto: teacher?.picture,
            });
          } else {
            handlersRef.current.updateClassLocal(data.classId, {
              name: data.name,
              section: data.section,
              classTeacherId: data.classTeacherId,
            });
          }
        });

        socketService.on("attendance_updated", (data) => {
          if (data.type === "staff") {
            handlersRef.current.setStaffAttendance((prev) => {
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
        });

        socketService.on("fee_payment_created", (data) => {
          handlersRef.current.addFeePayment({
            id: data.paymentId,
            studentId: data.studentId,
            amount: data.amount,
            date: data.paymentDate,
            status: "paid",
          });
          handlersRef.current.updateStudentLocal(data.studentId, { feeStatus: "paid" });
        });

        socketService.on("student_created", (data) => {
          handlersRef.current.setStudents((prev) => [
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
        });
      })
      .catch((err) => {
        logger.error("Failed to import socket service:", err);
      });

    // [AUDIT-157] Clean up ALL socket event listeners to prevent memory leaks.
    // Previously only student_created was cleaned up; the other 7 listeners leaked.
    return () => {
      if (capturedService) {
        capturedService.off("connect_error");
        capturedService.off("error");
        capturedService.off("staff_updated");
        capturedService.off("student_updated");
        capturedService.off("class_updated");
        capturedService.off("attendance_updated");
        capturedService.off("fee_payment_created");
        capturedService.off("student_created");
        capturedService.disconnect();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Empty deps: socket listeners set up once; all setters from useState are stable refs.
}
