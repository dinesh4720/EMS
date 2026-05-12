import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  HardDrive,
  MessageSquare,
  TrendingUp,
  Users
} from "lucide-react";
import { billingApi } from "../../services/api";
import toast from "react-hot-toast";
import { getDateLocale } from '../../i18n/index';
import { useTranslation } from 'react-i18next';
import InvoiceHistory from "../../components/billing/InvoiceHistory";
import PlanComparisonMatrix from "../../components/billing/PlanComparisonMatrix";
import CouponInput from "../../components/billing/CouponInput";
import {
  Alert,
  Button,
  Card,
  Chip,
  Divider,
  Input,
  Progress,
  SectionHeading,
  Skeleton,
  Switch,
} from "../../components/ui";

export default function SubscriptionSettings() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [accountForm, setAccountForm] = useState({
    contactEmail: "",
    contactPhone: "",
    billingContactName: "",
    billingEmail: "",
    billingPhone: "",
    taxId: "",
    billingAddress: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
  });

  const loadSummary = async (skipCache = true) => {
    try {
      const data = await billingApi.getSummary(skipCache);
      setSummary(data);
      setBillingCycle(data.subscription?.billingCycle || "monthly");
      setAccountForm({
        contactEmail: data.school?.contactEmail || "",
        contactPhone: data.school?.contactPhone || "",
        billingContactName: data.subscription?.billingContactName || "",
        billingEmail: data.subscription?.billingEmail || "",
        billingPhone: data.subscription?.billingPhone || "",
        taxId: data.subscription?.taxId || "",
        billingAddress: {
          line1: data.subscription?.billingAddress?.line1 || "",
          line2: data.subscription?.billingAddress?.line2 || "",
          city: data.subscription?.billingAddress?.city || "",
          state: data.subscription?.billingAddress?.state || "",
          postalCode: data.subscription?.billingAddress?.postalCode || "",
          country: data.subscription?.billingAddress?.country || "India",
        },
      });
    } catch (error) {
      toast.error(error.message || "Failed to load billing summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const usageCards = useMemo(() => {
    if (!summary?.usage) return [];

    return [
      { key: "students", label: "Students", icon: Users, unit: "records", value: summary.usage.students },
      { key: "staff", label: "Staff", icon: Users, unit: "users", value: summary.usage.staff },
      {
        key: "storageMb",
        label: "Storage",
        icon: HardDrive,
        unit: "GB",
        value: summary.usage.storageMb,
        format: (metric) => `${(metric.current / 1024).toFixed(1)} / ${metric.limit ? (metric.limit / 1024).toFixed(0) : "∞"} GB`,
      },
      { key: "smsCredits", label: "SMS Credits", icon: MessageSquare, unit: "credits", value: summary.usage.smsCredits },
    ];
  }, [summary]);

  const formatMoney = (amount, currency = "INR") =>
    new Intl.NumberFormat(getDateLocale(), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(getDateLocale(), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getProgressColor = (metric) => {
    if (!metric) return "primary";
    if (metric.isExceeded) return "danger";
    if (metric.isNearLimit) return "warning";
    return "success";
  };

  const handleAccountChange = (field, value) => {
    setAccountForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setAccountForm((current) => ({
      ...current,
      billingAddress: {
        ...current.billingAddress,
        [field]: value,
      },
    }));
  };

  const handleAccountSave = async () => {
    setSavingAccount(true);
    try {
      await billingApi.updateAccount(accountForm);
      toast.success(t('toast.success.billingAccountUpdated'));
      await loadSummary(true);
    } catch (error) {
      toast.error(error.message || "Failed to update billing account");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleAutoRenew = async (event) => {
    const nextValue = event.target.checked;
    setAutoRenewLoading(true);
    try {
      await billingApi.updateAutoRenew(nextValue);
      setSummary((current) => current ? {
        ...current,
        subscription: {
          ...current.subscription,
          autoRenew: nextValue,
        }
      } : current);
      toast.success(nextValue ? "Auto-renew enabled" : "Auto-renew disabled");
    } catch (error) {
      toast.error(error.message || "Failed to update auto-renew");
    } finally {
      setAutoRenewLoading(false);
    }
  };

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleCheckout = async (planKey) => {
    setCheckoutLoading(planKey);
    try {
      const response = await billingApi.createCheckout({
        planKey,
        billingCycle,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      });
      if (response.checkoutUrl) {
        window.open(response.checkoutUrl, "_blank", "noopener,noreferrer");
      }
      toast.success(response.message || "Checkout created");
      await loadSummary(true);
    } catch (error) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <Card padding="md">
          <Skeleton variant="text" className="h-5 w-40" />
          <Skeleton variant="text" className="h-4 w-64 mt-3" />
        </Card>
        <Card padding="md">
          <Skeleton variant="text" className="h-5 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-48" />
            ))}
          </div>
        </Card>
        <Card padding="md">
          <Skeleton variant="text" className="h-5 w-36 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-10" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const subscription = summary?.subscription;
  const plans = summary?.plans || [];
  const warnings = summary?.warnings || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-fg">
            {t('pages.subscriptionBilling')}
          </h2>
          <p className="text-sm text-fg-muted mt-1">
            Manage plan access, usage limits, invoices, and the school billing profile.
          </p>
        </div>
        <div
          role="group"
          aria-label="Billing cycle"
          className="inline-flex items-center gap-1 rounded-lg border border-border-token p-1"
        >
          <Button
            variant={billingCycle === "monthly" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setBillingCycle("monthly")}
            aria-pressed={billingCycle === "monthly"}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === "annual" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setBillingCycle("annual")}
            aria-pressed={billingCycle === "annual"}
          >
            Annual
          </Button>
        </div>
      </div>

      {(() => {
        // Plan card — mirrors preview/settings_billing.html `.plan` pattern.
        const studentSeats = summary?.usage?.students;
        const seatsCurrent = studentSeats?.current ?? 0;
        const seatsLimit = studentSeats?.limit;
        const seatsPct = seatsLimit
          ? Math.min(100, Math.round((seatsCurrent / seatsLimit) * 100))
          : null;
        const planPrice = plans.find(
          (plan) => plan.key === subscription?.effectivePlanKey
        )?.price || 0;
        const cycleLabel = billingCycle === "annual" ? "year" : "month";
        const nextBilling = formatDate(
          subscription?.nextBillingAt || subscription?.trialEndsAt
        );
        return (
          <div className="plan-card">
            <div className="plan-card__main">
              <span className="plan-card__badge">Current plan</span>
              <div className="plan-card__name">
                Edumaster {subscription?.effectivePlanName || "Starter"}{" "}
                <span className="text-fg-faint font-medium">
                  · {subscription?.billingCycle === "annual" ? "Annual" : "Monthly"}
                </span>
              </div>
              <div className="plan-card__sub">
                {formatMoney(planPrice)} / {cycleLabel}
                {nextBilling !== "—" && ` · renews ${nextBilling}`}
                {subscription?.effectivePlanKey !== subscription?.planKey &&
                  ` · trial unlocking ${subscription?.effectivePlanName}`}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip color={subscription?.status === "active" ? "success" : "warning"}>
                  {subscription?.status}
                </Chip>
                <Switch
                  checked={Boolean(subscription?.autoRenew)}
                  disabled={autoRenewLoading}
                  onChange={handleAutoRenew}
                  size="sm"
                  label={t('pages.autoRenew')}
                />
              </div>
            </div>
            {studentSeats ? (
              <div className="plan-card__usage">
                <div className="plan-card__num">
                  {seatsCurrent.toLocaleString()}
                  {seatsLimit && (
                    <span className="plan-card__num-of">
                      / {seatsLimit.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="plan-card__lab">student seats used</div>
                {seatsPct != null && (
                  <div
                    className="plan-card__bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={seatsPct}
                  >
                    <div
                      className="plan-card__bar-fill"
                      style={{ width: `${seatsPct}%` }}
                    />
                  </div>
                )}
              </div>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              icon={<CreditCard size={14} />}
              className="plan-card__cta"
              onClick={() => {
                document
                  .getElementById("plans-comparison")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Upgrade
            </Button>
          </div>
        );
      })()}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <Alert
              key={`${warning.type}-${index}`}
              variant={warning.severity === "high" ? "danger" : "warning"}
              icon={<AlertTriangle size={18} />}
            >
              {warning.message}
            </Alert>
          ))}
        </div>
      )}

      <Card padding="md">
        <SectionHeading icon={TrendingUp} className="mb-4">
          Usage & Limits
        </SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          {usageCards.map((item) => {
            const Icon = item.icon;
            const metric = item.value;

            return (
              <div
                key={item.key}
                className="rounded-xl border border-divider bg-surface-2 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      size={16}
                      className="text-fg-muted"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-fg">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm text-fg-muted tabular-nums">
                    {item.format
                      ? item.format(metric)
                      : `${metric.current} / ${metric.limit ?? "∞"}`}
                  </span>
                </div>
                <Progress
                  value={metric.percentage}
                  color={getProgressColor(metric)}
                  size="sm"
                  label={item.label}
                  aria-label={`${item.label} usage`}
                />
                <p className="mt-2 text-xs text-fg-muted">
                  {metric.limit === null
                    ? "No hard plan cap configured"
                    : `${metric.remaining} ${item.unit} remaining before the limit is reached.`}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding="md" id="plans-comparison">
        <SectionHeading
          className="mb-6"
          actions={
            <div className="flex items-center gap-3">
              <span className="text-xs text-fg-muted">
                {t('billing.havePromoCode', 'Have a promo code?')}
              </span>
              <CouponInput onApply={setAppliedCoupon} />
            </div>
          }
        >
          {t('pages.plansComparison', 'Compare Plans')}
        </SectionHeading>
        <PlanComparisonMatrix
          plans={plans}
          currentPlanKey={subscription?.effectivePlanKey}
          billingCycle={billingCycle}
          checkoutLoading={checkoutLoading}
          onCheckout={handleCheckout}
        />
      </Card>

      <Card padding="md">
        <InvoiceHistory formatMoney={formatMoney} />
      </Card>

      <Card padding="md">
        <SectionHeading description="These contacts are used for invoices, billing requests, and provider checkout setup.">
          {t('pages.schoolBillingAccount')}
        </SectionHeading>

        <Divider spacing="md" />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={t('pages.schoolContactEmail')}
            value={accountForm.contactEmail}
            onChange={(e) => handleAccountChange("contactEmail", e.target.value)}
            type="email"
          />
          <Input
            label={t('pages.schoolContactPhone')}
            value={accountForm.contactPhone}
            onChange={(e) => handleAccountChange("contactPhone", e.target.value)}
            type="tel"
          />
          <Input
            label={t('pages.billingContactName')}
            value={accountForm.billingContactName}
            onChange={(e) => handleAccountChange("billingContactName", e.target.value)}
          />
          <Input
            label={t('pages.billingEmail')}
            value={accountForm.billingEmail}
            onChange={(e) => handleAccountChange("billingEmail", e.target.value)}
            type="email"
          />
          <Input
            label={t('pages.billingPhone')}
            value={accountForm.billingPhone}
            onChange={(e) => handleAccountChange("billingPhone", e.target.value)}
            type="tel"
          />
          <Input
            label="GST / Tax ID"
            value={accountForm.taxId}
            onChange={(e) => handleAccountChange("taxId", e.target.value)}
          />
          <Input
            label={t('pages.addressLine1')}
            value={accountForm.billingAddress.line1}
            onChange={(e) => handleAddressChange("line1", e.target.value)}
            wrapperClassName="md:col-span-2"
          />
          <Input
            label={t('pages.addressLine2')}
            value={accountForm.billingAddress.line2}
            onChange={(e) => handleAddressChange("line2", e.target.value)}
            wrapperClassName="md:col-span-2"
          />
          <Input
            label={t('pages.city1')}
            value={accountForm.billingAddress.city}
            onChange={(e) => handleAddressChange("city", e.target.value)}
          />
          <Input
            label={t('pages.state1')}
            value={accountForm.billingAddress.state}
            onChange={(e) => handleAddressChange("state", e.target.value)}
          />
          <Input
            label={t('pages.postalCode')}
            value={accountForm.billingAddress.postalCode}
            onChange={(e) => handleAddressChange("postalCode", e.target.value)}
          />
          <Input
            label={t('pages.country')}
            value={accountForm.billingAddress.country}
            onChange={(e) => handleAddressChange("country", e.target.value)}
          />
        </div>

        <div className="mt-5">
          <Button variant="primary" loading={savingAccount} onClick={handleAccountSave}>
            Save billing account
          </Button>
        </div>
      </Card>
    </div>
  );
}
