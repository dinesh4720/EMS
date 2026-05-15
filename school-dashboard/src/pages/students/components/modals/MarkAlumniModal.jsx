import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import logger from "../../../../utils/logger";

/**
 * MarkAlumniModal — alertdialog-style confirm for moving a student to alumni.
 * Uses the shared ConfirmDialog (frosted card, ESC closes, focus-trapped,
 * .btn--accent primary).
 */
export default function MarkAlumniModal({ isOpen, onClose, student, onMark }) {
  const { t } = useTranslation();
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAsAlumni = async () => {
    if (!student?.id) return;
    setIsMarking(true);
    const loadingToast = toast.loading(t("toast.loading.markingStudentAsAlumni"));
    try {
      const { request } = await import("../../../../services/api");
      await request(`/students/${student.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "alumni" }),
      });
      toast.success(`${student.name} marked as alumni`, { id: loadingToast });
      onMark?.();
      onClose();
    } catch (error) {
      logger.error("Error marking as alumni:", error);
      toast.error(
        "Failed to mark as alumni: " + (error.message || "Unknown error"),
        { id: loadingToast }
      );
      throw error;
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleMarkAsAlumni}
      title={t("pages.markAsAlumni", "Mark as Alumni")}
      message={t("students.modals.markAlumniConfirmText", {
        name: student?.name,
        defaultValue: `This will change ${student?.name}'s status to "Alumni". The student will no longer appear in active student lists.`,
      })}
      confirmText={t("pages.confirm", "Confirm")}
      cancelText={t("pages.cancel2", "Cancel")}
      variant="warning"
      isLoading={isMarking}
    />
  );
}
