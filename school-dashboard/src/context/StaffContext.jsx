import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { staffApi } from "../services/api";
import { useSalaryState } from "./hooks/useSalaryState";
import toast from "react-hot-toast";
import logger from "../utils/logger";

export const StaffContext = createContext();

export function StaffProvider({ children }) {
  const queryClient = useQueryClient();
  const [staff, setStaff] = useState([]);

  const invalidateAppData = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["app-context-data"] }),
    [queryClient]
  );

  const {
    salarySettings,
    staffSalaries,
    payrollHistory,
    updateSalarySettings,
    updateStaffSalary,
    processPayroll,
    getPayrollForMonth,
  } = useSalaryState();

  // Additional staff-related data
  const [lessonPlans, setLessonPlans] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [remarks, setRemarks] = useState([]);

  // Called by AppContextCore when query data arrives
  const setStaffFromQuery = useCallback((data) => {
    setStaff(data);
  }, []);

  const addStaff = async (newStaff) => {
    try {
      const created = await staffApi.create(newStaff);
      setStaff((prev) => [...prev, created]);
      void invalidateAppData();
      return created;
    } catch (err) {
      logger.error("Failed to add staff:", err);
      toast.error("Failed to add staff member");
      throw err;
    }
  };

  const updateStaff = async (id, updates) => {
    const prev = staff;
    try {
      const updated = await staffApi.update(id, updates);

      // Ensure picture from updates is always included in state update
      // This is critical for instant photo reflection after upload
      const finalUpdates = { ...updated };
      if (updates.picture) {
        finalUpdates.picture = updates.picture;
      }

      // [AUDIT-161] Merge into existing staff object instead of replacing it entirely.
      // The API response may not include all fields (e.g., computed or
      // populated fields), so spreading the existing object first preserves them.
      setStaff((curr) => curr.map((s) => (String(s.id) === String(id) ? { ...s, ...finalUpdates } : s)));
      void invalidateAppData();
      return finalUpdates;
    } catch (err) {
      logger.error("Failed to update staff:", err);
      toast.error("Failed to update staff member");
      setStaff(prev);
      throw err;
    }
  };

  // Update staff in state without API call (for real-time socket updates)
  const updateStaffLocal = (id, updates) => {
    setStaff((prev) =>
      prev.map((s) => (String(s.id) === String(id) ? { ...s, ...updates } : s))
    );
  };

  const deleteStaff = async (id) => {
    const prev = staff;
    try {
      await staffApi.delete(id);
      setStaff((curr) => curr.filter((s) => String(s.id) !== String(id)));
      void invalidateAppData();
    } catch (err) {
      logger.error("Failed to delete staff:", err);
      toast.error("Failed to delete staff member");
      setStaff(prev);
      throw err;
    }
  };

  const toggleStaffStatus = async (id) => {
    const staffMember = staff.find((s) => s.id === id);
    if (staffMember) {
      const newStatus = staffMember.status === "active" ? "inactive" : "active";
      await updateStaff(id, { status: newStatus });
    }
  };

  const getStaffById = (id) =>
    Array.isArray(staff) && id
      ? staff.find((s) => String(s.id) === String(id) || (s._id && String(s._id) === String(id)))
      : undefined;

  const teachers = useMemo(
    () =>
      Array.isArray(staff)
        ? staff.filter((s) => {
            const roles = Array.isArray(s.role) ? s.role : [s.role];
            return roles.includes("Teacher") && s.status === "active";
          })
        : [],
    [staff]
  );

  const addLessonPlan = (plan) => setLessonPlans((prev) => [plan, ...prev]);
  const addDocument = (doc) => setDocuments((prev) => [doc, ...prev]);
  const addRemark = (remark) => setRemarks((prev) => [remark, ...prev]);

  const value = {
    staff,
    teachers,
    lessonPlans,
    documents,
    remarks,
    setStaff,
    setStaffFromQuery,
    addStaff,
    updateStaff,
    updateStaffLocal,
    deleteStaff,
    toggleStaffStatus,
    getStaffById,
    addLessonPlan,
    addDocument,
    addRemark,
    // Salary
    salarySettings,
    staffSalaries,
    payrollHistory,
    updateSalarySettings,
    updateStaffSalary,
    processPayroll,
    getPayrollForMonth,
  };

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) throw new Error("useStaff must be used within StaffProvider");
  return context;
};
