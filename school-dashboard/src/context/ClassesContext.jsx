import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { classesApi } from "../services/api";

export const ClassesContext = createContext();

export function ClassesProvider({ children, staff, students }) {
  const queryClient = useQueryClient();
  const [classes, setClasses] = useState([]);

  const invalidateAppData = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["app-context-data"] }),
    [queryClient]
  );

  // Called by AppContextCore when query data arrives
  const setClassesFromQuery = useCallback((data) => {
    setClasses(data);
  }, []);

  const addClass = async (newClass) => {
    const created = await classesApi.create(newClass);
    setClasses((prev) => [
      ...prev,
      { ...created, name: created.name.replace("Class ", ""), strength: 0, attendance: 0 },
    ]);
    void invalidateAppData();
    return created;
  };

  const updateClass = async (id, updates) => {
    const updated = await classesApi.update(id, updates);
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    void invalidateAppData();
    return updated;
  };

  // Update class in state without API call (for real-time socket updates)
  const updateClassLocal = (id, updates) => {
    setClasses((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, ...updates } : c))
    );
  };

  const deleteClass = async (id) => {
    await classesApi.delete(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    void invalidateAppData();
  };

  const getClassById = (id) =>
    Array.isArray(classes) ? classes.find((c) => c.id === id) : undefined;

  const classesWithTeachers = useMemo(() => {
    if (!Array.isArray(classes) || !Array.isArray(staff) || !Array.isArray(students)) return [];
    return classes.map((c) => ({
      ...c,
      teacher:
        staff.find(
          (s) =>
            String(s.id) === String(c.classTeacherId) ||
            String(s._id) === String(c.classTeacherId)
        )?.name || "Unassigned",
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

  const value = {
    classes,
    classesWithTeachers,
    setClasses,
    setClassesFromQuery,
    addClass,
    updateClass,
    updateClassLocal,
    deleteClass,
    getClassById,
  };

  return <ClassesContext.Provider value={value}>{children}</ClassesContext.Provider>;
}

export const useClasses = () => {
  const context = useContext(ClassesContext);
  if (!context) throw new Error("useClasses must be used within ClassesProvider");
  return context;
};
