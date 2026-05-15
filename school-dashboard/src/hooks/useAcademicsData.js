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

/**
 * Phase 11 main academics hook. Fetches exams scoped by academic year +
 * derives KPI cells. Filter helpers stay pure for testing.
 */
export default function useAcademicsData({ status = "all", search = "" } = {}) {
  const { selectedAcademicYear, currentAcademicYear } = useApp();
  const academicYear = selectedAcademicYear || currentAcademicYear;

  const examsQuery = useQuery({
    queryKey: ["academics-exams", academicYear || "default"],
    queryFn: async () => {
      const res = await examsApi.getAll({ academicYear });
      return Array.isArray(res) ? res : res?.data || res?.exams || [];
    },
    placeholderData: (prev) => prev,
  });

  const exams = examsQuery.data || [];
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
