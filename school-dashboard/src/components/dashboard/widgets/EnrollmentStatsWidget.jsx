import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { GraduationCap } from "lucide-react";
import { useChartTheme, CHART_COLORS } from "../../../utils/chartTheme";

const compactNumber = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function EnrollmentTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface p-3 rounded-lg border border-border-token shadow-sm">
      <p className="text-xs font-medium text-fg-muted mb-1">{label}</p>
      <p className="text-sm font-semibold text-fg">
        {payload[0].value} students
      </p>
    </div>
  );
}

export default function EnrollmentStatsWidget({ students = [], classes = [], loading = false }) {
  const chart = useChartTheme();

  const data = useMemo(() => {
    const activeStudents = (students || []).filter((s) => (s.status || "active") === "active");
    const classMap = new Map((classes || []).map((c) => [String(c.id), c.name || c.className || ""]));
    const counts = {};
    activeStudents.forEach((s) => {
      const classId = String(s.classId || "");
      const name = classMap.get(classId) || s.className || s.class || "Unassigned";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [students, classes]);

  const hasData = data.length > 0;
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data]
  );

  const colors = [
    CHART_COLORS.chart1,
    CHART_COLORS.chart2,
    CHART_COLORS.chart3,
    CHART_COLORS.chart4,
    CHART_COLORS.chart5,
    CHART_COLORS.ok,
    CHART_COLORS.warn,
    CHART_COLORS.info,
  ];

  return (
    <div className="widget-card">
      <div className="widget-card__header">
        <div className="widget-card__icon">
          <GraduationCap size={16} className="text-fg-muted" />
        </div>
        <div>
          <h3 className="widget-card__title">Enrollment stats</h3>
          <p className="widget-card__subtitle">
            {hasData ? `${total} total students` : "Students by class"}
          </p>
        </div>
      </div>
      <div className="widget-card__body">
        {loading && !hasData ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 animate-shimmer rounded" />
                  <div className="h-3 w-8 animate-shimmer rounded" />
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full animate-shimmer" style={{ width: `${40 + i * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : hasData ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chart.tick, fontSize: 10 }}
                  dy={10}
                  interval={0}
                  angle={data.length > 5 ? -30 : 0}
                  textAnchor={data.length > 5 ? "end" : "middle"}
                  height={data.length > 5 ? 50 : 30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  tickFormatter={(value) => compactNumber.format(value)}
                />
                <Tooltip content={<EnrollmentTooltip />} />
                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} barSize={22}>
                  {data.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-fg">No enrollment data</p>
            <p className="mt-1 text-xs text-fg-muted">
              Stats appear once students are assigned to classes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
