import React, { useCallback, useMemo, useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Award,
  GraduationCap,
  Move,
  Edit3,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";

import SidebarAside from "./pixel/SidebarAside";
import OverviewTab from "./pixel/panels/OverviewTab";
import AboutTab from "./pixel/panels/AboutTab";
import AttendanceTab from "./pixel/panels/AttendanceTab";
import ResultsTab from "./pixel/panels/ResultsTab";
import FeesTab from "./pixel/panels/FeesTab";
import RemarksTab from "./pixel/panels/RemarksTab";
import DocumentsTab from "./pixel/panels/DocumentsTab";
import RatingsTab from "./pixel/panels/RatingsTab";
import {
  ACCENT,
  initials as toInitials,
  buildKpis,
  buildPersonal,
  buildSubjectRows,
  buildHeat35,
  buildAbout,
  buildParents,
  buildSiblings,
  buildFees,
  buildActivity,
  formatDateShort,
} from "./pixel/sdData";

// Admin-action modals — lazy-loaded so the read-only page stays light.
const TCGeneratorModal = lazy(() => import("../../TCGeneratorModal"));
const CertificateModal = lazy(() => import("../modals/CertificateModal"));
const PromoteStudentModal = lazy(() => import("../modals/PromoteStudentModal"));
const MoveClassModal = lazy(() => import("../modals/MoveClassModal"));
const EditStudentDrawer = lazy(() => import("../../EditStudentDrawer"));

const TABS = [
  { key: "overview", title: "Overview" },
  { key: "about", title: "About" },
  { key: "attendance", title: "Attendance" },
  { key: "results", title: "Results" },
  { key: "fees", title: "Fees" },
  { key: "remarks", title: "Remarks" },
  { key: "documents", title: "Documents" },
  { key: "ratings", title: "Ratings" },
];
const TAB_KEYS = TABS.map((t) => t.key);

function DashboardTabs({
  student,
  studentId,
  className,
  classSize,
  parent,
  subjects,
  timelineDays,
  attendanceData,
  attendanceStats,
  results,
  feeStructure,
  attendancePct,
  gpa,
  feeBalance,
  feeStatus,
  schoolSettings,
  classes,
  updateStudent,
  onAdminMutation,
  navigate,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openModal, setOpenModal] = useState(null);
  const closeModal = () => setOpenModal(null);

  const tabFromUrl = searchParams.get("tab");
  const activeTab = TAB_KEYS.includes(tabFromUrl) ? tabFromUrl : "overview";
  const setActiveTab = useCallback(
    (key) => {
      const next = new URLSearchParams(searchParams);
      if (key && key !== "overview") next.set("tab", key);
      else next.delete("tab");
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  const status = String(student?.status || "active").toLowerCase();

  // ── Derived view data ────────────────────────────────────────────────
  const name = student?.name || "—";
  const initials = toInitials(name);
  const admissionId = student?.admissionId || student?.studentId || (student?._id ? student._id.slice(-8) : "—");
  const rank = student?.rank ?? student?.classRank ?? null;

  const sidebarParent = parent
    ? { ...parent, initials: toInitials(parent.name) }
    : null;

  const kpis = useMemo(
    () => buildKpis({ attendancePct, gpa, rank, classSize, feeStatus, feeBalance }),
    [attendancePct, gpa, rank, classSize, feeStatus, feeBalance]
  );
  const personal = useMemo(() => buildPersonal(student), [student]);
  const subjectRows = useMemo(() => buildSubjectRows(subjects), [subjects]);
  const heat = useMemo(() => buildHeat35(attendanceData), [attendanceData]);
  const activity = useMemo(() => buildActivity(timelineDays), [timelineDays]);
  const about = useMemo(() => buildAbout(student, { className, classSize }), [student, className, classSize]);
  const aboutParents = useMemo(() => buildParents(student), [student]);
  const aboutSiblings = useMemo(() => buildSiblings(student), [student]);
  const fees = useMemo(() => buildFees(feeStructure), [feeStructure]);

  const attMetrics = useMemo(
    () => [
      { label: "Overall", value: attendanceStats?.percentage != null ? `${attendanceStats.percentage}%` : "—", tone: "var(--ok)" },
      { label: "Present days", value: String(attendanceStats?.present ?? 0), tone: "var(--tx)" },
      { label: "Absent", value: String(attendanceStats?.absent ?? 0), tone: "var(--danger)" },
    ],
    [attendanceStats]
  );
  const attLog = useMemo(() => {
    const rows = Array.isArray(attendanceData) ? attendanceData.slice(-8).reverse() : [];
    return rows.map((r) => {
      const st = String(r.status || "").toLowerCase();
      const tone = st === "present" ? "var(--ok)" : st === "absent" ? "var(--danger)" : "var(--warn)";
      const inout = r.checkInTime || r.checkOutTime ? `${r.checkInTime || "—"} — ${r.checkOutTime || "—"}` : "—";
      return {
        date: formatDateShort(r.date),
        inout,
        status: st ? st.charAt(0).toUpperCase() + st.slice(1) : "—",
        tone,
      };
    });
  }, [attendanceData]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const onMessageParent = () => {
    if (!parent?.phone && !parent?.email) return;
    navigate(`/messaging?to=${encodeURIComponent(parent.phone || parent.email)}`);
  };
  const onCall = () => parent?.phone && window.open(`tel:${parent.phone}`, "_self");
  const onEmail = () => parent?.email && window.open(`mailto:${parent.email}`, "_self");
  const onReportCard = () => navigate(`/students/${studentId}/report-card`);
  const onGradebook = () => navigate(`/academics?student=${studentId}`);
  const onOpenFees = () => navigate(`/fees?student=${studentId}`);

  const saveStudent = async (updates) => {
    await updateStudent?.(student._id || student.id, updates);
    onAdminMutation?.();
  };

  const overflowItems = [
    { key: "tc", label: "Generate Transfer Certificate", icon: <FileText size={14} aria-hidden />, onClick: () => setOpenModal("tc") },
    { key: "bonafide", label: "Generate Bonafide Certificate", icon: <FileText size={14} aria-hidden />, onClick: () => setOpenModal("bonafide") },
    { key: "character", label: "Generate Character Certificate", icon: <Award size={14} aria-hidden />, onClick: () => setOpenModal("character") },
    { key: "promote", label: "Promote class", icon: <GraduationCap size={14} aria-hidden />, onClick: () => setOpenModal("promote") },
    { key: "move", label: "Move class", icon: <Move size={14} aria-hidden />, onClick: () => setOpenModal("move") },
    { key: "edit", label: "Edit details", icon: <Edit3 size={14} aria-hidden />, onClick: () => setOpenModal("edit") },
    { key: "print", label: "Print profile", icon: <Printer size={14} aria-hidden />, onClick: () => toast("Print profile lands with the report-card stylesheet PR.", { icon: "📄" }) },
  ];

  return (
    <div className="sdx" style={{ "--acc": ACCENT.acc, "--acc-ring": ACCENT.ring }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="sd-body" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <SidebarAside
            initials={initials}
            name={name}
            admissionId={admissionId}
            status={status}
            classSec={className || "—"}
            roll={student?.rollNo ?? student?.rollNumber ?? "—"}
            house={student?.house ? `${student.house} House` : "—"}
            kpis={kpis}
            parent={sidebarParent}
            personal={personal}
            onMessageParent={onMessageParent}
            onCall={onCall}
            onEmail={onEmail}
            onReportCard={onReportCard}
            overflowItems={overflowItems}
          />

          {/* Main column */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow)", overflow: "hidden" }}>
              {/* Tabs */}
              <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 10px", borderBottom: "1px solid var(--border-soft)", overflowX: "auto" }}>
                {TABS.map((t) => {
                  const active = activeTab === t.key;
                  return (
                    <span
                      key={t.key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(t.key)}
                      style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        height: 46,
                        padding: "0 13px",
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        color: active ? "var(--tx)" : "var(--muted)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.title}
                      {active && (
                        <span style={{ position: "absolute", left: 9, right: 9, bottom: -1, height: 2, borderRadius: 2, background: "var(--acc)" }} />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Panel body */}
              <div role="tabpanel" style={{ padding: "20px 22px 24px" }}>
                {activeTab === "overview" && (
                  <OverviewTab subjects={subjectRows} heat={heat} attendancePct={attendancePct} activity={activity} onGradebook={onGradebook} />
                )}
                {activeTab === "about" && (
                  <AboutTab about={about} parents={aboutParents} siblings={aboutSiblings} onSave={saveStudent} onExport={onReportCard} />
                )}
                {activeTab === "attendance" && <AttendanceTab metrics={attMetrics} heat={heat} log={attLog} />}
                {activeTab === "results" && <ResultsTab subjects={buildSubjectRows(subjects)} gpa={gpa} />}
                {activeTab === "fees" && <FeesTab stats={fees.stats} items={fees.items} onOpenFees={onOpenFees} />}
                {activeTab === "remarks" && <RemarksTab studentId={studentId} />}
                {activeTab === "documents" && <DocumentsTab studentId={studentId} />}
                {activeTab === "ratings" && <RatingsTab student={student} onSave={saveStudent} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lazy admin modals */}
      <Suspense fallback={null}>
        {openModal === "tc" && <TCGeneratorModal isOpen onClose={closeModal} students={[student]} />}
        {openModal === "bonafide" && <CertificateModal isOpen onClose={closeModal} student={student} type="bonafide" schoolInfo={schoolSettings} />}
        {openModal === "character" && <CertificateModal isOpen onClose={closeModal} student={student} type="character" schoolInfo={schoolSettings} />}
        {openModal === "promote" && (
          <PromoteStudentModal
            isOpen
            onClose={closeModal}
            student={student}
            availableClasses={(classes || []).map((c) => c.name || c.section || "")}
            classObjects={classes || []}
            onPromote={onAdminMutation}
          />
        )}
        {openModal === "move" && (
          <MoveClassModal
            isOpen
            onClose={closeModal}
            student={student}
            availableClasses={(classes || []).map((c) => (c.name && c.section ? `${c.name}-${c.section}` : c.name || c.section || ""))}
            classObjects={classes || []}
            onMove={onAdminMutation}
          />
        )}
        {openModal === "edit" && (
          <EditStudentDrawer
            isOpen
            onClose={closeModal}
            student={student}
            onUpdate={saveStudent}
            classOptions={(classes || []).map((c) => c.name || c.section || "")}
            classesWithTeachers={classes || []}
          />
        )}
      </Suspense>
    </div>
  );
}

export default DashboardTabs;
