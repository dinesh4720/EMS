import { useState } from "react";
import toast from "react-hot-toast";
import { settingsApi } from "../../services/api";
import logger from "../../utils/logger";

export function useLeaveTypes(invalidateSettingsData) {
  const [leaveTypes, setLeaveTypes] = useState([]);

  const addLeaveType = async (leaveType) => {
    try {
      const created = await settingsApi.createLeaveType(leaveType);
      setLeaveTypes((prev) => [...prev, created]);
      void invalidateSettingsData();
      toast.success("Leave type added successfully");
      return created;
    } catch (err) {
      logger.error("Failed to add leave type:", err);
      toast.error("Failed to add leave type");
      const leaveTypeWithId = { ...leaveType, id: Date.now() };
      setLeaveTypes((prev) => [...prev, leaveTypeWithId]);
      return leaveTypeWithId;
    }
  };

  const updateLeaveType = async (id, updates) => {
    try {
      const updated = await settingsApi.updateLeaveType(id, updates);
      setLeaveTypes((prev) => prev.map((lt) => (lt.id === id ? updated : lt)));
      void invalidateSettingsData();
      toast.success("Leave type updated successfully");
      return updated;
    } catch (err) {
      logger.error("Failed to update leave type:", err);
      toast.error("Failed to update leave type");
      setLeaveTypes((prev) => prev.map((lt) => (lt.id === id ? { ...lt, ...updates } : lt)));
    }
  };

  const deleteLeaveType = async (id) => {
    try {
      await settingsApi.deleteLeaveType(id);
      setLeaveTypes((prev) => prev.filter((lt) => lt.id !== id));
      void invalidateSettingsData();
      toast.success("Leave type deleted successfully");
    } catch (err) {
      logger.error("Failed to delete leave type:", err);
      toast.error("Failed to delete leave type");
      throw err;
    }
  };

  return { leaveTypes, setLeaveTypes, addLeaveType, updateLeaveType, deleteLeaveType };
}
