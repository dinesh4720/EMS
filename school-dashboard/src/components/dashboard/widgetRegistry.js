/**
 * Dashboard Widget Registry
 *
 * Central configuration for all dashboard widgets.
 * Each widget declares its metadata and default sizing.
 */

export const WIDGET_SIZES = {
  full: { className: "widget--full", label: "Full width" },
  large: { className: "widget--large", label: "Large" },
  medium: { className: "widget--medium", label: "Medium" },
};

export const WIDGET_CATALOG = [
  {
    key: "kpiStrip",
    label: "KPI strip",
    description: "Attendance, fees, enrollment, defaulters",
    size: "full",
    defaultVisible: true,
    category: "analytics",
  },
  {
    key: "feeTrend",
    label: "Fee collection trend",
    description: "Monthly fee receipts over last 6 months",
    size: "large",
    defaultVisible: true,
    category: "analytics",
  },
  {
    key: "attendanceTrend",
    label: "Attendance trend",
    description: "Student and staff attendance rates",
    size: "large",
    defaultVisible: true,
    category: "analytics",
  },
  {
    key: "enrollmentStats",
    label: "Enrollment stats",
    description: "Students by class/grade",
    size: "medium",
    defaultVisible: true,
    category: "analytics",
  },
  {
    key: "recentActivity",
    label: "Recent activity",
    description: "System events and audit trail",
    size: "medium",
    defaultVisible: true,
    category: "activity",
  },
  {
    key: "yourDay",
    label: "Your day",
    description: "Schedule and timeline",
    size: "medium",
    defaultVisible: true,
    category: "operations",
  },
  {
    key: "actions",
    label: "Actions",
    description: "Alerts and action items",
    size: "medium",
    defaultVisible: true,
    category: "operations",
  },
  {
    key: "people",
    label: "People",
    description: "Staff and student pulse",
    size: "large",
    defaultVisible: true,
    category: "operations",
  },
  {
    key: "announcements",
    label: "Notices",
    description: "Recent announcements",
    size: "medium",
    defaultVisible: true,
    category: "operations",
  },
  {
    key: "recentPayments",
    label: "Recent payments",
    description: "Latest fee payments",
    size: "medium",
    defaultVisible: true,
    category: "operations",
  },
];

export const DEFAULT_WIDGET_ORDER = WIDGET_CATALOG.map((w) => w.key);

export function getDefaultVisibility() {
  return Object.fromEntries(
    WIDGET_CATALOG.map((w) => [w.key, w.defaultVisible])
  );
}

export function getWidgetMeta(key) {
  return WIDGET_CATALOG.find((w) => w.key === key) || null;
}
