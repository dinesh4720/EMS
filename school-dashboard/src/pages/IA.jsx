import { useState } from "react";
import {
  Palette,
  Accessibility,
  Smartphone,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * IA & Checklist — module-by-module design system tracking
 * Update this file after every audit so the next agent knows
 * exactly what has been checked and what is still open.
 * ────────────────────────────────────────────────────────────────── */

const CHECKS = [
  { key: "design", label: "Design Audit", icon: Palette },
  { key: "a11y", label: "Accessibility", icon: Accessibility },
  { key: "responsive", label: "Responsive", icon: Smartphone },
  { key: "tests", label: "Tests", icon: FlaskConical },
];

const MODULES = [
  {
    name: "Dashboard",
    dir: "dashboard/",
    pages: ["Dashboard.jsx", "Analytics.jsx"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Staffs",
    dir: "staffs/",
    pages: ["StaffList", "StaffDashboard", "AddStaffComposer", "LeaveManagement", "StaffPayroll", "TeacherTimetableEditor"],
    checks: { design: true, a11y: true, responsive: true, tests: false },
    note: "Canonical reference implementation",
  },
  {
    name: "Students",
    dir: "students/",
    pages: ["StudentsList", "StudentDashboard", "AddStudentComposer", "StudentAttendance", "StudentPromotionPage"],
    checks: { design: true, a11y: true, responsive: true, tests: false },
    note: "Canonical reference implementation",
  },
  {
    name: "Classes",
    dir: "classes/",
    pages: ["ClassesPage", "Attendance", "Timetable", "ClassDashboard"],
    checks: { design: true, a11y: false, responsive: false, tests: false },
    note: "Partially migrated (DK-417)",
  },
  {
    name: "Academics",
    dir: "academics/",
    pages: ["CBSEReportCardPage", "CCEGradingPage", "ClassPerformance", "CreateExamModal", "ExamDetail", "ResultsEntry"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Calendar",
    dir: "calendar/",
    pages: ["AddEventDrawer", "DayView", "MonthView", "WeekView", "ScheduleView"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Fees",
    dir: "fees/",
    pages: ["Fees pages"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Front Desk",
    dir: "front-desk/",
    pages: ["FrontDeskPage", "FrontDeskDashboard", "VisitorLog", "GatePassLog", "AppointmentsList", "CallLogsList", "FeedbacksList", "AdmissionsList"],
    checks: { design: "in-progress", a11y: false, responsive: false, tests: false },
    note: "Audit in progress — 2026-05-22",
  },
  {
    name: "Homework",
    dir: "homework/",
    pages: ["Homework pages"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Hostel",
    dir: "hostel/",
    pages: ["HostelList", "RoomsList", "AllocationsList"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Intake Forms",
    dir: "intake-forms/",
    pages: ["EnrollmentFunnel", "FormAssignments", "FormSubmissions"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Inventory",
    dir: "inventory/",
    pages: ["Assets", "Audits", "Maintenance", "Procurement", "Vendors"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Library",
    dir: "library/",
    pages: ["BooksList", "IssuedBooksList", "AddBookModal", "IssueBookModal", "ReturnBookModal"],
    checks: { design: true, a11y: false, responsive: false, tests: false },
    note: "Partially migrated (DK-446)",
  },
  {
    name: "Messaging",
    dir: "messaging/",
    pages: ["EmailCampaignsPage", "ChatMessageList", "AnnouncementsList", "RemindersList"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "PTM",
    dir: "ptm/",
    pages: ["PTM pages"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Reports",
    dir: "reports/",
    pages: ["Reports pages"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Settings",
    dir: "settings/",
    pages: ["AcademicSettings", "UserManagement", "FeeManagementSettings", "PayrollSettings", "LeaveSettings", "AttendanceRules"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Super Admin",
    dir: "super-admin/",
    pages: ["Super admin pages"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Transport",
    dir: "transport/",
    pages: ["RoutesTab", "VehiclesTab", "RouteModal", "VehicleModal", "StudentAssignModal"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
  {
    name: "Data Tools",
    dir: "data-tools/",
    pages: ["Data tools pages"],
    checks: { design: false, a11y: false, responsive: false, tests: false },
  },
];

function StatusIcon({ status }) {
  if (status === true) return <CheckCircle2 size={14} className="status-icon status-icon--ok" aria-label="Done" />;
  if (status === "in-progress") return <Clock size={14} className="status-icon status-icon--warn" aria-label="In progress" />;
  return <Circle size={14} className="status-icon status-icon--subtle" aria-label="Not started" />;
}

function ModuleRow({ module }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ia-module">
      <button
        className="ia-module__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="ia-module__name">{module.name}</span>
        <span className="ia-module__dir">{module.dir}</span>
        {module.note && <span className="ia-module__note">{module.note}</span>}
        <span style={{ flex: 1 }} />
        <div className="ia-module__checks">
          {CHECKS.map((c) => (
            <span key={c.key} className="ia-check" title={c.label}>
              <StatusIcon status={module.checks[c.key]} />
            </span>
          ))}
        </div>
      </button>

      {open && (
        <div className="ia-module__body">
          <ul className="ia-page-list">
            {module.pages.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function IA() {
  return (
    <div className="page" style={{ paddingBottom: 64 }}>
      <header className="page__head">
        <h1 className="page__title">IA &amp; Checklist</h1>
        <p className="page__sub">Module-by-module design system, accessibility, responsive, and test tracking</p>
      </header>

      <div className="ia-legend">
        {CHECKS.map((c) => (
          <span key={c.key} className="ia-legend__item">
            <c.icon size={13} aria-hidden /> {c.label}
          </span>
        ))}
      </div>

      <div className="ia-list">
        {MODULES.map((m) => (
          <ModuleRow key={m.name} module={m} />
        ))}
      </div>
    </div>
  );
}
