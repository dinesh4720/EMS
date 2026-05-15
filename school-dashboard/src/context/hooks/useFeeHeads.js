import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { settingsApi } from "../../services/api";
import logger from "../../utils/logger";

export function useFeeHeads(invalidateSettingsData) {
  const { t } = useTranslation();
  const [feeHeads, setFeeHeads] = useState([]);

  const addFeeHead = useCallback(async (feeHead) => {
    try {
      const created = await settingsApi.createFeeHead(feeHead);
      setFeeHeads((prev) => [...prev, created]);
      void invalidateSettingsData();
      toast.success(t('toast.success.feeHeadAddedSuccessfully', 'Fee head added successfully'));
      return created;
    } catch (err) {
      logger.error("Failed to add fee head:", err);
      toast.error(t('toast.error.failedToAddFeeHead', 'Failed to add fee head'));
      const feeHeadWithId = { ...feeHead, id: Date.now() };
      setFeeHeads((prev) => [...prev, feeHeadWithId]);
      return feeHeadWithId;
    }
  }, [t, invalidateSettingsData]);

  const updateFeeHead = useCallback(async (id, updates) => {
    try {
      const updated = await settingsApi.updateFeeHead(id, updates);
      setFeeHeads((prev) => prev.map((fh) => (fh.id === id ? updated : fh)));
      void invalidateSettingsData();
      toast.success(t('toast.success.feeHeadUpdatedSuccessfully', 'Fee head updated successfully'));
      return updated;
    } catch (err) {
      logger.error("Failed to update fee head:", err);
      toast.error(t('toast.error.failedToUpdateFeeHead', 'Failed to update fee head'));
      setFeeHeads((prev) => prev.map((fh) => (fh.id === id ? { ...fh, ...updates } : fh)));
    }
  }, [t, invalidateSettingsData]);

  const deleteFeeHead = useCallback(async (id) => {
    try {
      await settingsApi.deleteFeeHead(id);
      setFeeHeads((prev) => prev.filter((fh) => fh.id !== id));
      void invalidateSettingsData();
      toast.success(t('toast.success.feeHeadDeletedSuccessfully', 'Fee head deleted successfully'));
    } catch (err) {
      logger.error("Failed to delete fee head:", err);
      toast.error(t('toast.error.failedToDeleteFeeHead', 'Failed to delete fee head'));
      throw err;
    }
  }, [t, invalidateSettingsData]);

  return { feeHeads, setFeeHeads, addFeeHead, updateFeeHead, deleteFeeHead };
}
