import { forwardRef } from "react";
import PhotoAvatar from "../../components/PhotoAvatar";

// Status pill — uses --ok-bg / --warn-bg / --danger-bg / --info-bg
// tokens. Never hardcode rgba.
const STATUS_TONE = {
  present: "ok",
  active: "ok",
  absent: "danger",
  leave: "warn",
  halfday: "warn",
  inactive: "danger",
};

function roleLabel(role) {
  if (Array.isArray(role)) return role[0] || "";
  return role || "";
}

function classesLabel(classes) {
  if (!Array.isArray(classes) || classes.length === 0) return "";
  // assignedClasses can be objects ({name, _id}) or plain strings
  return classes
    .map((c) => (typeof c === "string" ? c : c?.name || c?.code || c?._id))
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

const StaffListRow = forwardRef(function StaffListRow(
  {
    staff,
    isActive,
    isChecked,
    onSelect,
    onToggleCheck,
    todayStatus,
    attendancePct,
  },
  ref
) {
  const status = todayStatus || staff.status || "active";
  const tone = STATUS_TONE[status] || "info";
  const role = roleLabel(staff.role);
  const classes = classesLabel(staff.assignedClasses);
  const code = staff.staffNumber || staff.code || "";
  const id = staff._id || staff.id;

  const handleRowClick = () => onSelect?.(staff);

  return (
    <div
      ref={ref}
      role="listitem"
      aria-current={isActive ? "true" : undefined}
      className={`stafflist__row ${isActive ? "is-active" : ""}`}
      data-staff-id={id}
    >
      {onToggleCheck && (
        <button
          type="button"
          aria-pressed={isChecked}
          aria-label={`Select ${staff.name}`}
          className="stafflist__checkbox"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(staff, e);
          }}
        >
          {isChecked && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3 8.5l3.5 3.5 7-8"
                stroke="var(--accent-fg)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
      <button
        type="button"
        className="stafflist__row-main"
        onClick={handleRowClick}
        aria-label={`Open ${staff.name} profile`}
      >
        <PhotoAvatar
          src={staff.picture || staff.photo}
          alt={staff.name}
          name={staff.name}
          size="sm"
          type="staff"
        />
        <div
          className="col"
          style={{
            minWidth: 0,
            flex: 1,
            lineHeight: 1.3,
            alignItems: "flex-start",
          }}
        >
          <div className="row gap-2" style={{ width: "100%", minWidth: 0 }}>
            <span
              style={{
                fontWeight: 520,
                letterSpacing: "-0.01em",
                fontSize: 13,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                flex: 1,
              }}
            >
              {staff.name}
            </span>
            {code && (
              <span
                className="subtle mono tnum"
                style={{ fontSize: 11, flexShrink: 0 }}
              >
                {code}
              </span>
            )}
          </div>
          {(role || classes) && (
            <div
              className="row gap-2"
              style={{ width: "100%", minWidth: 0 }}
            >
              {role && (
                <span className="subtle" style={{ fontSize: 12 }}>
                  {role}
                </span>
              )}
              {classes && (
                <span className="faint" style={{ fontSize: 12 }}>
                  · {classes}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="col gap-1" style={{ alignItems: "flex-end", flexShrink: 0 }}>
          <span className={`status status--${tone}`}>
            <span className="dot" />
            {status}
          </span>
          {attendancePct != null && (
            <span
              className="mono tnum subtle"
              style={{ fontSize: 11 }}
            >
              {attendancePct}%
            </span>
          )}
        </div>
      </button>
    </div>
  );
});

export default StaffListRow;
