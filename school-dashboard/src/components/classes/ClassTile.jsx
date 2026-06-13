import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Users } from "lucide-react";

// Pick a stage icon — falls back to the book icon when unknown.
function pickIcon(className) {
  const grade = parseInt(String(className).match(/\d+/)?.[0] || "0", 10);
  if (grade >= 9) return GraduationCap;
  if (grade >= 4) return BookOpen;
  if (grade > 0) return Users;
  return BookOpen;
}

function pctBand(pct) {
  if (pct == null) return "";
  if (pct <= 60) return "danger";
  if (pct <= 80) return "warn";
  return "";
}

// 7-day attendance sparkline (stub bars for now — real history endpoint TODO).
function buildSpark(today) {
  const cur = today ?? 80;
  return Array.from({ length: 7 }, (_, i) => cur + (((i * 13) % 9) - 4));
}

export default function ClassTile({
  classRecord,
  todayPct,
  todayPresent,
  todayTotal,
  teacherName,
  currentPeriodLabel,
  unmarked,
}) {
  const Icon = pickIcon(classRecord.name);
  const id = classRecord._id || classRecord.id;
  const band = pctBand(todayPct);
  const spark = buildSpark(todayPct);

  return (
    <Link to={`/classes/${id}`} className="class-tile">
      <div className="class-tile__head">
        <span className="class-tile__name">{classRecord.name}</span>
        <span className="class-tile__icon">
          <Icon size={14} />
        </span>
      </div>

      <div
        className={`class-tile__pct${band ? ` class-tile__pct--${band}` : ""}`}
      >
        {todayPct != null ? (
          <>
            {todayPct}
            <span style={{ fontSize: 16, color: "var(--fg-subtle)" }}>%</span>
          </>
        ) : (
          "—"
        )}
      </div>

      <div className="class-tile__sub">
        {todayTotal > 0 ? (
          <>
            {todayPresent}/{todayTotal} present
          </>
        ) : (
          "Awaiting today's attendance"
        )}
      </div>

      <div className="class-tile__chart spark">
        {spark.map((v, i) => (
          <span
            key={`spark-bar-${i}`}
            className={`spark__bar${i === spark.length - 1 ? " is-now" : ""}`}
            style={{ flex: 1, height: `${Math.max(8, (v - 60) * 2.4)}%` }}
          />
        ))}
      </div>

      <div className="class-tile__foot">
        <span className="class-tile__teacher">{teacherName || "—"}</span>
        {unmarked ? (
          <span className="status status--warn">
            <span className="dot" /> Unmarked
          </span>
        ) : currentPeriodLabel ? (
          <span className="chip chip--accent">{currentPeriodLabel}</span>
        ) : null}
      </div>
    </Link>
  );
}
