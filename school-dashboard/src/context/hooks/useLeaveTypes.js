import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { settingsApi } from "../../services/api";
import logger from "../../utils/logger";

export function useLeaveTypes(invalidateSettingsData) {
  const { t } = useTranslation();
  const [leaveTypes, setLeaveTypes] = useState([]);

  const addLeaveType = useCallback(async (leaveType) => {
    const localId = Date.now();
    const optimistic = { ...leaveType, id: localId };
    setLeaveTypes((prev) => [...prev, optimistic]);
    try {
      const created = await settingsApi.createLeaveType(leaveType);
      setLeaveTypes((prev) => prev.map((lt) => (lt.id === localId ? created : lt)));
      void invalidateSettingsData();
      toast.success(t('toast.success.leaveTypeAddedSuccessfully', 'Leave type added successfully'));
      return created;
    } catch (err) {
      logger.error("Failed to add leave type:", err);
      toast.error(t('toast.error.failedToAddLeaveType', 'Failed to add leave type'));
      // Rollback optimistic update
      setLeaveTypes((prev) => prev.filter((lt) => lt.id !== localId));
      throw err;
    }
  }, [t, invalidateSettingsData]);

  const updateLeaveType = useCallback(async (id, updates) => {
    let prevState;
    setLeaveTypes((prev) => {
      prevState = prev;
      return prev.map((lt) => (lt.id === id ? { ...lt, ...updates } : lt));
    });
    try {
      const updated = await settingsApi.updateLeaveType(id, updates);
      setLeaveTypes((prev) => prev.map((lt) => (lt.id === id ? updated : lt)));
      void invalidateSettingsData();
      toast.success(t('toast.success.leaveTypeUpdatedSuccessfully', 'Leave type updated successfully'));
      return updated;
    } catch (err) {
      logger.error("Failed to update leave type:", err);
      toast.error(t('toast.error.failedToUpdateLeaveType', 'Failed to update leave type'));
      // Rollback optimistic update
      if (prevState) setLeaveTypes(prevState);
      throw err;
    }
  }, [t, invalidateSettingsData]);

  const deleteLeaveType = useCallback(async (id) => {
    let prevState;
    setLeaveTypes((prev) => {
      prevState = prev;
      return prev.filter((lt) => lt.id !== id);
    });
    try {
      await settingsApi.deleteLeaveType(id);
      void invalidateSettingsData();
      toast.success(t('toast.success.leaveTypeDeletedSuccessfully', 'Leave type deleted successfully'));
    } catch (err) {
      logger.error("Failed to delete leave type:", err);
      toast.error(t('toast.error.failedToDeleteLeaveType', 'Failed to delete leave type'));
      // Rollback optimistic update
      if (prevState) setLeaveTypes(prevState);
      throw err;
    }
  }, [t, invalidateSettingsData]);

  return { leaveTypes, setLeaveTypes, addLeaveType, updateLeaveType, deleteLeaveType };
}
