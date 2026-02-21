import React from 'react';

// Minimal color palette - only gray tones
const colorMap = {
  gray: { text: 'text-gray-600', bg: 'bg-gray-100' },
  dark: { text: 'text-gray-900', bg: 'bg-gray-200' },
};

function StatCard({ label, value, subtext, icon: Icon, color = 'gray', trend }) {
  const colors = colorMap[color] || colorMap.gray;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        {/* Icon */}
        <div className={`${colors.bg} w-9 h-9 rounded-lg flex items-center justify-center`}>
          <Icon size={16} className={colors.text} strokeWidth={2} />
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

export default React.memo(StatCard);
