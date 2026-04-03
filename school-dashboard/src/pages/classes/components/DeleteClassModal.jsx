import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";
import { useApp } from "../../../context/AppContext";

export function DeleteClassModal({ isOpen, onClose, classData }) {
  const { t } = useTranslation();
  const { deleteClass, refetch } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteClass = async () => {
    if (!classData) return;
    setIsDeleting(true);
    try {
      await deleteClass(classData.id);
      toast.success(t('toast.success.classDeleted', `Class ${classData.name}-${classData.section} deleted`));
      onClose();
      if (refetch) await refetch(true);
    } catch (error) {
      toast.error(error.message || t('toast.error.deleteClassFailed', 'Failed to delete class'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader className="text-danger">{t('classes.deleteClassTitle', 'Delete Class')}</ModalHeader>
        <ModalBody>
          <p className="text-default-600">
            {t('classes.deleteConfirmation', 'Are you sure you want to delete')} <strong>{classData?.name}-{classData?.section}</strong>?
          </p>
          <p className="text-sm text-danger-500 mt-2">
            {t('classes.deleteWarning', 'This will remove the class and may affect students, attendance records, timetables, and fee structures linked to this class. This action cannot be undone.')}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isDeleting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button color="danger" onPress={confirmDeleteClass} isLoading={isDeleting}>
            {t('classes.deleteClassTitle', 'Delete Class')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
