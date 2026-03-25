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

import { useRef, useState } from 'react';
import PropTypes from 'prop-types';

// ── Component ──────────────────────────────────────────────────────────────────
export default function HelpIcon({
  text,
  kbSlug,
  placement,
  size,
  className,
  trigger,
}) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  let hideTimer = useRef(null);

  const showTooltip = () => {
    clearTimeout(hideTimer.current);
    setVisible(true);
  };

  const hideTooltip = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 150);
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
        ? { onMouseEnter: showTooltip, onMouseLeave: hideTooltip }
        : {})}
    >
      {/* ── Help icon button ── */}
      <button
        type="button"
        aria-label="Help"
        aria-expanded={visible}
        onClick={trigger === 'click' ? toggleTooltip : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconSize + 4,
          height: iconSize + 4,
          borderRadius: '50%',
          border: '1.5px solid #9ca3af',
          background: 'transparent',
          color: '#6b7280',
          fontSize: iconSize - 2,
          fontWeight: 700,
          cursor: 'pointer',
          lineHeight: 1,
          padding: 0,
          transition: 'border-color 0.15s, color 0.15s, background 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#4f46e5';
          e.currentTarget.style.color = '#4f46e5';
          e.currentTarget.style.background = '#e0e7ff';
          if (trigger === 'hover') showTooltip();
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#9ca3af';
          e.currentTarget.style.color = '#6b7280';
          e.currentTarget.style.background = 'transparent';
          if (trigger === 'hover') hideTooltip();
        }}
      >
        ?
      </button>

      {/* ── Tooltip ── */}
      {visible && (
        <div
          ref={tooltipRef}
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

HelpIcon.propTypes = {
  /** Help text to display in the tooltip */
  text: PropTypes.string.isRequired,
  /** Knowledge base article slug — appended to /help/kb/{slug} */
  kbSlug: PropTypes.string,
  /** Tooltip placement relative to the icon */
  placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  /** Icon size: 'sm' = 14px, 'md' = 16px (default), 'lg' = 20px */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Extra CSS class for the wrapper span */
  className: PropTypes.string,
  /** How the tooltip is triggered */
  trigger: PropTypes.oneOf(['hover', 'click']),
};

HelpIcon.defaultProps = {
  kbSlug: undefined,
  placement: 'top',
  size: 'md',
  className: '',
  trigger: 'hover',
};
