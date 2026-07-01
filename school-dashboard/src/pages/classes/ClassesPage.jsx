/**
 * ClassesPage — grade-grouped classes data grid (Claude Design port) + Add Class modal.
 * Replaces the previous Today/By-class PageShell layout for the /classes index.
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { classesApi } from "../../services/api";
import ClassesDataGrid from "./ClassesDataGrid";
import AttendanceBar from "../../components/dataGrid/AttendanceBar";
import AttendanceBoard from "../../components/dataGrid/AttendanceBoard";
import AddClassModal from "./AddClassModal";
import AddSectionModal from "./AddSectionModal";
import AssignTeacherModal from "./AssignTeacherModal";
import { enrichSection, classesSummary, buildAttendanceBoard } from "./utils/classesGridHelpers";

const cid = (c) => String(c.id || c._id);

const EXPORT_COLUMNS = [
  { label: "Class", get: (s) => s.grade },
  { label: "Section", get: (s) => s.section },
  { label: "Class teacher", get: (s) => s.teacher || "" },
  { label: "Students", get: (s) => s.strength },
  { label: "Capacity", get: (s) => s.cap },
  { label: "Subjects", get: (s) => s.subjects },
  { label: "Room", get: (s) => s.room },
  { label: "Attendance", get: (s) => `${s.att}%` },
  { label: "Status", get: (s) => s.status },
];

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = EXPORT_COLUMNS.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => EXPORT_COLUMNS.map((c) => esc(c.get(r))).join(",")).join("\n");
  const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ClassesPage() {
  const navigate = useNavigate();
  const { classes = [], staff = [], loading, addClass, refetch, schoolSettings, currentAcademicYear } = useApp();

  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [addSectionGrade, setAddSectionGrade] = useState(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

  const staffById = useMemo(() => {
    const m = new Map();
    for (const s of staff) m.set(String(s._id || s.id), s);
    return m;
  }, [staff]);

  // Full enriched list (no search filter) — used for accurate per-grade context.
  const allSections = useMemo(() => classes.map((c) => enrichSection(c, staffById)), [classes, staffById]);
  const sectionsForGrade = useMemo(
    () => (addSectionGrade == null ? [] : allSections.filter((s) => s.grade === addSectionGrade)),
    [allSections, addSectionGrade]
  );

  // Enrich + search-filter (search applies to counts; tab applies to display only)
  const searchedSections = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allSections;
    return allSections.filter((s) => (
      String(s.grade).toLowerCase().includes(term) ||
      String(s.section).toLowerCase().includes(term) ||
      `${s.grade}-${s.section}`.toLowerCase().includes(term) ||
      (s.teacher || "").toLowerCase().includes(term)
    ));
  }, [allSections, q]);

  const summary = useMemo(() => classesSummary(searchedSections), [searchedSections]);

  const displayed = useMemo(() => {
    if (activeTab === "needs") return searchedSections.filter((s) => s.status === "needs");
    if (activeTab === "over") return searchedSections.filter((s) => s.status === "full");
    return searchedSections;
  }, [searchedSections, activeTab]);

  const tabs = useMemo(() => ([
    { key: "all", label: "All", count: summary.sections },
    { key: "needs", label: "Needs teacher", count: summary.needs, countColor: summary.needs > 0 ? "#c08a2e" : undefined },
    { key: "over", label: "Over capacity", count: summary.over },
  ]), [summary]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const onToggleSection = useCallback((id) => {
    setSelectedKeys((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const onClearSelection = useCallback(() => setSelectedKeys(new Set()), []);
  const selectedSections = useMemo(() => displayed.filter((s) => selectedKeys.has(s.id)), [displayed, selectedKeys]);

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const onBulkAction = useCallback(async (key) => {
    if (selectedKeys.size === 0) { toast("Select one or more sections first."); return; }
    if (key === "export") { downloadCsv("classes-selected.csv", selectedSections); return; }
    if (key === "assign") { navigate("/classes/bulk-assignment"); return; }
    if (key === "timetable") { navigate("/classes/timetable"); return; }
    if (key === "promote") { navigate("/students/promotion"); return; }
    if (key === "delete") {
      const ids = [...selectedKeys];
      if (!window.confirm(`Delete ${ids.length} section${ids.length > 1 ? "s" : ""}? This can't be undone.`)) return;
      const results = await Promise.allSettled(ids.map((id) => classesApi.delete(id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed === 0) toast.success(`Deleted ${ids.length} section${ids.length > 1 ? "s" : ""}.`);
      else toast.error(`${ids.length - failed} deleted, ${failed} failed.`);
      setSelectedKeys(new Set());
      refetch?.(true)?.catch?.(() => {});
    }
  }, [selectedKeys, selectedSections, navigate, refetch]);

  // Teacher → label of the class they're already class teacher of (for the
  // assign modal's "busy / available" indicator).
  const busyByTeacherId = useMemo(() => {
    const m = new Map();
    for (const c of classes) {
      const tid = c.classTeacherId ? String(c.classTeacherId) : null;
      if (!tid || m.has(tid)) continue;
      const grade = String(c.name ?? "").replace(/^Class\s+/i, "").trim();
      m.set(tid, c.section ? `${grade} · ${c.section}` : grade);
    }
    return m;
  }, [classes]);

  // ── Row actions ───────────────────────────────────────────────────────────
  const onOpenSection = useCallback((raw) => navigate(`/classes/${cid(raw)}`), [navigate]);
  const onAssignTeacher = useCallback((raw) => {
    const grade = String(raw.name ?? "").replace(/^Class\s+/i, "").trim() || "—";
    setAssignTarget({ classId: cid(raw), grade, section: raw.section || "—", currentTeacherId: raw.classTeacherId || "" });
  }, []);
  const onAssignSubmit = useCallback(async (teacherId) => {
    if (!assignTarget) return;
    await classesApi.updateClassTeacher(assignTarget.classId, teacherId, { force: true });
    refetch?.(true)?.catch?.(() => {});
  }, [assignTarget, refetch]);
  const onEditSection = useCallback((raw) => navigate(`/classes/${cid(raw)}`), [navigate]);
  const onDeleteSection = useCallback(async (raw) => {
    if (!window.confirm(`Delete section ${raw.name}-${raw.section}? This can't be undone.`)) return;
    try {
      await classesApi.delete(cid(raw));
      toast.success("Section deleted.");
      refetch?.(true)?.catch?.(() => {});
    } catch (err) { toast.error(err?.message || "Failed to delete section"); }
  }, [refetch]);

  const moreActions = useMemo(() => ([
    { label: "Export all (CSV)", icon: <Download size={15} color="#6a6e78" aria-hidden />, onClick: () => downloadCsv("classes-list.csv", searchedSections) },
  ]), [searchedSections]);

  const onCreated = useCallback(() => { refetch?.(true)?.catch?.(() => {}); }, [refetch]);

  // ── Today's attendance bar (computed from real section averageAttendance) ──
  const attStats = useMemo(() => {
    const tracked = searchedSections.filter((s) => s.att > 0);
    const pct = tracked.length ? Math.round(tracked.reduce((a, s) => a + s.att, 0) / tracked.length) : null;
    const pending = searchedSections.length - tracked.length;
    return { pct, tracked: tracked.length, pending };
  }, [searchedSections]);

  const board = useMemo(() => buildAttendanceBoard(classes, staffById), [classes, staffById]);
  const onMarkClass = useCallback((c) => { setBoardOpen(false); navigate(`/classes/${c.id}/attendance`); }, [navigate]);

  return (
    <>
      <ClassesDataGrid
        sections={displayed}
        summary={summary}
        loading={loading}
        attendanceBar={
          <AttendanceBar
            pct={attStats.pct}
            sub={`${attStats.tracked} ${attStats.tracked === 1 ? "section" : "sections"}`}
            pending={attStats.pending}
            pendingLabel={attStats.pending > 0 ? `${attStats.pending} not marked` : null}
            onBoard={() => setBoardOpen(true)}
          />
        }
        searchQuery={q}
        onSearchChange={setQ}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedKeys={selectedKeys}
        onToggleSection={onToggleSection}
        onClearSelection={onClearSelection}
        onBulkAction={onBulkAction}
        onAddClass={() => setAddOpen(true)}
        onAddSection={(grade) => setAddSectionGrade(grade)}
        onOpenSection={onOpenSection}
        onAssignTeacher={onAssignTeacher}
        onEditSection={onEditSection}
        onDeleteSection={onDeleteSection}
        moreActions={moreActions}
      />
      <AddClassModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        staff={staff}
        subjectOptions={schoolSettings?.subjects || []}
        addClass={addClass}
        onCreated={onCreated}
        currentAcademicYear={currentAcademicYear}
      />
      <AddSectionModal
        open={addSectionGrade != null}
        onClose={() => setAddSectionGrade(null)}
        grade={addSectionGrade}
        existing={sectionsForGrade}
        staff={staff}
        addClass={addClass}
        onCreated={onCreated}
        currentAcademicYear={currentAcademicYear}
      />
      <AttendanceBoard
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
        board={board}
        onMarkClass={onMarkClass}
      />
      <AssignTeacherModal
        open={assignTarget != null}
        onClose={() => setAssignTarget(null)}
        target={assignTarget}
        staff={staff}
        busyByTeacherId={busyByTeacherId}
        onAssign={onAssignSubmit}
      />
    </>
  );
}
