// Phase 7 — Fees KPI strip
// 3 cells: Collected today, Outstanding total, Overdue students.
// Each cell is clickable to set the status filter on the page.
// Active filter highlights its cell.

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function fmtINR(n) {
  return inrFormatter.format(Number.isFinite(n) ? n : 0);
}

export default function FeesKpiStrip({
  kpis = { collectedToday: 0, outstandingTotal: 0, overdueCount: 0 },
  activeFilter = "all",
  onFilterChange,
}) {
  return (
    <div className="fees-kpi" role="group" aria-label="Fees overview">
      <button
        type="button"
        className={`fees-kpi__cell${
          activeFilter === "paid" ? " is-active" : ""
        }`}
        onClick={() => onFilterChange?.(activeFilter === "paid" ? "all" : "paid")}
      >
        <span className="fees-kpi__label">Collected today</span>
        <span className="fees-kpi__value fees-kpi__value--ok">
          {fmtINR(kpis.collectedToday)}
        </span>
        <span className="fees-kpi__sub">across all classes</span>
      </button>

      <button
        type="button"
        className={`fees-kpi__cell${
          activeFilter === "pending" ? " is-active" : ""
        }`}
        onClick={() =>
          onFilterChange?.(activeFilter === "pending" ? "all" : "pending")
        }
      >
        <span className="fees-kpi__label">Outstanding total</span>
        <span className="fees-kpi__value fees-kpi__value--warn">
          {fmtINR(kpis.outstandingTotal)}
        </span>
        <span className="fees-kpi__sub">pending + overdue dues</span>
      </button>

      <button
        type="button"
        className={`fees-kpi__cell${
          activeFilter === "overdue" ? " is-active" : ""
        }`}
        onClick={() =>
          onFilterChange?.(activeFilter === "overdue" ? "all" : "overdue")
        }
      >
        <span className="fees-kpi__label">Overdue · students</span>
        <span className="fees-kpi__value fees-kpi__value--danger tnum">
          {kpis.overdueCount}
        </span>
        <span className="fees-kpi__sub">tap to triage</span>
      </button>
    </div>
  );
}
