import { Card, CardBody, Button, Input, Chip, Switch } from "@heroui/react";
import { Bell, Pencil, X, Save } from "lucide-react";

export default function RemindersCard({
  editingSection,
  loading,
  autoReminder,
  tempAutoReminder,
  reminderDays,
  tempReminderDays,
  onTempAutoReminderChange,
  onTempReminderDaysChange,
  onEdit,
  onCancel,
  onSave,
}) {
  const isEditing = editingSection === "reminders";

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
              onPress={() => onEdit("reminders")}
              isDisabled={editingSection !== null}
              startContent={<Pencil size={14} />}
            >
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
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
                onValueChange={onTempAutoReminderChange}
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
                  onValueChange={onTempReminderDaysChange}
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
  );
}
