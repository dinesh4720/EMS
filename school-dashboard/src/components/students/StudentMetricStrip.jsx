// 4-column metric strip — uses shell.css `.metric-strip`/`.metric` rules.
// Tabular-nums + dash-fallback so values stay aligned even when missing.

function MetricCell({ label, value, suffix, deltaText, deltaUp, valueColor }) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className="metric">
      <span className="metric__label">{label}</span>
      <div
        className="metric__value tnum"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {hasValue ? value : "—"}
        {hasValue && suffix && (
          <span style={{ fontSize: 14, color: "var(--fg-subtle)" }}>
            {suffix}
          </span>
        )}
      </div>
      {deltaText && (
        <span
          className={`metric__delta${deltaUp ? " metric__delta--up" : ""}`}
        >
          {deltaText}
        </span>
      )}
    </div>
  );
}

export default function StudentMetricStrip({
  attendance,
  rank,
  classSize,
  gpa,
  feeStatus,
  feeBalance,
  feeNextDue,
}) {
  // Fee status — text + color from real data
  const feePaid =
    feeStatus === "paid" ||
    (feeStatus !== "outstanding" && (feeBalance ?? 0) <= 0);
  const feeValue = feePaid
    ? "Paid"
    : feeBalance != null
    ? `Outstanding`
    : feeStatus
    ? feeStatus.charAt(0).toUpperCase() + feeStatus.slice(1)
    : "—";
  const feeDelta = feePaid
    ? feeNextDue
      ? `₹0 outstanding · next due ${feeNextDue}`
      : "₹0 outstanding"
    : feeBalance != null
    ? `₹${Number(feeBalance).toLocaleString("en-IN")} due${
        feeNextDue ? ` · ${feeNextDue}` : ""
      }`
    : null;

  return (
    <div className="metric-strip">
      <MetricCell
        label="Attendance"
        value={attendance != null ? attendance : null}
        suffix="%"
        // Delta intentionally null — no fabricated trend until a historical
        // attendance endpoint exists to compute a real "vs last term" delta.
        deltaText={null}
      />
      <MetricCell
        label="Class rank"
        value={rank != null ? rank : null}
        suffix={classSize ? `/${classSize}` : null}
        // Delta intentionally null — no fabricated movement until ranking
        // history is exposed to compute a real rank-delta.
        deltaText={null}
      />
      <MetricCell
        label="GPA"
        value={gpa != null ? gpa : null}
        suffix="/10"
        // Delta intentionally null — no fabricated change until a previous-term
        // GPA endpoint exists to compute a real delta.
        deltaText={null}
      />
      <MetricCell
        label="Fee status"
        value={feeValue}
        valueColor={feePaid ? "var(--ok)" : "var(--danger)"}
        deltaText={feeDelta}
      />
    </div>
  );
}
