import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import useAcademicsData from "../../hooks/useAcademicsData";
import AcademicsKpiStrip from "../../components/academics/AcademicsKpiStrip";
import ExamsTable from "../../components/academics/ExamsTable";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import { PageShell } from "../../components/ui";

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
  const { filtered, kpis, isLoading } = useAcademicsData({ status, search });

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

  const toolbar = (
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
  );

  return (
    <PageShell
      title="Academics"
      description={`${todayLabel} · ${kpis.upcomingCount} upcoming · ${kpis.publishedCount} published`}
      actions={
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
      }
      toolbar={toolbar}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Academics" },
      ]}
      bodyPadding="none"
    >
      <div className="academics-page" style={{ paddingBottom: 24 }}>
        <AcademicsKpiStrip kpis={kpis} />

        {isLoading ? (
          <div className="academics-table">
            <div className="academics-table__empty">Loading exams…</div>
          </div>
        ) : (
          <ExamsTable rows={filtered} onEnterResults={onEnterResults} />
        )}
      </div>
    </PageShell>
  );
}
