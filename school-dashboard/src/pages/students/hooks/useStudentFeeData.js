import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { request } from "../../../services/apiClient";
import { formatMonthYear } from "../../../utils/dateFormatter";
import { studentsApi } from "../../../services/api";
import toast from "react-hot-toast";

/**
 * Custom hook for managing student fee data:
 * - Fee structure fetching & initialization
 * - Payment history
 * - Payment recording
 * - Fee summary computation
 */
export function useStudentFeeData(studentId, student, currentAcademicYear) {
  const { t } = useTranslation();

  // Fee structure state
  const [studentFeeStructure, setStudentFeeStructure] = useState(null);
  const [loadingFeeStructure, setLoadingFeeStructure] = useState(false);

  // Payment history state
  const [feeHistory, setFeeHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  // Fetch student fee structure
  const fetchFeeStructure = useCallback(async (signal) => {
    if (!studentId) return;

    try {
      setLoadingFeeStructure(true);

      try {
        const data = await request(`/student-fees/student/${studentId}?academicYear=${currentAcademicYear}`, { signal });
        setStudentFeeStructure(data);
      } catch (fetchError) {
        if (fetchError.status === 404) {
          try {
            const data = await request(`/student-fees/initialize/${studentId}`, {
              method: 'POST',
              body: JSON.stringify({ academicYear: student?.academicYear || currentAcademicYear }),
              signal,
            });
            setStudentFeeStructure(data);
          } catch (initError) {
            if (initError.name === 'AbortError') return;
            console.error('[useStudentFeeData] Error initializing fee structure:', initError);
          }
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[useStudentFeeData] Error fetching fee structure:', error);
    } finally {
      if (!signal?.aborted) setLoadingFeeStructure(false);
    }
  }, [studentId, student?.academicYear, currentAcademicYear]);

  // Fetch payment history from database
  const fetchPaymentHistory = useCallback(async (signal) => {
    if (!studentId) return;

    try {
      setLoadingPaymentHistory(true);
      const data = await request(`/fees/payments?studentId=${studentId}`, { signal });
      setFeeHistory(data);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching payment history:', error);
    } finally {
      if (!signal?.aborted) setLoadingPaymentHistory(false);
    }
  }, [studentId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchFeeStructure(controller.signal);
    fetchPaymentHistory(controller.signal);
    return () => controller.abort();
  }, [studentId, currentAcademicYear, fetchFeeStructure, fetchPaymentHistory]);

  // Record a payment
  const handleRecordPayment = useCallback(async (paymentFormData) => {
    if (!studentFeeStructure || !studentFeeStructure.feeHeads || studentFeeStructure.feeHeads.length === 0) {
      toast.error(t('students.profile.overview.noFeeStructureFound', 'No fee structure found for this student. Please initialize fee structure first.'));
      return;
    }

    const paymentAmount = parseInt(paymentFormData.amount);
    const loadingToast = toast.loading(t('students.profile.overview.recordingPayment', 'Recording payment...'));

    try {
      // 1. Distribute payment across pending fee heads (FIFO)
      const feeHeadPayments = [];
      let remainingAmount = paymentAmount;

      for (const feeHead of studentFeeStructure.feeHeads) {
        if (remainingAmount <= 0) break;

        const balance = feeHead.balanceAmount || 0;
        if (balance > 0) {
          const paymentForThisHead = Math.min(remainingAmount, balance);

          let feeHeadId;
          if (typeof feeHead.feeHeadId === 'object' && feeHead.feeHeadId !== null) {
            feeHeadId = feeHead.feeHeadId._id || feeHead.feeHeadId.id;
          } else {
            feeHeadId = feeHead.feeHeadId;
          }

          feeHeadPayments.push({
            feeHeadId: feeHeadId,
            amount: paymentForThisHead
          });
          remainingAmount -= paymentForThisHead;
        }
      }

      // 2. Update StudentFeeStructure via backend API
      await request(`/student-fees/student/${studentId}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentAmount,
          feeHeadPayments,
          academicYear: studentFeeStructure.academicYear || currentAcademicYear
        })
      });

      // 3. Create payment record (secondary, non-blocking)
      try {
        const paymentData = {
          studentId,
          studentName: student?.name || '',
          classId: student?.classId,
          academicYear: studentFeeStructure.academicYear || currentAcademicYear,
          paymentDate: paymentFormData.date,
          amount: paymentAmount,
          paymentMode: paymentFormData.paymentMode,
          feeHeads: feeHeadPayments.map(fp => ({
            period: formatMonthYear(paymentFormData.date),
            amount: fp.amount
          })),
          remarks: `Fee payment via ${paymentFormData.paymentMode}`,
          receiptNumber: `RCP-${Date.now()}`
        };

        await request(`/fees/payments`, {
          method: 'POST',
          body: JSON.stringify(paymentData)
        });
      } catch (paymentRecordError) {
        console.warn('Could not create payment record:', paymentRecordError);
      }

      toast.success(t('students.profile.overview.paymentRecordedSuccessfully', 'Payment recorded successfully'), { id: loadingToast });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(t('students.profile.overview.paymentRecordFailed', 'Failed to record payment') + ': ' + (error.message || t('students.profile.overview.unknownError', 'Unknown error')), { id: loadingToast });
      return false;
    }

    // 4. Refresh fee structure and payment history — use allSettled so one failure doesn't block the other
    const results = await Promise.allSettled([fetchFeeStructure(), fetchPaymentHistory()]);
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn('Some post-payment refetches failed:', failed.map(r => r.reason));
      toast.error(t('students.refetchFailed', 'Payment saved but data may be stale. Please refresh the page.'));
    }
    return true;
  }, [studentId, student, studentFeeStructure, currentAcademicYear, fetchFeeStructure, fetchPaymentHistory, t]);

  // Compute student fee summary
  const studentFeeSummary = useMemo(() => {
    if (!feeHistory || feeHistory.length === 0) {
      return {
        totalFee: 0,
        totalPaid: 0,
        totalPending: 0,
        totalDiscount: 0,
        nextDueDate: null,
        collectionMode: 'term',
        pendingDuesByPeriod: {},
        feeHeads: []
      };
    }

    const totalPaid = feeHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalFee = 50000; // Mock total annual fee
    const totalPending = totalFee - totalPaid;
    const totalDiscount = 0;

    return {
      totalFee,
      totalPaid,
      totalPending,
      totalDiscount,
      nextDueDate: totalPending > 0 ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() : null,
      collectionMode: 'term',
      pendingDuesByPeriod: {},
      feeHeads: []
    };
  }, [feeHistory]);

  return {
    studentFeeStructure,
    loadingFeeStructure,
    feeHistory,
    loadingPaymentHistory,
    studentFeeSummary,
    handleRecordPayment,
    fetchFeeStructure,
    fetchPaymentHistory,
  };
}

export default useStudentFeeData;
