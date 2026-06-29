import { ChevronLeft, Mail, Phone, MoreHorizontal, X, Check } from "lucide-react";
import PhotoAvatar from "../../components/PhotoAvatar";
import DropdownMenu from "../../components/ui/DropdownMenu";

// Same status tone map as StaffListRow — kept inline so the pane is
// self-contained.
const STATUS_TONE = {
  present: "ok",
  active: "ok",
  absent: "danger",
  leave: "warn",
  halfday: "warn",
  inactive: "danger",
};

// Status choices offered by the "Mark attendance" picker — same enum the
// bulk/regularize flows use (see AttendanceContext.markStaffAttendance).
const ATTENDANCE_OPTIONS = [
  { key: "present", label: "Present", dot: "bg-ok" },
  { key: "absent", label: "Absent", dot: "bg-danger-token" },
  { key: "leave", label: "On leave", dot: "bg-warn" },
  { key: "halfday", label: "Half day", dot: "bg-warn" },
];

function roleLabel(role) {
  if (Array.isArray(role)) return role[0] || "";
  return role || "";
}

function classesArray(classes) {
  if (!Array.isArray(classes)) return [];
  return classes
    .map((c) => (typeof c === "string" ? c : c?.name || c?.code || c?._id))
    .filter(Boolean);
}

function formatJoinDate(d) {
  if (!d) return "—";
  // Display YYYY-MM (mono tabular); preserve graceful fall-back when input is junk
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toISOString().slice(0, 7);
  } catch {
    return "—";
  }
}

export default function StaffDetailPane({
  staff,
  todayStatus,
  attendancePct,
  checkInTime,
  onClose,
  onViewProfile,
  onMarkAttendance,
  isMobile = false,
}) {
  if (!staff) return null;

  const status = todayStatus || staff.status || "active";
  const tone = STATUS_TONE[status] || "info";
  const role = roleLabel(staff.role);
  const dept = staff.department || staff.dept || "—";
  const classes = classesArray(staff.assignedClasses);
  const code = staff.staffNumber || staff.code || "";

  return (
    <aside
      className="detail-pane"
      aria-label={`Profile: ${staff.name}`}
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
          {isMobile ? <X size={13} /> : <ChevronLeft size={13} />}
        </button>
        {code && (
          <span className="subtle mono tnum" style={{ fontSize: 11 }}>
            {code}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {staff.email && (
          <a
            href={`mailto:${staff.email}`}
            className="iconbtn"
            style={{ width: 24, height: 24 }}
            aria-label="Email"
            title={staff.email}
          >
            <Mail size={13} />
          </a>
        )}
        {staff.phone && (
          <a
            href={`tel:${staff.phone}`}
            className="iconbtn"
            style={{ width: 24, height: 24 }}
            aria-label="Call"
            title={staff.phone}
          >
            <Phone size={13} />
          </a>
        )}
        <button
          type="button"
          className="iconbtn"
          style={{ width: 24, height: 24 }}
          onClick={onViewProfile}
          aria-label="More actions"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Hero */}
      <div className="detail-pane__hero">
        <PhotoAvatar
          src={staff.picture || staff.photo}
          alt={staff.name}
          name={staff.name}
          size="lg"
          type="staff"
        />
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {staff.name}
          </span>
          <span className="subtle" style={{ fontSize: 13 }}>
            {role || "Staff"}
            {dept && dept !== "—" ? ` · ${dept}` : ""}
          </span>
          <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
            <span className={`status status--${tone}`}>
              <span className="dot" />
              {status}
            </span>
            {classes.slice(0, 4).map((c) => (
              <span key={c} className="chip mono tnum">{c}</span>
            ))}
            {classes.length > 4 && (
              <span className="chip">+{classes.length - 4}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3-col metric strip — tabular-nums so dashes align with numbers */}
      <div className="detail-pane__metrics">
        <div className="dp-metric">
          <span className="dp-metric__label">Attendance</span>
          <span className="dp-metric__value mono tnum">
            {attendancePct != null ? `${attendancePct}%` : "—"}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Check-in</span>
          <span className="dp-metric__value mono tnum">
            {checkInTime || "—"}
          </span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Joined</span>
          <span
            className="dp-metric__value mono tnum"
            style={{ fontSize: 13 }}
          >
            {formatJoinDate(staff.joinDate)}
          </span>
      </div>
    </div>

      {/* Contact */}
      <div className="detail-pane__section">
        <div className="card__title" style={{ marginBottom: 10 }}>
          Contact
        </div>
        <div className="dp-kv">
          <span className="subtle">Email</span>
          <span className="mono tnum">{staff.email || "—"}</span>
        </div>
        <div className="dp-kv">
          <span className="subtle">Phone</span>
          <span className="mono tnum">{staff.phone || "—"}</span>
        </div>
        <div className="dp-kv">
          <span className="subtle">Emergency</span>
          <span className="mono tnum">
            {staff.emergencyPhone || staff.emergencyContacts?.[0]?.phone || "—"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="detail-pane__foot">
        <button type="button" className="btn" onClick={onViewProfile}>
          View profile
        </button>
        <DropdownMenu
          ariaLabel="Mark attendance status"
          placement="top-end"
          trigger={
            <button
              type="button"
              className="btn btn--accent"
              style={{ flex: 1 }}
            >
              Mark attendance
            </button>
          }
          items={ATTENDANCE_OPTIONS.map(({ key, label, dot }) => ({
            key,
            label: (
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {label}
              </span>
            ),
            icon:
              status === key ? (
                <Check size={14} className="text-accent" />
              ) : (
                <span className="w-3.5" />
              ),
            onClick: () => onMarkAttendance?.(key),
          }))}
        />
      </div>
    </aside>
  );
}
