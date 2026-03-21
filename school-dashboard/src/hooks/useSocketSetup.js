import { useEffect, useState } from "react";
import { getStoredUser } from "../utils/authSession";

/**
 * Initializes Socket.IO for real-time updates and wires events
 * to domain-specific updaters.
 */
export function useSocketSetup({
  updateStaffLocal,
  updateStudentLocal,
  addStudentFromSocket,
  updateClassLocal,
  updateStaffAttendanceSocket,
  updateStudentAttendanceSocket,
}) {
  const [socketConnected, setSocketConnected] = useState(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user?.id) {
      return;
    }

    let mounted = true;
    let capturedService = null;
    let capturedListeners = [];

    import('../services/socketServiceEnhanced').then(({ default: socketService }) => {
      if (!mounted) return;

      capturedService = socketService;
      window.socketService = socketService;

      socketService.connect();

      const handleAuthenticated = () => {
        if (mounted) setSocketConnected(true);
      };
      const handleDisconnected = () => {
        if (mounted) setSocketConnected(false);
      };
      const handleReconnectFailed = () => {
        if (mounted) setSocketConnected(false);
      };
      const handleConnectError = (error) => {
        console.error('Socket connection error:', error);
      };
      const handleError = (error) => {
        console.error('Socket error:', error);
      };
      const handleStaffUpdated = (data) => {
        updateStaffLocal(data.staffId, {
          name: data.name,
          role: data.role,
          department: data.department,
          status: data.status,
          phone: data.phone,
          email: data.email,
          picture: data.picture,
        });
      };
      const handleStudentUpdated = (data) => {
        updateStudentLocal(data.studentId, {
          name: data.name,
          classId: data.classId,
          rollNo: data.rollNo,
          photo: data.photo,
          status: data.status,
        });
      };
      const handleClassUpdated = (data) => {
        updateClassLocal(data.classId, {
          name: data.name,
          section: data.section,
          classTeacherId: data.classTeacherId,
        });
      };
      const handleAttendanceUpdated = (data) => {
        if (data.type === 'staff') {
          updateStaffAttendanceSocket(data);
        } else if (data.type === 'student') {
          updateStudentAttendanceSocket(data);
        }
      };
      const handleFeePaymentCreated = (data) => {
        updateStudentLocal(data.studentId, { feeStatus: 'paid' });
      };
      const handleStudentCreated = (data) => {
        addStudentFromSocket(data);
      };

      socketService.on('authenticated', handleAuthenticated);
      socketService.on('disconnected', handleDisconnected);
      socketService.on('reconnect_failed', handleReconnectFailed);
      socketService.on('connect_error', handleConnectError);
      socketService.on('error', handleError);
      socketService.on('staff_updated', handleStaffUpdated);
      socketService.on('student_updated', handleStudentUpdated);
      socketService.on('class_updated', handleClassUpdated);
      socketService.on('attendance_updated', handleAttendanceUpdated);
      socketService.on('fee_payment_created', handleFeePaymentCreated);
      socketService.on('student_created', handleStudentCreated);

      // Store handlers for cleanup
      capturedListeners = [
        ['authenticated', handleAuthenticated],
        ['disconnected', handleDisconnected],
        ['reconnect_failed', handleReconnectFailed],
        ['connect_error', handleConnectError],
        ['error', handleError],
        ['staff_updated', handleStaffUpdated],
        ['student_updated', handleStudentUpdated],
        ['class_updated', handleClassUpdated],
        ['attendance_updated', handleAttendanceUpdated],
        ['fee_payment_created', handleFeePaymentCreated],
        ['student_created', handleStudentCreated],
      ];
    }).catch((err) => {
      console.error('Failed to import socket service:', err);
    });

    return () => {
      mounted = false;
      const svc = capturedService || window.socketService;
      if (svc) {
        capturedListeners.forEach(([event, handler]) => svc.off(event, handler));
        svc.disconnect();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { socketConnected };
}
