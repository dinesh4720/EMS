import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import api from '../services/api';
import CONFIG from '../config';
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
  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState({
    attendance: false,
    fees: false,
    exams: false,
    results: false,
    timetable: false,
    remarks: false,
    homework: false,
  });
  const [errors, setErrors] = useState({
    attendance: null,
    fees: null,
    exams: null,
    results: null,
    timetable: null,
    remarks: null,
    homework: null,
  });

  // Track if fee fetch is needed due to socket event
  const fetchFeesRef = useRef(null);

  // Get the current student ID
  const studentId = student?.studentId;

  // Reset data and auto-fetch when student changes (or on first mount)
  useEffect(() => {
    if (studentId) {
      setAttendance(null);
      setFees(null);
      setExams([]);
      setResults([]);
      setTimetable([]);
      setRemarks([]);
      setHomework(null);
      // Auto-fetch essential data on student selection
      fetchAttendanceInternal();
      fetchFees();
      fetchExams();
      fetchResults();
    }
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect socket and listen for real-time updates
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    // Connect socket with JWT token authentication
    AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN).then(token => {
      if (token) socketService.connect(token);
    });

    // Listen for fee updates targeting this student
    const handleFeeUpdate = (data) => {
      // If the update is for the currently selected student, re-fetch fees
      if (data.studentId && fetchFeesRef.current) {
        fetchFeesRef.current();
      }
    };

    // Listen for attendance updates
    const handleAttendanceUpdate = (data) => {
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
    setLoading((prev) => {
      if (prev.attendance) return prev; // guard: already fetching
      return { ...prev, attendance: true };
    });
    setErrors((prev) => ({ ...prev, attendance: null }));
    try {
      const response = await api.getStudentAttendance(studentId, { limit: 365 });
      if (response.success) {
        const data = response.data || {};
        setAttendance({
          ...data.stats,
          attendance: data.attendance || [],
          records: data.attendance || [],
        });
      } else {
        setErrors((prev) => ({ ...prev, attendance: 'Failed to load attendance data.' }));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setErrors((prev) => ({ ...prev, attendance: 'Unable to load attendance. Please try again.' }));
    } finally {
      setLoading((prev) => ({ ...prev, attendance: false }));
    }
  }, [studentId]);

  const fetchAttendance = fetchAttendanceInternal;

  const fetchFees = useCallback(async () => {
    if (!studentId) return;
    setLoading((prev) => {
      if (prev.fees) return prev;
      return { ...prev, fees: true };
    });
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
    if (!studentId) return;
    setLoading((prev) => {
      if (prev.exams) return prev;
      return { ...prev, exams: true };
    });
    setErrors((prev) => ({ ...prev, exams: null }));
    try {
      const response = await api.getStudentExams(studentId);
      if (response.success && response.data?.exams) {
        const examList = response.data.exams.map(exam => ({
          id: exam._id,
          name: exam.name,
          type: exam.examType,
          subject: exam.subjectName,
          startDate: exam.startDate,
          endDate: exam.endDate,
          status: exam.status || 'scheduled',
          maxMarks: exam.maxMarks,
          passingMarks: exam.passingMarks,
        }));
        setExams(examList);
      } else if (!response.success) {
        setErrors((prev) => ({ ...prev, exams: 'Failed to load exams.' }));
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setErrors((prev) => ({ ...prev, exams: 'Unable to load exams. Please try again.' }));
    } finally {
      setLoading((prev) => ({ ...prev, exams: false }));
    }
  }, [studentId]);

  const fetchResults = useCallback(async () => {
    if (!studentId) return;
    setLoading((prev) => {
      if (prev.results) return prev;
      return { ...prev, results: true };
    });
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

  const fetchHomework = useCallback(async () => {
    if (!studentId) return;
    setLoading((prev) => {
      if (prev.homework) return prev;
      return { ...prev, homework: true };
    });
    setErrors((prev) => ({ ...prev, homework: null }));
    try {
      const response = await api.getStudentHomework(studentId);
      if (response.success) {
        setHomework(response.data?.homework || []);
      } else {
        setErrors((prev) => ({ ...prev, homework: 'Failed to load homework.' }));
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
      setErrors((prev) => ({ ...prev, homework: 'Unable to load homework. Please try again.' }));
    } finally {
      setLoading((prev) => ({ ...prev, homework: false }));
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
    homework,
    loading,
    errors,
    fetchAttendance,
    fetchFees,
    fetchExams,
    fetchResults,
    fetchTimetable,
    fetchRemarks,
    fetchHomework,
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
