import { Check, IndianRupee, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "../../i18n/index";
import { Button, Chip } from "../ui";

const CAPABILITY_LABELS = {
  parentApp: "Parent Mobile App",
  advancedReports: "Advanced Reports & Analytics",
  aiAssistant: "AI Assistant",
  customBranding: "Custom Branding",
  prioritySupport: "Priority Support",
  apiAccess: "API Access",
  multiBranch: "Multi-Branch Management",
};

const LIMIT_LABELS = {
  students: "Students",
  staff: "Staff Members",
  storageMb: "Storage",
  smsCredits: "SMS Credits",
  apiCallsPerMonth: "API Calls / Month",
};

function formatLimit(key, value) {
  if (value === null || value === undefined) return "Unlimited";
  if (key === "storageMb") return `${(value / 1024).toFixed(0)} GB`;
  return value.toLocaleString(getDateLocale());
}

const HIGHLIGHT_CELL = "bg-surface-2";

export default function PlanComparisonMatrix({
  plans = [],
  currentPlanKey,
  billingCycle = "monthly",
  checkoutLoading,
  onCheckout,
}) {
  const { t } = useTranslation();

  if (!plans.length) return null;

  const allCapabilityKeys = Object.keys(plans[0]?.capabilities || {});
  const allLimitKeys = Object.keys(LIMIT_LABELS);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left py-4 px-4 font-medium text-fg-muted w-1/4 min-w-[180px]">
              {t("settings.subscription.comparison.features", "Features")}
            </th>
            {plans.map((plan) => {
              const isCurrent = currentPlanKey === plan.key;
              return (
                <th
                  key={plan.key}
                  className={`text-center py-4 px-4 min-w-[160px] ${
                    isCurrent ? `${HIGHLIGHT_CELL} rounded-t-xl` : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold text-fg">
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <Chip size="sm" color="primary">
                        {t("settings.subscription.currentPlan", "Current plan")}
                      </Chip>
                    )}
                    <div className="flex items-center gap-0.5 mt-1 text-lg font-bold text-fg tabular-nums">
                      <IndianRupee size={16} aria-hidden="true" />
                      {plan.price.toLocaleString(getDateLocale())}
                    </div>
                    <span className="text-xs text-fg-muted">
                      {plan.price === 0
                        ? t("settings.subscription.comparison.free", "Free forever")
                        : billingCycle === "annual"
                          ? t("settings.subscription.perYear", "/ year")
                          : t("settings.subscription.perMonth", "/ month")}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          <tr>
            <td
              colSpan={plans.length + 1}
              className="pt-5 pb-2 px-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle"
            >
              {t("settings.subscription.comparison.limitsHeading", "Usage Limits")}
            </td>
          </tr>
          {allLimitKeys.map((limitKey) => (
            <tr key={limitKey} className="border-t border-border-token">
              <td className="py-3 px-4 text-fg">
                {t(`settings.subscription.comparison.limit_${limitKey}`, LIMIT_LABELS[limitKey])}
              </td>
              {plans.map((plan) => {
                const isCurrent = currentPlanKey === plan.key;
                return (
                  <td
                    key={plan.key}
                    className={`py-3 px-4 text-center font-medium text-fg tabular-nums ${
                      isCurrent ? HIGHLIGHT_CELL : ""
                    }`}
                  >
                    {formatLimit(limitKey, plan.limits[limitKey])}
                  </td>
                );
              })}
            </tr>
          ))}

          <tr>
            <td
              colSpan={plans.length + 1}
              className="pt-6 pb-2 px-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle"
            >
              {t("settings.subscription.comparison.featuresHeading", "Features & Capabilities")}
            </td>
          </tr>
          {allCapabilityKeys.map((capKey) => (
            <tr key={capKey} className="border-t border-border-token">
              <td className="py-3 px-4 text-fg">
                {t(`settings.subscription.comparison.cap_${capKey}`, CAPABILITY_LABELS[capKey] || capKey)}
              </td>
              {plans.map((plan) => {
                const enabled = plan.capabilities[capKey];
                const isCurrent = currentPlanKey === plan.key;
                return (
                  <td
                    key={plan.key}
                    className={`py-3 px-4 text-center ${isCurrent ? HIGHLIGHT_CELL : ""}`}
                  >
                    {enabled ? (
                      <Check
                        size={18}
                        className="inline-block text-ok"
                        aria-label="Included"
                      />
                    ) : (
                      <Minus
                        size={18}
                        className="inline-block text-fg-faint"
                        aria-label="Not included"
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          <tr className="border-t border-border-strong">
            <td className="py-5 px-4" />
            {plans.map((plan) => {
              const isCurrent = currentPlanKey === plan.key;
              return (
                <td
                  key={plan.key}
                  className={`py-5 px-4 text-center ${
                    isCurrent ? `${HIGHLIGHT_CELL} rounded-b-xl` : ""
                  }`}
                >
                  <Button
                    variant={isCurrent ? "secondary" : "primary"}
                    size="sm"
                    disabled={isCurrent || checkoutLoading === plan.key}
                    loading={checkoutLoading === plan.key}
                    onClick={() => onCheckout(plan.key)}
                  >
                    {isCurrent
                      ? t("settings.subscription.currentPlan", "Current plan")
                      : t("settings.subscription.switchTo", "Switch to {{plan}}", { plan: plan.name })}
                  </Button>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
