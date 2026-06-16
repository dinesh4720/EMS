import { useState } from "react";
import { MessageSquare, CheckCircle2, Printer } from "lucide-react";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import BulkActionBar from "../../components/ui/BulkActionBar";
import ExportMenu from "../../components/ui/ExportMenu";
import PrintPreviewModal from "../../components/ui/PrintPreviewModal";
import { FILTERS } from "./StaffListFilters";

// Columns shared by the CSV/Excel export and the print preview table.
const EXPORT_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "code", label: "ID", accessor: (s) => s.staffNumber || s.code || "" },
  { key: "role", label: "Role", accessor: (s) => (Array.isArray(s.role) ? s.role.join(", ") : s.role || "") },
  { key: "department", label: "Department", accessor: (s) => s.department || "—" },
  { key: "employmentType", label: "Employment Type", accessor: (s) => s.employmentType || "—" },
  { key: "gender", label: "Gender", accessor: (s) => s.gender || "—" },
  { key: "status", label: "Status", accessor: (s) => s.status || "active" },
  { key: "email", label: "Email", accessor: (s) => s.email || "—" },
  { key: "phone", label: "Phone", accessor: (s) => s.phone || s.mobile || "—" },
];

/**
 * Staff list toolbar: segmented All/Active/Today tabs, search, clear, export,
 * print, and the bulk-action bar. Owns the print-preview modal and its open
 * state since the print button lives here. `rows` is the current `visible`
 * staff slice used for export, print, and the "select all matching" count.
 */
export default function StaffListToolbar({
  filter,
  setFilter,
  statusCounts,
  q,
  setQ,
  showClearButton,
  onClear,
  rows,
  selection,
  onBulkMarkPresent,
  onBulkMessage,
}) {
  const [printOpen, setPrintOpen] = useState(false);

  return (
    <>
      <div className="toolbar">
        <div className="seg" role="tablist" aria-label="Filter staff">
          {FILTERS.map((f) => {
            const count = statusCounts?.[f.key] ?? 0;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={`seg__btn ${filter === f.key ? "is-active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="mono tnum" style={{ marginLeft: 6, color: "var(--fg-subtle)", fontSize: 11 }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <ToolbarSearch
          value={q}
          onChange={setQ}
          urlParam="q"
          placeholder="Search staff…"
          ariaLabel="Search staff"
          style={{ marginLeft: "auto", flex: "0 1 280px", minWidth: 0 }}
        />

        {showClearButton && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClear}
            style={{ color: "var(--fg-muted)" }}
            aria-label="Clear all filters"
          >
            Clear
          </button>
        )}

        <ExportMenu
          rows={rows}
          columns={EXPORT_COLUMNS}
          filename="staff-list"
          title="Staff List"
        />

        <button
          type="button"
          className="btn btn--sm"
          onClick={() => setPrintOpen(true)}
          aria-label="Print preview"
        >
          <Printer size={14} aria-hidden />
        </button>

        <BulkActionBar
          selection={selection}
          totalMatching={rows.length}
        >
          <button
            type="button"
            className="btn btn--sm"
            onClick={onBulkMarkPresent}
          >
            <CheckCircle2 size={12} aria-hidden /> Mark present
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={onBulkMessage}
          >
            <MessageSquare size={12} aria-hidden /> Message
          </button>
        </BulkActionBar>
      </div>

      {/* Print Preview */}
      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Staff List"
      >
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-4">Staff List</h1>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">ID</th>
                <th className="text-left py-2 px-3">Role</th>
                <th className="text-left py-2 px-3">Department</th>
                <th className="text-left py-2 px-3">Employment</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s._id || s.id} className="border-b">
                  <td className="py-2 px-3">{s.name}</td>
                  <td className="py-2 px-3">{s.staffNumber || s.code || "—"}</td>
                  <td className="py-2 px-3">{Array.isArray(s.role) ? s.role.join(", ") : s.role || "—"}</td>
                  <td className="py-2 px-3">{s.department || "—"}</td>
                  <td className="py-2 px-3">{s.employmentType || "—"}</td>
                  <td className="py-2 px-3">{s.status || "active"}</td>
                  <td className="py-2 px-3">{s.email || "—"}</td>
                  <td className="py-2 px-3">{s.phone || s.mobile || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>
    </>
  );
}
