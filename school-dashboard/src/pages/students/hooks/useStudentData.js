import { useState, useEffect, useCallback } from "react";
import { getAuthToken } from "../utils/studentHelpers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Custom hook for fetching and managing student data
 */
export function useStudentData(studentId, options = {}) {
  const { autoFetch = true } = options;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudent = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/students/${studentId}`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch student: ${response.status}`);
      }

      const data = await response.json();
      setStudent(data);
      return data;
    } catch (err) {
      console.error("Error fetching student:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (autoFetch) {
      fetchStudent();
    }
  }, [autoFetch, fetchStudent]);

  const updateStudent = useCallback(async (updates) => {
    if (!studentId) return false;

    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/students/${studentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update student: ${response.status}`);
      }

      const updated = await response.json();
      setStudent(prev => ({ ...prev, ...updated }));
      return true;
    } catch (err) {
      console.error("Error updating student:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  return {
    student,
    loading,
    error,
    refetch: fetchStudent,
    updateStudent
  };
}

/**
 * Custom hook for fetching student attendance stats
 */
export function useStudentAttendance(studentId) {
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/students/${studentId}/attendance`, { headers });

        if (response.ok) {
          const data = await response.json();
          const present = data.filter(a => a.status === 'present' || a.status === 'P').length;
          const absent = data.filter(a => a.status === 'absent' || a.status === 'A').length;
          const total = data.length;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

          setAttendanceStats({ present, absent, total, percentage });
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [studentId]);

  return { attendanceStats, loading };
}

/**
 * Custom hook for fetching student exam results
 */
export function useStudentResults(studentId) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/students/${studentId}/results`, { headers });

        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [studentId]);

  return { results, loading };
}

export default useStudentData;
