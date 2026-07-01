import React from "react";

// Small shared atoms for the pixel-perfect tab panels.

export function SectionHeading({ children, style }) {
  return (
    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx)", display: "block", ...style }}>
      {children}
    </span>
  );
}

// Uppercase micro-label used by card headers / rail sections.
export function MicroLabel({ children, style }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: ".06em",
        color: "var(--muted-2)",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// Calm inline empty note that keeps a section's vertical rhythm.
export function EmptyLine({ children }) {
  return (
    <div style={{ padding: "10px 0", fontSize: 12.5, color: "var(--muted)" }}>{children}</div>
  );
}

export const HEAT_LEGEND = [
  { label: "Present", color: "var(--ok)" },
  { label: "Absent", color: "var(--danger)" },
  { label: "Leave", color: "var(--warn)" },
  { label: "Holiday", color: "var(--panel)" },
];
