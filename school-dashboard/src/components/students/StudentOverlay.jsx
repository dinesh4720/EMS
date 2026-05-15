import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import StudentOverlayBody from "./StudentOverlayBody";
import { isOverlayViewport } from "../../hooks/useStudentOverlay";

// Phase 5b · frosted student overlay shell. Owns:
//   - backdrop click → close
//   - body scroll lock while open
//   - sub-768 fallback: redirect to /students/:id full route
//   - focus management (return focus to last trigger on close)
// Esc + ?student= URL state are owned by useStudentOverlay (parent calls
// it and passes studentId/onClose down here).
export default function StudentOverlay({
  studentId,
  rowIds = [],
  onClose,
  onNavigate,
}) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const lastTriggerRef = useRef(null);

  // Sub-768 → full-page route fallback. Closes overlay state in the
  // process so we don't end up with both open at once.
  useEffect(() => {
    if (!studentId) return;
    if (typeof window === "undefined") return;
    if (!isOverlayViewport(window.innerWidth)) {
      onClose?.();
      navigate(`/students/${studentId}`);
    }
  }, [studentId, onClose, navigate]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!studentId) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [studentId]);

  // Capture the trigger so we can return focus on close.
  useEffect(() => {
    if (studentId) {
      lastTriggerRef.current = document.activeElement;
      // Move focus into the card on open (without scrolling)
      requestAnimationFrame(() => {
        cardRef.current?.focus({ preventScroll: true });
      });
    } else if (lastTriggerRef.current?.focus) {
      lastTriggerRef.current.focus({ preventScroll: true });
      lastTriggerRef.current = null;
    }
  }, [studentId]);

  // Arrow key row nav — only fires when the focus is inside the card,
  // so typing in inner inputs (More menu search, future fields) won't
  // hijack ↑/↓.
  useEffect(() => {
    if (!studentId) return undefined;
    const onKey = (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!cardRef.current?.contains(target)) return;
      e.preventDefault();
      onNavigate?.(e.key === "ArrowDown" ? "next" : "prev", rowIds);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [studentId, rowIds, onNavigate]);

  if (!studentId) return null;

  return (
    <div
      className="frosted-overlay__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={cardRef}
        className="frosted-overlay student-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Student detail"
        tabIndex={-1}
      >
        <button
          type="button"
          className="frosted-overlay__close"
          onClick={onClose}
          aria-label="Close student detail"
        >
          <X size={16} aria-hidden />
        </button>
        <StudentOverlayBody studentId={studentId} onClose={onClose} />
      </div>
    </div>
  );
}
