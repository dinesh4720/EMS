import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import socketService from '../services/socketService';

const StudentContext = createContext(null);

export const StudentProvider = ({ children }) => {
  const { user, student, isAuthenticated } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [fees, setFees] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState({
    attendance: false,
    fees: false,
    exams: false,
    results: false,
    timetable: false,
    remarks: false,
  });

  // Track if fee fetch is needed due to socket event
  const fetchFeesRef = useRef(null);

  // Get the current student ID
  const studentId = student?.studentId;

  // Reset data when student changes
  useEffect(() => {
    if (studentId) {
      setAttendance(null);
      setFees(null);
      setExams([]);
      setResults([]);
      setTimetable([]);
      setRemarks([]);
    }
  }, [studentId]);

  // Connect socket and listen for real-time updates
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    // Connect socket with parent authentication
    socketService.connect(user.id, 'parent');

    // Listen for fee updates targeting this student
    const handleFeeUpdate = (data) => {
      console.log('📡 Real-time fee update received:', data);
      // If the update is for the currently selected student, re-fetch fees
      if (data.studentId && fetchFeesRef.current) {
        fetchFeesRef.current();
      }
    };

    // Listen for attendance updates
    const handleAttendanceUpdate = (data) => {
      console.log('📡 Real-time attendance update received:', data);
      if (data.studentId === studentId) {
        // Re-fetch attendance data
        fetchAttendanceInternal();
      }
    };

    socketService.on('student_fee_updated', handleFeeUpdate);
    socketService.on('fee_structure_updated', handleFeeUpdate);
    socketService.on('fee_payment_created', handleFeeUpdate);
    socketService.on('attendance_updated', handleAttendanceUpdate);

    return () => {
      socketService.off('student_fee_updated', handleFeeUpdate);
      socketService.off('fee_structure_updated', handleFeeUpdate);
      socketService.off('fee_payment_created', handleFeeUpdate);
      socketService.off('attendance_updated', handleAttendanceUpdate);
    };
  }, [user?.id, isAuthenticated, studentId]);

  const fetchAttendanceInternal = useCallback(async () => {
    if (!studentId) return;
    setLoading((prev) => ({ ...prev, attendance: true }));
    try {
      const response = await api.getStudentAttendance(studentId, { limit: 365 });
      if (response.success) {
        const data = response.data || {};
        setAttendance({
          ...data.stats,
          attendance: data.attendance || [],
          records: data.attendance || [],
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading((prev) => ({ ...prev, attendance: false }));
    }
  }, [studentId]);

  const fetchAttendance = fetchAttendanceInternal;

  const fetchFees = useCallback(async () => {
    if (!studentId) return;
    setLoading((prev) => ({ ...prev, fees: true }));
    try {
      const response = await api.getStudentFees(studentId);
      if (response.success) {
        const data = response.data || {};
        setFees(data);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading((prev) => ({ ...prev, fees: false }));
    }
  }, [studentId]);

  // Keep a ref to fetchFees so socket handler can call it without stale closure
  useEffect(() => {
    fetchFeesRef.current = fetchFees;
  }, [fetchFees]);

  const fetchExams = useCallback(async () => {
    // Exams come through results endpoint - extract exam info
    if (!studentId) return;
    setLoading((prev) => ({ ...prev, exams: true }));
    try {
      const response = await api.getStudentResults(studentId);
      if (response.success && response.data?.results) {
        const examList = response.data.results
          .filter(r => r.examId)
          .map(r => ({
            id: r.examId._id || r.examId,
            name: r.examId.name || r.examName,
            type: r.examId.examType,
            startDate: r.examId.startDate,
            endDate: r.examId.endDate,
            status: 'completed',
          }));
        setExams(examList);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading((prev) => ({ ...prev, exams: false }));
    }
  }, [studentId]);

  const fetchResults = useCallback(async () => {
    if (!studentId) return;
    setLoading((prev) => ({ ...prev, results: true }));
    try {
      const response = await api.getStudentResults(studentId);
      if (response.success) {
        setResults(response.data?.results || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading((prev) => ({ ...prev, results: false }));
    }
  }, [studentId]);

  const fetchTimetable = useCallback(async () => {
    if (!studentId) return;
    setLoading((prev) => ({ ...prev, timetable: true }));
    try {
      const response = await api.getStudentTimetable(studentId);
      if (response.success) {
        setTimetable(response.data?.timetable || response.data);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading((prev) => ({ ...prev, timetable: false }));
    }
  }, [studentId]);

  const fetchRemarks = useCallback(async () => {
    if (!studentId) return;
    setLoading((prev) => ({ ...prev, remarks: true }));
    try {
      const response = await api.getStudentRemarks(studentId);
      if (response.success) {
        setRemarks(response.data?.remarks || []);
      }
    } catch (error) {
      console.error('Error fetching remarks:', error);
    } finally {
      setLoading((prev) => ({ ...prev, remarks: false }));
    }
  }, [studentId]);

  const value = {
    student,
    attendance,
    fees,
    exams,
    results,
    timetable,
    remarks,
    loading,
    fetchAttendance,
    fetchFees,
    fetchExams,
    fetchResults,
    fetchTimetable,
    fetchRemarks,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};

export default StudentContext;
