import React from "react";

import { EmptyLine } from "./shared";

export default function ResultsTab({ subjects, gpa }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--panel)", borderRadius: 9, padding: 3 }}>
          <span style={{ height: 26, padding: "0 12px", display: "inline-flex", alignItems: "center", borderRadius: 7, fontSize: 12, fontWeight: 500, color: "var(--muted)", cursor: "pointer" }}>
            Term 1
          </span>
          <span style={{ height: 26, padding: "0 12px", display: "inline-flex", alignItems: "center", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "var(--tx)", background: "var(--surface)", boxShadow: "0 1px 2px rgba(20,20,30,.1)", cursor: "pointer" }}>
            Term 2
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Overall GPA{" "}
          <span style={{ fontFamily: "'Geist Mono',monospace", fontWeight: 600, color: "var(--ok)" }}>{gpa != null ? gpa : "—"}</span>
          <span style={{ color: "var(--faint)" }}>/10</span>
        </span>
      </div>

      {subjects.length === 0 ? (
        <EmptyLine>No results published for this term yet.</EmptyLine>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "10px 15px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: 10.5, fontWeight: 600, letterSpacing: ".04em", color: "var(--muted-2)", textTransform: "uppercase" }}>
            <span style={{ flex: 2 }}>Subject</span>
            <span style={{ width: 70, textAlign: "right" }}>Marks</span>
            <span style={{ width: 80, textAlign: "right" }}>Class avg</span>
            <span style={{ width: 60, textAlign: "center" }}>Grade</span>
          </div>
          {subjects.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", padding: "12px 15px", borderBottom: "1px solid var(--divider)", background: "var(--surface)" }}>
              <span style={{ flex: 2, fontSize: 13, color: "var(--tx-2)" }}>{s.name}</span>
              <span style={{ width: 70, textAlign: "right", fontFamily: "'Geist Mono',monospace", fontSize: 12.5, color: "var(--tx-2)" }}>
                {s.score}
                <span style={{ color: "var(--faint)" }}>/100</span>
              </span>
              <span style={{ width: 80, textAlign: "right", fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "var(--muted)" }}>{s.avg}</span>
              <span style={{ width: 60, textAlign: "center" }}>
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, fontWeight: 600, color: s.tone, background: s.gradeBg, borderRadius: 6, padding: "3px 9px" }}>{s.grade}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
