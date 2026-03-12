import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { studentsApi } from "../services/api";

const StudentsContext = createContext();

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async (classFilter) => {
    try {
      setLoading(true);
      const response = await studentsApi.list({
        page: 1,
        limit: 50,
        classId: classFilter || undefined,
      });
      setStudents(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (newStudent) => {
    try {
      const created = await studentsApi.create(newStudent);
      setStudents(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStudent = async (id, updates) => {
    try {
      const updated = await studentsApi.update(id, updates);
      setStudents(prev => prev.map(s => s.id === id ? updated : s));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStudent = async (id) => {
    try {
      const result = await studentsApi.delete(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getStudentById = (id) => students.find(s => s.id === id || s.id === String(id));

  const getStudentsByClass = (className) => students.filter(s => s.class === className);

  const value = {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    getStudentsByClass,
    refetch: fetchStudents,
  };

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (!context) throw new Error("useStudents must be used within StudentsProvider");
  return context;
};
