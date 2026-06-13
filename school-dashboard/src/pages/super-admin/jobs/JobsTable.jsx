import { Ban, RotateCcw, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Chip, EmptyState, IconButton } from '../../../components/ui';
import { STATUS_CHIP_COLOR, formatDate } from './jobsUtils';

export default function JobsTable({ jobs, onRetry, onCancel, retrying, cancelling }) {
  const { t } = useTranslation();

  if (!jobs.length) {
    return (
      <EmptyState
        icon={Wrench}
        title={t('pages.noJobsFound')}
        description={t('pages.jobsEmptyDescription')}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-divider text-fg-muted">
            <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.name1')}</th>
            <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.status2')}</th>
            <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.lastRun')}</th>
            <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.nextRun')}</th>
            <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.failReason')}</th>
            <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide">{t('pages.actions1')}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job._id}
              className="border-b border-divider align-top last:border-0"
            >
              <td className="py-3 pr-4">
                <div className="font-medium text-fg">{job.name}</div>
                {job.repeatInterval && (
                  <div className="mt-1 text-xs text-fg-faint">
                    every {job.repeatInterval}
                  </div>
                )}
              </td>
              <td className="py-3 pr-4">
                <Chip size="sm" color={STATUS_CHIP_COLOR[job.status] || 'neutral'}>
                  <span className="capitalize">{job.status}</span>
                </Chip>
              </td>
              <td className="py-3 pr-4 text-fg-muted">{formatDate(job.lastRunAt)}</td>
              <td className="py-3 pr-4 text-fg-muted">{formatDate(job.nextRunAt)}</td>
              <td className="max-w-[240px] truncate py-3 pr-4 text-xs text-fg-muted">
                {job.failReason || '—'}
              </td>
              <td className="py-3 text-right">
                <div className="flex justify-end gap-1">
                  {job.status === 'failed' && (
                    <IconButton
                      aria-label={t('pages.retry2')}
                      title={t('pages.retry2')}
                      size="sm"
                      variant="ghost"
                      onClick={() => onRetry(job._id)}
                      disabled={retrying[job._id]}
                      icon={<RotateCcw size={14} aria-hidden="true" />}
                    />
                  )}
                  <IconButton
                    aria-label={t('pages.cancel2')}
                    title={t('pages.cancel2')}
                    size="sm"
                    variant="danger"
                    onClick={() => onCancel(job._id)}
                    disabled={cancelling[job._id]}
                    icon={<Ban size={14} aria-hidden="true" />}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
