import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const TONE_CLASS = {
  ok: "pulse-card--ok",
  warn: "pulse-card--warn",
  danger: "pulse-card--danger",
  info: "pulse-card--info",
  accent: "pulse-card--accent",
};

/**
 * PulseCard — minimal stat tile.
 * One big value, one label, optional sub-context and trend.
 */
export default function PulseCard({ label, value, sub, tone, trend, onClick, loading }) {
  if (loading) {
    return (
      <div className="pulse-card pulse-card--loading" aria-busy="true">
        <div className="pulse-card__label">···</div>
        <div className="pulse-card__value">···</div>
        <div className="pulse-card__sub">&nbsp;</div>
      </div>
    );
  }
  return (
    <button
      type="button"
      className={`pulse-card ${TONE_CLASS[tone] || ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="pulse-card__label">{label}</div>
      <div className="pulse-card__value-row">
        <span className="pulse-card__value">{value}</span>
        {trend && (
          <span
            className={`pulse-card__trend ${trend.up ? "is-up" : "is-down"}`}
            title={trend.label || ""}
          >
            {trend.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}
          </span>
        )}
      </div>
      {sub && <div className="pulse-card__sub">{sub}</div>}
    </button>
  );
}
