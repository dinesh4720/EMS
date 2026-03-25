import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * Feature gate wrapper — renders children when the school's subscription
 * has the required capability; otherwise renders a locked overlay.
 *
 * Usage:
 *   <FeatureGate capability="advancedReports">
 *     <AdvancedReportsPanel />
 *   </FeatureGate>
 *
 * @param {string}       capability  - Key from subscription.capabilities (e.g. "aiAssistant")
 * @param {ReactNode}    children    - The premium content to conditionally show
 * @param {ReactNode}    [fallback]  - Custom locked state (overrides default overlay)
 * @param {boolean}      [inline]    - Use a smaller inline badge instead of full overlay
 */
export default function FeatureGate({ capability, children, fallback, inline = false }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const capabilities = user?.subscription?.capabilities;

  // If subscription info hasn't loaded yet, render children optimistically
  if (!capabilities) return children;

  const isEnabled = Boolean(capabilities[capability]);

  if (isEnabled) return children;

  if (fallback) return fallback;

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400 cursor-not-allowed">
        <Lock size={12} />
        {t('billing.featureLocked', 'Upgrade required')}
      </span>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred preview of the locked content */}
      <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-[2px] rounded-xl">
        <div className="flex flex-col items-center gap-3 p-6 text-center max-w-xs">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
            <Lock size={22} className="text-primary-600" />
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-zinc-100">
            {t('billing.featureNotOnPlan', 'This feature is not included in your current plan.')}
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {t('billing.upgradeToUnlock', 'Upgrade your subscription to unlock this feature for your school.')}
          </p>
          <Button
            color="primary"
            size="sm"
            onPress={() => navigate('/settings?tab=subscription')}
          >
            {t('billing.viewPlans', 'View Plans')}
          </Button>
        </div>
      </div>
    </div>
  );
}
