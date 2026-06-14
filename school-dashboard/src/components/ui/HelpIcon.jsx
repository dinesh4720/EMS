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

  const tooltipStyle = {
    position: 'absolute',
    zIndex: 5000,
    background: '#1e293b',
    color: '#f8fafc',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    lineHeight: 1.55,
    maxWidth: 280,
    minWidth: 180,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    pointerEvents: 'auto',
    whiteSpace: 'normal',
    ...(placementStyles[placement] || placementStyles.top),
  };

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
          style={tooltipStyle}
          onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
          onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        >
          {text}
          {kbSlug && (
            <a
              href={`/help/kb/${kbSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                marginTop: 8,
                color: '#93c5fd',
                fontSize: 12,
                textDecoration: 'underline',
              }}
            >
              Learn more →
            </a>
          )}
          {/* Close button for click trigger */}
          {trigger === 'click' && (
            <button
              type="button"
              onClick={() => setVisible(false)}
              style={{
                position: 'absolute', top: 6, right: 8,
                background: 'none', border: 'none', color: '#94a3b8',
                fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0,
              }}
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


