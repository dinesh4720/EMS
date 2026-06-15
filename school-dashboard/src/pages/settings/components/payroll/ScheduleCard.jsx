import { Card, CardBody, Button, Input, Select, SelectItem, Chip } from "@heroui/react";
import { Calendar, Pencil, X, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CYCLE_LABELS } from "./constants";

export default function ScheduleCard({
  editingSection,
  initialLoad,
  loading,
  disburseDate,
  tempDisburseDate,
  payrollCycle,
  tempPayrollCycle,
  onTempDisburseDateChange,
  onTempPayrollCycleChange,
  onEdit,
  onCancel,
  onSave,
  getOrdinalSuffix,
}) {
  const { t } = useTranslation();
  const isEditing = editingSection === "schedule";

  return (
    <Card
      className={`shadow-sm border transition-all duration-200 ${
        isEditing
          ? "border-primary ring-1 ring-primary"
          : "border-border-token"
      }`}
    >
      <CardBody className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl transition-colors ${
                isEditing
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
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                onPress={onCancel}
                startContent={<X size={14} />}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                color="primary"
                onPress={onSave}
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
              onPress={() => onEdit("schedule")}
              isDisabled={editingSection !== null || initialLoad}
              startContent={<Pencil size={14} />}
            >
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              type="number"
              label={t("pages.payrollDisburseDate")}
              placeholder={t("settings.disburseDatePlaceholder")}
              min="1"
              max="31"
              value={tempDisburseDate}
              onValueChange={onTempDisburseDateChange}
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
              onSelectionChange={(keys) => onTempPayrollCycleChange([...keys][0])}
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
  );
}
