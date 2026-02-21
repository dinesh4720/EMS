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
    ? 'bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer'
    : 'bg-white rounded-lg border border-gray-200 p-4';

  return (
    <div className={containerClasses} onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        {/* Icon Container */}
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
          {Icon && <Icon size={16} className="text-gray-600" strokeWidth={2} />}
        </div>

        {/* Trend Badge */}
        {trend && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
            trend.positive
              ? 'bg-gray-100 text-gray-600'
              : 'bg-red-50 text-red-600'
          }`}>
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800">
          {value}
        </h3>
        <p className="text-xs font-medium text-gray-500 mt-0.5">
          {label}
        </p>
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-gray-400 mt-2">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default React.memo(StudentStatCard);
