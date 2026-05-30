import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

const CATEGORY_LABELS = {
  salaries: "Salaries",
  utilities: "Utilities",
  maintenance: "Maintenance",
  supplies: "Supplies",
  equipment: "Equipment",
  events: "Events",
  transport: "Transport",
  marketing: "Marketing",
  other: "Other",
};

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

function StatusPill({ status }) {
  const cls = STATUS_PILL_CLASS[status] || "status--warn";
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
  return (
    <span className={`status ${cls}`}>
      <span className="dot" aria-hidden />
      {label}
    </span>
  );
}

export default function ExpensesPage() {
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
      toast.success("Expense deleted");
      fetchData();
    } catch (err) {
      logger.error("Delete expense failed:", err);
      toast.error(err?.message || "Failed to delete expense");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const subLine = useMemo(() => {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${today} · ${totalCount} expense${totalCount === 1 ? "" : "s"} recorded`;
  }, [totalCount]);

  const toolbar = (
    <div className="toolbar" style={{ borderBottom: "none", paddingTop: 0 }}>
      <ToolbarSearch
        value={search}
        onChange={setSearch}
        urlParam="q"
        placeholder="Search expenses by title…"
        ariaLabel="Search expenses"
        style={{ flex: 1, maxWidth: 360 }}
      />

      <div className="seg" role="tablist" aria-label="Filter by status">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map((filter) => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.key}
            className={`seg__btn${statusFilter === filter.key ? " is-active" : ""}`}
            onClick={() => setStatus(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="row gap-2" style={{ marginLeft: "auto" }}>
        <select
          className="select select--sm"
          value={categoryFilter}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-fg-muted">
      <p className="text-sm">No expenses found.</p>
      <button type="button" className="btn btn--accent btn--sm" onClick={openCreate}>
        <Plus size={13} aria-hidden /> Add your first expense
      </button>
    </div>
  );

  return (
    <PageShell
      title="Expenses"
      description={subLine}
      actions={
        <button type="button" className="btn btn--accent" onClick={openCreate}>
          <Plus size={13} aria-hidden /> Add expense
        </button>
      }
      toolbar={toolbar}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Expenses" },
      ]}
      bodyPadding="none"
    >
      <div className="expenses-page">
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
            title="Unable to load expenses"
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
                <span>Title</span>
                <span>Category</span>
                <span>Date</span>
                <span className="fees-table__amount">Amount</span>
                <span>Status</span>
                <span className="fees-table__action">Actions</span>
              </div>
              {expenses.map((ex) => {
                const id = ex._id || ex.id;
                const dateStr = ex.expenseDate
                  ? new Date(ex.expenseDate).toLocaleDateString("en-IN", {
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
                      {CATEGORY_LABELS[ex.category] || ex.category || "—"}
                    </span>
                    <span className="mono tnum">{dateStr}</span>
                    <span className="fees-table__amount tnum">{fmtINR(ex.amount)}</span>
                    <span>
                      <StatusPill status={ex.status} />
                    </span>
                    <span className="fees-table__action row gap-1">
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={() => openEdit(ex)}
                        aria-label={`Edit ${ex.title}`}
                        title="Edit"
                      >
                        <Pencil size={13} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => setDeleteTarget(ex)}
                        aria-label={`Delete ${ex.title}`}
                        title="Delete"
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
                  Page {page} of {totalPages}
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
                    Previous
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
                    Next
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
          title="Delete Expense"
          message={`Are you sure you want to delete "${deleteTarget?.title || "this expense"}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteLoading}
        />
      </div>
    </PageShell>
  );
}
