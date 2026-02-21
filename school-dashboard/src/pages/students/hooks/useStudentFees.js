import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for fetching student fee structure
 * Eliminates duplicated logic from StudentsList.jsx and StudentOverview.jsx
 * 
 * @param {string} studentId - The student ID
 * @param {Object} options - Optional configuration
 * @returns {Object} Fee structure data and loading state
 */
export function useStudentFees(studentId, options = {}) {
  const { academicYear = "2024-25", autoInitialize = true } = options;
  
  const [feeStructure, setFeeStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exists, setExists] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  const getAuthHeaders = useCallback(() => {
    const storedUser = localStorage.getItem("app_user");
    const token = storedUser ? JSON.parse(storedUser).token : null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  const initializeFeeStructure = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/student-fees/initialize/${studentId}`,
        {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ academicYear }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (err) {
      console.error("Failed to initialize fee structure:", err);
      return null;
    }
  }, [studentId, academicYear, API_URL, getAuthHeaders]);

  const fetchFeeStructure = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/student-fees/student/${studentId}?academicYear=${academicYear}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        setFeeStructure(data);
        setExists(true);
      } else if (response.status === 404 && autoInitialize) {
        // Auto-initialize fee structure
        const initialized = await initializeFeeStructure();
        if (initialized) {
          setFeeStructure(initialized);
          setExists(true);
        } else {
          setExists(false);
        }
      } else {
        setExists(false);
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to fetch fee structure");
      }
    } catch (err) {
      console.error("Error fetching fee structure:", err);
      setError(err.message);
      setExists(false);
    } finally {
      setLoading(false);
    }
  }, [studentId, academicYear, autoInitialize, API_URL, getAuthHeaders, initializeFeeStructure]);

  useEffect(() => {
    fetchFeeStructure();
  }, [fetchFeeStructure]);

  const refetch = useCallback(() => {
    fetchFeeStructure();
  }, [fetchFeeStructure]);

  return {
    feeStructure,
    loading,
    error,
    exists,
    refetch,
  };
}

/**
 * Hook for fetching fee structures for multiple students (batch)
 * Used in StudentsList for better performance
 */
export function useBatchStudentFees(studentIds, options = {}) {
  const { academicYear = "2024-25" } = options;
  const [feeStructures, setFeeStructures] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  // Memoize the student IDs array to prevent unnecessary re-fetches
  const studentIdsKey = JSON.stringify(studentIds);

  useEffect(() => {
    const parsedIds = JSON.parse(studentIdsKey);
    if (!parsedIds || parsedIds.length === 0) return;

    const fetchBatchFees = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem("app_user");
        const token = storedUser ? JSON.parse(storedUser).token : null;
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Fetch in batches of 10 to avoid overwhelming the server
        const batchSize = 10;
        const results = {};

        for (let i = 0; i < parsedIds.length; i += batchSize) {
          const batch = parsedIds.slice(i, i + batchSize);
          const promises = batch.map(async (id) => {
            try {
              const response = await fetch(
                `${API_URL}/student-fees/student/${id}?academicYear=${academicYear}`,
                { headers }
              );

              if (response.ok) {
                const data = await response.json();
                return { id, data, exists: true };
              } else if (response.status === 404) {
                // Try to initialize
                const initResponse = await fetch(
                  `${API_URL}/student-fees/initialize/${id}`,
                  {
                    method: "POST",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({ academicYear }),
                  }
                );

                if (initResponse.ok) {
                  const data = await initResponse.json();
                  return { id, data, exists: true };
                }
              }
              return { id, exists: false };
            } catch (error) {
              console.error(`Error fetching fees for ${id}:`, error);
              return { id, exists: false };
            }
          });

          const batchResults = await Promise.all(promises);
          batchResults.forEach(({ id, data, exists }) => {
            results[id] = { ...data, _exists: exists };
          });
        }

        setFeeStructures(results);
      } catch (error) {
        console.error("Error fetching batch fee structures:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchFees();
  }, [studentIdsKey, academicYear, API_URL]);

  return { feeStructures, loading };
}
