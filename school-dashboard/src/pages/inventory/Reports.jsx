import { useState, useEffect, useCallback } from "react";
import { inventoryApi } from "../../services/api";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Card, EmptyState, ErrorState, Progress, SectionHeading } from "../../components/ui";

const conditionColors = {
  GOOD: 'success',
  FAIR: 'info',
  POOR: 'warning',
  DAMAGED: 'danger',
};

const statusColors = {
  ACTIVE: 'success',
  UNDER_MAINTENANCE: 'warning',
  DISPOSED: 'primary',
  LOST: 'danger',
};

function BreakdownChart({ data, colorMap, title }) {
  const { t } = useTranslation();
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <Card padding="md" elevation="raised">
      <SectionHeading size="sm" className="mb-4">{title}</SectionHeading>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-fg-muted text-center py-4">{t('pages.noData')}</p>
        ) : (
          data.map((d) => {
            const pct = Math.round((d.count / total) * 100);
            return (
              <div key={d._id || 'unknown'} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-fg">{(d._id || "Unknown").replace(/_/g, " ")}</span>
                  <span className="text-fg-muted">{d.count} ({pct}%)</span>
                </div>
                <Progress value={d.count} max={total} size="sm" color={colorMap[d._id] || 'primary'} aria-label={`${(d._id || "Unknown").replace(/_/g, " ")} proportion`} />
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default function Reports() {
  const { t } = useTranslation();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await inventoryApi.getReports();
      setReports(data);
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <CardGridPageSkeleton title={false} cards={4} columns="grid-cols-1 md:grid-cols-2" />;
  if (loadError) return <ErrorState onRetry={load} error={loadError} title={t('toast.error.failedToLoadReports')} />;

  const totals = reports?.totals || {};
  const categoryBreakdown = reports?.categoryBreakdown || [];
  const maxCategoryCount = Math.max(...categoryBreakdown.map((c) => c.count), 1);
  const retentionPct = totals.totalPurchaseValue > 0
    ? Math.round(((totals.totalCurrentValue || 0) / totals.totalPurchaseValue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Items", value: totals.totalItems || 0 },
          { label: "Total Purchase Value", value: `₹${(totals.totalPurchaseValue || 0).toLocaleString()}` },
          { label: "Total Current Value", value: `₹${(totals.totalCurrentValue || 0).toLocaleString()}` },
        ].map((card) => (
          <Card key={card.label} padding="md" elevation="raised">
            <p className="text-sm text-fg-muted">{card.label}</p>
            <p className="text-2xl font-semibold text-fg mt-1">{card.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card padding="md" elevation="raised">
          <SectionHeading size="sm" className="mb-4">{t('pages.byCategory')}</SectionHeading>
          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-fg-muted text-center py-4">{t('pages.noData')}</p>
            ) : (
              categoryBreakdown.map((cat) => (
                <div key={cat._id || 'unknown'} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-fg">{(cat._id || "Unknown").replace(/_/g, " ")}</span>
                    <span className="text-fg-muted">{cat.count} items &middot; ₹{(cat.totalValue || 0).toLocaleString()}</span>
                  </div>
                  <Progress value={cat.count} max={maxCategoryCount} size="sm" color="info" aria-label={`${(cat._id || "Unknown").replace(/_/g, " ")} category share`} />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Condition Summary */}
        <BreakdownChart
          data={reports?.conditionSummary || []}
          colorMap={conditionColors}
          title={t('pages.byCondition')}
        />

        {/* Status Summary */}
        <BreakdownChart
          data={reports?.statusSummary || []}
          colorMap={statusColors}
          title={t('pages.byStatus')}
        />

        {/* Depreciation Overview */}
        <Card padding="md" elevation="raised">
          <SectionHeading size="sm" className="mb-4">{t('pages.depreciationOverview')}</SectionHeading>
          {totals.totalPurchaseValue > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-fg-muted">{t('pages.purchaseValue')}</p>
                  <p className="text-lg font-semibold text-fg">₹{(totals.totalPurchaseValue || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-fg-muted">{t('pages.currentValue')}</p>
                  <p className="text-lg font-semibold text-fg">₹{(totals.totalCurrentValue || 0).toLocaleString()}</p>
                </div>
              </div>
              <Progress value={retentionPct} max={100} size="lg" color="success" aria-label="Value retention" />
              <p className="text-xs text-fg-muted text-center">
                {retentionPct}% of original value retained
              </p>
            </div>
          ) : (
            <EmptyState size="sm" title={t('pages.noPurchaseValueDataAvailable')} />
          )}
        </Card>
      </div>
    </div>
  );
}
