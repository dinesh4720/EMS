import { useState, useEffect } from "react";
import {
  Card, CardBody, Button, Input, Chip, Select, SelectItem, Switch,
} from "@heroui/react";
import {
  Calendar, Bell, Banknote, Shield, Lock, Pencil, X, Save,
} from "lucide-react";
import { settingsApi } from "../../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import logger from '../../../utils/logger';

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

  useEffect(() => {
    const fetchPayrollSettings = async () => {
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
        setInitialLoad(false);
      } catch (error) {
        logger.error("Failed to fetch payroll settings:", error);
        setInitialLoad(false);
      }
    };
    fetchPayrollSettings();
  }, []);

  // AUDIT-127: Warn before leaving with unsaved edits
  useEffect(() => {
    const handler = (e) => { if (editingSection) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editingSection]);

  const getOrdinalSuffix = (day) => {
    const num = parseInt(day);
    if (!num || num < 1 || num > 31) return "";
    const suffixes = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const handleEdit = (section) => {
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
  };

  const handleCancel = () => setEditingSection(null);

  const handleSaveSchedule = async () => {
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
  };

  // TODO: AUDIT-116 - Wire up to API: PUT /settings/payroll (paymentMethod field)
  const handleSavePayment = async () => {
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
  };

  // TODO: AUDIT-116 - Wire up to API: PUT /settings/payroll (reminder fields)
  const handleSaveReminders = async () => {
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
  };

  const paymentMethodLabels = {
    bank_transfer: "Bank Transfer",
    cheque: "Cheque",
    cash: "Cash",
    upi: "UPI",
  };

  return (
    <div className="space-y-5">
      {/* Section 1: Payroll Schedule */}
      <Card
        className={`shadow-sm border transition-all duration-200 ${
          editingSection === "schedule"
            ? "border-primary ring-1 ring-primary"
            : "border-default-200"
        }`}
      >
        <CardBody className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  editingSection === "schedule"
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Calendar size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-default-800">
                  Payroll Schedule
                </h3>
                <p className="text-xs text-default-500 mt-0.5">
                  Set when salaries are disbursed each month
                </p>
              </div>
            </div>
            {editingSection === "schedule" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleCancel}
                  startContent={<X size={14} />}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleSaveSchedule}
                  isLoading={loading}
                  startContent={<Save size={14} />}
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="flat"
                onPress={() => handleEdit("schedule")}
                isDisabled={editingSection !== null || initialLoad}
                startContent={<Pencil size={14} />}
              >
                Edit
              </Button>
            )}
          </div>

          {editingSection === "schedule" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                type="number"
                label={t("pages.payrollDisburseDate")}
                placeholder={t("settings.disburseDatePlaceholder")}
                min="1"
                max="31"
                value={tempDisburseDate}
                onValueChange={setTempDisburseDate}
                variant="bordered"
                labelPlacement="outside"
                classNames={{
                  inputWrapper: "bg-white dark:bg-zinc-950",
                }}
                endContent={
                  <span className="text-default-400 text-xs">day of month</span>
                }
                description="Enter a value between 1 and 31"
                autoFocus
              />
              <Select
                label="Payroll Cycle"
                selectedKeys={[tempPayrollCycle]}
                onSelectionChange={(keys) => setTempPayrollCycle([...keys][0])}
                variant="bordered"
                labelPlacement="outside"
                classNames={{
                  trigger: "bg-white dark:bg-zinc-950",
                }}
              >
                <SelectItem key="weekly">Weekly</SelectItem>
                <SelectItem key="biweekly">Bi-weekly</SelectItem>
                <SelectItem key="monthly">Monthly</SelectItem>
              </Select>
              {tempDisburseDate &&
                parseInt(tempDisburseDate) >= 1 &&
                parseInt(tempDisburseDate) <= 31 && (
                  <div className="flex items-center">
                    <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100 w-full">
                      <p className="text-xs text-primary-600 font-medium uppercase tracking-wider mb-1">
                        Preview
                      </p>
                      <p className="text-lg font-semibold text-primary-700">
                        {getOrdinalSuffix(tempDisburseDate)} of every month
                      </p>
                      <p className="text-xs text-primary-500 mt-1">
                        Salaries will be processed on this date
                      </p>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Disburse Date
                </p>
                <p className="text-sm font-medium text-default-800">
                  {disburseDate
                    ? `${getOrdinalSuffix(disburseDate)} of every month`
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Payroll Cycle
                </p>
                <p className="text-sm font-medium text-default-800">
                  {{ weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly" }[payrollCycle] || "Monthly"}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Status
                </p>
                <Chip
                  size="sm"
                  color={disburseDate ? "success" : "warning"}
                  variant="flat"
                >
                  {disburseDate ? "Configured" : "Pending Setup"}
                </Chip>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 2: Payment Method */}
      <Card
        className={`shadow-sm border transition-all duration-200 ${
          editingSection === "payment"
            ? "border-primary ring-1 ring-primary"
            : "border-default-200"
        }`}
      >
        <CardBody className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  editingSection === "payment"
                    ? "bg-primary text-white"
                    : "bg-success/10 text-success"
                }`}
              >
                <Banknote size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-default-800">
                  Payment Method
                </h3>
                <p className="text-xs text-default-500 mt-0.5">
                  Default method for salary disbursement
                </p>
              </div>
            </div>
            {editingSection === "payment" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleCancel}
                  startContent={<X size={14} />}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleSavePayment}
                  isLoading={loading}
                  startContent={<Save size={14} />}
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="flat"
                onPress={() => handleEdit("payment")}
                isDisabled={editingSection !== null}
                startContent={<Pencil size={14} />}
              >
                Edit
              </Button>
            )}
          </div>

          {editingSection === "payment" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Default Payment Method"
                selectedKeys={[tempPaymentMethod]}
                onSelectionChange={(keys) =>
                  setTempPaymentMethod(Array.from(keys)[0])
                }
                variant="bordered"
                labelPlacement="outside"
                classNames={{
                  trigger: "bg-white dark:bg-zinc-950",
                }}
              >
                <SelectItem key="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem key="cheque">Cheque</SelectItem>
                <SelectItem key="cash">Cash</SelectItem>
                <SelectItem key="upi">UPI</SelectItem>
              </Select>
              <div className="flex items-center">
                <div className="p-4 bg-success-50/50 rounded-xl border border-success-100 w-full">
                  <p className="text-xs text-success-600 font-medium uppercase tracking-wider mb-1">
                    Selected Method
                  </p>
                  <p className="text-lg font-semibold text-success-700">
                    {paymentMethodLabels[tempPaymentMethod]}
                  </p>
                  <p className="text-xs text-success-500 mt-1">
                    All new payroll runs will use this method
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Payment Method
                </p>
                <p className="text-sm font-medium text-default-800">
                  {paymentMethodLabels[paymentMethod]}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Processing
                </p>
                <p className="text-sm font-medium text-default-800">
                  Manual Approval
                </p>
              </div>
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Status
                </p>
                <Chip size="sm" color="success" variant="flat">
                  Active
                </Chip>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 3: Reminders & Notifications */}
      <Card
        className={`shadow-sm border transition-all duration-200 ${
          editingSection === "reminders"
            ? "border-primary ring-1 ring-primary"
            : "border-default-200"
        }`}
      >
        <CardBody className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  editingSection === "reminders"
                    ? "bg-primary text-white"
                    : "bg-warning/10 text-warning"
                }`}
              >
                <Bell size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-default-800">
                  Reminders & Notifications
                </h3>
                <p className="text-xs text-default-500 mt-0.5">
                  Automated alerts before payroll processing
                </p>
              </div>
            </div>
            {editingSection === "reminders" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleCancel}
                  startContent={<X size={14} />}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleSaveReminders}
                  isLoading={loading}
                  startContent={<Save size={14} />}
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="flat"
                onPress={() => handleEdit("reminders")}
                isDisabled={editingSection !== null}
                startContent={<Pencil size={14} />}
              >
                Edit
              </Button>
            )}
          </div>

          {editingSection === "reminders" ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-default-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-default-800">
                    Auto Payroll Reminder
                  </p>
                  <p className="text-xs text-default-500 mt-0.5">
                    Send reminder notifications before payroll date
                  </p>
                </div>
                <Switch
                  isSelected={tempAutoReminder}
                  onValueChange={setTempAutoReminder}
                  color="primary"
                  size="sm"
                />
              </div>
              {tempAutoReminder && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="number"
                    label="Reminder Days Before"
                    placeholder="e.g. 3"
                    min="1"
                    max="15"
                    value={tempReminderDays}
                    onValueChange={setTempReminderDays}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{
                      inputWrapper: "bg-white dark:bg-zinc-950",
                    }}
                    endContent={
                      <span className="text-default-400 text-xs">days</span>
                    }
                    description="How many days before payday to send reminders"
                  />
                  <div className="flex items-center">
                    <div className="p-4 bg-warning-50/50 rounded-xl border border-warning-100 w-full">
                      <p className="text-xs text-warning-600 font-medium uppercase tracking-wider mb-1">
                        Reminder Preview
                      </p>
                      <p className="text-sm font-semibold text-warning-700">
                        {tempReminderDays} day
                        {parseInt(tempReminderDays) !== 1 ? "s" : ""} before
                        payday
                      </p>
                      <p className="text-xs text-warning-500 mt-1">
                        Admins will be notified to prepare payroll
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Auto Reminder
                </p>
                <Chip
                  size="sm"
                  color={autoReminder ? "success" : "default"}
                  variant="flat"
                >
                  {autoReminder ? "Enabled" : "Disabled"}
                </Chip>
              </div>
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Remind Before
                </p>
                <p className="text-sm font-medium text-default-800">
                  {autoReminder ? `${reminderDays} days` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-400 uppercase tracking-wider mb-1">
                  Notify
                </p>
                <p className="text-sm font-medium text-default-800">
                  Admins Only
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 4: Access & Permissions (Read-only) */}
      <Card className="shadow-sm border border-default-200">
        <CardBody className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-danger/10 text-danger">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-default-800">
                  Access & Permissions
                </h3>
                <p className="text-xs text-default-500 mt-0.5">
                  Who can view and manage payroll
                </p>
              </div>
            </div>
            <Chip size="sm" variant="flat" color="default" startContent={<Lock size={12} />}>
              System Managed
            </Chip>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                role: "Admin",
                access: "Full Access",
                color: "success",
                desc: "Run, approve, reverse payroll",
              },
              {
                role: "Accountant",
                access: "View & Run",
                color: "primary",
                desc: "Run payroll, view records",
              },
              {
                role: "Teacher",
                access: "View Own",
                color: "warning",
                desc: "View own payslips only",
              },
              {
                role: "Staff",
                access: "View Own",
                color: "warning",
                desc: "View own payslips only",
              },
            ].map((item) => (
              <div
                key={item.role}
                className="p-3.5 rounded-xl border border-default-100 bg-default-50/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-default-800">
                    {item.role}
                  </span>
                  <Chip size="sm" color={item.color} variant="flat">
                    {item.access}
                  </Chip>
                </div>
                <p className="text-xs text-default-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
