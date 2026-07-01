/**
 * AttendanceBar
 * Slim "Today's attendance" strip that sits between the controls bar and the
 * grid body (Claude Design "Students List - Data Grid" refresh). Shared by the
 * students and classes grids. Light + dark via `.sdg-attbar*` CSS.
 */
import { useTheme } from "next-themes";

const CalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function barTone(pct, dark) {
  if (pct >= 90) return dark ? "#4cb87e" : "#3fa46a";
  if (pct >= 75) return dark ? "#e0a948" : "#d6a23e";
  return dark ? "#e0707f" : "#d3686b";
}

export default function AttendanceBar({
  pct = null,
  label = "Today's attendance",
  sub,
  pending = 0,
  pendingLabel,
  onBoard,
  boardLabel = "Attendance board",
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const has = pct != null && Number.isFinite(Number(pct));
  const p = has ? Math.max(0, Math.min(100, Math.round(Number(pct)))) : 0;
  return (
    <div className="sdg-attbar">
      <span className="sdg-attbar-icon"><CalIcon /></span>
      <span className="sdg-attbar-label">{label}</span>
      <span className="sdg-attbar-track">
        <span className="sdg-attbar-fill" style={{ width: `${p}%`, background: barTone(p, dark) }} />
      </span>
      <span className="sdg-attbar-pct">{has ? `${p}%` : "—"}</span>
      {sub ? <span className="sdg-attbar-sub">· {sub}</span> : null}
      {pending > 0 && pendingLabel ? (
        <button type="button" className="sdg-attbar-pending" onClick={onBoard}>
          <span className="sdg-attbar-pending-dot" />{pendingLabel}
        </button>
      ) : null}
      <div style={{ flex: 1 }} />
      {onBoard ? (
        <button type="button" className="sdg-attbar-link" onClick={onBoard}>
          {boardLabel}<ArrowIcon />
        </button>
      ) : null}
    </div>
  );
}
