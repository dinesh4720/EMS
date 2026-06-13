import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertCircle, Clock, Loader2, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Chip,
  ErrorState,
  SkeletonTable,
  StatCard,
} from '../../components/ui';
import { superAdminApi } from '../../services/api';
import JobsTable from './jobs/JobsTable';
import { formatDuration } from './jobs/jobsUtils';

const STATUS_FILTERS = ['all', 'running', 'scheduled', 'failed', 'completed'];

export default function JobsDashboardPanel() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [retrying, setRetrying] = useState({});
  const [cancelling, setCancelling] = useState({});

  const load = useCallback(async () => {
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
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          color="blue"
          label={t('pages.totalJobs')}
          value={metrics?.total ?? 0}
          isLoading={loading && !metrics}
        />
        <StatCard
          icon={Loader2}
          color="primary"
          label={t('pages.running')}
          value={metrics?.running ?? 0}
          isLoading={loading && !metrics}
        />
        <StatCard
          icon={AlertCircle}
          color="danger"
          label={t('pages.failed')}
          value={metrics?.failed ?? 0}
          isLoading={loading && !metrics}
        />
        <StatCard
          icon={Clock}
          color="violet"
          label={t('pages.avgExecution')}
          value={formatDuration(metrics?.avgExecutionMs)}
          isLoading={loading && !metrics}
        />
      </div>

      <Card padding="md" radius="lg">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
            <Wrench size={16} aria-hidden="true" className="text-fg-muted" />
            {t('pages.backgroundJobs')}
          </h2>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('pages.filterJobsByStatus') || 'Filter jobs by status'}>
            {STATUS_FILTERS.map((status) => (
              <Chip
                key={status}
                size="sm"
                color="neutral"
                selected={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
              >
                <span className="capitalize">{status}</span>
              </Chip>
            ))}
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : error ? (
          <ErrorState error={error} onRetry={load} />
        ) : (
          <JobsTable
            jobs={jobs}
            onRetry={handleRetry}
            onCancel={handleCancel}
            retrying={retrying}
            cancelling={cancelling}
          />
        )}
      </Card>
    </div>
  );
}
