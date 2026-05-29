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
import ChartCard from "../../ui/ChartCard";

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
    <ChartCard
      title="Enrollment stats"
      description={hasData ? `${total} total students` : "Students by class"}
      icon={<GraduationCap size={16} />}
      height={200}
      isLoading={loading && !hasData}
      isEmpty={!loading && !hasData}
      emptyTitle="No enrollment data"
      emptyDescription="Stats appear once students are assigned to classes"
      variant="widget"
    >
      <ResponsiveContainer width="100%" height={200}>
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
    </ChartCard>
  );
}
