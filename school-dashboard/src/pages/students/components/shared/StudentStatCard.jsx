import React from 'react';

/**
 * StudentStatCard - Minimal stat card for student dashboard
 *
 * @param {React.Component} icon - Icon component to display
 * @param {string} label - The stat label
 * @param {string|number} value - The stat value
 * @param {string} subtext - Optional subtext
 * @param {object} trend - Optional trend object { positive: boolean, value: string }
 * @param {function} onClick - Optional click handler
 */
function StudentStatCard({ icon: Icon, label, value, subtext, trend, onClick }) {
  const containerClasses = onClick
    ? 'bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors cursor-pointer'
    : 'bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4';

  return (
    <div className={containerClasses} onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        {/* Icon Container */}
        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          {Icon && <Icon size={16} className="text-gray-600 dark:text-zinc-400" strokeWidth={2} />}
        </div>

        {/* Trend Badge */}
        {trend && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
            trend.positive
              ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
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

export default React.memo(StudentStatCard);
