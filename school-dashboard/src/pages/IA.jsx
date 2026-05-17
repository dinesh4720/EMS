import { useState } from "react";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Users, GraduationCap, BookOpen, Calendar, MessageSquare,
  IndianRupee, DoorOpen, Building2, Bus, Library, Package,
  ClipboardList, FileBarChart, Database, Award, Wand2,
  Settings, BarChart3, Sparkles, Shield, FileText,
  LayoutDashboard, Layers, CheckSquare
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * Information Architecture — Single source of truth for the entire
 * product flow, module map, and agent work checklist.
 * ────────────────────────────────────────────────────────────────── */

const STATUS = {
  done: { label: "Done", color: "var(--ok)" },
  wip: { label: "In Progress", color: "var(--warn)" },
  todo: { label: "Not Started", color: "var(--fg-muted)" },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.todo;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        background: `${s.color}18`,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

const MODULES = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    route: "/",
    pages: [
      { name: "Main Dashboard", route: "/", checks: { design: "done", a11y: "wip", responsive: "todo", tests: "todo" } },
      { name: "Staff Dashboard", route: "/staffs", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Student Dashboard", route: "/students", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "students",
    name: "Students",
    icon: GraduationCap,
    route: "/students",
    pages: [
      { name: "Student List", route: "/students", checks: { design: "done", a11y: "done", responsive: "done", tests: "wip" } },
      { name: "Add Student", route: "/students/add", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Edit Student", route: "/students/edit/:id", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Student Profile", route: "/students/:id", checks: { design: "wip", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Documents", route: "/students/:id/documents", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Bulk Import", route: "/students/import", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Promotion", route: "/students/promotion", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Transfer Certificate", route: "/students/tc", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Attendance", route: "/students/attendance", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Form Submissions", route: "/students/submissions", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "staff",
    name: "Staff",
    icon: Users,
    route: "/staffs",
    pages: [
      { name: "Staff List", route: "/staffs", checks: { design: "done", a11y: "done", responsive: "done", tests: "wip" } },
      { name: "Add Staff", route: "/staffs/add", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Staff Profile", route: "/staffs/:id", checks: { design: "wip", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Attendance", route: "/staffs/attendance", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Payroll", route: "/staffs/payroll", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Leave Management", route: "/staffs/leave", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Bulk Subject Assignment", route: "/staffs/bulk-subjects", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "classes",
    name: "Classes",
    icon: BookOpen,
    route: "/classes",
    pages: [
      { name: "Class List", route: "/classes", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Timetable", route: "/classes/timetable", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Subjects", route: "/classes/subjects", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Attendance", route: "/classes/attendance", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Substitution", route: "/classes/substitution", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "academics",
    name: "Academics",
    icon: Award,
    route: "/academics",
    pages: [
      { name: "Exams", route: "/academics", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Marks Entry", route: "/academics/marks-entry", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Results", route: "/academics/results", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Performance", route: "/academics/performance", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "CBSE Report Card", route: "/academics/cbse-report-card", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "CCE Grading", route: "/academics/cce-grading", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Homework", route: "/homework", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "PTM", route: "/ptm", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "fees",
    name: "Fees",
    icon: IndianRupee,
    route: "/fees",
    pages: [
      { name: "Fee Collection", route: "/fees", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Fee Structure", route: "/fees/structure", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Reports", route: "/fees/reports", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Defaulters", route: "/fees/defaulters", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Refunds", route: "/fees/refunds", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: Calendar,
    route: "/calendar",
    pages: [
      { name: "School Calendar", route: "/calendar", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Events", route: "/calendar/events", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "messaging",
    name: "Messaging",
    icon: MessageSquare,
    route: "/messaging",
    pages: [
      { name: "Chat", route: "/messaging", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Announcements", route: "/messaging/announcements", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Notifications", route: "/messaging/notifications", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Reminders", route: "/messaging/reminders", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "front-desk",
    name: "Front Desk",
    icon: DoorOpen,
    route: "/front-desk",
    pages: [
      { name: "Visitors", route: "/front-desk", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Appointments", route: "/front-desk/appointments", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Gate Pass", route: "/front-desk/gate-pass", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Call Logs", route: "/front-desk/call-logs", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Feedbacks", route: "/front-desk/feedbacks", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Admissions", route: "/front-desk/admissions", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "hostel",
    name: "Hostel",
    icon: Building2,
    route: "/hostel",
    pages: [
      { name: "Hostel Dashboard", route: "/hostel", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Hostels", route: "/hostel/hostels", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Rooms", route: "/hostel/rooms", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Allocations", route: "/hostel/allocations", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "transport",
    name: "Transport",
    icon: Bus,
    route: "/transport",
    pages: [
      { name: "Routes", route: "/transport", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Vehicles", route: "/transport/vehicles", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Student Assignment", route: "/transport/students", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "library",
    name: "Library",
    icon: Library,
    route: "/library",
    pages: [
      { name: "Books", route: "/library", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Issued Books", route: "/library/issued", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Reports", route: "/library/reports", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: Package,
    route: "/inventory",
    pages: [
      { name: "Assets", route: "/inventory", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Vendors", route: "/inventory/vendors", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Procurement", route: "/inventory/procurement", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Maintenance", route: "/inventory/maintenance", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Audits", route: "/inventory/audits", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Reports", route: "/inventory/reports", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    icon: FileBarChart,
    route: "/reports",
    pages: [
      { name: "Reports Center", route: "/reports", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Export Center", route: "/reports/export", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: BarChart3,
    route: "/analytics",
    pages: [
      { name: "Analytics Dashboard", route: "/analytics", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "data-tools",
    name: "Data Tools",
    icon: Database,
    route: "/data-tools",
    pages: [
      { name: "Bulk Import", route: "/data-tools", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Background Jobs", route: "/data-tools/jobs", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Govt Export", route: "/data-tools/export", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "intake-forms",
    name: "Intake Forms",
    icon: FileText,
    route: "/intake-forms",
    pages: [
      { name: "Form Assignments", route: "/intake-forms/assignments", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Submissions", route: "/intake-forms/submissions", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Enrollment Funnel", route: "/intake-forms/funnel", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    route: "/settings",
    pages: [
      { name: "Institution", route: "/settings/institution", checks: { design: "done", a11y: "wip", responsive: "todo", tests: "todo" } },
      { name: "Academic", route: "/settings/academic", checks: { design: "done", a11y: "wip", responsive: "todo", tests: "todo" } },
      { name: "Fee Heads", route: "/settings/fee-heads", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Fee Rules", route: "/settings/fee-rules", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Fee Templates", route: "/settings/fee-templates", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Payroll", route: "/settings/payroll", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Salary Templates", route: "/settings/salary-templates", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Leave", route: "/settings/leave", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Attendance Rules", route: "/settings/attendance-rules", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Period", route: "/settings/period", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Hierarchy", route: "/settings/hierarchy", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Holidays", route: "/settings/holidays", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Communication", route: "/settings/communication", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Intake Forms", route: "/settings/intake-forms", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "User Management", route: "/settings/users", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Roles & Access", route: "/settings/roles", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Parent Management", route: "/settings/parents", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Staff ID", route: "/settings/staff-id", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Promotion Rules", route: "/settings/promotion-rules", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Subscription", route: "/settings/subscription", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Trash", route: "/settings/trash", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "SSO", route: "/settings/sso", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "SCIM", route: "/settings/scim", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Webhooks", route: "/settings/webhooks", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Data Cleanup", route: "/settings/data-cleanup", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Seed Data", route: "/settings/seed", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "NPS Analytics", route: "/settings/nps", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Active Sessions", route: "/settings/sessions", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Permission Requests", route: "/settings/permissions", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Admission Form", route: "/settings/admission-form", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Workspace", route: "/settings/workspace", checks: { design: "done", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "super-admin",
    name: "Super Admin",
    icon: Shield,
    route: "/super-admin",
    pages: [
      { name: "Schools", route: "/super-admin", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Jobs", route: "/super-admin/jobs", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Feature Flags", route: "/super-admin/features", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
      { name: "Growth Analytics", route: "/super-admin/growth", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
  {
    id: "ai-assistant",
    name: "AI Assistant",
    icon: Sparkles,
    route: "/ai-assistant",
    pages: [
      { name: "AI Chat", route: "/ai-assistant", checks: { design: "todo", a11y: "todo", responsive: "todo", tests: "todo" } },
    ],
  },
];

const CHECK_LABELS = {
  design: "Design Audit",
  a11y: "Accessibility",
  responsive: "Responsive",
  tests: "Tests",
};

function ModuleCard({ module, expanded, onToggle }) {
  const Icon = module.icon;
  const total = module.pages.length;
  const done = module.pages.filter((p) =>
    Object.values(p.checks).every((c) => c === "done")
  ).length;

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 12,
          border: "1px solid var(--border-subtle)",
          background: expanded ? "var(--surface-hover)" : "var(--surface)",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--fg)",
        }}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Icon size={16} strokeWidth={1.8} />
        <span style={{ flex: 1 }}>{module.name}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-muted)" }}>
          {done}/{total} pages done
        </span>
      </button>

      {expanded && (
        <div
          style={{
            marginTop: 8,
            marginLeft: 8,
            padding: "12px 16px",
            borderRadius: 12,
            background: "var(--surface-raised)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--fg-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <th style={{ textAlign: "left", padding: "8px 4px" }}>Page</th>
                <th style={{ textAlign: "center", padding: "8px 4px" }}>Design</th>
                <th style={{ textAlign: "center", padding: "8px 4px" }}>A11y</th>
                <th style={{ textAlign: "center", padding: "8px 4px" }}>Responsive</th>
                <th style={{ textAlign: "center", padding: "8px 4px" }}>Tests</th>
              </tr>
            </thead>
            <tbody>
              {module.pages.map((page) => (
                <tr key={page.name} style={{ borderTop: "1px solid var(--border-faint)" }}>
                  <td style={{ padding: "10px 4px", fontWeight: 500 }}>{page.name}</td>
                  {["design", "a11y", "responsive", "tests"].map((key) => (
                    <td key={key} style={{ textAlign: "center", padding: "10px 4px" }}>
                      {page.checks[key] === "done" ? (
                        <CheckCircle2 size={16} color="var(--ok)" />
                      ) : page.checks[key] === "wip" ? (
                        <Circle size={16} color="var(--warn)" />
                      ) : (
                        <Circle size={16} color="var(--fg-faint)" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductFlow() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Layers size={18} /> Product Flow
      </h2>
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          fontSize: 13,
          lineHeight: 1.7,
        }}
      >
        <p style={{ marginBottom: 12 }}>
          <strong>School Dashboard</strong> is built around three core personas:
          <strong> Administrators</strong> (principal, admin, accountant),
          <strong> Teachers</strong>, and <strong>Front Desk</strong> staff.
        </p>
        <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li>
            <strong>Onboarding & Settings</strong> — School configures institution details,
            academic year, fee structure, roles, and permissions in <em>Settings</em>.
          </li>
          <li>
            <strong>People Management</strong> — Staff and students are added via <em>Staff</em> and
            <em> Students</em> modules. Bulk import and intake forms streamline admissions.
          </li>
          <li>
            <strong>Academic Operations</strong> — Classes, timetables, attendance, homework,
            exams, and results are managed in <em>Classes</em> and <em>Academics</em>.
          </li>
          <li>
            <strong>Financial Operations</strong> — Fee collection, payroll, and reports are
            handled in <em>Fees</em> and <em>Staff &gt; Payroll</em>.
          </li>
          <li>
            <strong>Communication</strong> — Chat, announcements, reminders, and PTM scheduling
            happen in <em>Messaging</em> and <em>PTM</em>.
          </li>
          <li>
            <strong>Facilities</strong> — Hostel rooms, transport routes, library books, and
            inventory assets are tracked in their respective modules.
          </li>
          <li>
            <strong>Analytics & Reports</strong> — Data flows into <em>Analytics</em>,
            <em> Reports</em>, and <em>Data Tools</em> for exports and insights.
          </li>
        </ol>
        <p style={{ color: "var(--fg-muted)", fontSize: 12 }}>
          Every module feeds data upstream. A student enrolled in <em>Students</em> appears in
          <em> Classes</em>, <em>Fees</em>, <em>Attendance</em>, and <em>Reports</em> automatically.
        </p>
      </div>
    </div>
  );
}

function OverallProgress() {
  const allPages = MODULES.flatMap((m) => m.pages);
  const total = allPages.length;
  const byCheck = {
    design: allPages.filter((p) => p.checks.design === "done").length,
    a11y: allPages.filter((p) => p.checks.a11y === "done").length,
    responsive: allPages.filter((p) => p.checks.responsive === "done").length,
    tests: allPages.filter((p) => p.checks.tests === "done").length,
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <CheckSquare size={18} /> Overall Progress
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {Object.entries(CHECK_LABELS).map(([key, label]) => {
          const pct = Math.round((byCheck[key] / total) * 100);
          return (
            <div
              key={key}
              style={{
                padding: 16,
                borderRadius: 12,
                background: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                {byCheck[key]}/{total}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{pct}% complete</div>
              <div
                style={{
                  marginTop: 10,
                  height: 4,
                  borderRadius: 2,
                  background: "var(--surface-hover)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: 2,
                    background: pct === 100 ? "var(--ok)" : pct > 50 ? "var(--warn)" : "var(--info)",
                    transition: "width 300ms ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IA() {
  const [expanded, setExpanded] = useState(() => {
    const first = {};
    MODULES.forEach((m) => { first[m.id] = false; });
    first.students = true;
    first.staff = true;
    return first;
  });

  const toggle = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="page" style={{ paddingBottom: 64 }}>
      <div className="sg-toolbar">
        <div>
          <h1 className="sg-toolbar__title">Information Architecture</h1>
          <p className="sg-toolbar__sub">
            Product flow · module map · agent checklist · coverage tracker
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
        <ProductFlow />
        <OverallProgress />

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={18} /> Module Checklist
        </h2>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 20 }}>
          Agents: pick ONE module at a time. Update this page when checks are complete.
          Green = done · Yellow = in progress · Grey = not started.
        </p>

        {MODULES.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            expanded={expanded[module.id]}
            onToggle={() => toggle(module.id)}
          />
        ))}
      </div>
    </div>
  );
}
