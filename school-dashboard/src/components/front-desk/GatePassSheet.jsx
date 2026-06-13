import { useEffect, useRef, useState } from "react";
import { X, DoorOpen } from "lucide-react";
import toast from "react-hot-toast";
import { frontDeskApi } from "../../services/api";
import { useApp } from "../../context/AppContext";
import logger from "../../utils/logger";

// Phase 9 — Gate pass issuance frosted sheet.
export default function GatePassSheet({ isOpen, onClose, onIssued }) {
  const { students = [] } = useApp();
  const cardRef = useRef(null);
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [leaving, setLeaving] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [escortName, setEscortName] = useState("");
  const [escortPhone, setEscortPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setStudentId("");
    setReason("");
    setEscortName("");
    setEscortPhone("");
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
    if (!studentId) { toast.error("Pick a student"); return; }
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    setSubmitting(true);
    try {
      const student = students.find(
        (s) => String(s._id || s.id) === String(studentId)
      );
      await frontDeskApi.createGatePass({
        studentId,
        studentName: student?.name,
        reason: reason.trim(),
        leavingDateTime: leaving,
        escortName: escortName.trim() || undefined,
        escortPhone: escortPhone.trim() || undefined,
        approvalStatus: "pending",
      });
      toast.success("Gate pass issued");
      onIssued?.();
      onClose?.();
    } catch (err) {
      logger.error("createGatePass failed:", err);
      toast.error(err?.message || "Failed to issue gate pass");
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
        aria-label="Issue gate pass"
        tabIndex={-1}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="frosted-overlay__close"
          onClick={onClose}
          aria-label="Close gate pass sheet"
        >
          <X size={16} aria-hidden />
        </button>

        <div className="fd-overlay__hero">
          <h2 className="fd-overlay__title">Issue gate pass</h2>
          <p className="fd-overlay__subtitle">
            Records the student leaving the premises with approval state
          </p>
        </div>

        <div className="fd-overlay__form">
          <div className="fd-overlay__field">
            <label htmlFor="gatepass-student" className="fd-overlay__label">Student</label>
            <select
              id="gatepass-student"
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

          <div className="fd-overlay__field">
            <label htmlFor="gatepass-reason" className="fd-overlay__label">Reason</label>
            <input
              id="gatepass-reason"
              type="text"
              placeholder="Doctor appointment, family emergency, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="fd-overlay__field-row">
            <div className="fd-overlay__field">
              <label htmlFor="gatepass-leaving" className="fd-overlay__label">Leaving at</label>
              <input
                id="gatepass-leaving"
                type="datetime-local"
                value={leaving}
                onChange={(e) => setLeaving(e.target.value)}
              />
            </div>
            <div className="fd-overlay__field">
              <label htmlFor="gatepass-phone" className="fd-overlay__label">Escort phone</label>
              <input
                id="gatepass-phone"
                type="tel"
                placeholder="98xxxxxxxx"
                value={escortPhone}
                onChange={(e) => setEscortPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="fd-overlay__field">
            <label htmlFor="gatepass-escort" className="fd-overlay__label">Escort name</label>
            <input
              id="gatepass-escort"
              type="text"
              placeholder="Parent/guardian name"
              value={escortName}
              onChange={(e) => setEscortName(e.target.value)}
            />
          </div>
        </div>

        <div className="frosted-overlay__footer">
          <span className="frosted-overlay__footer-link">
            Pending approval until signed off
          </span>
          <button
            type="submit"
            className="btn btn--accent btn--sm"
            disabled={submitting}
          >
            <DoorOpen size={13} aria-hidden />{" "}
            {submitting ? "Issuing…" : "Issue pass"}
          </button>
        </div>
      </form>
    </div>
  );
}
