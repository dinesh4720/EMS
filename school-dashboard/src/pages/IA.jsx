import { useState } from "react";
import { Check, Circle, AlertCircle, X } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * IA & Checklist — Module-by-module design system audit tracker
 * 4 checks per module/page: Design Audit, Accessibility, Responsive, Tests
 * ────────────────────────────────────────────────────────────────── */

const STATUS = {
  done: { icon: Check, color: "var(--ok)", bg: "var(--ok-bg)" },
  pending: { icon: Circle, color: "var(--fg-subtle)", bg: "transparent" },
  issue: { icon: AlertCircle, color: "var(--warn)", bg: "var(--warn-bg)" },
  blocked: { icon: X, color: "var(--danger)", bg: "var(--danger-bg)" },
};

function CheckBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  const Icon = s.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 520,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.color}20`,
      }}
    >
      <Icon size={11} />
      {status}
    </span>
  );
}

const MODULES = [
  {
    name: "Dashboard",
    pages: [
      { name: "Dashboard", route: "/", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Analytics", route: "/analytics", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Staff",
    pages: [
      { name: "Staff List", route: "/staffs", checks: { design: "done", a11y: "pending", responsive: "done", tests: "pending" } },
      { name: "Staff Dashboard", route: "/staffs/dashboard", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Leave Management", route: "/staffs/leave", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Staff Payroll", route: "/staffs/payroll", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Add Staff", route: "/staffs/add", checks: { design: "done", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Bulk Subjects", route: "/staffs/bulk-subjects", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Students",
    pages: [
      { name: "Students List", route: "/students", checks: { design: "done", a11y: "pending", responsive: "done", tests: "pending" } },
      { name: "Student Dashboard", route: "/students/dashboard", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Attendance", route: "/students/attendance", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Promotion", route: "/students/promotion", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Transfer Certificate", route: "/students/transfer-certificate", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Form Submissions", route: "/students/submissions", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Classes",
    pages: [
      { name: "Classes List", route: "/classes", checks: { design: "in_progress", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Class Dashboard", route: "/classes/:id", checks: { design: "in_progress", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Subjects", route: "/classes/subjects", checks: { design: "in_progress", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Timetable", route: "/classes/timetable", checks: { design: "in_progress", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Attendance", route: "/classes/attendance", checks: { design: "in_progress", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Substitution", route: "/classes/substitution", checks: { design: "in_progress", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Calendar",
    pages: [
      { name: "Calendar", route: "/calendar", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Timetable Wizard", route: "/timetable-wizard", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Messaging",
    pages: [
      { name: "Chat", route: "/messaging", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Announcements", route: "/messaging/announcements", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Notifications", route: "/messaging/notifications", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Reminders", route: "/messaging/reminders", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Communication Logs", route: "/messaging/logs", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Email Campaigns", route: "/messaging/email-campaigns", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Fees",
    pages: [
      { name: "Fees Page", route: "/fees", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Fee Structure Assignment", route: "/fees/assignment", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Refunds", route: "/fees/refunds", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Academics",
    pages: [
      { name: "Academics Overview", route: "/academics", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Exam Management", route: "/academics/exams", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Exam Schedule", route: "/academics/exams/:id", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Results Entry", route: "/academics/exams/:id/results", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Class Performance", route: "/academics/class-performance/:id", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "CBSE Report Card", route: "/academics/cbse-report-card", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "CCE Grading", route: "/academics/cce-grading", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Performance Dashboard", route: "/academics/performance", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Homework",
    pages: [
      { name: "Homework", route: "/homework", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "PTM",
    pages: [
      { name: "PTM Sessions", route: "/ptm", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Front Desk",
    pages: [
      { name: "Front Desk Dashboard", route: "/front-desk", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Admissions List", route: "/front-desk/admissions", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Appointments List", route: "/front-desk/appointments", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Call Logs List", route: "/front-desk/call-logs", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Feedbacks List", route: "/front-desk/feedbacks", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Visitor Log", route: "/front-desk/visitors", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Gate Pass Log", route: "/front-desk/gate-pass", checks: { design: "issue", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Inventory",
    pages: [
      { name: "Inventory Dashboard", route: "/inventory", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Assets", route: "/inventory/assets", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Vendors", route: "/inventory/vendors", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Procurement", route: "/inventory/procurement", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Maintenance", route: "/inventory/maintenance", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Audits", route: "/inventory/audits", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Reports", route: "/inventory/reports", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Hostel",
    pages: [
      { name: "Hostel Dashboard", route: "/hostel", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Hostel List", route: "/hostel/list", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Rooms List", route: "/hostel/rooms", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Allocations List", route: "/hostel/allocations", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Transport",
    pages: [
      { name: "Transport", route: "/transport", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Library",
    pages: [
      { name: "Library Dashboard", route: "/library", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Books List", route: "/library/books", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Issued Books", route: "/library/issued", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Library Reports", route: "/library/reports", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Reports",
    pages: [
      { name: "Reports", route: "/reports", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Export Center", route: "/reports/export", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Data Tools",
    pages: [
      { name: "Bulk Import", route: "/data-tools", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Import History", route: "/data-tools/history", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Govt Export", route: "/data-tools/govt-export", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Background Jobs", route: "/data-tools/jobs", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Intake Forms",
    pages: [
      { name: "Form Assignments", route: "/intake-forms/assignments", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Form Submissions", route: "/intake-forms/submissions", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Enrollment Funnel", route: "/intake-forms/funnel", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Settings",
    pages: [
      { name: "Institution Settings", route: "/settings/institution", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Academic Settings", route: "/settings/academic", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Fee Management", route: "/settings/fees", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Fee Rules", route: "/settings/fee-rules", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Roles & Access", route: "/settings/roles", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "User Management", route: "/settings/users", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Payroll Settings", route: "/settings/payroll", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Communication Settings", route: "/settings/communication", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Attendance Rules", route: "/settings/attendance", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Parent Management", route: "/settings/parents", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Data Cleanup", route: "/settings/data-cleanup", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Trash", route: "/settings/trash", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Subscription", route: "/settings/subscription", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "SSO / SCIM", route: "/settings/sso", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Webhooks", route: "/settings/webhooks", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Super Admin",
    pages: [
      { name: "Schools Panel", route: "/super-admin", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Feature Flags", route: "/super-admin/features", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Changelog", route: "/super-admin/changelog", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Growth Analytics", route: "/super-admin/growth", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "Jobs Dashboard", route: "/super-admin/jobs", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
      { name: "School Health", route: "/super-admin/health", checks: { design: "pending", a11y: "pending", responsive: "pending", tests: "pending" } },
    ],
  },
  {
    name: "Architecture",
    pages: [
      { name: "Style Guide", route: "/style-guide", checks: { design: "done", a11y: "done", responsive: "done", tests: "pending" } },
      { name: "IA & Checklist", route: "/ia", checks: { design: "done", a11y: "done", responsive: "done", tests: "pending" } },
    ],
  },
];

function ModuleCard({ module, isOpen, onToggle }) {
  const doneCount = module.pages.reduce(
    (sum, p) => sum + Object.values(p.checks).filter((c) => c === "done").length,
    0
  );
  const totalCount = module.pages.length * 4;

  return (
    <div style={{ borderBottom: "1px solid var(--divider)" }}>
      <button
        type="button"
        onClick={onToggle}
        className="btn btn--ghost"
        style={{
          width: "100%",
          justifyContent: "space-between",
          padding: "10px 12px",
          fontWeight: 520,
          fontSize: 13,
          color: "var(--fg)",
        }}
      >
        <span>{module.name}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="mono tnum"
            style={{ fontSize: 11, color: "var(--fg-subtle)" }}
          >
            {doneCount}/{totalCount}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--fg-subtle)",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 120ms",
            }}
          >
            ▼
          </span>
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 12px 12px" }}>
          {module.pages.map((page) => (
            <div
              key={page.name}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr repeat(4, auto)",
                gap: 8,
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px solid var(--divider)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                {page.name}
                <code
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--fg-faint)",
                    marginLeft: 6,
                  }}
                >
                  {page.route}
                </code>
              </span>
              <CheckBadge status={page.checks.design} />
              <CheckBadge status={page.checks.a11y} />
              <CheckBadge status={page.checks.responsive} />
              <CheckBadge status={page.checks.tests} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IA() {
  const [openModules, setOpenModules] = useState(() => {
    const saved = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("ia-open-modules") : null;
    return saved ? JSON.parse(saved) : [];
  });

  const toggle = (name) => {
    setOpenModules((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      sessionStorage.setItem("ia-open-modules", JSON.stringify(next));
      return next;
    });
  };

  const totalDone = MODULES.reduce(
    (sum, m) =>
      sum +
      m.pages.reduce(
        (pSum, p) => pSum + Object.values(p.checks).filter((c) => c === "done").length,
        0
      ),
    0
  );
  const totalChecks = MODULES.reduce((sum, m) => sum + m.pages.length * 4, 0);

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="page__head" style={{ paddingBottom: 12 }}>
        <div>
          <h1 className="page__title">IA & Checklist</h1>
          <div className="page__sub">
            <span className="mono tnum">{totalDone}</span> of{" "}
            <span className="mono tnum">{totalChecks}</span> checks complete
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, auto)",
          gap: 8,
          justifyContent: "end",
          padding: "8px 12px",
          fontSize: 11,
          fontWeight: 520,
          color: "var(--fg-subtle)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span>Design Audit</span>
        <span>Accessibility</span>
        <span>Responsive</span>
        <span>Tests</span>
      </div>

      {MODULES.map((mod) => (
        <ModuleCard
          key={mod.name}
          module={mod}
          isOpen={openModules.includes(mod.name)}
          onToggle={() => toggle(mod.name)}
        />
      ))}
    </div>
  );
}
