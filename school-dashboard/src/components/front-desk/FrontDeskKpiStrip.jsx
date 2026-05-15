// Phase 9 / REVAMP-29 — Front Desk KPI strip (6 cells, dp-metric pattern).
// Clicking a cell filters activity by that type (deep-linked via URL).

import { Users, DoorOpen, Calendar, GraduationCap, MessageSquare, Phone } from "lucide-react";
import { ACTIVITY_TYPES } from "../../hooks/useFrontDeskData";

function KpiCell({ icon: Icon, label, value, sub, valueTone, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`fd-kpi__cell${isActive ? " is-active" : ""}`}
      aria-pressed={isActive}
      onClick={onClick}
    >
      <div className="row gap-2" style={{ alignItems: "center" }}>
        <Icon size={14} aria-hidden style={{ color: "var(--fg-subtle)" }} />
        <span className="fd-kpi__label">{label}</span>
      </div>
      <span
        className={`fd-kpi__value mono tnum${valueTone ? ` fd-kpi__value--${valueTone}` : ""}`}
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
        label="Appointments today"
        value={k.appointmentsToday ?? 0}
        sub={`${k.appointmentsCount ?? 0} scheduled total`}
        isActive={activeType === ACTIVITY_TYPES.APPOINTMENT}
        onClick={() => toggle(ACTIVITY_TYPES.APPOINTMENT)}
      />
      <KpiCell
        icon={GraduationCap}
        label="Admissions today"
        value={k.admissionsToday ?? 0}
        sub={`${k.admissionsPending ?? 0} pending review`}
        valueTone={(k.admissionsPending ?? 0) > 0 ? "warn" : undefined}
        isActive={activeType === ACTIVITY_TYPES.ADMISSION}
        onClick={() => toggle(ACTIVITY_TYPES.ADMISSION)}
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
        label="Calls today"
        value={k.callsToday ?? 0}
        sub={`${k.callsCount ?? 0} logged total`}
        isActive={activeType === ACTIVITY_TYPES.CALL}
        onClick={() => toggle(ACTIVITY_TYPES.CALL)}
      />
    </div>
  );
}
