/**
 * Centralized grading utility.
 *
 * All grade thresholds live here so every page renders consistent results.
 * To customize per-school, replace the default thresholds with values
 * fetched from school settings.
 */

const DEFAULT_GRADE_SCALE = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A' },
  { min: 70, grade: 'B+' },
  { min: 60, grade: 'B' },
  { min: 50, grade: 'C+' },
  { min: 40, grade: 'C' },
  { min: 35, grade: 'D' },
];

/**
 * Get grade letter from a percentage value.
 * @param {number} percentage - 0–100
 * @param {Array} [scale] - custom grade scale (sorted desc by min)
 * @returns {string} grade letter, e.g. 'A+', 'B', 'F'
 */
export function getGradeFromPercentage(percentage, scale = DEFAULT_GRADE_SCALE) {
  if (percentage == null || isNaN(percentage)) return '—';
  for (const { min, grade } of scale) {
    if (percentage >= min) return grade;
  }
  return 'F';
}

/**
 * Calculate grade from marks and total marks.
 * @param {number} marks
 * @param {number} totalMarks - defaults to 100
 * @param {Array} [scale]
 * @returns {string} grade letter
 */
export function calculateGrade(marks, totalMarks = 100, scale) {
  if (marks == null || totalMarks <= 0) return '—';
  const percentage = (marks / totalMarks) * 100;
  return getGradeFromPercentage(percentage, scale);
}

/**
 * Get a colour token for a percentage value (for Chip / progress bar).
 * Returns: 'success' | 'primary' | 'warning' | 'danger'
 */
export function getPercentageColor(percentage) {
  if (percentage >= 90) return 'success';
  if (percentage >= 75) return 'primary';
  if (percentage >= 50) return 'warning';
  return 'danger';
}

/**
 * Get a colour token for a grade letter (for Chip / badge).
 */
export function getGradeColor(grade) {
  if (!grade) return 'default';
  const g = grade.toUpperCase();
  if (g === 'A+' || g === 'A') return 'success';
  if (g === 'B+' || g === 'B') return 'primary';
  if (g === 'C+' || g === 'C') return 'warning';
  return 'danger';
}

/**
 * Get the attendance colour based on percentage.
 */
export function getAttendanceColor(percentage) {
  if (percentage >= 90) return 'success';
  if (percentage >= 75) return 'primary';
  if (percentage >= 50) return 'warning';
  return 'danger';
}
