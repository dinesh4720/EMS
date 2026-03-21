import { useEffect, useState } from 'react';
import { BarChart3, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { superAdminApi } from '../../services/api';

const RISK_BG = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const TREND_ICON = {
  improving: <TrendingUp size={14} className="text-emerald-500" />,
  declining: <TrendingDown size={14} className="text-red-500" />,
  stable: <Minus size={14} className="text-gray-400 dark:text-zinc-500" />,
};

function FunnelBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-zinc-100">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-700">
        <div
          className="h-2 rounded-full bg-sky-500 transition-all dark:bg-sky-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function GrowthAnalyticsPanel() {
  const [report, setReport] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [growthData, funnelData] = await Promise.all([
        superAdminApi.getGrowthAnalytics(),
        superAdminApi.getGrowthFunnel(),
      ]);
      setReport(growthData);
      setFunnel(funnelData);
    } catch (err) {
      setError(err.message || 'Failed to load growth analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const schools = report?.schools || [];
  const funnelSteps = funnel?.funnel || [];
  const maxFunnel = funnelSteps.length > 0 ? Math.max(...funnelSteps.map((s) => s.count)) : 0;

  return (
    <div className="space-y-5">
      {/* Funnel card */}
      <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-sky-600 dark:text-sky-400" />
          <h2 className="text-lg font-semibold text-slate-950 dark:text-zinc-100">Feature Activation Funnel</h2>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
            Loading funnel...
          </div>
        ) : funnelSteps.length > 0 ? (
          <div className="space-y-3">
            {funnelSteps.map((step) => (
              <FunnelBar key={step.feature} label={step.feature} value={step.count} max={maxFunnel} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">No funnel data available.</div>
        )}
      </div>

      {/* Schools growth table */}
      <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-zinc-100">School Growth Scores</h2>
          <button
            type="button"
            onClick={load}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
            Loading growth data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="pb-3 font-medium">School</th>
                  <th className="pb-3 font-medium">Health Score</th>
                  <th className="pb-3 font-medium">Churn Risk</th>
                  <th className="pb-3 font-medium">Trend</th>
                  <th className="pb-3 font-medium">DAU (7d)</th>
                  <th className="pb-3 font-medium">Features Used</th>
                  <th className="pb-3 font-medium">Activated</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school.schoolId} className="border-b border-gray-100 dark:border-zinc-800">
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-zinc-100">
                      {school.schoolName || school.schoolId}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-gray-900 dark:text-zinc-100">
                        {school.healthScore ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RISK_BG[school.churnRisk] || 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                        {school.churnRisk || '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1">
                        {TREND_ICON[school.trend] || TREND_ICON.stable}
                        <span className="text-xs capitalize text-gray-600 dark:text-zinc-400">{school.trend || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-zinc-300">{school.dauLast7d ?? '—'}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-zinc-300">{school.featuresUsedCount ?? '—'}</td>
                    <td className="py-3 pr-4">
                      {school.isFullyActivated ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Yes</span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {schools.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No growth data available.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
