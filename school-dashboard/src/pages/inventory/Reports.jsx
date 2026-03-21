import { useState, useEffect } from "react";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";

const conditionColors = {
  GOOD: "bg-green-500",
  FAIR: "bg-blue-500",
  POOR: "bg-yellow-500",
  DAMAGED: "bg-red-500",
};

const statusColors = {
  ACTIVE: "bg-green-500",
  UNDER_MAINTENANCE: "bg-yellow-500",
  DISPOSED: "bg-gray-400",
  LOST: "bg-red-500",
};

function BarChart({ data, colorMap, label }) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">{label}</h3>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d._id} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-700 dark:text-zinc-300">{(d._id || "Unknown").replace(/_/g, " ")}</span>
              <span className="text-gray-500 dark:text-zinc-400">{d.count} ({Math.round((d.count / total) * 100)}%)</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${colorMap[d._id] || "bg-gray-400"}`}
                style={{ width: `${(d.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">No data</p>}
      </div>
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await inventoryApi.getReports();
        setReports(data);
      } catch { toast.error("Failed to load reports"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
        ))}
      </div>
    );
  }

  const totals = reports?.totals || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Items", value: totals.totalItems || 0 },
          { label: "Total Purchase Value", value: `₹${(totals.totalPurchaseValue || 0).toLocaleString()}` },
          { label: "Total Current Value", value: `₹${(totals.totalCurrentValue || 0).toLocaleString()}` },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 p-5">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">By Category</h3>
          <div className="space-y-3">
            {(reports?.categoryBreakdown || []).map((cat) => {
              const maxCount = Math.max(...(reports?.categoryBreakdown || []).map((c) => c.count)) || 1;
              return (
                <div key={cat._id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-700 dark:text-zinc-300">{(cat._id || "Unknown").replace(/_/g, " ")}</span>
                    <span className="text-gray-500 dark:text-zinc-400">{cat.count} items &middot; ₹{(cat.totalValue || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(cat.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {(reports?.categoryBreakdown || []).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">No data</p>
            )}
          </div>
        </div>

        {/* Condition Summary */}
        <BarChart
          data={reports?.conditionSummary || []}
          colorMap={conditionColors}
          label="By Condition"
        />

        {/* Status Summary */}
        <BarChart
          data={reports?.statusSummary || []}
          colorMap={statusColors}
          label="By Status"
        />

        {/* Depreciation Note */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">Depreciation Overview</h3>
          {totals.totalPurchaseValue > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Purchase Value</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">₹{(totals.totalPurchaseValue || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Current Value</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100">₹{(totals.totalCurrentValue || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${Math.min(((totals.totalCurrentValue || 0) / totals.totalPurchaseValue) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
                {Math.round(((totals.totalCurrentValue || 0) / totals.totalPurchaseValue) * 100)}% of original value retained
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">No purchase value data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
