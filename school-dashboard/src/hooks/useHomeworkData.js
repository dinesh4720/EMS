import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { homeworkApi } from "../services/api";

// PAG-08 — homework dashboard data hook.
// Server-paginated list + server-computed KPI stats so the dashboard stays
// correct beyond the first page. Mirrors the useFeesData shape (SCH-99) so
// the page renders the same way for the four stat cards and the card grid.
//
// Pure helpers are exported alongside the hook so they can be unit-tested
// without React.
//
// Usage:
//   const { homework, stats, pagination, isLoading, refetch } =
//     useHomeworkData({ page: 1, limit: 25, search: "", status: "all", classId: "all" });

// Build the query params for GET /homework, omitting empty values so we
// never send `search=undefined` or a blank `status`. Page/limit drive
// server-side pagination; search is matched server-side so older homework
// on later pages is still findable.
export function buildHomeworkListParams({
  page = 1,
  limit = 25,
  search = "",
  status = "all",
  classId = "all",
} = {}) {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const q = String(search || "").trim();
  if (q) params.search = q;
  if (status && status !== "all") params.status = status;
  if (classId && classId !== "all") params.classId = classId;
  return params;
}

// Build the filter set for GET /homework/stats. Stats share the same
// filters as the table so the cards and the rows never disagree — but
// `page`/`limit` are intentionally NOT sent to the stats endpoint.
export function buildHomeworkStatsParams({ search = "", status = "all", classId = "all" } = {}) {
  const params = {};
  const q = String(search || "").trim();
  if (q) params.search = q;
  if (status && status !== "all") params.status = status;
  if (classId && classId !== "all") params.classId = classId;
  return params;
}

// Compute the four KPI counts from a single page of homework. Used as a
// fallback while the server-computed stats are loading (or if they error
// out) so the dashboard never shows zeroed-out cards. Matches the
// "overdue" definition used by the page: status='active' AND dueDate
// already in the past.
export function computeHomeworkStats(homework, now = new Date()) {
  const list = Array.isArray(homework) ? homework : [];
  const counts = { total: 0, active: 0, completed: 0, cancelled: 0, overdue: 0 };
  for (const hw of list) {
    counts.total += 1;
    if (hw && hw.status in counts) counts[hw.status] += 1;
    if (
      hw &&
      hw.status === "active" &&
      hw.dueDate &&
      new Date(hw.dueDate) < now
    ) {
      counts.overdue += 1;
    }
  }
  return counts;
}

export default function useHomeworkData({
  page = 1,
  limit = 25,
  search = "",
  status = "all",
  classId = "all",
} = {}) {
  const listParams = buildHomeworkListParams({ page, limit, search, status, classId });
  const statsParams = buildHomeworkStatsParams({ search, status, classId });

  const listQuery = useQuery({
    queryKey: ["homework-list", listParams],
    queryFn: () => homeworkApi.getAll(listParams),
    placeholderData: (prev) => prev,
    select: (res) => ({
      data: res?.data ?? [],
      pagination: res?.pagination ?? null,
    }),
  });

  const statsQuery = useQuery({
    queryKey: ["homework-stats", statsParams],
    queryFn: () => homeworkApi.getStats(statsParams),
    placeholderData: (prev) => prev,
  });

  const listResult = listQuery.data || { data: [], pagination: null };
  const homework = listResult.data;
  const pagination = listResult.pagination;

  const stats = useMemo(() => {
    const summary = statsQuery.data;
    if (summary && typeof summary === "object" && "total" in summary) {
      return {
        total: Number(summary.total) || 0,
        active: Number(summary.active) || 0,
        completed: Number(summary.completed) || 0,
        cancelled: Number(summary.cancelled) || 0,
        overdue: Number(summary.overdue) || 0,
      };
    }
    // Fallback while the stats load or if they error out — derived from the
    // current page (under-counts, but never blocks the UI).
    return computeHomeworkStats(homework);
  }, [statsQuery.data, homework]);

  const refetch = () => {
    listQuery.refetch();
    statsQuery.refetch();
  };

  return {
    homework,
    stats,
    pagination,
    isLoading: listQuery.isPending,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError || statsQuery.isError,
    error: listQuery.error || statsQuery.error,
    refetch,
  };
}
