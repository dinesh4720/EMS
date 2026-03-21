/**
 * StudentDashboard Utility Functions
 * Extracted from StudentDashboard.jsx for better code organization
 */

/**
 * Confirm permanent deletion of a student with a browser dialog
 * @param {string} studentName - Name of the student
 * @param {Function} t - i18n translation function
 * @returns {boolean} Whether the user confirmed
 */
export function confirmPermanentDeletion(studentName, t) {
  return window.confirm(t('students.confirmPermanentDeletion', 'Permanently delete {{name}}? This removes linked attendance, fees, and parent-contact data.', { name: studentName }));
}

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
