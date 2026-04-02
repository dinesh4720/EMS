import React from 'react';
import PropTypes from 'prop-types';

const colorMap = {
  gray: { text: 'text-gray-600 dark:text-zinc-400', bg: 'bg-gray-100 dark:bg-zinc-800' },
  dark: { text: 'text-gray-900 dark:text-zinc-100', bg: 'bg-gray-200 dark:bg-zinc-700' },
  blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
  red: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
  amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950' },
  cyan: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  violet: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950' },
  indigo: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  // Semantic aliases
  success: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
  danger: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
  warning: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  primary: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
};

function StatCard({ label, value, subtext, icon: Icon, color = 'gray', trend }) {
  const colors = colorMap[color] || colorMap.gray;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        {/* Icon */}
        <div className={`${colors.bg} w-9 h-9 rounded-lg flex items-center justify-center`}>
          <Icon size={16} className={colors.text} strokeWidth={2} />
        </div>

        {/* Trend Badge */}
        {trend && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
            trend.positive
              ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
              : 'bg-red-50 dark:bg-red-950 text-red-600'
          }`}>
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-100">
          {value}
        </h3>
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">
          {label}
        </p>
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
          {subtext}
        </p>
      )}
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
};

export default React.memo(StatCard);
