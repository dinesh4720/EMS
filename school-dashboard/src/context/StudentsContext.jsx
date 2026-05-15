import { createContext, useContext, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "../services/api";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import logger from "../utils/logger";

export const StudentsContext = createContext();

export function StudentsProvider({ children }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [students, setStudents] = useState([]);
  const [studentsHydrated, setStudentsHydrated] = useState(false);

  const invalidateAppData = useCallback(
    () => {
      queryClient.invalidateQueries({ queryKey: ["app-context-data"] });
      // Also invalidate the students list query used by StudentsList page
      queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
    [queryClient]
  );

  // Called by AppContextCore when query data arrives
  const setStudentsFromQuery = useCallback((data, hydrated) => {
    setStudents(Array.isArray(data) ? data : []);
    if (hydrated !== undefined) setStudentsHydrated(hydrated);
  }, []);

  const addStudent = async (newStudent) => {
    try {
      const created = await studentsApi.create(newStudent);
      setStudents((prev) => [...prev, created]);
      void invalidateAppData();
      return created;
    } catch (err) {
      logger.error("Failed to add student:", err);
      toast.error(t('toast.error.failedToAddStudent', 'Failed to add student'));
      err._toastShown = true;
      throw err;
    }
  };

  const updateStudent = async (id, updates) => {
    const prev = students;
    try {
      const updated = await studentsApi.update(id, updates);

      // Ensure photo from updates is always included in state update
      // This is critical for instant photo reflection after upload
      const finalUpdates = { ...updated };
      if (updates.photo) {
        finalUpdates.photo = updates.photo;
      }

      setStudents((curr) =>
        curr.map((s) => (String(s.id) === String(id) ? { ...s, ...finalUpdates } : s))
      );
      void invalidateAppData();
      return finalUpdates;
    } catch (err) {
      logger.error("Failed to update student:", err);
      toast.error(t('toast.error.failedToUpdateStudent', 'Failed to update student'));
      err._toastShown = true;
      setStudents(prev);
      throw err;
    }
  };

  // Update student in state without API call (for real-time socket updates)
  const updateStudentLocal = (id, updates) => {
    setStudents((prev) =>
      prev.map((s) => (String(s.id) === String(id) ? { ...s, ...updates } : s))
    );
  };

  const deleteStudent = async (id) => {
    const prev = students;
    try {
      const result = await studentsApi.delete(id);
      setStudents((curr) => curr.filter((s) => String(s.id) !== String(id)));
      void invalidateAppData();
      return result;
    } catch (err) {
      logger.error("Failed to delete student:", err);
      setStudents(prev);
      throw err;
    }
  };

  const getStudentById = (id) =>
    Array.isArray(students) ? students.find((s) => String(s.id) === String(id)) : undefined;

  // FIXED: Use String() comparison for ObjectId matching and filter by active status
  const getStudentsByClass = (classId) =>
    Array.isArray(students)
      ? students.filter(
          (s) =>
            String(s.classId) === String(classId) &&
            (s.status || "active") === "active" &&
            s.isDeleted !== true
        )
      : [];

  const value = {
    students,
    studentsHydrated,
    setStudents,
    setStudentsHydrated,
    setStudentsFromQuery,
    addStudent,
    updateStudent,
    updateStudentLocal,
    deleteStudent,
    getStudentById,
    getStudentsByClass,
  };

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (!context) throw new Error("useStudents must be used within StudentsProvider");
  return context;
};
