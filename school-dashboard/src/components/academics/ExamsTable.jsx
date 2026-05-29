import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { deriveExamStatus } from "../../hooks/useAcademicsData";

function StatusPill({ status }) {
  const tone =
    status === "results_published"
      ? "ok"
      : status === "ongoing"
      ? "warn"
      : status === "completed"
      ? "info"
      : status === "draft"
      ? "danger"
      : "info";
  const label =
    status === "results_published"
      ? "Published"
      : status === "ongoing"
      ? "Ongoing"
      : status === "completed"
      ? "Completed"
      : status === "draft"
      ? "Draft"
      : "Scheduled";
  return (
    <span className={`status status--${tone}`}>
      <span className="dot" aria-hidden />
      {label}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ExamsTable({ rows = [], onEnterResults }) {
  if (rows.length === 0) {
    return (
      <div className="academics-table">
        <div className="academics-table__empty">No exams match this filter.</div>
      </div>
    );
  }
  return (
    <div className="academics-table" role="table">
      <div className="academics-table__head" role="row">
        <span>Exam</span>
        <span>Subject</span>
        <span>Class</span>
        <span>Date</span>
        <span>Status</span>
        <span className="academics-table__action">Action</span>
      </div>
      {rows.map((e) => {
        const id = e._id || e.id;
        const status = deriveExamStatus(e);
        const className = e.className || e.classSection || e.classId?.name || "—";
        return (
          <div key={id} role="row" className="academics-table__row">
            <span>
              <div className="academics-table__name">{e.name || "—"}</div>
              <div className="academics-table__sub">
                {e.term ? `Term ${e.term}` : ""}
                {e.maxMarks ? ` · max ${e.maxMarks}` : ""}
              </div>
            </span>
            <span className="subtle">{e.subject || "—"}</span>
            <span className="subtle">{className}</span>
            <span className="mono tnum text-xs text-fg-muted">
              {fmtDate(e.date)}
            </span>
            <span><StatusPill status={status} /></span>
            <span className="academics-table__action row gap-1 justify-end">
              {status === "results_published" ? (
                <Link to={`/academics/exam-detail/${id}`} className="btn btn--sm">
                  View results
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn btn--accent btn--sm"
                  onClick={() => onEnterResults?.(e)}
                >
                  Enter results <ChevronRight size={13} aria-hidden />
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
