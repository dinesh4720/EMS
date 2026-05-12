import { Check } from "lucide-react";

// 8-cell horizontal strip (or however many periods the school has).
// Shows period state via the .period-cell--{state} variants from classes.css.
export default function PeriodStrip({ periods, selectedNumber, onSelect, retrospective }) {
  if (!Array.isArray(periods) || periods.length === 0) return null;

  return (
    <div
      className="period-strip"
      style={{ "--period-count": periods.length }}
      role="tablist"
      aria-label="Today's periods"
    >
      {periods.map((p) => {
        // In retrospective mode (end-of-day fallthrough), suppress live/urgent
        // visuals — past periods either ended marked or overdue.
        const state = retrospective
          ? p.state === "live" || p.state === "urgent"
            ? "skipped"
            : p.state
          : p.state;
        const isSelected = selectedNumber === p.number;
        const interactive = state !== "skipped";

        return (
          <button
            key={p.number}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-disabled={!interactive}
            disabled={!interactive}
            onClick={() => interactive && onSelect?.(p.number)}
            className={`period-cell period-cell--${state}${
              isSelected ? " is-selected" : ""
            }`}
            title={`Period ${p.number} · ${p.startLabel || ""}${
              p.endLabel ? "–" + p.endLabel : ""
            }`}
          >
            <span className="period-cell__top">
              <span className="period-cell__num">{p.number}</span>
              {p.startLabel && (
                <span className="period-cell__time">{p.startLabel}</span>
              )}
            </span>
            <span className="period-cell__bottom">
              {state === "marked" ? (
                <Check size={11} aria-hidden />
              ) : (
                <span className="dot" aria-hidden />
              )}
              <PeriodStateLabel state={state} period={p} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PeriodStateLabel({ state, period }) {
  if (state === "skipped" && period.isBreak) return <span>{period.name}</span>;
  if (state === "skipped") return <span>Free</span>;
  if (state === "live") return <span>Live</span>;
  if (state === "urgent") {
    return <span>Urgent</span>;
  }
  if (state === "overdue") return <span>Overdue</span>;
  if (state === "marked") return <span>Marked</span>;
  return <span>Upcoming</span>;
}
