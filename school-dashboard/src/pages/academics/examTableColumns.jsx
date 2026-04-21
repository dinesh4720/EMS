import { Badge } from '../../components/ui';
import { Calendar, FileText } from 'lucide-react';
import { formatShortDate } from '../../utils/dateFormatter';

const STATUS_TO_BADGE = {
  scheduled: 'info',
  ongoing: 'warning',
  completed: 'success',
  results_published: 'success',
};

export function buildExamColumns(t) {
  return [
    {
      key: 'name',
      label: t('pages.eXAM'),
      render: (exam) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[var(--color-bg-tertiary)]">
            <FileText size={16} className="text-[var(--color-text-muted)]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="font-medium text-[var(--color-text-primary)] block truncate">
              {exam.name}
            </span>
            {exam.academicYear && (
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {exam.academicYear}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: t('pages.tYPE'),
      render: (exam) => (
        <span className="capitalize text-[var(--color-text-secondary)]">
          {exam.type?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'class',
      label: t('pages.cLASS'),
      render: (exam) => (
        <span className="text-[var(--color-text-secondary)]">
          {exam.className || exam.classId || '—'}
        </span>
      ),
    },
    {
      key: 'subject',
      label: t('pages.sUBJECT'),
      render: (exam) => (
        <span className="text-[var(--color-text-secondary)]">{exam.subjectName || '—'}</span>
      ),
    },
    {
      key: 'date',
      label: t('pages.dATE'),
      render: (exam) => (
        <div className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <Calendar size={14} aria-hidden="true" />
          {exam.startDate
            ? formatShortDate(exam.startDate)
            : t('pages.notScheduled', { defaultValue: 'Not scheduled' })}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('pages.sTATUS'),
      render: (exam) => (
        <Badge color={STATUS_TO_BADGE[exam.status] || 'neutral'} size="md" variant="solid">
          <span className="capitalize">{exam.status?.replace(/_/g, ' ')}</span>
        </Badge>
      ),
    },
  ];
}
