import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, MoreHorizontal, MessageSquare } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

import { useApp } from "../../context/AppContext";
import {
  useStudentData,
  useStudentAttendance,
  useStudentResults,
} from "../../pages/students/hooks";
import PhotoAvatar from "../PhotoAvatar";
import AttendanceHeatmap from "./AttendanceHeatmap";
import ActivityTimeline from "./ActivityTimeline";
import ParentCard from "./ParentCard";
import SubjectsCard from "./SubjectsCard";

const EditStudentDrawer = lazy(() =>
  import("../../pages/students/EditStudentDrawer")
);
const MoveClassModal = lazy(() =>
  import("../../pages/students/components/modals/MoveClassModal")
);

// ── Local data helpers — kept in sync with StudentDashboard.jsx; if the
// shape ever drifts, extract these into a shared module.
function pickParent(student) {
  if (!student) return null;
  const fatherName = student.fatherName?.trim();
  const motherName = student.motherName?.trim();
  const guardian = student.guardian || {};
  if (fatherName) {
    return {
      name: fatherName,
      phone: student.fatherPhone || student.parentPhone,
      email: student.fatherEmail || student.parentEmail,
      relation: "Father",
    };
  }
  if (motherName) {
    return {
      name: motherName,
      phone: student.motherPhone || student.parentPhone,
      email: student.motherEmail || student.parentEmail,
      relation: "Mother",
    };
  }
  if (guardian?.name) {
    return {
      name: guardian.name,
      phone: guardian.phone,
      email: guardian.email,
      relation: guardian.relation || "Guardian",
    };
  }
  return null;
}

function buildMonthAttendance(attendanceData) {
  const rows = Array.isArray(attendanceData) ? attendanceData : [];
  const byDate = new Map();
  for (const r of rows) {
    if (!r?.date) continue;
    const key = String(r.date).slice(0, 10);
    const status = String(r.status || "").toLowerCase();
    byDate.set(key, status === "present" ? 1 : status === "absent" ? 2 : 0);
  }
  const out = [];
  const today = new Date();
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(byDate.get(key) ?? 0);
  }
  return out;
}

function buildSubjects(results) {
  const byName = new Map();
  for (const r of results || []) {
    const name = r?.subject || r?.subjectName;
    const score = Number(r?.percentage ?? r?.score);
    if (!name || !Number.isFinite(score)) continue;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(score);
  }
  const list = [];
  for (const [name, scores] of byName) {
    const grade = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
    const trend =
      scores.length >= 2
        ? Math.round(scores[scores.length - 1] - scores[0])
        : 0;
    list.push({ name, grade, trend });
  }
  return list.sort((a, b) => b.grade - a.grade);
}

function deriveGpa(subjects) {
  if (!subjects?.length) return null;
  const avg =
    subjects.reduce((a, s) => a + (s.grade || 0), 0) / subjects.length;
  return Math.round(avg * 10) / 10;
}

export default function StudentOverlayBody({ studentId, onClose }) {
  const navigate = useNavigate();
  const {
    classes = [],
    updateStudent,
    refetch: refetchAppData,
  } = useApp();
  const {
    student,
    loading: studentLoading,
    refetch: refetchStudent,
  } = useStudentData(studentId);
  const today = useMemo(() => new Date(), []);
  const startOf30 = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }, [today]);
  const endOf30 = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const { attendanceData, attendanceStats } = useStudentAttendance(studentId, {
    startDate: startOf30,
    endDate: endOf30,
  });
  const { results } = useStudentResults(studentId);

  const [openModal, setOpenModal] = useState(null); // null | 'edit' | 'move'

  if (studentLoading || !student) {
    return (
      <>
        <div className="student-overlay__hero">
          <div
            style={{ width: 56, height: 56, borderRadius: 999 }}
            className="skel-block"
          />
          <div className="student-overlay__hero-text">
            <div
              style={{ width: 180, height: 18, borderRadius: 6 }}
              className="skel-block"
            />
            <div
              style={{
                width: 120,
                height: 12,
                borderRadius: 6,
                marginTop: 6,
              }}
              className="skel-block"
            />
          </div>
        </div>
        <div className="frosted-overlay__body subtle" style={{ padding: 32 }}>
          Loading…
        </div>
      </>
    );
  }

  const cls = classes.find(
    (c) =>
      String(c.id) === String(student.classId) ||
      String(c._id) === String(student.classId)
  );
  const className = cls?.name || cls?.section || "";
  const parent = pickParent(student);
  const subjects = buildSubjects(results);
  const monthAttendance = buildMonthAttendance(attendanceData);
  const gpa = student?.gpa != null ? student.gpa : deriveGpa(subjects);
  const status = String(student?.status || "active").toLowerCase();
  const attendancePct = attendanceStats?.percentage ?? null;
  const feeBalance = student?.feeBalance ?? student?.totalDue ?? null;

  const onAdminMutation = () => {
    refetchStudent?.();
    refetchAppData?.(true).catch(() => {});
    setOpenModal(null);
  };

  const handleMessageParent = () => {
    if (!parent?.phone && !parent?.email) return;
    navigate(
      `/messaging?to=${encodeURIComponent(parent.phone || parent.email)}`
    );
    onClose?.();
  };

  return (
    <>
      <div className="student-overlay__hero">
        <PhotoAvatar
          src={student.picture || student.photo}
          alt={student.name}
          name={student.name}
          size="lg"
        />
        <div className="student-overlay__hero-text">
          <h2 className="student-overlay__name">{student.name}</h2>
          <div className="student-overlay__sub">
            <span className="mono">{student.admissionNo || student.code || "—"}</span>
            {className && <span className="chip">{className}</span>}
            <span className={`status status--${status === "active" ? "ok" : "warn"}`}>
              <span className="dot" aria-hidden />
              {status === "active" ? "Active" : status}
            </span>
          </div>
        </div>
        <div className="student-overlay__hero-actions">
          {parent?.email && (
            <a
              className="iconbtn"
              href={`mailto:${parent.email}`}
              aria-label="Email parent"
            >
              <Mail size={14} aria-hidden />
            </a>
          )}
          {parent?.phone && (
            <a
              className="iconbtn"
              href={`tel:${parent.phone}`}
              aria-label="Call parent"
            >
              <Phone size={14} aria-hidden />
            </a>
          )}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button
                type="button"
                className="iconbtn"
                aria-label="More actions"
              >
                <MoreHorizontal size={14} aria-hidden />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Student actions">
              <DropdownItem key="edit" onPress={() => setOpenModal("edit")}>
                Edit profile
              </DropdownItem>
              <DropdownItem key="move" onPress={() => setOpenModal("move")}>
                Move class
              </DropdownItem>
              <DropdownItem
                key="tc"
                onPress={() => {
                  navigate(`/students/${studentId}/transfer-certificate`);
                  onClose?.();
                }}
              >
                Transfer certificate →
              </DropdownItem>
              <DropdownItem
                key="promote"
                onPress={() => {
                  navigate(`/students/promotion?student=${studentId}`);
                  onClose?.();
                }}
              >
                Promote student →
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <div className="detail-pane__metrics student-overlay__metrics">
        <div className="dp-metric">
          <span className="dp-metric__label">Attendance</span>
          <span className="dp-metric__value mono tnum">
            {attendancePct != null ? `${attendancePct}%` : "—"}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">GPA</span>
          <span className="dp-metric__value mono tnum">
            {gpa != null ? gpa : "—"}
            {gpa != null && (
              <span className="subtle" style={{ fontSize: 11, marginLeft: 2 }}>
                /10
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
                student.feeStatus === "paid"
                  ? "var(--ok)"
                  : feeBalance && feeBalance > 0
                  ? "var(--danger)"
                  : "var(--fg)",
            }}
          >
            {student.feeStatus === "paid"
              ? "Paid"
              : feeBalance != null
              ? `₹${Number(feeBalance).toLocaleString("en-IN")}`
              : "—"}
          </span>
        </div>
      </div>

      <div className="frosted-overlay__body">
        <div className="student-overlay__body-grid">
          <div className="student-overlay__body-col">
            <AttendanceHeatmap monthAttendance={monthAttendance} />
            <ActivityTimeline days={[]} />
          </div>
          <div className="student-overlay__body-col">
            <ParentCard parent={parent} />
            <SubjectsCard
              subjects={subjects.slice(0, 3)}
              gradeBookHref={`/academics?student=${studentId}`}
            />
          </div>
        </div>
      </div>

      <div className="frosted-overlay__footer">
        <Link
          to={`/students/${studentId}`}
          className="frosted-overlay__footer-link"
          onClick={onClose}
        >
          Open full profile →
        </Link>
        <button
          type="button"
          className="btn btn--accent btn--sm"
          onClick={handleMessageParent}
          disabled={!parent?.phone && !parent?.email}
        >
          <MessageSquare size={13} aria-hidden /> Message parent
        </button>
      </div>

      {openModal === "edit" && (
        <Suspense fallback={null}>
          <EditStudentDrawer
            isOpen
            onClose={() => setOpenModal(null)}
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
        </Suspense>
      )}
      {openModal === "move" && (
        <Suspense fallback={null}>
          <MoveClassModal
            isOpen
            onClose={() => setOpenModal(null)}
            student={student}
            availableClasses={(classes || []).map(
              (c) => c.name || c.section || ""
            )}
            classObjects={classes || []}
            onMove={onAdminMutation}
          />
        </Suspense>
      )}
    </>
  );
}
