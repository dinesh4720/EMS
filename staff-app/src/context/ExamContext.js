import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { examsApi, classesApi, resultsApi } from '../services/api';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExamContext = createContext();

export const useExamContext = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExamContext must be used within an ExamProvider');
  }
  return context;
};

const EXAMS_CACHE_KEY = '@staff_app_exams_cache';
const RESULTS_CACHE_KEY = '@staff_app_results_cache';

export const ExamProvider = ({ children }) => {
  const { user } = useAuth();

  // State
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [resultEntries, setResultEntries] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Load cached exams on mount
  useEffect(() => {
    loadCachedExams();
  }, [user?.id]);

  const loadCachedExams = async () => {
    if (!user?.id) return;
    try {
      const cached = await AsyncStorage.getItem(`${EXAMS_CACHE_KEY}_${user.id}`);
      if (cached) {
        setExams(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Error loading cached exams:', err);
    }
  };

  // Fetch exams for staff's classes
  const fetchExams = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await examsApi.getByStaff(user.id);
      setExams(data || []);

      // Cache the data
      await AsyncStorage.setItem(`${EXAMS_CACHE_KEY}_${user.id}`, JSON.stringify(data || []));
    } catch (err) {
      console.error('Error fetching exams:', err);

      // Try to use cached data
      const cached = await AsyncStorage.getItem(`${EXAMS_CACHE_KEY}_${user.id}`);
      if (cached) {
        setExams(JSON.parse(cached));
        setError('Using cached data - network unavailable');
      } else {
        setError(err.message || 'Failed to fetch exams');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch exam details
  const fetchExamDetails = useCallback(async (examId) => {
    setLoading(true);
    setError(null);

    try {
      const exam = await examsApi.getById(examId);
      setSelectedExam(exam);
      return exam;
    } catch (err) {
      console.error('Error fetching exam details:', err);
      setError(err.message || 'Failed to fetch exam details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students for exam's class
  const fetchStudentsForExam = useCallback(async (classId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await classesApi.getClassStudents(classId);
      setStudents(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to fetch students');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch existing results for exam
  const fetchResults = useCallback(async (classId, examId) => {
    setLoading(true);

    try {
      const data = await examsApi.getResults(examId);
      setResults(data || []);

      // Initialize result entries with existing data
      const entries = {};
      (data || []).forEach(r => {
        entries[r.studentId] = {
          marksObtained: r.marksObtained,
          remarks: r.remarks || ''
        };
      });
      setResultEntries(entries);

      return data || [];
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Failed to fetch results');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Update result entry locally
  const updateResultEntry = useCallback((studentId, marks, remarks = '') => {
    setResultEntries(prev => ({
      ...prev,
      [studentId]: {
        marksObtained: marks,
        remarks
      }
    }));
  }, []);

  // Save results
  const saveResults = useCallback(async (examId) => {
    if (!selectedExam || !user?.id) {
      return { success: false, error: 'Missing exam or user data' };
    }

    setLoading(true);
    setError(null);

    try {
      const resultsArray = students.map(student => ({
        studentId: student.id,
        marksObtained: resultEntries[student.id]?.marksObtained || 0,
        remarks: resultEntries[student.id]?.remarks || '',
        enteredBy: user.id
      }));

      const data = await resultsApi.bulkCreate({
        examId,
        results: resultsArray
      });

      // Refresh results
      await fetchResults(selectedExam.classId, examId);

      return { success: true, data };
    } catch (err) {
      console.error('Error saving results:', err);
      setError(err.message || 'Failed to save results');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [selectedExam, students, resultEntries, user?.id, fetchResults]);

  // Clear state
  const clearState = useCallback(() => {
    setSelectedExam(null);
    setStudents([]);
    setResults([]);
    setResultEntries({});
    setError(null);
  }, []);

  const value = {
    // State
    exams,
    selectedExam,
    results,
    students,
    resultEntries,
    loading,
    error,
    isOnline,

    // Actions
    setSelectedExam,
    fetchExams,
    fetchExamDetails,
    fetchStudentsForExam,
    fetchResults,
    updateResultEntry,
    saveResults,
    clearState,
    setError,
    setIsOnline,
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};

export default ExamContext;
