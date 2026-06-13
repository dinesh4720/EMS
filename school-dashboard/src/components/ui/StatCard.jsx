import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/* DESIGN-SYSTEM COMPLIANCE — DK-686
 * colorMap now resolves every supported `color` prop value to design-system
 * semantic tokens (ok, warn, danger, info, accent, fg, fg-muted, surface-2).
 * The public API is unchanged — all legacy color strings remain valid. */
const colorMap = {
  gray: { text: 'text-fg-muted', bg: 'bg-surface-2' },
  dark: { text: 'text-fg', bg: 'bg-surface-2' },
  blue: { text: 'text-accent', bg: 'bg-accent-bg' },
  green: { text: 'text-ok', bg: 'bg-ok-bg' },
  red: { text: 'text-danger-token', bg: 'bg-danger-bg' },
  amber: { text: 'text-warn', bg: 'bg-warn-bg' },
  purple: { text: 'text-accent', bg: 'bg-accent-bg' },
  cyan: { text: 'text-info-token', bg: 'bg-info-bg' },
  rose: { text: 'text-danger-token', bg: 'bg-danger-bg' },
  emerald: { text: 'text-ok', bg: 'bg-ok-bg' },
  violet: { text: 'text-accent', bg: 'bg-accent-bg' },
  indigo: { text: 'text-accent', bg: 'bg-accent-bg' },
  // Semantic aliases
  success: { text: 'text-ok', bg: 'bg-ok-bg' },
  danger: { text: 'text-danger-token', bg: 'bg-danger-bg' },
  warning: { text: 'text-warn', bg: 'bg-warn-bg' },
  primary: { text: 'text-accent', bg: 'bg-accent-bg' },
  info: { text: 'text-info-token', bg: 'bg-info-bg' },
};

function StatCard({ label, value, subtext, icon: Icon, color = 'gray', trend, href, isLoading, headingLevel: Heading = 'h3' }) {
  const navigate = useNavigate();
  const colors = colorMap[color] || colorMap.gray;
  const isClickable = !!href && !isLoading;

  return (
    <div
      className={`bg-surface rounded-lg p-4 border border-divider hover:border-border-strong transition-colors ${
        isClickable ? 'cursor-pointer hover:shadow-sm active:scale-[0.98] transition-all' : ''
      }`}
      onClick={isClickable ? () => navigate(href) : undefined}
      role={isClickable ? 'link' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(href); } } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        {/* Icon */}
        <div className={`${colors.bg} w-9 h-9 rounded-lg flex items-center justify-center`}>
          <Icon size={16} className={colors.text} strokeWidth={2} />
        </div>

        {/* Trend Badge */}
        {trend && !isLoading && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
            trend.positive
              ? 'bg-surface-2 text-fg-muted'
              : 'bg-danger-bg text-danger-token'
          }`}>
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        {isLoading ? (
          <div className="h-6 w-20 animate-shimmer rounded" />
        ) : (
          <Heading className="text-xl font-semibold text-fg">
            {value}
          </Heading>
        )}
        <p className="text-xs font-medium text-fg-muted mt-0.5">
          {label}
        </p>
      </div>

      {/* Subtext */}
      {isLoading ? (
        <div className="h-3 w-32 animate-shimmer rounded mt-2" />
      ) : subtext ? (
        <p className="text-xs text-fg-faint mt-2">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtext: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf([
    'gray', 'dark',
    'blue', 'green', 'red', 'amber', 'purple', 'cyan', 'rose', 'emerald', 'violet', 'indigo',
    'success', 'danger', 'warning', 'primary', 'info'
  ]),
  trend: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    positive: PropTypes.bool,
  }),
  href: PropTypes.string,
  isLoading: PropTypes.bool,
  headingLevel: PropTypes.elementType,
};

export default React.memo(StatCard);
