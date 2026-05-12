import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Persistent banner shown when the browser loses internet connectivity.
 * Uses navigator.onLine + online/offline events via useOnlineStatus hook.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="sticky top-11 z-30 bg-fg text-bg px-4 py-2 flex items-center justify-center gap-2 text-sm shadow-md"
    >
      <WifiOff size={15} className="flex-shrink-0 text-danger-token" />
      <span>
        {t('common.offlineBanner', "You're offline. Some features may be unavailable until your connection is restored.")}
      </span>
    </div>
  );
}
