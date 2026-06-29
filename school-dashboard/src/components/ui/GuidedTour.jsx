/**
 * DOCS-02: In-app Guided Tour Component
 *
 * Provides a step-by-step overlay tour for new users. Uses a lightweight
 * custom implementation (no external dependency) — highlights a DOM element
 * and shows a tooltip with navigation controls.
 *
 * Usage:
 *   import GuidedTour from '@/components/ui/GuidedTour';
 *
 *   const DASHBOARD_STEPS = [
 *     { target: '[data-tour="sidebar-students"]', title: 'Students', content: 'Manage all student records here.' },
 *     { target: '[data-tour="topbar-notifications"]', title: 'Notifications', content: 'View alerts and reminders.' },
 *   ];
 *
 *   <GuidedTour steps={DASHBOARD_STEPS} isOpen={showTour} onClose={() => setShowTour(false)} />
 *
 * To mark DOM elements as tour targets, add a data-tour="..." attribute:
 *   <button data-tour="sidebar-students">Students</button>
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────────
const OVERLAY_Z = 9998;
const TOOLTIP_Z = 9999;
const HIGHLIGHT_PADDING = 8;
const TOUR_STORAGE_KEY = 'ems_completed_tours';

// ── Helpers ────────────────────────────────────────────────────────────────────
function getElementRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom + window.scrollY,
    right: rect.right + window.scrollX,
  };
}

function getTooltipPosition(rect, tooltipRef, placement = 'auto') {
  if (!rect || !tooltipRef.current) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };

  const tt = tooltipRef.current.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padding = 16;

  const positions = {
    bottom: {
      top: rect.bottom + HIGHLIGHT_PADDING + 12,
      left: rect.left + rect.width / 2 - tt.width / 2,
    },
    top: {
      top: rect.top - tt.height - HIGHLIGHT_PADDING - 12,
      left: rect.left + rect.width / 2 - tt.width / 2,
    },
    right: {
      top: rect.top + rect.height / 2 - tt.height / 2,
      left: rect.right + HIGHLIGHT_PADDING + 12,
    },
    left: {
      top: rect.top + rect.height / 2 - tt.height / 2,
      left: rect.left - tt.width - HIGHLIGHT_PADDING - 12,
    },
  };

  let pos;
  if (placement !== 'auto') {
    pos = positions[placement] || positions.bottom;
  } else {
    // auto: prefer bottom, then top, then right, then left
    if (rect.bottom + tt.height + 40 < vh) pos = positions.bottom;
    else if (rect.top - tt.height - 40 > 0) pos = positions.top;
    else if (rect.right + tt.width + 40 < vw) pos = positions.right;
    else pos = positions.left;
  }

  // Clamp to viewport
  pos.left = Math.max(padding, Math.min(pos.left, vw - tt.width - padding));
  pos.top = Math.max(padding, Math.min(pos.top, vh + window.scrollY - tt.height - padding));

  return { top: pos.top, left: pos.left };
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function GuidedTour({ steps, isOpen, onClose, tourId, autoStart = false }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({});
  const tooltipRef = useRef(null);

  const currentStep = steps[stepIndex] ?? null;

  // ── Measure target element ──────────────────────────────────────────────────
  const measureTarget = useCallback(() => {
    if (!currentStep) return;
    const rect = getElementRect(currentStep.target);
    setTargetRect(rect);
    if (rect) {
      // Scroll element into view
      const el = document.querySelector(currentStep.target);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    measureTarget();
    let resizeTimeout;
    const debouncedMeasure = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(measureTarget, 150);
    };
    window.addEventListener('resize', debouncedMeasure);
    return () => {
      window.removeEventListener('resize', debouncedMeasure);
      clearTimeout(resizeTimeout);
    };
  }, [isOpen, measureTarget]);

  // ── Position tooltip after measurement ─────────────────────────────────────
  useEffect(() => {
    if (!tooltipRef.current || !isOpen) return;
    const pos = getTooltipPosition(targetRect, tooltipRef, currentStep?.placement);
    setTooltipPos(pos);
  }, [targetRect, isOpen, currentStep]);

  // ── Tour completion tracking ────────────────────────────────────────────────
  const markCompleted = useCallback(() => {
    if (!tourId) return;
    try {
      const completed = JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) || '[]');
      if (!completed.includes(tourId)) {
        localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify([...completed, tourId]));
      }
    } catch (_) {
      // ignore
    }
  }, [tourId]);

  const handleNext = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      markCompleted();
      onClose?.();
    }
  }, [stepIndex, steps.length, markCompleted, onClose]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  const handleClose = useCallback(() => {
    markCompleted();
    onClose?.();
  }, [markCompleted, onClose]);

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleNext, handlePrev, handleClose]);

  if (!isOpen || !currentStep) return null;

  const hl = targetRect
    ? {
        top: targetRect.top - HIGHLIGHT_PADDING,
        left: targetRect.left - HIGHLIGHT_PADDING,
        width: targetRect.width + HIGHLIGHT_PADDING * 2,
        height: targetRect.height + HIGHLIGHT_PADDING * 2,
      }
    : null;

  return (
    <>
      {/* ── Dark overlay with cutout ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: OVERLAY_Z,
          background: 'rgba(0,0,0,0.55)',
          pointerEvents: 'auto',
        }}
        onClick={handleClose}
      />

      {/* ── Highlight box (cuts through overlay via box-shadow trick) ── */}
      {hl && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: hl.top,
            left: hl.left,
            width: hl.width,
            height: hl.height,
            zIndex: OVERLAY_Z + 1,
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            pointerEvents: 'none',
            border: '2px solid #4f46e5',
            transition: 'all 0.25s ease',
          }}
        />
      )}

      {/* ── Tooltip ── */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-label={`Tour step ${stepIndex + 1} of ${steps.length}: ${currentStep.title}`}
        className="bg-surface text-fg shadow-xl dark:shadow-zinc-950/40"
        style={{
          position: 'absolute',
          top: tooltipPos.top ?? 200,
          left: tooltipPos.left ?? 200,
          zIndex: TOOLTIP_Z,
          borderRadius: 12,
          padding: '20px 24px',
          maxWidth: 320,
          minWidth: 260,
          fontFamily: 'inherit',
          transition: 'top 0.2s ease, left 0.2s ease',
        }}
      >
        {/* Step counter */}
        <div className="text-fg-faint" style={{ fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
          {stepIndex + 1} / {steps.length}
        </div>

        {/* Title */}
        <div className="text-fg" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          {currentStep.title}
        </div>

        {/* Content */}
        <div className="text-fg-muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          {currentStep.content}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleClose}
            className="text-fg-faint hover:text-fg-muted"
            style={{
              background: 'none', border: 'none',
              fontSize: 13, cursor: 'pointer', padding: '4px 0',
            }}
          >
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {stepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="bg-surface-2 text-fg hover:bg-surface-hover"
                style={{
                  border: 'none', borderRadius: 6,
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="bg-accent text-white hover:bg-accent-hover"
              style={{
                border: 'none', borderRadius: 6,
                padding: '8px 18px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next \u2192'}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          {steps.map((_, i) => (
            <div
              key={`tour-dot-${i}`}
              className={i === stepIndex ? 'bg-accent' : 'bg-surface-2'}
              style={{
                width: i === stepIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}



// ── Helper hook for managing tour state ───────────────────────────────────────
/**
 * useGuidedTour — manages open/close state and checks if the tour was already completed.
 *
 * @param {string} tourId - Unique tour identifier (same as GuidedTour tourId prop)
 * @param {boolean} autoStart - Automatically show the tour if not completed
 * @returns {{ isOpen: boolean, openTour: () => void, closeTour: () => void, hasCompleted: boolean }}
 */
export function useGuidedTour(tourId, autoStart = false) {
  const [isOpen, setIsOpen] = useState(false);

  const hasCompleted = useMemo(() => {
    try {
      const completed = JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) || '[]');
      return completed.includes(tourId);
    } catch (_) {
      return false;
    }
  }, [tourId]);

  useEffect(() => {
    if (autoStart && !hasCompleted) {
      setIsOpen(true);
    }
  }, [autoStart, hasCompleted]);

  return {
    isOpen,
    openTour: () => setIsOpen(true),
    closeTour: () => setIsOpen(false),
    hasCompleted,
  };
}
