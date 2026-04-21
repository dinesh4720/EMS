import { useState } from "react";
import { useTranslation } from 'react-i18next';
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export function DeleteClassModal({ isOpen, onClose, classData }) {
  const { t } = useTranslation();
  const { deleteClass, refetch } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  const enrolledCount = classData?.studentCount || classData?.strength || 0;

  const handleConfirm = async () => {
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
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('classes.deleteClassTitle', 'Delete Class')}
      message={`${t('classes.deleteConfirmation', 'Are you sure you want to delete')} ${classData?.name}-${classData?.section}?`}
      confirmText={t('classes.deleteClassTitle', 'Delete Class')}
      cancelText={t('common.cancel', 'Cancel')}
      variant="danger"
      isLoading={isDeleting}
    >
      {enrolledCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-warning-50 border border-warning-200 px-3 py-2 mb-3">
          <AlertTriangle size={16} className="text-warning-600 mt-0.5 shrink-0" />
          <p className="text-sm text-warning-700 font-medium">
            {t(
              'classes.deleteEnrolledWarning',
              '{{count}} enrolled student(s) will have their class assignment severed. They will no longer be linked to any class.',
              { count: enrolledCount }
            )}
          </p>
        </div>
      )}
      <p className="text-sm text-danger-500">
        {t('classes.deleteWarning', 'This will remove the class and may affect students, attendance records, timetables, and fee structures linked to this class. This action cannot be undone.')}
      </p>
    </ConfirmDialog>
  );
}
