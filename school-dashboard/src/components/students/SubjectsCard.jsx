import { Link } from "react-router-dom";

// Grade-band → bar fill class. Per spec:
//   ≥90 → ok    ≥75 → accent    < 75 → warn
function gradeBand(grade) {
  if (grade >= 90) return "ok";
  if (grade >= 75) return "accent";
  return "warn";
}

function trendArrow(t) {
  if (t > 0) return "↑";
  if (t < 0) return "↓";
  return "·";
}

function trendColor(t) {
  if (t > 0) return "var(--ok)";
  if (t < 0) return "var(--danger)";
  return "var(--fg-faint)";
}

export default function SubjectsCard({ subjects, gradeBookHref }) {
  const list = Array.isArray(subjects) ? subjects : [];
  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">Subjects · current term</span>
        {gradeBookHref && (
          <Link
            to={gradeBookHref}
            className="subtle"
            style={{ fontSize: 12, textDecoration: "none" }}
          >
            Grade book →
          </Link>
        )}
      </div>
      {list.length === 0 ? (
        <div
          className="subtle"
          style={{ padding: 24, textAlign: "center", fontSize: 13 }}
        >
          No subject grades recorded yet.
        </div>
      ) : (
        <div className="subjects">
          {list.map((sub) => {
            const grade = Number(sub.grade);
            const band = gradeBand(grade);
            const trend = Number(sub.trend) || 0;
            return (
              <div key={sub.name} className="subject">
                <div className="subject__top">
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 520,
                        fontSize: 13,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {sub.name}
                    </div>
                    <div className="subtle" style={{ fontSize: 11.5 }}>
                      {sub.teacher || "—"}
                    </div>
                  </div>
                  <div className="row gap-2">
                    <span
                      className="mono tnum"
                      style={{ fontWeight: 600, fontSize: 16 }}
                    >
                      {Number.isFinite(grade) ? grade : "—"}
                    </span>
                    {trend !== 0 && (
                      <span
                        className="mono tnum"
                        style={{ fontSize: 11, color: trendColor(trend) }}
                      >
                        {trendArrow(trend)}
                        {Math.abs(trend)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bar">
                  <div
                    className={`bar__fill bar__fill--${band}`}
                    style={{
                      width: `${Math.max(0, Math.min(100, grade || 0))}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
