/**
 * AttendanceBoard
 * Right-side slide-over "Attendance board · Today" — a read-only cross-class
 * rollup (Claude Design "Students List - Data Grid" Option B). Shared by the
 * students + classes grids. Light + dark via `.sdg-board*` CSS.
 */
import { useEffect } from "react";

const CalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 4v16" />
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

export default function AttendanceBoard({ open, onClose, board, onMarkClass }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !board) return null;
  const { presentTodayPct, presentRollLabel, markedCount, pendingCount, classes = [] } = board;

  return (
    <div className="sdg-board-overlay">
      <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="sdg-board-panel">
        {/* Header */}
        <div className="sdg-board-header">
          <span className="sdg-board-header-icon"><CalIcon /></span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="sdg-board-title">Attendance board · Today</span>
            <span className="sdg-board-sub">Read-only rollup. Marking happens inside each class.</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="sdg-board-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        {/* Rollup KPIs */}
        <div className="sdg-board-kpis">
          <div className="sdg-board-kpi">
            <div className="sdg-board-kpi-label">School present today</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span className="sdg-board-kpi-big" style={{ color: "var(--sdg-board-ok, #2f8f57)" }}>{presentTodayPct}</span>
              <span className="sdg-mono sdg-board-kpi-roll">{presentRollLabel}</span>
            </div>
          </div>
          <div className="sdg-board-kpi" style={{ flex: "none", width: 104 }}>
            <div className="sdg-board-kpi-label">Marked</div>
            <div className="sdg-board-kpi-big sdg-board-kpi-neutral">{markedCount}</div>
          </div>
          <div className="sdg-board-kpi is-pending" style={{ flex: "none", width: 104 }}>
            <div className="sdg-board-kpi-label is-pending">Pending</div>
            <div className="sdg-board-kpi-big is-pending">{pendingCount}</div>
          </div>
        </div>

        {/* Class list */}
        <div className="sdg-board-list sdg-scroll">
          <div className="sdg-board-listhead">
            <div style={{ width: 74 }}>Class</div>
            <div style={{ flex: 1 }}>Teacher</div>
            <div style={{ width: 128 }}>Present</div>
            <div style={{ width: 96, textAlign: "right" }}>Status</div>
          </div>
          {classes.map((c) => (
            <div
              key={c.id}
              className={`sdg-board-row${c.marked ? "" : " is-pending"}`}
              style={{ background: c.rowAccent }}
              onClick={() => { if (!c.marked) onMarkClass?.(c); }}
              role={c.marked ? undefined : "button"}
            >
              <div style={{ width: 74 }}><span className="sdg-board-cls">{c.cls}</span></div>
              <div className="sdg-board-teacher">{c.teacher}</div>
              <div style={{ width: 128, display: "flex", alignItems: "center", gap: 9 }}>
                <span className="sdg-mono sdg-board-pct">{c.pct}</span>
                <span className="sdg-board-track"><span className="sdg-board-fill" style={{ width: c.pctW, background: c.barTone }} /></span>
              </div>
              <div style={{ width: 96, textAlign: "right" }}>
                <span className="sdg-board-status" style={{ background: c.statusBg, color: c.statusFg }}>
                  <span className="sdg-board-status-dot" style={{ background: c.statusDot }} />{c.statusLabel}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sdg-board-footer">
          <span className="sdg-board-footnote">Click a pending class to jump into marking.</span>
          <div style={{ flex: 1 }} />
          <button className="sdg-board-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
