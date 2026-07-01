import { useCallback, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { staffAttendanceApi } from "../../services/api";
import StaffDataGrid from "./StaffDataGrid";
import CreateStaffComposer from "./CreateStaffComposer";
import { searchMatch, useStaffFilters } from "./StaffListFilters";
import { isActiveStaff } from "./utils/staffHelpers";
import { roleLabel } from "./utils/staffGridHelpers";

const sid = (s) => String(s._id || s.id);

const EXPORT_COLUMNS = [
  { label: "Name", get: (s) => s.name },
  { label: "Staff ID", get: (s) => s.staffNumber || s.code },
  { label: "Role", get: (s) => roleLabel(s.role) },
  { label: "Department", get: (s) => s.department },
  { label: "Type", get: (s) => s.employmentType },
  { label: "Phone", get: (s) => s.phone || s.mobile },
  { label: "Email", get: (s) => s.email },
  { label: "Status", get: (s) => s.status || "active" },
];

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = EXPORT_COLUMNS.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => EXPORT_COLUMNS.map((c) => esc(c.get(r))).join(",")).join("\n");
  const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StaffList({ onStaffClick, onAddStaff }) {
  const navigate = useNavigate();
  const { staff = [], staffAttendance, loading, addStaff } = useApp();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const { roleFilter, departmentFilter, employmentTypeFilter, genderFilter, activeFiltersCount } = useStaffFilters(staff);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayStatusOf = useCallback(
    (s) => {
      const recorded = staffAttendance?.[s._id || s.id]?.[todayKey]?.status;
      return recorded ? String(recorded).toLowerCase() : null;
    },
    [staffAttendance, todayKey]
  );

  const onLeave = (s) => {
    const t = todayStatusOf(s);
    return t === "leave" || String(s.status || "").toLowerCase() === "on-leave";
  };

  // ── Tab counts (over the full roster) ─────────────────────────────────────
  const counts = useMemo(() => {
    let present = 0, leave = 0, inactive = 0;
    for (const s of staff) {
      if (todayStatusOf(s) === "present") present++;
      if (onLeave(s)) leave++;
      if (!isActiveStaff(s)) inactive++;
    }
    return { all: staff.length, present, leave, inactive };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, todayStatusOf]);

  const tabs = useMemo(() => ([
    { key: "all", label: "All", count: counts.all },
    { key: "present", label: "Present today", count: counts.present },
    { key: "leave", label: "On leave", count: counts.leave },
    { key: "inactive", label: "Inactive", count: counts.inactive },
  ]), [counts]);

  // ── Search + pill filters + tab → visible rows (with todayStatus attached) ─
  const visible = useMemo(() => {
    return staff
      .filter((s) => {
        if (!searchMatch(s, q)) return false;
        if (roleFilter.length > 0) {
          const roles = Array.isArray(s.role) ? s.role : [s.role].filter(Boolean);
          if (!roleFilter.some((r) => roles.includes(r))) return false;
        }
        if (departmentFilter !== "all" && s.department !== departmentFilter) return false;
        if (employmentTypeFilter !== "all" && s.employmentType !== employmentTypeFilter) return false;
        if (genderFilter !== "all" && s.gender !== genderFilter) return false;
        if (activeTab === "present" && todayStatusOf(s) !== "present") return false;
        if (activeTab === "leave" && !onLeave(s)) return false;
        if (activeTab === "inactive" && isActiveStaff(s)) return false;
        return true;
      })
      .map((s) => ({ ...s, todayStatus: todayStatusOf(s) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, q, roleFilter, departmentFilter, employmentTypeFilter, genderFilter, activeTab, todayStatusOf]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const onToggleRow = useCallback((id) => {
    setSelectedKeys((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const onToggleAll = useCallback((ids) => {
    setSelectedKeys((prev) => (ids.length > 0 && ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)));
  }, []);
  const onClearSelection = useCallback(() => setSelectedKeys(new Set()), []);

  const selectedStaff = useMemo(() => visible.filter((s) => selectedKeys.has(sid(s))), [visible, selectedKeys]);

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const onBulkAction = useCallback(async (key) => {
    if (selectedKeys.size === 0) { toast("Select one or more staff first."); return; }
    const ids = [...selectedKeys];
    if (key === "present" || key === "leave" || key === "absent") {
      const label = key === "present" ? "present" : key === "leave" ? "on leave" : "absent";
      try {
        await staffAttendanceApi.markBulk({ staffIds: ids, status: key, date: todayKey });
        toast.success(`Marked ${ids.length} staff ${label}.`);
        setSelectedKeys(new Set());
      } catch (err) { toast.error(err?.message || "Failed to mark attendance"); }
      return;
    }
    if (key === "message") {
      const phones = selectedStaff.map((s) => s.phone || s.mobile).filter(Boolean);
      if (!phones.length) { toast("No contact numbers available for selected staff."); return; }
      navigate(`/messaging?to=${encodeURIComponent(phones.join(","))}`);
      return;
    }
    if (key === "export") {
      downloadCsv("staff-selected.csv", selectedStaff);
      return;
    }
    if (key === "assign") { navigate("/classes"); return; }
    if (key === "payroll") { navigate("/accounts"); return; }
    if (key === "deactivate") { toast("Bulk deactivate isn’t wired yet — open a profile to change status."); return; }
  }, [selectedKeys, selectedStaff, todayKey, navigate]);

  // ── Row actions ───────────────────────────────────────────────────────────
  const onOpenStaff = useCallback((s) => onStaffClick?.(sid(s)), [onStaffClick]);
  const onMessageStaff = useCallback((s) => {
    const phone = s.phone || s.mobile;
    if (!phone) { toast("No contact number on file."); return; }
    navigate(`/messaging?to=${encodeURIComponent(phone)}`);
  }, [navigate]);
  const onMarkAttendance = useCallback(async (s, status) => {
    const label = status === "present" ? "present" : status === "leave" ? "on leave" : "absent";
    try {
      await staffAttendanceApi.markBulk({ staffIds: [sid(s)], status, date: todayKey });
      toast.success(`Marked ${s.name} ${label}.`);
    } catch (err) { toast.error(err?.message || "Failed to mark attendance"); }
  }, [todayKey]);
  const onDeactivateStaff = useCallback(() => toast("Open the staff profile to change their status."), []);

  const moreActions = useMemo(() => ([
    { label: "Export list (CSV)", icon: <Download size={15} color="#6a6e78" aria-hidden />, onClick: () => downloadCsv("staff-list.csv", visible) },
  ]), [visible]);

  return (
    <>
      <StaffDataGrid
        staff={visible}
        totalMembers={staff.length}
        loading={loading}
        searchQuery={q}
        onSearchChange={setQ}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedKeys={selectedKeys}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
        onClearSelection={onClearSelection}
        onBulkAction={onBulkAction}
        onAddStaff={() => setCreateOpen(true)}
        onOpenStaff={onOpenStaff}
        onMessageStaff={onMessageStaff}
        onMarkAttendance={onMarkAttendance}
        onDeactivateStaff={onDeactivateStaff}
        activeFiltersCount={activeFiltersCount}
        moreActions={moreActions}
      />
      <CreateStaffComposer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {}}
        addStaff={addStaff}
      />
    </>
  );
}
