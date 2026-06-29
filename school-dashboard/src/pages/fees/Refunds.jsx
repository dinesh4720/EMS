import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import useBulkSelection from "../../hooks/useBulkSelection";
import { useDebounce } from "../../hooks/useDebounce";
import { feesApi } from "../../services/api";
import { useCurrency } from "../../context/hooks/useCurrency";
import ErrorState from "../../components/ui/ErrorState";
import { PageShell } from "../../components/ui";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import logger from "../../utils/logger";
import RefundDetailPane from "./RefundDetailPane";
import RefundsToolbar from "./RefundsToolbar";
import RefundsList from "./RefundsList";
import RefundsCreateModal from "./RefundsCreateModal";
import RefundsRejectModal from "./RefundsRejectModal";
import { downloadRefundCsv } from "./refundDownload";

const MOBILE_MAX = 1099;
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;
// Preload a 200px margin below the viewport so the next page starts to load
// before the user hits the bottom of the list.
const OBSERVER_ROOT_MARGIN = "0px 0px 200px 0px";

// Build the query params for GET /fees/refunds. `search` and `status` are
// applied server-side (PAG-17) so refunds beyond the first page are still
// filtered. Empty / "all" values are omitted to keep the URL clean.
function buildRefundsParams({ search, status, page, limit }) {
  const params = {};
  const q = String(search || "").trim();
  if (q) params.search = q;
  if (status && status !== "all") params.status = status;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  return params;
}

export default function Refunds() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Search runs server-side; debounce so we don't refetch on every keystroke.
  const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  // Server-backed infinite scroll state (PAG-17). `refunds` accumulates every
  // page fetched so far; `pagination.total` is the FULL filtered count for
  // the count chip and bulk-selection "all matching" semantics.
  const [refunds, setRefunds] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // KPI cards come from the /refunds/summary aggregate so they reflect the
  // FULL filtered dataset, not just the rows currently loaded.
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    processedCount: 0,
    rejectedCount: 0,
  });

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRefund, setRejectingRefund] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  // [STUB-01] Snapshot of the bulk selection at the moment the user clicks
  // "Reject" in the BulkActionBar. Non-null only while the bulk-reject modal
  // is open; lets handleConfirmReject() branch into the bulk path.
  const [bulkRejectSelection, setBulkRejectSelection] = useState(null);
  // [STUB-01] Sentinel id for the existing actionLoading state — when set, the
  // reject modal's "isProcessing" check (actionLoading === refundId) treats the
  // bulk operation as in-flight, disabling the modal buttons until it resolves.
  const BULK_REJECT_ID = "__bulk__";
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [newRefundOpen, setNewRefundOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id") || null;

  const setSelectedId = useCallback(
    (id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("id", id);
          else next.delete("id");
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_MAX : false
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= MOBILE_MAX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch a single page from the server. Returns `{ refunds, pagination }`
  // or throws — the caller decides how to surface the error.
  const fetchPage = useCallback(
    async (page) => {
      const params = buildRefundsParams({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: PAGE_SIZE,
      });
      const res = await feesApi.getRefunds(params);
      return {
        refunds: Array.isArray(res?.refunds) ? res.refunds : [],
        pagination: res?.pagination ?? null,
      };
    },
    [debouncedSearch, statusFilter]
  );

  // Reload from page 1 — used on first mount, after every filter/search
  // change, and after any mutate action (approve/reject/process/create).
  // Replaces the loaded list and refreshes the KPI summary in parallel.
  const reload = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    currentPageRef.current = 1;
    try {
      const [pageRes, summaryRes] = await Promise.all([
        fetchPage(1),
        feesApi
          .getRefundsSummary(
            buildRefundsParams({
              search: debouncedSearch,
              status: statusFilter,
            })
          )
          .catch(() => null),
      ]);
      setRefunds(pageRes.refunds);
      setPagination(pageRes.pagination);
      if (summaryRes && typeof summaryRes === "object") {
        setSummary({
          totalAmount: Number(summaryRes.totalAmount) || 0,
          totalCount: Number(summaryRes.totalCount) || 0,
          pendingCount: Number(summaryRes.pendingCount) || 0,
          approvedCount: Number(summaryRes.approvedCount) || 0,
          processedCount: Number(summaryRes.processedCount) || 0,
          rejectedCount: Number(summaryRes.rejectedCount) || 0,
        });
      }
    } catch (error) {
      logger.error("Error fetching refunds:", error);
      setFetchError(error?.message || t("toast.error.failedToLoadRefunds"));
      toast.error(t("toast.error.failedToLoadRefunds"));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, debouncedSearch, statusFilter, t]);

  // Reset to page 1 whenever the debounced search or status filter changes.
  useEffect(() => {
    reload();
  }, [reload]);

  // ── Server-backed infinite scroll ───────────────────────────────────
  // IntersectionObserver triggers `loadMore()` when the sentinel scrolls into
  // view. Refs hold the latest values so the observer callback (attached once)
  // never reads stale state.
  const currentPageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const loaderRef = useRef(null);

  const hasMore = (pagination?.total ?? refunds.length) > refunds.length;

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;
    const next = (currentPageRef.current || 1) + 1;
    setIsLoadingMore(true);
    try {
      const res = await feesApi.getRefunds(
        buildRefundsParams({
          search: debouncedSearch,
          status: statusFilter,
          page: next,
          limit: PAGE_SIZE,
        })
      );
      const rows = Array.isArray(res?.refunds) ? res.refunds : [];
      currentPageRef.current = next;
      setRefunds((prev) => {
        // De-dupe in case the underlying dataset shifted between fetches
        // (a refund created/deleted while paginating could otherwise re-add
        // an already-loaded row).
        const seen = new Set(prev.map((r) => String(r._id)));
        return [...prev, ...rows.filter((r) => !seen.has(String(r._id)))];
      });
      setPagination(res?.pagination ?? null);
    } catch (error) {
      logger.error("Error loading more refunds:", error);
      toast.error(t("toast.error.failedToLoadRefunds"));
    } finally {
      setIsLoadingMore(false);
    }
  }, [debouncedSearch, statusFilter, t]);

  useEffect(() => {
    // The sentinel node only exists once the list (not the skeleton or error
    // state) is on the screen, so re-attach whenever the load state or the
    // loaded row count changes — not just when `loadMore`'s identity changes.
    if (loading) return;
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: OBSERVER_ROOT_MARGIN, threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, loading, refunds.length]);

  const handleApprove = async (refund) => {
    setActionLoading(refund._id);
    try {
      await feesApi.approveRefund(refund._id, {});
      toast.success(t("toast.success.refundApproved"));
      reload();
    } catch {
      toast.error(t("toast.error.failedToApproveRefund"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (refund) => {
    setRejectingRefund(refund);
    setRejectReason("");
    setBulkRejectSelection(null);
    setRejectModalOpen(true);
  };

  // [STUB-01] Open the reject modal in bulk mode: snapshot the current selection
  // so handleConfirmReject() can route the request through the bulk path.
  const handleBulkRejectClick = (sel) => {
    setRejectingRefund({ _id: BULK_REJECT_ID });
    setBulkRejectSelection(sel);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  // [STUB-01] Resolve the list of ids to act on. In "all matching" mode the
  // hook contract gives us selectedIds=null, so we fall back to the loaded
  // refunds list. Post-PAG-17 the server applies the active search/status
  // filter, so `refunds` already holds exactly the matching dataset the user
  // opted to operate on.
  const resolveBulkIds = (sel) => {
    if (!sel) return [];
    if (sel.allMatchingMode) {
      return refunds.map((r) => String(r._id));
    }
    return (sel.selectedIds || []).map(String);
  };

  // [STUB-01] Bulk approve: loop feesApi.approveRefund over the selection.
  // Uses Promise.allSettled so a single failure doesn't abort the rest of the
  // batch, and reports success / partial / total-failure via toast.
  const handleBulkApprove = async (sel) => {
    const ids = resolveBulkIds(sel);
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    const results = await Promise.allSettled(
      ids.map((id) => feesApi.approveRefund(id, {}))
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - ok;
    try {
      if (failed === 0) {
        toast.success(
          t(
            "toast.success.refundsApproved",
            `Approved ${ok} refund${ok === 1 ? "" : "s"}.`
          )
        );
      } else if (ok === 0) {
        const firstError = results.find((r) => r.status === "rejected");
        toast.error(
          firstError?.reason?.message ||
            t(
              "toast.error.failedToApproveRefunds",
              "Failed to approve refunds"
            )
        );
      } else {
        toast.success(
          t(
            "toast.success.refundsApprovedPartial",
            `Approved ${ok} refund${ok === 1 ? "" : "s"}, ${failed} failed.`
          )
        );
      }
    } finally {
      setBulkActionLoading(false);
      sel.clear();
      if (ok > 0) reload();
    }
  };

  // [STUB-01] Bulk reject: same loop pattern as approve, but each call needs
  // a reason — we collect one from the existing reject modal and apply it
  // uniformly to every selected refund.
  const handleBulkConfirmReject = async (reason) => {
    const sel = bulkRejectSelection;
    if (!sel) return;
    const ids = resolveBulkIds(sel);
    if (ids.length === 0) return;
    setActionLoading(BULK_REJECT_ID);
    const results = await Promise.allSettled(
      ids.map((id) => feesApi.rejectRefund(id, { rejectionReason: reason }))
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - ok;
    try {
      if (failed === 0) {
        toast.success(
          t(
            "toast.success.refundsRejected",
            `Rejected ${ok} refund${ok === 1 ? "" : "s"}.`
          )
        );
      } else if (ok === 0) {
        const firstError = results.find((r) => r.status === "rejected");
        toast.error(
          firstError?.reason?.message ||
            t(
              "toast.error.failedToRejectRefunds",
              "Failed to reject refunds"
            )
        );
      } else {
        toast.success(
          t(
            "toast.success.refundsRejectedPartial",
            `Rejected ${ok} refund${ok === 1 ? "" : "s"}, ${failed} failed.`
          )
        );
      }
    } finally {
      setActionLoading(null);
      setRejectModalOpen(false);
      setRejectingRefund(null);
      setBulkRejectSelection(null);
      setRejectReason("");
      sel.clear();
      if (ok > 0) reload();
    }
  };

  const handleConfirmReject = async () => {
    if (bulkRejectSelection) {
      await handleBulkConfirmReject(rejectReason.trim());
      return;
    }
    if (!rejectingRefund) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error(
        t("pages.pleaseEnterRejectionReason", "Please enter a rejection reason")
      );
      return;
    }
    setActionLoading(rejectingRefund._id);
    try {
      await feesApi.rejectRefund(rejectingRefund._id, { rejectionReason: reason });
      toast.success(t("toast.success.refundRejected", "Refund rejected"));
      setRejectModalOpen(false);
      setRejectingRefund(null);
      setBulkRejectSelection(null);
      setRejectReason("");
      reload();
    } catch (error) {
      toast.error(
        error?.message ||
          t("toast.error.failedToRejectRefund", "Failed to reject refund")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadRefund = (refund) => downloadRefundCsv(refund);

  const handleProcess = async (refund) => {
    setActionLoading(refund._id);
    try {
      await feesApi.processRefund(refund._id, {});
      toast.success(t("toast.success.refundProcessed"));
      reload();
    } catch {
      toast.error(t("toast.error.failedToProcessRefund"));
    } finally {
      setActionLoading(null);
    }
  };

  // Full filtered count (server-side total) — drives the count chip, the
  // "all refunds loaded" sentinel text, and bulk-selection "all matching".
  const totalMatching = pagination?.total ?? refunds.length;

  const visibleIds = useMemo(
    () => refunds.map((r) => String(r._id)),
    [refunds]
  );

  const selection = useBulkSelection({
    visibleIds,
    totalMatching,
  });

  const toggleCheck = useCallback(
    (refund, event) => selection.toggle(refund._id, event),
    [selection]
  );

  const selectedRefund = useMemo(() => {
    if (!selectedId) return null;
    return refunds.find((r) => String(r._id) === selectedId) || null;
  }, [selectedId, refunds]);

  useEffect(() => {
    if (isMobileViewport) return;
    if (selectedId) return;
    if (refunds.length === 0) return;
    const first = refunds[0];
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("id", String(first._id));
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileViewport, selectedId, refunds.length]);

  const listRef = useRef(null);
  const rowRefs = useRef(new Map());

  const moveSelection = useCallback(
    (delta) => {
      if (refunds.length === 0) return;
      const ids = refunds.map((r) => String(r._id));
      const currentIdx = ids.indexOf(selectedId);
      const nextIdx =
        currentIdx === -1
          ? delta > 0
            ? 0
            : refunds.length - 1
          : Math.min(refunds.length - 1, Math.max(0, currentIdx + delta));
      const nextRefund = refunds[nextIdx];
      if (!nextRefund) return;
      const nextId = String(nextRefund._id);
      setSelectedId(nextId);
      requestAnimationFrame(() => {
        rowRefs.current.get(nextId)?.scrollIntoView({ block: "nearest" });
        rowRefs.current.get(nextId)?.focus({ preventScroll: true });
      });
    },
    [refunds, selectedId, setSelectedId]
  );

  const handleListKeyDown = useCallback(
    (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
      } else if (e.key === "Escape") {
        if (selection.count > 0) return;
        e.preventDefault();
        setSelectedId(null);
      }
    },
    [moveSelection, setSelectedId, selection.count]
  );

  const closeDetail = () => setSelectedId(null);
  const detailVisible = !!selectedRefund;

  const drawerRef = useRef(null);
  const handleDrawerKeyDown = useCallback((e) => {
    if (e.key !== "Tab" || !drawerRef.current) return;
    const focusable = Array.from(
      drawerRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const pageContent = (
    <div
      className="page"
      style={
        isMobileViewport
          ? { display: "flex", flexDirection: "column", minHeight: 0 }
          : {
              display: "grid",
              gridTemplateColumns: "minmax(420px, 1fr) 380px",
              gap: 0,
              minHeight: 0,
            }
      }
    >
      <div
        style={{
          borderRight: isMobileViewport ? "none" : "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div className="refund-kpi">
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.totalRefunds")}</span>
            <span className="refund-kpi__value mono tnum">{fmt(summary.totalAmount)}</span>
          </div>
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.pending2")}</span>
            <span className="refund-kpi__value mono tnum">{summary.pendingCount}</span>
          </div>
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.approved1")}</span>
            <span className="refund-kpi__value mono tnum">{summary.approvedCount}</span>
          </div>
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.processed")}</span>
            <span className="refund-kpi__value mono tnum">{summary.processedCount}</span>
          </div>
          <div className="refund-kpi__cell">
            <span className="refund-kpi__label">{t("pages.rejected")}</span>
            <span className="refund-kpi__value mono tnum">{summary.rejectedCount}</span>
          </div>
        </div>

        <RefundsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenNewRefund={() => setNewRefundOpen(true)}
          selection={selection}
          totalMatching={totalMatching}
          t={t}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkRejectClick}
          bulkActionLoading={bulkActionLoading}
        />

        <RefundsList
          listRef={listRef}
          onListKeyDown={handleListKeyDown}
          visibleRefunds={refunds}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          selectedId={selectedId}
          selection={selection}
          toggleCheck={toggleCheck}
          onSelect={setSelectedId}
          rowRefs={rowRefs}
          loaderRef={loaderRef}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          totalMatching={totalMatching}
          currencyFmt={fmt}
          t={t}
        />
      </div>

      {!isMobileViewport && (
        <RefundDetailPane
          refund={selectedRefund}
          onClose={closeDetail}
          onApprove={handleApprove}
          onReject={handleReject}
          onProcess={handleProcess}
          onDownload={handleDownloadRefund}
          actionLoading={actionLoading}
          currencyFmt={fmt}
        />
      )}

      {isMobileViewport && detailVisible && (
        <div
          className="stafflist__drawer-overlay"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            ref={drawerRef}
            className="stafflist__drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Refund: ${selectedRefund?.studentId?.name || ""}`}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleDrawerKeyDown}
          >
            <RefundDetailPane
              refund={selectedRefund}
              isMobile
              onClose={closeDetail}
              onApprove={handleApprove}
              onReject={handleReject}
              onProcess={handleProcess}
              onDownload={handleDownloadRefund}
              actionLoading={actionLoading}
              currencyFmt={fmt}
            />
          </div>
        </div>
      )}

      <RefundsRejectModal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectingRefund(null);
          setBulkRejectSelection(null);
          setRejectReason("");
        }}
        onConfirm={handleConfirmReject}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        actionLoading={actionLoading}
        refundId={rejectingRefund?._id}
        t={t}
      />

      <RefundsCreateModal
        open={newRefundOpen}
        onClose={() => setNewRefundOpen(false)}
        onCreated={reload}
        t={t}
      />
    </div>
  );

  const refundsCrumbs = [
    { label: "Home", href: "/" },
    { label: "Fees", href: "/fees" },
    { label: t("pages.refunds", "Refunds") },
  ];
  const shellProps = {
    title: t("pages.refunds", "Refunds"),
    breadcrumbs: refundsCrumbs,
    bodyPadding: "none",
    scrollable: false,
  };

  if (loading) {
    return (
      <PageShell {...shellProps} description={t("pages.loading", "Loading...")}>
        <TablePageSkeleton kpiCards={5} columns={5} rows={8} />
      </PageShell>
    );
  }

  if (fetchError) {
    return (
      <PageShell
        {...shellProps}
        description={t("pages.somethingWentWrong", "Something went wrong")}
      >
        <ErrorState
          title={t("common.somethingWentWrong", "Something went wrong")}
          description={fetchError}
          retryLabel={t("common.tryAgain", "Try again")}
          onRetry={reload}
          size="lg"
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      {...shellProps}
      description={`${totalMatching} ${totalMatching === 1 ? "record" : "records"}`}
    >
      {pageContent}
    </PageShell>
  );
}
