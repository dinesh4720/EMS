import { useMemo } from "react";
import { ChevronLeft, Mail, Phone, MessageSquare, X, ArrowUpRight } from "lucide-react";
import PhotoAvatar from "../../components/PhotoAvatar";
import {
  useStudentData,
  useStudentAttendance,
  useStudentResults,
} from "../../pages/students/hooks";
import { useApp } from "../../context/AppContext";

const STATUS_TONE = {
  active: "ok",
  inactive: "danger",
  alumni: "info",
  suspended: "warn",
  transferred: "info",
};

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

function deriveGpa(results) {
  const byName = new Map();
  for (const result of results || []) {
    const name = result?.subject || result?.subjectName;
    const score = Number(result?.percentage ?? result?.score);
    if (!name || !Number.isFinite(score)) continue;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(score);
  }
  const list = [];
  for (const [name, scores] of byName) {
    const grade = Math.round(scores.reduce((sum, sc) => sum + sc, 0) / scores.length);
    list.push({ name, grade });
  }
  if (!list.length) return null;
  const avg = list.reduce((sum, item) => sum + item.grade, 0) / list.length;
  return Math.round(avg * 10) / 10;
}

export default function StudentDetailPane({
  student: listStudent,
  onClose,
  onViewProfile,
  onMessageParent,
  isMobile = false,
}) {
  const { classes = [] } = useApp();
  const studentId = listStudent?.id || listStudent?._id;

  const { student: detailStudent, loading } = useStudentData(studentId, {
    autoFetch: Boolean(studentId),
  });

  const today = useMemo(() => new Date(), []);
  const startOf30 = useMemo(() => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - 29);
    return dt.toISOString().slice(0, 10);
  }, [today]);
  const endOf30 = useMemo(() => today.toISOString().slice(0, 10), [today]);

  const { attendanceStats } = useStudentAttendance(studentId, {
    autoFetch: Boolean(studentId),
    startDate: startOf30,
    endDate: endOf30,
  });

  const { results } = useStudentResults(studentId, {
    autoFetch: Boolean(studentId),
  });

  // Merge list data with detail data (list data is available immediately)
  const student = detailStudent || listStudent;
  if (!student) return null;

  const status = String(student.status || "active").toLowerCase();
  const tone = STATUS_TONE[status] || "info";
  const cls = classes.find(
    (cl) =>
      String(cl.id) === String(student.classId) ||
      String(cl._id) === String(student.classId)
  );
  const className = cls?.name || cls?.section || student.class || "";
  const parent = pickParent(student);
  const gpa = student?.gpa != null ? student.gpa : deriveGpa(results);
  const attendancePct = attendanceStats?.percentage ?? student.attendancePercentage ?? null;
  const feeBalance = student?.feeBalance ?? student?.totalDue ?? null;
  const code = student.admissionNo || student.code || student.rollNumber || "";

  if (loading && !detailStudent) {
    return (
      <aside className="detail-pane" role="complementary" aria-label="Student profile">
        <div className="detail-pane__head" />
        <div className="detail-pane__hero">
          <div
            className="skel-block"
            style={{ width: 56, height: 56, borderRadius: 999 }}
          />
          <div className="col gap-2" style={{ minWidth: 0, flex: 1 }}>
            <div className="skel-block" style={{ width: 140, height: 16, borderRadius: 6 }} />
            <div className="skel-block" style={{ width: 100, height: 12, borderRadius: 6 }} />
          </div>
        </div>
        <div className="subtle" style={{ padding: 32, fontSize: 13 }}>
          Loading student details…
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="detail-pane"
      role="complementary"
      aria-label={`Profile: ${student.name}`}
    >
      {/* Head bar */}
      <div className="detail-pane__head">
        <button
          type="button"
          className="iconbtn"
          style={{ width: 24, height: 24 }}
          onClick={onClose}
          aria-label={isMobile ? "Close profile" : "Clear selection"}
          title={isMobile ? "Close" : "Clear selection"}
        >
          {isMobile ? <X size={13} aria-hidden /> : <ChevronLeft size={13} aria-hidden />}
        </button>
        {code && (
          <span className="subtle mono tnum" style={{ fontSize: 11 }}>
            {code}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {parent?.email && (
          <a
            href={`mailto:${parent.email}`}
            className="iconbtn"
            style={{ width: 24, height: 24 }}
            aria-label="Email parent"
            title={parent.email}
          >
            <Mail size={13} aria-hidden />
          </a>
        )}
        {parent?.phone && (
          <a
            href={`tel:${parent.phone}`}
            className="iconbtn"
            style={{ width: 24, height: 24 }}
            aria-label="Call parent"
            title={parent.phone}
          >
            <Phone size={13} aria-hidden />
          </a>
        )}
      </div>

      {/* Hero */}
      <div className="detail-pane__hero">
        <button
          type="button"
          onClick={onViewProfile}
          className="avatar-btn"
          aria-label={`Open full profile for ${student.name}`}
          title="Open full profile"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            borderRadius: "50%",
            lineHeight: 0,
          }}
        >
          <PhotoAvatar
            src={student.picture || student.photo}
            alt={student.name}
            name={student.name}
            size="lg"
            type="student"
          />
        </button>
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <button
            type="button"
            onClick={onViewProfile}
            className="profile-name-btn"
            aria-label={`Open full profile for ${student.name}`}
            title="Open full profile"
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              background: "none",
              border: "none",
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 4,
              minWidth: 0,
            }}
          >
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {student.name}
            </span>
            <ArrowUpRight size={16} style={{ flexShrink: 0, opacity: 0.5 }} aria-hidden />
          </button>
          <span className="subtle" style={{ fontSize: 13 }}>
            {className || "Student"}
          </span>
          <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
            <span className={`status status--${tone}`}>
              <span className="dot" />
              {status}
            </span>
            {student.gender && (
              <span className="chip">{student.gender}</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="detail-pane__metrics">
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

      {/* Parent contact */}
      <div className="detail-pane__section">
        <div className="card__title" style={{ marginBottom: 10 }}>
          Parent / Guardian
        </div>
        {parent ? (
          <>
            <div className="dp-kv">
              <span className="subtle">Name</span>
              <span>{parent.name}</span>
            </div>
            <div className="dp-kv">
              <span className="subtle">Relation</span>
              <span>{parent.relation}</span>
            </div>
            <div className="dp-kv">
              <span className="subtle">Phone</span>
              <span className="mono tnum">{parent.phone || "—"}</span>
            </div>
            <div className="dp-kv">
              <span className="subtle">Email</span>
              <span className="mono tnum">{parent.email || "—"}</span>
            </div>
          </>
        ) : (
          <div className="subtle" style={{ fontSize: 12 }}>
            No parent or guardian information on file.
          </div>
        )}
      </div>

      {/* Quick info */}
      <div className="detail-pane__section">
        <div className="card__title" style={{ marginBottom: 10 }}>
          Student info
        </div>
        <div className="dp-kv">
          <span className="subtle">DOB</span>
          <span className="mono tnum">{student.dob || "—"}</span>
        </div>
        <div className="dp-kv">
          <span className="subtle">Blood group</span>
          <span>{student.bloodGroup || "—"}</span>
        </div>
        <div className="dp-kv">
          <span className="subtle">Address</span>
          <span>{student.address || "—"}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="detail-pane__foot">
        <button
          type="button"
          className="btn btn--accent"
          style={{ flex: 1 }}
          onClick={onMessageParent}
          disabled={!parent?.phone && !parent?.email}
        >
          <MessageSquare size={13} aria-hidden /> Message parent
        </button>
      </div>
    </aside>
  );
}
