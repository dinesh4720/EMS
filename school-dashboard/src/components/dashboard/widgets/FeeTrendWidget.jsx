import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useChartTheme, CHART_COLORS } from "../../../utils/chartTheme";
import ChartCard from "../../ui/ChartCard";

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

  return (
    <ChartCard
      title="Fee collection trend"
      description="Monthly receipts over last 6 months"
      icon={<TrendingUp size={16} />}
      height={200}
      isLoading={loading && !hasData}
      isEmpty={!loading && !hasData}
      emptyTitle="No fee data yet"
      emptyDescription="Collection trends appear once receipts are posted"
      variant="widget"
    >
      <ResponsiveContainer width="100%" height={200} role="img" aria-label="Fee collection trend chart showing monthly receipts over last 6 months">
        <AreaChart
          data={data}
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
      </ResponsiveContainer>
    </ChartCard>
  );
}
