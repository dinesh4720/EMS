import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import { FileDown, RotateCcw, ClipboardList } from "lucide-react";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";
import { auditLogsApi, requestBlob } from "../../services/api";
import { PageShell } from "../../components/ui";
import Drawer from "../../components/ui/Drawer";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/common/Pagination";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import logger from "../../utils/logger";
import AuditLogListRow from "./AuditLogListRow";
import AuditLogDetail from "./AuditLogDetail";
import AuditLogFilters from "./AuditLogFilters";

// Mobile breakpoint — below this the right pane collapses to a Drawer
const MOBILE_MAX = 1099;

export default function AuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id") || null;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_MAX : false
  );

  const listRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= MOBILE_MAX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Debounce the search input so we only refetch when typing pauses
  // (300ms — matches typical UX and avoids one fetch per keystroke).
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const buildParams = useCallback(() => {
    const params = { page, limit: pageSize };
    const trimmed = searchQuery.trim();
    if (trimmed) params.search = trimmed;
    if (filters.action) params.action = filters.action;
    if (filters.entity) params.entity = filters.entity;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  }, [page, pageSize, filters, searchQuery]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = buildParams();
      const data = await auditLogsApi.getLogs(params);
      setLogs(data.logs || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      logger.error("Failed to load audit logs:", err);
      setError(err);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // When a new server-side search term arrives, drop the user back on page 1
  // so they don't land on an empty page that no longer matches the filter.
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

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

  const handleFilterChange = useCallback((updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }, []);

  const handleExport = useCallback(
    async (format) => {
      try {
        setExporting(true);
        const params = { format, ...filters };
        const trimmedSearch = searchQuery.trim();
        if (trimmedSearch) params.search = trimmedSearch;
        const qs = new URLSearchParams(params).toString();
        const endpoint = `/audit-logs/export${qs ? `?${qs}` : ""}`;
        const response = await requestBlob(endpoint);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date().toISOString().split("T")[0];
        const ext = format === "csv" ? "csv" : "json";
        link.href = blobUrl;
        link.download = `audit-logs-${date}.${ext}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        toast.success(`${format.toUpperCase()} export ready`);
      } catch (err) {
        logger.error("Export failed:", err);
        toast.error(err?.message || "Export failed");
      } finally {
        setExporting(false);
      }
    },
    [filters, searchQuery]
  );

  // The server now applies the search filter, so the visible list is exactly
  // what the API returned for the current page/filters/search.
  const visible = logs;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const selectedLog = useMemo(
    () => logs.find((logItem) => logItem._id === selectedId) || null,
    [logs, selectedId]
  );

  const detailVisible = !!selectedLog;
  const showClearButton =
    searchQuery || filters.action || filters.entity || filters.startDate || filters.endDate;

  return (
    <PageShell
      title="Audit Logs"
      description={
        loading
          ? "Loading…"
          : `${total.toLocaleString()} ${showClearButton ? "matching " : ""}records`
      }
      actions={
        <>
          <Button
            size="sm"
            variant="flat"
            isLoading={exporting}
            onPress={() => handleExport("csv")}
            startContent={<FileDown size={14} />}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="flat"
            isLoading={exporting}
            onPress={() => handleExport("json")}
            startContent={<FileDown size={14} />}
          >
            Export JSON
          </Button>
        </>
      }
      toolbar={
        <>
          <div className="toolbar">
            <ToolbarSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search logs…"
              ariaLabel="Search audit logs"
              style={{ marginLeft: "auto", flex: "0 1 280px", minWidth: 0 }}
            />
            {showClearButton && (
              <Button
                size="sm"
                variant="flat"
                onPress={handleResetFilters}
                startContent={<RotateCcw size={14} />}
              >
                Reset
              </Button>
            )}
          </div>
          <AuditLogFilters
            filters={filters}
            onChange={handleFilterChange}
          />
        </>
      }
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Audit Logs" }]}
      bodyPadding="none"
      scrollable={false}
    >
      <div
        style={
          isMobileViewport
            ? { display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }
            : {
                display: "grid",
                gridTemplateColumns: "minmax(420px, 1fr) 380px",
                gap: 0,
                minHeight: 0,
                flex: 1,
              }
        }
      >
        {/* Left list */}
        <div
          style={{
            borderRight: isMobileViewport ? "none" : "1px solid var(--divider)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* List rows */}
          <div
            ref={listRef}
            role="listbox"
            aria-label="Audit logs list"
            tabIndex={0}
            style={{
              flex: 1,
              overflow: "auto",
              outline: "none",
              minHeight: 0,
            }}
          >
            {loading ? (
              <div style={{ padding: 16 }}>
                <TablePageSkeleton />
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={logs.length === 0 ? "No audit logs yet" : "No logs matched"}
                description={
                  logs.length === 0
                    ? "Activity will appear here once users perform actions."
                    : "Try adjusting your filters or search query."
                }
                action={
                  logs.length === 0 ? null : (
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={handleResetFilters}
                      startContent={<RotateCcw size={14} />}
                    >
                      Clear filters
                    </Button>
                  )
                }
                size="md"
              />
            ) : (
              visible.map((log) => (
                <AuditLogListRow
                  key={log._id}
                  log={log}
                  isActive={selectedId === log._id}
                  onSelect={() => setSelectedId(log._id)}
                />
              ))
            )}
          </div>

          {/* Pagination footer */}
          {!loading && visible.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-2 border-t"
              style={{ borderColor: "var(--divider)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                  Show
                </span>
                <select
                  className="h-7 px-2 rounded-md border text-sm bg-surface text-fg focus:outline-none focus:ring-1"
                  style={{ borderColor: "var(--border-token)" }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="Items per page"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                  per page
                </span>
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={total}
                itemLabel="logs"
              />
            </div>
          )}
        </div>

        {/* Right detail pane — desktop only inline */}
        {!isMobileViewport && (
          <AuditLogDetail log={selectedLog} onClose={() => setSelectedId(null)} />
        )}

        {/* Mobile: slide-over drawer for detail */}
        {isMobileViewport && (
          <Drawer
            isOpen={detailVisible}
            onClose={() => setSelectedId(null)}
            title="Audit log detail"
            size="md"
            placement="right"
          >
            <AuditLogDetail
              log={selectedLog}
              isMobile
              onClose={() => setSelectedId(null)}
            />
          </Drawer>
        )}
      </div>
    </PageShell>
  );
}
