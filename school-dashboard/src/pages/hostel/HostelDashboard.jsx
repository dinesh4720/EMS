import { useState, useEffect, useCallback } from "react";
import { Building2, DoorOpen, Users, BedDouble, TrendingUp } from "lucide-react";
import { hostelApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';
import { StatCard, ErrorState } from '../../components/ui';

export default function HostelDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await hostelApi.getStats();
      setStats(data);
    } catch (error) {
      setLoadError(error);
      toast.error(t('toast.error.failedToLoadHostelStats'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (isLoading) return <CardGridPageSkeleton cards={6} columns="grid-cols-2 lg:grid-cols-3" />;

  if (loadError || !stats) {
    return (
      <ErrorState
        title={t('pages.failedToLoadDashboardData')}
        error={loadError}
        onRetry={loadStats}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Building2} label={t('pages.totalHostels')} value={stats.totalHostels || 0} color="blue" />
        <StatCard icon={DoorOpen} label={t('pages.totalRooms')} value={stats.totalRooms || 0} color="green" />
        <StatCard icon={BedDouble} label={t('pages.totalCapacity')} value={stats.totalCapacity || 0} subtext={`${stats.availableBeds || 0} beds available`} color="purple" />
        <StatCard icon={Users} label={t('pages.occupiedBeds')} value={stats.occupiedBeds || 0} color="amber" />
        <StatCard icon={TrendingUp} label={t('pages.occupancyRate')} value={`${Math.round(stats.occupancyRate || 0)}%`} color="cyan" />
        <StatCard icon={Users} label={t('pages.activeAllocations')} value={stats.activeAllocations || 0} subtext={`${stats.vacatedAllocations || 0} vacated`} color="rose" />
      </div>
    </div>
  );
}
