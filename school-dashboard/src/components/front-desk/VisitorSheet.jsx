import { useEffect, useRef, useState } from "react";
import { X, Users } from "lucide-react";
import toast from "react-hot-toast";
import { frontDeskApi } from "../../services/api";
import logger from "../../utils/logger";

// Phase 9 — Visitor check-in frosted sheet.
// Mirrors PaymentSheet shape (Phase 7) for consistency.
export default function VisitorSheet({ isOpen, onClose, onCheckedIn }) {
  const cardRef = useRef(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("parent-visit");
  const [whomToMeet, setWhomToMeet] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setName("");
    setPhone("");
    setPurpose("parent-visit");
    setWhomToMeet("");
    setNote("");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }));
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Visitor name is required"); return; }
    if (!whomToMeet.trim()) { toast.error("Whom to meet is required"); return; }
    setSubmitting(true);
    try {
      await frontDeskApi.createVisitor({
        name: name.trim(),
        phone: phone.trim() || undefined,
        purpose,
        whomToMeet: whomToMeet.trim(),
        notes: note.trim() || undefined,
        checkInTime: new Date().toISOString(),
      });
      toast.success("Visitor checked in");
      onCheckedIn?.();
      onClose?.();
    } catch (err) {
      logger.error("createVisitor failed:", err);
      toast.error(err?.message || "Failed to check in visitor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="frosted-overlay__backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <form
        ref={cardRef}
        className="frosted-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Check in visitor"
        tabIndex={-1}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="frosted-overlay__close"
          onClick={onClose}
          aria-label="Close visitor sheet"
        >
          <X size={16} aria-hidden />
        </button>

        <div className="fd-overlay__hero">
          <h2 className="fd-overlay__title">Check in visitor</h2>
          <p className="fd-overlay__subtitle">
            Records arrival time and prints a visitor pass
          </p>
        </div>

        <div className="fd-overlay__form">
          <div className="fd-overlay__field-row">
            <div className="fd-overlay__field">
              <label htmlFor="visitor-name" className="fd-overlay__label">Visitor name</label>
              <input
                id="visitor-name"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="fd-overlay__field">
              <label htmlFor="visitor-phone" className="fd-overlay__label">Phone (optional)</label>
              <input
                id="visitor-phone"
                type="tel"
                placeholder="98xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="fd-overlay__field-row">
            <div className="fd-overlay__field">
              <label htmlFor="visitor-purpose" className="fd-overlay__label">Purpose</label>
              <select id="visitor-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option value="parent-visit">Parent visit</option>
                <option value="meeting">Meeting</option>
                <option value="delivery">Delivery</option>
                <option value="vendor">Vendor</option>
                <option value="interview">Interview</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="fd-overlay__field">
              <label htmlFor="visitor-whom" className="fd-overlay__label">Whom to meet</label>
              <input
                id="visitor-whom"
                type="text"
                placeholder="Staff name or department"
                value={whomToMeet}
                onChange={(e) => setWhomToMeet(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="fd-overlay__field">
            <label htmlFor="visitor-note" className="fd-overlay__label">Note (optional)</label>
            <input
              id="visitor-note"
              type="text"
              placeholder="Any extra detail"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="frosted-overlay__footer">
          <span className="frosted-overlay__footer-link">
            Visitor pass will print after check-in
          </span>
          <button
            type="submit"
            className="btn btn--accent btn--sm"
            disabled={submitting}
          >
            <Users size={13} aria-hidden />{" "}
            {submitting ? "Checking in…" : "Check in"}
          </button>
        </div>
      </form>
    </div>
  );
}
