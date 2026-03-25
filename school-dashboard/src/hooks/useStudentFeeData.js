import { useState, useEffect, useCallback } from "react";
import { studentFeesApi, feesApi } from "../services/api";

/**
 * Custom hook to manage student fee structure and payment history.
 * Extracts fee-related state from StudentOverview.
 */
export function useStudentFeeData(studentId, academicYear, studentAcademicYear) {
  const [studentFeeStructure, setStudentFeeStructure] = useState(null);
  const [loadingFeeStructure, setLoadingFeeStructure] = useState(false);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  const fetchFeeStructure = useCallback(async () => {
    if (!studentId) return;
    setLoadingFeeStructure(true);
    try {
      const data = await studentFeesApi.getByStudent(studentId, academicYear);
      setStudentFeeStructure(data);
    } catch (error) {
      if (error.status === 404) {
        try {
          const data = await studentFeesApi.initialize(studentId, studentAcademicYear || academicYear);
          setStudentFeeStructure(data);
        } catch (initError) {
          console.error("Error initializing fee structure:", initError);
        }
      } else {
        console.error("Error fetching fee structure:", error);
      }
    } finally {
      setLoadingFeeStructure(false);
    }
  }, [studentId, academicYear, studentAcademicYear]);

  const fetchPaymentHistory = useCallback(async () => {
    if (!studentId) return;
    setLoadingPaymentHistory(true);
    try {
      const data = await feesApi.getPayments({ studentId });
      setFeeHistory(data);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoadingPaymentHistory(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchFeeStructure();
    fetchPaymentHistory();
  }, [fetchFeeStructure, fetchPaymentHistory]);

  return {
    studentFeeStructure,
    setStudentFeeStructure,
    loadingFeeStructure,
    feeHistory,
    setFeeHistory,
    loadingPaymentHistory,
    refetchFeeStructure: fetchFeeStructure,
    refetchPaymentHistory: fetchPaymentHistory,
  };
}
