import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import IconButton from '../../components/ui/IconButton';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import { SkeletonTable } from '../../components/ui/Skeleton';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { jobsApi } from '../../services/api/extensions';
import JobStatusBadge from './JobStatusBadge';
import { formatDate } from './_helpers';

function StatTile({ label, value, tone }) {
  const TONE = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <Card padding="sm" radius="lg">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className={`text-2xl font-bold ${TONE[tone]}`}>{value}</p>
    </Card>
  );
}

function ImportJobsTable({ loading, jobs, onView, onCancel }) {
  if (loading) return <SkeletonTable rows={4} columns={6} />;
  if (jobs.length === 0) {
    return (
      <Card padding="none" radius="lg">
        <EmptyState title="No import jobs" description="Imports you run will appear here." />
      </Card>
    );
  }

  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Import jobs">
          <thead>
            <tr className="border-b border-divider text-left text-xs text-fg-muted uppercase">
              <th scope="col" className="px-4 py-3 font-medium">File</th>
              <th scope="col" className="px-4 py-3 font-medium">Type</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Rows</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
              <th scope="col" className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job._id}
                className="border-b border-divider last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium text-fg">{job.fileName}</td>
                <td className="px-4 py-3 capitalize text-fg-muted">{job.type}</td>
                <td className="px-4 py-3">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {job.processedRows}/{job.totalRows}
                </td>
                <td className="px-4 py-3 text-fg-muted">{formatDate(job.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={<Eye size={14} />}
                      aria-label="View details"
                      size="sm"
                      onClick={() => onView(job._id)}
                    />
                    {(job.status === 'queued' || job.status === 'running') && (
                      <IconButton
                        icon={<Trash2 size={14} />}
                        aria-label="Cancel job"
                        size="sm"
                        variant="danger"
                        onClick={() => onCancel(job._id)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SystemJobsTable({ loading, jobs }) {
  if (loading) return <SkeletonTable rows={4} columns={5} />;
  if (jobs.length === 0) {
    return (
      <Card padding="none" radius="lg">
        <EmptyState title="No system jobs" description="Scheduled background jobs will appear here." />
      </Card>
    );
  }

  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="System jobs">
          <thead>
            <tr className="border-b border-divider text-left text-xs text-fg-muted uppercase">
              <th scope="col" className="px-4 py-3 font-medium">Name</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Next Run</th>
              <th scope="col" className="px-4 py-3 font-medium">Last Run</th>
              <th scope="col" className="px-4 py-3 font-medium">Interval</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job._id}
                className="border-b border-divider last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium text-fg">{job.name}</td>
                <td className="px-4 py-3">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 text-fg-muted">{formatDate(job.nextRunAt)}</td>
                <td className="px-4 py-3 text-fg-muted">{formatDate(job.lastRunAt)}</td>
                <td className="px-4 py-3 text-fg-muted">{job.repeatInterval || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function JobDetailModal({ isOpen, onClose, loading, job }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Job Details"
      size="lg"
      footer={(close) => (
        <Button variant="ghost" onClick={close}>
          Close
        </Button>
      )}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-5 bg-surface-2 rounded w-3/4 animate-pulse" />
          <div className="h-5 bg-surface-2 rounded w-2/3 animate-pulse" />
          <div className="h-5 bg-surface-2 rounded w-1/2 animate-pulse" />
          <div className="h-5 bg-surface-2 rounded w-3/5 animate-pulse" />
        </div>
      ) : job ? (
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-fg-muted">Type: </span>
            <span className="capitalize text-fg">{job.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-fg-muted">Status: </span>
            <JobStatusBadge status={job.status} />
          </div>
          <div>
            <span className="font-medium text-fg-muted">File: </span>
            <span className="text-fg">{job.fileName}</span>
          </div>
          <div>
            <span className="font-medium text-fg-muted">Initiated by: </span>
            <span className="text-fg">{job.initiatedBy?.name || '-'}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-divider">
            <div>
              <p className="text-xs text-fg-muted">Total Rows</p>
              <p className="font-semibold text-fg">{job.totalRows}</p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">Processed</p>
              <p className="font-semibold text-fg">{job.processedRows}</p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">Imported</p>
              <p className="font-semibold text-green-600 dark:text-green-400">{job.importedCount}</p>
            </div>
          </div>
          {job.errorMessage && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/40 rounded-lg text-red-700 dark:text-red-400 text-xs">
              {job.errorMessage}
            </div>
          )}
        </div>
      ) : (
        <EmptyState title="Job not found" />
      )}
    </Modal>
  );
}

export default function BackgroundJobs() {
  const [stats, setStats] = useState(null);
  const [importJobs, setImportJobs] = useState([]);
  const [systemJobs, setSystemJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailJob, setDetailJob] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, jobsRes] = await Promise.all([jobsApi.stats(), jobsApi.list()]);
      setStats(statsRes);
      setImportJobs(jobsRes?.importJobs || []);
      setSystemJobs(jobsRes?.systemJobs || []);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetails = async (jobId) => {
    try {
      setDetailLoading(true);
      setModalOpen(true);
      const res = await jobsApi.getImportJob(jobId);
      setDetailJob(res?.job || null);
    } catch {
      toast.error('Failed to load job details');
      setModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setDetailJob(null);
  };

  const handleCancel = (jobId) => {
    showConfirm({
      title: 'Cancel Job',
      message: 'Are you sure you want to cancel this job?',
      variant: 'warning',
      confirmText: 'Cancel Job',
      onConfirm: async () => {
        try {
          await jobsApi.cancelJob(jobId);
          toast.success('Job cancelled');
          fetchData();
        } catch {
          toast.error('Failed to cancel job');
        }
      },
    });
  };

  const summary = [
    { label: 'Running', value: (stats?.importJobs?.running || 0) + (stats?.systemJobs?.running || 0), tone: 'info' },
    { label: 'Completed', value: (stats?.importJobs?.completed || 0) + (stats?.systemJobs?.completed || 0), tone: 'success' },
    { label: 'Failed', value: (stats?.importJobs?.failed || 0) + (stats?.systemJobs?.failed || 0), tone: 'danger' },
    { label: 'Queued', value: (stats?.importJobs?.queued || 0) + (stats?.systemJobs?.queued || 0), tone: 'warning' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        title="Background Jobs"
        bordered={false}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={fetchData}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {summary.map((tile) => (
          <StatTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-fg">Import Jobs</h2>
        <ImportJobsTable
          loading={loading}
          jobs={importJobs}
          onView={handleViewDetails}
          onCancel={handleCancel}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-fg">System</h2>
        <SystemJobsTable loading={loading} jobs={systemJobs} />
      </section>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />

      <JobDetailModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        loading={detailLoading}
        job={detailJob}
      />
    </div>
  );
}
