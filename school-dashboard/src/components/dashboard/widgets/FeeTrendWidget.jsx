import React, { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useChartTheme, CHART_COLORS } from "../../../utils/chartTheme";
import Skeleton from "../../ui/Skeleton";

const compactNumber = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function FeeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface p-3 rounded-lg border border-border-token shadow-sm">
      <p className="text-xs font-medium text-fg-muted mb-1">{label}</p>
      <p className="text-sm font-semibold text-fg">
        {currencyFormatter.format(payload[0].value || 0)}
      </p>
    </div>
  );
}

export default function FeeTrendWidget({ data = [], loading = false }) {
  const chart = useChartTheme();
  const hasData = data.some((row) => row.collected > 0);
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

  return (
    <div className="widget-card">
      <div className="widget-card__header">
        <div className="widget-card__icon">
          <TrendingUp size={16} className="text-fg-muted" />
        </div>
        <div>
          <h3 className="widget-card__title">Fee Collection Trend</h3>
          <p className="widget-card__subtitle">Monthly receipts over last 6 months</p>
        </div>
      </div>
      <div className="widget-card__body">
        {loading && !hasData ? (
          <div className="h-[200px] flex flex-col justify-end gap-1 pt-4" aria-busy="true">
            <div className="flex items-end justify-around h-full gap-2">
              {[45, 70, 55, 80, 60, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <div className="w-full animate-shimmer rounded-t" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="h-px w-full bg-surface-2 mt-1" />
            <div className="flex justify-around mt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-2.5 w-6 animate-shimmer rounded" />
              ))}
            </div>
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
                  <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.chart3} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.chart3} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  tickFormatter={(value) => compactNumber.format(value)}
                />
                <Tooltip content={<FeeTooltip />} />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke={CHART_COLORS.chart3}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#feeGradient)"
                />
              </AreaChart>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-fg">No fee data yet</p>
            <p className="mt-1 text-xs text-fg-muted">
              Collection trends appear once receipts are posted
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
