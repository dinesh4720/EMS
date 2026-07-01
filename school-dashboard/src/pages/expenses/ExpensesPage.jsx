import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { expensesApi } from "../../services/api";
import ExpensesSummary from "./ExpensesSummary";
import ExpenseModal from "./ExpenseModal";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import ErrorState from "../../components/ui/ErrorState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { TablePageSkeleton } from "../../components/skeletons/PageSkeletons";
import { PageShell } from "../../components/ui";
import logger from "../../utils/logger";

const VALID_STATUSES = new Set(["all", "pending", "approved", "rejected"]);
const VALID_CATEGORIES = new Set([
  "all", "salaries", "utilities", "maintenance", "supplies",
  "equipment", "events", "transport", "marketing", "other",
]);

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"];
const CATEGORY_KEYS = [
  "salaries",
  "utilities",
  "maintenance",
  "supplies",
  "equipment",
  "events",
  "transport",
  "marketing",
  "other",
];

const STATUS_PILL_CLASS = {
  pending: "status--warn",
  approved: "status--ok",
  rejected: "status--danger",
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function fmtINR(n) {
  return inrFormatter.format(Number.isFinite(n) ? n : 0);
}

function StatusPill({ status, t }) {
  const cls = STATUS_PILL_CLASS[status] || "status--warn";
  const label = status ? t(`expenses.statuses.${status}`) : t("expenses.statuses.pending");
  return (
    <span className={`status ${cls}`}>
      <span className="dot" aria-hidden />
      {label}
    </span>
  );
}

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = (() => {
    const raw = searchParams.get("status");
    return VALID_STATUSES.has(raw) ? raw : "all";
  })();
  const categoryFilter = (() => {
    const raw = searchParams.get("category");
    return VALID_CATEGORIES.has(raw) ? raw : "all";
  })();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (opts = {}) => {
    const currentPage = opts.page ?? page;
    const params = {
      page: currentPage,
      limit: 20,
    };
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    if (categoryFilter && categoryFilter !== "all") params.category = categoryFilter;
    if (search.trim()) params.q = search.trim();

    setIsLoading(true);
    setIsError(false);
    try {
      const [listRes, summaryRes] = await Promise.all([
        expensesApi.getAll(params),
        expensesApi.getSummary({
          status: statusFilter !== "all" ? statusFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        }),
      ]);
      setExpenses(listRes.expenses || []);
      setTotalCount(listRes.total || 0);
      setTotalPages(listRes.totalPages || 1);
      setSummary(summaryRes.summary || []);
      setTotalAmount(summaryRes.totalAmount || 0);
    } catch (err) {
      logger.error("Failed to load expenses:", err);
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, search]);

  const setStatus = (next) => {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === "all") out.delete("status");
        else out.set("status", next);
        out.delete("page");
        return out;
      },
      { replace: false }
    );
  };

  const setCategory = (next) => {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === "all") out.delete("category");
        else out.set("category", next);
        out.delete("page");
        return out;
      },
      { replace: false }
    );
  };

  const openCreate = () => {
    setEditingExpense(null);
    setSheetOpen(true);
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingExpense(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await expensesApi.delete(deleteTarget._id || deleteTarget.id);
      toast.success(t("expenses.toast.deleted"));
      fetchData();
    } catch (err) {
      logger.error("Delete expense failed:", err);
      toast.error(err?.message || t("expenses.toast.deleteFailed"));
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const subLine = useMemo(() => {
    const today = new Date().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return t("expenses.subLine", { date: today, count: totalCount });
  }, [totalCount, t]);

  const toolbar = (
    <div className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
      <ToolbarSearch
        value={search}
        onChange={setSearch}
        urlParam="q"
        placeholder={t("expenses.searchPlaceholder")}
        ariaLabel={t("expenses.searchAria")}
        style={{ flex: 1, maxWidth: 360 }}
      />

      <div className="seg" role="tablist" aria-label={t("expenses.filterStatusAria")}>
        {STATUS_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={statusFilter === key}
            className={`seg__btn${statusFilter === key ? " is-active" : ""}`}
            onClick={() => setStatus(key)}
          >
            {key === "all" ? t("expenses.filterAll") : t(`expenses.statuses.${key}`)}
          </button>
        ))}
      </div>

      <div className="row gap-2" style={{ marginLeft: "auto" }}>
        <select
          className="select select--sm"
          value={categoryFilter}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={t("expenses.filterCategoryAria")}
        >
          <option value="all">{t("expenses.allCategories")}</option>
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>{t(`expenses.categories.${key}`)}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-fg-muted">
      <p className="text-sm">{t("expenses.noExpenses")}</p>
      <button type="button" className="btn btn--accent btn--sm" onClick={openCreate}>
        <Plus size={13} aria-hidden /> {t("expenses.addFirst")}
      </button>
    </div>
  );

  return (
    <PageShell
      title={t("expenses.title")}
      description={subLine}
      actions={
        <button type="button" className="btn btn--accent" onClick={openCreate}>
          <Plus size={13} aria-hidden /> {t("expenses.add")}
        </button>
      }
      toolbar={toolbar}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: t("expenses.title") },
      ]}
      bodyPadding="none"
    >
      <div className="expenses-page" style={{ paddingBottom: 24 }}>
        <ExpensesSummary
          summary={summary}
          totalAmount={totalAmount}
          onCategoryClick={(cat) => {
            if (cat === "all" || cat === "top" || cat === "count") {
              // These are just overview toggles; no table filter change
              return;
            }
            setCategory(cat);
          }}
          activeCategory=""
        />

        {isLoading ? (
          <TablePageSkeleton kpiCards={3} columns={6} rows={6} />
        ) : isError ? (
          <ErrorState
            title={t("expenses.unableToLoad")}
            error={error}
            onRetry={() => fetchData()}
            size="lg"
          />
        ) : expenses.length === 0 ? (
          emptyState
        ) : (
          <>
            <div className="fees-table" role="table">
              <div className="fees-table__head" role="row">
                <span>{t("expenses.table.title")}</span>
                <span>{t("expenses.table.category")}</span>
                <span>{t("expenses.table.date")}</span>
                <span className="fees-table__amount">{t("expenses.table.amount")}</span>
                <span>{t("expenses.table.status")}</span>
                <span className="fees-table__action">{t("expenses.table.actions")}</span>
              </div>
              {expenses.map((ex) => {
                const id = ex._id || ex.id;
                const dateStr = ex.expenseDate
                  ? new Date(ex.expenseDate).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
                return (
                  <div key={id} role="row" className="fees-table__row">
                    <span>
                      <div className="fees-table__name">{ex.title || "—"}</div>
                      <div className="fees-table__sub">
                        {ex.vendor && <span>{ex.vendor}</span>}
                      </div>
                    </span>
                    <span className="subtle">
                      {ex.category ? t(`expenses.categories.${ex.category}`, ex.category) : "—"}
                    </span>
                    <span className="mono tnum">{dateStr}</span>
                    <span className="fees-table__amount tnum">{fmtINR(ex.amount)}</span>
                    <span>
                      <StatusPill status={ex.status} t={t} />
                    </span>
                    <span className="fees-table__action row gap-1">
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={() => openEdit(ex)}
                        aria-label={t("expenses.table.editAria", { title: ex.title })}
                        title={t("expenses.table.edit")}
                      >
                        <Pencil size={13} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => setDeleteTarget(ex)}
                        aria-label={t("expenses.table.deleteAria", { title: ex.title })}
                        title={t("expenses.table.delete")}
                      >
                        <Trash2 size={13} aria-hidden />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
                <span className="text-xs text-fg-muted">
                  {t("expenses.pageOf", { page, total: totalPages })}
                </span>
                <div className="row gap-2">
                  <button
                    type="button"
                    className="btn btn--sm"
                    disabled={page <= 1}
                    onClick={() => {
                      const next = Math.max(1, page - 1);
                      setPage(next);
                      fetchData({ page: next });
                    }}
                  >
                    {t("expenses.previous")}
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const next = Math.min(totalPages, page + 1);
                      setPage(next);
                      fetchData({ page: next });
                    }}
                  >
                    {t("expenses.next")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <ExpenseModal
          isOpen={sheetOpen}
          onClose={closeSheet}
          expense={editingExpense}
          onSaved={() => fetchData()}
        />

        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={t("expenses.deleteDialog.title")}
          message={t("expenses.deleteDialog.message", { title: deleteTarget?.title || t("expenses.title") })}
          confirmText={t("expenses.deleteDialog.confirm")}
          cancelText={t("common.cancel")}
          variant="danger"
          isLoading={deleteLoading}
        />
      </div>
    </PageShell>
  );
}
