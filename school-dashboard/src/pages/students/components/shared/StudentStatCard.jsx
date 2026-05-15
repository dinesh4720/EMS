import React from "react";

// REVAMP-12 · Minimal student stat card.
// Rebuilt on the design-system primitive — wraps a single .dp-metric so
// it sits naturally next to the detail-pane KPI strip. Optional trend
// uses .status pill tones (ok/warn/danger) instead of ad-hoc colors.
function StudentStatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  onClick,
}) {
  const Wrap = onClick ? "button" : "div";
  return (
    <Wrap
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="card dp-metric"
      style={{
        padding: 14,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        background: "var(--surface)",
      }}
    >
      <div
        className="row gap-2"
        style={{ alignItems: "center", justifyContent: "space-between" }}
      >
        {Icon ? (
          <Icon size={14} aria-hidden style={{ color: "var(--fg-muted)" }} />
        ) : (
          <span />
        )}
        {trend && (
          <span
            className={`status status--${
              trend.positive ? "ok" : "danger"
            }`}
            style={{ fontSize: 10.5 }}
          >
            {trend.positive ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>
      <span className="dp-metric__label" style={{ marginTop: 8 }}>
        {label}
      </span>
      <span className="dp-metric__value mono tnum" style={{ fontSize: 20 }}>
        {value}
      </span>
      {subtext && (
        <span className="subtle" style={{ fontSize: 11, marginTop: 4 }}>
          {subtext}
        </span>
      )}
    </Wrap>
  );
}

export default React.memo(StudentStatCard);
