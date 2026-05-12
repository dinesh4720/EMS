import { useEffect, useRef, useState } from "react";
import { X, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { feesApi } from "../../services/api";
import logger from "../../utils/logger";

// Phase 7 — Fees collection sheet (frosted overlay).
// Opens from FeesPage's "Collect payment" CTA OR from a row's Collect action
// with `prefilledStudentId` set.
//
// Submits via feesApi.createPayment, calls onCollected for refetch.
export default function PaymentSheet({
  isOpen,
  onClose,
  prefilledStudentId = null,
  onCollected,
}) {
  const { students = [] } = useApp();
  const cardRef = useRef(null);

  const [studentId, setStudentId] = useState("");
  const [feeHead, setFeeHead] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset / prefill when opened
  useEffect(() => {
    if (!isOpen) return;
    setStudentId(prefilledStudentId || "");
    setFeeHead("");
    setAmount("");
    setMode("cash");
    setNote("");
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Pick a student");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    setSubmitting(true);
    try {
      await feesApi.createPayment({
        studentId,
        amount: amt,
        feeHead: feeHead || undefined,
        paymentMode: mode,
        remarks: note || undefined,
        status: "paid",
        paidAt: new Date().toISOString(),
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

  const studentName = (() => {
    if (!studentId) return null;
    const s = students.find(
      (x) => String(x._id || x.id) === String(studentId)
    );
    return s?.name || null;
  })();

  return (
    <div
      className="frosted-overlay__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <form
        ref={cardRef}
        className="frosted-overlay fees-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Collect payment"
        tabIndex={-1}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="frosted-overlay__close"
          onClick={onClose}
          aria-label="Close collection sheet"
        >
          <X size={16} aria-hidden />
        </button>

        <div className="fees-overlay__hero">
          <h2 className="fees-overlay__title">Collect payment</h2>
          <p className="fees-overlay__subtitle">
            {studentName ? `For ${studentName}` : "Pick a student to begin"}
          </p>
        </div>

        <div className="fees-overlay__form">
          <div className="fees-overlay__field">
            <label className="fees-overlay__label">Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">— Select a student —</option>
              {students.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name} {s.admissionNo ? `· ${s.admissionNo}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="fees-overlay__field-row">
            <div className="fees-overlay__field">
              <label className="fees-overlay__label">Fee head</label>
              <input
                type="text"
                placeholder="Tuition · Transport · …"
                value={feeHead}
                onChange={(e) => setFeeHead(e.target.value)}
              />
            </div>
            <div className="fees-overlay__field">
              <label className="fees-overlay__label">Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="fees-overlay__field-row">
            <div className="fees-overlay__field">
              <label className="fees-overlay__label">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank-transfer">Bank transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="fees-overlay__field">
              <label className="fees-overlay__label">Note (optional)</label>
              <input
                type="text"
                placeholder="Receipt remark"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="frosted-overlay__footer">
          <span className="frosted-overlay__footer-link">
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
