import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

/**
 * MarkAlumniModal - Modal for marking a student as alumni
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - student: object - The student to mark as alumni
 * - onMark: function - Called after successful mark
 */
export default function MarkAlumniModal({ isOpen, onClose, student, onMark }) {
  const { t } = useTranslation();
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAsAlumni = async () => {
    setIsMarking(true);
    const loadingToast = toast.loading(t('toast.loading.markingStudentAsAlumni'));

    try {
      const { request } = await import("../../../../services/api");

      await request(`/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: "alumni" })
      });

      toast.success(`${student.name} marked as alumni`, { id: loadingToast });

      if (onMark) {
        onMark();
      }
      onClose();
    } catch (error) {
      console.error("Error marking as alumni:", error);
      toast.error("Failed to mark as alumni: " + (error.message || "Unknown error"), { id: loadingToast });
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
      <ModalHeader>{t('pages.markAsAlumni')}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-gray-600 dark:text-zinc-400 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-zinc-100">{t('pages.confirmAction1')}</p>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                  {t('students.modals.markAlumniConfirmText', { name: student?.name, defaultValue: `This will change ${student?.name}'s status to "Alumni". The student will no longer appear in active student lists.` })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="bordered" className="border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300" onPress={onClose}>{t('pages.cancel2')}</Button>
        <Button className="bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900" onPress={handleMarkAsAlumni} isLoading={isMarking}>{t('pages.confirm')}</Button>
      </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
