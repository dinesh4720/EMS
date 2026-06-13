import { useState, useMemo } from "react";
import { Search, CheckCircle2, Circle, Loader2 } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * IA & Checklist — Information Architecture and page-by-page audit
 * tracker for all 21 school-dashboard modules.
 *
 * Checklist per page: Design Audit | Accessibility | Responsive | Tests
 * ────────────────────────────────────────────────────────────────── */

const CHECKS = ["Design Audit", "Accessibility", "Responsive", "Tests"];

const MODULES = [
  {
    name: "Academics",
    pages: [
      "AcademicsPage",
      "ExamManagement",
      "ResultsEntry",
      "ClassPerformance",
      "CBSEReportCard",
      "CCEGrading",
      "ExamScheduleView",
    ],
    status: ["✅", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-29",
    issue: "DK-608",
  },
  {
    name: "Calendar",
    pages: ["CalendarPage"],
    status: ["🔄", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-29",
    issue: "DK-656",
  },
  {
    name: "Classes",
    pages: [
      "ClassesPage",
      "ClassDashboard",
      "Subjects",
      "Timetable",
      "Substitution",
      "BulkClassTeacherAssignment",
      "ClassSettingsPanel",
    ],
    status: ["✅", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-20",
    issue: "DK-325",
  },
  {
    name: "Dashboard",
    pages: ["DashboardPage"],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Data Tools",
    pages: ["BackgroundJobs", "BulkImport", "GovtExport"],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Fees",
    pages: ["FeesPage", "Refunds", "FeeStructureAssignment"],
    status: ["✅", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-22",
    issue: "DK-512",
  },
  {
    name: "Front Desk",
    pages: [
      "FrontDeskPage",
      "AppointmentsList",
      "VisitorLog",
      "CallLogsList",
      "FeedbacksList",
      "AdmissionsList",
      "GatePassLog",
      "FrontDeskDashboard",
    ],
    status: ["✅", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-18",
    issue: "DK-204",
  },
  {
    name: "Homework",
    pages: ["HomeworkList", "CreateHomeworkModal"],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Hostel",
    pages: ["HostelDashboard", "HostelList", "RoomsList", "AllocationsList"],
    status: ["✅", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-23",
    issue: "DK-561",
  },
  {
    name: "Intake Forms",
    pages: ["EnrollmentFunnel", "FormAssignments", "FormSubmissions"],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Inventory",
    pages: [
      "InventoryDashboard",
      "Assets",
      "Vendors",
      "Maintenance",
      "Procurement",
      "Audits",
      "Reports",
      "InventoryTransaction",
    ],
    status: ["✅", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-21",
    issue: "DK-461",
  },
  {
    name: "Library",
    pages: [
      "LibraryDashboard",
      "BooksList",
      "IssuedBooksList",
      "LibraryReports",
      "ReturnBookModal",
    ],
    status: ["✅", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-21",
    issue: "DK-446",
  },
  {
    name: "Messaging",
    pages: [
      "Announcements",
      "ChatFull",
      "EmailCampaigns",
      "Notifications",
      "Reminders",
      "CommunicationLogs",
    ],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "PTM",
    pages: ["PTMSessions", "CreatePTMSessionModal"],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Reports",
    pages: ["ReportsPage", "ExportCenter"],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Settings",
    pages: [
      "InstitutionSettings",
      "AcademicSettings",
      "FeeRulesSettings",
      "FeeTemplatesPage",
      "FeeHeadsUnified",
      "AttendanceRules",
      "LeaveSettings",
      "PayrollSettings",
      "HierarchySettings",
      "ParentManagement",
      "NPSAnalytics",
      "DataCleanup",
    ],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Staffs",
    pages: [
      "StaffList",
      "StaffDashboard",
      "LeaveManagement",
      "StaffPayroll",
      "TeacherTimetableEditor",
      "BulkSubjectAssignment",
      "StaffAttendanceRegularize",
    ],
    status: ["✅", "⬜", "⬜", "✅"],
    auditDate: "2026-06-14",
    issue: "DK-973",
  },
  {
    name: "Students",
    pages: [
      "StudentsList",
      "StudentDashboard",
      "StudentAttendance",
      "StudentPromotion",
      "TransferCertificate",
      "StudentFormSubmissions",
    ],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Style Guide",
    pages: ["StyleGuidePage"],
    status: ["N/A", "N/A", "N/A", "N/A"],
  },
  {
    name: "Super Admin",
    pages: [
      "SchoolsPanel",
      "FeatureFlags",
      "GrowthAnalytics",
      "SchoolHealth",
      "Changelog",
      "JobsDashboard",
    ],
    status: ["⬜", "⬜", "⬜", "⬜"],
  },
  {
    name: "Transport",
    pages: ["RoutesTab", "VehiclesTab", "RouteModal", "VehicleModal", "StudentAssignModal"],
    status: ["🔄", "⬜", "⬜", "⬜"],
    auditDate: "2026-05-30",
    issue: "DK-671",
  },
];

function StatusBadge({ status, auditDate, issue }) {
  if (status === "✅") {
    return (
      <span className="inline-flex items-center gap-1 text-ok text-xs font-medium">
        <CheckCircle2 size={12} /> Done {auditDate ? `· ${auditDate}` : ""} {issue ? `· ${issue}` : ""}
      </span>
    );
  }
  if (status === "🔄") {
    return (
      <span className="inline-flex items-center gap-1 text-warn text-xs font-medium">
        <Loader2 size={12} className="animate-spin" /> In progress {auditDate ? `· ${auditDate}` : ""} {issue ? `· ${issue}` : ""}
      </span>
    );
  }
  if (status === "N/A") {
    return <span className="text-fg-faint text-xs">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-fg-faint text-xs">
      <Circle size={12} /> Not started
    </span>
  );
}

export default function IAPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.pages.some((p) => p.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">IA &amp; Checklist</h1>
          <p className="page__sub">Module-by-module design system audit tracker</p>
        </div>
      </div>

      <div className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
        <div className="sg-toolbar__search" style={{ maxWidth: 320 }}>
          <Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules or pages…"
            aria-label="Search modules"
          />
        </div>
      </div>

      <div className="ia-table" role="table" aria-label="Module audit checklist">
        <div className="ia-table__head" role="row">
          <span role="columnheader">Module</span>
          <span role="columnheader">Pages</span>
          {CHECKS.map((c) => (
            <span key={c} role="columnheader" className="ia-table__check">
              {c}
            </span>
          ))}
        </div>

        {filtered.map((mod) => (
          <div key={mod.name} className="ia-table__row" role="row">
            <span role="cell" className="ia-table__module">
              {mod.name}
            </span>
            <span role="cell" className="ia-table__pages">
              {mod.pages.join(", ")}
            </span>
            {mod.status.map((s, i) => (
              <span key={CHECKS[i]} role="cell" className="ia-table__check">
                <StatusBadge
                  status={s}
                  auditDate={i === 0 ? mod.auditDate : undefined}
                  issue={i === 0 ? mod.issue : undefined}
                />
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs text-fg-muted">
        <p>Legend:</p>
        <ul className="list-disc ml-4 mt-1 space-y-0.5">
          <li>⬜ Not started — no audit conducted yet</li>
          <li>🔄 In progress — audit findings posted, awaiting workspace owner approval</li>
          <li>✅ Done — audit complete (findings may have child implementation issues)</li>
        </ul>
      </div>
    </div>
  );
}
