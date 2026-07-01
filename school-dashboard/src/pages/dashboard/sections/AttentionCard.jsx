import { ArrowRight } from "lucide-react";

const TONE = {
  danger: { icon: "attention-card__icon--danger", accent: "attention-card--danger" },
  warn: { icon: "attention-card__icon--warn", accent: "attention-card--warn" },
  info: { icon: "attention-card__icon--info", accent: "attention-card--info" },
};

/**
 * AttentionCard — single row in the "Needs your attention" queue.
 * One clear title, one line of context, one primary action.
 */
export default function AttentionCard({
  icon: Icon,
  kind = "info",
  title,
  body,
  action,
  onAction,
}) {
  const tone = TONE[kind] || TONE.info;
  return (
    <div className={`attention-card ${tone.accent}`}>
      <div className={`attention-card__icon ${tone.icon}`}>
        {Icon && <Icon size={18} strokeWidth={2} />}
      </div>
      <div className="attention-card__body">
        <div className="attention-card__title">{title}</div>
        {body && <div className="attention-card__sub">{body}</div>}
      </div>
      {action && (
        <button type="button" className="attention-card__action" onClick={onAction}>
          <span>{action}</span>
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}
