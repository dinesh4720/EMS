import { Card, CardBody, Button, Select, SelectItem, Chip } from "@heroui/react";
import { Banknote, Pencil, X, Save } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "./constants";

export default function PaymentMethodCard({
  editingSection,
  loading,
  paymentMethod,
  tempPaymentMethod,
  onTempPaymentMethodChange,
  onEdit,
  onCancel,
  onSave,
}) {
  const isEditing = editingSection === "payment";

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
              onPress={() => onEdit("payment")}
              isDisabled={editingSection !== null}
              startContent={<Pencil size={14} />}
            >
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Default Payment Method"
              selectedKeys={[tempPaymentMethod]}
              onSelectionChange={(keys) =>
                onTempPaymentMethodChange(Array.from(keys)[0])
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
  );
}
