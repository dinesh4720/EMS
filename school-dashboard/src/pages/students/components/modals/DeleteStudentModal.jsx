import { useState } from "react";
import { useTranslation } from 'react-i18next';
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import toast from "react-hot-toast";

export default function DeleteStudentModal({ isOpen, onClose, student, onDeleteConfirmed }) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await onDeleteConfirmed();
      toast.success(result?.message || t('students.profile.overview.studentDeleted', '{{name}} has been deleted', { name: student?.name }));
      onClose();
    } catch {
      toast.error(t('students.profile.overview.deleteStudentFailed', 'Failed to delete student'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('students.profile.overview.deleteStudent', 'Delete Student')}
      message={`${t('students.profile.overview.deleteConfirmText', 'Are you sure you want to delete')} ${student?.name}?`}
      confirmText={t('students.profile.overview.deleteStudent', 'Delete Student')}
      cancelText={t('common.cancel', 'Cancel')}
      variant="danger"
      isLoading={isDeleting}
    >
      <p className="text-sm text-danger">
        {t('students.profile.overview.deleteWarningText', 'This will remove the student from active lists. Their records (attendance, fees, health, and parent-contact data) will be archived and can be restored later.')}
      </p>
    </ConfirmDialog>
  );
}
