import { useState, useEffect, useCallback } from "react";
import { Select, SelectItem } from "@heroui/react";
import { inventoryApi } from "../../services/api";
import { Printer, Receipt } from "lucide-react";
import { MinimalButton, Card, Badge, EmptyState, ErrorState } from "../../components/ui";
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { formatShortDate } from '../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';

// Safe line-total computation — guards against NaN when quantity or rate is
// undefined, null, or an empty string, returning 0 instead of NaN so that
// the running total and PDF generation never receive a NaN value.
function safeLineTotal(quantity, rate) {
  return (Number(quantity) || 0) * (Number(rate) || 0);
}

const statusBadgeColor = {
  PURCHASED: 'success',
  ORDERED: 'info',
  RECEIVED: 'info',
};

const FILTER_STATUSES = ["ALL", "PURCHASED", "ORDERED", "RECEIVED"];

export default function InventoryTransaction() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await inventoryApi.getProcurement();
      const completed = Array.isArray(data)
        ? data.filter((r) => ["PURCHASED", "ORDERED", "RECEIVED"].includes(r.status))
        : [];
      setTransactions(completed);
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered =
    filterStatus === "ALL"
      ? transactions
      : transactions.filter((tx) => tx.status === filterStatus);

  const grandTotal = filtered.reduce(
    (sum, item) => sum + safeLineTotal(item.quantity, item.actualCost ?? item.estimatedCost),
    0
  );

  const handlePrint = () => window.print();

  if (initialLoading) return <TablePageSkeleton title={false} kpiCards={0} columns={6} rows={6} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select
          selectedKeys={[filterStatus]}
          onSelectionChange={(keys) => setFilterStatus([...keys][0] || "ALL")}
          size="sm"
          className="w-48"
          aria-label="Filter by status"
        >
          {FILTER_STATUSES.map((s) => (
            <SelectItem key={s}>{s === "ALL" ? "All Transactions" : s}</SelectItem>
          ))}
        </Select>
        <MinimalButton variant="ghost" size="sm" icon={<Printer size={16} />} onClick={handlePrint}>
          Print
        </MinimalButton>
      </div>

      {/* Table */}
      {loadError ? (
        <ErrorState onRetry={load} error={loadError} title={t('toast.error.failedToLoad') || 'Failed to load transactions'} />
      ) : (
        <Card padding="none" elevation="raised" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 border-b border-divider">
                  {["Item", "Category", "Qty", "Rate (₹)", "Total (₹)", "Vendor", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={loading ? "opacity-50 pointer-events-none" : ""}>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon={Receipt} title="No purchase transactions found" />
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const rate = item.actualCost ?? item.estimatedCost;
                    const total = safeLineTotal(item.quantity, rate);
                    return (
                      <tr key={item._id} className="border-b border-divider hover:bg-surface-hover">
                        <td className="px-4 py-3 font-medium text-fg">{item.itemName}</td>
                        <td className="px-4 py-3">
                          {item.category ? (
                            <Badge color="neutral" size="sm">{item.category.replace(/_/g, " ")}</Badge>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-fg">{item.quantity ?? "—"}</td>
                        <td className="px-4 py-3 text-fg">
                          {rate != null ? rate.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-fg">
                          {rate != null ? `₹${total.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-fg-muted">{item.vendorId?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge color={statusBadgeColor[item.status] || 'neutral'} size="sm">{item.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-fg-muted">
                          {item.updatedAt ? formatShortDate(item.updatedAt) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border-token bg-surface-2">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-fg text-right">
                      Grand Total
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-fg">
                      ₹{grandTotal.toLocaleString()}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
