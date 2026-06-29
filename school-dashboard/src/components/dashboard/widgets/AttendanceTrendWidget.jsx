import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users } from "lucide-react";
import { useChartTheme, CHART_COLORS } from "../../../utils/chartTheme";
import ChartCard from "../../ui/ChartCard";
import { useChartAnimation } from "../../../hooks/useChartAnimation";

const percentFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

function AttendanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface p-3 rounded-lg border border-border-token shadow-sm">
      <p className="text-xs font-medium text-fg-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={entry.dataKey || entry.name || `entry-${i}`} className="text-sm font-semibold text-fg" style={{ color: entry.color }}>
          {entry.name}: {percentFormatter.format(entry.value || 0)}%
        </p>
      ))}
    </div>
  );
}

export default function AttendanceTrendWidget({
  attendanceSnapshot = {},
  historicalData = [],
  loading = false,
}) {
  const chart = useChartTheme();
  const animation = useChartAnimation();

  const data = useMemo(() => {
    if (historicalData.length > 0) return historicalData;
    const studentRate = attendanceSnapshot.studentRate ?? null;
    const staffRate = attendanceSnapshot.staffRate ?? null;
    if (studentRate == null && staffRate == null) return [];
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return [
      {
        day: dayLabels[new Date().getDay()],
        students: studentRate,
        staff: staffRate,
      },
    ];
  }, [historicalData, attendanceSnapshot]);

  const hasData = data.some((row) => row.students != null || row.staff != null);

  return (
    <ChartCard
      title="Attendance trend"
      description="Student and staff presence rates"
      icon={<Users size={16} />}
      height={200}
      isLoading={loading && !hasData}
      isEmpty={!loading && !hasData}
      emptyTitle="No attendance recorded yet"
      emptyDescription="Trends appear once attendance is marked"
      variant="widget"
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.chart1} stopOpacity={0.25} />
              <stop offset="95%" stopColor={CHART_COLORS.chart1} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="staffGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.chart2} stopOpacity={0.25} />
              <stop offset="95%" stopColor={CHART_COLORS.chart2} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chart.tick, fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chart.tick, fontSize: 11 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<AttendanceTooltip />} />
          <Area
            type="monotone"
            dataKey="students"
            name="Students"
            stroke={CHART_COLORS.chart1}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#studentGradient)"
            {...animation}
          />
          <Area
            type="monotone"
            dataKey="staff"
            name="Staff"
            stroke={CHART_COLORS.chart2}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#staffGradient)"
            {...animation}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
