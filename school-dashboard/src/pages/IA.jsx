import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle, Clock, AlertCircle, Layers, FileSearch, MonitorSmartphone, Accessibility, TestTube2 } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * IA & Checklist — Information Architecture + Audit Tracker
 *
 * Module-by-module checklist with 4 checks per page:
 *   Design Audit | Accessibility | Responsive | Tests
 *
 * Updated by @ux-ui-lead after each module audit.
 * ────────────────────────────────────────────────────────────────── */

const STATUS = {
  unchecked: { icon: Circle, label: "Not started", tone: "muted" },
  in_review: { icon: Clock, label: "In review", tone: "warn" },
  approved:  { icon: CheckCircle2, label: "Approved", tone: "ok" },
  impl:      { icon: AlertCircle, label: "Implementing", tone: "info" },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.unchecked;
  const Icon = s.icon;
  return (
    <span className={`ia-status ia-status--${s.tone}`} title={s.label}>
      <Icon size={12} aria-hidden />
    </span>
  );
}

/* ── Module definitions ── */
const MODULES = [
  {
    id: "dashboard",
    name: "Dashboard",
    pages: [
      { name: "Dashboard", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Analytics", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "students",
    name: "Students",
    pages: [
      { name: "StudentsList", checks: { design: "approved", a11y: "approved", responsive: "approved", tests: "approved" } },
      { name: "StudentDashboard", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "AddStudent / Composer", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "StudentAttendance", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "StudentPromotionPage", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "TransferCertificatePage", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "StudentFormSubmissions", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "staffs",
    name: "Staffs",
    pages: [
      { name: "StaffList", checks: { design: "approved", a11y: "approved", responsive: "approved", tests: "approved" } },
      { name: "StaffDashboard", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "AddStaffComposer", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "StaffPayroll", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "LeaveManagement", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "StaffAttendanceRegularize", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "BulkSubjectAssignment", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "classes",
    name: "Classes",
    pages: [
      { name: "ClassesPage", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ClassDashboard", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Attendance", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Timetable", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Substitution", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Subjects", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "BulkClassTeacherAssignment", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "academics",
    name: "Academics",
    pages: [
      { name: "ExamManagement", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ExamScheduleConflict", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ExamDetail", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ResultsEntry", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ClassPerformance", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "CBSEReportCardPage", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "CCEGradingPage", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "fees",
    name: "Fees",
    pages: [
      { name: "FeesPage", checks: { design: "in_review", a11y: "in_review", responsive: "in_review", tests: "unchecked" } },
      { name: "Refunds", checks: { design: "in_review", a11y: "in_review", responsive: "in_review", tests: "unchecked" } },
      { name: "FeeStructureAssignment", checks: { design: "in_review", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "front-desk",
    name: "Front Desk",
    pages: [
      { name: "FrontDeskPage / Dashboard", checks: { design: "in_review", a11y: "in_review", responsive: "in_review", tests: "unchecked" } },
      { name: "AdmissionsList", checks: { design: "in_review", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "AdmissionTracker", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "AppointmentsList", checks: { design: "in_review", a11y: "in_review", responsive: "in_review", tests: "unchecked" } },
      { name: "CallLogsList", checks: { design: "in_review", a11y: "in_review", responsive: "in_review", tests: "unchecked" } },
      { name: "FeedbacksList", checks: { design: "in_review", a11y: "in_review", responsive: "in_review", tests: "unchecked" } },
      { name: "VisitorLog", checks: { design: "in_review", a11y: "unchecked", responsive: "in_review", tests: "unchecked" } },
      { name: "GatePassLog", checks: { design: "in_review", a11y: "unchecked", responsive: "in_review", tests: "unchecked" } },
    ],
  },
  {
    id: "homework",
    name: "Homework",
    pages: [
      { name: "Homework index", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "CreateHomeworkModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "HomeworkDetailModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "hostel",
    name: "Hostel",
    pages: [
      { name: "HostelDashboard", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "HostelList", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "RoomsList", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "AllocationsList", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "transport",
    name: "Transport",
    pages: [
      { name: "VehiclesTab", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "RoutesTab", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "VehicleModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "RouteModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "StudentAssignModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "library",
    name: "Library",
    pages: [
      { name: "LibraryDashboard", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "BooksList", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "IssuedBooksList", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "LibraryReports", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "AddBookModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "IssueBookModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ReturnBookModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "calendar",
    name: "Calendar",
    pages: [
      { name: "Calendar index", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "messaging",
    name: "Messaging",
    pages: [
      { name: "Messaging index", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ChatFull", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Announcements", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Notifications", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Reminders", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "CommunicationLogs", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "EmailCampaignsPage", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    pages: [
      { name: "ReportsPage", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ExportCenter", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    pages: [
      { name: "Settings index (~30 sub-pages)", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "data-tools",
    name: "Data Tools",
    pages: [
      { name: "BulkImport", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "BulkImportHistory", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "BackgroundJobs", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "GovtExport", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "intake-forms",
    name: "Intake Forms",
    pages: [
      { name: "FormAssignments", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "FormSubmissions", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "EnrollmentFunnel", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "ptm",
    name: "PTM",
    pages: [
      { name: "PTM index", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "CreatePTMSessionModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "PTMSessionDetailModal", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    pages: [
      { name: "InventoryDashboard", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Assets", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Vendors", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Maintenance", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Procurement", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Audits", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "Reports", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "InventoryTransaction", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
  {
    id: "super-admin",
    name: "Super Admin",
    pages: [
      { name: "SuperAdminDashboard", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "SchoolsPanel", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "FeatureFlagsPanel", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "GrowthAnalyticsPanel", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "ChangelogPanel", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "JobsDashboardPanel", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
      { name: "SchoolHealthPanel", checks: { design: "unchecked", a11y: "unchecked", responsive: "unchecked", tests: "unchecked" } },
    ],
  },
];

const CHECK_LABELS = {
  design: { label: "Design", icon: FileSearch },
  a11y:   { label: "A11y",   icon: Accessibility },
  responsive: { label: "Responsive", icon: MonitorSmartphone },
  tests:  { label: "Tests",  icon: TestTube2 },
};

export default function IAPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expanded, setExpanded] = useState(() => {
    const raw = searchParams.get("expand");
    return raw ? new Set(raw.split(",")) : new Set();
  });
  const filter = searchParams.get("filter") || "all";

  const toggleModule = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const arr = [...next];
      setSearchParams((p) => {
        const out = new URLSearchParams(p);
        if (arr.length) out.set("expand", arr.join(","));
        else out.delete("expand");
        return out;
      }, { replace: true });
      return next;
    });
  };

  const setFilter = (key) => {
    setSearchParams((p) => {
      const out = new URLSearchParams(p);
      if (key === "all") out.delete("filter");
      else out.set("filter", key);
      return out;
    }, { replace: true });
  };

  const filteredModules = useMemo(() => {
    if (filter === "all") return MODULES;
    return MODULES.map((m) => ({
      ...m,
      pages: m.pages.filter((p) =>
        Object.values(p.checks).some((s) => s === filter)
      ),
    })).filter((m) => m.pages.length > 0);
  }, [filter]);

  const totals = useMemo(() => {
    let total = 0;
    let done = 0;
    MODULES.forEach((m) => {
      m.pages.forEach((p) => {
        Object.values(p.checks).forEach((s) => {
          total++;
          if (s === "approved") done++;
        });
      });
    });
    return { total, done };
  }, []);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">IA & Checklist</h1>
          <div className="page__sub">
            {totals.done}/{totals.total} checks complete · {MODULES.length} modules
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="toolbar" style={{ borderBottom: "none" }}>
        <div className="seg" role="tablist" aria-label="Filter checklist">
          {[
            { key: "all", label: "All" },
            { key: "unchecked", label: "Not started" },
            { key: "in_review", label: "In review" },
            { key: "approved", label: "Approved" },
            { key: "impl", label: "Implementing" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`seg__btn${filter === f.key ? " is-active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module list */}
      <div className="ia-modules">
        {filteredModules.map((mod) => {
          const isOpen = expanded.has(mod.id);
          const modDone = mod.pages.reduce((acc, p) => acc + Object.values(p.checks).filter((s) => s === "approved").length, 0);
          const modTotal = mod.pages.reduce((acc, p) => acc + Object.values(p.checks).length, 0);
          return (
            <div key={mod.id} className="ia-module">
              <button
                type="button"
                className="ia-module__head"
                onClick={() => toggleModule(mod.id)}
                aria-expanded={isOpen}
              >
                <Layers size={14} aria-hidden />
                <span className="ia-module__name">{mod.name}</span>
                <span className="ia-module__count">{mod.pages.length} pages</span>
                <span className="ia-module__progress">
                  {modDone}/{modTotal}
                </span>
                <ChevronDown
                  size={14}
                  aria-hidden
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    marginLeft: "auto",
                  }}
                />
              </button>

              {isOpen && (
                <div className="ia-module__body">
                  {mod.pages.map((page) => (
                    <div key={page.name} className="ia-page">
                      <span className="ia-page__name">{page.name}</span>
                      <div className="ia-page__checks">
                        {Object.entries(CHECK_LABELS).map(([key, { label, icon: Icon }]) => {
                          const status = page.checks[key];
                          return (
                            <span
                              key={key}
                              className={`ia-check ia-check--${status}`}
                              title={`${label}: ${STATUS[status]?.label || status}`}
                            >
                              <Icon size={11} aria-hidden />
                              <StatusBadge status={status} />
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inline icon since we don't import it above
function ChevronDown({ size, style, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      {...props}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
