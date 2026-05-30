import { useState } from "react";
import { CheckCircle, Circle, AlertCircle, LayoutDashboard } from "lucide-react";

const MODULES = [
  { id: "dashboard", name: "Dashboard / Auth / Shell", pages: 10 },
  { id: "students", name: "Students", pages: 18 },
  { id: "classes", name: "Classes", pages: 12 },
  { id: "staffs", name: "Staffs (canonical reference)", pages: 17 },
  { id: "academics", name: "Academics", pages: 14, audit: "audited", auditRef: "DK-608" },
  { id: "fees", name: "Fees", pages: 7, audit: "audited", auditRef: "DK-598 / DK-512" },
  { id: "messaging", name: "Messaging", pages: 10 },
  { id: "front-desk", name: "Front Desk", pages: 15, audit: "audited", auditRef: "DK-750", findings: 18 },
  { id: "homework-ptm-calendar", name: "Homework / PTM / Calendar", pages: 3, audit: "partial", auditRef: "DK-664 / DK-679" },
  { id: "reports", name: "Reports / Analytics / Data Tools", pages: 6 },
  { id: "transport", name: "Transport", pages: 1, audit: "audited", auditRef: "DK-671" },
  { id: "hostel", name: "Hostel", pages: 2 },
  { id: "library", name: "Library", pages: 1 },
  { id: "inventory", name: "Inventory", pages: 1, audit: "audited", auditRef: "DK-598" },
  { id: "settings", name: "Settings", pages: 28 },
  { id: "super-admin", name: "Super-Admin", pages: 1 },
  { id: "audit-logs", name: "Audit Logs", pages: 1 },
  { id: "expenses", name: "Expenses", pages: 3, audit: "partial", auditRef: "DK-598" },
  { id: "intake-forms", name: "Intake Forms", pages: 3 },
];

function StatusIcon({ status }) {
  if (status === "done") return <CheckCircle className="w-4 h-4 text-[var(--ok)]" />;
  if (status === "partial") return <AlertCircle className="w-4 h-4 text-[var(--warn)]" />;
  return <Circle className="w-4 h-4 text-[var(--fg-faint)]" />;
}

function ModuleRow({ mod }) {
  const [open, setOpen] = useState(false);
  const auditStatus = mod.audit
    ? mod.audit === "audited"
      ? "partial"
      : "todo"
    : "todo";

  return (
    <div className="border-b border-[var(--divider)]">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <StatusIcon status={auditStatus} />
        <span className="flex-1 text-sm font-medium text-[var(--fg)]">{mod.name}</span>
        <span className="text-xs text-[var(--fg-faint)]">{mod.pages} pages</span>
        {mod.audit && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              mod.audit === "audited"
                ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                : "bg-[var(--info-bg)] text-[var(--info)]"
            }`}
          >
            {mod.audit === "audited" ? "Audited" : "Partial"}
          </span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 pl-11 space-y-2">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <StatusIcon status={auditStatus} />
              <span className="text-[var(--fg-muted)]">Design Audit</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon status="todo" />
              <span className="text-[var(--fg-muted)]">Accessibility</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon status="todo" />
              <span className="text-[var(--fg-muted)]">Responsive</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon status="todo" />
              <span className="text-[var(--fg-muted)]">Tests</span>
            </div>
          </div>
          {mod.auditRef && (
            <p className="text-xs text-[var(--fg-subtle)]">
              Audit ref: {mod.auditRef}
              {mod.findings ? ` — ${mod.findings} findings` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function IAPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-6 h-6 text-[var(--accent)]" />
        <h1 className="text-2xl font-semibold text-[var(--fg)]">IA &amp; Checklist</h1>
      </div>

      <div className="mb-6 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--fg)] mb-2">Product Modules</h2>
        <p className="text-xs text-[var(--fg-muted)]">
          Work module-by-module. Each module needs 4 checks: Design Audit, Accessibility, Responsive, Tests.
          Click a module to expand its checklist status.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {MODULES.map((mod) => (
          <ModuleRow key={mod.id} mod={mod} />
        ))}
      </div>

      <div className="mt-6 text-xs text-[var(--fg-faint)]">
        Last updated: 2026-05-31 by Design System Agent
      </div>
    </div>
  );
}
