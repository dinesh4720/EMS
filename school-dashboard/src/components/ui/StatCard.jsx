import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const colorMap = {
  gray: { text: 'text-fg-muted', bg: 'bg-surface-2' },
  dark: { text: 'text-fg', bg: 'bg-surface-2' },
  blue: { text: 'text-info-token', bg: 'bg-info-bg' },
  green: { text: 'text-ok', bg: 'bg-ok-bg' },
  red: { text: 'text-danger-token', bg: 'bg-danger-bg' },
  amber: { text: 'text-warn', bg: 'bg-warn-bg' },
  purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950' },
  cyan: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  violet: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950' },
  indigo: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  // Semantic aliases
  success: { text: 'text-ok', bg: 'bg-ok-bg' },
  danger: { text: 'text-danger-token', bg: 'bg-danger-bg' },
  warning: { text: 'text-warn', bg: 'bg-warn-bg' },
  primary: { text: 'text-info-token', bg: 'bg-info-bg' },
};

function StatCard({ label, value, subtext, icon: Icon, color = 'gray', trend, href, isLoading }) {
  const navigate = useNavigate();
  const colors = colorMap[color] || colorMap.gray;
  const isClickable = !!href && !isLoading;

  return (
    <div
      className={`bg-surface rounded-lg p-4 border border-divider hover:border-border-token transition-colors ${
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
          <h3 className="text-xl font-semibold text-fg">
            {value}
          </h3>
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
  color: PropTypes.oneOf(['gray', 'dark', 'blue', 'green', 'red', 'amber', 'purple', 'cyan', 'rose', 'emerald', 'violet', 'indigo', 'success', 'danger', 'warning', 'primary']),
  trend: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    positive: PropTypes.bool,
  }),
  href: PropTypes.string,
  isLoading: PropTypes.bool,
};

export default React.memo(StatCard);
