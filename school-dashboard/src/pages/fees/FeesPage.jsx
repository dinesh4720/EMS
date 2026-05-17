import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, BellRing } from "lucide-react";
import toast from "react-hot-toast";

import useFeesData from "../../hooks/useFeesData";
import FeesKpiStrip from "../../components/fees/FeesKpiStrip";
import PaymentsTable from "../../components/fees/PaymentsTable";
import PaymentSheet from "../../components/fees/PaymentSheet";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import { SkeletonTable } from "../../components/ui/Skeleton";
import ErrorState from "../../components/ui/ErrorState";
import logger from "../../utils/logger";

const VALID_FILTERS = new Set(["all", "paid", "pending", "overdue"]);

// Phase 7 — top-level Fees page.
// Single canonical surface: KPI strip + toolbar + table + collection sheet.
// URL state via ?status= (filter) and ?student= (sheet pre-fill).
export default function FeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (() => {
    const raw = searchParams.get("status");
    return VALID_FILTERS.has(raw) ? raw : "all";
  })();
  const studentParam = searchParams.get("student");

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sheetOpen, setSheetOpen] = useState(!!studentParam);

  // If URL carries ?student=, open the sheet pre-filled. Closing the sheet
  // strips ?student= so deep-link semantics stay consistent.
  if (studentParam && !sheetOpen) {
    setSheetOpen(true);
  }

  const { filtered, kpis, isLoading, isError, error, refetch } = useFeesData({ status, search });

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

  const closeSheet = () => {
    setSheetOpen(false);
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.delete("student");
        return out;
      },
      { replace: false }
    );
  };

  const openSheet = (preStudentId) => {
    setSheetOpen(true);
    if (preStudentId) {
      setSearchParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set("student", String(preStudentId));
          return out;
        },
        { replace: false }
      );
    }
  };

  const onSendReminder = async (ids) => {
    if (!ids?.length) return;
    // TODO: replace stub with real bulk-reminder endpoint once exposed.
    logger.info("Send reminder for payments:", ids);
    toast.success(`Reminder queued for ${ids.length} ${ids.length === 1 ? "student" : "students"}`);
  };

  const subLine = useMemo(() => {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const inrFmt = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
    return `${today} · ${inrFmt.format(kpis.collectedToday)} collected`;
  }, [kpis.collectedToday]);

  return (
    <div className="page fees-page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Fees</h1>
          <div className="page__sub mono tnum">{subLine}</div>
        </div>
        <div className="row gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => {
              const overdueIds = filtered
                .filter((p) => (p.studentId?._id || p.studentId))
                .map((p) => p._id || p.id);
              onSendReminder(overdueIds);
            }}
            disabled={kpis.overdueCount === 0}
          >
            <BellRing size={13} aria-hidden /> Send reminders
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => openSheet(null)}
          >
            <Plus size={13} aria-hidden /> Collect payment
          </button>
        </div>
      </div>

      <FeesKpiStrip kpis={kpis} activeFilter={status} onFilterChange={setStatus} />

      <div className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
        <ToolbarSearch
          value={search}
          onChange={setSearch}
          urlParam="q"
          placeholder="Search students, receipt no…"
          ariaLabel="Search payments"
          style={{ flex: 1, maxWidth: 360 }}
        />

        <div className="seg" role="tablist" aria-label="Filter payments">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "overdue", label: "Overdue" },
            { key: "paid", label: "Paid" },
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
          title="Failed to load payments"
          error={error}
          onRetry={refetch}
        />
      ) : (
        <PaymentsTable
          rows={filtered}
          onCollect={openSheet}
          onSendReminder={onSendReminder}
        />
      )}

      <PaymentSheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        prefilledStudentId={studentParam || null}
        onCollected={() => refetch?.()}
      />
    </div>
  );
}
