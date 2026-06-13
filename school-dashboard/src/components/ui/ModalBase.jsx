import { useEffect, useRef, useCallback, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Tracks the number of open modals so we only remove aria-hidden/inert from
 * the page root when the last nested modal closes.
 */
let openModalCount = 0;

/**
 * ModalBase — Accessible custom modal wrapper with focus trapping.
 *
 * Use this as the base for any custom portal-based modals (i.e. modals NOT
 * using HeroUI's <Modal>). It handles:
 *  - Trapping Tab / Shift+Tab focus within the modal
 *  - Returning focus to the previously focused element on close
 *  - Auto-focusing the first focusable element when the modal opens
 *  - Closing on Escape key
 *  - Optional outside-click (backdrop) close
 *  - Blocking body scroll while open
 *  - Hiding and inerting the main page content while open (nested-modal aware)
 *
 * @param {boolean}  isOpen
 * @param {function} onClose
 * @param {ReactNode} children
 * @param {string}   [id]
 * @param {string}   [labelledBy]
 * @param {string}   [describedBy]
 * @param {string}   [portalId="modal-base-root"]
 * @param {string}   [className]      Classes on the outer dialog/backdrop element
 * @param {string}   [role="dialog"]  ARIA role: "dialog" (default) or "alertdialog"
 * @param {boolean}  [closeOnBackdrop=false] When true, click on the outer element
 *                                            (the backdrop) triggers onClose.
 *                                            Inner content must call stopPropagation
 *                                            or live inside a child element so the
 *                                            click target === currentTarget check
 *                                            works.
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
  role = "dialog",
  closeOnBackdrop = false,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const pageRootRef = useRef(null);

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), area[href], details > summary, [contenteditable]:not([contenteditable="false"]), iframe';

  const findPageRoot = useCallback(() => {
    if (typeof document === "undefined") return null;
    return (
      document.getElementById("root") ||
      document.querySelector("main") ||
      document.body
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      const root = findPageRoot();
      pageRootRef.current = root;
      if (root) {
        openModalCount += 1;
        root.setAttribute("aria-hidden", "true");
        if ("inert" in HTMLElement.prototype) {
          root.inert = true;
        }
      }
    } else {
      const root = pageRootRef.current;
      if (root) {
        openModalCount = Math.max(0, openModalCount - 1);
        if (openModalCount === 0) {
          root.removeAttribute("aria-hidden");
          if ("inert" in HTMLElement.prototype) {
            root.inert = false;
          }
        }
      }
      pageRootRef.current = null;
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
      previousFocusRef.current = null;
    }

    return () => {
      // Safety cleanup: if the component unmounts while open, decrement and
      // restore the page root when the last modal is gone.
      const root = pageRootRef.current;
      if (root) {
        openModalCount = Math.max(0, openModalCount - 1);
        if (openModalCount === 0) {
          root.removeAttribute("aria-hidden");
          if ("inert" in HTMLElement.prototype) {
            root.inert = false;
          }
        }
      }
    };
  }, [isOpen, findPageRoot]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    // Use setTimeout instead of requestAnimationFrame so the DOM commit is
    // guaranteed to have finished before we query for focusable elements.
    // requestAnimationFrame can fire before React has flushed portal content
    // under heavy CPU load, causing the focus trap to miss elements.
    const timer = setTimeout(() => {
      if (!dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(FOCUSABLE);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialogRef.current.focus();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

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
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  const [portalEl, setPortalEl] = useState(null);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    let el = document.getElementById(portalId);
    if (!el) {
      el = document.createElement("div");
      el.id = portalId;
      document.body.appendChild(el);
    }
    setPortalEl(el);
  }, [portalId]);

  const handleClick = useCallback(
    (e) => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose();
      }
      // No stopPropagation — the original behaviour blocked outside-click
      // close in every consumer; the new behaviour delegates to the
      // closeOnBackdrop flag and lets inner clicks bubble normally.
    },
    [closeOnBackdrop, onClose]
  );

  if (!isOpen || !portalEl) return null;

  return createPortal(
    // Keyboard users close the modal via Escape (handled above). The backdrop
    // click is a pointer-device convenience only, so the static-element rule
    // is intentionally disabled for the overlay surface.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      ref={dialogRef}
      role={role}
      aria-modal="true"
      id={id}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      tabIndex={-1}
      className={cn("ds-modal-focus-container", className)}
      onClick={handleClick}
      style={{ outline: "none" }}
    >
      {children}
    </div>,
    portalEl
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
