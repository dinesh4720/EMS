import { useState } from "react";
import {
    Button, Textarea, Input,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
} from "@heroui/react";
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
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader id="bulk-action-title" className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 rounded-lg">
                                        <AlertTriangle size={24} className="text-primary" aria-hidden />
                                    </div>
                                    <span>{t("pages.confirmAction1")}</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    Are you sure you want to{" "}
                                    <span className="font-semibold">
                                        {bulkAction === "tc"
                                            ? "generate TC for"
                                            : bulkAction === "deactivate"
                                            ? "mark as inactive"
                                            : "mark as alumni"}
                                    </span>{" "}
                                    <span className="font-semibold text-default-900">
                                        {selectedCount}
                                    </span>{" "}
                                    student(s)?
                                </p>
                                {bulkAction === "deactivate" && (
                                    <p className="text-sm text-default-500 mt-2">
                                        These students will no longer appear in active lists and
                                        reports.
                                    </p>
                                )}
                                {bulkAction === "alumni" && (
                                    <p className="text-sm text-default-500 mt-2">
                                        These students will be moved to the alumni list.
                                    </p>
                                )}
                                {isBulkSubmitting && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-default-500" aria-live="polite">
                                        <div className="w-4 h-4 border-2 border-default-300 border-t-primary rounded-full animate-spin shrink-0" aria-hidden />
                                        Processing {selectedCount} student{selectedCount !== 1 ? "s" : ""}…
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    {t("pages.cancel2")}
                                </Button>
                                <Button
                                    color="primary"
                                    isLoading={isBulkSubmitting}
                                    isDisabled={isBulkSubmitting}
                                    onPress={async () => {
                                        setIsBulkSubmitting(true);
                                        try {
                                            await executeBulkAction();
                                            onClose();
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
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* ── Promote Modal ─────────────────────────────────────────────── */}
            <Modal isOpen={isPromoteOpen} onClose={onPromoteClose} aria-labelledby="promote-title">
                <ModalContent>
                    <ModalHeader id="promote-title">{t("pages.promoteStudents")}</ModalHeader>
                    <ModalBody>
                        <p className="mb-4">
                            Review the promotion details for{" "}
                            <b>{promotionPreview.length}</b> student(s):
                        </p>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {promotionPreview.map((student, index) => (
                                <div
                                    key={student.id || index}
                                    className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-default-900">
                                            {student.name}
                                        </p>
                                        <p className="text-sm text-default-500">
                                            Current: {student.class}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight size={16} className="text-default-400" aria-hidden />
                                        <div className="text-right">
                                            <p className="font-semibold text-success">
                                                {student.nextClass || "Unable to calculate"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {promotionPreview.some((s) => !s.nextClass) && (
                            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                                <p className="text-sm text-warning-700">
                                    <AlertTriangle size={14} className="inline mr-1" aria-hidden />
                                    Some students cannot be promoted automatically. Please check
                                    the list above.
                                </p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onPromoteClose}>
                            {t("pages.cancel2")}
                        </Button>
                        <Button
                            color="primary"
                            isLoading={isPromoting}
                            isDisabled={isPromoting}
                            onPress={async () => {
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
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ── Bulk Message Modal ────────────────────────────────────────── */}
            <Modal isOpen={isReminderOpen} onClose={onReminderClose} aria-labelledby="reminder-title">
                <ModalContent>
                    <ModalHeader id="reminder-title">{t("pages.sendBulkMessageToParents")}</ModalHeader>
                    <ModalBody>
                        <p className="text-default-500 text-sm mb-2">
                            This will send a notification to the parents of{" "}
                            <b>{reminderTargetCount}</b> students from the current list.
                        </p>
                        <div className="space-y-4">
                            <Textarea
                                label={t("pages.message1")}
                                placeholder={t("pages.enterMessageForParents")}
                                value={reminderMessage}
                                onValueChange={setReminderMessage}
                                minRows={3}
                            />
                            <Input
                                type="datetime-local"
                                label={t("pages.scheduleDeliveryTime")}
                                value={reminderTime}
                                onValueChange={setReminderTime}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onReminderClose}>
                            {t("pages.cancel2")}
                        </Button>
                        <Button
                            color="primary"
                            isLoading={isSendingReminders}
                            isDisabled={!reminderMessage || !reminderTime || isSendingReminders}
                            onPress={async () => {
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
                            Schedule Message
                        </Button>
                    </ModalFooter>
                </ModalContent>
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
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader id="bulk-delete-title" className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-danger-50 rounded-lg">
                                        <AlertTriangle size={24} className="text-danger" aria-hidden />
                                    </div>
                                    <span>Delete {bulkDeleteStudents.length} Student{bulkDeleteStudents.length !== 1 ? "s" : ""}?</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-danger font-medium mb-2">
                                    This permanently removes all selected student profiles and their linked records (attendance, fees, health, parent-contact data).
                                </p>
                                <p className="text-sm text-default-600 mb-2">
                                    The following students will be deleted:
                                </p>
                                <div className="max-h-52 overflow-y-auto rounded-lg border border-danger-100 bg-danger-50/40 divide-y divide-danger-100">
                                    {bulkDeleteStudents.map((student) => (
                                        <div key={student.id} className="flex items-center gap-2 px-3 py-2">
                                            <Trash2 size={12} className="text-danger shrink-0" aria-hidden />
                                            <span className="text-sm font-medium text-default-900">{student.name}</span>
                                            {student.class && (
                                                <span className="text-xs text-default-500 ml-auto">{student.class}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose} isDisabled={isBulkDeleting}>
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    isLoading={isBulkDeleting}
                                    isDisabled={isBulkDeleting}
                                    startContent={!isBulkDeleting && <Trash2 size={16} aria-hidden />}
                                    onPress={async () => {
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
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} aria-labelledby="delete-title">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader id="delete-title" className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-danger-50 rounded-lg">
                                        <AlertTriangle size={24} className="text-danger" aria-hidden />
                                    </div>
                                    <span>{t("pages.deleteStudent1")}</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold text-default-900">
                                        {studentToDelete?.name}
                                    </span>
                                    ?
                                </p>
                                <p className="text-sm text-danger mt-2">
                                    This permanently removes the student profile and linked
                                    records, including attendance, fee, health, and
                                    parent-contact data.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    isLoading={isDeleting}
                                    onPress={async () => {
                                        setIsDeleting(true);
                                        try {
                                            const result = await deleteStudent(studentToDelete.id);
                                            await refreshStudentsList();
                                            const deletedName = studentToDelete.name;
                                            const trashItemId = result?.trashItemId;
                                            onClose();
                                            setStudentToDelete(null);
                                            toast(
                                                (toastObj) => (
                                                    <div className="flex items-center gap-3">
                                                        <span>{deletedName} {t('common.deleted', 'deleted')}</span>
                                                        {trashItemId && (
                                                            <button
                                                                className="font-semibold text-primary underline whitespace-nowrap"
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
                                    startContent={<Trash2 size={16} aria-hidden />}
                                >
                                    Delete Student
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* ── Individual Status-Change Confirmation Modal ───────────────── */}
            <Modal isOpen={isStatusChangeOpen} onClose={onStatusChangeClose} aria-labelledby="status-change-title">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader id="status-change-title" className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 rounded-lg">
                                        <AlertTriangle size={24} className="text-primary" aria-hidden />
                                    </div>
                                    <span>{statusChangeData.action}</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    Are you sure you want to mark{" "}
                                    <span className="font-semibold text-default-900">
                                        {statusChangeData.student?.name}
                                    </span>{" "}
                                    as{" "}
                                    <span className="font-semibold capitalize">
                                        {statusChangeData.newStatus}
                                    </span>
                                    ?
                                </p>
                                {statusChangeData.newStatus === "inactive" && (
                                    <p className="text-sm text-default-500 mt-2">
                                        The student will no longer appear in active lists and
                                        reports.
                                    </p>
                                )}
                                {statusChangeData.newStatus === "alumni" && (
                                    <p className="text-sm text-default-500 mt-2">
                                        The student will be moved to the alumni list.
                                    </p>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    isLoading={isStatusChanging}
                                    isDisabled={isStatusChanging}
                                    onPress={async () => {
                                        setIsStatusChanging(true);
                                        try {
                                            await updateStudent(statusChangeData.student.id, {
                                                status: statusChangeData.newStatus,
                                            });
                                            await refreshStudentsList();
                                            toast.success(
                                                `${statusChangeData.student.name} marked as ${statusChangeData.newStatus}`
                                            );
                                            onClose();
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
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
