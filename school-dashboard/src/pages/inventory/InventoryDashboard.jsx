import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Wrench, ShoppingCart, Truck, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { inventoryApi } from "../../services/api";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatShortDate } from '../../utils/dateFormatter';
import { Card, StatCard, EmptyState, ErrorState, Badge, Progress, SectionHeading, MinimalButton } from "../../components/ui";

const statusBadgeColor = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

function LowStockItem({ asset }) {
  const pct = asset.minimumQuantity > 0 ? Math.round((asset.quantity / asset.minimumQuantity) * 100) : 0;
  const tone = pct <= 25 ? 'danger' : pct <= 50 ? 'warning' : 'success';

  return (
    <div className="flex items-center justify-between py-3 border-b border-divider last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg truncate">{asset.name}</p>
        <p className="text-xs text-fg-muted">{asset.category} &middot; {asset.location || "No location"}</p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <Progress value={asset.quantity} max={Math.max(asset.minimumQuantity, asset.quantity, 1)} size="sm" color={tone} className="w-24" />
        <Badge color={tone} size="sm">{asset.quantity}/{asset.minimumQuantity}</Badge>
      </div>
    </div>
  );
}

export default function InventoryDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, lowStockData, maintenanceData] = await Promise.all([
        inventoryApi.getStats(),
        inventoryApi.getLowStockAssets(),
        inventoryApi.getMaintenance({ status: "SCHEDULED" }),
      ]);
      setStats(statsData);
      setLowStock(Array.isArray(lowStockData) ? lowStockData : []);
      setRecentMaintenance(Array.isArray(maintenanceData) ? maintenanceData.slice(0, 5) : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <CardGridPageSkeleton cards={6} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />;
  if (error) return <ErrorState onRetry={load} error={error} title={t('toast.error.failedToLoadInventoryData')} />;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Package} label={t('pages.totalAssets')} value={stats?.totalAssets ?? 0} color="blue" href="/inventory/assets" />
        <StatCard icon={CheckCircle} label={t('pages.active')} value={stats?.activeAssets ?? 0} color="green" href="/inventory/assets" />
        <StatCard icon={Wrench} label={t('pages.underMaintenance')} value={stats?.underMaintenance ?? 0} color="amber" href="/inventory/maintenance" />
        <StatCard icon={ShoppingCart} label={t('pages.pendingProcurement')} value={stats?.pendingProcurements ?? 0} color="purple" href="/inventory/procurement" />
        <StatCard icon={Truck} label={t('pages.activeVendors')} value={stats?.totalVendors ?? 0} color="gray" href="/inventory/vendors" />
        <StatCard icon={AlertTriangle} label={t('pages.lowStock')} value={stats?.lowStockAssets ?? 0} color="red" href="/inventory/assets?filter=lowStock" />
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card padding="none" elevation="raised">
          <div className="px-5 py-4 border-b border-divider">
            <SectionHeading
              size="sm"
              icon={AlertTriangle}
              actions={<span className="text-xs text-fg-muted">{lowStock.length} items</span>}
            >
              {t('pages.lowStockAlerts')}
            </SectionHeading>
          </div>
          <div className="px-5 py-2 max-h-72 overflow-y-auto">
            {lowStock.length === 0 ? (
              <EmptyState size="sm" icon={Package} title={t('pages.noLowStockItems')} />
            ) : (
              lowStock.map((asset) => <LowStockItem key={asset._id} asset={asset} />)
            )}
          </div>
        </Card>

        {/* Upcoming Maintenance */}
        <Card padding="none" elevation="raised">
          <div className="px-5 py-4 border-b border-divider">
            <SectionHeading
              size="sm"
              icon={Calendar}
              actions={
                <MinimalButton variant="ghost" size="sm" onClick={() => navigate("/inventory/maintenance")}>
                  View all
                </MinimalButton>
              }
            >
              {t('pages.scheduledMaintenance')}
            </SectionHeading>
          </div>
          <div className="px-5 py-2 max-h-72 overflow-y-auto">
            {recentMaintenance.length === 0 ? (
              <EmptyState size="sm" icon={Calendar} title={t('pages.noScheduledMaintenance')} />
            ) : (
              recentMaintenance.map((log) => (
                <div key={log._id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg truncate">
                      {log.assetId?.name || "Unknown Asset"}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {log.maintenanceType} &middot; {formatShortDate(log.scheduledDate)}
                    </p>
                  </div>
                  <Badge color={statusBadgeColor[log.status] || 'neutral'} size="sm">
                    {log.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
