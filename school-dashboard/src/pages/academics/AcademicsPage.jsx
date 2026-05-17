import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import useAcademicsData from "../../hooks/useAcademicsData";
import AcademicsKpiStrip from "../../components/academics/AcademicsKpiStrip";
import ExamsTable from "../../components/academics/ExamsTable";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import { SkeletonTable } from "../../components/ui/Skeleton";
import ErrorState from "../../components/ui/ErrorState";

const VALID_FILTERS = new Set(["all", "upcoming", "drafts", "published", "completed"]);

// Phase 11 — top-level Academics page.
// Replaces PerformanceDashboard + ExamManagement landing.
// Single canonical surface: KPI strip + filterable exam list.
export default function AcademicsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (() => {
    const raw = searchParams.get("status");
    return VALID_FILTERS.has(raw) ? raw : "all";
  })();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const { filtered, kpis, isLoading, isError, error, refetch } = useAcademicsData({ status, search });

  const setStatus = (next) => {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === "all") out.delete("status");
        else out.set("status", next);
        return out;
      },
      { replace: false }
    );
  };

  const onEnterResults = (exam) => {
    if (!exam) return;
    const id = exam._id || exam.id;
    navigate(`/academics/exams/${id}/results`);
  };

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="page academics-page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Academics</h1>
          <div className="page__sub mono tnum">
            {todayLabel} · {kpis.upcomingCount} upcoming · {kpis.publishedCount} published
          </div>
        </div>
        <div className="row gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/academics/cbse-report-card")}
          >
            Report cards →
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => navigate("/academics/exams?new=1")}
          >
            <Plus size={13} aria-hidden /> New exam
          </button>
        </div>
      </div>

      <AcademicsKpiStrip kpis={kpis} />

      <div className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
        <ToolbarSearch
          value={search}
          onChange={setSearch}
          urlParam="q"
          placeholder="Search exams, subjects…"
          ariaLabel="Search exams"
          style={{ flex: 1, maxWidth: 360 }}
        />

        <div className="seg" role="tablist" aria-label="Filter exams">
          {[
            { key: "all", label: "All" },
            { key: "upcoming", label: "Upcoming" },
            { key: "drafts", label: "Drafts" },
            { key: "published", label: "Published" },
            { key: "completed", label: "Completed" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={status === f.key}
              className={`seg__btn${status === f.key ? " is-active" : ""}`}
              onClick={() => setStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load exams"
          error={error}
          onRetry={refetch}
        />
      ) : (
        <ExamsTable rows={filtered} onEnterResults={onEnterResults} />
      )}
    </div>
  );
}
