import { useState, useEffect, useCallback } from "react";
import { studentsApi } from "../services/api";

/**
 * Custom hook to manage student remarks data and fetching.
 * Extracts remarks-related state from StudentOverview.
 */
export function useStudentRemarks(studentId, activeTab) {
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [remarksCategoryFilter, setRemarksCategoryFilter] = useState("all");

  const fetchRemarks = useCallback(async () => {
    if (!studentId || activeTab !== "remarks") return;
    setRemarksLoading(true);
    try {
      const data = await studentsApi.getRemarks(studentId, remarksCategoryFilter);
      setRemarks(data);
    } catch (error) {
      console.error("Error fetching remarks:", error);
    } finally {
      setRemarksLoading(false);
    }
  }, [studentId, activeTab, remarksCategoryFilter]);

  useEffect(() => {
    fetchRemarks();
  }, [fetchRemarks]);

  return {
    remarks,
    setRemarks,
    remarksLoading,
    remarksCategoryFilter,
    setRemarksCategoryFilter,
    refetchRemarks: fetchRemarks,
  };
}
