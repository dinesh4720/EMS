import React from "react";

import { EmptyLine } from "./shared";

export default function FeesTab({ stats, items, onOpenFees }) {
  return (
    <div>
      <div className="sd-kpi" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {stats.map((f) => (
          <div key={f.label} style={{ flex: 1, minWidth: 130, padding: "13px 15px", border: "1px solid var(--border)", borderRadius: 13, background: "var(--surface-2)" }}>
            <span style={{ fontSize: 11.5, color: "var(--muted)", display: "block", marginBottom: 5 }}>{f.label}</span>
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 18, fontWeight: 500, color: f.tone }}>{f.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx)" }}>Fee breakdown</span>
        <div style={{ flex: 1 }} />
        <span onClick={onOpenFees} style={{ fontSize: 12, color: "var(--acc)", cursor: "pointer" }}>
          Open in Fees →
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyLine>No fee breakdown available.</EmptyLine>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
          {items.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 15px", borderBottom: "1px solid var(--divider)", background: "var(--surface)" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 13, color: "var(--tx-2)" }}>{f.name}</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{f.due}</span>
              </div>
              <span style={{ width: 100, textAlign: "right", fontFamily: "'Geist Mono',monospace", fontSize: 12.5, color: "var(--tx-2)" }}>{f.amount}</span>
              <span style={{ width: 84, textAlign: "right" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 21, padding: "0 8px", borderRadius: 6, background: f.bg, fontSize: 11, fontWeight: 500, color: f.tone }}>
                  {f.statusLabel}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
