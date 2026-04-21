import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Chip, Select, SelectItem, Skeleton } from "@heroui/react";
import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { billingApi } from "../../services/api";
import { formatDate } from "../../utils/dateFormatter";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { key: "all", label: "All statuses" },
  { key: "draft", label: "Draft" },
  { key: "issued", label: "Issued" },
  { key: "paid", label: "Paid" },
  { key: "failed", label: "Failed" },
  { key: "void", label: "Void" },
];

const STATUS_COLOR_MAP = {
  paid: "success",
  issued: "primary",
  draft: "default",
  failed: "danger",
  void: "warning",
};

const PAGE_SIZE = 10;

export default function InvoiceHistory({ formatMoney }) {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const params = { page, limit: PAGE_SIZE };
    if (statusFilter !== "all") params.status = statusFilter;
    billingApi.getInvoices(params)
      .then((data) => {
        if (ignore) return;
        setInvoices(data.invoices || []);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      })
      .catch((error) => {
        if (!ignore) toast.error(error.message || "Failed to load invoices");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, [page, statusFilter, refreshKey]);

  const handleFilterChange = (keys) => {
    const value = Array.from(keys)[0] || "all";
    setStatusFilter(value);
    setPage(1);
  };

  const handleDownloadPdf = async (invoiceNumber) => {
    setDownloadingId(invoiceNumber);
    try {
      await billingApi.downloadInvoicePdf(invoiceNumber);
    } catch (error) {
      toast.error(error.message || "Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMarkPaid = async (invoiceNumber) => {
    setMarkingPaidId(invoiceNumber);
    try {
      await billingApi.markInvoicePaid(invoiceNumber);
      toast.success("Invoice marked as paid");
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(error.message || "Failed to mark invoice as paid");
    } finally {
      setMarkingPaidId(null);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={`skeleton-${i}`} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} />
          <h3 className="text-lg font-semibold text-gray-900">
            {t("settings.subscription.invoiceHistory", "Invoice History")}
          </h3>
          <Chip size="sm" variant="flat">{total}</Chip>
        </div>
        <Select
          size="sm"
          className="w-40"
          selectedKeys={new Set([statusFilter])}
          onSelectionChange={handleFilterChange}
          aria-label={t('aria.menus.filterByStatus')}
        >
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.key}>{opt.label}</SelectItem>
          ))}
        </Select>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-8 text-center">
          <FileText size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">
            {statusFilter !== "all"
              ? t("settings.subscription.noFilteredInvoices", "No invoices match the selected filter.")
              : t("settings.subscription.noInvoices", "No invoices yet. A record will appear here after checkout is created.")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="rounded-lg border border-gray-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {invoice.planKey} &middot; {invoice.billingCycle} &middot; {formatDate(invoice.createdAt)}
                  </p>
                  {invoice.periodStartsAt && invoice.periodEndsAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Period: {formatDate(invoice.periodStartsAt)} &ndash; {formatDate(invoice.periodEndsAt)}
                    </p>
                  )}
                </div>
                <Chip size="sm" variant="flat" color={STATUS_COLOR_MAP[invoice.status] || "default"}>
                  {invoice.status}
                </Chip>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {formatMoney(invoice.amount, invoice.currency)}
                </span>
                <div className="flex items-center gap-2">
                  {invoice.status === "issued" && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="success"
                      isLoading={markingPaidId === invoice.invoiceNumber}
                      onPress={() => handleMarkPaid(invoice.invoiceNumber)}
                    >
                      Mark paid
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Download size={14} />}
                    isLoading={downloadingId === invoice.invoiceNumber}
                    onPress={() => handleDownloadPdf(invoice.invoiceNumber)}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages} ({total} invoices)
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              aria-label="Previous page"
              isDisabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              aria-label="Next page"
              isDisabled={page >= totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
