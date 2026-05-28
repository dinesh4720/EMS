import React, { useMemo, useState, lazy, Suspense, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import toast from "react-hot-toast";

import { useApp } from "../../context/AppContext";
import { useSchool } from "../../context/SchoolContext";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import {
  useStudentData,
  useStudentAttendance,
  useStudentResults,
  useStudentRemarks,
  useStudentFees,
  useStudentDocuments,
} from "./hooks";

import PhotoAvatar from "../../components/PhotoAvatar";
import { Breadcrumbs } from "../../components/ui";
import { DetailPageSkeleton } from "../../components/skeletons/PageSkeletons";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import MinimalTabs from "../../components/ui/MinimalTabs";
import SubjectsCard from "../../components/students/SubjectsCard";
import AttendanceHeatmap from "../../components/students/AttendanceHeatmap";
import ActivityTimeline from "../../components/students/ActivityTimeline";
import ParentCard from "../../components/students/ParentCard";
import UpcomingCard from "../../components/students/UpcomingCard";
import PersonalCard from "../../components/students/PersonalCard";

// Admin-action modals — lazy-loaded so the read-only page stays light
// when no admin action is invoked. Each opens via the overflow menu in
// the action cluster.
const TCGeneratorModal = lazy(() => import("./TCGeneratorModal"));
const CertificateModal = lazy(() =>
  import("./components/modals/CertificateModal")
);
const PromoteStudentModal = lazy(() =>
  import("./components/modals/PromoteStudentModal")
);
const MoveClassModal = lazy(() =>
  import("./components/modals/MoveClassModal")
);
const EditStudentDrawer = lazy(() => import("./EditStudentDrawer"));

// REVAMP-12 · Student detail dashboard
// Hero with avatar, status pills, dp-metric strip, tabbed content
// (overview / attendance / results / fees / remarks / documents). The
// frosted overlay variant lives in components/students/StudentOverlay.

const TAB_KEYS = [
  "overview",
  "attendance",
  "results",
  "fees",
  "remarks",
  "documents",
];

// Pull the parent record from either the modern `parents[]` array or the
// legacy flat `parentName/parentPhone/parentEmail/parentRelationship` fields.
function pickParent(student) {
  if (!student) return null;
  if (Array.isArray(student.parents) && student.parents.length > 0) {
    const primary =
      student.parents.find((p) => p.isParent) || student.parents[0];
    return {
      name: primary.name,
      relation: primary.relationship,
      phone: primary.phone,
      email: primary.email,
    };
  }
  if (student.parentName || student.parentPhone || student.parentEmail) {
    return {
      name: student.parentName,
      relation: student.parentRelationship,
      phone: student.parentPhone,
      email: student.parentEmail,
    };
  }
  return null;
}

// Convert the API attendance log into the 30-day heatmap shape (1/2/0).
// Today is index 29; older days fill earlier indices.
function buildMonthAttendance(attendanceData) {
  if (!Array.isArray(attendanceData) || attendanceData.length === 0) return [];
  const cells = new Array(30).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDate = new Map();
  for (const r of attendanceData) {
    if (!r?.date) continue;
    const key = String(r.date).slice(0, 10);
    const status = String(r.status || "").toLowerCase();
    if (status === "present" || status === "p") byDate.set(key, 1);
    else if (status === "absent" || status === "a") byDate.set(key, 2);
  }

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    cells[i] = byDate.get(key) ?? 0;
  }
  return cells;
}

function buildSubjects(results) {
  if (!Array.isArray(results) || results.length === 0) return [];
  const latestBySubject = new Map();
  for (const r of results) {
    const key = r.subject || r.subjectName || r.name;
    if (!key) continue;
    const grade = Number(r.percentage ?? r.marks ?? r.score ?? r.grade ?? NaN);
    if (!Number.isFinite(grade)) continue;
    const existing = latestBySubject.get(key);
    if (
      !existing ||
      new Date(r.examDate || 0) > new Date(existing.examDate || 0)
    ) {
      latestBySubject.set(key, { ...r, _grade: grade });
    }
  }
  return Array.from(latestBySubject.values()).map((r) => ({
    name: r.subject || r.subjectName || r.name,
    teacher: r.teacher || r.teacherName || "",
    grade: Math.round(r._grade),
    trend: 0,
  }));
}

function deriveGpa(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;
  const grades = subjects.map((s) => Number(s.grade)).filter(Number.isFinite);
  if (grades.length === 0) return null;
  const avgPct = grades.reduce((a, b) => a + b, 0) / grades.length;
  return Number((avgPct / 10).toFixed(1));
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  try {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  } catch {
    return `₹${value}`;
  }
}

function formatDateShort(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ── Tab panels ──────────────────────────────────────────────────────────
function OverviewPanel({
  subjects,
  monthAttendance,
  timelineDays,
  parent,
  upcoming,
  student,
  studentId,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: 16,
      }}
      className="student-dashboard__overview-grid"
    >
      <div className="col gap-4">
        <SubjectsCard
          subjects={subjects.slice(0, 5)}
          gradeBookHref={`/academics?student=${studentId}`}
        />
        <AttendanceHeatmap monthAttendance={monthAttendance} />
        <ActivityTimeline days={timelineDays} />
      </div>
      <div className="col gap-4">
        <ParentCard
          parent={parent}
          onSms={() =>
            parent?.phone && window.open(`sms:${parent.phone}`, "_self")
          }
          onEmail={() =>
            parent?.email && window.open(`mailto:${parent.email}`, "_self")
          }
          onCall={() =>
            parent?.phone && window.open(`tel:${parent.phone}`, "_self")
          }
        />
        <UpcomingCard items={upcoming} />
        <PersonalCard
          dob={student.dob}
          age={student.age}
          gender={student.gender}
          bloodGroup={student.bloodGroup}
          admissionDate={student.admissionDate}
        />
      </div>
    </div>
  );
}

function AttendancePanel({ studentId, attendanceData, attendanceStats, loading, error, refetch }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading attendance…</span>
      </div>
    );
  }
  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }
  const rows = Array.isArray(attendanceData) ? attendanceData.slice(-60).reverse() : [];
  const monthAttendance = buildMonthAttendance(attendanceData);
  return (
    <div className="col gap-4">
      <div className="row gap-3" style={{ flexWrap: "wrap" }}>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Overall</span>
          <span className="dp-metric__value mono tnum">
            {attendanceStats?.percentage != null
              ? `${attendanceStats.percentage}%`
              : "—"}
          </span>
        </div>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Present</span>
          <span className="dp-metric__value mono tnum">
            {attendanceStats?.present ?? 0}
          </span>
        </div>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Absent</span>
          <span className="dp-metric__value mono tnum">
            {attendanceStats?.absent ?? 0}
          </span>
        </div>
      </div>

      <AttendanceHeatmap monthAttendance={monthAttendance} />

      <div className="card">
        <div className="card__head">
          <span className="card__title">Recent attendance</span>
          <Link
            to={`/students/${studentId}/attendance`}
            className="subtle"
            style={{ fontSize: 12, textDecoration: "none" }}
          >
            Full log →
          </Link>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            size="sm"
            title="No attendance recorded"
            description="Once daily attendance is marked it will appear here."
          />
        ) : (
          <div style={{ padding: 0 }}>
            {rows.map((r, i) => {
              const status = String(r.status || "").toLowerCase();
              const tone =
                status === "present"
                  ? "ok"
                  : status === "absent"
                  ? "danger"
                  : "warn";
              return (
                <div
                  key={`${r.date}-${i}`}
                  className="row gap-3"
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--divider)",
                    alignItems: "center",
                  }}
                >
                  <span className="mono tnum" style={{ minWidth: 96, fontSize: 12 }}>
                    {formatDateShort(r.date)}
                  </span>
                  <span className={`status status--${tone}`}>
                    <span className="dot" />
                    {status || "—"}
                  </span>
                  {r.classPeriod && (
                    <span className="subtle" style={{ fontSize: 12 }}>
                      {r.classPeriod}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsPanel({ studentId, results, loading, error, refetch }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading results…</span>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const subjects = buildSubjects(results);
  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No results published"
        description="Subject grades will appear here after the term exam is published."
      />
    );
  }
  return (
    <SubjectsCard
      subjects={subjects}
      gradeBookHref={`/academics?student=${studentId}`}
    />
  );
}

function FeesPanel({ studentId, feeStructure, loading, error, refetch }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading fees…</span>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!feeStructure) {
    return (
      <EmptyState
        icon={Wallet}
        title="No fee structure"
        description="Assign a fee template to this student to begin tracking dues."
      />
    );
  }
  const total = feeStructure.totalFee ?? feeStructure.totalAmount;
  const paid = feeStructure.paidAmount ?? 0;
  const balance =
    feeStructure.balanceAmount ?? (total != null ? total - paid : null);
  const status = String(feeStructure.feeStatus || feeStructure.status || "").toLowerCase();
  const tone =
    status === "paid"
      ? "ok"
      : status === "overdue" || status === "outstanding"
      ? "danger"
      : "warn";
  return (
    <div className="col gap-4">
      <div className="row gap-3" style={{ flexWrap: "wrap" }}>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Total</span>
          <span className="dp-metric__value mono tnum">{formatCurrency(total)}</span>
        </div>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Paid</span>
          <span className="dp-metric__value mono tnum">{formatCurrency(paid)}</span>
        </div>
        <div className="dp-metric" style={{ flex: 1, minWidth: 160 }}>
          <span className="dp-metric__label">Balance</span>
          <span className="dp-metric__value mono tnum">{formatCurrency(balance)}</span>
        </div>
      </div>
      <div className="card">
        <div className="card__head">
          <span className="card__title">Fee status</span>
          {status && (
            <span className={`status status--${tone}`}>
              <span className="dot" />
              {status}
            </span>
          )}
        </div>
        <div style={{ padding: 16 }}>
          <Link
            to={`/fees?student=${studentId}`}
            className="btn"
            style={{ textDecoration: "none" }}
          >
            Open in fees →
          </Link>
        </div>
      </div>
    </div>
  );
}

function RemarksPanel({ studentId, onAddRemark }) {
  const { remarks, loading, error, refetch } = useStudentRemarks(studentId);
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading remarks…</span>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  // Privacy filter: only show staff-visible remarks here, mark sentToParent
  const list = Array.isArray(remarks) ? remarks : [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No remarks yet"
        description="Add observations, notes, or commendations about this student."
        action={
          onAddRemark
            ? { label: "Add remark", onClick: onAddRemark }
            : undefined
        }
      />
    );
  }
  return (
    <div className="col gap-3">
      {list.map((r) => {
        const visible = !!r.sentToParent;
        return (
          <div key={r._id || r.id} className="card">
            <div className="card__head">
              <span className="card__title">{r.title || r.category || "Remark"}</span>
              <div className="row gap-2">
                {r.category && <span className="chip">{r.category}</span>}
                <span
                  className={`status status--${visible ? "ok" : "warn"}`}
                  title={visible ? "Visible to parents" : "Staff-only"}
                >
                  <span className="dot" />
                  {visible ? "Shared" : "Internal"}
                </span>
              </div>
            </div>
            <div style={{ padding: "10px 14px 14px" }}>
              <p style={{ fontSize: 13, margin: 0, color: "var(--fg)" }}>
                {r.description || r.note || ""}
              </p>
              {(r.createdBy?.name || r.createdAt) && (
                <div
                  className="subtle row gap-2"
                  style={{ fontSize: 11, marginTop: 8 }}
                >
                  {r.createdBy?.name && <span>{r.createdBy.name}</span>}
                  {r.createdAt && (
                    <span className="mono tnum">{formatDateShort(r.createdAt)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocumentsPanel({ studentId }) {
  const result = useStudentDocuments(studentId) || {};
  const { documents, loading, error, refetch } = result;
  if (loading) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <span className="subtle">Loading documents…</span>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const list = Array.isArray(documents) ? documents : [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="No documents uploaded"
        description="Birth certificate, Aadhaar, transfer certificate and other student documents will appear here."
      />
    );
  }
  return (
    <div className="col gap-2">
      {list.map((d) => (
        <a
          key={d._id || d.id || d.url}
          href={d.url || d.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="card row gap-3"
          style={{
            padding: 14,
            textDecoration: "none",
            color: "var(--fg)",
            alignItems: "center",
          }}
        >
          <FileText size={16} aria-hidden style={{ color: "var(--fg-muted)" }} />
          <div className="col" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 520 }}>
              {d.name || d.type || "Document"}
            </span>
            {d.uploadedAt && (
              <span className="subtle mono tnum" style={{ fontSize: 11 }}>
                {formatDateShort(d.uploadedAt)}
              </span>
            )}
          </div>
          <Download size={14} aria-hidden style={{ color: "var(--fg-faint)" }} />
        </a>
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const {
    params: { id },
    isValid,
  } = useValidatedParams({ id: "objectId" }, { redirectTo: "/students" });
  const { classes, students, updateStudent, refetch: refetchAppData } =
    useApp();
  const { schoolSettings } = useSchool();

  const { student, loading: studentLoading, refetch: refetchStudent } =
    useStudentData(id);

  // ── URL-driven tab state ─────────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
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

  // ── Admin action modals (overflow menu) ──────────────────────────────
  const [openModal, setOpenModal] = useState(null);
  const closeModal = () => setOpenModal(null);
  const onAdminMutation = () => {
    refetchStudent?.();
    refetchAppData?.();
    closeModal();
  };

  // Last 30 days for the heatmap — also drives the Attendance tab
  const today = useMemo(() => new Date(), []);
  const startOf30 = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }, [today]);
  const endOf30 = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const {
    attendanceData,
    attendanceStats,
    loading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useStudentAttendance(id, {
    startDate: startOf30,
    endDate: endOf30,
  });

  const {
    results,
    loading: resultsLoading,
    error: resultsError,
    refetch: refetchResults,
  } = useStudentResults(id);

  const {
    feeStructure,
    loading: feesLoading,
    error: feesError,
    refetch: refetchFees,
  } = useStudentFees(id, { autoInitialize: true });

  // ── Derived values ───────────────────────────────────────────────────
  const cls = (classes || []).find((c) =>
    student
      ? String(c.id) === String(student.classId) ||
        String(c._id) === String(student.classId)
      : false
  );
  const className = cls?.name || cls?.section || "";
  const classSize = student
    ? (students || []).filter(
        (s) => String(s.classId) === String(student.classId)
      ).length || null
    : null;
  const parent = pickParent(student);
  const subjects = buildSubjects(results);
  const monthAttendance = buildMonthAttendance(attendanceData);
  const gpa = student?.gpa != null ? student.gpa : deriveGpa(subjects);
  const status = String(student?.status || "active").toLowerCase();

  const timelineDays = useMemo(() => {
    const items = [];
    const lastAttendance = (attendanceData || []).slice(-1)[0];
    if (lastAttendance) {
      const t = lastAttendance.checkInTime || "—";
      items.push({
        day: "Today",
        items: [
          {
            time: t,
            kind: "att",
            text:
              String(lastAttendance.status || "").toLowerCase() === "present"
                ? "Marked present"
                : "Marked absent",
            meta: lastAttendance.classPeriod || "",
          },
        ],
      });
    }
    return items;
  }, [attendanceData]);

  const upcoming = useMemo(() => [], []);

  if (!isValid) return null;
  if (studentLoading || !student) {
    return <DetailPageSkeleton title avatar fields={6} />;
  }

  const handleMessageParent = () => {
    if (!parent?.phone && !parent?.email) return;
    navigate(
      `/messaging?to=${encodeURIComponent(parent.phone || parent.email)}`
    );
  };
  const handleReportCard = () => {
    navigate(`/students/${id}/report-card`);
  };
  const handleLogNote = () => {
    setActiveTab("remarks");
  };

  const attendancePct = attendanceStats?.percentage ?? null;
  const feeBalance =
    feeStructure?.balanceAmount ??
    student.feeBalance ??
    null;
  const feeStatus =
    feeStructure?.feeStatus || student.feeStatus || null;

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
        <div className="row gap-2">
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

          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button
                type="button"
                className="iconbtn"
                style={{ width: 32, height: 32 }}
                aria-label="More student actions"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Student admin actions"
              onAction={(key) => {
                if (key === "print") {
                  toast(
                    "Print profile lands with the report-card stylesheet PR.",
                    { icon: "📄" }
                  );
                  return;
                }
                setOpenModal(String(key));
              }}
            >
              <DropdownItem
                key="tc"
                startContent={<FileText size={14} aria-hidden />}
              >
                Generate Transfer Certificate
              </DropdownItem>
              <DropdownItem
                key="bonafide"
                startContent={<FileText size={14} aria-hidden />}
              >
                Generate Bonafide Certificate
              </DropdownItem>
              <DropdownItem
                key="character"
                startContent={<Award size={14} aria-hidden />}
              >
                Generate Character Certificate
              </DropdownItem>
              <DropdownItem
                key="promote"
                startContent={<GraduationCap size={14} aria-hidden />}
              >
                Promote class
              </DropdownItem>
              <DropdownItem
                key="move"
                startContent={<Move size={14} aria-hidden />}
                showDivider
              >
                Move class
              </DropdownItem>
              <DropdownItem
                key="edit"
                startContent={<Edit3 size={14} aria-hidden />}
              >
                Edit details
              </DropdownItem>
              <DropdownItem
                key="print"
                startContent={<Printer size={14} aria-hidden />}
              >
                Print profile
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
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
            studentId={id}
          />
        )}
        {activeTab === "attendance" && (
          <AttendancePanel
            studentId={id}
            attendanceData={attendanceData}
            attendanceStats={attendanceStats}
            loading={attendanceLoading}
            error={attendanceError}
            refetch={refetchAttendance}
          />
        )}
        {activeTab === "results" && (
          <ResultsPanel
            studentId={id}
            results={results}
            loading={resultsLoading}
            error={resultsError}
            refetch={refetchResults}
          />
        )}
        {activeTab === "fees" && (
          <FeesPanel
            studentId={id}
            feeStructure={feeStructure}
            loading={feesLoading}
            error={feesError}
            refetch={refetchFees}
          />
        )}
        {activeTab === "remarks" && (
          <RemarksPanel studentId={id} onAddRemark={undefined} />
        )}
        {activeTab === "documents" && <DocumentsPanel studentId={id} />}
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
              (c) => c.name || c.section || ""
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
              onAdminMutation();
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
