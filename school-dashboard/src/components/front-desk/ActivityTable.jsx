import {
  Users, DoorOpen, Calendar, GraduationCap, MessageSquare, Phone, ChevronRight,
} from "lucide-react";
import { ACTIVITY_TYPES } from "../../hooks/useFrontDeskData";

const ICON_BY_TYPE = {
  [ACTIVITY_TYPES.VISITOR]: Users,
  [ACTIVITY_TYPES.GATE_PASS]: DoorOpen,
  [ACTIVITY_TYPES.APPOINTMENT]: Calendar,
  [ACTIVITY_TYPES.FEEDBACK]: MessageSquare,
  [ACTIVITY_TYPES.CALL]: Phone,
  [ACTIVITY_TYPES.ADMISSION]: GraduationCap,
};

const LABEL_BY_TYPE = {
  [ACTIVITY_TYPES.VISITOR]: "Visitor",
  [ACTIVITY_TYPES.GATE_PASS]: "Gate pass",
  [ACTIVITY_TYPES.APPOINTMENT]: "Appointment",
  [ACTIVITY_TYPES.FEEDBACK]: "Feedback",
  [ACTIVITY_TYPES.CALL]: "Call",
  [ACTIVITY_TYPES.ADMISSION]: "Admission",
};

function StatusPill({ status }) {
  const tone =
    status === "in" || status === "pending"
      ? "warn"
      : status === "approved" || status === "checked-out" || status === "resolved"
      ? "ok"
      : status === "rejected"
      ? "danger"
      : "info";
  return (
    <span className={`status status--${tone}`}>
      <span className="dot" aria-hidden />
      {status}
    </span>
  );
}

function fmtTime(t) {
  if (!t) return "—";
  const d = new Date(t);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Phase 9 — unified activity rows from all 5 front-desk surfaces.
// Owned filter state lives in the parent (FrontDeskPage).
export default function ActivityTable({ rows = [], onRowClick }) {
  if (rows.length === 0) {
    return (
      <div className="fd-table">
        <div className="fd-table__empty">No activity matches this filter.</div>
      </div>
    );
  }
  return (
    <div className="fd-table" role="table">
      <div className="fd-table__head" role="row">
        <span>Type</span>
        <span>Person</span>
        <span>Detail</span>
        <span>Time</span>
        <span>Status</span>
        <span className="fd-table__action">Action</span>
      </div>
      {rows.map((r) => {
        const Icon = ICON_BY_TYPE[r.type] || Users;
        return (
          <div
            key={`${r.type}:${r.id}`}
            role="row"
            className="fd-table__row"
            onClick={() => onRowClick?.(r)}
            style={{ cursor: onRowClick ? "pointer" : "default" }}
          >
            <span className="row gap-2" style={{ alignItems: "center" }}>
              <Icon size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {LABEL_BY_TYPE[r.type] || r.type}
              </span>
            </span>
            <span>
              <div className="fd-table__name">{r.name}</div>
            </span>
            <span className="fd-table__sub">{r.sub || "—"}</span>
            <span className="mono tnum" style={{ fontSize: 12, color: "var(--fg-muted)" }}>
              {fmtTime(r.time)}
            </span>
            <span><StatusPill status={r.status} /></span>
            <span className="fd-table__action">
              <ChevronRight size={14} style={{ color: "var(--fg-faint)" }} aria-hidden />
            </span>
          </div>
        );
      })}
    </div>
  );
}
