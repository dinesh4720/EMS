import { useState, useEffect, useCallback } from 'react';
import {
  Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
} from '@heroui/react';
import { RefreshCw, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsApi } from '../../services/api/extensions';

const statusColor = {
  completed: 'success',
  running: 'primary',
  failed: 'danger',
  queued: 'warning',
  scheduled: 'default',
};

const statusLabel = {
  completed: 'Completed',
  running: 'Running',
  failed: 'Failed',
  queued: 'Queued',
  scheduled: 'Scheduled',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

function SkeletonRows({ cols = 5, rows = 3 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="animate-pulse">
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
        </td>
      ))}
    </tr>
  ));
}

export default function BackgroundJobs() {
  const [stats, setStats] = useState(null);
  const [importJobs, setImportJobs] = useState([]);
  const [systemJobs, setSystemJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // detail modal
  const [detailJob, setDetailJob] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, jobsRes] = await Promise.all([
        jobsApi.stats(),
        jobsApi.list(),
      ]);
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

  const handleCancel = async (jobId) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    try {
      await jobsApi.cancelJob(jobId);
      toast.success('Job cancelled');
      fetchData();
    } catch {
      toast.error('Failed to cancel job');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Background Jobs</h1>
        <Button
          variant="bordered"
          size="sm"
          startContent={<RefreshCw size={14} />}
          onPress={fetchData}
        >
          Refresh
        </Button>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Running', value: (stats.importJobs?.running || 0) + (stats.systemJobs?.running || 0), color: 'text-blue-600' },
            { label: 'Completed', value: (stats.importJobs?.completed || 0) + (stats.systemJobs?.completed || 0), color: 'text-green-600' },
            { label: 'Failed', value: (stats.importJobs?.failed || 0) + (stats.systemJobs?.failed || 0), color: 'text-red-600' },
            { label: 'Queued', value: (stats.importJobs?.queued || 0) + (stats.systemJobs?.queued || 0), color: 'text-yellow-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Import Jobs */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Import Jobs</h2>
        <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-sm" aria-label="Import jobs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} rows={4} />
              ) : importJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">
                    No import jobs found
                  </td>
                </tr>
              ) : (
                importJobs.map((job) => (
                  <tr key={job._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{job.fileName}</td>
                    <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">{job.type}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" color={statusColor[job.status] || 'default'} variant="flat">
                        {statusLabel[job.status] || job.status}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {job.processedRows}/{job.totalRows}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(job.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          aria-label="View details"
                          onPress={() => handleViewDetails(job._id)}
                        >
                          <Eye size={14} />
                        </Button>
                        {(job.status === 'queued' || job.status === 'running') && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            aria-label="Cancel job"
                            onPress={() => handleCancel(job._id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* System Jobs */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">System</h2>
        <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-sm" aria-label="System jobs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next Run</th>
                <th className="px-4 py-3">Last Run</th>
                <th className="px-4 py-3">Interval</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={5} rows={4} />
              ) : systemJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">
                    No system jobs found
                  </td>
                </tr>
              ) : (
                systemJobs.map((job) => (
                  <tr key={job._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{job.name}</td>
                    <td className="px-4 py-3">
                      <Chip size="sm" color={statusColor[job.status] || 'default'} variant="flat">
                        {statusLabel[job.status] || job.status}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(job.nextRunAt)}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(job.lastRunAt)}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{job.repeatInterval || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail Modal */}
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Import Job Details</ModalHeader>
              <ModalBody>
                {detailLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                    ))}
                  </div>
                ) : detailJob ? (
                  <div className="space-y-3 text-sm">
                    <div><span className="font-medium text-zinc-600 dark:text-zinc-400">Type:</span>{' '}<span className="capitalize text-zinc-900 dark:text-zinc-100">{detailJob.type}</span></div>
                    <div><span className="font-medium text-zinc-600 dark:text-zinc-400">Status:</span>{' '}<Chip size="sm" color={statusColor[detailJob.status] || 'default'} variant="flat">{statusLabel[detailJob.status] || detailJob.status}</Chip></div>
                    <div><span className="font-medium text-zinc-600 dark:text-zinc-400">File:</span>{' '}<span className="text-zinc-900 dark:text-zinc-100">{detailJob.fileName}</span></div>
                    <div><span className="font-medium text-zinc-600 dark:text-zinc-400">Initiated by:</span>{' '}<span className="text-zinc-900 dark:text-zinc-100">{detailJob.initiatedBy?.name || '-'}</span></div>
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div>
                        <p className="text-xs text-zinc-500">Total Rows</p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{detailJob.totalRows}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Processed</p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{detailJob.processedRows}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Imported</p>
                        <p className="font-semibold text-green-600">{detailJob.importedCount}</p>
                      </div>
                    </div>
                    {detailJob.errorMessage && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-400 text-xs">
                        {detailJob.errorMessage}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-400">Job not found</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
