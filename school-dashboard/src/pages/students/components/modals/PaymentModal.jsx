import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { IndianRupee, Calendar as CalendarIcon } from "lucide-react";
import { z } from "zod";
import Modal from "../../../../components/ui/Modal";
import { useAppMeta } from "../../../../context/AppContext";
import { toTodayDateString, formatMonthYear } from "../../../../utils/dateFormatter";
import { formatCurrency } from "../../../../utils/numberFormatter";
import logger from "../../../../utils/logger";

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
  date: toTodayDateString(),
  notes: "",
});

export default function PaymentModal({
  isOpen,
  onClose,
  student,
  studentFeeStructure,
  onPaymentComplete,
}) {
  const { t } = useTranslation();
  const { currentAcademicYear } = useAppMeta();
  const [paymentForm, setPaymentForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const submitGuard = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentForm({
        amount: studentFeeStructure?.totalBalance
          ? studentFeeStructure.totalBalance.toString()
          : "",
        paymentMode: "cash",
        date: toTodayDateString(),
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
    setIsLoading(true);
    const loadingToast = toast.loading(t("toast.loading.processingPayment"));

    try {
      const { studentFeesApi } = await import("../../../../services/api");
      const paymentData = {
        studentId: student.id,
        studentName: student.name,
        classId:
          typeof student.classId === "object"
            ? student.classId._id
            : student.classId,
        academicYear: student?.academicYear || currentAcademicYear,
        paymentDate: parsed.data.date,
        amount: parsed.data.amount,
        paymentMode: parsed.data.paymentMode,
        feeHeads: [
          {
            period: parsed.data.date ? formatMonthYear(parsed.data.date) : "—",
            amount: parsed.data.amount,
          },
        ],
        remarks:
          parsed.data.notes ||
          `Fee payment via ${parsed.data.paymentMode}`,
        collectedBy: null,
      };

      await studentFeesApi.recordPayment(student.id, paymentData);
      toast.success("Payment recorded successfully", { id: loadingToast });
      onPaymentComplete?.();
      onClose();
    } catch (error) {
      logger.error("Payment error:", error);
      toast.error(
        "Failed to record payment: " + (error.message || "Unknown error"),
        { id: loadingToast }
      );
      submitGuard.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("pages.recordFeePayment1", "Record fee payment")}
      description={
        student?.name
          ? `${student.name} · Outstanding ${formatCurrency(totalBalance || 0)}`
          : undefined
      }
      size="md"
      isDismissable={!isLoading}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("pages.cancel2", "Cancel")}
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleRecordPayment}
            disabled={isLoading || !paymentForm.amount}
            aria-busy={isLoading || undefined}
          >
            {isLoading ? "Recording…" : "Record Payment"}
          </button>
        </>
      }
    >
      <div className="section" style={{ margin: 0 }}>
        <div className="fgrid">
          <div className="field span-2">
            <label className="field__label" htmlFor="payment-amount">
              {t("pages.amount1", "Amount")}
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
                id="payment-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className={`input input--with-icon mono tnum ${errors.amount ? "input--err" : ""}`}
                value={paymentForm.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0.00"
                aria-invalid={errors.amount ? "true" : undefined}
                aria-describedby={errors.amount ? "payment-amount-err" : "payment-amount-hint"}
              />
            </div>
            {errors.amount ? (
              <span
                id="payment-amount-err"
                className="field__hint"
                style={{ color: "var(--danger)" }}
              >
                {errors.amount}
              </span>
            ) : (
              <span id="payment-amount-hint" className="field__hint">
                Outstanding: {formatCurrency(totalBalance || 0)}
              </span>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="payment-mode">
              {t("pages.paymentMethod1", "Payment method")}
              <span className="req" aria-hidden>
                *
              </span>
            </label>
            <select
              id="payment-mode"
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
            <label className="field__label" htmlFor="payment-date">
              {t("pages.paymentDate1", "Payment date")}
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
                id="payment-date"
                type="date"
                className={`input input--with-icon mono tnum ${errors.date ? "input--err" : ""}`}
                value={paymentForm.date}
                onChange={(e) => set("date", e.target.value)}
                aria-invalid={errors.date ? "true" : undefined}
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
            <label className="field__label" htmlFor="payment-notes">
              {t("pages.notes", "Notes / Memo")}
            </label>
            <textarea
              id="payment-notes"
              className="textarea"
              rows={2}
              value={paymentForm.notes}
              maxLength={300}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={t(
                "pages.enterNotes",
                "Add any notes about this payment…"
              )}
            />
            <div
              className="row"
              style={{ justifyContent: "space-between", gap: 8 }}
            >
              <span className="field__hint">
                {t(
                  "pages.receiptAutoGenerated",
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
