import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip, Divider, Input, Progress, Skeleton, Switch } from "@heroui/react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  HardDrive,
  IndianRupee,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Users
} from "lucide-react";
import { billingApi } from "../../services/api";
import toast from "react-hot-toast";

export default function SubscriptionSettings() {
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
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-IN", {
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
      toast.success("Billing account updated");
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

  const handleCheckout = async (planKey) => {
    setCheckoutLoading(planKey);
    try {
      const response = await billingApi.createCheckout({ planKey, billingCycle });
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
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const subscription = summary?.subscription;
  const plans = summary?.plans || [];
  const invoices = summary?.invoices || [];
  const warnings = summary?.warnings || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Subscription & Billing</h2>
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
                <span className="text-sm">Auto-renew</span>
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
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={18} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Plans & Invoices</h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.35fr,0.95fr]">
            <div className="space-y-4">
              {plans.map((plan) => {
                const isCurrent = subscription?.effectivePlanKey === plan.key;
                const isCommitted = subscription?.planKey === plan.key && subscription?.status === "active";

                return (
                  <div key={plan.key} className={`rounded-xl border p-4 ${isCurrent ? "border-primary-300 bg-primary-50/50" : "border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950"}`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{plan.name}</h4>
                          {isCurrent && <Chip size="sm" color="primary" variant="flat">Current access</Chip>}
                          {isCommitted && <Chip size="sm" color="success" variant="flat">Committed</Chip>}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">{plan.description}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="flex items-center gap-1 text-xl font-semibold text-gray-900 dark:text-zinc-100 md:justify-end">
                          <IndianRupee size={18} />
                          {plan.price}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">per {billingCycle === "annual" ? "year" : "month"}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-gray-600 dark:text-zinc-400 md:grid-cols-2">
                      <div>Students: {plan.limits.students}</div>
                      <div>Staff: {plan.limits.staff}</div>
                      <div>Storage: {(plan.limits.storageMb / 1024).toFixed(0)} GB</div>
                      <div>SMS credits: {plan.limits.smsCredits}</div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(plan.capabilities || {}).map(([key, enabled]) => (
                        <Chip key={key} size="sm" variant="flat" color={enabled ? "success" : "default"}>
                          {enabled ? <CheckCircle2 size={12} /> : <ShieldCheck size={12} />}
                          <span className="ml-1">{key}</span>
                        </Chip>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button
                        color={isCurrent ? "default" : "primary"}
                        isDisabled={checkoutLoading === plan.key || isCommitted}
                        isLoading={checkoutLoading === plan.key}
                        onPress={() => handleCheckout(plan.key)}
                      >
                        {isCommitted ? "Current plan" : isCurrent ? "Keep this plan" : `Switch to ${plan.name}`}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Recent invoices</h4>
              <div className="mt-4 space-y-3">
                {invoices.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-zinc-400">No invoices yet. A record will appear here after checkout is created.</p>
                )}
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {invoice.planKey} · {invoice.billingCycle} · {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                      <Chip size="sm" variant="flat" color={invoice.status === "paid" ? "success" : invoice.status === "issued" ? "primary" : "warning"}>
                        {invoice.status}
                      </Chip>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-zinc-400">{formatMoney(invoice.amount, invoice.currency)}</span>
                      {invoice.hostedUrl ? (
                        <Button
                          size="sm"
                          variant="light"
                          endContent={<ExternalLink size={14} />}
                          onPress={() => window.open(invoice.hostedUrl, "_blank", "noopener,noreferrer")}
                        >
                          Open
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">No hosted link</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="rounded-lg">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">School billing account</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            These contacts are used for invoices, billing requests, and provider checkout setup.
          </p>

          <Divider className="my-5" />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="School contact email"
              value={accountForm.contactEmail}
              onValueChange={(value) => handleAccountChange("contactEmail", value)}
            />
            <Input
              label="School contact phone"
              value={accountForm.contactPhone}
              onValueChange={(value) => handleAccountChange("contactPhone", value)}
            />
            <Input
              label="Billing contact name"
              value={accountForm.billingContactName}
              onValueChange={(value) => handleAccountChange("billingContactName", value)}
            />
            <Input
              label="Billing email"
              value={accountForm.billingEmail}
              onValueChange={(value) => handleAccountChange("billingEmail", value)}
            />
            <Input
              label="Billing phone"
              value={accountForm.billingPhone}
              onValueChange={(value) => handleAccountChange("billingPhone", value)}
            />
            <Input
              label="GST / Tax ID"
              value={accountForm.taxId}
              onValueChange={(value) => handleAccountChange("taxId", value)}
            />
            <Input
              label="Address line 1"
              value={accountForm.billingAddress.line1}
              onValueChange={(value) => handleAddressChange("line1", value)}
              className="md:col-span-2"
            />
            <Input
              label="Address line 2"
              value={accountForm.billingAddress.line2}
              onValueChange={(value) => handleAddressChange("line2", value)}
              className="md:col-span-2"
            />
            <Input
              label="City"
              value={accountForm.billingAddress.city}
              onValueChange={(value) => handleAddressChange("city", value)}
            />
            <Input
              label="State"
              value={accountForm.billingAddress.state}
              onValueChange={(value) => handleAddressChange("state", value)}
            />
            <Input
              label="Postal code"
              value={accountForm.billingAddress.postalCode}
              onValueChange={(value) => handleAddressChange("postalCode", value)}
            />
            <Input
              label="Country"
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
