import { useMemo } from "react";
import { TrendingDown, Layers, Wallet } from "lucide-react";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function fmtINR(n) {
  return inrFormatter.format(Number.isFinite(n) ? n : 0);
}

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

export default function ExpensesSummary({ summary = [], totalAmount = 0, onCategoryClick, activeCategory }) {
  const categories = useMemo(() => {
    const map = new Map(summary.map((item) => [item._id, item]));
    const allKeys = Object.keys(CATEGORY_LABELS);
    return allKeys.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      total: map.get(key)?.total ?? 0,
      count: map.get(key)?.count ?? 0,
    }));
  }, [summary]);

  return (
    <div className="expenses-summary" role="group" aria-label="Expenses overview">
      <button
        type="button"
        className={`expenses-summary__cell${activeCategory === "all" || !activeCategory ? " is-active" : ""}`}
        onClick={() => onCategoryClick?.(activeCategory === "all" ? "" : "all")}
      >
        <span className="expenses-summary__label">
          <Wallet size={13} aria-hidden /> Total Expenses
        </span>
        <span className="expenses-summary__value">{fmtINR(totalAmount)}</span>
        <span className="expenses-summary__sub">across all categories</span>
      </button>

      <button
        type="button"
        className={`expenses-summary__cell${activeCategory === "top" ? " is-active" : ""}`}
        onClick={() => onCategoryClick?.(activeCategory === "top" ? "" : "top")}
      >
        <span className="expenses-summary__label">
          <TrendingDown size={13} aria-hidden /> Top Category
        </span>
        <span className="expenses-summary__value">
          {categories.length > 0
            ? CATEGORY_LABELS[categories.reduce((acc, cur) => (acc.total > cur.total ? acc : cur), categories[0]).key]
            : "—"}
        </span>
        <span className="expenses-summary__sub">highest spend</span>
      </button>

      <button
        type="button"
        className={`expenses-summary__cell${activeCategory === "count" ? " is-active" : ""}`}
        onClick={() => onCategoryClick?.(activeCategory === "count" ? "" : "count")}
      >
        <span className="expenses-summary__label">
          <Layers size={13} aria-hidden /> Total Entries
        </span>
        <span className="expenses-summary__value tnum">
          {summary.reduce((sum, item) => sum + (item.count || 0), 0)}
        </span>
        <span className="expenses-summary__sub">recorded expenses</span>
      </button>
    </div>
  );
}
