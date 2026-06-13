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
    <div
      ref={ref}
      role="listitem"
      tabIndex={-1}
      aria-current={isActive ? "true" : undefined}
      className={`studentlist__row ${isActive ? "is-active" : ""}`}
      data-student-id={student.id || student._id}
    >
      {onToggleCheck && (
        <button
          type="button"
          aria-pressed={isChecked}
          aria-label={`Select ${student.name}`}
          className="studentlist__checkbox"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(student, e);
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
        className="studentlist__row-main"
        onClick={handleRowClick}
        aria-label={`Open ${student.name} profile`}
      >
        <PhotoAvatar
          src={student.picture || student.photo}
          alt={student.name}
          name={student.name}
          size="sm"
          type="student"
          className="studentlist__row-avatar"
        />

        <div className="studentlist__row-title">
          <span className="studentlist__row-name">{student.name}</span>
          {code && (
            <span className="studentlist__row-code subtle mono tnum">
              {code}
            </span>
          )}
        </div>

        <div className="studentlist__row-meta">
          {classLabel && (
            <span className="subtle">{classLabel}</span>
          )}
          {student.parentPhone && (
            <span className="faint">· {student.parentPhone}</span>
          )}
        </div>

        <span className={`studentlist__row-status status status--${tone}`}>
          <span className="dot" />
          {status}
        </span>

        <div className="studentlist__row-extras">
          {attendancePct != null && (
            <span className="mono tnum subtle studentlist__row-attendance">
              {attendancePct}%
            </span>
          )}
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
            >
              <ArrowUpRight size={14} aria-hidden />
            </span>
          )}
        </div>
      </button>
    </div>
  );
});

export default StudentListRow;
