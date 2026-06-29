import React, { useCallback, useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Download,
  Plus,
  MoreHorizontal,
  GraduationCap,
  FileText,
  Award,
  Move,
  Edit3,
  Printer,
  User,
  CalendarDays,
  BookOpen,
  Wallet,
  MessageSquare,
  Folder,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

import { DropdownMenu, Breadcrumbs, MinimalTabs } from "../../../../components/ui";
import PhotoAvatar from "../../../../components/PhotoAvatar";

import OverviewPanel from "./OverviewPanel";
import AttendancePanel from "./AttendancePanel";
import ResultsPanel from "./ResultsPanel";
import FeesPanel from "./FeesPanel";
import RemarksPanel from "./RemarksPanel";
import RatingsPanel from "./RatingsPanel";
import DocumentsPanel from "./DocumentsPanel";
import { TAB_KEYS, formatCurrency } from "./utils";

// Admin-action modals — lazy-loaded so the read-only page stays light
// when no admin action is invoked. Each opens via the overflow menu in
// the action cluster.
const TCGeneratorModal = lazy(() => import("../../TCGeneratorModal"));
const CertificateModal = lazy(() =>
  import("../modals/CertificateModal")
);
const PromoteStudentModal = lazy(() =>
  import("../modals/PromoteStudentModal")
);
const MoveClassModal = lazy(() =>
  import("../modals/MoveClassModal")
);
const EditStudentDrawer = lazy(() => import("../../EditStudentDrawer"));

function DashboardTabs({
  student,
  studentId,
  className,
  classSize,
  parent,
  subjects,
  monthAttendance,
  timelineDays,
  upcoming,
  attendanceData,
  attendanceStats,
  attendanceLoading,
  attendanceError,
  refetchAttendance,
  results,
  resultsLoading,
  resultsError,
  refetchResults,
  feeStructure,
  feesLoading,
  feesError,
  refetchFees,
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

  // ── URL-driven tab state ─────────────────────────────────────────────
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

  const handleMessageParent = () => {
    if (!parent?.phone && !parent?.email) return;
    navigate(
      `/messaging?to=${encodeURIComponent(parent.phone || parent.email)}`
    );
  };
  const handleReportCard = () => {
    navigate(`/academics/cbse-report-card?student=${studentId}`);
  };
  const handleLogNote = () => {
    setActiveTab("remarks");
  };

  const tabs = [
    { key: "overview", title: "Overview", icon: <User size={14} aria-hidden /> },
    {
      key: "attendance",
      title: "Attendance",
      icon: <CalendarDays size={14} aria-hidden />,
    },
    {
      key: "results",
      title: "Results",
      icon: <BookOpen size={14} aria-hidden />,
    },
    { key: "fees", title: "Fees", icon: <Wallet size={14} aria-hidden /> },
    {
      key: "remarks",
      title: "Remarks",
      icon: <MessageSquare size={14} aria-hidden />,
    },
    {
      key: "documents",
      title: "Documents",
      icon: <Folder size={14} aria-hidden />,
    },
    {
      key: "ratings",
      title: "Ratings",
      icon: <Star size={14} aria-hidden />,
    },
  ];

  return (
    <div className="page student-dashboard" style={{ paddingBottom: 24 }}>
      {/* Page head */}
      <div className="page__head">
        <div>
          <Breadcrumbs
            size="sm"
            items={[
              { label: "Students", href: "/students" },
              { label: `Class ${className || "—"}` },
              { label: student.name },
            ]}
          />

          {/* Hero */}
          <div className="row gap-3" style={{ alignItems: "flex-end" }}>
            <PhotoAvatar
              src={student.picture || student.photo}
              alt={student.name}
              name={student.name}
              size="xl"
              type="student"
            />
            <div>
              <h1 className="page__title">{student.name}</h1>
              <div
                className="page__sub row gap-2"
                style={{ flexWrap: "wrap" }}
              >
                <span className="mono tnum">
                  {student.admissionId ||
                    student.studentId ||
                    student._id?.slice(-8) ||
                    "—"}
                </span>
                <span className="faint">·</span>
                <span className="chip mono tnum">
                  Class {className || "—"}
                </span>
                <span>Roll {student.rollNo ?? "—"}</span>
                {student.house && (
                  <>
                    <span className="faint">·</span>
                    <span className="chip">{student.house} House</span>
                  </>
                )}
                <span
                  className={`status status--${
                    status === "active"
                      ? "ok"
                      : status === "inactive"
                      ? "danger"
                      : "warn"
                  }`}
                >
                  <span className="dot" />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action cluster */}
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn"
            onClick={handleMessageParent}
            disabled={!parent?.phone && !parent?.email}
          >
            <Mail size={13} aria-hidden /> Message parent
          </button>
          <button type="button" className="btn" onClick={handleReportCard}>
            <Download size={13} aria-hidden /> Report card
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={handleLogNote}
          >
            <Plus size={13} aria-hidden /> Log note
          </button>

          {/* Certificate quick-action buttons */}
          <button
            type="button"
            className="btn"
            onClick={() => setOpenModal("bonafide")}
          >
            <FileText size={13} aria-hidden /> Bonafide
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setOpenModal("character")}
          >
            <Award size={13} aria-hidden /> Character
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setOpenModal("tc")}
          >
            <FileText size={13} aria-hidden /> TC
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setOpenModal("move")}
          >
            <Move size={13} aria-hidden /> Move class
          </button>

          <DropdownMenu
            ariaLabel="Student admin actions"
            placement="bottom-end"
            trigger={
              <button
                type="button"
                className="iconbtn"
                style={{ width: 32, height: 32 }}
                aria-label="Actions"
              >
                <MoreHorizontal size={16} aria-hidden />
              </button>
            }
            items={[
              { key: "tc", label: "Generate Transfer Certificate", icon: <FileText size={14} aria-hidden />, onClick: () => setOpenModal("tc") },
              { key: "bonafide", label: "Generate Bonafide Certificate", icon: <FileText size={14} aria-hidden />, onClick: () => setOpenModal("bonafide") },
              { key: "character", label: "Generate Character Certificate", icon: <Award size={14} aria-hidden />, onClick: () => setOpenModal("character") },
              { key: "promote", label: "Promote class", icon: <GraduationCap size={14} aria-hidden />, onClick: () => setOpenModal("promote") },
              { key: "move", label: "Move class", icon: <Move size={14} aria-hidden />, onClick: () => setOpenModal("move") },
              { key: "edit", label: "Edit details", icon: <Edit3 size={14} aria-hidden />, onClick: () => setOpenModal("edit") },
              { key: "print", label: "Print profile", icon: <Printer size={14} aria-hidden />, onClick: () => { toast("Print profile lands with the report-card stylesheet PR.", { icon: "📄" }); } },
            ]}
          />
        </div>
      </div>

      {/* Detail-pane KPI strip — Attendance · GPA · Fees · Rank */}
      <div className="student-dashboard__metrics">
        <div className="dp-metric">
          <span className="dp-metric__label">Attendance</span>
          <span className="dp-metric__value mono tnum">
            {attendancePct != null ? `${attendancePct}%` : "—"}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">GPA</span>
          <span className="dp-metric__value mono tnum">
            {gpa != null ? `${gpa}` : "—"}
            {gpa != null && (
              <span
                className="subtle"
                style={{ fontSize: 11, marginLeft: 2 }}
              >
                /10
              </span>
            )}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Class rank</span>
          <span className="dp-metric__value mono tnum">
            {student.rank ?? student.classRank ?? "—"}
            {classSize && (student.rank ?? student.classRank) && (
              <span className="subtle" style={{ fontSize: 11 }}>
                /{classSize}
              </span>
            )}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Fees</span>
          <span
            className="dp-metric__value mono tnum"
            style={{
              color:
                feeStatus === "paid"
                  ? "var(--ok)"
                  : feeBalance && feeBalance > 0
                  ? "var(--danger)"
                  : "var(--fg)",
            }}
          >
            {feeStatus === "paid"
              ? "Paid"
              : feeBalance != null
              ? formatCurrency(feeBalance)
              : "—"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="student-dashboard__tabs">
        <MinimalTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="underline"
          size="md"
          ariaLabel="Student detail tabs"
        />
      </div>

      {/* Tab panels */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="student-dashboard__panel"
        style={{ padding: 16 }}
      >
        {activeTab === "overview" && (
          <OverviewPanel
            subjects={subjects}
            monthAttendance={monthAttendance}
            timelineDays={timelineDays}
            parent={parent}
            upcoming={upcoming}
            student={student}
            studentId={studentId}
          />
        )}
        {activeTab === "attendance" && (
          <AttendancePanel
            studentId={studentId}
            attendanceData={attendanceData}
            attendanceStats={attendanceStats}
            loading={attendanceLoading}
            error={attendanceError}
            refetch={refetchAttendance}
          />
        )}
        {activeTab === "results" && (
          <ResultsPanel
            studentId={studentId}
            results={results}
            loading={resultsLoading}
            error={resultsError}
            refetch={refetchResults}
          />
        )}
        {activeTab === "fees" && (
          <FeesPanel
            studentId={studentId}
            feeStructure={feeStructure}
            loading={feesLoading}
            error={feesError}
            refetch={refetchFees}
          />
        )}
        {activeTab === "remarks" && (
          <RemarksPanel studentId={studentId} onAddRemark={undefined} />
        )}
        {activeTab === "documents" && <DocumentsPanel studentId={studentId} />}
        {activeTab === "ratings" && (
          <RatingsPanel student={student} onUpdate={async (updates) => {
            await updateStudent?.(student._id || student.id, updates);
            onAdminMutation?.();
          }} />
        )}
      </div>

      {/* Lazy admin modals */}
      <Suspense fallback={null}>
        {openModal === "tc" && (
          <TCGeneratorModal
            isOpen
            onClose={closeModal}
            students={[student]}
          />
        )}
        {openModal === "bonafide" && (
          <CertificateModal
            isOpen
            onClose={closeModal}
            student={student}
            type="bonafide"
            schoolInfo={schoolSettings}
          />
        )}
        {openModal === "character" && (
          <CertificateModal
            isOpen
            onClose={closeModal}
            student={student}
            type="character"
            schoolInfo={schoolSettings}
          />
        )}
        {openModal === "promote" && (
          <PromoteStudentModal
            isOpen
            onClose={closeModal}
            student={student}
            availableClasses={(classes || []).map(
              (c) => c.name || c.section || ""
            )}
            classObjects={classes || []}
            onPromote={onAdminMutation}
          />
        )}
        {openModal === "move" && (
          <MoveClassModal
            isOpen
            onClose={closeModal}
            student={student}
            availableClasses={(classes || []).map(
              (c) =>
                c.name && c.section
                  ? `${c.name}-${c.section}`
                  : c.name || c.section || ""
            )}
            classObjects={classes || []}
            onMove={onAdminMutation}
          />
        )}
        {openModal === "edit" && (
          <EditStudentDrawer
            isOpen
            onClose={closeModal}
            student={student}
            onUpdate={async (updates) => {
              await updateStudent?.(student._id || student.id, updates);
              onAdminMutation?.();
            }}
            classOptions={(classes || []).map(
              (c) => c.name || c.section || ""
            )}
            classesWithTeachers={classes || []}
          />
        )}
      </Suspense>
    </div>
  );
}

export default DashboardTabs;
