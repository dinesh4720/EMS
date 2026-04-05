/**
 * StudentDashboard Utility Functions
 * Extracted from StudentDashboard.jsx for better code organization
 */

// confirmPermanentDeletion removed — replaced by ConfirmDialog modal in StudentDashboard.jsx

/**
 * Custom Recharts tooltip component for performance/attendance charts
 */
export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <div key={entry.name || `entry-${i}`} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
