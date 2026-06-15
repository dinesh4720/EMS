import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  SkeletonTable,
} from '../../components/ui';
import { superAdminApi } from '../../services/api';

const RISK_COLORS = {
  low: 'text-[var(--ok)]',
  medium: 'text-[var(--warn)]',
  high: 'text-[var(--danger)]',
};

const TREND_ICON = {
  improving: <TrendingUp size={14} className="text-[var(--ok)]" aria-hidden="true" />,
  declining: <TrendingDown size={14} className="text-[var(--danger)]" aria-hidden="true" />,
  stable: <Minus size={14} className="text-fg-faint" aria-hidden="true" />,
};

function HealthBar({ score }) {
  if (score == null) {
    return <span className="text-xs text-fg-faint">—</span>;
  }
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 70 ? 'bg-[var(--ok)]' : pct >= 40 ? 'bg-[var(--warn)]' : 'bg-[var(--danger)]';
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-16 rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-fg">{pct}</span>
    </div>
  );
}

export default function SchoolHealthPanel() {
  const { t } = useTranslation();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await superAdminApi.getSchoolHealth();
      setSchools(data.schools || []);
    } catch (err) {
      setError(err.message || t('pages.failedToLoadSchoolHealth'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  return (
    <Card padding="md" radius="lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
            <Activity size={16} aria-hidden="true" className="text-fg-muted" />
            {t('pages.schoolHealthMonitor')}
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {t('pages.healthScoresChurnRiskAndActivityAcrossAllSchools')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} loading={loading}>
          {t('common.refresh') || 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={7} />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : schools.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={t('pages.noSchoolsFound')}
          description={t('pages.healthDataEmpty')}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-fg-muted">
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.school1')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.health1')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.churnRisk')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.trend')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.students1')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.staff1')}</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.rateLimits')}</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr
                  key={school.schoolId}
                  className="border-b border-divider align-top last:border-0"
                >
                  <td className="py-3 pr-4">
                    <div className="font-medium text-fg">{school.name}</div>
                    <div className="mt-0.5 text-xs text-fg-faint">
                      {school.plan} · {school.status}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <HealthBar score={school.healthScore} />
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs font-medium capitalize ${
                        RISK_COLORS[school.churnRisk] || 'text-fg-faint'
                      }`}
                    >
                      {school.churnRisk || '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      {TREND_ICON[school.trend] || TREND_ICON.stable}
                      <span className="text-xs capitalize text-fg-muted">
                        {school.trend || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-fg">{school.studentsCount}</td>
                  <td className="py-3 pr-4 text-fg">{school.staffCount}</td>
                  <td className="py-3 pr-4">
                    {school.rateLimitViolations > 0 ? (
                      <Chip
                        size="sm"
                        color="warning"
                        startContent={<AlertTriangle size={12} aria-hidden="true" />}
                      >
                        {school.rateLimitViolations}
                      </Chip>
                    ) : (
                      <span className="text-xs text-fg-faint">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
