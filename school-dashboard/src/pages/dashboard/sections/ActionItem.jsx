import { AlertCircle, AlertTriangle, ArrowRight, Info, X } from "lucide-react";

const ICON_MAP = {
  danger: AlertCircle,
  warn: AlertTriangle,
  info: Info,
};

const TONE_CLASS = {
  danger: "action-item--danger",
  warn: "action-item--warn",
  info: "action-item--info",
};

export default function ActionItem({ kind, title, body, meta, primary, onPrimary, onDismiss }) {
  const Icon = ICON_MAP[kind] || Info;
  const toneClass = TONE_CLASS[kind];

  return (
    <div className={`action-item ${toneClass}`}>
      <div className="action-item__top">
        <div className={`action-item__icon action-item__icon--${kind}`}>
          <Icon size={16} strokeWidth={2} />
        </div>
        <div className="action-item__content">
          <div className="action-item__title">{title}</div>
          <div className="action-item__meta">
            {body}
            {meta && <span className="action-item__meta-sep">·</span>}
            {meta}
          </div>
        </div>
        {primary && (
          <button type="button" className="action-item__cta" onClick={onPrimary}>
            {primary}
            <ArrowRight size={12} />
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="action-item__dismiss"
            onClick={onDismiss}
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
