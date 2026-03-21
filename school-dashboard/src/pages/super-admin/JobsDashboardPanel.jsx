import { useEffect, useState } from 'react';
import { Activity, AlertCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { superAdminApi } from '../../services/api';
import JobsTable from './jobs/JobsTable';
import { formatDuration } from './jobs/jobsUtils';

const STATUS_FILTERS = ['all', 'running', 'scheduled', 'failed', 'completed'];

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={16} />
      </div>
      <div className="text-xs text-gray-500 dark:text-zinc-400">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold text-gray-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}

export default function JobsDashboardPanel() {
  const [metrics, setMetrics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [retrying, setRetrying] = useState({});
  const [cancelling, setCancelling] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsData, jobsData] = await Promise.all([
        superAdminApi.getJobsMetrics(),
        superAdminApi.getJobs(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ]);
      setMetrics(metricsData);
      setJobs(jobsData.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleRetry = async (jobId) => {
    setRetrying((prev) => ({ ...prev, [jobId]: true }));
    try {
      await superAdminApi.retryJob(jobId);
      await load();
    } catch (err) {
      setError(err.message || 'Retry failed');
    } finally {
      setRetrying((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleCancel = async (jobId) => {
    setCancelling((prev) => ({ ...prev, [jobId]: true }));
    try {
      await superAdminApi.cancelJob(jobId);
      await load();
    } catch (err) {
      setError(err.message || 'Cancel failed');
    } finally {
      setCancelling((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  return (
    <div className="space-y-5">
      {metrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Activity} label="Total jobs" value={metrics.total} accent="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" />
          <MetricCard icon={Loader2} label="Running" value={metrics.running} accent="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" />
          <MetricCard icon={AlertCircle} label="Failed" value={metrics.failed} accent="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" />
          <MetricCard icon={Clock} label="Avg execution" value={formatDuration(metrics.avgExecutionMs)} accent="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" />
        </div>
      )}

      <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">Background Jobs</h2>
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition ${
                  statusFilter === s
                    ? 'bg-slate-950 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
            Loading jobs...
          </div>
        ) : (
          <JobsTable
            jobs={jobs}
            onRetry={handleRetry}
            onCancel={handleCancel}
            retrying={retrying}
            cancelling={cancelling}
          />
        )}
      </div>
    </div>
  );
}
