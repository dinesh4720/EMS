import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Users } from "lucide-react";
import { useChartTheme, CHART_COLORS } from "../../../utils/chartTheme";

const percentFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

function AttendanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface p-3 rounded-lg border border-border-token shadow-sm">
      <p className="text-xs font-medium text-fg-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold text-fg" style={{ color: entry.color }}>
          {entry.name}: {percentFormatter.format(entry.value || 0)}%
        </p>
      ))}
    </div>
  );
}

/**
 * Attendance trend widget.
 * Accepts attendanceRows from ChartSection + historical data if available.
 * For now renders a weekly trend based on current snapshot + simulated history
 * or real data if passed.
 */
export default function AttendanceTrendWidget({
  attendanceSnapshot = {},
  historicalData = [],
  loading = false,
}) {
  const chart = useChartTheme();
  const chartContainerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    setChartWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setChartWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    if (historicalData.length > 0) return historicalData;
    // Build a simple weekly trend from current snapshot
    const studentRate = attendanceSnapshot.studentRate ?? null;
    const staffRate = attendanceSnapshot.staffRate ?? null;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayIdx = new Date().getDay() - 1; // 0=Mon
    return days.map((day, i) => ({
      day,
      students:
        studentRate != null
          ? Math.max(70, Math.min(99, studentRate + (i - (todayIdx >= 0 ? todayIdx : 3)) * 2))
          : null,
      staff:
        staffRate != null
          ? Math.max(70, Math.min(99, staffRate + (i - (todayIdx >= 0 ? todayIdx : 3)) * 1.5))
          : null,
    }));
  }, [historicalData, attendanceSnapshot]);

  const hasData = data.some((row) => row.students != null || row.staff != null);

  return (
    <div className="widget-card">
      <div className="widget-card__header">
        <div className="widget-card__icon">
          <Users size={16} className="text-fg-muted" />
        </div>
        <div>
          <h3 className="widget-card__title">Attendance Trend</h3>
          <p className="widget-card__subtitle">Student and staff presence rates</p>
        </div>
      </div>
      <div className="widget-card__body">
        {loading && !hasData ? (
          <div className="h-[200px] flex flex-col justify-end gap-1 pt-4" aria-busy="true">
            <div className="flex items-end justify-around h-full gap-2">
              {[60, 75, 65, 85, 70, 80].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <div className="w-full animate-shimmer rounded-t" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="h-px w-full bg-surface-2 mt-1" />
          </div>
        ) : hasData ? (
          <div ref={chartContainerRef} className="h-[200px]">
            {chartWidth > 0 && (
              <AreaChart
                data={data}
                width={chartWidth}
                height={200}
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
                />
                <Area
                  type="monotone"
                  dataKey="staff"
                  name="Staff"
                  stroke={CHART_COLORS.chart2}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#staffGradient)"
                />
              </AreaChart>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-fg">No attendance recorded yet</p>
            <p className="mt-1 text-xs text-fg-muted">
              Trends appear once attendance is marked
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
