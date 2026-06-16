import { Story } from "../../shared";

/* ──────────────────────────────────────────────────────────────────
 * Class tile — .class-tile attendance % grid with sparkline. By-class
 * grid surfacing class-level attendance at a glance.
 * ────────────────────────────────────────────────────────────────── */
const CLASS_TILE_ROWS = [
  { name: "Class 3-A", pct: 94, tone: "ok",     present: 28, total: 30, teacher: "Asha Sharma",   series: [40, 60, 75, 80, 85, 90, 94] },
  { name: "Class 4-B", pct: 68, tone: "warn",   present: 22, total: 32, teacher: "Vikram Singh",  series: [80, 75, 70, 72, 68, 65, 68] },
  { name: "Class 5-A", pct: 42, tone: "danger", present: 13, total: 31, teacher: "Deepak Mehta",  series: [55, 50, 48, 45, 44, 43, 42] },
];

export default function ClassTileDemo() {
  return (
    <Story title="By-class grid" layout="plain">
      <div style={{ padding: 16 }}>
        <div className="class-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {CLASS_TILE_ROWS.map((c) => (
            <a key={c.name} href="#pattern-class-tile" className="class-tile" onClick={(e) => e.preventDefault()}>
              <div className="class-tile__head"><span className="class-tile__name">{c.name}</span></div>
              <div className={`class-tile__pct class-tile__pct--${c.tone}`}>
                {c.pct}<span style={{ fontSize: 14 }}>%</span>
              </div>
              <div className="class-tile__sub">{c.present} / {c.total} present</div>
              <div className="class-tile__chart spark">
                {c.series.map((h, i, arr) => (
                  <span
                    key={`spark-bar-${i}`}
                    className={`spark__bar${i === arr.length - 1 ? " is-now" : ""}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="class-tile__foot"><span className="class-tile__teacher">{c.teacher}</span></div>
            </a>
          ))}
        </div>
      </div>
    </Story>
  );
}
