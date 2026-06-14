import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { API_URL } from '../../config/api';
import { clearStoredUser, getAuthHeaders } from '../../utils/authSession';
import JobStatusBadge from './JobStatusBadge';
import { formatDate } from './_helpers';

export default function BulkImportHistory() {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState(null);
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bulk-import/history`, {
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
      });
      if (response.status === 401) {
        clearStoredUser();
        throw new Error('Session expired. Please log in again.');
      }
      if (!response.ok) throw new Error('Failed to load history');
      const data = await response.json();
      setHistory(data?.jobs || []);
    } catch {
      toast.error(t('dataTools.bulkImport.loadHistoryFailed', 'Failed to load import history'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRollback = (jobId) => {
    showConfirm({
      title: t('dataTools.bulkImport.rollbackTitle', 'Rollback Import'),
      message: t('dataTools.bulkImport.rollbackMessage', 'Are you sure you want to rollback this import? This will undo all changes.'),
      variant: 'warning',
      confirmText: t('dataTools.bulkImport.rollback', 'Rollback'),
      onConfirm: async () => {
        setRollingBack(jobId);
        try {
          const response = await fetch(`${API_URL}/bulk-import/history/${jobId}/rollback`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
          });
          if (response.status === 401) {
            clearStoredUser();
            throw new Error('Session expired. Please log in again.');
          }
          if (!response.ok) throw new Error('Rollback failed');

          toast.success(t('dataTools.bulkImport.rollbackSuccess', 'Import rolled back successfully'));
          fetchHistory();
        } catch {
          toast.error(t('dataTools.bulkImport.rollbackFailed', 'Rollback failed'));
        } finally {
          setRollingBack(null);
        }
      },
    });
  };

  if (loading) return <SkeletonTable rows={4} columns={6} />;

  if (history.length === 0) {
    return (
      <Card padding="none" radius="lg">
        <EmptyState
          title={t('dataTools.bulkImport.historyEmptyTitle', 'No import history')}
          description={t('dataTools.bulkImport.historyEmptyDesc', 'Past imports will appear here once you run them.')}
        />
      </Card>
    );
  }

  return (
    <>
      <Card padding="none" radius="lg" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t('dataTools.bulkImport.historyAria', 'Import history')}>
            <thead>
              <tr className="border-b border-divider text-left text-xs text-fg-muted uppercase">
                <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.bulkImport.colFile', 'File')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.bulkImport.colType', 'Type')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.bulkImport.colStatus', 'Status')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.bulkImport.colResults', 'Results')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.bulkImport.colDate', 'Date')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('dataTools.bulkImport.colActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((job) => (
                <tr
                  key={job._id}
                  className="border-b border-divider last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3 font-medium text-fg">
                    {job.fileName}
                  </td>
                  <td className="px-4 py-3 capitalize text-fg-muted">
                    {job.type}
                  </td>
                  <td className="px-4 py-3">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-fg-muted text-xs">
                    {job.importedCount > 0 || job.skippedCount > 0 || job.failedCount > 0 ? (
                      <span>
                        {t('dataTools.bulkImport.resultsSummary', {
                          imported: job.importedCount,
                          skipped: job.skippedCount,
                          failed: job.failedCount,
                          defaultValue: '{{imported}} imported, {{skipped}} skipped, {{failed}} failed',
                        })}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {formatDate(job.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {job.status === 'completed' && !job.dryRun && job.importedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={rollingBack === job._id}
                        icon={<RotateCcw size={12} />}
                        onClick={() => handleRollback(job._id)}
                      >
                        {t('dataTools.bulkImport.rollback', 'Rollback')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog {...confirmState} onClose={closeConfirm} />
    </>
  );
}
