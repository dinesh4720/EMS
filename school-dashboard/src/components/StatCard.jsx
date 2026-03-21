import React from 'react';

// Minimal color palette - only gray tones
const colorMap = {
  gray: { text: 'text-gray-600 dark:text-zinc-400', bg: 'bg-gray-100 dark:bg-zinc-800' },
  dark: { text: 'text-gray-900 dark:text-zinc-100', bg: 'bg-gray-200 dark:bg-zinc-700' },
};

function StatCard({ label, value, subtext, icon: Icon, color = 'gray', trend }) {
  const colors = colorMap[color] || colorMap.gray;

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
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

export default React.memo(StatCard);
