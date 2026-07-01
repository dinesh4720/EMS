import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "../../../../components/ui/Alert";

/** Lock / invalid-date / offline / pending-sync banners shown above the grid. */
export default function AttendanceAlerts({
  isLocked,
  invalidDateReason,
  isOnline,
  offlinePendingCount,
  offlineSyncing,
  syncNow,
}) {
  const { t } = useTranslation();
  return (
    <>
      {isLocked && (
        <Alert variant="warning" className="mx-6">
          {t('pages.attendanceIsLockedUnlockInSettingsToMakeChanges')}
        </Alert>
      )}
      {invalidDateReason && !isLocked && (
        <Alert variant="danger" className="mx-6">{invalidDateReason}</Alert>
      )}
      {!isOnline && (
        <Alert variant="warning" className="mx-6">
          <span className="flex items-center gap-2">
            <WifiOff size={16} />
            {t('attendance.offlineMode', 'You are offline. Attendance will be saved locally and synced automatically when your connection is restored.')}
          </span>
        </Alert>
      )}
      {offlinePendingCount > 0 && isOnline && (
        <Alert variant="info" className="mx-6">
          <span className="flex items-center gap-2">
            <RefreshCw size={16} className={offlineSyncing ? 'animate-spin' : ''} />
            {offlineSyncing
              ? t('attendance.syncingOffline', 'Syncing {{count}} offline attendance record(s)...', { count: offlinePendingCount })
              : t('attendance.pendingSync', '{{count}} attendance record(s) saved offline. Click to retry.', { count: offlinePendingCount })}
            {!offlineSyncing && (
              <button
                type="button"
                className="underline ml-2"
                onClick={syncNow}
              >
                {t('common.syncNow', 'Sync now')}
              </button>
            )}
          </span>
        </Alert>
      )}
    </>
  );
}
