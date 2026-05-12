import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import toast from 'react-hot-toast';
import { reportsApi } from '../../../services/api/extensions';
import ChartCard from '../../../components/ui/ChartCard';
import { cn } from '../../../utils/cn';

const GROUPS = ['day', 'week', 'month'];

export default function AttendanceTrendChart({ startDate, endDate, classId }) {
  const [groupBy, setGroupBy] = useState('day');
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!startDate || !endDate) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { startDate, endDate, groupBy };
        if (classId) params.classId = classId;
        const data = await reportsApi.attendanceTrend(params);
        if (!cancelled) setTrendData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load attendance trend:', err);
        if (!cancelled) {
          setTrendData([]);
          setError(err);
          toast.error('Failed to load attendance trend');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, classId, groupBy]);

  const groupSelector = (
    <div role="tablist" aria-label="Group attendance trend by" className="flex gap-1">
      {GROUPS.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={groupBy === option}
          onClick={() => setGroupBy(option)}
          disabled={loading}
          className={cn(
            'px-3 py-1 text-xs rounded-md capitalize transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            groupBy === option
              ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)] font-medium'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Attendance Trend"
      description="School-wide attendance rate over time"
      actions={groupSelector}
      height={208}
      isLoading={loading}
      isEmpty={!loading && !error && trendData.length === 0}
      emptyTitle="No attendance data"
      emptyDescription="No data available for this date range."
      error={error}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            className="text-[var(--color-text-muted)]"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            className="text-[var(--color-text-muted)]"
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Attendance Rate']}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
            }}
          />
          <ReferenceLine
            y={75}
            stroke="var(--color-error)"
            strokeDasharray="4 4"
            label={{
              value: '75%',
              position: 'right',
              fontSize: 11,
              fill: 'var(--color-error)',
            }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={trendData.length <= 31}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
