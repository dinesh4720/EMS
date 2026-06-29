import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { classesApi } from "../services/api";
import toast from "react-hot-toast";
import logger from "../utils/logger";
import { useTranslation } from 'react-i18next';

export const ClassesContext = createContext();

export function ClassesProvider({ children, staff, students }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [classes, setClasses] = useState([]);

  const invalidateAppData = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["app-context-data"] }),
    [queryClient]
  );

  // Called by AppContextCore when query data arrives
  const setClassesFromQuery = useCallback((data) => {
    setClasses(Array.isArray(data) ? data : []);
  }, []);

  const addClass = useCallback(async (newClass) => {
    try {
      const created = await classesApi.create(newClass);
      setClasses((prev) => [
        ...prev,
        { ...created, strength: 0, attendance: 0 },
      ]);
      void invalidateAppData();
      return created;
    } catch (err) {
      logger.error("Failed to add class:", err);
      toast.error(t('toast.error.failedToAddClass', 'Failed to add class'));
      throw err;
    }
  }, [invalidateAppData, t]);

  const updateClass = useCallback(async (id, updates) => {
    const prev = classes;
    try {
      const updated = await classesApi.update(id, updates);
      setClasses((curr) => curr.map((c) => (String(c.id) === String(id) ? { ...c, ...updated } : c)));
      void invalidateAppData();
      return updated;
    } catch (err) {
      logger.error("Failed to update class:", err);
      toast.error(t('toast.error.failedToUpdateClass', 'Failed to update class'));
      setClasses(prev);
      throw err;
    }
  }, [classes, invalidateAppData, t]);

  // Update class in state without API call (for real-time socket updates)
  const updateClassLocal = useCallback((id, updates) => {
    setClasses((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, ...updates } : c))
    );
  }, []);

  const deleteClass = useCallback(async (id) => {
    const prev = classes;
    try {
      await classesApi.delete(id);
      setClasses((curr) => curr.filter((c) => String(c.id) !== String(id)));
      void invalidateAppData();
    } catch (err) {
      logger.error("Failed to delete class:", err);
      toast.error(t('toast.error.failedToDeleteClass', 'Failed to delete class'));
      setClasses(prev);
      throw err;
    }
  }, [classes, invalidateAppData, t]);

  const getClassById = useCallback(
    (id) => (Array.isArray(classes) ? classes.find((c) => c.id === id) : undefined),
    [classes]
  );

  const classesWithTeachers = useMemo(() => {
    if (!Array.isArray(classes) || !Array.isArray(staff) || !Array.isArray(students)) return [];
    return classes.map((c) => ({
      ...c,
      teacher:
        staff.find(
          (s) =>
            String(s.id) === String(c.classTeacherId) ||
            String(s._id) === String(c.classTeacherId)
        )?.name || null,
      teacherPhoto:
        staff.find(
          (s) =>
            String(s.id) === String(c.classTeacherId) ||
            String(s._id) === String(c.classTeacherId)
        )?.picture || null,
      // FIXED: Use String() comparison for ObjectId matching and filter by active status
      studentCount: students.filter(
        (s) =>
          String(s.classId) === String(c.id) &&
          (s.status || "active") === "active" &&
          s.isDeleted !== true
      ).length,
    }));
  }, [classes, staff, students]);

  const value = useMemo(
    () => ({
      classes,
      classesWithTeachers,
      setClasses,
      setClassesFromQuery,
      addClass,
      updateClass,
      updateClassLocal,
      deleteClass,
      getClassById,
    }),
    [
      classes,
      classesWithTeachers,
      setClassesFromQuery,
      addClass,
      updateClass,
      updateClassLocal,
      deleteClass,
      getClassById,
    ]
  );

  return (
    <ClassesContext.Provider value={value}>
      {children}
    </ClassesContext.Provider>
  );
}

export const useClasses = () => {
  const context = useContext(ClassesContext);
  if (!context) throw new Error("useClasses must be used within ClassesProvider");
  return context;
};
