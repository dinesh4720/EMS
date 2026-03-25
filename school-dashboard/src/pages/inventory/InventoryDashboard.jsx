import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Wrench, ShoppingCart, Truck, AlertTriangle, CheckCircle } from "lucide-react";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

function StatCard({ icon: Icon, label, value, color, onClick }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    gray: "bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-zinc-900/50 text-left hover:shadow-md transition-shadow w-full"
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{value}</p>
        </div>
      </div>
    </button>
  );
}

function LowStockItem({ asset }) {
  const pct = asset.minimumQuantity > 0 ? Math.round((asset.quantity / asset.minimumQuantity) * 100) : 0;
  const barColor = pct <= 25 ? "bg-red-500" : pct <= 50 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-zinc-800 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{asset.name}</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{asset.category} &middot; {asset.location || "No location"}</p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <div className="w-24">
          <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          pct <= 25
            ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
        }`}>
          {asset.quantity}/{asset.minimumQuantity}
        </span>
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsData, lowStockData, maintenanceData] = await Promise.all([
          inventoryApi.getStats(),
          inventoryApi.getLowStockAssets(),
          inventoryApi.getMaintenance({ status: "SCHEDULED" }),
        ]);
        setStats(statsData);
        setLowStock(Array.isArray(lowStockData) ? lowStockData : []);
        setRecentMaintenance(Array.isArray(maintenanceData) ? maintenanceData.slice(0, 5) : []);
      } catch (err) {
        toast.error(t('toast.error.failedToLoadInventoryData'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-64 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Package} label={t('pages.totalAssets')} value={stats?.totalAssets ?? 0} color="blue" onClick={() => navigate("/inventory/assets")} />
        <StatCard icon={CheckCircle} label={t('pages.active')} value={stats?.activeAssets ?? 0} color="green" onClick={() => navigate("/inventory/assets")} />
        <StatCard icon={Wrench} label={t('pages.underMaintenance')} value={stats?.underMaintenance ?? 0} color="yellow" onClick={() => navigate("/inventory/maintenance")} />
        <StatCard icon={ShoppingCart} label={t('pages.pendingProcurement')} value={stats?.pendingProcurements ?? 0} color="purple" onClick={() => navigate("/inventory/procurement")} />
        <StatCard icon={Truck} label={t('pages.activeVendors')} value={stats?.totalVendors ?? 0} color="gray" onClick={() => navigate("/inventory/vendors")} />
        <StatCard icon={AlertTriangle} label={t('pages.lowStock')} value={stats?.lowStockAssets ?? 0} color="red" onClick={() => navigate("/inventory/assets?filter=lowStock")} />
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.lowStockAlerts')}</h3>
            <span className="text-xs text-gray-500 dark:text-zinc-400">{lowStock.length} items</span>
          </div>
          <div className="px-5 py-2 max-h-72 overflow-y-auto">
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-zinc-400 py-6 text-center">{t('pages.noLowStockItems')}</p>
            ) : (
              lowStock.map((asset) => <LowStockItem key={asset._id} asset={asset} />)
            )}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.scheduledMaintenance')}</h3>
            <button
              onClick={() => navigate("/inventory/maintenance")}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="px-5 py-2 max-h-72 overflow-y-auto">
            {recentMaintenance.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-zinc-400 py-6 text-center">{t('pages.noScheduledMaintenance')}</p>
            ) : (
              recentMaintenance.map((log) => (
                <div key={log._id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-zinc-800 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                      {log.assetId?.name || "Unknown Asset"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {log.maintenanceType} &middot; {new Date(log.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
