import { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Chip } from "@heroui/react";
import { Eye, FileDown, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { auditLogsApi, requestBlob } from "../../services/api";
import DataTable from "../../components/ui/DataTable";

import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { getDateLocale } from "../../i18n";
import AuditLogFilters from "./AuditLogFilters";
import AuditLogDetail from "./AuditLogDetail";
import logger from "../../utils/logger";

const ACTION_CHIP_COLOR = {
  created: "success",
  updated: "primary",
  deleted: "danger",
  login: "success",
  logout: "default",
  login_failed: "danger",
  password_changed: "warning",
  permission_changed: "warning",
  settings_changed: "primary",
  role_changed: "warning",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return formatDate(dateStr);
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({});

  const buildParams = useCallback(() => {
    const params = { page, limit: pageSize };
    if (filters.action) params.action = filters.action;
    if (filters.entity) params.entity = filters.entity;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  }, [page, pageSize, filters]);

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

  const handleFilterChange = useCallback((updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedLog(row);
    setDetailOpen(true);
  }, []);

  const handleExport = useCallback(
    async (format) => {
      try {
        setExporting(true);
        const params = { format, ...filters };
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
    [filters]
  );

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        label: "Timestamp",
        sortable: true,
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-sm text-fg">{formatDate(row.createdAt)}</span>
            <span className="text-xs text-fg-muted">{formatRelative(row.createdAt)}</span>
          </div>
        ),
      },
      {
        key: "action",
        label: "Action",
        sortable: true,
        render: (row) => (
          <Chip
            size="sm"
            variant="flat"
            color={ACTION_CHIP_COLOR[row.action] || "default"}
            className="capitalize"
          >
            {row.action?.replace(/_/g, " ")}
          </Chip>
        ),
      },
      {
        key: "entity",
        label: "Entity",
        sortable: true,
        render: (row) => (
          <span className="text-sm text-fg capitalize">{row.entity || "—"}</span>
        ),
      },
      {
        key: "userName",
        label: "Performed By",
        sortable: true,
        accessor: (row) => row.userId?.name || row.userName || "—",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-fg">
              {row.userId?.name || row.userName || "—"}
            </span>
            {row.userId?.email && (
              <span className="text-xs text-fg-muted">{row.userId.email}</span>
            )}
          </div>
        ),
      },
      {
        key: "ipAddress",
        label: "IP Address",
        render: (row) => (
          <span className="text-sm text-fg font-mono">{row.ipAddress || "—"}</span>
        ),
      },
      {
        key: "path",
        label: "Path",
        render: (row) => (
          <span className="text-sm text-fg-muted truncate max-w-[200px] block">
            {row.path || "—"}
          </span>
        ),
      },
    ],
    []
  );

  const rowActions = useCallback(
    (row) => (
      <Button
        size="sm"
        variant="flat"
        onPress={() => handleRowClick(row)}
        startContent={<Eye size={14} />}
      >
        View
      </Button>
    ),
    [handleRowClick]
  );

  const emptyState = {
    title: "No audit logs found",
    description: "Try adjusting your filters or date range.",
    action: (
      <Button
        size="sm"
        variant="flat"
        onPress={handleResetFilters}
        startContent={<RotateCcw size={14} />}
      >
        Reset filters
      </Button>
    ),
  };

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-fg">Audit Logs</h2>
          <p className="text-sm text-fg-muted mt-1">
            Track all changes and activity across your school
          </p>
        </div>
        <TablePageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-fg">Audit Logs</h2>
          <p className="text-sm text-fg-muted mt-1">
            Track all changes and activity across your school
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <DataTable
        ariaLabel="Audit logs table"
        columns={columns}
        data={logs}
        keyField="_id"
        loading={loading}
        error={error}
        onRetry={fetchLogs}
        emptyState={emptyState}
        rowActions={rowActions}
        onRowClick={handleRowClick}
        serverMode
        page={page}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pagination
        defaultPageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        density="normal"
      />

      {/* Detail Drawer */}
      <AuditLogDetail
        log={selectedLog}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
