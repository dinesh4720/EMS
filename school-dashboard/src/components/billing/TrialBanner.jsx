import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Clock, Sparkles, X } from "lucide-react";
import { isSuperAdminRole } from "../../utils/roleUtils";

/**
 * Persistent banner shown when the school is on a trial plan.
 * Displays a countdown (days remaining) with urgency-based styling
 * and a CTA to upgrade. Also shows a grace-period warning for past_due.
 */
export default function TrialBanner() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const sub = user?.subscription;

  const { daysLeft, isGracePeriod } = useMemo(() => {
    if (!sub) return { daysLeft: null, isGracePeriod: false };

    // Grace period warning (past_due status)
    if (sub.status === "past_due" && sub.gracePeriodEndsAt) {
      const ms = new Date(sub.gracePeriodEndsAt) - Date.now();
      return { daysLeft: Math.max(0, Math.ceil(ms / 86_400_000)), isGracePeriod: true };
    }

    // Trial countdown
    if (sub.inTrial && sub.trialEndsAt) {
      const ms = new Date(sub.trialEndsAt) - Date.now();
      return { daysLeft: Math.max(0, Math.ceil(ms / 86_400_000)), isGracePeriod: false };
    }

    return { daysLeft: null, isGracePeriod: false };
  }, [sub]);

  // Don't render for super admins, non-trial/non-grace, or dismissed
  if (dismissed || daysLeft === null || isSuperAdminRole(user?.role)) return null;

  // Urgency levels: critical (<=3d), warning (<=7d), info (>7d)
  const urgency = daysLeft <= 3 ? "critical" : daysLeft <= 7 ? "warning" : "info";

  const styles = {
    critical: {
      bg: "bg-danger-bg border-danger-token/20",
      text: "text-danger-token",
      icon: "text-danger-token",
      btn: "bg-danger-token hover:bg-danger-token/90 text-white",
      dismiss: "hover:bg-danger-bg text-danger-token",
    },
    warning: {
      bg: "bg-warn-bg border-warn/20",
      text: "text-warn",
      icon: "text-warn",
      btn: "bg-warn hover:bg-warn/90 text-white",
      dismiss: "hover:bg-warn-bg text-warn",
    },
    // info trial state — bg/text are status-info, but the CTA is the brand
    // accent because "Upgrade" is a primary brand action, not informational.
    info: {
      bg: "bg-info-bg border-info-token/20",
      text: "text-info-token",
      icon: "text-info-token",
      btn: "bg-accent hover:bg-accent-hover text-white",
      dismiss: "hover:bg-info-bg text-info-token",
    },
  };

  const s = styles[urgency];

  const message = isGracePeriod
    ? t("billing.gracePeriodBanner", {
        days: daysLeft,
        defaultValue:
          daysLeft === 0
            ? "Your grace period ends today. Upgrade now to avoid service interruption."
            : daysLeft === 1
              ? "Your grace period ends tomorrow. Upgrade now to keep your account active."
              : "Your payment is overdue. You have {{days}} days left before your account is restricted.",
      })
    : t("billing.trialBanner", {
        days: daysLeft,
        plan: sub.planName || "Trial",
        defaultValue:
          daysLeft === 0
            ? "Your free trial ends today! Upgrade now to keep all features."
            : daysLeft === 1
              ? "Your free trial ends tomorrow! Upgrade now to keep all features."
              : "{{days}} days left in your free trial. Upgrade to keep all features.",
      });

  return (
    <div className={`${s.bg} border-b px-4 py-2 flex items-center justify-between sticky top-11 z-20`}>
      <div className="flex items-center gap-2 min-w-0">
        <Clock size={16} className={`${s.icon} flex-shrink-0`} />
        <span className={`text-sm ${s.text} truncate`}>{message}</span>
        <button
          onClick={() => navigate("/settings?tab=subscription")}
          className={`${s.btn} flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors flex-shrink-0`}
        >
          <Sparkles size={12} />
          {t("billing.upgradeNow", "Upgrade now")}
        </button>
      </div>
      {/* Only allow dismissal for info-level (>7 days); critical/warning stay persistent */}
      {urgency === "info" && (
        <button
          onClick={() => setDismissed(true)}
          className={`p-1 ${s.dismiss} rounded-full transition-colors flex-shrink-0`}
          aria-label={t("common.dismissAlert", "Dismiss alert")}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
