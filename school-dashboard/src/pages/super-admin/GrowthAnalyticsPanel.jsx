import { useEffect, useState } from 'react';
import { BarChart3, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  SkeletonTable,
  SkeletonText,
} from '../../components/ui';
import { superAdminApi } from '../../services/api';

const RISK_CHIP_COLOR = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

const TREND_ICON = {
  improving: <TrendingUp size={14} className="text-emerald-500" aria-hidden="true" />,
  declining: <TrendingDown size={14} className="text-red-500" aria-hidden="true" />,
  stable: <Minus size={14} className="text-fg-faint" aria-hidden="true" />,
};

function FunnelBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-fg-muted">{label}</span>
        <span className="font-medium text-fg">{value}</span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-2 rounded-full bg-blue-500 transition-all dark:bg-blue-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function GrowthAnalyticsPanel() {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [growthData, funnelData] = await Promise.all([
        superAdminApi.getGrowthAnalytics(),
        superAdminApi.getGrowthFunnel(),
      ]);
      setReport(growthData);
      setFunnel(funnelData);
    } catch (err) {
      setError(err.message || 'Failed to load growth analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const schools = report?.schools || [];
  const funnelSteps = funnel?.funnel || [];
  const maxFunnel = funnelSteps.length > 0 ? Math.max(...funnelSteps.map((step) => step.count)) : 0;

  return (
    <div className="space-y-5">
      <Card padding="md" radius="lg">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={16} aria-hidden="true" className="text-fg-muted" />
          <h2 className="text-base font-semibold text-fg">
            {t('pages.featureActivationFunnel')}
          </h2>
        </div>

        {loading ? (
          <SkeletonText lines={5} />
        ) : error ? (
          <ErrorState error={error} onRetry={load} />
        ) : funnelSteps.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            size="sm"
            title={t('pages.noFunnelDataAvailable')}
            description="Activation data will appear once schools start adopting features."
          />
        ) : (
          <div className="space-y-3">
            {funnelSteps.map((step) => (
              <FunnelBar key={step.feature} label={step.feature} value={step.count} max={maxFunnel} />
            ))}
          </div>
        )}
      </Card>

      <Card padding="md" radius="lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-fg">
            {t('pages.schoolGrowthScores')}
          </h2>
          <Button variant="outline" size="sm" onClick={load} loading={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={7} />
        ) : error ? (
          <ErrorState error={error} onRetry={load} />
        ) : schools.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={t('pages.noGrowthDataAvailable')}
            description="School-level growth metrics will appear here once usage is tracked."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-divider text-fg-muted">
                  <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.school1')}</th>
                  <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.healthScore')}</th>
                  <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.churnRisk')}</th>
                  <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.trend')}</th>
                  <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.dAU7d')}</th>
                  <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.featuresUsed')}</th>
                  <th className="pb-3 text-xs font-medium uppercase tracking-wide">{t('pages.activated')}</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr
                    key={school.schoolId}
                    className="border-b border-divider last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-fg">
                      {school.schoolName || school.schoolId}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-fg">
                        {school.healthScore ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {school.churnRisk ? (
                        <Chip size="sm" color={RISK_CHIP_COLOR[school.churnRisk] || 'neutral'}>
                          <span className="capitalize">{school.churnRisk}</span>
                        </Chip>
                      ) : (
                        <span className="text-xs text-fg-faint">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1">
                        {TREND_ICON[school.trend] || TREND_ICON.stable}
                        <span className="text-xs capitalize text-fg-muted">
                          {school.trend || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-fg">{school.dauLast7d ?? '—'}</td>
                    <td className="py-3 pr-4 text-fg">{school.featuresUsedCount ?? '—'}</td>
                    <td className="py-3 pr-4">
                      {school.isFullyActivated ? (
                        <Chip size="sm" color="success">{t('pages.yes1')}</Chip>
                      ) : (
                        <span className="text-xs text-fg-faint">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
