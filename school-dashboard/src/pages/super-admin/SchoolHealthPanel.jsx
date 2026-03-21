import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { superAdminApi } from '../../services/api';

const RISK_COLORS = {
  low: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-red-600 dark:text-red-400',
};

const TREND_ICON = {
  improving: <TrendingUp size={14} className="text-emerald-500" />,
  declining: <TrendingDown size={14} className="text-red-500" />,
  stable: <Minus size={14} className="text-gray-400 dark:text-zinc-500" />,
};

function HealthBar({ score }) {
  if (score == null) return <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>;
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-zinc-700">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">{pct}</span>
    </div>
  );
}

export default function SchoolHealthPanel() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await superAdminApi.getSchoolHealth();
      setSchools(data.schools || []);
    } catch (err) {
      setError(err.message || 'Failed to load school health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">School Health Monitor</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Health scores, churn risk, and activity across all schools.
          </p>
        </div>
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
          Loading school health data...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="pb-3 font-medium">School</th>
                <th className="pb-3 font-medium">Health</th>
                <th className="pb-3 font-medium">Churn Risk</th>
                <th className="pb-3 font-medium">Trend</th>
                <th className="pb-3 font-medium">Students</th>
                <th className="pb-3 font-medium">Staff</th>
                <th className="pb-3 font-medium">Rate Limits</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.schoolId} className="border-b border-gray-100 align-top dark:border-zinc-800">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-gray-900 dark:text-zinc-100">{school.name}</div>
                    <div className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
                      {school.plan} · {school.status}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <HealthBar score={school.healthScore} />
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-medium capitalize ${RISK_COLORS[school.churnRisk] || 'text-gray-400 dark:text-zinc-500'}`}>
                      {school.churnRisk || '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      {TREND_ICON[school.trend] || TREND_ICON.stable}
                      <span className="text-xs capitalize text-gray-600 dark:text-zinc-400">{school.trend || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-700 dark:text-zinc-300">{school.studentsCount}</td>
                  <td className="py-3 pr-4 text-gray-700 dark:text-zinc-300">{school.staffCount}</td>
                  <td className="py-3 pr-4">
                    {school.rateLimitViolations > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={12} /> {school.rateLimitViolations}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-zinc-500">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schools.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No schools found.</div>
          )}
        </div>
      )}
    </div>
  );
}
