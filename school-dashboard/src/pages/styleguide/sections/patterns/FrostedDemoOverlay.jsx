import { createPortal } from "react-dom";
import { X } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * Frosted overlay — shared chrome for student detail, payment sheet,
 * visitor sheet, calendar drawer, announcement composer.
 *
 * Portaled to body — frosted-overlay relies on `position: fixed`
 * reading the viewport. Any ancestor with `transform` (Framer Motion,
 * sticky chrome, some Tailwind utilities) silently demotes that to
 * the ancestor's box.
 * ────────────────────────────────────────────────────────────────── */
export default function FrostedDemoOverlay({ open, onClose }) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="frosted-overlay__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="frosted-overlay"
        role="dialog"
        aria-label="Demo overlay"
        style={{ width: 480 }}
      >
        <button
          type="button"
          className="frosted-overlay__close"
          onClick={onClose}
          aria-label="Close demo"
        >
          <X size={16} aria-hidden />
        </button>
        <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid var(--divider)" }}>
          <h3 className="text-fg" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Frosted overlay base
          </h3>
          <p className="text-fg-muted" style={{ fontSize: 12, marginTop: 2 }}>
            Shared chrome — used by student detail, payment sheet, visitor sheet,
            calendar drawer, announcement composer.
          </p>
        </div>
        <div className="frosted-overlay__body">
          <p className="text-fg-muted text-sm">
            Backdrop dims at <code>rgba(0,0,0,0.3)</code>; card uses{" "}
            <code>backdrop-filter: saturate(160%) blur(24px)</code>. Don&rsquo;t put{" "}
            <code>transform</code> on any ancestor or the blur breaks.
          </p>
        </div>
        <div className="frosted-overlay__footer">
          <span className="frosted-overlay__footer-link">Esc / backdrop / X all close</span>
          <button type="button" className="btn btn--accent btn--sm" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
