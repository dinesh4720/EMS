/**
 * Date utility functions for student forms
 * Extracted from AddStudent.jsx
 */

/**
 * Convert DD/MM/YYYY string to ISO format (YYYY-MM-DD)
 * @param {string} ddmmyy - Date string in DD/MM/YYYY format
 * @returns {string} Date in YYYY-MM-DD format, or empty string if invalid
 */
export const ddmmyyToIso = (ddmmyy) => {
  if (!ddmmyy || typeof ddmmyy !== 'string') return '';
  const parts = ddmmyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!parts) return '';
  const [, day, month, year] = parts;
  return `${year}-${month}-${day}`;
};

/**
 * Convert ISO format (YYYY-MM-DD) to DD/MM/YYYY string
 * @param {string} iso - Date string in YYYY-MM-DD format
 * @returns {string} Date in DD/MM/YYYY format, or empty string if invalid
 */
export const isoToDdmmyy = (iso) => {
  if (!iso || typeof iso !== 'string') return '';
  const parts = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return '';
  const [, year, month, day] = parts;
  return `${day}/${month}/${year}`;
};
