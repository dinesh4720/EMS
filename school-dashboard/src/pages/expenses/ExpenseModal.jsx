import { useEffect, useRef, useState } from "react";
import { X, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import { expensesApi } from "../../services/api";
import logger from "../../utils/logger";

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

function validateExpense(data) {
  const errors = {};
  if (!data.title?.trim()) errors.title = "Title is required";
  if (data.title?.trim().length > 200) errors.title = "Title must be under 200 characters";
  if (data.amount === "" || data.amount == null || Number(data.amount) < 0) {
    errors.amount = "Amount must be 0 or greater";
  }
  if (!data.category) errors.category = "Category is required";
  if (!data.expenseDate) errors.expenseDate = "Date is required";
  if (data.description?.length > 1000) errors.description = "Description must be under 1000 characters";
  if (data.vendor?.length > 200) errors.vendor = "Vendor must be under 200 characters";
  if (data.receiptUrl && data.receiptUrl !== "") {
    try {
      new URL(data.receiptUrl);
    } catch {
      errors.receiptUrl = "Please enter a valid URL";
    }
  }
  return errors;
}

export default function ExpenseModal({ isOpen, onClose, expense = null, onSaved }) {
  const cardRef = useRef(null);
  const isEdit = Boolean(expense);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [expenseDate, setExpenseDate] = useState(todayLocalISO());
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [vendor, setVendor] = useState("");
  const [status, setStatus] = useState("pending");
  const [approvedBy, setApprovedBy] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      setTitle(expense.title || "");
      setAmount(expense.amount ?? "");
      setCategory(expense.category || "");
      setPaymentMode(expense.paymentMode || "cash");
      setExpenseDate(
        expense.expenseDate
          ? new Date(expense.expenseDate).toISOString().split("T")[0]
          : todayLocalISO()
      );
      setDescription(expense.description || "");
      setReceiptUrl(expense.receiptUrl || "");
      setVendor(expense.vendor || "");
      setStatus(expense.status || "pending");
      setApprovedBy(expense.approvedBy || "");
    } else {
      setTitle("");
      setAmount("");
      setCategory("");
      setPaymentMode("cash");
      setExpenseDate(todayLocalISO());
      setDescription("");
      setReceiptUrl("");
      setVendor("");
      setStatus("pending");
      setApprovedBy("");
    }
    setErrors({});
  }, [isOpen, expense]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      amount: Number(amount),
      category,
      paymentMode,
      expenseDate,
      description: description.trim(),
      receiptUrl: receiptUrl.trim(),
      vendor: vendor.trim(),
      status,
      approvedBy: approvedBy.trim(),
    };
    const fieldErrors = validateExpense(payload, isEdit);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0] || "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
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
        onSubmit={handleSubmit}
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={errors.title ? "true" : undefined}
              required
            />
            {errors.title && <span className="fees-sheet__error">{errors.title}</span>}
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={errors.amount ? "true" : undefined}
                required
              />
              {errors.amount && <span className="fees-sheet__error">{errors.amount}</span>}
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="mono tnum"
                aria-invalid={errors.expenseDate ? "true" : undefined}
                required
              />
              {errors.expenseDate && <span className="fees-sheet__error">{errors.expenseDate}</span>}
            </div>
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-invalid={errors.category ? "true" : undefined}
                required
              >
                <option value="">— Select —</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.category && <span className="fees-sheet__error">{errors.category}</span>}
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={errors.description ? "true" : undefined}
              style={{ resize: "vertical" }}
            />
            {errors.description && <span className="fees-sheet__error">{errors.description}</span>}
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Vendor</label>
              <input
                type="text"
                placeholder="Vendor or payee name"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                aria-invalid={errors.vendor ? "true" : undefined}
              />
              {errors.vendor && <span className="fees-sheet__error">{errors.vendor}</span>}
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Receipt URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                aria-invalid={errors.receiptUrl ? "true" : undefined}
              />
              {errors.receiptUrl && <span className="fees-sheet__error">{errors.receiptUrl}</span>}
            </div>
          </div>

          {isEdit && (
            <div className="fees-sheet__field-row">
              <div className="fees-sheet__field">
                <label className="fees-sheet__label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
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
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
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
            disabled={submitting}
          >
            <Receipt size={13} aria-hidden />{" "}
            {submitting ? "Saving…" : isEdit ? "Update expense" : "Add expense"}
          </button>
        </div>
      </form>
    </div>
  );
}
