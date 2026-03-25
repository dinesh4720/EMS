import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react';
import { safeGetItem, safeSetItem } from '../../utils/safeStorage';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'ems_cookie_consent';

function getStoredConsent() {
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
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    const consent = { necessary: true, analytics: true, marketing: true };
    saveConsent(consent);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consent }));
  };

  const handleRejectNonEssential = () => {
    const consent = { necessary: true, analytics: false, marketing: false };
    saveConsent(consent);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consent }));
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: preferences }));
  };

  return (
    <div
      role="dialog"
      aria-label={t('aria.misc.cookieConsent')}
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 shadow-2xl"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-start gap-3">
          <Cookie size={20} className="text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 dark:text-zinc-200 font-medium mb-1">
              We use cookies to improve your experience
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              We use essential cookies to keep SchoolSync running and optional analytics cookies to understand how it's used.
              See our{' '}
              <Link to="/privacy" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 underline">
                Privacy Policy
              </Link>{' '}
              for details.
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                  <input type="checkbox" checked disabled className="accent-teal-600" />
                  <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium">
                    Necessary cookies <span className="text-gray-400">(always on)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                    className="accent-teal-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-zinc-300">
                    Analytics cookies <span className="text-gray-400">(Google Analytics, Mixpanel)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                    className="accent-teal-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-zinc-300">
                    Marketing cookies
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowDetails(v => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              Preferences
              {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showDetails ? (
              <button
                onClick={handleSavePreferences}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                Save
              </button>
            ) : (
              <>
                <button
                  onClick={handleRejectNonEssential}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Reject optional
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                >
                  Accept all
                </button>
              </>
            )}

            <button
              onClick={handleRejectNonEssential}
              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors text-gray-400"
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
