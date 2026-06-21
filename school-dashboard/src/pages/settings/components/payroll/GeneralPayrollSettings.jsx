import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { settingsApi } from "../../../../services/api";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import { SkeletonCard } from "../../../../components/ui/Skeleton";
import ErrorState from "../../../../components/ui/ErrorState";
import ScheduleCard from "./ScheduleCard";
import PaymentMethodCard from "./PaymentMethodCard";
import RemindersCard from "./RemindersCard";
import AccessPermissionsCard from "./AccessPermissionsCard";

const getOrdinalSuffix = (day) => {
  const num = parseInt(day);
  if (!num || num < 1 || num > 31) return "";
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

export default function GeneralPayrollSettings() {
  const { t } = useTranslation();
  const [editingSection, setEditingSection] = useState(null);
  const [disburseDate, setDisburseDate] = useState("");
  const [tempDisburseDate, setTempDisburseDate] = useState("");
  const [payrollCycle, setPayrollCycle] = useState("monthly");
  const [tempPayrollCycle, setTempPayrollCycle] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [tempPaymentMethod, setTempPaymentMethod] = useState("bank_transfer");
  const [autoReminder, setAutoReminder] = useState(true);
  const [tempAutoReminder, setTempAutoReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState("3");
  const [tempReminderDays, setTempReminderDays] = useState("3");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchPayrollSettings = useCallback(async () => {
    setFetchError(null);
    try {
      const data = await settingsApi.getPayrollSettings();
      const d = data.data?.disburseDate || "";
      setDisburseDate(d);
      setTempDisburseDate(d);
      const cycle = data.data?.payrollCycle || "monthly";
      setPayrollCycle(cycle);
      setTempPayrollCycle(cycle);
      // AUDIT-116: Also load payment method and reminder settings if present
      if (data.data?.paymentMethod) {
        setPaymentMethod(data.data.paymentMethod);
        setTempPaymentMethod(data.data.paymentMethod);
      }
      if (data.data?.autoReminder !== undefined) {
        setAutoReminder(data.data.autoReminder);
        setTempAutoReminder(data.data.autoReminder);
      }
      if (data.data?.reminderDays) {
        setReminderDays(String(data.data.reminderDays));
        setTempReminderDays(String(data.data.reminderDays));
      }
    } catch (error) {
      // DS-02: surface the failure instead of silently keeping stale defaults
      logger.error("Failed to fetch payroll settings:", error);
      setFetchError(error);
    } finally {
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollSettings();
  }, [fetchPayrollSettings]);

  // AUDIT-127: Warn before leaving with unsaved edits
  useEffect(() => {
    const handler = (e) => { if (editingSection) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editingSection]);

  const handleEdit = useCallback((section) => {
    if (section === "schedule") {
      setTempDisburseDate(disburseDate);
      setTempPayrollCycle(payrollCycle);
    }
    if (section === "payment") setTempPaymentMethod(paymentMethod);
    if (section === "reminders") {
      setTempAutoReminder(autoReminder);
      setTempReminderDays(reminderDays);
    }
    setEditingSection(section);
  }, [disburseDate, payrollCycle, paymentMethod, autoReminder, reminderDays]);

  const handleCancel = useCallback(() => setEditingSection(null), []);

  const handleSaveSchedule = useCallback(async () => {
    if (!tempDisburseDate || tempDisburseDate < 1 || tempDisburseDate > 31) {
      toast.error(t("toast.error.pleaseEnterAValidDateBetween1And31"));
      return;
    }
    setLoading(true);
    try {
      await settingsApi.updatePayrollSettings({
        disburseDate: parseInt(tempDisburseDate),
        payrollCycle: tempPayrollCycle,
      });
      setDisburseDate(tempDisburseDate);
      setPayrollCycle(tempPayrollCycle);
      toast.success(t("toast.success.payrollSettingsSavedSuccessfully"));
      setEditingSection(null);
    } catch (error) {
      logger.error("Failed to save payroll settings:", error);
      toast.error(error.message || "Failed to save payroll settings");
    } finally {
      setLoading(false);
    }
  }, [tempDisburseDate, tempPayrollCycle, t]);

  // TODO: AUDIT-116 - Wire up to API: PUT /settings/payroll (paymentMethod field)
  const handleSavePayment = useCallback(async () => {
    setLoading(true);
    try {
      await settingsApi.updatePayrollSettings({ paymentMethod: tempPaymentMethod });
      setPaymentMethod(tempPaymentMethod);
      toast.success("Payment settings saved");
      setEditingSection(null);
    } catch (error) {
      logger.error("Failed to save payment settings:", error);
      toast.error(error.message || "Failed to save payment settings");
    } finally {
      setLoading(false);
    }
  }, [tempPaymentMethod]);

  // TODO: AUDIT-116 - Wire up to API: PUT /settings/payroll (reminder fields)
  const handleSaveReminders = useCallback(async () => {
    setLoading(true);
    try {
      await settingsApi.updatePayrollSettings({
        autoReminder: tempAutoReminder,
        reminderDays: parseInt(tempReminderDays),
      });
      setAutoReminder(tempAutoReminder);
      setReminderDays(tempReminderDays);
      toast.success("Reminder settings saved");
      setEditingSection(null);
    } catch (error) {
      logger.error("Failed to save reminder settings:", error);
      toast.error(error.message || "Failed to save reminder settings");
    } finally {
      setLoading(false);
    }
  }, [tempAutoReminder, tempReminderDays]);

  // DS-02: skeleton while the initial fetch is in flight — never show default values as if they were saved settings
  if (initialLoad) {
    return (
      <div className="space-y-5" role="status" aria-busy="true" aria-label="Loading payroll settings">
        <SkeletonCard bodyLines={3} />
        <SkeletonCard bodyLines={2} />
        <SkeletonCard bodyLines={2} />
      </div>
    );
  }

  // DS-02: a failed fetch must not silently leave editable defaults the admin could re-save
  if (fetchError) {
    return (
      <ErrorState
        title="Couldn't load payroll settings"
        description="We couldn't load your payroll configuration. Your saved settings are unchanged — try again."
        error={fetchError}
        onRetry={fetchPayrollSettings}
      />
    );
  }

  return (
    <div className="space-y-5">
      <ScheduleCard
        editingSection={editingSection}
        initialLoad={initialLoad}
        loading={loading}
        disburseDate={disburseDate}
        tempDisburseDate={tempDisburseDate}
        payrollCycle={payrollCycle}
        tempPayrollCycle={tempPayrollCycle}
        onTempDisburseDateChange={setTempDisburseDate}
        onTempPayrollCycleChange={setTempPayrollCycle}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSaveSchedule}
        getOrdinalSuffix={getOrdinalSuffix}
      />
      <PaymentMethodCard
        editingSection={editingSection}
        loading={loading}
        paymentMethod={paymentMethod}
        tempPaymentMethod={tempPaymentMethod}
        onTempPaymentMethodChange={setTempPaymentMethod}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSavePayment}
      />
      <RemindersCard
        editingSection={editingSection}
        loading={loading}
        autoReminder={autoReminder}
        tempAutoReminder={tempAutoReminder}
        reminderDays={reminderDays}
        tempReminderDays={tempReminderDays}
        onTempAutoReminderChange={setTempAutoReminder}
        onTempReminderDaysChange={setTempReminderDays}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSaveReminders}
      />
      <AccessPermissionsCard />
    </div>
  );
}
