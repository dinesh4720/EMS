import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";

/** Mark-all-present and overwrite confirmation modals. */
export default function AttendanceDialogs({
  isMarkAllOpen,
  onMarkAllClose,
  handleConfirmMarkAllPresent,
  classStudentsLength,
  isOverwriteOpen,
  onOverwriteClose,
  handleConfirmOverwrite,
  date,
}) {
  const { t } = useTranslation();
  return (
    <>
      <Modal
        isOpen={isMarkAllOpen}
        onClose={onMarkAllClose}
        size="sm"
        title={<span className="flex items-center gap-2"><AlertTriangle size={18} className="text-[var(--warn)]" />{t('attendance.markAllPresentTitle', 'Mark All Present?')}</span>}
        footer={<>
          <Button size="sm" variant="secondary" onClick={onMarkAllClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button size="sm" variant="primary" onClick={handleConfirmMarkAllPresent}>{t('attendance.markAllPresentConfirm', 'Mark All Present')}</Button>
        </>}
      >
        <p className="text-sm text-[var(--fg-muted)]">
          {t('attendance.markAllPresentMessage', 'This will mark all {{count}} students as present, overwriting any statuses already set individually.', { count: classStudentsLength })}
        </p>
      </Modal>

      <Modal
        isOpen={isOverwriteOpen}
        onClose={onOverwriteClose}
        size="sm"
        title={<span className="flex items-center gap-2"><AlertTriangle size={18} className="text-[var(--warn)]" />{t('attendance.overwriteTitle', 'Attendance Already Saved')}</span>}
        footer={<>
          <Button size="sm" variant="secondary" onClick={onOverwriteClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button size="sm" variant="danger" onClick={handleConfirmOverwrite}>{t('attendance.overwriteConfirm', 'Overwrite')}</Button>
        </>}
      >
        <p className="text-sm text-[var(--fg-muted)]">
          {t('attendance.overwriteMessage', 'Attendance for this class on {{date}} has already been saved. Saving again will overwrite the existing records.', { date })}
        </p>
      </Modal>
    </>
  );
}
