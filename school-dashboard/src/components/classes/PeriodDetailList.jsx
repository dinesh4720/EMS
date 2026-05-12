import PeriodClassRow from "./PeriodClassRow";
import { ATTENDANCE_CUTOFF_MINUTES } from "../../pages/classes/hooks/useTodayPeriods";

export default function PeriodDetailList({ period }) {
  if (!period) {
    return (
      <div className="period-detail">
        <div className="period-detail__head">
          <span>No period selected</span>
        </div>
      </div>
    );
  }

  const slots = period.slots || [];
  const liveSlots = slots.filter((s) => s.state !== "skipped");
  const now = new Date();
  const cutoffEdge = period.start
    ? new Date(period.start.getTime() + ATTENDANCE_CUTOFF_MINUTES * 60_000)
    : null;
  const minutesToCutoff = cutoffEdge
    ? (cutoffEdge.getTime() - now.getTime()) / 60_000
    : 0;

  return (
    <div className="period-detail">
      <div className="period-detail__head">
        <strong>
          {period.name || `Period ${period.number}`}
        </strong>
        {period.startLabel && period.endLabel && (
          <span className="mono tnum">
            {period.startLabel}–{period.endLabel}
          </span>
        )}
        <span>
          ·{" "}
          <span className="mono tnum">{liveSlots.length}</span>{" "}
          {liveSlots.length === 1 ? "class" : "classes"} running
        </span>
      </div>

      {liveSlots.length === 0 ? (
        <div
          className="subtle"
          style={{ padding: 24, textAlign: "center", fontSize: 13 }}
        >
          {period.isBreak
            ? `Break — ${period.name || "no class"}`
            : "No classes scheduled this period."}
        </div>
      ) : (
        <div role="list">
          {liveSlots.map((slot) => (
            <PeriodClassRow
              key={slot.classId}
              slot={slot}
              period={period}
              minutesToCutoff={minutesToCutoff}
            />
          ))}
        </div>
      )}
    </div>
  );
}
