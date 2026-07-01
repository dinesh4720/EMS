import React from "react";

import { SectionHeading, EmptyLine } from "./shared";

export default function AttendanceTab({ metrics, heat, log }) {
  return (
    <div>
      <div className="sd-kpi" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ flex: 1, minWidth: 130, padding: "13px 15px", border: "1px solid var(--border)", borderRadius: 13, background: "var(--surface-2)" }}>
            <span style={{ fontSize: 11.5, color: "var(--muted)", display: "block", marginBottom: 5 }}>{m.label}</span>
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 19, fontWeight: 500, color: m.tone }}>{m.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, maxWidth: 320, marginBottom: 22 }}>
        {heat.map((h, i) => (
          <span key={i} style={{ aspectRatio: "1", borderRadius: 6, background: h.bg }} />
        ))}
      </div>

      <SectionHeading style={{ marginBottom: 11 }}>Recent log</SectionHeading>
      {log.length === 0 ? (
        <EmptyLine>No attendance recorded yet.</EmptyLine>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
          {log.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "11px 15px", borderBottom: "1px solid var(--divider)", background: "var(--surface)" }}>
              <span style={{ flex: 1, fontSize: 12.5, color: "var(--tx-2)" }}>{l.date}</span>
              <span style={{ width: 130, fontFamily: "'Geist Mono',monospace", fontSize: 11.5, color: "var(--muted)" }}>{l.inout}</span>
              <span style={{ width: 90, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: l.tone }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.tone }} />
                {l.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
