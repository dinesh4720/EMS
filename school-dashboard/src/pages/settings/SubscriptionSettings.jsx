import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip, Divider, Input, Progress, Skeleton, Switch } from "@heroui/react";
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

  const loadSummary = async (skipCache = true, signal) => {
    try {
      const data = await billingApi.getSummary(skipCache);
      if (signal?.aborted) return;
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
      if (signal?.aborted) return;
      toast.error(error.message || "Failed to load billing summary");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadSummary(true, controller.signal);
    return () => controller.abort();
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
    if (!metric) return "default";
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

  const handleAutoRenew = async (nextValue) => {
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
      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 space-y-3">
          <div className="h-5 w-40 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4">
          <div className="h-5 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 space-y-3">
          <div className="h-5 w-36 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const subscription = summary?.subscription;
  const plans = summary?.plans || [];
  const warnings = summary?.warnings || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{t('pages.subscriptionBilling')}</h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Manage plan access, usage limits, invoices, and the school billing profile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={billingCycle === "monthly" ? "solid" : "flat"}
            color="primary"
            size="sm"
            onPress={() => setBillingCycle("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === "annual" ? "solid" : "flat"}
            color="primary"
            size="sm"
            onPress={() => setBillingCycle("annual")}
          >
            Annual
          </Button>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardBody className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <CreditCard size={24} className="text-primary-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                  {subscription?.effectivePlanName || "No plan"} plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Base subscription: {subscription?.planName || "Starter"}.
                  {subscription?.effectivePlanKey !== subscription?.planKey ? ` Trial access is currently unlocking ${subscription?.effectivePlanName}.` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip color={subscription?.status === "active" ? "success" : "warning"} variant="flat">
                    {subscription?.status}
                  </Chip>
                  <Chip color="primary" variant="flat">
                    {formatMoney(
                      plans.find((plan) => plan.key === subscription?.effectivePlanKey)?.price || 0
                    )}/{billingCycle === "annual" ? "year" : "month"}
                  </Chip>
                  <Chip variant="flat">
                    Next billing: {formatDate(subscription?.nextBillingAt || subscription?.trialEndsAt)}
                  </Chip>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3">
              <Switch
                isSelected={Boolean(subscription?.autoRenew)}
                isDisabled={autoRenewLoading}
                onValueChange={handleAutoRenew}
                size="sm"
              >
                <span className="text-sm">{t('pages.autoRenew')}</span>
              </Switch>
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                Billing cycle: <span className="font-medium text-gray-700 dark:text-zinc-300 capitalize">{subscription?.billingCycle}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={`${warning.type}-${index}`}
              className={`rounded-lg border px-4 py-3 text-sm ${
                warning.severity === "high"
                  ? "border-danger-200 bg-danger-50 text-danger-700"
                  : "border-warning-200 bg-warning-50 text-warning-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{warning.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="rounded-lg">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <TrendingUp size={18} />
            Usage & Limits
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {usageCards.map((item) => {
              const Icon = item.icon;
              const metric = item.value;

              return (
                <div key={item.key} className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-gray-500 dark:text-zinc-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{item.label}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-zinc-400">
                      {item.format
                        ? item.format(metric)
                        : `${metric.current} / ${metric.limit ?? "∞"}`}
                    </span>
                  </div>
                  <Progress value={metric.percentage} color={getProgressColor(metric)} size="sm" />
                  <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                    {metric.limit === null
                      ? "No hard plan cap configured"
                      : `${metric.remaining} ${item.unit} remaining before the limit is reached.`}
                  </p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card className="rounded-lg">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.plansComparison', 'Compare Plans')}</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-zinc-400">{t('billing.havePromoCode', 'Have a promo code?')}</span>
              <CouponInput onApply={setAppliedCoupon} />
            </div>
          </div>
          <PlanComparisonMatrix
            plans={plans}
            currentPlanKey={subscription?.effectivePlanKey}
            billingCycle={billingCycle}
            checkoutLoading={checkoutLoading}
            onCheckout={handleCheckout}
          />
        </CardBody>
      </Card>

      <Card className="rounded-lg">
        <CardBody className="p-6">
          <InvoiceHistory formatMoney={formatMoney} />
        </CardBody>
      </Card>

      <Card className="rounded-lg">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.schoolBillingAccount')}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            These contacts are used for invoices, billing requests, and provider checkout setup.
          </p>

          <Divider className="my-5" />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t('pages.schoolContactEmail')}
              value={accountForm.contactEmail}
              onValueChange={(value) => handleAccountChange("contactEmail", value)}
            />
            <Input
              label={t('pages.schoolContactPhone')}
              value={accountForm.contactPhone}
              onValueChange={(value) => handleAccountChange("contactPhone", value)}
            />
            <Input
              label={t('pages.billingContactName')}
              value={accountForm.billingContactName}
              onValueChange={(value) => handleAccountChange("billingContactName", value)}
            />
            <Input
              label={t('pages.billingEmail')}
              value={accountForm.billingEmail}
              onValueChange={(value) => handleAccountChange("billingEmail", value)}
            />
            <Input
              label={t('pages.billingPhone')}
              value={accountForm.billingPhone}
              onValueChange={(value) => handleAccountChange("billingPhone", value)}
            />
            <Input
              label="GST / Tax ID"
              value={accountForm.taxId}
              onValueChange={(value) => handleAccountChange("taxId", value)}
            />
            <Input
              label={t('pages.addressLine1')}
              value={accountForm.billingAddress.line1}
              onValueChange={(value) => handleAddressChange("line1", value)}
              className="md:col-span-2"
            />
            <Input
              label={t('pages.addressLine2')}
              value={accountForm.billingAddress.line2}
              onValueChange={(value) => handleAddressChange("line2", value)}
              className="md:col-span-2"
            />
            <Input
              label={t('pages.city1')}
              value={accountForm.billingAddress.city}
              onValueChange={(value) => handleAddressChange("city", value)}
            />
            <Input
              label={t('pages.state1')}
              value={accountForm.billingAddress.state}
              onValueChange={(value) => handleAddressChange("state", value)}
            />
            <Input
              label={t('pages.postalCode')}
              value={accountForm.billingAddress.postalCode}
              onValueChange={(value) => handleAddressChange("postalCode", value)}
            />
            <Input
              label={t('pages.country')}
              value={accountForm.billingAddress.country}
              onValueChange={(value) => handleAddressChange("country", value)}
            />
          </div>

          <div className="mt-5">
            <Button color="primary" isLoading={savingAccount} onPress={handleAccountSave}>
              Save billing account
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
