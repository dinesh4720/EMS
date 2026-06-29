import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

// Right rail (Today view only). Three cards stacked.
//   1. Alerts — overdue/unmarked classes across the entire day
//   2. Upcoming — next 2 periods with their slots
//   3. Week mini-cal — 7 columns, one bar per day, color by aggregate state
//
// Per the README's flagged ambiguity (visual call #2): density is one bar per
// day, not 8-cell. Kept legible at the rail's 380px width.
export default function ClassesRail({ periods, dayMeta, onJumpToPeriod }) {
  const overdueSlots = (periods || []).flatMap((p) =>
    p.slots
      .filter((s) => s.state === "overdue")
      .map((s) => ({ ...s, periodNumber: p.number, periodName: p.name }))
  );
  const upcomingPeriods = (periods || [])
    .filter((p) => p.state === "upcoming")
    .slice(0, 2);

  return (
    <div className="classes-rail">
      <AlertsCard
        overdueSlots={overdueSlots}
        onJumpToPeriod={onJumpToPeriod}
      />
      <UpcomingCard periods={upcomingPeriods} />
      <WeekMiniCal dayMeta={dayMeta} />
    </div>
  );
}

function AlertsCard({ overdueSlots, onJumpToPeriod }) {
  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">
          Alerts
          {overdueSlots.length > 0 && (
            <span
              className="chip chip--warn"
              style={{ marginLeft: 6 }}
            >
              <AlertTriangle size={10} aria-hidden />
              {overdueSlots.length}
            </span>
          )}
        </span>
      </div>
      {overdueSlots.length === 0 ? (
        <div
          className="subtle"
          style={{ padding: 16, textAlign: "center", fontSize: 12.5 }}
        >
          Nothing overdue.
        </div>
      ) : (
        <div>
          {overdueSlots.slice(0, 5).map((s, i) => (
            <button
              key={`${s.classId}-${i}`}
              type="button"
              onClick={() => onJumpToPeriod?.(s.periodNumber)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 14px",
                borderTop: i ? "1px solid var(--divider)" : "none",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span className="status status--danger">
                <span className="dot" />P{s.periodNumber}
              </span>
              <span className="col" style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 12.5, fontWeight: 520 }}>
                  {s.className}
                </span>
                <span className="subtle" style={{ fontSize: 11.5 }}>
                  {s.subject || "—"} · {s.teacherName || "—"}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingCard({ periods }) {
  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">Upcoming</span>
      </div>
      {periods.length === 0 ? (
        <div
          className="subtle"
          style={{ padding: 16, textAlign: "center", fontSize: 12.5 }}
        >
          No more periods today.
        </div>
      ) : (
        <div>
          {periods.map((p, pi) => (
            <div
              key={p.number}
              style={{
                padding: "10px 14px",
                borderTop: pi ? "1px solid var(--divider)" : "none",
              }}
            >
              <div
                className="row gap-2"
                style={{ marginBottom: 4 }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 520 }}>
                  {p.name || `Period ${p.number}`}
                </span>
                <span
                  className="mono tnum subtle"
                  style={{ fontSize: 11 }}
                >
                  {p.startLabel}
                </span>
              </div>
              {p.slots.length === 0 ? (
                <span className="subtle" style={{ fontSize: 11.5 }}>
                  Free
                </span>
              ) : (
                <div className="col" style={{ gap: 2 }}>
                  {p.slots.slice(0, 3).map((s) => (
                    <span
                      key={s.classId}
                      className="subtle"
                      style={{ fontSize: 11.5 }}
                    >
                      {s.className} · {s.subject || "—"}
                    </span>
                  ))}
                  {p.slots.length > 3 && (
                    <span className="faint" style={{ fontSize: 11 }}>
                      +{p.slots.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function WeekMiniCal({ dayMeta }) {
  const today = new Date();
  // Normalize to Monday-first index (Mon=0 … Sun=6)
  const dowMon0 = (today.getDay() + 6) % 7;

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">This week</span>
      </div>
      <div className="card__body">
        <div className="weekcal">
          {WEEK_LABELS.map((label, idx) => {
            const isToday = idx === dowMon0;
            // Only today's bar reflects a real coverage state (from dayMeta).
            // Past and future days stay neutral — there is no per-day attendance
            // summary endpoint yet, so colouring past days green would claim
            // full attendance coverage with zero data.
            // TODO: real per-day "covered/total" once the summary endpoint exists.
            let barClass = "weekcal__bar--neutral";
            if (isToday) {
              if (dayMeta?.unmarkedCount > 0) barClass = "weekcal__bar--warn";
              else if (dayMeta?.totalCovered > 0) barClass = "weekcal__bar--ok";
            }
            return (
              <div
                key={label}
                className={`weekcal__col${isToday ? " weekcal__col--today" : ""}`}
              >
                <span className="weekcal__day">{label}</span>
                <div className={`weekcal__bar ${barClass}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
