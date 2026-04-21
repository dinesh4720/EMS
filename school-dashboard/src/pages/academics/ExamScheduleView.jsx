import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Card, EmptyState, MinimalButton } from '../../components/ui';
import { formatShortDate } from '../../utils/dateFormatter';

const GROUPS = [
  {
    key: 'scheduled',
    statuses: ['scheduled'],
    badge: 'info',
    icon: Clock,
    labelKey: 'pages.scheduled',
  },
  {
    key: 'ongoing',
    statuses: ['ongoing'],
    badge: 'warning',
    icon: Clock,
    labelKey: 'pages.ongoing',
  },
  {
    key: 'completed',
    statuses: ['completed', 'results_published'],
    badge: 'success',
    icon: FileText,
    labelKey: 'pages.completed',
  },
];

export default function ExamScheduleView({ exams, activeFiltersCount, onCreateExam, onClearFilters }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    const result = {};
    for (const group of GROUPS) {
      result[group.key] = exams.filter((exam) => group.statuses.includes(exam.status));
    }
    return result;
  }, [exams]);

  if (exams.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={FileText}
          title={t('pages.noExamsToDisplay')}
          action={
            activeFiltersCount > 0 ? (
              <MinimalButton variant="secondary" onClick={onClearFilters}>
                {t('common.clearFilters', { defaultValue: 'Clear Filters' })}
              </MinimalButton>
            ) : (
              <MinimalButton icon={<Plus size={16} />} onClick={onCreateExam}>
                {t('pages.createFirstExam', { defaultValue: 'Create First Exam' })}
              </MinimalButton>
            )
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const items = grouped[group.key];
        if (!items.length) return null;
        const Icon = group.icon;
        return (
          <Card key={group.key} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} className="text-[var(--color-text-muted)]" aria-hidden="true" />
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                {t(group.labelKey)} ({items.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((exam) => (
                <ExamScheduleCard
                  key={exam.id || exam._id}
                  exam={exam}
                  badgeColor={group.badge}
                  onClick={() => navigate(`/academics/exams/${exam.id || exam._id}`)}
                  onEnterResults={() =>
                    navigate(`/academics/exams/${exam.id || exam._id}/results`)
                  }
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ExamScheduleCard({ exam, badgeColor, onClick, onEnterResults }) {
  const { t } = useTranslation();
  const statusLabel =
    exam.status === 'results_published'
      ? t('pages.published', { defaultValue: 'Published' })
      : t(`pages.${exam.status}`, { defaultValue: exam.status?.replace(/_/g, ' ') });

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <span className="font-medium text-[var(--color-text-primary)] text-sm truncate">
          {exam.name}
        </span>
        <Badge color={badgeColor} size="sm" variant="solid">
          {statusLabel}
        </Badge>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] truncate">
        {(exam.className || exam.classId) ?? '—'}
        {exam.subjectName ? ` • ${exam.subjectName}` : ''}
      </p>
      {exam.startDate && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {formatShortDate(exam.startDate)}
        </p>
      )}
      {(exam.status === 'completed' || exam.status === 'results_published') && (
        <div className="flex gap-2 mt-2">
          <span
            role="link"
            tabIndex={0}
            className="text-xs font-medium text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:underline"
            onClick={(e) => {
              e.stopPropagation();
              onEnterResults();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onEnterResults();
              }
            }}
          >
            {t('pages.enterResults')}
          </span>
        </div>
      )}
    </button>
  );
}

ExamScheduleCard.propTypes = {
  exam: PropTypes.object.isRequired,
  badgeColor: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onEnterResults: PropTypes.func.isRequired,
};

ExamScheduleView.propTypes = {
  exams: PropTypes.array.isRequired,
  activeFiltersCount: PropTypes.number.isRequired,
  onCreateExam: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};
