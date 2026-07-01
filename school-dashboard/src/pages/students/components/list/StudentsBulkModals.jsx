import { useState } from "react";
import {
    Button, Modal, Input, Textarea,
} from "../../../../components/ui";
import {
    AlertTriangle, ArrowRight, Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import TCGeneratorModal from "../../TCGeneratorModal";
import toast from "react-hot-toast";
import { trashApi } from "../../../../services/api";
import logger from '../../../../utils/logger';


/**
 * StudentsBulkModals
 *
 * Renders all bulk-action modals for the StudentsList page:
 *   - Bulk confirm modal  (deactivate / alumni / TC)
 *   - Promote modal
 *   - Bulk message modal
 *   - TC generator modal
 *   - Delete confirmation modal
 *   - Individual status-change confirmation modal
 *
 * Props are split into two groups — "open" booleans + "close" handlers,
 * and the state/action values each modal needs.
 */
export default function StudentsBulkModals({
    // ── Bulk confirm (deactivate / alumni / TC) ──────────────────────────
    isBulkActionOpen,
    onBulkActionClose,
    bulkAction,
    selectedCount,
    executeBulkAction,

    // ── Promote ──────────────────────────────────────────────────────────
    isPromoteOpen,
    onPromoteClose,
    promotionPreview,
    executePromotion,

    // ── Bulk message ─────────────────────────────────────────────────────
    isReminderOpen,
    onReminderClose,
    reminderTargetCount,
    reminderMessage,
    setReminderMessage,
    reminderTime,
    setReminderTime,
    executeSendReminders,

    // ── TC Generator ─────────────────────────────────────────────────────
    isTcModalOpen,
    onTcModalClose,
    tcStudents,
    setSelectedKeys,

    // ── Bulk Delete ──────────────────────────────────────────────────────
    isBulkDeleteOpen,
    onBulkDeleteClose,
    bulkDeleteStudents,
    executeBulkDelete,

    // ── Delete ───────────────────────────────────────────────────────────
    isDeleteOpen,
    onDeleteClose,
    studentToDelete,
    setStudentToDelete,
    isDeleting,
    setIsDeleting,
    deleteStudent,
    refreshStudentsList,

    // ── Individual status change ─────────────────────────────────────────
    isStatusChangeOpen,
    onStatusChangeClose,
    statusChangeData,
    setStatusChangeData,
    updateStudent,
}) {
    const { t } = useTranslation();
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [isSendingReminders, setIsSendingReminders] = useState(false);
    const [isStatusChanging, setIsStatusChanging] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    return (
        <>
            {/* ── Bulk Action Confirm Modal ─────────────────────────────────── */}
            <Modal isOpen={isBulkActionOpen} onClose={onBulkActionClose} aria-labelledby="bulk-action-title">
                <Modal.Header id="bulk-action-title" className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent-bg)] rounded-lg">
                            <AlertTriangle size={24} className="text-[var(--accent)]" aria-hidden />
                        </div>
                        <span>{t("pages.confirmAction1")}</span>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-fg-subtle">
                        Are you sure you want to{" "}
                        <span className="font-semibold">
                            {bulkAction === "tc"
                                ? "generate TC for"
                                : bulkAction === "deactivate"
                                ? "mark as inactive"
                                : "mark as alumni"}
                        </span>{" "}
                        <span className="font-semibold text-fg">
                            {selectedCount}
                        </span>{" "}
                        student(s)?
                    </p>
                    {bulkAction === "deactivate" && (
                        <p className="text-sm text-fg-muted mt-2">
                            These students will no longer appear in active lists and
                            reports.
                        </p>
                    )}
                    {bulkAction === "alumni" && (
                        <p className="text-sm text-fg-muted mt-2">
                            These students will be moved to the alumni list.
                        </p>
                    )}
                    {isBulkSubmitting && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-fg-muted" aria-live="polite">
                            <div className="w-4 h-4 border-2 border-border-token border-t-[var(--accent)] rounded-full animate-spin shrink-0" aria-hidden />
                            Processing {selectedCount} student{selectedCount !== 1 ? "s" : ""}…
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" size="sm" onClick={onBulkActionClose}>
                        {t("pages.cancel2")}
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        loading={isBulkSubmitting}
                        disabled={isBulkSubmitting}
                        onClick={async () => {
                            setIsBulkSubmitting(true);
                            try {
                                await executeBulkAction();
                                onBulkActionClose();
                            } catch (error) {
                                logger.error("Bulk action error:", error);
                                toast.error(error.message || "Bulk action failed");
                            } finally {
                                setIsBulkSubmitting(false);
                            }
                        }}
                    >
                        {t("pages.confirm")}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Promote Modal ─────────────────────────────────────────────── */}
            <Modal isOpen={isPromoteOpen} onClose={onPromoteClose} aria-labelledby="promote-title">
                <Modal.Header id="promote-title">{t("pages.promoteStudents")}</Modal.Header>
                <Modal.Body>
                    <p className="mb-4">
                        Review the promotion details for{" "}
                        <b>{promotionPreview.length}</b> student(s):
                    </p>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {promotionPreview.map((student, index) => (
                            <div
                                key={student.id || index}
                                className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-divider"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-fg">
                                        {student.name}
                                    </p>
                                    <p className="text-sm text-fg-muted">
                                        Current: {student.class}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ArrowRight size={16} className="text-fg-faint" aria-hidden />
                                    <div className="text-right">
                                        <p className="font-semibold text-[var(--ok)]">
                                            {student.nextClass || "Unable to calculate"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {promotionPreview.some((s) => !s.nextClass) && (
                        <div className="mt-4 p-3 bg-[var(--warn-bg)] border border-[var(--warn)]/20 rounded-lg">
                            <p className="text-sm text-[var(--warn)]">
                                <AlertTriangle size={14} className="inline mr-1" aria-hidden />
                                Some students cannot be promoted automatically. Please check
                                the list above.
                            </p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" size="sm" onClick={onPromoteClose}>
                        {t("pages.cancel2")}
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        loading={isPromoting}
                        disabled={isPromoting}
                        onClick={async () => {
                            setIsPromoting(true);
                            try {
                                await executePromotion();
                                onPromoteClose();
                            } catch (error) {
                                logger.error("Promotion error:", error);
                                toast.error(error.message || "Promotion failed");
                            } finally {
                                setIsPromoting(false);
                            }
                        }}
                    >
                        Promote{" "}
                        {promotionPreview.filter((s) => s.nextClass).length} Student
                        {promotionPreview.filter((s) => s.nextClass).length !== 1
                            ? "s"
                            : ""}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Bulk Message Modal ────────────────────────────────────────── */}
            <Modal isOpen={isReminderOpen} onClose={onReminderClose} aria-labelledby="reminder-title">
                <Modal.Header id="reminder-title">{t("pages.sendFeeReminderToParents", "Send Fee Reminder to Parents")}</Modal.Header>
                <Modal.Body>
                    <p className="text-fg-muted text-sm mb-2">
                        This will send a fee reminder to the parents of{" "}
                        <b>{reminderTargetCount}</b> students from the current list.
                    </p>
                    <div className="space-y-4">
                        <Textarea
                            label={t("pages.message1")}
                            placeholder={t("pages.enterMessageForParents")}
                            value={reminderMessage}
                            onChange={(e) => setReminderMessage(e.target.value)}
                            rows={3}
                        />
                        <Input
                            type="datetime-local"
                            label={t("pages.scheduleDeliveryTime")}
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" size="sm" onClick={onReminderClose}>
                        {t("pages.cancel2")}
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        loading={isSendingReminders}
                        disabled={!reminderMessage || !reminderTime || isSendingReminders}
                        onClick={async () => {
                            setIsSendingReminders(true);
                            try {
                                await executeSendReminders();
                                onReminderClose();
                            } catch (error) {
                                logger.error("Send reminders error:", error);
                                toast.error(error.message || "Failed to send reminders");
                            } finally {
                                setIsSendingReminders(false);
                            }
                        }}
                    >
                        Send Reminder
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── TC Generator Modal ────────────────────────────────────────── */}
            <TCGeneratorModal
                isOpen={isTcModalOpen}
                onClose={() => {
                    onTcModalClose();
                    setSelectedKeys(new Set([]));
                }}
                students={tcStudents}
            />

            {/* ── Bulk Delete Confirmation Modal ────────────────────────────── */}
            <Modal isOpen={isBulkDeleteOpen} onClose={onBulkDeleteClose} size="md" aria-labelledby="bulk-delete-title">
                <Modal.Header id="bulk-delete-title" className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--danger-bg)] rounded-lg">
                            <AlertTriangle size={24} className="text-[var(--danger)]" aria-hidden />
                        </div>
                        <span>Delete {bulkDeleteStudents.length} Student{bulkDeleteStudents.length !== 1 ? "s" : ""}?</span>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-sm text-[var(--danger)] font-medium mb-2">
                        This permanently removes all selected student profiles and their linked records (attendance, fees, health, parent-contact data).
                    </p>
                    <p className="text-sm text-fg-subtle mb-2">
                        The following students will be deleted:
                    </p>
                    <div className="max-h-52 overflow-y-auto rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-bg)]/40 divide-y divide-[var(--danger)]/10">
                        {bulkDeleteStudents.map((student) => (
                            <div key={student.id} className="flex items-center gap-2 px-3 py-2">
                                <Trash2 size={12} className="text-[var(--danger)] shrink-0" aria-hidden />
                                <span className="text-sm font-medium text-fg">{student.name}</span>
                                {student.class && (
                                    <span className="text-xs text-fg-muted ml-auto">{student.class}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" size="sm" onClick={onBulkDeleteClose} disabled={isBulkDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        loading={isBulkDeleting}
                        disabled={isBulkDeleting}
                        icon={!isBulkDeleting && <Trash2 size={16} aria-hidden />}
                        onClick={async () => {
                            setIsBulkDeleting(true);
                            try {
                                await executeBulkDelete();
                            } catch (error) {
                                logger.error("Bulk delete error:", error);
                                toast.error(error.message || "Failed to delete students");
                            } finally {
                                setIsBulkDeleting(false);
                            }
                        }}
                    >
                        Delete {bulkDeleteStudents.length} Student{bulkDeleteStudents.length !== 1 ? "s" : ""}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} aria-labelledby="delete-title">
                <Modal.Header id="delete-title" className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--danger-bg)] rounded-lg">
                            <AlertTriangle size={24} className="text-[var(--danger)]" aria-hidden />
                        </div>
                        <span>{t("pages.deleteStudent1")}</span>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-fg-subtle">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-fg">
                            {studentToDelete?.name}
                        </span>
                        ?
                    </p>
                    <p className="text-sm text-[var(--danger)] mt-2">
                        This permanently removes the student profile and linked
                        records, including attendance, fee, health, and
                        parent-contact data.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" size="sm" onClick={onDeleteClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        loading={isDeleting}
                        onClick={async () => {
                            setIsDeleting(true);
                            try {
                                const result = await deleteStudent(studentToDelete.id);
                                await refreshStudentsList();
                                const deletedName = studentToDelete.name;
                                const trashItemId = result?.trashItemId;
                                onDeleteClose();
                                setStudentToDelete(null);
                                toast(
                                    (toastObj) => (
                                        <div className="flex items-center gap-3">
                                            <span>{deletedName} {t('common.deleted', 'deleted')}</span>
                                            {trashItemId && (
                                                <button
                                                    className="font-semibold text-[var(--accent)] underline whitespace-nowrap"
                                                    onClick={async () => {
                                                        toast.dismiss(toastObj.id);
                                                        try {
                                                            await trashApi.restore(trashItemId);
                                                            await refreshStudentsList();
                                                            toast.success(t('toast.success.studentRestored', { name: deletedName, defaultValue: `${deletedName} restored` }));
                                                        } catch {
                                                            toast.error(t('toast.error.failedToRestore', 'Failed to restore student'));
                                                        }
                                                    }}
                                                >
                                                    {t('common.undo', 'Undo')}
                                                </button>
                                            )}
                                        </div>
                                    ),
                                    { duration: 5000, icon: '🗑️' }
                                );
                            } catch (error) {
                                logger.error("Delete error:", error);
                                toast.error(
                                    error.message || "Failed to delete student"
                                );
                            } finally {
                                setIsDeleting(false);
                            }
                        }}
                        icon={<Trash2 size={16} aria-hidden />}
                    >
                        Delete Student
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Individual Status-Change Confirmation Modal ───────────────── */}
            <Modal isOpen={isStatusChangeOpen} onClose={onStatusChangeClose} aria-labelledby="status-change-title">
                <Modal.Header id="status-change-title" className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent-bg)] rounded-lg">
                            <AlertTriangle size={24} className="text-[var(--accent)]" aria-hidden />
                        </div>
                        <span>{statusChangeData.action}</span>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-fg-subtle">
                        Are you sure you want to mark{" "}
                        <span className="font-semibold text-fg">
                            {statusChangeData.student?.name}
                        </span>{" "}
                        as{" "}
                        <span className="font-semibold capitalize">
                            {statusChangeData.newStatus}
                        </span>
                        ?
                    </p>
                    {statusChangeData.newStatus === "inactive" && (
                        <p className="text-sm text-fg-muted mt-2">
                            The student will no longer appear in active lists and
                            reports.
                        </p>
                    )}
                    {statusChangeData.newStatus === "alumni" && (
                        <p className="text-sm text-fg-muted mt-2">
                            The student will be moved to the alumni list.
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="ghost" size="sm" onClick={onStatusChangeClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        loading={isStatusChanging}
                        disabled={isStatusChanging}
                        onClick={async () => {
                            setIsStatusChanging(true);
                            try {
                                await updateStudent(statusChangeData.student.id, {
                                    status: statusChangeData.newStatus,
                                });
                                await refreshStudentsList();
                                toast.success(
                                    `${statusChangeData.student.name} marked as ${statusChangeData.newStatus}`
                                );
                                onStatusChangeClose();
                                setStatusChangeData({
                                    student: null,
                                    newStatus: "",
                                    action: "",
                                });
                            } catch (error) {
                                toast.error(t("toast.error.failedToUpdateStatus"));
                            } finally {
                                setIsStatusChanging(false);
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
