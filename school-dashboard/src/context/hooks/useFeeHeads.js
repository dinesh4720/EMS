import { useState } from "react";
import toast from "react-hot-toast";
import { settingsApi } from "../../services/api";

export function useFeeHeads(invalidateSettingsData) {
  const [feeHeads, setFeeHeads] = useState([]);

  const addFeeHead = async (feeHead) => {
    try {
      const created = await settingsApi.createFeeHead(feeHead);
      setFeeHeads((prev) => [...prev, created]);
      void invalidateSettingsData();
      toast.success("Fee head added successfully");
      return created;
    } catch (err) {
      console.error("Failed to add fee head:", err);
      toast.error("Failed to add fee head");
      const feeHeadWithId = { ...feeHead, id: Date.now() };
      setFeeHeads((prev) => [...prev, feeHeadWithId]);
      return feeHeadWithId;
    }
  };

  const updateFeeHead = async (id, updates) => {
    try {
      const updated = await settingsApi.updateFeeHead(id, updates);
      setFeeHeads((prev) => prev.map((fh) => (fh.id === id ? updated : fh)));
      void invalidateSettingsData();
      toast.success("Fee head updated successfully");
      return updated;
    } catch (err) {
      console.error("Failed to update fee head:", err);
      toast.error("Failed to update fee head");
      setFeeHeads((prev) => prev.map((fh) => (fh.id === id ? { ...fh, ...updates } : fh)));
    }
  };

  const deleteFeeHead = async (id) => {
    try {
      await settingsApi.deleteFeeHead(id);
      setFeeHeads((prev) => prev.filter((fh) => fh.id !== id));
      void invalidateSettingsData();
      toast.success("Fee head deleted successfully");
    } catch (err) {
      console.error("Failed to delete fee head:", err);
      toast.error("Failed to delete fee head");
      throw err;
    }
  };

  return { feeHeads, setFeeHeads, addFeeHead, updateFeeHead, deleteFeeHead };
}
