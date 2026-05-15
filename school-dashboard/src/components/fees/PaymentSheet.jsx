import { useEffect, useMemo, useRef, useState } from "react";
import { X, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { feesApi } from "../../services/api";
import logger from "../../utils/logger";
import {
  feePaymentSchema,
  parseFormSchema,
  PAYMENT_MODE_VALUES,
} from "../../validators/formSchemas";

// REVAMP-27 — Right-drawer payment sheet (sticky head + sticky foot).
// Opens from FeesPage's "Collect payment" CTA OR from a row's Collect action
// with `prefilledStudentId` set. Validates against feePaymentSchema (Zod —
// mirrors backend createFeePaymentSchema) before calling feesApi.createPayment.

// BUG-fix license: use local-date (not UTC) for paymentDate so an evening-IST
// recording doesn't roll forward to tomorrow's date on the receipt.
function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resolveClassId(student) {
  if (!student) return "";
  const c = student.classId;
  if (!c) return "";
  if (typeof c === "string") return c;
  return c._id || c.id || "";
}

export default function PaymentSheet({
  isOpen,
  onClose,
  prefilledStudentId = null,
  onCollected,
}) {
  const { students = [], selectedAcademicYear, currentAcademicYear } = useApp();
  const academicYear = selectedAcademicYear || currentAcademicYear;
  const cardRef = useRef(null);

  const [studentId, setStudentId] = useState("");
  const [feeHead, setFeeHead] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(todayLocalISO());
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset / prefill when opened
  useEffect(() => {
    if (!isOpen) return;
    setStudentId(prefilledStudentId || "");
    setFeeHead("");
    setAmount("");
    setMode("cash");
    setPaymentDate(todayLocalISO());
    setTransactionId("");
    setNote("");
    setErrors({});
  }, [isOpen, prefilledStudentId]);

  // Focus the first field + body scroll lock
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }));
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const selectedStudent = useMemo(() => {
    if (!studentId) return null;
    return (
      students.find((x) => String(x._id || x.id) === String(studentId)) || null
    );
  }, [students, studentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const classId = resolveClassId(selectedStudent);
    if (!classId) {
      const msg = "Cannot determine class for this student";
      setErrors({ studentId: msg });
      toast.error(msg);
      return;
    }

    // Build payload matching feePaymentSchema exactly. Empty feeHeads array
    // skips the "sum-must-equal" refine. transactionId required for online modes.
    const payload = {
      studentId,
      classId,
      paymentDate,
      amount,
      paymentMode: mode,
      feeHeads: feeHead
        ? [{ name: feeHead, amount: Number(amount) || 0 }]
        : [],
      transactionId: transactionId || "",
      remarks: note || "",
    };

    const { success, errors: fieldErrors } = parseFormSchema(
      feePaymentSchema,
      payload
    );
    if (!success) {
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0] || "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      await feesApi.createPayment({
        ...payload,
        amount: Number(payload.amount),
        academicYear: academicYear || undefined,
      });
      toast.success("Payment recorded");
      onCollected?.();
      onClose?.();
    } catch (err) {
      logger.error("createPayment failed:", err);
      toast.error(err?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

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
        aria-label="Collect payment"
        tabIndex={-1}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fees-sheet__head">
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <h2 className="fees-sheet__title">Collect payment</h2>
            <p className="fees-sheet__subtitle">
              {selectedStudent?.name
                ? `For ${selectedStudent.name}`
                : "Pick a student to begin"}
            </p>
          </div>
          <button
            type="button"
            className="iconbtn"
            style={{ width: 28, height: 28 }}
            onClick={onClose}
            aria-label="Close collection sheet"
          >
            <X size={14} aria-hidden />
          </button>
        </div>

        <div className="fees-sheet__body">
          <div className="fees-sheet__field">
            <label className="fees-sheet__label">Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              aria-invalid={errors.studentId ? "true" : undefined}
              required
            >
              <option value="">— Select a student —</option>
              {students.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name} {s.admissionNo ? `· ${s.admissionNo}` : ""}
                </option>
              ))}
            </select>
            {errors.studentId && (
              <span className="fees-sheet__error">{errors.studentId}</span>
            )}
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Fee head (optional)</label>
              <input
                type="text"
                placeholder="Tuition · Transport · …"
                value={feeHead}
                onChange={(e) => setFeeHead(e.target.value)}
              />
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="0"
                className="mono tnum"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={errors.amount ? "true" : undefined}
                required
              />
              {errors.amount && (
                <span className="fees-sheet__error">{errors.amount}</span>
              )}
            </div>
          </div>

          <div className="fees-sheet__field-row">
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                aria-invalid={errors.paymentMode ? "true" : undefined}
              >
                {PAYMENT_MODE_VALUES.map((m) => (
                  <option key={m} value={m}>
                    {m.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Payment date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mono tnum"
              />
            </div>
          </div>

          {["online", "card", "upi", "bank_transfer"].includes(mode) && (
            <div className="fees-sheet__field">
              <label className="fees-sheet__label">Transaction ID</label>
              <input
                type="text"
                placeholder="Required for online / card / UPI / bank transfer"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                aria-invalid={errors.transactionId ? "true" : undefined}
              />
              {errors.transactionId && (
                <span className="fees-sheet__error">{errors.transactionId}</span>
              )}
            </div>
          )}

          <div className="fees-sheet__field">
            <label className="fees-sheet__label">Note (optional)</label>
            <input
              type="text"
              placeholder="Receipt remark"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="fees-sheet__foot">
          <span className="subtle" style={{ fontSize: 12 }}>
            Receipt will be generated on save
          </span>
          <button
            type="submit"
            className="btn btn--accent btn--sm"
            disabled={submitting}
          >
            <Wallet size={13} aria-hidden />{" "}
            {submitting ? "Saving…" : "Record payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
