import { getStoredAuthToken } from "../../../utils/authSession";
import { getDateLocale } from '../../../i18n/index';


/**
 * Student Helper Utilities
 * Reusable functions for student-related operations
 */

/**
 * Get authentication token from session storage
 * @returns {string|null} The auth token or null
 */
export const getAuthToken = () => {
  return getStoredAuthToken();
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Calculate next class for automatic promotion
 * @param {string} currentClass - Current class (e.g., "9-A")
 * @param {string[]} availableClasses - List of available classes
 * @returns {string|null} Next class or null if cannot promote
 */
export const getNextClass = (currentClass, availableClasses = []) => {
  if (!currentClass || currentClass === "Alumni" || currentClass === "Passed Out / Alumni") {
    return null;
  }

  const preschoolMap = {
    "Nursery": "KG",
    "KG": "1",
    "LKG": "UKG",
    "UKG": "1"
  };

  for (const [from, to] of Object.entries(preschoolMap)) {
    if (currentClass.startsWith(from)) {
      const sectionMatch = currentClass.match(/-[A-Z]$/i);
      const section = sectionMatch ? sectionMatch[0] : "";
      return `${to}${section}`;
    }
  }

  const match = currentClass.match(/^(\d+)-([A-Z])$/i);
  if (!match) {
    const numMatch = currentClass.match(/^(\d+)$/);
    if (!numMatch) return null;
    const currentGrade = parseInt(numMatch[1]);
    if (currentGrade >= 12) return "Passed Out / Alumni";
    return `${currentGrade + 1}`;
  }

  const currentGrade = parseInt(match[1]);
  const section = match[2];

  if (currentGrade >= 12) return "Passed Out / Alumni";

  const nextClass = `${currentGrade + 1}-${section}`;

  if (availableClasses && availableClasses.length > 0) {
    const classExists = availableClasses.some(c => c === nextClass || c.startsWith(`${currentGrade + 1}-`));
    if (!classExists) {
      const anyNextGrade = availableClasses.find(c => c.startsWith(`${currentGrade + 1}-`));
      if (anyNextGrade) return anyNextGrade;
    }
  }

  return nextClass;
};

/**
 * Calculate attendance statistics
 * @param {Array} attendance - Array of attendance records
 * @returns {Object} Attendance stats { present, absent, total, percentage }
 */
export const calculateAttendanceStats = (attendance = []) => {
  if (!attendance || attendance.length === 0) {
    return { present: 0, absent: 0, total: 0, percentage: 0 };
  }

  const normalize = (s = "") => {
    const lower = s.toLowerCase().trim();
    if (lower === "p" || lower === "present") return "present";
    if (lower === "a" || lower === "absent") return "absent";
    return lower;
  };

  const normalized = attendance.map(a => normalize(a.status));
  const present = normalized.filter(s => s === "present").length;
  const absent = normalized.filter(s => s === "absent").length;
  const total = attendance.length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { present, absent, total, percentage };
};

/**
 * Format date for display
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };
  return d.toLocaleDateString(getDateLocale(), options[format] || options.short);
};

/**
 * Get initials from a name
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generate a random color based on a string (for avatars)
 */
export const getAvatarColor = (str) => {
  const colors = ['bg-gray-400', 'bg-slate-500', 'bg-zinc-500', 'bg-neutral-500'];
  const index = str ? str.charCodeAt(0) % colors.length : 0;
  return colors[index];
};
