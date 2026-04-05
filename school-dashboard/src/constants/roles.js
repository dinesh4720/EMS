// Centralized role definitions for the entire application
// This ensures consistency between staff management and user permissions

export const STAFF_ROLES = [
  "Super Admin",
  "Admin",
  "Teacher",
  "Principal",
  "Vice Principal",
  "Accountant",
  "Librarian",
  "Lab Assistant",
  "Receptionist",
  "Counselor",
  "Driver",
  "Security",
  "Administrative", // Legacy - maps to Admin
  "Teaching",       // Legacy - maps to Teacher
];

// Map staff roles to user permission roles (for backward compatibility)
export const ROLE_MAPPING = {
  "Super Admin": "super-admin",
  "Admin": "admin",
  "Administrative": "admin", // Legacy - will be migrated to "Admin"
  "Administration": "admin", // Legacy - will be migrated to "Admin"
  "Teacher": "teacher",
  "Teaching": "teacher", // Legacy - will be migrated to "Teacher"
  "Principal": "principal",
  "Vice Principal": "vice-principal",
  "Accountant": "accountant",
  "Librarian": "librarian",
  "Lab Assistant": "lab-assistant",
  "Receptionist": "receptionist",
  "Counselor": "counselor",
  "Driver": "driver",
  "Security": "security"
};

// Get user permission role from staff role
export const getUserRoleFromStaffRole = (staffRole) => {
  return ROLE_MAPPING[staffRole] || "teacher";
};

// Get display name for role (normalize legacy names)
export const getRoleDisplayName = (role) => {
  // Normalize legacy role names
  if (role === "Teaching") return "Teacher";
  if (role === "Administrative" || role === "Administration") return "Admin";
  return role;
};

// Normalize role name (convert legacy to current)
export const normalizeRole = (role) => {
  if (role === "Teaching") return "Teacher";
  if (role === "Administrative" || role === "Administration") return "Admin";
  return role;
};
