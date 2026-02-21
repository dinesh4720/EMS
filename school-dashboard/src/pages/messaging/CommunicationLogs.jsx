import { useState, useMemo, useEffect, useRef } from "react";
import { Avatar, Spinner, Tooltip } from "@heroui/react";
import {
  Search,
  X,
  Mail,
  Phone,
  Check,
  XCircle,
  Inbox,
  MessageSquare,
  Clock,
  ArrowDown,
} from "lucide-react";
import { communicationLogs } from "../../data/mockData";

const statusStyles = {
  delivered: {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    border: "border-emerald-200 dark:border-emerald-500/30",
    icon: Check,
  },
  failed: {
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    border: "border-rose-200 dark:border-rose-500/30",
    icon: XCircle,
  },
};

const typeStyles = {
  SMS: {
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/15",
    border: "border-indigo-200 dark:border-indigo-500/30",
    icon: Phone,
  },
  Email: {
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    border: "border-violet-200 dark:border-violet-500/30",
    icon: Mail,
  },
};

export default function CommunicationLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLogs = useMemo(() => {
    return communicationLogs.filter((log) => {
      const matchSearch =
        log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.student.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === "all" || log.type.toLowerCase() === filterType;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [searchQuery, filterType, filterStatus]);

  // Lazy loading state
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  const visibleLogs = useMemo(
    () => filteredLogs.slice(0, visibleCount),
    [filteredLogs, visibleCount]
  );

  const hasMore = visibleCount < filteredLogs.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, filterType, filterStatus]);

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Modern Filter Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800/80 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          {/* Enhanced Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search by recipient or student..."
              className="w-full pl-11 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-transparent rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-800 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center p-1 mr-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X size={14} className="text-gray-400 dark:text-zinc-500" />
              </button>
            )}
          </div>

          {/* Filter Button Groups */}
          <div className="flex items-center gap-3">
            {/* Type Filter Group */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
              <span className="px-2 text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Type
              </span>
              <div className="flex items-center gap-0.5">
                {["all", "sms", "email"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === type
                        ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter Group */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
              <span className="px-2 text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Status
              </span>
              <div className="flex items-center gap-0.5">
                {["all", "delivered", "failed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterStatus === status
                        ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800/80 overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-zinc-800/50 dark:to-zinc-800/30 border-b border-gray-100 dark:border-zinc-800">
          <div className="col-span-4 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
            Recipient
          </div>
          <div className="col-span-1 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
            Type
          </div>
          <div className="col-span-4 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
            Message
          </div>
          <div className="col-span-1 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-2 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
            Date
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-50 dark:divide-zinc-800/50">
          {visibleLogs.map((log, index) => {
            const typeStyle = typeStyles[log.type] || typeStyles.SMS;
            const statusStyle = statusStyles[log.status] || statusStyles.delivered;
            const StatusIcon = statusStyle.icon;
            const TypeIcon = typeStyle.icon;

            return (
              <div
                key={log.id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50 group animate-in slide-in-from-bottom-2 duration-300 ${
                  index % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-gray-50/30 dark:bg-zinc-900/50"
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Recipient Cell */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      src={`https://i.pravatar.cc/150?u=${log.id}`}
                      size="sm"
                      className="w-9 h-9 ring-2 ring-white dark:ring-zinc-800 shadow-sm transition-transform group-hover:scale-105"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                      log.type === "SMS" ? "bg-indigo-500" : "bg-violet-500"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {log.recipient}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      Student: {log.student}
                    </p>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="col-span-1 flex items-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${typeStyle.bg} ${typeStyle.color} ${typeStyle.border}`}
                  >
                    <TypeIcon size={12} />
                    {log.type}
                  </span>
                </div>

                {/* Message Cell with Tooltip */}
                <div className="col-span-4 flex items-center">
                  <Tooltip content={log.message} placement="top" closeDelay={0}>
                    <p className="text-sm text-gray-600 dark:text-zinc-300 truncate cursor-default max-w-full">
                      {log.message}
                    </p>
                  </Tooltip>
                </div>

                {/* Status Badge */}
                <div className="col-span-1 flex items-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}
                  >
                    <StatusIcon size={12} strokeWidth={2.5} />
                    {log.status}
                  </span>
                </div>

                {/* Date Cell */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
                    {log.date.split(" ")[0]}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                    <Clock size={10} />
                    {log.date.split(" ")[1]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {visibleLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Inbox size={28} className="text-gray-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              No communication logs found
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Load More Indicator */}
        <div
          ref={loaderRef}
          className="flex flex-col items-center justify-center py-6 border-t border-gray-100 dark:border-zinc-800"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
              <Spinner size="sm" color="current" />
              <span className="text-xs font-medium">Loading more...</span>
            </div>
          )}
          {!hasMore && filteredLogs.length > ITEMS_PER_LOAD && (
            <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-500">
              <div className="w-8 h-px bg-gray-200 dark:bg-zinc-700" />
              <span className="text-xs font-medium">
                All {filteredLogs.length} logs loaded
              </span>
              <div className="w-8 h-px bg-gray-200 dark:bg-zinc-700" />
            </div>
          )}
          {!hasMore && filteredLogs.length <= ITEMS_PER_LOAD && filteredLogs.length > 0 && (
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500">
              <MessageSquare size={12} />
              <span className="text-xs">{filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
