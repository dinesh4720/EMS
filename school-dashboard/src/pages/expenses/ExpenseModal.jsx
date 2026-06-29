import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Receipt } from "lucide-react";
import toast from "react-hot-toast";

import { expensesApi } from "../../services/api";
import logger from "../../utils/logger";
import { expenseSchema } from "../../validators/formSchemas";
import useZodForm from "../../hooks/useZodForm";

const CATEGORY_OPTIONS = [
  "salaries",
  "utilities",
  "maintenance",
  "supplies",
  "equipment",
  "events",
  "transport",
  "marketing",
  "other",
];

const PAYMENT_MODE_OPTIONS = [
  "cash",
  "cheque",
  "bank_transfer",
  "upi",
  "other",
];

const PAYMENT_MODE_KEYS = {
  cash: "cash",
  cheque: "cheque",
  bank_transfer: "bankTransfer",
  upi: "upi",
  other: "other",
};

const STATUS_OPTIONS = ["pending", "approved", "rejected"];

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
  const { t } = useTranslation();
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
        toast.success(t("expenses.toast.updated"));
      } else {
        await expensesApi.create(payload);
        toast.success(t("expenses.toast.created"));
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      logger.error("Expense save failed:", err);
      toast.error(err?.message || t("expenses.toast.saveFailed"));
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
        aria-label={isEdit ? t("expenses.form.editTitle") : t("expenses.form.addTitle")}
        tabIndex={-1}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fees-sheet__head">
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <h2 className="fees-sheet__title">{isEdit ? t("expenses.form.editTitle") : t("expenses.form.addTitle")}</h2>
            <p className="fees-sheet__subtitle">
              {isEdit ? t("expenses.form.editSubtitle", { title: expense.title }) : t("expenses.form.addSubtitle")}
            </p>
          </div>
          <button
            type="button"
            className="iconbtn"
            style={{ width: 28, height: 28 }}
            onClick={onClose}
            aria-label={t("expenses.form.closeAria")}
          >
            <X size={14} aria-hidden />
          </button>
        </div>

        <div className="fees-sheet__body">
          <div className="fees-sheet__field">
            <label className="fees-sheet__label">{t("expenses.form.titleLabel")}</label>
            <input
              type="text"
              placeholder={t("expenses.form.titlePlaceholder")}
              aria-invalid={errors.title ? "true" : undefined}
              required
              {...register("title")}
            />
            {errors.title && <span className="fees-sheet__error">{errors.title.message}</span>}
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">{t("expenses.form.amountLabel")}</label>
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
              <label className="fees-sheet__label">{t("expenses.form.dateLabel")}</label>
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
              <label className="fees-sheet__label">{t("expenses.form.categoryLabel")}</label>
              <select
                aria-invalid={errors.category ? "true" : undefined}
                required
                {...register("category")}
              >
                <option value="">{t("expenses.form.categoryPlaceholder")}</option>
                {CATEGORY_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`expenses.categories.${value}`)}
                  </option>
                ))}
              </select>
              {errors.category && <span className="fees-sheet__error">{errors.category.message}</span>}
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">{t("expenses.form.paymentModeLabel")}</label>
              <select {...register("paymentMode")}>
                {PAYMENT_MODE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`expenses.form.paymentModes.${PAYMENT_MODE_KEYS[value]}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="fees-sheet__field">
            <label className="fees-sheet__label">{t("expenses.form.descriptionLabel")}</label>
            <textarea
              rows={3}
              placeholder={t("expenses.form.descriptionPlaceholder")}
              aria-invalid={errors.description ? "true" : undefined}
              style={{ resize: "vertical" }}
              {...register("description")}
            />
            {errors.description && <span className="fees-sheet__error">{errors.description.message}</span>}
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">{t("expenses.form.vendorLabel")}</label>
              <input
                type="text"
                placeholder={t("expenses.form.vendorPlaceholder")}
                aria-invalid={errors.vendor ? "true" : undefined}
                {...register("vendor")}
              />
              {errors.vendor && <span className="fees-sheet__error">{errors.vendor.message}</span>}
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">{t("expenses.form.receiptUrlLabel")}</label>
              <input
                type="url"
                placeholder={t("expenses.form.receiptUrlPlaceholder")}
                aria-invalid={errors.receiptUrl ? "true" : undefined}
                {...register("receiptUrl")}
              />
              {errors.receiptUrl && <span className="fees-sheet__error">{errors.receiptUrl.message}</span>}
            </div>
          </div>

          {isEdit && (
            <div className="fees-sheet__field-row">
              <div className="fees-sheet__field">
                <label className="fees-sheet__label">{t("expenses.form.statusLabel")}</label>
                <select {...register("status")}>
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`expenses.statuses.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fees-sheet__field">
                <label className="fees-sheet__label">{t("expenses.form.approvedByLabel")}</label>
                <input
                  type="text"
                  placeholder={t("expenses.form.approvedByPlaceholder")}
                  {...register("approvedBy")}
                />
              </div>
            </div>
          )}
        </div>

        <div className="fees-sheet__foot">
          <span className="subtle" style={{ fontSize: 12 }}>
            {isEdit ? t("expenses.form.footEdit") : t("expenses.form.footAdd")}
          </span>
          <button
            type="submit"
            className="btn btn--accent btn--sm"
            disabled={isSubmitting}
          >
            <Receipt size={13} aria-hidden />{" "}
            {isSubmitting ? t("expenses.form.saving") : isEdit ? t("expenses.form.updateBtn") : t("expenses.form.addBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}
