import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { staffApi } from "../services/api";
import { useSalaryState } from "./hooks/useSalaryState";

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
    const created = await staffApi.create(newStaff);
    setStaff((prev) => [...prev, created]);
    void invalidateAppData();
    return created;
  };

  const updateStaff = async (id, updates) => {
    const updated = await staffApi.update(id, updates);

    // Ensure picture from updates is always included in state update
    // This is critical for instant photo reflection after upload
    const finalUpdates = { ...updated };
    if (updates.picture) {
      finalUpdates.picture = updates.picture;
    }

    setStaff((prev) => prev.map((s) => (String(s.id) === String(id) ? finalUpdates : s)));
    void invalidateAppData();
    return finalUpdates;
  };

  // Update staff in state without API call (for real-time socket updates)
  const updateStaffLocal = (id, updates) => {
    setStaff((prev) =>
      prev.map((s) => (String(s.id) === String(id) ? { ...s, ...updates } : s))
    );
  };

  const deleteStaff = async (id) => {
    await staffApi.delete(id);
    setStaff((prev) => prev.filter((s) => String(s.id) !== String(id)));
    void invalidateAppData();
  };

  const toggleStaffStatus = async (id) => {
    const staffMember = staff.find((s) => s.id === id);
    if (staffMember) {
      const newStatus = staffMember.status === "active" ? "inactive" : "active";
      await updateStaff(id, { ...staffMember, status: newStatus });
    }
  };

  const getStaffById = (id) =>
    Array.isArray(staff)
      ? staff.find((s) => s.id === id || s.id === String(id))
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
