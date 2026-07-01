import React from "react";

import { SectionHeading, EmptyLine, HEAT_LEGEND } from "./shared";

// Overview tab — sidebar layout (single column; the context rail only shows
// in the design's banner layout, which we don't use).
export default function OverviewTab({ subjects, heat, attendancePct, activity, onGradebook }) {
  return (
    <div className="sd-grid2" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        {/* Subjects */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx)" }}>Subjects</span>
            <span style={{ fontSize: 11.5, color: "var(--muted-2)" }}>Term 2</span>
            <div style={{ flex: 1 }} />
            <span onClick={onGradebook} style={{ fontSize: 12, color: "var(--acc)", cursor: "pointer" }}>
              Gradebook →
            </span>
          </div>
          {subjects.length === 0 ? (
            <EmptyLine>No subject grades published yet.</EmptyLine>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {subjects.map((s) => (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "9px 0",
                    borderBottom: "1px solid var(--divider)",
                  }}
                >
                  <span
                    style={{
                      flex: 1.5,
                      minWidth: 0,
                      fontSize: 13,
                      color: "var(--tx-2)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.name}
                  </span>
                  <span style={{ flex: 1.4, height: 6, borderRadius: 4, background: "var(--panel)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", borderRadius: 4, background: s.tone, width: s.barW }} />
                  </span>
                  <span style={{ width: 38, textAlign: "right", fontFamily: "'Geist Mono',monospace", fontSize: 12.5, color: "var(--tx-2)" }}>
                    {s.score}
                  </span>
                  <span
                    style={{
                      width: 34,
                      textAlign: "center",
                      fontFamily: "'Geist Mono',monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      color: s.tone,
                      background: s.gradeBg,
                      borderRadius: 6,
                      padding: "2px 0",
                    }}
                  >
                    {s.grade}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance heatmap */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tx)" }}>Attendance</span>
            <span style={{ fontSize: 11.5, color: "var(--muted-2)" }}>Last 5 weeks</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "var(--ok)" }}>
              {attendancePct != null ? `${attendancePct}%` : "—"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, maxWidth: 280 }}>
            {heat.map((h, i) => (
              <span key={i} style={{ aspectRatio: "1", borderRadius: 5, background: h.bg }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 11 }}>
            {HEAT_LEGEND.map((l) => (
              <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <SectionHeading style={{ marginBottom: 12 }}>Recent activity</SectionHeading>
          {activity.length === 0 ? (
            <EmptyLine>No recent activity.</EmptyLine>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: a.dot, marginTop: 3 }} />
                    <span style={{ width: 1.5, flex: 1, background: "var(--divider)", minHeight: 14 }} />
                  </div>
                  <div style={{ paddingBottom: 15, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--tx-2)" }}>{a.text}</span>
                      <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10.5, color: "var(--muted-2)" }}>{a.time}</span>
                    </div>
                    {a.meta ? <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{a.meta}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
