import { useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button
} from "@heroui/react";
import { AlertTriangle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DeleteStudentModal({ isOpen, onClose, student, onDeleteConfirmed }) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await onDeleteConfirmed();
      toast.success(result?.message || t('students.profile.overview.permanentlyDeleted', '{{name}} permanently deleted', { name: student?.name }));
      onClose();
    } catch (error) {
      toast.error(t('students.profile.overview.deleteStudentFailed', 'Failed to delete student'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger-50 rounded-lg">
                  <AlertTriangle size={24} className="text-danger" />
                </div>
                <span>{t('students.profile.overview.deleteStudent', 'Delete Student')}</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-default-600">
                {t('students.profile.overview.deleteConfirmText', 'Are you sure you want to delete')} <span className="font-semibold text-default-900">{student?.name}</span>?
              </p>
              <p className="text-sm text-danger mt-2">
                {t('students.profile.overview.deleteWarningText', 'This permanently removes the student profile and linked records, including attendance, fee, health, and parent-contact data.')}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onCloseModal}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                color="danger"
                isLoading={isDeleting}
                onPress={handleDelete}
                startContent={<Trash2 size={16} />}
              >
                {t('students.profile.overview.deleteStudent', 'Delete Student')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
