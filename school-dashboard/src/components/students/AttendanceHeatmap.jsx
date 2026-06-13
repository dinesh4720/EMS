// 30-day attendance heatmap. Cell value:
//   1 = present (ok),  2 = absent (danger),  0 = off (subtle outlined)
// Layout uses .heatmap (15-col grid) from student.css.

function CellTitle(value, dayOffset) {
  const label = value === 1 ? "Present" : value === 2 ? "Absent" : "Off";
  // dayOffset: 29 = today, 0 = oldest of the 30-day window
  const date = new Date();
  date.setDate(date.getDate() - (29 - dayOffset));
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${formatted} · ${label}`;
}

export default function AttendanceHeatmap({ monthAttendance }) {
  const cells = Array.isArray(monthAttendance) ? monthAttendance : [];
  // Pad/trim to exactly 30. Older entries first, today last.
  const padded = (() => {
    if (cells.length >= 30) return cells.slice(-30);
    return Array(30 - cells.length).fill(0).concat(cells);
  })();

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">Attendance · last 30 days</span>
        <div className="row gap-2 subtle" style={{ fontSize: 11 }}>
          <span className="row gap-1">
            <span className="dot" style={{ color: "var(--ok)" }} />
            Present
          </span>
          <span className="row gap-1">
            <span className="dot" style={{ color: "var(--danger)" }} />
            Absent
          </span>
          <span className="row gap-1">
            <span className="dot" style={{ color: "var(--fg-faint)" }} />
            Off
          </span>
        </div>
      </div>
      <div className="card__body">
        <div className="heatmap">
          {padded.map((v, i) => (
            <div
              key={`hm-cell-${i}`}
              className={`hm-cell hm-cell--${
                v === 1 ? "ok" : v === 2 ? "absent" : "off"
              }`}
              title={CellTitle(v, i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
