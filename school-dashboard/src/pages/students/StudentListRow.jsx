import { forwardRef } from "react";
import { ArrowUpRight } from "lucide-react";
import PhotoAvatar from "../../components/PhotoAvatar";

// Status tone map — uses --ok-bg / --warn-bg / --danger-bg / --info-bg tokens
const STATUS_TONE = {
  active: "ok",
  present: "ok",
  inactive: "danger",
  alumni: "info",
  suspended: "warn",
  transferred: "info",
};

const StudentListRow = forwardRef(function StudentListRow(
  {
    student,
    isActive,
    isChecked,
    onSelect,
    onToggleCheck,
    onViewProfile,
    attendancePct,
  },
  ref
) {
  const status = String(student.status || "active").toLowerCase();
  const tone = STATUS_TONE[status] || "info";
  const cls = student.class || student.className || "";
  const section = student.section || "";
  const classLabel = section ? `${cls}-${section}` : cls;
  const code = student.admissionNo || student.code || student.rollNumber || "";

  const handleRowClick = () => onSelect?.(student);

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={handleRowClick}
      className={`studentlist__row ${isActive ? "is-active" : ""}`}
      data-student-id={student.id || student._id}
    >
      {onToggleCheck && (
        <span
          role="checkbox"
          aria-checked={isChecked}
          aria-label={`Select ${student.name}`}
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(student, e);
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              onToggleCheck(student, e);
            }
          }}
          className="studentlist__checkbox"
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: "1px solid var(--border-strong)",
            background: isChecked ? "var(--accent)" : "var(--surface)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          {isChecked && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3 8.5l3.5 3.5 7-8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      )}
      <PhotoAvatar
        src={student.picture || student.photo}
        alt={student.name}
        name={student.name}
        size="sm"
        type="student"
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
            {student.name}
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
        <div
          className="row gap-2"
          style={{ width: "100%", minWidth: 0 }}
        >
          {classLabel && (
            <span className="subtle" style={{ fontSize: 12 }}>
              {classLabel}
            </span>
          )}
          {student.parentPhone && (
            <span className="faint" style={{ fontSize: 12 }}>
              · {student.parentPhone}
            </span>
          )}
        </div>
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
      {onViewProfile && (
        <span
          role="button"
          tabIndex={-1}
          aria-label="Open full profile"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(student);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onViewProfile(student);
            }
          }}
          className="studentlist__profile-arrow"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            cursor: "pointer",
            color: "var(--fg-subtle)",
            marginLeft: 4,
          }}
        >
          <ArrowUpRight size={14} aria-hidden />
        </span>
      )}
    </button>
  );
});

export default StudentListRow;
