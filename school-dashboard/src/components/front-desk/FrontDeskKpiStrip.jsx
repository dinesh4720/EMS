// Phase 9 — Front Desk KPI strip (5 cells).
// Click a cell → filter activity by that type.

import { Users, DoorOpen, Calendar, MessageSquare, Phone } from "lucide-react";
import { ACTIVITY_TYPES } from "../../hooks/useFrontDeskData";

function KpiCell({ icon: Icon, label, value, sub, valueTone, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`fd-kpi__cell${isActive ? " is-active" : ""}`}
      onClick={onClick}
    >
      <div className="row gap-2" style={{ alignItems: "center" }}>
        <Icon size={14} aria-hidden style={{ color: "var(--fg-subtle)" }} />
        <span className="fd-kpi__label">{label}</span>
      </div>
      <span
        className={`fd-kpi__value${valueTone ? ` fd-kpi__value--${valueTone}` : ""}`}
      >
        {value}
      </span>
      {sub && <span className="fd-kpi__sub">{sub}</span>}
    </button>
  );
}

export default function FrontDeskKpiStrip({ kpis, activeType = "all", onTypeChange }) {
  const k = kpis || {};
  const toggle = (next) => onTypeChange?.(activeType === next ? "all" : next);
  return (
    <div className="fd-kpi" role="group" aria-label="Front desk overview">
      <KpiCell
        icon={Users}
        label="Visitors today"
        value={k.visitorsToday ?? 0}
        sub={`${k.visitorsCheckedIn ?? 0} still on premises`}
        isActive={activeType === ACTIVITY_TYPES.VISITOR}
        onClick={() => toggle(ACTIVITY_TYPES.VISITOR)}
      />
      <KpiCell
        icon={DoorOpen}
        label="Gate passes"
        value={k.gatePassesToday ?? 0}
        sub={`${k.gatePassesPending ?? 0} pending approval`}
        valueTone={(k.gatePassesPending ?? 0) > 0 ? "warn" : undefined}
        isActive={activeType === ACTIVITY_TYPES.GATE_PASS}
        onClick={() => toggle(ACTIVITY_TYPES.GATE_PASS)}
      />
      <KpiCell
        icon={Calendar}
        label="Appointments"
        value={k.appointmentsCount ?? 0}
        sub="scheduled"
        isActive={activeType === ACTIVITY_TYPES.APPOINTMENT}
        onClick={() => toggle(ACTIVITY_TYPES.APPOINTMENT)}
      />
      <KpiCell
        icon={MessageSquare}
        label="Open feedback"
        value={k.feedbacksOpen ?? 0}
        sub="awaiting response"
        valueTone={(k.feedbacksOpen ?? 0) > 0 ? "warn" : undefined}
        isActive={activeType === ACTIVITY_TYPES.FEEDBACK}
        onClick={() => toggle(ACTIVITY_TYPES.FEEDBACK)}
      />
      <KpiCell
        icon={Phone}
        label="Call logs"
        value={k.callsCount ?? 0}
        sub="recorded"
        isActive={activeType === ACTIVITY_TYPES.CALL}
        onClick={() => toggle(ACTIVITY_TYPES.CALL)}
      />
    </div>
  );
}
