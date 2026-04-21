import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * ModalBase — Accessible custom modal wrapper with focus trapping.
 *
 * Use this as the base for any custom portal-based modals (i.e. modals NOT
 * using HeroUI's <Modal>). It handles:
 *  - Trapping Tab / Shift+Tab focus within the modal
 *  - Returning focus to the previously focused element on close
 *  - Auto-focusing the first focusable element when the modal opens
 *  - Closing on Escape key
 *  - Blocking body scroll while open
 *
 * @param {boolean}     isOpen    - Whether the modal is currently open
 * @param {function}    onClose   - Called when Escape is pressed or backdrop clicked
 * @param {ReactNode}   children  - Modal content (rendered inside the dialog element)
 * @param {string}      [id]      - Optional id for the dialog element
 * @param {string}      [labelledBy] - id of the heading element that labels the dialog
 * @param {string}      [describedBy] - id of the element that describes the dialog
 * @param {string}      [portalId]   - id of the portal root element (default: "modal-base-root")
 * @param {string}      [className]  - Extra class names for the dialog wrapper div
 */
export default function ModalBase({
  isOpen,
  onClose,
  children,
  id,
  labelledBy,
  describedBy,
  portalId = "modal-base-root",
  className = "",
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Selectors for all naturally focusable elements
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), area[href], details > summary';

  // Save the element that had focus before the modal opened so we can restore it
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Auto-focus the first focusable element inside the dialog when it opens
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    // Slight defer so the DOM is fully rendered (AnimatePresence, portals, etc.)
    const raf = requestAnimationFrame(() => {
      if (!dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(FOCUSABLE);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // Fall back to focusing the dialog container itself
        dialogRef.current.focus();
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll while the modal is open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ---------- Focus trap + Escape handler ----------  // line ~78
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen || !dialogRef.current) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap backwards
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: wrap forwards
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, onClose] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown, true); // capture phase
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  // Lazy-create a stable portal container
  const portalRef = useRef(null);
  if (!portalRef.current) {
    let el = document.getElementById(portalId);
    if (!el) {
      el = document.createElement("div");
      el.id = portalId;
      document.body.appendChild(el);
    }
    portalRef.current = el;
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      id={id}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      tabIndex={-1}
      className={className}
      // Prevent clicks inside the dialog from bubbling to any backdrop listener
      onClick={(e) => e.stopPropagation()}
      style={{ outline: "none" }}
    >
      {children}
    </div>,
    portalRef.current
  );
}
