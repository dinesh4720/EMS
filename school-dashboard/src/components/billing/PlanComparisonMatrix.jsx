import { Button, Chip } from "@heroui/react";
import { Check, IndianRupee, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/numberFormatter";
import { getDateLocale } from "../../i18n/index";

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
        {/* Header row with plan names & prices */}
        <thead>
          <tr>
            <th className="text-left py-4 px-4 font-medium text-gray-500 w-1/4 min-w-[180px]">
              {t("settings.subscription.comparison.features", "Features")}
            </th>
            {plans.map((plan) => {
              const isCurrent = currentPlanKey === plan.key;
              return (
                <th
                  key={plan.key}
                  className={`text-center py-4 px-4 min-w-[160px] ${
                    isCurrent ? "bg-primary-50 rounded-t-xl" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold text-gray-900">
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <Chip size="sm" color="primary" variant="flat">
                        {t("settings.subscription.currentPlan", "Current plan")}
                      </Chip>
                    )}
                    <div className="flex items-center gap-0.5 mt-1 text-lg font-bold text-gray-900">
                      <IndianRupee size={16} />
                      {plan.price.toLocaleString(getDateLocale())}
                    </div>
                    <span className="text-xs text-gray-500">
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
          {/* Limits section */}
          <tr>
            <td
              colSpan={plans.length + 1}
              className="pt-5 pb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              {t("settings.subscription.comparison.limitsHeading", "Usage Limits")}
            </td>
          </tr>
          {allLimitKeys.map((limitKey) => (
            <tr key={limitKey} className="border-t border-gray-100">
              <td className="py-3 px-4 text-gray-700">
                {t(`settings.subscription.comparison.limit_${limitKey}`, LIMIT_LABELS[limitKey])}
              </td>
              {plans.map((plan) => {
                const isCurrent = currentPlanKey === plan.key;
                return (
                  <td
                    key={plan.key}
                    className={`py-3 px-4 text-center font-medium text-gray-900 ${
                      isCurrent ? "bg-primary-50/50" : ""
                    }`}
                  >
                    {formatLimit(limitKey, plan.limits[limitKey])}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Capabilities section */}
          <tr>
            <td
              colSpan={plans.length + 1}
              className="pt-6 pb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              {t("settings.subscription.comparison.featuresHeading", "Features & Capabilities")}
            </td>
          </tr>
          {allCapabilityKeys.map((capKey) => (
            <tr key={capKey} className="border-t border-gray-100">
              <td className="py-3 px-4 text-gray-700">
                {t(`settings.subscription.comparison.cap_${capKey}`, CAPABILITY_LABELS[capKey] || capKey)}
              </td>
              {plans.map((plan) => {
                const enabled = plan.capabilities[capKey];
                const isCurrent = currentPlanKey === plan.key;
                return (
                  <td
                    key={plan.key}
                    className={`py-3 px-4 text-center ${
                      isCurrent ? "bg-primary-50/50" : ""
                    }`}
                  >
                    {enabled ? (
                      <Check size={18} className="inline-block text-success-600" />
                    ) : (
                      <Minus size={18} className="inline-block text-gray-300" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* CTA row */}
          <tr className="border-t border-gray-200">
            <td className="py-5 px-4" />
            {plans.map((plan) => {
              const isCurrent = currentPlanKey === plan.key;
              return (
                <td
                  key={plan.key}
                  className={`py-5 px-4 text-center ${
                    isCurrent ? "bg-primary-50/50 rounded-b-xl" : ""
                  }`}
                >
                  <Button
                    color={isCurrent ? "default" : "primary"}
                    variant={isCurrent ? "flat" : "solid"}
                    size="sm"
                    isDisabled={isCurrent || checkoutLoading === plan.key}
                    isLoading={checkoutLoading === plan.key}
                    onPress={() => onCheckout(plan.key)}
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
