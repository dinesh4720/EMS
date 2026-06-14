import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (loading) return <SkeletonTable rows={4} columns={6} />;
  if (jobs.length === 0) {
    return (
      <Card padding="none" radius="lg">
        <EmptyState
          title={t('dataTools.jobs.importJobsEmptyTitle', 'No import jobs')}
          description={t('dataTools.jobs.importJobsEmptyDesc', 'Imports you run will appear here.')}
        />
      </Card>
    );
  }

  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={t('dataTools.jobs.importJobsAria', 'Import jobs')}>
          <thead>
            <tr className="border-b border-divider text-left text-xs text-fg-muted uppercase">
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.colFile', 'File')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.colType', 'Type')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.colStatus', 'Status')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.colRows', 'Rows')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.colCreated', 'Created')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.colActions', 'Actions')}</th>
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
                      aria-label={t('dataTools.jobs.viewDetails', 'View details')}
                      size="sm"
                      onClick={() => onView(job._id)}
                    />
                    {(job.status === 'queued' || job.status === 'running') && (
                      <IconButton
                        icon={<Trash2 size={14} />}
                        aria-label={t('dataTools.jobs.cancelJob', 'Cancel job')}
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
  const { t } = useTranslation();
  if (loading) return <SkeletonTable rows={4} columns={5} />;
  if (jobs.length === 0) {
    return (
      <Card padding="none" radius="lg">
        <EmptyState
          title={t('dataTools.jobs.systemEmptyTitle', 'No system jobs')}
          description={t('dataTools.jobs.systemEmptyDesc', 'Scheduled background jobs will appear here.')}
        />
      </Card>
    );
  }

  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={t('dataTools.jobs.systemJobsAria', 'System jobs')}>
          <thead>
            <tr className="border-b border-divider text-left text-xs text-fg-muted uppercase">
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.sysName', 'Name')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.sysStatus', 'Status')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.sysNextRun', 'Next Run')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.sysLastRun', 'Last Run')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.jobs.sysInterval', 'Interval')}</th>
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
  const { t } = useTranslation();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('dataTools.jobs.detailTitle', 'Import Job Details')}
      size="lg"
      footer={(close) => (
        <Button variant="ghost" onClick={close}>
          {t('common.close', 'Close')}
        </Button>
      )}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-5 animate-shimmer rounded" />
          <div className="h-5 animate-shimmer rounded" />
          <div className="h-5 animate-shimmer rounded" />
          <div className="h-5 animate-shimmer rounded" />
        </div>
      ) : job ? (
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-fg-muted">{t('dataTools.jobs.detailType', 'Type: ')}</span>
            <span className="capitalize text-fg">{job.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-fg-muted">{t('dataTools.jobs.detailStatus', 'Status: ')}</span>
            <JobStatusBadge status={job.status} />
          </div>
          <div>
            <span className="font-medium text-fg-muted">{t('dataTools.jobs.detailFile', 'File: ')}</span>
            <span className="text-fg">{job.fileName}</span>
          </div>
          <div>
            <span className="font-medium text-fg-muted">{t('dataTools.jobs.detailInitiatedBy', 'Initiated by: ')}</span>
            <span className="text-fg">{job.initiatedBy?.name || '-'}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-divider">
            <div>
              <p className="text-xs text-fg-muted">{t('dataTools.jobs.detailTotalRows', 'Total Rows')}</p>
              <p className="font-semibold text-fg">{job.totalRows}</p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">{t('dataTools.jobs.detailProcessed', 'Processed')}</p>
              <p className="font-semibold text-fg">{job.processedRows}</p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">{t('dataTools.jobs.detailImported', 'Imported')}</p>
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
        <EmptyState title={t('dataTools.jobs.jobNotFound', 'Job not found')} />
      )}
    </Modal>
  );
}

export default function BackgroundJobs() {
  const { t } = useTranslation();
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
      toast.error(t('dataTools.jobs.loadJobsFailed', 'Failed to load jobs'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      toast.error(t('dataTools.jobs.loadDetailsFailed', 'Failed to load job details'));
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
      title: t('dataTools.jobs.cancelTitle', 'Cancel Job'),
      message: t('dataTools.jobs.cancelMessage', 'Are you sure you want to cancel this job?'),
      variant: 'warning',
      confirmText: t('dataTools.jobs.cancelConfirm', 'Cancel Job'),
      onConfirm: async () => {
        try {
          await jobsApi.cancelJob(jobId);
          toast.success(t('dataTools.jobs.jobCancelled', 'Job cancelled'));
          fetchData();
        } catch {
          toast.error(t('dataTools.jobs.cancelFailed', 'Failed to cancel job'));
        }
      },
    });
  };

  const summary = [
    { label: t('dataTools.jobs.statRunning', 'Running'), value: (stats?.importJobs?.running || 0) + (stats?.systemJobs?.running || 0), tone: 'info' },
    { label: t('dataTools.jobs.statCompleted', 'Completed'), value: (stats?.importJobs?.completed || 0) + (stats?.systemJobs?.completed || 0), tone: 'success' },
    { label: t('dataTools.jobs.statFailed', 'Failed'), value: (stats?.importJobs?.failed || 0) + (stats?.systemJobs?.failed || 0), tone: 'danger' },
    { label: t('dataTools.jobs.statQueued', 'Queued'), value: (stats?.importJobs?.queued || 0) + (stats?.systemJobs?.queued || 0), tone: 'warning' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        title={t('dataTools.jobs.title', 'Background Jobs')}
        bordered={false}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={fetchData}
            loading={loading}
          >
            {t('common.refresh', 'Refresh')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {summary.map((tile) => (
          <StatTile key={tile.label} label={tile.label} value={tile.value} tone={tile.tone} />
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-fg">{t('dataTools.jobs.importJobs', 'Import Jobs')}</h2>
        <ImportJobsTable
          loading={loading}
          jobs={importJobs}
          onView={handleViewDetails}
          onCancel={handleCancel}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-fg">{t('dataTools.jobs.system', 'System')}</h2>
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
