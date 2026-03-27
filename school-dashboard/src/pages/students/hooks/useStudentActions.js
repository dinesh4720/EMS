import { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { feesApi, studentFeesApi, studentsApi, uploadApi } from "../../../services/api";
import { useApp } from "../../../context/AppContext";
import { queryKeys } from "../../../lib/queryKeys";
import { showErrorToast } from "../../../utils/errorHandling";

/**
 * useStudentActions - Encapsulates all async action handlers for the student dashboard.
 *
 * Covers: photo upload/remove, payment recording, promotion, fee reminders, and rating saves.
 *
 * @param {object} params
 * @param {string} params.studentId
 * @param {object} params.student
 * @param {object} params.studentFeeStructure
 * @param {string} params.currentAcademicYear
 * @param {Function} params.refetchFeeStructure
 * @param {object} params.feeHistoryQuery
 * @param {Function} params.refetchStudent
 * @param {Function} params.onPaymentClose
 */
export function useStudentActions({
  studentId,
  student,
  studentFeeStructure,
  currentAcademicYear,
  refetchFeeStructure,
  feeHistoryQuery,
  refetchStudent,
  onPaymentClose,
}) {
  const { t } = useTranslation();
  const { updateStudent, classesWithTeachers } = useApp();
  const queryClient = useQueryClient();

  // Photo state
  const fileInputRef = useRef(null);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

  // Reminder state
  const [reminderMessage, setReminderMessage] = useState("");
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // ── Photo Handlers ──────────────────────────────────────────────────
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageForEdit(reader.result);
        setIsPhotoEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePhotoSave = useCallback(async (editedImage) => {
    try {
      const blob = await fetch(editedImage).then(r => r.blob());
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const response = await uploadApi.uploadFile(file);
      await updateStudent(student.id, { photo: response.url });
      toast.success(t("students.photoUpdated", "Photo updated"));
    } catch (error) {
      showErrorToast(error, t("students.photoUpdateFailed", "Failed to update photo"));
    }
    setIsPhotoEditorOpen(false);
  }, [student?.id, updateStudent, t]);

  const handleRemovePhoto = useCallback(async () => {
    try {
      await updateStudent(student.id, { photo: null });
      toast.success(t("students.photoRemoved", "Photo removed"));
    } catch (error) {
      showErrorToast(error, t("students.photoRemoveFailed", "Failed to remove photo"));
    }
  }, [student?.id, updateStudent, t]);

  // ── Payment Handler ─────────────────────────────────────────────────
  const handleRecordPayment = useCallback(async (paymentForm) => {
    if (!studentFeeStructure || studentFeeStructure.totalBalance <= 0) {
      toast.error(t("students.noOutstandingBalance", "No outstanding balance to pay"));
      return;
    }

    const paymentAmount = parseInt(paymentForm.amount);
    const loadingToast = toast.loading(t("students.recordingPayment", "Recording payment..."));

    try {
      // Calculate fee head payments for distribution
      const feeHeadPayments = [];
      let remainingAmount = paymentAmount;

      if (studentFeeStructure?.feeHeads) {
        for (const feeHead of studentFeeStructure.feeHeads) {
          if (remainingAmount <= 0) break;
          const balance = feeHead.balanceAmount || 0;
          if (balance > 0) {
            const paymentForThisHead = Math.min(remainingAmount, balance);
            let feeHeadId;
            if (typeof feeHead.feeHeadId === "object" && feeHead.feeHeadId !== null) {
              feeHeadId = feeHead.feeHeadId._id || feeHead.feeHeadId.id;
            } else {
              feeHeadId = feeHead.feeHeadId;
            }
            feeHeadPayments.push({ feeHeadId, amount: paymentForThisHead });
            remainingAmount -= paymentForThisHead;
          }
        }
      }

      // 1. Update fee structure (primary operation)
      await studentFeesApi.recordPayment(studentId, {
        amount: paymentAmount,
        feeHeadPayments,
        academicYear: student?.academicYear || currentAcademicYear,
      });

      // 2. Try to create payment record (secondary, non-blocking)
      try {
        await feesApi.createPayment({
          studentId,
          studentName: student?.name || "",
          classId: student.classId,
          academicYear: student?.academicYear || currentAcademicYear,
          receiptNumber: `RCP-${Date.now()}`,
          paymentDate: paymentForm.date,
          amount: paymentAmount,
          paymentMode: paymentForm.paymentMode,
        });
      } catch (paymentRecordError) {
        console.warn("Payment record creation failed (non-critical):", paymentRecordError);
      }

      toast.success(t("students.paymentRecordedSuccess", "Payment recorded successfully"), { id: loadingToast });
      onPaymentClose();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        t("students.paymentRecordFailed", "Failed to record payment: {{error}}", {
          error: error.message || t("common.somethingWentWrong", "Something went wrong"),
        }),
        { id: loadingToast }
      );
      return;
    }

    // Refetch after successful payment — use allSettled so one failure doesn't block the others
    const results = await Promise.allSettled([refetchFeeStructure(), feeHistoryQuery.refetch(), refetchStudent()]);
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.studentFees.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.students.feeHistory(studentId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]);
    const failed = results.filter(r => r.status === "rejected");
    if (failed.length > 0) {
      console.warn("Some post-payment refetches failed:", failed.map(r => r.reason));
      toast.error(t("students.refetchFailed", "Payment saved but data may be stale. Please refresh the page."));
    }
  }, [studentId, student, studentFeeStructure, currentAcademicYear, refetchFeeStructure, feeHistoryQuery, refetchStudent, onPaymentClose, queryClient, t]);

  // ── Promote Handler ─────────────────────────────────────────────────
  const handlePromoteStudent = useCallback(async (nextClass) => {
    const isAlumni = nextClass === "Passed Out / Alumni";
    const nextClassObj = !isAlumni
      ? classesWithTeachers?.find((c) => `${c.name}-${c.section}` === nextClass)
      : null;
    if (!isAlumni && !nextClassObj) {
      toast.error(t("students.modals.promote.errorTargetClass", "Target class not found. Please update class manually."));
      throw new Error("Target class not found");
    }
    const loadingToast = toast.loading(
      t("students.modals.promote.promotingStudent", "Promoting {{name}}...", { name: student.name })
    );
    try {
      if (isAlumni) {
        await studentsApi.promote(student.id, { graduate: true });
      } else {
        await studentsApi.promote(student.id, { targetClassId: nextClassObj._id || nextClassObj.id });
      }
      toast.success(
        t("students.modals.promote.promotedTo", "{{name}} promoted to {{class}}", { name: student.name, class: nextClass }),
        { id: loadingToast }
      );
    } catch (e) {
      toast.error(
        t("students.modals.promote.promotionFailed", "Failed to promote student") +
          ": " +
          (e.message || t("common.somethingWentWrong", "Something went wrong")),
        { id: loadingToast }
      );
      throw e;
    }
  }, [student, classesWithTeachers, t]);

  // ── Reminder Handlers ───────────────────────────────────────────────
  const handleSendReminder = useCallback(() => {
    const defaultMessage =
      studentFeeStructure?.totalBalance > 0
        ? `Dear ${student.parentName || "Parent"}, fee payment of \u20B9${studentFeeStructure?.totalBalance?.toLocaleString()} is pending for ${student.name}. Please pay at your earliest convenience.`
        : `Dear ${student.parentName || "Parent"}, thank you for the fee payment for ${student.name}.`;
    setReminderMessage(defaultMessage);
    setIsReminderOpen(true);
  }, [student, studentFeeStructure]);

  const handleSendReminderMessage = useCallback(async () => {
    if (!reminderMessage.trim()) {
      toast.error(t("students.modals.sendFeeReminder.emptyMessage", "Please enter a reminder message"));
      return;
    }
    try {
      await studentsApi.sendReminder(studentId, {
        type: 'fee',
        message: reminderMessage,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        studentName: student.name,
      });
      toast.success(
        t("students.modals.sendFeeReminder.sendSuccess", "Reminder sent to {{name}}", {
          name: student.parentName || t("common.parent", "Parent"),
        })
      );
      setIsReminderOpen(false);
    } catch (error) {
      showErrorToast(error, t("students.modals.sendFeeReminder.sendFailed", "Failed to send reminder"));
    }
  }, [studentId, student, reminderMessage, t]);

  // ── Rating Handler ──────────────────────────────────────────────────
  const handleRatingChange = useCallback(async (ratings) => {
    try {
      const loadingToast = toast.loading(t("students.savingRatings", "Saving ratings..."));
      const ratingsWithTimestamp = {};
      Object.keys(ratings).forEach((key) => {
        ratingsWithTimestamp[key] = { ...ratings[key], lastUpdated: new Date().toISOString() };
      });
      await updateStudent(student.id, { ratings: ratingsWithTimestamp });
      toast.success(t("students.ratingsSaved", "Ratings saved successfully"), { id: loadingToast });
    } catch (error) {
      showErrorToast(error, t("students.ratingsSaveFailed", "Failed to save ratings"));
    }
  }, [student?.id, updateStudent, t]);

  const handleDownload = useCallback(() => window.print(), []);

  return {
    // Photo state & handlers
    fileInputRef,
    selectedImageForEdit,
    isPhotoEditorOpen,
    setIsPhotoEditorOpen,
    isCameraCaptureOpen,
    setIsCameraCaptureOpen,
    setSelectedImageForEdit,
    handleFileSelect,
    handlePhotoSave,
    handleRemovePhoto,
    // Payment
    handleRecordPayment,
    // Promotion
    handlePromoteStudent,
    // Reminder state & handlers
    reminderMessage,
    setReminderMessage,
    isReminderOpen,
    setIsReminderOpen,
    handleSendReminder,
    handleSendReminderMessage,
    // Rating
    handleRatingChange,
    // Misc
    handleDownload,
  };
}
