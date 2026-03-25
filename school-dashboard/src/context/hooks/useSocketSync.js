/**
 * useSocketSync.js
 *
 * Initializes the Socket.IO connection and maps real-time server events
 * to local state mutations in domain contexts.
 */

import { useEffect } from "react";
import { getStoredUser, getStoredAuthToken } from "../../utils/authSession";

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
  useEffect(() => {
    const user = getStoredUser();
    if (!user?.id) return;

    import("../../services/socketServiceEnhanced")
      .then(({ default: socketService }) => {
        window.socketService = socketService;
        socketService.connect(getStoredAuthToken());

        socketService.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
        });
        socketService.on("error", (err) => {
          console.error("Socket error:", err);
        });

        socketService.on("staff_updated", (data) => {
          updateStaffLocal(data.staffId, {
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
          updateStudentLocal(data.studentId, {
            name: data.name,
            classId: data.classId,
            rollNo: data.rollNo,
            photo: data.photo,
            status: data.status,
          });
        });

        socketService.on("class_updated", (data) => {
          if (data.classTeacherId !== undefined) {
            const teacher = staff.find(
              (s) =>
                String(s.id) === String(data.classTeacherId) ||
                String(s._id) === String(data.classTeacherId)
            );
            updateClassLocal(data.classId, {
              name: data.name,
              section: data.section,
              classTeacherId: data.classTeacherId,
              teacher: teacher?.name,
              teacherPhoto: teacher?.picture,
            });
          } else {
            updateClassLocal(data.classId, {
              name: data.name,
              section: data.section,
              classTeacherId: data.classTeacherId,
            });
          }
        });

        socketService.on("attendance_updated", (data) => {
          if (data.type === "staff") {
            setStaffAttendance((prev) => {
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
          addFeePayment({
            id: data.paymentId,
            studentId: data.studentId,
            amount: data.amount,
            date: data.paymentDate,
            status: "paid",
          });
          updateStudentLocal(data.studentId, { feeStatus: "paid" });
        });

        socketService.on("student_created", (data) => {
          setStudents((prev) => [
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
        console.error("Failed to import socket service:", err);
      });

    return () => {
      if (window.socketService) {
        window.socketService.off("student_created");
        window.socketService.disconnect();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Empty deps: socket listeners set up once; all setters from useState are stable refs.
}
