/**
 * Utility functions for the Timetable module.
 * Provides subject-to-color mapping and Tailwind class generation.
 */

export const getSubjectColor = (subject) => {
  if (!subject) return "default";
  const colors = {
    Mathematics: "primary", Math: "primary",
    Science: "success", Physics: "success", Chemistry: "success", Biology: "success",
    English: "warning",
    Hindi: "danger",
    History: "secondary", Geography: "secondary", "Social Studies": "secondary",
    Computer: "secondary", "Computer Science": "secondary",
    Art: "warning",
    Music: "success",
    Library: "default",
    PT: "danger", "Physical Education": "danger"
  };
  return colors[subject] || "default";
};

// Get Tailwind classes for subject cards — supports dark mode
export const getSubjectClasses = (subject) => {
  const color = getSubjectColor(subject);
  const colorMap = {
    primary:   { card: 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800',     text: 'text-blue-700 dark:text-blue-300',   pill: 'bg-blue-100/60 dark:bg-blue-900/60' },
    success:   { card: 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', pill: 'bg-green-100/60 dark:bg-green-900/60' },
    warning:   { card: 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300', pill: 'bg-yellow-100/60 dark:bg-yellow-900/60' },
    danger:    { card: 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800',         text: 'text-red-700 dark:text-red-300',     pill: 'bg-red-100/60 dark:bg-red-900/60' },
    secondary: { card: 'bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', pill: 'bg-purple-100/60 dark:bg-purple-900/60' },
    default:   { card: 'bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700',    text: 'text-gray-700 dark:text-zinc-300',   pill: 'bg-gray-100/60 dark:bg-zinc-700/60' },
  };
  return colorMap[color] || colorMap.default;
};
