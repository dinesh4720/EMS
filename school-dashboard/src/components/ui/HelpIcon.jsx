/**
 * DOCS-07: Context-Sensitive Help Icon
 *
 * Renders a small "?" icon button that, when clicked or hovered, shows
 * a help tooltip with context-sensitive guidance for the adjacent UI element.
 *
 * Usage:
 *   import HelpIcon from '@/components/ui/HelpIcon';
 *
 *   // Simple tooltip
 *   <HelpIcon text="Admission number is auto-generated. You can override it." />
 *
 *   // With a link to the knowledge base
 *   <HelpIcon text="Fee heads define categories of charges." kbSlug="fee-heads-overview" />
 *
 *   // In a form label row
 *   <div className="flex items-center gap-1">
 *     <label>Roll Number</label>
 *     <HelpIcon text="Roll number must be unique within the class for the selected academic year." />
 *   </div>
 */

import { useEffect, useId, useRef, useState } from 'react';

// ── Component ──────────────────────────────────────────────────────────────────
export default function HelpIcon({
  text,
  kbSlug,
  placement = 'top',
  size = 'md',
  className = '',
  trigger = 'hover',
}) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const hideTimer = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    return () => clearTimeout(hideTimer.current);
  }, []);

  const showTooltip = () => {
    clearTimeout(hideTimer.current);
    setVisible(true);
  };

  const hideTooltip = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 150);
  };

  // Keyboard parity: keep the tooltip open while focus stays inside the
  // widget (button or the "Learn more" link), hide it once focus leaves.
  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) hideTooltip();
  };

  const toggleTooltip = () => setVisible((v) => !v);

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  const placementStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
  };

  // Only the computed placement offsets stay inline; all colors, sizing and
  // elevation live in .help-icon__tooltip (token-driven, theme-aware). See
  // src/styles/help-icon.css. (DS-10 — no inline hex.)
  const tooltipPlacementStyle = placementStyles[placement] || placementStyles.top;

  return (
    <span
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      {...(trigger === 'hover'
        ? {
            onMouseEnter: showTooltip,
            onMouseLeave: hideTooltip,
            onFocus: showTooltip,
            onBlur: handleBlur,
          }
        : {})}
    >
      {/* ── Help icon button ── */}
      <button
        type="button"
        className="help-icon__btn"
        aria-label="Help"
        aria-expanded={visible}
        aria-describedby={visible ? tooltipId : undefined}
        onClick={trigger === 'click' ? toggleTooltip : undefined}
        style={{
          width: iconSize + 4,
          height: iconSize + 4,
          fontSize: iconSize - 2,
        }}
      >
        ?
      </button>

      {/* ── Tooltip ── */}
      {visible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="help-icon__tooltip"
          style={tooltipPlacementStyle}
          onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
          onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        >
          {text}
          {kbSlug && (
            <a
              href={`/help/kb/${kbSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="help-icon__kb-link"
            >
              Learn more →
            </a>
          )}
          {/* Close button for click trigger */}
          {trigger === 'click' && (
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="help-icon__close"
              aria-label="Close help"
            >
              ×
            </button>
          )}
        </div>
      )}
    </span>
  );
}


