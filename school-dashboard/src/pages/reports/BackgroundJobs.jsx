import { useState, useEffect } from 'react';
import { Button, Chip } from '@heroui/react';
import {
  RefreshCw, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle,
  Trash2,
} from 'lucide-react';
import { jobsApi } from '../../services/api';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  queued: { label: 'Queued', color: 'default', icon: Clock },
  running: { label: 'Running', color: 'primary', icon: Loader2 },
  completed: { label: 'Completed', color: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'danger', icon: XCircle },
  rolled_back: { label: 'Rolled Back', color: 'warning', icon: AlertTriangle },
  scheduled: { label: 'Scheduled', color: 'default', icon: Clock },
};

export default function BackgroundJobs() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState({ importJobs: [], systemJobs: [] });
  const [cancelling, setCancelling] = useState(null);

  const loadData = async () => {
    try {
      const [statsData, jobsData] = await Promise.all([
        jobsApi.stats(),
        jobsApi.list(),
      ]);
      setStats(statsData);
      setJobs(jobsData);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (jobId) => {
    setCancelling(jobId);
    try {
      await jobsApi.cancelJob(jobId);
      toast.success('Job cancelled');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel job');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <TablePageSkeleton title searchBar={false} kpiCards={4} rows={6} />;

  const importStats = stats?.importJobs || {};
  const systemStats = stats?.systemJobs || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Background Jobs</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Track import jobs and system tasks</p>
        </div>
        <Button
          size="sm"
          variant="flat"
          startContent={<RefreshCw size={14} />}
          onPress={() => { setLoading(true); loadData(); }}
        >
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Queued', value: importStats.queued || 0, color: 'text-gray-600 dark:text-zinc-400' },
          { label: 'Running', value: importStats.running || 0, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Completed', value: importStats.completed || 0, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Failed', value: importStats.failed || 0, color: 'text-rose-600 dark:text-rose-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 p-4">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Import Jobs Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Import Jobs</h3>
        </div>
        {jobs.importJobs?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Rows</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Initiated By</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Created</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {jobs.importJobs.map((job) => {
                  const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
                  return (
                    <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-300 capitalize">{job.type}</td>
                      <td className="px-4 py-3">
                        <Chip size="sm" color={sc.color} variant="flat" startContent={<sc.icon size={12} className={job.status === 'running' ? 'animate-spin' : ''} />}>
                          {sc.label}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                        {job.totalRows != null ? `${job.processedRows || 0}/${job.totalRows}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{job.initiatedBy?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(job.createdAt).toLocaleDateString()} {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {['queued', 'running'].includes(job.status) && (
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            isLoading={cancelling === job._id}
                            onPress={() => handleCancel(job._id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-zinc-400">No import jobs found</p>
          </div>
        )}
      </div>

      {/* System Jobs */}
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">System Jobs</h3>
          <span className="text-xs text-gray-500 dark:text-zinc-400">{systemStats.total || 0} total</span>
        </div>
        {jobs.systemJobs?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Last Run</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">Next Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {jobs.systemJobs.map((job) => {
                  const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.scheduled;
                  return (
                    <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900">
                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{job.name}</td>
                      <td className="px-4 py-3">
                        <Chip size="sm" color={sc.color} variant="flat">{sc.label}</Chip>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                        {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                        {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-zinc-400">No system jobs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
