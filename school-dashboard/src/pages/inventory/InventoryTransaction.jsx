import { useState, useEffect } from "react";
import { inventoryApi } from "../../services/api";
import toast from "react-hot-toast";
import { Printer } from "lucide-react";
import { MinimalButton } from "../../components/ui";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatShortDate } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';

// Safe line-total computation — guards against NaN when quantity or rate is
// undefined, null, or an empty string, returning 0 instead of NaN so that
// the running total and PDF generation never receive a NaN value.
function safeLineTotal(quantity, rate) {
  return (Number(quantity) || 0) * (Number(rate) || 0);
}

const statusColors = {
  PURCHASED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  ORDERED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  RECEIVED: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
};

const FILTER_STATUSES = ["ALL", "PURCHASED", "ORDERED", "RECEIVED"];

export default function InventoryTransaction() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Reuse existing procurement endpoint; filter client-side for completed statuses.
        const data = await inventoryApi.getProcurement();
        const completed = Array.isArray(data)
          ? data.filter((r) => ["PURCHASED", "ORDERED", "RECEIVED"].includes(r.status))
          : [];
        setTransactions(completed);
      } catch {
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered =
    filterStatus === "ALL"
      ? transactions
      : transactions.filter((t) => t.status === filterStatus);

  // Grand total — safe against NaN: each lineTotal is guaranteed to be a number.
  const grandTotal = filtered.reduce(
    (sum, item) => sum + safeLineTotal(item.quantity, item.actualCost ?? item.estimatedCost),
    0
  );

  const handlePrint = () => window.print();

  if (loading) return <TablePageSkeleton title={false} kpiCards={0} columns={6} rows={6} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 px-3 py-2"
        >
          {FILTER_STATUSES.map((s) => (
            <option key={s} value={s}>{s === "ALL" ? "All Transactions" : s}</option>
          ))}
        </select>
        <MinimalButton variant="ghost" size="sm" icon={<Printer size={16} />} onClick={handlePrint}>
          Print
        </MinimalButton>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                {["Item", "Category", "Qty", "Rate (₹)", "Total (₹)", "Vendor", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500 dark:text-zinc-400">
                    No purchase transactions found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const rate = item.actualCost ?? item.estimatedCost;
                  // Use safeLineTotal so undefined/null quantity or rate yields 0, not NaN.
                  const total = safeLineTotal(item.quantity, rate);
                  return (
                    <tr key={item._id} className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">{item.itemName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                          {item.category?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{item.quantity ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                        {rate != null ? rate.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">
                        {rate != null ? `₹${total.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{item.vendorId?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status] || ""}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">
                        {item.updatedAt ? formatShortDate(item.updatedAt) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-zinc-300 text-right">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100">
                    ₹{grandTotal.toLocaleString()}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
