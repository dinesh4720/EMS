import { useEffect, useState } from 'react';
import { CloudOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Shown when the WebSocket connection drops so the user knows displayed data
 * may be stale. Listens for the custom 'socket:disconnected' event emitted by
 * socketServiceEnhanced, and hides again when 'socket:connected' fires.
 */
export default function StaleDataBanner() {
  const { t } = useTranslation();
  const [socketDown, setSocketDown] = useState(false);

  useEffect(() => {
    const onDisconnect = () => setSocketDown(true);
    const onConnect = () => setSocketDown(false);

    window.addEventListener('socket:disconnected', onDisconnect);
    window.addEventListener('socket:connected', onConnect);

    return () => {
      window.removeEventListener('socket:disconnected', onDisconnect);
      window.removeEventListener('socket:connected', onConnect);
    };
  }, []);

  if (!socketDown) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-11 z-50 bg-warn-bg border-b border-warn/20 px-4 py-2 flex items-center gap-2 text-sm text-warn"
    >
      <CloudOff size={15} className="flex-shrink-0" />
      <span>
        {t('common.staleDataBanner', 'Real-time sync lost. Data shown may be out of date — refresh to get the latest.')}
      </span>
    </div>
  );
}
