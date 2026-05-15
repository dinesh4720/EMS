import { CalendarRange, BarChart3, FileCheck2 } from "lucide-react";

export default function AcademicsKpiStrip({ kpis = {} }) {
  const avgLabel =
    kpis.averagePerformance != null
      ? `${Math.round(kpis.averagePerformance)}%`
      : "—";
  return (
    <div className="academics-kpi" role="group" aria-label="Academics overview">
      <div className="academics-kpi__cell">
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <CalendarRange size={14} style={{ color: "var(--fg-subtle)" }} aria-hidden />
          <span className="academics-kpi__label">Upcoming exams</span>
        </div>
        <span className="academics-kpi__value">{kpis.upcomingCount ?? 0}</span>
        <span className="academics-kpi__sub">scheduled + ongoing</span>
      </div>

      <div className="academics-kpi__cell">
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <BarChart3 size={14} style={{ color: "var(--fg-subtle)" }} aria-hidden />
          <span className="academics-kpi__label">Avg performance</span>
        </div>
        <span className="academics-kpi__value">{avgLabel}</span>
        <span className="academics-kpi__sub">across published exams</span>
      </div>

      <div className="academics-kpi__cell">
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <FileCheck2 size={14} style={{ color: "var(--fg-subtle)" }} aria-hidden />
          <span className="academics-kpi__label">Results published</span>
        </div>
        <span className="academics-kpi__value academics-kpi__value--ok">
          {kpis.publishedCount ?? 0}
        </span>
        <span className="academics-kpi__sub">of {kpis.totalCount ?? 0} this year</span>
      </div>
    </div>
  );
}
