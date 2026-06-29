import { Check, Sun, AlertTriangle } from "lucide-react";

// Single banner component with three tones — picks the variant from dayMeta.
//   weekend / holiday → info  ("No school today · {dayName}")
//   end-of-day, no unmarked → ok  ("School day complete · {covered}/{total} covered")
//   end-of-day, unmarked > 0 → warn  (adds "· {N} unmarked" + overdue link)
export default function EmptyDayBanner({ dayMeta, onViewOverdue }) {
  if (!dayMeta) return null;

  if (dayMeta.isWeekendOrHoliday) {
    return (
      <div className="empty-day-banner empty-day-banner--info" role="status">
        <Sun size={14} aria-hidden />
        <span className="empty-day-banner__title">
          No school today · {dayMeta.fullDayName || dayMeta.dayName}
        </span>
        <span className="empty-day-banner__meta">
          School is closed.
        </span>
      </div>
    );
  }

  if (dayMeta.isSchoolDayComplete) {
    const hasUnmarked = (dayMeta.unmarkedCount || 0) > 0;
    return (
      <div
        className={`empty-day-banner empty-day-banner--${
          hasUnmarked ? "warn" : "ok"
        }`}
        role="status"
      >
        {hasUnmarked ? (
          <AlertTriangle size={14} aria-hidden />
        ) : (
          <Check size={14} aria-hidden />
        )}
        <span className="empty-day-banner__title">
          School day complete ·{" "}
          <span className="mono tnum">
            {dayMeta.totalCovered}/{dayMeta.totalScheduled}
          </span>{" "}
          classes covered today
          {hasUnmarked && (
            <>
              {" · "}
              <span className="mono tnum">{dayMeta.unmarkedCount}</span> unmarked
            </>
          )}
        </span>
        {hasUnmarked && (
          <div className="empty-day-banner__actions">
            <button
              type="button"
              className="btn btn--sm"
              onClick={onViewOverdue}
            >
              View overdue →
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
