import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { billingApi } from "../../services/api";
import { formatDate } from "../../utils/dateFormatter";
import toast from "react-hot-toast";
import {
  Alert,
  Button,
  Chip,
  EmptyState,
  IconButton,
  SectionHeading,
  Select,
  Skeleton,
} from "../ui";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "void", label: "Void" },
];

const STATUS_COLOR_MAP = {
  paid: "success",
  issued: "info",
  draft: "neutral",
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
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    const params = { page, limit: PAGE_SIZE };
    if (statusFilter !== "all") params.status = statusFilter;
    billingApi.getInvoices(params)
      .then((data) => {
        if (ignore) return;
        setInvoices(data.invoices || []);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message || "Failed to load invoices");
        toast.error(err.message || "Failed to load invoices");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, [page, statusFilter, refreshKey]);

  const handleDownloadPdf = async (invoiceNumber) => {
    setDownloadingId(invoiceNumber);
    try {
      await billingApi.downloadInvoicePdf(invoiceNumber);
    } catch (err) {
      toast.error(err.message || "Failed to download PDF");
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
    } catch (err) {
      toast.error(err.message || "Failed to mark invoice as paid");
    } finally {
      setMarkingPaidId(null);
    }
  };

  return (
    <div>
      <SectionHeading
        icon={FileText}
        className="mb-4"
        actions={
          <Select
            size="sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            wrapperClassName="w-40"
            aria-label={t('aria.menus.filterByStatus')}
          />
        }
      >
        <span className="inline-flex items-center gap-2">
          {t("settings.subscription.invoiceHistory", "Invoice History")}
          <Chip size="sm" color="neutral">{total}</Chip>
        </span>
      </SectionHeading>

      {loading && invoices.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={`invoice-skeleton-${i}`} variant="rect" className="h-20" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="danger" title="Couldn't load invoices">{error}</Alert>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={statusFilter !== "all"
            ? t("settings.subscription.noFilteredInvoices", "No invoices match the selected filter.")
            : t("settings.subscription.noInvoices", "No invoices yet")}
          description={statusFilter === "all"
            ? "A record will appear here after a checkout is created."
            : undefined}
          size="md"
        />
      ) : (
        <ul className="space-y-3">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="rounded-lg border border-border-token bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg tabular-nums">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-fg-muted mt-0.5 tabular-nums">
                    {invoice.planKey} &middot; {invoice.billingCycle} &middot; {formatDate(invoice.createdAt)}
                  </p>
                  {invoice.periodStartsAt && invoice.periodEndsAt && (
                    <p className="text-xs text-fg-subtle mt-0.5 tabular-nums">
                      Period: {formatDate(invoice.periodStartsAt)} &ndash; {formatDate(invoice.periodEndsAt)}
                    </p>
                  )}
                </div>
                <Chip size="sm" color={STATUS_COLOR_MAP[invoice.status] || "neutral"}>
                  {invoice.status}
                </Chip>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-fg tabular-nums">
                  {formatMoney(invoice.amount, invoice.currency)}
                </span>
                <div className="flex items-center gap-2">
                  {invoice.status === "issued" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={markingPaidId === invoice.invoiceNumber}
                      onClick={() => handleMarkPaid(invoice.invoiceNumber)}
                    >
                      Mark paid
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Download size={14} />}
                    loading={downloadingId === invoice.invoiceNumber}
                    onClick={() => handleDownloadPdf(invoice.invoiceNumber)}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-fg-muted tabular-nums">
            Page {page} of {totalPages} ({total} invoices)
          </p>
          <div className="flex items-center gap-1">
            <IconButton
              aria-label="Previous page"
              icon={<ChevronLeft size={16} />}
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            />
            <IconButton
              aria-label="Next page"
              icon={<ChevronRight size={16} />}
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
