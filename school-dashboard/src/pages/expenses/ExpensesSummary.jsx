import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TrendingDown, Layers, Wallet } from "lucide-react";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function fmtINR(n) {
  return inrFormatter.format(Number.isFinite(n) ? n : 0);
}

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

export default function ExpensesSummary({ summary = [], totalAmount = 0, onCategoryClick, activeCategory }) {
  const { t } = useTranslation();
  const categories = useMemo(() => {
    const map = new Map(summary.map((item) => [item._id, item]));
    return CATEGORY_KEYS.map((key) => ({
      key,
      label: t(`expenses.categories.${key}`),
      total: map.get(key)?.total ?? 0,
      count: map.get(key)?.count ?? 0,
    }));
  }, [summary, t]);

  return (
    <div className="expenses-summary" role="group" aria-label={t("expenses.summary.overviewAria")}>
      <button
        type="button"
        className={`expenses-summary__cell${activeCategory === "all" || !activeCategory ? " is-active" : ""}`}
        onClick={() => onCategoryClick?.(activeCategory === "all" ? "" : "all")}
      >
        <span className="expenses-summary__label">
          <Wallet size={13} aria-hidden /> {t("expenses.summary.total")}
        </span>
        <span className="expenses-summary__value">{fmtINR(totalAmount)}</span>
        <span className="expenses-summary__sub">{t("expenses.summary.acrossAll")}</span>
      </button>

      <button
        type="button"
        className={`expenses-summary__cell${activeCategory === "top" ? " is-active" : ""}`}
        onClick={() => onCategoryClick?.(activeCategory === "top" ? "" : "top")}
      >
        <span className="expenses-summary__label">
          <TrendingDown size={13} aria-hidden /> {t("expenses.summary.topCategory")}
        </span>
        <span className="expenses-summary__value">
          {categories.length > 0
            ? categories.reduce((acc, cur) => (acc.total > cur.total ? acc : cur), categories[0]).label
            : "—"}
        </span>
        <span className="expenses-summary__sub">{t("expenses.summary.highestSpend")}</span>
      </button>

      <button
        type="button"
        className={`expenses-summary__cell${activeCategory === "count" ? " is-active" : ""}`}
        onClick={() => onCategoryClick?.(activeCategory === "count" ? "" : "count")}
      >
        <span className="expenses-summary__label">
          <Layers size={13} aria-hidden /> {t("expenses.summary.totalEntries")}
        </span>
        <span className="expenses-summary__value tnum">
          {summary.reduce((sum, item) => sum + (item.count || 0), 0)}
        </span>
        <span className="expenses-summary__sub">{t("expenses.summary.recordedExpenses")}</span>
      </button>
    </div>
  );
}
