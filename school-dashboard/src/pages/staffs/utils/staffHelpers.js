/**
 * Shared staff helpers used across the staff module.
 */

/**
 * Check whether a staff member is considered "active".
 * Handles case-insensitive status, undefined/null status, and
 * non-string status values defensively.
 */
export const isActiveStaff = (s) => {
  if (!s) return false;
  const status = (s.status || "").toString().toLowerCase().trim();
  return status === "active" || !s.status;
};
