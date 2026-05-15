import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

// One row inside the selected period's class list.
// State-aware action button per spec: Open roster / Mark now / View →.
// Row body click → /classes/:id (Phase 5b will swap to frosted overlay).
export default function PeriodClassRow({ slot, period, minutesToCutoff }) {
  const navigate = useNavigate();
  if (!slot) return null;

  const att = slot.attendance || { marked: false, present: 0, total: 0 };
  const pct = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
  const band =
    att.total === 0 ? "" : pct >= 90 ? "ok" : pct >= 75 ? "accent" : "warn";

  const handleRowClick = () => {
    // TODO: Phase 5b — swap to frosted overlay launch
    if (slot.classId) navigate(`/classes/${slot.classId}`);
  };

  const handleMarkAttendance = (e) => {
    e.stopPropagation();
    // The legacy bulk-attendance route handles per-class marking via class detail
    if (slot.classId) navigate(`/classes/${slot.classId}/attendance`);
  };

  const handleOpenRoster = (e) => {
    e.stopPropagation();
    if (slot.classId) navigate(`/classes/${slot.classId}`);
  };

  const meta = [slot.subject, slot.teacherName, slot.room]
    .filter((x) => x && x !== "—")
    .join(" · ");

  return (
    <div
      className="period-class-row"
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div className="period-class-row__name">{slot.className}</div>
        {meta && <div className="period-class-row__meta">{meta}</div>}
      </div>

      <div className="period-class-row__attendance">
        {att.total > 0 ? (
          <>
            <div className="bar">
              <div
                className={`bar__fill${band ? ` bar__fill--${band}` : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="period-class-row__count">
              {att.present}/{att.total}
            </span>
          </>
        ) : (
          <span className="period-class-row__count subtle">—</span>
        )}
      </div>

      <div className="period-class-row__action">
        {slot.state === "live" && (
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleOpenRoster}
          >
            Open roster
          </button>
        )}
        {slot.state === "urgent" && (
          <>
            <span className="status status--warn">
              <span className="dot" aria-hidden />
              <span className="mono tnum">
                {Math.max(0, Math.round(minutesToCutoff))}m left
              </span>
            </span>
            <button
              type="button"
              className="btn btn--accent btn--sm"
              onClick={handleMarkAttendance}
            >
              Mark now →
            </button>
          </>
        )}
        {slot.state === "overdue" && (
          <>
            <span className="status status--danger">
              <span className="dot" aria-hidden />
              Overdue
            </span>
            <button
              type="button"
              className="btn btn--sm"
              style={{
                background: "var(--danger)",
                color: "white",
                borderColor: "var(--danger)",
              }}
              onClick={handleMarkAttendance}
            >
              Mark now →
            </button>
          </>
        )}
        {slot.state === "marked" && (
          <>
            <Check size={13} style={{ color: "var(--ok)" }} aria-hidden />
            <button
              type="button"
              className="btn btn--sm"
              onClick={handleOpenRoster}
            >
              View →
            </button>
          </>
        )}
        {(slot.state === "upcoming" || slot.state === "skipped") && null}
      </div>
    </div>
  );
}
