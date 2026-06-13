import { useEffect, useRef } from "react";
import { X, Receipt } from "lucide-react";
import toast from "react-hot-toast";

import { expensesApi } from "../../services/api";
import logger from "../../utils/logger";
import { expenseSchema } from "../../validators/formSchemas";
import useZodForm from "../../hooks/useZodForm";

const CATEGORY_OPTIONS = [
  { value: "salaries", label: "Salaries" },
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "supplies", label: "Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "events", label: "Events" },
  { value: "transport", label: "Transport" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
];

const PAYMENT_MODE_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function todayLocalISO() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function getInitialValues(expense) {
  if (expense) {
    return {
      title: expense.title || "",
      amount: expense.amount ?? "",
      category: expense.category || "",
      paymentMode: expense.paymentMode || "cash",
      expenseDate: expense.expenseDate
        ? new Date(expense.expenseDate).toISOString().split("T")[0]
        : todayLocalISO(),
      description: expense.description || "",
      receiptUrl: expense.receiptUrl || "",
      vendor: expense.vendor || "",
      status: expense.status || "pending",
      approvedBy: expense.approvedBy || "",
    };
  }
  return {
    title: "",
    amount: "",
    category: "",
    paymentMode: "cash",
    expenseDate: todayLocalISO(),
    description: "",
    receiptUrl: "",
    vendor: "",
    status: "pending",
    approvedBy: "",
  };
}

export default function ExpenseModal({ isOpen, onClose, expense = null, onSaved }) {
  const cardRef = useRef(null);
  const isEdit = Boolean(expense);

  const { register, handleSubmit, reset, errors, isSubmitting, onInvalid } =
    useZodForm(expenseSchema, {
      defaultValues: getInitialValues(expense),
    });

  useEffect(() => {
    reset(getInitialValues(expense));
  }, [expense, reset]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }));
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const onSubmit = async (data) => {
    const payload = {
      title: data.title.trim(),
      amount: Number(data.amount),
      category: data.category,
      paymentMode: data.paymentMode,
      expenseDate: data.expenseDate,
      description: data.description.trim(),
      receiptUrl: data.receiptUrl.trim(),
      vendor: data.vendor.trim(),
      status: data.status,
      approvedBy: data.approvedBy.trim(),
    };

    try {
      if (isEdit) {
        await expensesApi.update(expense._id || expense.id, payload);
        toast.success("Expense updated");
      } else {
        await expensesApi.create(payload);
        toast.success("Expense created");
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      logger.error("Expense save failed:", err);
      toast.error(err?.message || "Failed to save expense");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fees-sheet__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <form
        ref={cardRef}
        className="fees-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit expense" : "Add expense"}
        tabIndex={-1}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fees-sheet__head">
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <h2 className="fees-sheet__title">{isEdit ? "Edit expense" : "Add expense"}</h2>
            <p className="fees-sheet__subtitle">
              {isEdit ? `Update details for ${expense.title}` : "Record a new school expense"}
            </p>
          </div>
          <button
            type="button"
            className="iconbtn"
            style={{ width: 28, height: 28 }}
            onClick={onClose}
            aria-label="Close sheet"
          >
            <X size={14} aria-hidden />
          </button>
        </div>

        <div className="fees-sheet__body">
          <div className="fees-sheet__field">
            <label className="fees-sheet__label">Title</label>
            <input
              type="text"
              placeholder="e.g. Monthly electricity bill"
              aria-invalid={errors.title ? "true" : undefined}
              required
              {...register("title")}
            />
            {errors.title && <span className="fees-sheet__error">{errors.title.message}</span>}
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className="mono tnum"
                aria-invalid={errors.amount ? "true" : undefined}
                required
                {...register("amount")}
              />
              {errors.amount && <span className="fees-sheet__error">{errors.amount.message}</span>}
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Date</label>
              <input
                type="date"
                className="mono tnum"
                aria-invalid={errors.expenseDate ? "true" : undefined}
                required
                {...register("expenseDate")}
              />
              {errors.expenseDate && <span className="fees-sheet__error">{errors.expenseDate.message}</span>}
            </div>
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Category</label>
              <select
                aria-invalid={errors.category ? "true" : undefined}
                required
                {...register("category")}
              >
                <option value="">— Select —</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.category && <span className="fees-sheet__error">{errors.category.message}</span>}
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Payment Mode</label>
              <select {...register("paymentMode")}>
                {PAYMENT_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="fees-sheet__field">
            <label className="fees-sheet__label">Description</label>
            <textarea
              rows={3}
              placeholder="Optional details about this expense"
              aria-invalid={errors.description ? "true" : undefined}
              style={{ resize: "vertical" }}
              {...register("description")}
            />
            {errors.description && <span className="fees-sheet__error">{errors.description.message}</span>}
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Vendor</label>
              <input
                type="text"
                placeholder="Vendor or payee name"
                aria-invalid={errors.vendor ? "true" : undefined}
                {...register("vendor")}
              />
              {errors.vendor && <span className="fees-sheet__error">{errors.vendor.message}</span>}
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Receipt URL</label>
              <input
                type="url"
                placeholder="https://..."
                aria-invalid={errors.receiptUrl ? "true" : undefined}
                {...register("receiptUrl")}
              />
              {errors.receiptUrl && <span className="fees-sheet__error">{errors.receiptUrl.message}</span>}
            </div>
          </div>

          {isEdit && (
            <div className="fees-sheet__field-row">
              <div className="fees-sheet__field">
                <label className="fees-sheet__label">Status</label>
                <select {...register("status")}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fees-sheet__field">
                <label className="fees-sheet__label">Approved By</label>
                <input
                  type="text"
                  placeholder="Name of approver"
                  {...register("approvedBy")}
                />
              </div>
            </div>
          )}
        </div>

        <div className="fees-sheet__foot">
          <span className="subtle" style={{ fontSize: 12 }}>
            {isEdit ? "Changes will be saved on submit" : "Expense will be recorded immediately"}
          </span>
          <button
            type="submit"
            className="btn btn--accent btn--sm"
            disabled={isSubmitting}
          >
            <Receipt size={13} aria-hidden />{" "}
            {isSubmitting ? "Saving…" : isEdit ? "Update expense" : "Add expense"}
          </button>
        </div>
      </form>
    </div>
  );
}
