import { useState, useEffect, useRef, useMemo } from "react";
import {
  Mail, MessageSquare, Bell, Send, CheckCircle2,
  Users, Calendar, Search, X, ChevronLeft, ChevronRight,
  AlertCircle, BarChart2,
} from "lucide-react";
import { communicationLogsApi } from "../../services/api";
import toast from "react-hot-toast";
import { SkeletonList } from "../../components/ui/Skeleton";

const CHANNEL_CONFIG = {
  email: { label: "Email", icon: Mail, color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300", dot: "bg-blue-500" },
  sms: { label: "SMS", icon: MessageSquare, color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300", dot: "bg-green-500" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", dot: "bg-emerald-500" },
  inapp: { label: "In-App", icon: Bell, color: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300", dot: "bg-purple-500" },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  read: { label: "Read", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
};

const PAGE_SIZE = 15;

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex items-start gap-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-fg-muted">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-fg-faint">{sub}</p>}
      </div>
    </div>
  );
}

function ChannelBadge({ channel }) {
  const cfg = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.inapp;
  const Icon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
      <Icon size={11} />
      <span>{cfg.label}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function CommunicationLogs() {
  const mountedRef = useRef(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ sentThisMonth: 0, totalDelivered: 0, totalFailed: 0, totalSent: 0, scheduled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debounceRef = useRef(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dateFilter) {
      case "today":
        return { dateFrom: today.toISOString().split("T")[0], dateTo: today.toISOString().split("T")[0] };
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { dateFrom: weekAgo.toISOString().split("T")[0], dateTo: today.toISOString().split("T")[0] };
      }
      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { dateFrom: monthAgo.toISOString().split("T")[0], dateTo: today.toISOString().split("T")[0] };
      }
      default:
        return {};
    }
  }, [dateFilter]);

  const loadData = async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        ...(channelFilter !== "all" && { channel: channelFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...dateRange,
      };

      const [logsRes, statsRes] = await Promise.all([
        communicationLogsApi.getAll(params),
        communicationLogsApi.getStats(),
      ]);
      if (!mountedRef.current) return;

      setLogs(logsRes?.logs ?? []);
      setTotalPages(logsRes?.totalPages ?? 1);
      setTotal(logsRes?.total ?? 0);
      setStats(statsRes ?? { sentThisMonth: 0, totalDelivered: 0, totalFailed: 0, totalSent: 0, scheduled: 0 });
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err?.message || "Failed to load communication logs";
      setError(msg);
      toast.error(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadData(1);
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change, resetting to page 1
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadData(1);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, channelFilter, statusFilter, dateFilter]);

  // Refetch when page changes (filters already applied in loadData)
  useEffect(() => {
    loadData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const clearFilters = () => {
    setSearchQuery("");
    setChannelFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
    setPage(1);
  };
  const hasFilters = searchQuery || channelFilter !== "all" || statusFilter !== "all" || dateFilter !== "all";

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg animate-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-16 rounded animate-shimmer" />
                  <div className="h-4 w-24 rounded animate-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <SkeletonList items={6} subtitle />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm dark:border-red-500/20 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-md flex-col items-center text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle size={26} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load logs</h2>
              <p className="mt-1 text-sm text-fg-muted">{error}</p>
            </div>
            <button
              onClick={() => loadData(page)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Sent This Month"
          value={stats.sentThisMonth?.toLocaleString() ?? "0"}
          icon={Send}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
        />
        <StatCard
          label="Total Delivered"
          value={stats.totalDelivered?.toLocaleString() ?? "0"}
          icon={CheckCircle2}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          sub="across all channels"
        />
        <StatCard
          label="Total Communications"
          value={stats.totalSent?.toLocaleString() ?? total.toLocaleString()}
          icon={BarChart2}
          color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          sub="sent messages"
        />
      </div>

      {/* Log Table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-zinc-800">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" />
            <input
              type="text"
              placeholder="Search by recipient or subject…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
            />
          </div>

          {/* Channel filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="inapp">In-App</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <X size={13} /> Clear
            </button>
          )}

          <span className="ml-auto text-xs text-fg-faint">
            {total} {total === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* List */}
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
              <Send size={22} className="text-fg-faint" />
            </div>
            <p className="text-sm font-medium text-fg-muted">
              {hasFilters ? "No logs match your filters" : "No sent communications yet"}
            </p>
            <p className="text-xs text-fg-faint max-w-xs">
              {hasFilters
                ? "Try adjusting the search or filters above."
                : "Sent announcements via email, SMS, WhatsApp, or in-app will appear here."}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-divider">
            {logs.map((log) => (
              <li key={`${log._id}-${log.channel}`} className="flex flex-col gap-3 p-4 hover:bg-surface-2/50 transition-colors sm:flex-row sm:items-start sm:gap-4">
                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Send size={15} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{log.announcementTitle || log.subject || "—"}</p>
                    <ChannelBadge channel={log.channel} />
                    <StatusBadge status={log.status} />
                  </div>

                  {log.content && (
                    <p className="text-xs text-fg-muted line-clamp-1">{log.content}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-fg-faint">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {log.recipientName || log.name || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={11} />
                      {log.recipient || log.recipientEmail || log.recipientPhone || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(log.sentAt || log.createdAt)}
                    </span>
                    {log.userType && (
                      <span>{log.userType}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-xs text-fg-faint">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
