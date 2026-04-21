// ============================================================================
// STUDENT DASHBOARD HELPERS
// Utility functions and small helper components extracted from StudentDashboard
// ============================================================================
import { escapeHtml } from '../../../utils/sanitize';
import { getDateLocale } from '../../../i18n/index';

// Helper to get next class for promotion
export const getNextClass = (currentClass, _availableClasses) => {
  if (!currentClass || currentClass === "Alumni" || currentClass === "Passed Out / Alumni") return null;
  const preschoolMap = { "Nursery": "KG", "KG": "1", "LKG": "UKG", "UKG": "1" };
  for (const [from, to] of Object.entries(preschoolMap)) {
    if (currentClass.startsWith(from)) {
      const sectionMatch = currentClass.match(/-[A-Z]$/i);
      return `${to}${sectionMatch ? sectionMatch[0] : ""}`;
    }
  }
  const match = currentClass.match(/^(\d+)(?:-([A-Z]))?$/i);
  if (!match) return null;
  const currentGrade = parseInt(match[1]);
  if (currentGrade >= 12) return "Passed Out / Alumni";
  return `${currentGrade + 1}${match[2] ? `-${match[2]}` : ""}`;
};

// Custom Tooltip for Recharts
export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50">
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">{label}</p>
        {payload.map((entry) => (
          <div key={`tooltip-${entry.name}`} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-600 dark:text-zinc-400">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-zinc-100">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
