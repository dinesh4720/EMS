import React from "react";

import { DropdownMenu } from "../../../../../components/ui";
import { IconPhone, IconMail, IconDownload, IconDots } from "./sdIcons";
import { ACCENT, DASH } from "./sdData";

// Left profile aside (312px) — 1:1 port of the design's sidebar layout.
export default function SidebarAside({
  initials,
  name,
  admissionId,
  status,
  classSec,
  roll,
  house,
  kpis,
  parent,
  personal,
  onMessageParent,
  onCall,
  onEmail,
  onReportCard,
  overflowItems,
}) {
  const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Active";
  return (
    <aside
      className="sd-aside"
      style={{
        width: 312,
        flex: "none",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        boxShadow: "var(--shadow)",
        overflow: "hidden",
        position: "sticky",
        top: 18,
      }}
    >
      <div style={{ height: 74, background: ACCENT.band }} />
      <div style={{ padding: "0 20px 20px", marginTop: -38 }}>
        <span
          style={{
            width: 76,
            height: 76,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 25,
            fontWeight: 600,
            background: ACCENT.avBg,
            color: ACCENT.avFg,
            border: "3px solid var(--surface)",
            boxShadow: "0 4px 14px -4px rgba(20,20,30,.3)",
          }}
        >
          {initials}
        </span>
        <div style={{ marginTop: 13, display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.01em", color: "var(--tx)" }}>
            {name}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "var(--muted)" }}>
              {admissionId}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 20,
                padding: "0 8px",
                borderRadius: 6,
                background: "var(--ok-bg)",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--ok)",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ok)" }} />
              {statusLabel}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--tx-3)" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 22,
                padding: "0 9px",
                borderRadius: 7,
                background: "var(--panel)",
                fontWeight: 500,
              }}
            >
              Class {classSec}
            </span>
            <span>Roll {roll}</span>
            <span style={{ color: "var(--faint)" }}>·</span>
            <span>{house}</span>
          </div>
        </div>

        {/* KPI stack */}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            background: "var(--border-soft)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 13px",
                background: "var(--surface)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{k.label}</span>
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13.5, fontWeight: 500, color: k.tone }}>
                {k.value}
                <span style={{ fontSize: 10.5, color: "var(--faint)" }}>{k.suffix}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Guardian */}
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", color: "var(--muted-2)", textTransform: "uppercase" }}>
            Guardian
          </span>
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 11 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--panel)",
                color: "var(--tx-3)",
              }}
            >
              {parent?.initials || DASH}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--tx)" }}>{parent?.name || DASH}</span>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                {parent?.relation || DASH} · {parent?.phone || DASH}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 11, display: "flex", gap: 7 }}>
            <button
              type="button"
              onClick={onCall}
              disabled={!parent?.phone}
              className="sdx-soft-btn"
              style={asideMiniBtn}
            >
              <IconPhone size={13} />
              Call
            </button>
            <button
              type="button"
              onClick={onEmail}
              disabled={!parent?.email}
              className="sdx-soft-btn"
              style={asideMiniBtn}
            >
              <IconMail size={13} />
              Email
            </button>
          </div>
        </div>

        {/* Personal */}
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", color: "var(--muted-2)", textTransform: "uppercase" }}>
            Personal
          </span>
          <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 1 }}>
            {personal.map((p) => (
              <div
                key={p.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: "1px solid var(--divider)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{p.label}</span>
                <span style={{ fontSize: 12.5, color: "var(--tx-2)" }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <button type="button" onClick={onMessageParent} style={asidePrimaryBtn}>
            <IconMail size={14} />
            Message parent
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onReportCard} className="sdx-soft-btn" style={asideReportBtn}>
              <IconDownload size={13} />
              Report card
            </button>
            <DropdownMenu
              ariaLabel="Student admin actions"
              placement="bottom-end"
              trigger={
                <button type="button" className="sdx-soft-btn" style={asideMoreBtn} aria-label="More actions">
                  <IconDots size={15} color="var(--muted)" />
                </button>
              }
              items={overflowItems}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

const asideMiniBtn = {
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  height: 32,
  borderRadius: 9,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--tx-3)",
  cursor: "pointer",
};

const asidePrimaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 38,
  border: "1px solid var(--acc)",
  borderRadius: 10,
  background: "var(--acc)",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  cursor: "pointer",
};

const asideReportBtn = {
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  height: 36,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--surface)",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 500,
  color: "var(--tx-3)",
  cursor: "pointer",
};

const asideMoreBtn = {
  width: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 36,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--surface)",
  color: "var(--muted)",
  cursor: "pointer",
};
