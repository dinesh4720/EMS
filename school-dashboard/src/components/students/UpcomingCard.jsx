// Renders rows: { date: "MMM DD", title, meta }
// Splits date string on whitespace; falls back to entire string as the day if no space.

function splitDate(d) {
  if (!d) return { month: "", day: "—" };
  const parts = String(d).split(/\s+/);
  if (parts.length >= 2) return { month: parts[0], day: parts.slice(1).join(" ") };
  return { month: "", day: parts[0] };
}

export default function UpcomingCard({ items }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">Upcoming</span>
      </div>
      {list.length === 0 ? (
        <div
          className="subtle"
          style={{ padding: 24, textAlign: "center", fontSize: 13 }}
        >
          Nothing scheduled.
        </div>
      ) : (
        <div>
          {list.map((u, i) => {
            const { month, day } = splitDate(u.date);
            return (
              <div
                key={`${u.date}-${i}`}
                className="row"
                style={{
                  padding: "10px 14px",
                  borderTop: i ? "1px solid var(--divider)" : "none",
                  gap: 12,
                }}
              >
                <div
                  className="col"
                  style={{ alignItems: "center", minWidth: 36 }}
                >
                  <span
                    className="mono tnum"
                    style={{
                      fontSize: 10,
                      color: "var(--fg-subtle)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {month}
                  </span>
                  <span
                    className="mono tnum"
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {day}
                  </span>
                </div>
                <div
                  className="col"
                  style={{ flex: 1, lineHeight: 1.3, minWidth: 0 }}
                >
                  <span style={{ fontWeight: 520, fontSize: 13 }}>
                    {u.title}
                  </span>
                  {u.meta && (
                    <span className="subtle" style={{ fontSize: 11.5 }}>
                      {u.meta}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
