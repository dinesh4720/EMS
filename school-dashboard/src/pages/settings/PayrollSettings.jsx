import { useState, useEffect } from "react";
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

function SalaryComponents() {
  const { t } = useTranslation();
  const { salarySettings, updateSalarySettings } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalType, setModalType] = useState("earnings");
  const [itemName, setItemName] = useState("");

  const handleOpenAdd = (type) => {
    setModalType(type);
    setItemName("");
    onOpen();
  };

  const handleAdd = () => {
    if (!itemName.trim()) return;
    updateSalarySettings(modalType, "add", { name: itemName });
    onClose();
  };

  const handleRemove = (type, id) => {
    updateSalarySettings(type, "remove", { id });
  };

  const earnings = salarySettings?.earnings || [];
  const deductions = salarySettings?.deductions || [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-success-50 rounded-lg border border-success-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={18} className="text-success-600" />
            <span className="text-xs text-success-700 uppercase tracking-wider font-medium">
              {t("pages.earningsComponents")}
            </span>
          </div>
          <p className="text-2xl font-semibold text-success-700">
            {earnings.length}
          </p>
        </div>
        <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight size={18} className="text-danger-600" />
            <span className="text-xs text-danger-700 uppercase tracking-wider font-medium">
              {t("pages.deductionsComponents")}
            </span>
          </div>
          <p className="text-2xl font-semibold text-danger-700">
            {deductions.length}
          </p>
        </div>
        <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-primary-600" />
            <span className="text-xs text-primary-700 uppercase tracking-wider font-medium">
              Total Components
            </span>
          </div>
          <p className="text-2xl font-semibold text-primary-700">
            {earnings.length + deductions.length}
          </p>
        </div>
        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-warning-600" />
            <span className="text-xs text-warning-700 uppercase tracking-wider font-medium">
              Status
            </span>
          </div>
          <p className="text-lg font-semibold text-warning-700">Configured</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Card */}
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between items-center px-6 pt-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-50 rounded-lg">
                <ArrowUpRight size={20} className="text-success-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-default-800">
                  {t("pages.earningsComponents")}
                </h3>
                <p className="text-xs text-default-500">
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
              <p className="text-sm text-default-400 text-center py-6">
                No earning components added yet
              </p>
            ) : (
              <div className="space-y-1">
                {earnings.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-default-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-success-400" />
                      <span className="text-sm font-medium text-default-700">
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
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between items-center px-6 pt-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger-50 rounded-lg">
                <ArrowDownRight size={20} className="text-danger-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-default-800">
                  {t("pages.deductionsComponents")}
                </h3>
                <p className="text-xs text-default-500">
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
              <p className="text-sm text-default-400 text-center py-6">
                No deduction components added yet
              </p>
            ) : (
              <div className="space-y-1">
                {deductions.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-default-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-danger-400" />
                      <span className="text-sm font-medium text-default-700">
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
              <ArrowUpRight size={18} className="text-success-600" />
            ) : (
              <ArrowDownRight size={18} className="text-danger-600" />
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
            >
              {t("pages.add1")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function GeneralPayrollSettings() {
  const { t } = useTranslation();
  const [editingSection, setEditingSection] = useState(null);
  const [disburseDate, setDisburseDate] = useState("");
  const [tempDisburseDate, setTempDisburseDate] = useState("");
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
        setInitialLoad(false);
      } catch (error) {
        console.error("Failed to fetch payroll settings:", error);
        setInitialLoad(false);
      }
    };
    fetchPayrollSettings();
  }, []);

  const getOrdinalSuffix = (day) => {
    const num = parseInt(day);
    if (!num || num < 1 || num > 31) return "";
    const suffixes = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const handleEdit = (section) => {
    if (section === "schedule") setTempDisburseDate(disburseDate);
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
      });
      setDisburseDate(tempDisburseDate);
      toast.success(t("toast.success.payrollSettingsSavedSuccessfully"));
      setEditingSection(null);
    } catch (error) {
      console.error("Failed to save payroll settings:", error);
      toast.error(error.message || "Failed to save payroll settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = () => {
    setPaymentMethod(tempPaymentMethod);
    toast.success("Payment settings saved");
    setEditingSection(null);
  };

  const handleSaveReminders = () => {
    setAutoReminder(tempAutoReminder);
    setReminderDays(tempReminderDays);
    toast.success("Reminder settings saved");
    setEditingSection(null);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-sm font-medium text-default-800">Monthly</p>
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

export default function PayrollSettings() {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-default-800">
          {t("pages.payrollConfiguration")}
        </h2>
        <p className="text-sm text-default-500 mt-1">
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
            "group-data-[selected=true]:text-primary text-default-500 font-medium",
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
