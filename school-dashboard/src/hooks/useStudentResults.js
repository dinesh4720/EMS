import { useState, useEffect, useCallback } from "react";
import { studentsApi } from "../services/api";

/**
 * Custom hook to manage student exam results data and fetching.
 * Extracts results-related state from StudentOverview.
 */
export function useStudentResults(studentId, activeTab) {
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchResults = useCallback(async () => {
    if (!studentId || activeTab !== "academics") return;
    setResultsLoading(true);
    try {
      const data = await studentsApi.getResults(studentId);
      setResults(data);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setResultsLoading(false);
    }
  }, [studentId, activeTab]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return {
    results,
    setResults,
    resultsLoading,
    selectedExam,
    setSelectedExam,
  };
}
