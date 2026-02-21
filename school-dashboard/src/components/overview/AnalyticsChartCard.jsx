import React from 'react';
import { Card, CardHeader, CardBody } from '@heroui/react';
import {
  LineChart as RechartsLineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

function AnalyticsChartCard({
  icon: Icon,
  iconColor = 'bg-gray-100 text-gray-600',
  title,
  subtitle,
  chartType = 'line',
  data = [],
  dataKey = 'value',
  lineColor = '#6b7280',
  barColor = '#6b7280',
  yAxisDomain = [0, 100],
  tooltipFormatter,
  emptyMessage = 'No data available',
  className = ''
}) {
  const tooltipContentStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
  };

  const defaultFormatter = (value) => [`${value}%`, dataKey.charAt(0).toUpperCase() + dataKey.slice(1)];

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="h-[200px] flex items-center justify-center text-default-400 text-sm">
          {emptyMessage}
        </div>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={yAxisDomain} />
            <RechartsTooltip
              contentStyle={tooltipContentStyle}
              formatter={tooltipFormatter || defaultFormatter}
            />
            <Bar dataKey={dataKey} fill={barColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={200}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={yAxisDomain} />
          <RechartsTooltip
            contentStyle={tooltipContentStyle}
            formatter={tooltipFormatter || defaultFormatter}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card shadow="sm" className={`border border-default-200 ${className}`}>
      <CardHeader className="pb-0 pt-6 px-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconColor}`}>
            <Icon size={20} />
          </div>
          <div>
            <h4 className="text-base font-semibold text-default-900">{title}</h4>
            <p className="text-xs text-default-500">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-6 py-6">
        {renderChart()}
      </CardBody>
    </Card>
  );
}

export default React.memo(AnalyticsChartCard);
