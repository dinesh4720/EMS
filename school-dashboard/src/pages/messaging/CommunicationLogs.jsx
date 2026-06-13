import { useState, useEffect, useRef, useMemo } from "react";
import {
  Mail, MessageSquare, Bell, Send, CheckCircle2,
  Users, Calendar, Search, X, ChevronLeft, ChevronRight,
  AlertCircle, BarChart2,
} from "lucide-react";
import { announcementsApi } from "../../services/api";
import toast from "react-hot-toast";
import { SkeletonList } from "../../components/ui/Skeleton";

const CHANNEL_CONFIG = {
  email: { label: "Email", icon: Mail, color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300", dot: "bg-blue-500" },
  sms: { label: "SMS", icon: MessageSquare, color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300", dot: "bg-green-500" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", dot: "bg-emerald-500" },
  inapp: { label: "In-App", icon: Bell, color: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300", dot: "bg-purple-500" },
};

const PAGE_SIZE = 15;

function getRecipientsLabel(recipients) {
  if (!recipients?.length) return "—";
  if (recipients.some((r) => r.type === "all")) return "Whole School";
  return recipients.map((r) => r.type.charAt(0).toUpperCase() + r.type.slice(1)).join(", ");
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
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
  const cfg = CHANNEL_CONFIG[channel.type] || CHANNEL_CONFIG.inapp;
  const Icon = cfg.icon;
  const delivered = channel.stats?.deliveredCount ?? 0;
  const sent = channel.stats?.sentCount ?? 0;
  const failed = channel.stats?.failedCount ?? 0;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
      <Icon size={11} />
      <span>{cfg.label}</span>
      {sent > 0 && (
        <span className="opacity-70">
          · {delivered}/{sent}
          {failed > 0 && <span className="text-red-500 dark:text-red-400"> ({failed} failed)</span>}
        </span>
      )}
    </div>
  );
}

export default function CommunicationLogs() {
  const mountedRef = useRef(true);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ sentThisMonth: 0, totalDelivered: 0, scheduled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => { mountedRef.current = false; };
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [announcementsRes, statsRes] = await Promise.all([
        announcementsApi.getAll({ status: "sent", limit: 200 }),
        announcementsApi.getStats(),
      ]);
      if (!mountedRef.current) return;
      const list = announcementsRes?.announcements ?? (Array.isArray(announcementsRes) ? announcementsRes : []);
      setAnnouncements(list);
      setStats(statsRes ?? { sentThisMonth: 0, totalDelivered: 0, scheduled: 0 });
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err?.message || "Failed to load communication logs";
      setError(msg);
      toast.error(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);

    return announcements.filter((a) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = !search ||
        a.title?.toLowerCase().includes(search) ||
        a.content?.toLowerCase().includes(search);

      const matchesChannel = channelFilter === "all" ||
        a.channels?.some((c) => c.type === channelFilter);

      const date = new Date(a.sentAt || a.createdAt);
      const matchesDate =
        dateFilter === "all" ? true :
        dateFilter === "today" ? date >= today :
        dateFilter === "week" ? date >= weekAgo :
        date >= monthAgo;

      return matchesSearch && matchesChannel && matchesDate;
    });
  }, [announcements, searchQuery, channelFilter, dateFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSearchQuery(""); setChannelFilter("all"); setDateFilter("all"); setPage(1);
  };
  const hasFilters = searchQuery || channelFilter !== "all" || dateFilter !== "all";

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={`log-skel-${i}`} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
      <div className="animate-in fade-in duration-300 motion-reduce:animate-none">
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
              onClick={loadData}
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
    <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
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
          label="Total Campaigns"
          value={announcements.length.toLocaleString()}
          icon={BarChart2}
          color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          sub="sent announcements"
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
              placeholder="Search by title or content…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
            />
          </div>

          {/* Channel filter */}
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="inapp">In-App</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
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
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* List */}
        {paginated.length === 0 ? (
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
            {paginated.map((a) => (
              <li key={a._id} className="flex flex-col gap-3 p-4 hover:bg-surface-2/50 transition-colors sm:flex-row sm:items-start sm:gap-4">
                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Send size={15} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{a.title}</p>
                  </div>

                  {a.content && (
                    <p className="text-xs text-fg-muted line-clamp-1">{a.content}</p>
                  )}

                  {/* Channels */}
                  {a.channels?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.channels.map((ch, i) => (
                        <ChannelBadge key={`${ch.type}-${i}`} channel={ch} />
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-fg-faint">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {getRecipientsLabel(a.recipients)}
                    </span>
                    {a.analytics?.totalRecipients > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        {a.analytics.deliveredCount ?? 0}/{a.analytics.totalRecipients} delivered
                        {a.analytics.failedCount > 0 && (
                          <span className="text-red-400"> · {a.analytics.failedCount} failed</span>
                        )}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(a.sentAt || a.createdAt)}
                    </span>
                    {a.createdBy?.name && (
                      <span>by {a.createdBy.name}</span>
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
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
