/**
 * Module Registry (frontend mirror of EMS-backend/config/moduleRegistry.js).
 *
 * A "module" is a coarse product area a school can switch on/off in
 * Settings → Modules. CORE modules are always on (the spine of the product);
 * everything else defaults to OFF so a school launches on the core and lights up
 * features one at a time. Keep the keys in sync with the backend registry.
 *
 * The effective enabled set arrives from the server via /permissions/me
 * (`enabledModules`) and is exposed through PermissionContext.isModuleEnabled().
 */

// Always-on. Never rendered as a toggle; their switches are locked.
export const CORE_MODULES = Object.freeze([
  'dashboard',
  'students',
  'staff',
  'classes',
  'attendance',
  'timetable',
  'settings',
]);

const CORE_SET = new Set(CORE_MODULES);

/** Is this module part of the always-on core? */
export const isCoreModule = (key) => CORE_SET.has(key);

// Toggleable modules, grouped for the Settings page. `key` must match a backend
// module key; `group` is purely for UI sectioning.
export const TOGGLEABLE_MODULES = Object.freeze([
  { key: 'academics', label: 'Academics', group: 'Academics', description: 'Exams, results, report cards, homework & PTM' },
  { key: 'fees', label: 'Fees', group: 'Finance', description: 'Fee structures, collection & refunds' },
  { key: 'payroll', label: 'Payroll', group: 'Finance', description: 'Staff salary, payslips & salary templates' },
  { key: 'expenses', label: 'Expenses', group: 'Finance', description: 'Expense tracking & approvals' },
  { key: 'messaging', label: 'Messaging', group: 'Communication', description: 'Chat, announcements, reminders & broadcasts' },
  { key: 'front-desk', label: 'Front Desk', group: 'Operations', description: 'Visitors, gate passes, admissions & enquiries' },
  { key: 'library', label: 'Library', group: 'Operations', description: 'Books, issue/return & catalogue' },
  { key: 'inventory', label: 'Inventory', group: 'Operations', description: 'Assets, procurement & maintenance' },
  { key: 'transport', label: 'Transport', group: 'Operations', description: 'Vehicles, routes & student assignments' },
  { key: 'hostel', label: 'Hostel', group: 'Operations', description: 'Rooms, allocation & hostel attendance' },
  { key: 'reports', label: 'Reports', group: 'Insights', description: 'Cross-module reports & data exports' },
  { key: 'analytics', label: 'Analytics', group: 'Insights', description: 'Business & engagement dashboards' },
  { key: 'intake-forms', label: 'Intake Forms', group: 'Admin', description: 'Custom enrolment forms & submission funnel' },
  { key: 'dataTools', label: 'Data Tools', group: 'Admin', description: 'Bulk import/export & data cleanup' },
  { key: 'audit_logs', label: 'Audit Logs', group: 'Admin', description: 'Admin action trail' },
  { key: 'ai-assistant', label: 'AI Assistant', group: 'Admin', description: 'AI tutor & assistant (plan-gated)' },
]);

export const TOGGLEABLE_MODULE_KEYS = Object.freeze(TOGGLEABLE_MODULES.map((m) => m.key));

export const ALL_MODULE_KEYS = Object.freeze([...CORE_MODULES, ...TOGGLEABLE_MODULE_KEYS]);

/** Stable ordering of the groups as rendered on the Settings page. */
export const MODULE_GROUP_ORDER = Object.freeze([
  'Academics',
  'Finance',
  'Communication',
  'Operations',
  'Insights',
  'Admin',
]);
