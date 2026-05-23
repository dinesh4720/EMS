import { useState, useEffect, useCallback } from "react";
import {
  Card, CardBody, CardHeader, Button, Input, Chip, Divider,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Tabs, Tab, Switch, Select, SelectItem
} from "@heroui/react";
import {
  Plus, Trash2, Edit2, IndianRupee, Users, Settings, FileText,
  Calendar, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  CheckCircle, Save, Clock, Pencil, X, Bell, Lock, Shield,
  CreditCard, Banknote, Building2
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { settingsApi } from "../../services/api";
import toast from "react-hot-toast";
import StaffPayroll from "../../pages/staffs/StaffPayroll";
import SalaryTemplates from "./SalaryTemplates";
import { useTranslation } from "react-i18next";
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import logger from '../../utils/logger';


function SalaryComponents() {
  const { t } = useTranslation();
  const { salarySettings, updateSalarySettings } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();
  const [modalType, setModalType] = useState("earnings");
  const [itemName, setItemName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = (type) => {
    setModalType(type);
    setItemName("");
    onOpen();
  };

  const handleAdd = async () => {
    if (!itemName.trim()) return;
    setSaving(true);
    try {
      await updateSalarySettings(modalType, "add", { name: itemName });
      onClose();
    } catch {
      // Error toast already shown by useSalaryState; keep modal open on failure
    } finally {
      setSaving(false);
    }
  };

  // [AUDIT-557] Added confirmation before removing salary components
  const handleRemove = useCallback((type, id) => {
    showConfirm({
      title: 'Remove Salary Component',
      message: 'Are you sure you want to remove this salary component? This cannot be undone.',
      variant: 'danger',
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          await updateSalarySettings(type, "remove", { id });
        } catch {
          // Error toast already shown by useSalaryState
        }
      },
    });
  }, [showConfirm, updateSalarySettings]);

  const earnings = salarySettings?.earnings || [];
  const deductions = salarySettings?.deductions || [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--ok-bg)] rounded-lg border border-[var(--ok-border)]">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={18} className="text-[var(--ok)]" />
            <span className="text-xs text-[var(--ok)] uppercase tracking-wider font-medium">
              {t("pages.earningsComponents")}
            </span>
          </div>
          <p className="text-2xl font-semibold text-[var(--ok)]">
            {earnings.length}
          </p>
        </div>
        <div className="p-4 bg-[var(--danger-bg)] rounded-lg border border-[var(--danger-border)]">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight size={18} className="text-[var(--danger)]" />
            <span className="text-xs text-[var(--danger)] uppercase tracking-wider font-medium">
              {t("pages.deductionsComponents")}
            </span>
          </div>
          <p className="text-2xl font-semibold text-[var(--danger)]">
            {deductions.length}
          </p>
        </div>
        <div className="p-4 bg-[var(--accent-bg)] rounded-lg border border-[var(--accent-border)]">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--accent)] uppercase tracking-wider font-medium">
              Total Components
            </span>
          </div>
          <p className="text-2xl font-semibold text-[var(--accent)]">
            {earnings.length + deductions.length}
          </p>
        </div>
        <div className="p-4 bg-[var(--warn-bg)] rounded-lg border border-[var(--warn-border)]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-[var(--warn)]" />
            <span className="text-xs text-[var(--warn)] uppercase tracking-wider font-medium">
              Status
            </span>
          </div>
          <p className="text-lg font-semibold text-[var(--warn)]">Configured</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Card */}
        <Card className="shadow-sm border border-border-token">
          <CardHeader className="flex justify-between items-center px-6 pt-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--ok-bg)] rounded-lg">
                <ArrowUpRight size={20} className="text-[var(--ok)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-fg">
                  {t("pages.earningsComponents")}
                </h3>
                <p className="text-xs text-fg-muted">
                  {t("pages.defineSalaryAdditions")}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              color="success"
              variant="flat"
              startContent={<Plus size={14} />}
              onPress={() => handleOpenAdd("earnings")}
            >
              Add
            </Button>
          </CardHeader>
          <Divider className="mt-4" />
          <CardBody className="px-6 py-4">
            {earnings.length === 0 ? (
              <p className="text-sm text-fg-faint text-center py-6">
                No earning components added yet
              </p>
            ) : (
              <div className="space-y-1">
                {earnings.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-surface-2 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--ok-bg)]" />
                      <span className="text-sm font-medium text-fg">
                        {item.name}
                      </span>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onPress={() => handleRemove("earnings", item.id)}
                      title={t("pages.removeComponent")}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Deductions Card */}
        <Card className="shadow-sm border border-border-token">
          <CardHeader className="flex justify-between items-center px-6 pt-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--danger-bg)] rounded-lg">
                <ArrowDownRight size={20} className="text-[var(--danger)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-fg">
                  {t("pages.deductionsComponents")}
                </h3>
                <p className="text-xs text-fg-muted">
                  {t("pages.defineSalaryDeductions")}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={<Plus size={14} />}
              onPress={() => handleOpenAdd("deductions")}
            >
              Add
            </Button>
          </CardHeader>
          <Divider className="mt-4" />
          <CardBody className="px-6 py-4">
            {deductions.length === 0 ? (
              <p className="text-sm text-fg-faint text-center py-6">
                No deduction components added yet
              </p>
            ) : (
              <div className="space-y-1">
                {deductions.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-surface-2 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--danger-bg)]" />
                      <span className="text-sm font-medium text-fg">
                        {item.name}
                      </span>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onPress={() => handleRemove("deductions", item.id)}
                      title={t("pages.removeComponent")}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Add Component Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            {modalType === "earnings" ? (
              <ArrowUpRight size={18} className="text-[var(--ok)]" />
            ) : (
              <ArrowDownRight size={18} className="text-[var(--danger)]" />
            )}
            Add {modalType === "earnings" ? "Earning" : "Deduction"} Component
          </ModalHeader>
          <ModalBody>
            <Input
              label={t("pages.componentName")}
              placeholder={t("settings.payrollComponentPlaceholder")}
              value={itemName}
              onValueChange={setItemName}
              variant="bordered"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t("pages.cancel2")}
            </Button>
            <Button
              color="primary"
              onPress={handleAdd}
              isDisabled={!itemName.trim()}
              isLoading={saving}
            >
              {t("pages.add1")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </div>
  );
}

const PAYMENT_METHOD_LABELS = {
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  cash: "Cash",
  upi: "UPI",
};

const CYCLE_LABELS = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

function GeneralPayrollSettings() {
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
    let cancelled = false;
    const fetchPayrollSettings = async () => {
      try {
        const data = await settingsApi.getPayrollSettings();
        if (cancelled) return;
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
        if (cancelled) return;
        logger.error("Failed to fetch payroll settings:", error);
        setInitialLoad(false);
      }
    };
    fetchPayrollSettings();
    return () => { cancelled = true; };
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

  return (
    <div className="space-y-5">
      {/* Section 1: Payroll Schedule */}
      <Card
        className={`shadow-sm border transition-all duration-200 ${
          editingSection === "schedule"
            ? "border-primary ring-1 ring-primary"
            : "border-border-token"
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
                <h3 className="text-base font-semibold text-fg">
                  Payroll Schedule
                </h3>
                <p className="text-xs text-fg-muted mt-0.5">
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
                  inputWrapper: "bg-surface",
                }}
                endContent={
                  <span className="text-fg-faint text-xs">day of month</span>
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
                  trigger: "bg-surface",
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
                    <div className="p-4 bg-[var(--accent-bg)] rounded-xl border border-[var(--accent-border)] w-full">
                      <p className="text-xs text-[var(--accent)] font-medium uppercase tracking-wider mb-1">
                        Preview
                      </p>
                      <p className="text-lg font-semibold text-[var(--accent)]">
                        {getOrdinalSuffix(tempDisburseDate)} of every month
                      </p>
                      <p className="text-xs text-[var(--accent)] mt-1">
                        Salaries will be processed on this date
                      </p>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
                  Disburse Date
                </p>
                <p className="text-sm font-medium text-fg">
                  {disburseDate
                    ? `${getOrdinalSuffix(disburseDate)} of every month`
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
                  Payroll Cycle
                </p>
                <p className="text-sm font-medium text-fg">
                  {CYCLE_LABELS[payrollCycle] || "Monthly"}
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
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
            : "border-border-token"
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
                <h3 className="text-base font-semibold text-fg">
                  Payment Method
                </h3>
                <p className="text-xs text-fg-muted mt-0.5">
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
                  trigger: "bg-surface",
                }}
              >
                <SelectItem key="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem key="cheque">Cheque</SelectItem>
                <SelectItem key="cash">Cash</SelectItem>
                <SelectItem key="upi">UPI</SelectItem>
              </Select>
              <div className="flex items-center">
                <div className="p-4 bg-[var(--ok-bg)] rounded-xl border border-[var(--ok-border)] w-full">
                  <p className="text-xs text-[var(--ok)] font-medium uppercase tracking-wider mb-1">
                    Selected Method
                  </p>
                  <p className="text-lg font-semibold text-[var(--ok)]">
                    {PAYMENT_METHOD_LABELS[tempPaymentMethod]}
                  </p>
                  <p className="text-xs text-[var(--ok)] mt-1">
                    All new payroll runs will use this method
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
                  Payment Method
                </p>
                <p className="text-sm font-medium text-fg">
                  {PAYMENT_METHOD_LABELS[paymentMethod]}
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
                  Processing
                </p>
                <p className="text-sm font-medium text-fg">
                  Manual Approval
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
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
            : "border-border-token"
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
                <h3 className="text-base font-semibold text-fg">
                  Reminders & Notifications
                </h3>
                <p className="text-xs text-fg-muted mt-0.5">
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
              <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-fg">
                    Auto Payroll Reminder
                  </p>
                  <p className="text-xs text-fg-muted mt-0.5">
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
                      inputWrapper: "bg-surface",
                    }}
                    endContent={
                      <span className="text-fg-faint text-xs">days</span>
                    }
                    description="How many days before payday to send reminders"
                  />
                  <div className="flex items-center">
                    <div className="p-4 bg-[var(--warn-bg)] rounded-xl border border-[var(--warn-border)] w-full">
                      <p className="text-xs text-[var(--warn)] font-medium uppercase tracking-wider mb-1">
                        Reminder Preview
                      </p>
                      <p className="text-sm font-semibold text-[var(--warn)]">
                        {tempReminderDays} day
                        {parseInt(tempReminderDays) !== 1 ? "s" : ""} before
                        payday
                      </p>
                      <p className="text-xs text-[var(--warn)] mt-1">
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
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
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
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
                  Remind Before
                </p>
                <p className="text-sm font-medium text-fg">
                  {autoReminder ? `${reminderDays} days` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-faint uppercase tracking-wider mb-1">
                  Notify
                </p>
                <p className="text-sm font-medium text-fg">
                  Admins Only
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 4: Access & Permissions (Read-only) */}
      <Card className="shadow-sm border border-border-token">
        <CardBody className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-danger/10 text-danger">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-fg">
                  Access & Permissions
                </h3>
                <p className="text-xs text-fg-muted mt-0.5">
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
                className="p-3.5 rounded-xl border border-divider bg-surface-2/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-fg">
                    {item.role}
                  </span>
                  <Chip size="sm" color={item.color} variant="flat">
                    {item.access}
                  </Chip>
                </div>
                <p className="text-xs text-fg-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function PayrollSettings() {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-fg">
          {t("pages.payrollConfiguration")}
        </h2>
        <p className="text-sm text-fg-muted mt-1">
          Manage payroll schedules, salary structures, templates, and
          components
        </p>
      </div>

      <Tabs
        size="md"
        variant="underlined"
        color="primary"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-10",
          tabContent:
            "group-data-[selected=true]:text-primary text-fg-muted font-medium",
        }}
      >
        <Tab
          key="general"
          title={
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span>{t("pages.generalSettings")}</span>
            </div>
          }
        >
          <div className="pt-4">
            <GeneralPayrollSettings />
          </div>
        </Tab>
        <Tab
          key="salaries"
          title={
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{t("pages.staffSalariesCtc")}</span>
            </div>
          }
        >
          <div className="pt-4">
            <StaffPayroll />
          </div>
        </Tab>
        <Tab
          key="templates"
          title={
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span>{t("pages.salaryTemplates")}</span>
            </div>
          }
        >
          <div className="pt-4">
            <SalaryTemplates />
          </div>
        </Tab>
        <Tab
          key="components"
          title={
            <div className="flex items-center gap-2">
              <Wallet size={16} />
              <span>{t("pages.salaryComponents")}</span>
            </div>
          }
        >
          <div className="pt-4">
            <SalaryComponents />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
