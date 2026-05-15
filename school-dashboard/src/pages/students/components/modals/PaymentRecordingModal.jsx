import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { IndianRupee, Calendar as CalendarIcon } from "lucide-react";
import { z } from "zod";
import Modal from "../../../../components/ui/Modal";
import { toDateInputValue } from "../../../../utils/dateFormatter";
import { formatCurrency } from "../../../../utils/numberFormatter";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online / UPI" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const buildPaymentSchema = (totalBalance) =>
  z.object({
    amount: z
      .number({ invalid_type_error: "Please enter a valid amount" })
      .gt(0, "Amount must be greater than 0")
      .refine(
        (v) => totalBalance == null || v <= totalBalance,
        `Amount exceeds outstanding balance of ${formatCurrency(totalBalance || 0)}`
      ),
    paymentMode: z.enum([
      "cash",
      "online",
      "card",
      "cheque",
      "bank_transfer",
    ]),
    date: z
      .string()
      .min(1, "Payment date is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
    notes: z.string().max(300).optional(),
  });

const emptyForm = () => ({
  amount: "",
  paymentMode: "cash",
  date: toDateInputValue(new Date()),
  notes: "",
});

export default function PaymentRecordingModal({
  isOpen,
  onClose,
  studentFeeStructure,
  onRecordPayment,
}) {
  const { t } = useTranslation();
  const [paymentForm, setPaymentForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const submitGuard = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentForm({
        amount: studentFeeStructure?.totalBalance
          ? studentFeeStructure.totalBalance.toString()
          : "",
        paymentMode: "cash",
        date: toDateInputValue(new Date()),
        notes: "",
      });
      setErrors({});
      submitGuard.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const set = (key, value) => {
    setPaymentForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const totalBalance = studentFeeStructure?.totalBalance;

  const handleRecordPayment = async () => {
    if (submitGuard.current) return;
    const schema = buildPaymentSchema(totalBalance);
    const parsed = schema.safeParse({
      amount: parseFloat(paymentForm.amount),
      paymentMode: paymentForm.paymentMode,
      date: paymentForm.date,
      notes: (paymentForm.notes || "").trim(),
    });
    if (!parsed.success) {
      const next = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    submitGuard.current = true;
    setIsRecording(true);
    try {
      await onRecordPayment({
        amount: parsed.data.amount.toString(),
        paymentMode: parsed.data.paymentMode,
        date: parsed.data.date,
        notes: parsed.data.notes || "",
      });
      onClose();
    } catch (error) {
      toast.error(
        error?.message ||
          t(
            "students.profile.overview.failedToRecordPayment",
            "Failed to record payment"
          )
      );
      submitGuard.current = false;
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        "students.profile.overview.recordFeePayment",
        "Record fee payment"
      )}
      description={`Outstanding ${formatCurrency(totalBalance || 0)}`}
      size="md"
      isDismissable={!isRecording}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isRecording}
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleRecordPayment}
            disabled={isRecording || !paymentForm.amount}
            aria-busy={isRecording || undefined}
          >
            {isRecording
              ? "Recording…"
              : t("students.profile.overview.recordPayment", "Record Payment")}
          </button>
        </>
      }
    >
      <div className="section" style={{ margin: 0 }}>
        <div className="fgrid">
          <div className="field span-2">
            <label className="field__label" htmlFor="pr-amount">
              {t("students.profile.overview.amount", "Amount")}
              <span className="req" aria-hidden>
                *
              </span>
            </label>
            <div className="field__icon-wrap">
              <IndianRupee
                size={12}
                className="field__icon"
                aria-hidden
              />
              <input
                id="pr-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className={`input input--with-icon mono tnum ${errors.amount ? "input--err" : ""}`}
                value={paymentForm.amount}
                onChange={(e) => set("amount", e.target.value)}
                aria-invalid={errors.amount ? "true" : undefined}
              />
            </div>
            {errors.amount ? (
              <span
                className="field__hint"
                style={{ color: "var(--danger)" }}
              >
                {errors.amount}
              </span>
            ) : (
              <span className="field__hint">
                {t("students.profile.overview.outstanding", "Outstanding")}:{" "}
                {formatCurrency(totalBalance || 0)}
              </span>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="pr-mode">
              {t(
                "students.profile.overview.paymentMethod",
                "Payment method"
              )}
              <span className="req" aria-hidden>
                *
              </span>
            </label>
            <select
              id="pr-mode"
              className="select"
              value={paymentForm.paymentMode}
              onChange={(e) => set("paymentMode", e.target.value)}
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="pr-date">
              {t("students.profile.overview.paymentDate", "Payment date")}
              <span className="req" aria-hidden>
                *
              </span>
            </label>
            <div className="field__icon-wrap">
              <CalendarIcon
                size={12}
                className="field__icon"
                aria-hidden
              />
              <input
                id="pr-date"
                type="date"
                className={`input input--with-icon mono tnum ${errors.date ? "input--err" : ""}`}
                value={paymentForm.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            {errors.date ? (
              <span
                className="field__hint"
                style={{ color: "var(--danger)" }}
              >
                {errors.date}
              </span>
            ) : null}
          </div>

          <div className="field span-2">
            <label className="field__label" htmlFor="pr-notes">
              {t("students.profile.overview.notes", "Notes / Memo")}
            </label>
            <textarea
              id="pr-notes"
              className="textarea"
              rows={2}
              maxLength={300}
              value={paymentForm.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={t(
                "students.profile.overview.enterNotes",
                "Add any notes about this payment…"
              )}
            />
            <div
              className="row"
              style={{ justifyContent: "space-between", gap: 8 }}
            >
              <span className="field__hint">
                {t(
                  "students.profile.overview.receiptAutoGenerated",
                  "Receipt number will be auto-generated upon payment."
                )}
              </span>
              <span className="field__hint mono tnum">
                {paymentForm.notes.length}/300
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
