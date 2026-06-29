import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { examsApi } from "../services/api";
import { useApp } from "../context/AppContext";

// Phase 11 — Academics data + KPIs.
// Pure helpers exported for testing without React.

export const EXAM_STATUS = {
  SCHEDULED: "scheduled",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  PUBLISHED: "results_published",
  DRAFT: "draft",
};

// Filter chip → matching status set
const STATUS_FILTERS = {
  all: null,
  upcoming: ["scheduled", "ongoing"],
  drafts: ["draft", "scheduled"],
  published: ["results_published"],
  completed: ["completed", "results_published"],
};

// PAG-10: academics overview KPIs need ALL exams in the year, not just the
// first page. The backend now caps each response at 200, so we paginate
// through and concatenate. For schools with >200 exams/year this is still
// far cheaper than re-hydrating in the app shell (PAG-05 precedent).
const KPI_PAGE_LIMIT = 200;

export function deriveExamStatus(exam) {
  if (!exam) return EXAM_STATUS.SCHEDULED;
  return String(exam.status || "scheduled").toLowerCase();
}

export function summarizeExamKpis(exams) {
  const list = Array.isArray(exams) ? exams : [];
  let upcoming = 0;
  let publishedCount = 0;
  let totalAvgPct = 0;
  let avgCounted = 0;
  for (const e of list) {
    const s = deriveExamStatus(e);
    if (s === "scheduled" || s === "ongoing") upcoming += 1;
    if (s === "results_published") publishedCount += 1;
    if (typeof e.avgPercentage === "number") {
      totalAvgPct += e.avgPercentage;
      avgCounted += 1;
    }
  }
  return {
    upcomingCount: upcoming,
    publishedCount,
    averagePerformance: avgCounted > 0 ? totalAvgPct / avgCounted : null,
    totalCount: list.length,
  };
}

export function filterExams(exams, { status = "all", search = "" } = {}) {
  const list = Array.isArray(exams) ? exams : [];
  const wantedStatuses = STATUS_FILTERS[status] || null;
  const q = String(search || "").trim().toLowerCase();
  return list.filter((e) => {
    if (wantedStatuses && !wantedStatuses.includes(deriveExamStatus(e))) {
      return false;
    }
    if (q) {
      const hay = [e.name, e.subject, e.term, e.className]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// PAG-10: backend /exams now returns { data, pagination } in the body
// (was: bare array + X-Total-Count/X-Has-More headers that the request()
// wrapper couldn't surface). Normalize to a flat array of exams here so
// downstream consumers (KPIs, filter chips) don't need to know the shape.
function extractExamsPage(payload) {
  if (Array.isArray(payload)) return { items: payload, total: payload.length, hasMore: false };
  if (payload && Array.isArray(payload.data)) {
    return {
      items: payload.data,
      total: payload.pagination?.total ?? payload.data.length,
      hasMore: !!payload.pagination?.hasMore,
    };
  }
  if (payload && Array.isArray(payload.exams)) {
    // Pre-PAG-10 staff endpoint shape — keep it working.
    return { items: payload.exams, total: payload.total ?? payload.exams.length, hasMore: !!payload.hasMore };
  }
  return { items: [], total: 0, hasMore: false };
}

/**
 * Phase 11 main academics hook. Fetches exams scoped by academic year +
 * derives KPI cells. Filter helpers stay pure for testing.
 *
 * PAG-10: paginates the listing endpoint in chunks of KPI_PAGE_LIMIT so the
 * KPI strip never silently drops older exams because of the default limit=50.
 */
export default function useAcademicsData({ status = "all", search = "" } = {}) {
  const { selectedAcademicYear, currentAcademicYear } = useApp();
  const academicYear = selectedAcademicYear || currentAcademicYear;

  const examsQuery = useQuery({
    queryKey: ["academics-exams", academicYear || "default"],
    queryFn: async () => {
      const collected = [];
      let skip = 0;
      // Loop until the backend reports no more pages. Single in-flight call
      // per page keeps the dashboard responsive without hammer-loading the API.
      let hasMore = true;
      while (hasMore) {
        const res = await examsApi.getAll({
          academicYear,
          skip,
          limit: KPI_PAGE_LIMIT,
        });
        const page = extractExamsPage(res);
        collected.push(...page.items);
        hasMore = page.hasMore && page.items.length > 0;
        if (hasMore) skip += page.items.length;
      }
      return collected;
    },
    // PAG-10: keep a stable empty-array reference until the first page
    // resolves so downstream useMemo deps don't churn on every render.
    placeholderData: (prev) => prev ?? [],
    initialData: [],
  });

  const exams = examsQuery.data;
  const kpis = useMemo(() => summarizeExamKpis(exams), [exams]);
  const filtered = useMemo(
    () => filterExams(exams, { status, search }),
    [exams, status, search]
  );

  return {
    exams,
    filtered,
    kpis,
    isLoading: examsQuery.isPending,
    refetch: examsQuery.refetch,
  };
}
