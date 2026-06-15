import { useState } from "react";
import { Search } from "lucide-react";

import DetailPaneMini from "./DetailPaneMini";
import { TWO_PANE_STAFF } from "./twoPaneStaff";

/* ──────────────────────────────────────────────────────────────────
 * Two-pane shell — canonical list shape from staffs revamp. List on
 * the left, .detail-pane pinned on the right. Selection lives in the
 * URL so back/forward and direct-link work. Source of truth:
 * src/pages/staffs/StaffList.jsx.
 * ────────────────────────────────────────────────────────────────── */
export default function TwoPaneDemo() {
  const [selected, setSelected] = useState("s1");
  const active = TWO_PANE_STAFF.find((s) => s.id === selected) || TWO_PANE_STAFF[0];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 280px",
        height: 360,
        borderTop: "1px solid var(--divider)",
        borderBottom: "1px solid var(--divider)",
      }}
    >
      <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="toolbar" style={{ flex: "none" }}>
          <div className="toolbar__search" style={{ flex: 1 }}>
            <Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
            <input placeholder="Search staff…" aria-label="Demo search" />
            <span className="kbd" aria-hidden>/</span>
          </div>
        </div>
        <div role="listbox" aria-label="Staff demo" style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {TWO_PANE_STAFF.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={selected === s.id}
              onClick={() => setSelected(s.id)}
              className={`stafflist__row${selected === s.id ? " is-active" : ""}`}
              style={{ width: "100%", background: "transparent" }}
            >
              <span
                className="avatar avatar--sm"
                style={{ width: 26, height: 26, fontSize: 11 }}
                aria-hidden
              >
                {s.initials}
              </span>
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 520, color: "var(--fg)" }}>{s.name}</span>
                <span className="subtle" style={{ fontSize: 11.5 }}>{s.role}</span>
              </span>
              <span className={`status status--${s.status}`}>
                <span className="dot" aria-hidden />
                {s.status === "ok" ? "Present" : s.status === "warn" ? "Late" : "Absent"}
              </span>
            </button>
          ))}
        </div>
      </div>
      <DetailPaneMini staff={active} onClear={() => setSelected(active.id)} />
    </div>
  );
}
