import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { settingsApi } from "../../services/api";
import logger from "../../utils/logger";

export function useLeaveTypes(invalidateSettingsData) {
  const { t } = useTranslation();
  const [leaveTypes, setLeaveTypes] = useState([]);

  const addLeaveType = useCallback(async (leaveType) => {
    try {
      const created = await settingsApi.createLeaveType(leaveType);
      setLeaveTypes((prev) => [...prev, created]);
      void invalidateSettingsData();
      toast.success(t('toast.success.leaveTypeAddedSuccessfully', 'Leave type added successfully'));
      return created;
    } catch (err) {
      logger.error("Failed to add leave type:", err);
      toast.error(t('toast.error.failedToAddLeaveType', 'Failed to add leave type'));
      const leaveTypeWithId = { ...leaveType, id: Date.now() };
      setLeaveTypes((prev) => [...prev, leaveTypeWithId]);
      return leaveTypeWithId;
    }
  }, [t, invalidateSettingsData]);

  const updateLeaveType = useCallback(async (id, updates) => {
    try {
      const updated = await settingsApi.updateLeaveType(id, updates);
      setLeaveTypes((prev) => prev.map((lt) => (lt.id === id ? updated : lt)));
      void invalidateSettingsData();
      toast.success(t('toast.success.leaveTypeUpdatedSuccessfully', 'Leave type updated successfully'));
      return updated;
    } catch (err) {
      logger.error("Failed to update leave type:", err);
      toast.error(t('toast.error.failedToUpdateLeaveType', 'Failed to update leave type'));
      setLeaveTypes((prev) => prev.map((lt) => (lt.id === id ? { ...lt, ...updates } : lt)));
    }
  }, [t, invalidateSettingsData]);

  const deleteLeaveType = useCallback(async (id) => {
    try {
      await settingsApi.deleteLeaveType(id);
      setLeaveTypes((prev) => prev.filter((lt) => lt.id !== id));
      void invalidateSettingsData();
      toast.success(t('toast.success.leaveTypeDeletedSuccessfully', 'Leave type deleted successfully'));
    } catch (err) {
      logger.error("Failed to delete leave type:", err);
      toast.error(t('toast.error.failedToDeleteLeaveType', 'Failed to delete leave type'));
      throw err;
    }
  }, [t, invalidateSettingsData]);

  return { leaveTypes, setLeaveTypes, addLeaveType, updateLeaveType, deleteLeaveType };
}
