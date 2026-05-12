/**
 * REVAMP-107: First-run coach marks.
 *
 * Subtle, sequential tooltips that point at key UI surfaces (sidebar pin,
 * search, command palette, bulk actions). Each surface is shown once per
 * user — dismissal persists in localStorage. Users can re-enable from the
 * Help menu via {@link resetCoachMarks}.
 *
 * Usage:
 *   <CoachMarks
 *     surface="shell"
 *     autoStart
 *     marks={[
 *       { target: '[data-coach="sidebar-pin"]', title: 'Pin shortcuts',
 *         body: 'Pin frequently used pages here for one-click access.' },
 *       ...
 *     ]}
 *   />
 *
 * Mark targets must be tagged with data-coach="<key>" attributes. Marks are
 * skipped silently if their target is not in the DOM after a short poll
 * (bug-fix license: target not yet rendered when mark fires).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../../utils/safeStorage';

const STORAGE_KEY = 'ems_coach_marks_v1';
const RESET_EVENT = 'ems:coach-marks-reset';
const MAX_MARKS_PER_SURFACE = 3;
const TARGET_POLL_INTERVAL = 120;
const TARGET_POLL_TIMEOUT = 2500;

// ── Persistence ───────────────────────────────────────────────────────────────
function readState() {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
}

function writeState(state) {
  try { safeSetItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function isCoachMarkDismissed(surface) {
  return Boolean(readState()[surface]);
}

export function dismissCoachMarkSurface(surface) {
  const s = readState();
  s[surface] = Date.now();
  writeState(s);
}

export function resetCoachMarks() {
  try { safeRemoveItem(STORAGE_KEY); } catch { /* ignore */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RESET_EVENT));
  }
}

// ── Geometry ──────────────────────────────────────────────────────────────────
function pickPlacement(rect, cardW, cardH, preferred) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fits = {
    bottom: rect.bottom + cardH + 24 < vh,
    top: rect.top - cardH - 24 > 0,
    right: rect.right + cardW + 24 < vw,
    left: rect.left - cardW - 24 > 0,
  };
  if (preferred && fits[preferred]) return preferred;
  if (fits.bottom) return 'bottom';
  if (fits.top) return 'top';
  if (fits.right) return 'right';
  if (fits.left) return 'left';
  return 'bottom';
}

function positionCard(rect, placement, cardW, cardH) {
  const margin = 12;
  const gap = 14;
  let top;
  let left;
  let arrowSide = placement;

  switch (placement) {
    case 'top':
      top = rect.top - cardH - gap;
      left = rect.left + rect.width / 2 - cardW / 2;
      arrowSide = 'bottom';
      break;
    case 'right':
      top = rect.top + rect.height / 2 - cardH / 2;
      left = rect.right + gap;
      arrowSide = 'left';
      break;
    case 'left':
      top = rect.top + rect.height / 2 - cardH / 2;
      left = rect.left - cardW - gap;
      arrowSide = 'right';
      break;
    case 'bottom':
    default:
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - cardW / 2;
      arrowSide = 'top';
      break;
  }

  const clampedLeft = Math.max(margin, Math.min(left, window.innerWidth - cardW - margin));
  const clampedTop = Math.max(margin, Math.min(top, window.innerHeight - cardH - margin));

  let arrowLeft = '50%';
  let arrowTop = '50%';
  if (arrowSide === 'top' || arrowSide === 'bottom') {
    const targetCenter = rect.left + rect.width / 2;
    arrowLeft = `${Math.max(16, Math.min(cardW - 16, targetCenter - clampedLeft))}px`;
  } else {
    const targetCenter = rect.top + rect.height / 2;
    arrowTop = `${Math.max(16, Math.min(cardH - 16, targetCenter - clampedTop))}px`;
  }

  return { top: clampedTop, left: clampedLeft, arrowSide, arrowLeft, arrowTop };
}

// ── Hook: wait for a target to appear in the DOM ──────────────────────────────
function useResolvedTarget(selector, active) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!active || !selector) {
      setTarget(null);
      return undefined;
    }
    const immediate = document.querySelector(selector);
    if (immediate) {
      setTarget(immediate);
      return undefined;
    }
    setTarget(null);
    const start = Date.now();
    const id = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        setTarget(el);
        clearInterval(id);
      } else if (Date.now() - start > TARGET_POLL_TIMEOUT) {
        clearInterval(id);
        setTarget('__missing__');
      }
    }, TARGET_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [selector, active]);

  return target;
}

// ── Hook: live rect tracking (resize / scroll / mutation) ─────────────────────
function useTrackedRect(target) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!target || target === '__missing__') {
      setRect(null);
      return undefined;
    }

    const measure = () => {
      const r = target.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right });
    };

    measure();

    let raf = null;
    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        measure();
      });
    };

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    ro?.observe(target);
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : null;
    mo?.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      ro?.disconnect();
      mo?.disconnect();
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [target]);

  return rect;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CoachMarks({
  surface,
  marks,
  autoStart = true,
  open: controlledOpen,
  onClose,
}) {
  const safeMarks = (Array.isArray(marks) ? marks : []).slice(0, MAX_MARKS_PER_SURFACE);

  const [internalOpen, setInternalOpen] = useState(() => {
    if (!autoStart) return false;
    if (typeof window === 'undefined') return false;
    return !isCoachMarkDismissed(surface);
  });
  const isControlled = typeof controlledOpen === 'boolean';
  const open = isControlled ? controlledOpen : internalOpen;

  const [stepIndex, setStepIndex] = useState(0);
  const cardRef = useRef(null);
  const [cardSize, setCardSize] = useState({ w: 280, h: 120 });

  // Honour external resets (e.g. Help → Show product tips).
  useEffect(() => {
    if (isControlled) return undefined;
    const handler = () => {
      setStepIndex(0);
      setInternalOpen(true);
    };
    window.addEventListener(RESET_EVENT, handler);
    return () => window.removeEventListener(RESET_EVENT, handler);
  }, [isControlled]);

  const currentMark = safeMarks[stepIndex] ?? null;
  const target = useResolvedTarget(currentMark?.target, open && Boolean(currentMark));
  const rect = useTrackedRect(target && target !== '__missing__' ? target : null);

  const finish = useCallback(() => {
    dismissCoachMarkSurface(surface);
    if (!isControlled) setInternalOpen(false);
    onClose?.();
  }, [surface, isControlled, onClose]);

  const handleNext = useCallback(() => {
    if (stepIndex >= safeMarks.length - 1) {
      finish();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, safeMarks.length, finish]);

  // Bug-fix license: if the target never renders, advance silently rather
  // than block the user behind an invisible coach mark.
  useEffect(() => {
    if (!open || !currentMark) return;
    if (target === '__missing__') {
      handleNext();
    }
  }, [open, currentMark, target, handleNext]);

  // Keyboard: Enter/→ next, Esc dismiss.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, finish, handleNext]);

  // Measure card after each render to feed positionCard.
  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const w = cardRef.current.offsetWidth;
    const h = cardRef.current.offsetHeight;
    if (w !== cardSize.w || h !== cardSize.h) setCardSize({ w, h });
  }, [stepIndex, currentMark, rect, cardSize.w, cardSize.h]);

  if (!open || !currentMark || !rect) return null;
  if (typeof document === 'undefined') return null;

  // Bug-fix license: marks should never block critical interaction. The
  // overlay is fully click-through; the highlight ring sits below, the card
  // captures clicks only inside its own footprint.
  const placement = pickPlacement(rect, cardSize.w, cardSize.h, currentMark.placement);
  const pos = positionCard(rect, placement, cardSize.w, cardSize.h);

  const ringPad = 6;
  const ringStyle = {
    position: 'fixed',
    top: rect.top - ringPad,
    left: rect.left - ringPad,
    width: rect.width + ringPad * 2,
    height: rect.height + ringPad * 2,
    borderRadius: 10,
    boxShadow: '0 0 0 2px var(--accent), 0 0 0 6px color-mix(in srgb, var(--accent) 35%, transparent)',
    pointerEvents: 'none',
    zIndex: 10000,
    animation: 'emsCoachMarkPulse 1.6s ease-in-out infinite',
  };

  const cardStyle = {
    position: 'fixed',
    top: pos.top,
    left: pos.left,
    width: 280,
    maxWidth: 'min(280px, calc(100vw - 24px))',
    zIndex: 10001,
    borderRadius: 12,
    padding: '14px 16px 12px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    pointerEvents: 'auto',
    color: 'var(--fg)',
  };

  const arrowSize = 10;
  const arrowBase = {
    position: 'absolute',
    width: arrowSize,
    height: arrowSize,
    background: 'var(--glass-bg)',
    borderTop: '1px solid var(--glass-border)',
    borderLeft: '1px solid var(--glass-border)',
    transform: 'rotate(45deg)',
  };
  const arrowStyle = {
    ...arrowBase,
    ...(pos.arrowSide === 'top'
      ? { top: -arrowSize / 2, left: pos.arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }
      : pos.arrowSide === 'bottom'
      ? { bottom: -arrowSize / 2, left: pos.arrowLeft, transform: 'translateX(-50%) rotate(225deg)' }
      : pos.arrowSide === 'left'
      ? { left: -arrowSize / 2, top: pos.arrowTop, transform: 'translateY(-50%) rotate(-45deg)' }
      : { right: -arrowSize / 2, top: pos.arrowTop, transform: 'translateY(-50%) rotate(135deg)' }),
  };

  const isLast = stepIndex === safeMarks.length - 1;

  return createPortal(
    <>
      <style>{`
        @keyframes emsCoachMarkPulse {
          0%, 100% { box-shadow: 0 0 0 2px var(--accent), 0 0 0 6px color-mix(in srgb, var(--accent) 35%, transparent); }
          50% { box-shadow: 0 0 0 2px var(--accent), 0 0 0 12px color-mix(in srgb, var(--accent) 12%, transparent); }
        }
      `}</style>
      <div aria-hidden style={ringStyle} />
      <div
        ref={cardRef}
        className="glass fade-in"
        role="dialog"
        aria-live="polite"
        aria-label={`Tip ${stepIndex + 1} of ${safeMarks.length}: ${currentMark.title}`}
        style={cardStyle}
      >
        <span aria-hidden style={arrowStyle} />
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="subtle mono tnum" style={{ fontSize: 11 }}>
            {stepIndex + 1} / {safeMarks.length}
          </span>
          <button
            type="button"
            onClick={finish}
            className="subtle"
            style={{ background: 'none', border: 0, fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            Skip
          </button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>
          {currentMark.title}
        </div>
        <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 12 }}>
          {currentMark.body}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={isLast ? finish : handleNext}
            className="btn btn--sm btn--primary"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
