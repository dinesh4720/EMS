import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, FileText } from "lucide-react";

import useAcademicsData from "../../hooks/useAcademicsData";
import AcademicsKpiStrip from "../../components/academics/AcademicsKpiStrip";
import ExamsTable from "../../components/academics/ExamsTable";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import { PageShell, EmptyState } from "../../components/ui";

const VALID_FILTERS = new Set(["all", "upcoming", "drafts", "published", "completed"]);

// Phase 11 — top-level Academics page.
// Replaces PerformanceDashboard + ExamManagement landing.
// Single canonical surface: KPI strip + filterable exam list.
export default function AcademicsPage() {
  const { t } = useTranslation();
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
    <div className="toolbar toolbar--plain">
      <ToolbarSearch
        value={search}
        onChange={setSearch}
        urlParam="q"
        placeholder={t("academics.page.searchPlaceholder")}
        ariaLabel={t("academics.page.searchAria")}
        style={{ flex: 1, maxWidth: 360 }}
      />

      <div className="seg" role="tablist" aria-label={t("academics.page.filterAria")}>
        {[
          { key: "all", label: t("academics.page.filterAll") },
          { key: "upcoming", label: t("academics.page.filterUpcoming") },
          { key: "drafts", label: t("academics.page.filterDrafts") },
          { key: "published", label: t("academics.page.filterPublished") },
          { key: "completed", label: t("academics.page.filterCompleted") },
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
      title={t("academics.page.title")}
      description={t("academics.page.summary", {
        date: todayLabel,
        upcoming: kpis.upcomingCount,
        published: kpis.publishedCount,
      })}
      actions={
        <div className="row gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/academics/cbse-report-card")}
          >
            {t("academics.page.reportCards")} →
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => navigate("/academics/exams?new=1")}
          >
            <Plus size={13} aria-hidden /> {t("academics.page.newExam")}
          </button>
        </div>
      }
      toolbar={toolbar}
      breadcrumbs={[
        { label: t("pages.home"), href: "/" },
        { label: t("academics.page.title") },
      ]}
      bodyPadding="none"
    >
      <div className="academics-page pb-6">
        <AcademicsKpiStrip kpis={kpis} />

        {isLoading ? (
          <EmptyState
            icon={FileText}
            title={t("academics.page.loading")}
            size="md"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t("academics.page.emptyTitle")}
            description={search ? t("academics.page.emptySearchHint") : t("academics.page.emptyHint")}
            size="md"
          />
        ) : (
          <ExamsTable rows={filtered} onEnterResults={onEnterResults} />
        )}
      </div>
    </PageShell>
  );
}
