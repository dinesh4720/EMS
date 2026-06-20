/**
 * useStudentPayment
 * Extracted from StudentDashboard.jsx — handles fee payment recording logic.
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { studentFeesApi } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import { toTodayDateString } from '../../../utils/dateFormatter';
import { formatCurrency } from '../../../utils/numberFormatter';
import logger from '../../../utils/logger';


export function useStudentPayment(studentId, {
  currentAcademicYear,
  studentFeeStructure,
  refetchFeeStructure,
  refetchStudent,
  feeHistoryRefetch,
} = {}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'cash',
    date: toTodayDateString(),
  });

  const resetPaymentForm = useCallback(() => {
    setPaymentForm({
      amount: '',
      paymentMode: 'cash',
      date: toTodayDateString(),
    });
  }, []);

  const handleRecordPayment = useCallback(async (onSuccess) => {
    if (!paymentForm.amount || !paymentForm.paymentMode) {
      toast.error(t('toast.error.pleaseEnterAmountAndSelectPaymentMethod'));
      return;
    }

    if (!studentFeeStructure || studentFeeStructure.totalBalance <= 0) {
      toast.error(t('toast.error.noOutstandingBalanceToPay'));
      return;
    }

    const paymentAmount = parseFloat(paymentForm.amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      toast.error(t('toast.error.pleaseEnterAValidAmount'));
      return;
    }

    const totalBalance = studentFeeStructure?.totalBalance || 0;
    if (paymentAmount > totalBalance) {
      toast.error(`Amount cannot exceed outstanding balance of ${formatCurrency(totalBalance)}`);
      return;
    }

    setIsRecordingPayment(true);
    const loadingToast = toast.loading(t('toast.loading.recordingPayment'));

    try {
      // Calculate fee head payment distribution
      const feeHeadPayments = [];
      let remainingAmount = paymentAmount;

      if (studentFeeStructure?.feeHeads) {
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
            feeHeadPayments.push({ feeHeadId, amount: paymentForThisHead });
            remainingAmount -= paymentForThisHead;
          }
        }
      }

      await studentFeesApi.recordPayment(studentId, {
        amount: paymentAmount,
        feeHeadPayments,
        paymentMode: paymentForm.paymentMode,
        paymentDate: paymentForm.date,
        academicYear: currentAcademicYear,
      });

      toast.success('Payment recorded successfully', { id: loadingToast });
      resetPaymentForm();

      // Refresh all related data
      await Promise.all([
        refetchFeeStructure?.(),
        feeHistoryRefetch?.(),
        refetchStudent?.(),
      ]);
      void queryClient.invalidateQueries({ queryKey: ['app-context-data'] });
      // Recording a payment changes the Fees page list and its KPI aggregates —
      // invalidate both so they don't serve pre-payment data until the cache
      // goes stale (PAG-26). Prefix match covers every param permutation.
      void queryClient.invalidateQueries({ queryKey: ['fees-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['fees-summary'] });

      onSuccess?.();
    } catch (error) {
      logger.error('Payment error:', error);
      toast.error(
        t('toast.error.failedToRecordPayment', 'Failed to record payment') +
          ': ' +
          (error.message || t('common.unknownError', 'Unknown error')),
        { id: loadingToast }
      );
    } finally {
      setIsRecordingPayment(false);
    }
  }, [studentId, paymentForm, studentFeeStructure, currentAcademicYear, refetchFeeStructure, refetchStudent, feeHistoryRefetch, queryClient, resetPaymentForm, t]);

  return {
    isRecordingPayment,
    paymentForm,
    setPaymentForm,
    resetPaymentForm,
    handleRecordPayment,
  };
}
