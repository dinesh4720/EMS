import { useState, useEffect } from "react";
import { Building2, DoorOpen, Users, BedDouble, TrendingUp, AlertCircle } from "lucide-react";
import { hostelApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { CardGridPageSkeleton } from '../../components/skeletons/PageSkeletons';

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{value}</p>
          {sub && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function HostelDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await hostelApi.getStats();
      setStats(data);
    } catch (error) {
      toast.error(t('toast.error.failedToLoadHostelStats'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <CardGridPageSkeleton cards={6} columns="grid-cols-2 lg:grid-cols-3" />;

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={40} className="mx-auto text-gray-400 dark:text-zinc-500 mb-3" />
        <p className="text-gray-500 dark:text-zinc-400">{t('pages.failedToLoadDashboardData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Building2} label={t('pages.totalHostels')} value={stats.totalHostels || 0} color="blue" />
        <StatCard icon={DoorOpen} label={t('pages.totalRooms')} value={stats.totalRooms || 0} color="green" />
        <StatCard icon={BedDouble} label={t('pages.totalCapacity')} value={stats.totalCapacity || 0} sub={`${stats.availableBeds || 0} beds available`} color="purple" />
        <StatCard icon={Users} label={t('pages.occupiedBeds')} value={stats.occupiedBeds || 0} color="amber" />
        <StatCard icon={TrendingUp} label={t('pages.occupancyRate')} value={`${Math.round(stats.occupancyRate || 0)}%`} color="cyan" />
        <StatCard icon={Users} label={t('pages.activeAllocations')} value={stats.activeAllocations || 0} sub={`${stats.vacatedAllocations || 0} vacated`} color="rose" />
      </div>
    </div>
  );
}
