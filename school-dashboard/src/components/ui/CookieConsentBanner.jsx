import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { safeGetItem, safeSetItem } from '../../utils/safeStorage';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'ems_cookie_consent';

/**
 * Read stored consent preferences.
 * Returns { necessary: true, timestamp } or null if not yet consented.
 */
export function getStoredConsent() {
  try {
    const raw = safeGetItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(consent) {
  try {
    safeSetItem(CONSENT_KEY, JSON.stringify({ ...consent, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

export default function CookieConsentBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    const consent = { necessary: true };
    saveConsent(consent);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consent }));
  };

  return (
    <div
      role="dialog"
      aria-label={t('aria.misc.cookieConsent')}
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-surface border-t border-border-token shadow-2xl"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-start gap-3">
          <Cookie size={20} className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-fg font-medium mb-1">
              We use cookies to keep you signed in
            </p>
            <p className="text-xs text-fg-muted">
              SchoolSync uses essential cookies for authentication and security. No tracking or marketing cookies are used.
              See our{' '}
              <Link to="/privacy" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 underline">
                Privacy Policy
              </Link>{' '}
              for details.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              Got it
            </button>

            <button
              onClick={handleAccept}
              className="p-1 hover:bg-surface-2 rounded transition-colors text-gray-400"
              aria-label={t('aria.buttons.dismiss')}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
