import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../../components/ui/Button";

/** Sticky bottom bar: save status message, keyboard hint, mark-all + save actions. */
export default function AttendanceSaveBar({
  saveMessage,
  markedCount,
  classStudentsLength,
  markAllPresent,
  isReadOnly,
  handleSaveAttendance,
  isSaving,
  isOnline,
}) {
  const { t } = useTranslation();
  return (
    <div className="attn-savebar">
      <div className="attn-savebar__left">
        {saveMessage ? (
          <span className={`attn-savebar__msg--${saveMessage.type === 'success' ? 'ok' : saveMessage.type === 'warning' ? 'warn' : 'danger'}`}>
            {saveMessage.text}
          </span>
        ) : (
          <span className="mono tnum">{markedCount}/{classStudentsLength} {t('attendance.marked', 'marked')}</span>
        )}
        <span className="attn-savebar__hint">
          <span className="kbd">P</span>{t('attendance.present', 'Present')}
          <span className="kbd">A</span>{t('attendance.absent', 'Absent')}
          <span className="kbd">L</span>{t('attendance.leave', 'Leave')}
        </span>
      </div>
      <div className="attn-savebar__right">
        <Button
          size="sm"
          variant="ghost"
          onClick={markAllPresent}
          disabled={isReadOnly}
        >
          {t('pages.markAllPresent')}
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={handleSaveAttendance}
          disabled={isReadOnly || isSaving}
          loading={isSaving}
          icon={!isOnline ? <WifiOff size={14} /> : null}
        >
          {isSaving
            ? t('common.saving', 'Saving...')
            : !isOnline
              ? t('attendance.saveOffline', 'Save Offline')
              : t('attendance.saveAttendance', 'Save Attendance')}
        </Button>
      </div>
    </div>
  );
}
