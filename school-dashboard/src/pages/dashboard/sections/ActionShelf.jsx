import { ArrowRight, Plus, Megaphone, Check } from "lucide-react";

const TONE = {
  danger: { dot: "action-row--danger", icon: "action-row__icon--danger" },
  warn: { dot: "action-row--warn", icon: "action-row__icon--warn" },
  info: { dot: "action-row--info", icon: "action-row__icon--info" },
  neutral: { dot: "action-row--neutral", icon: "action-row__icon--neutral" },
};

/**
 * ActionShelf — one zone for "what should I do right now?"
 *
 * Replaces the old separate QuickActions row + Attention queue.
 *
 * Top tier: contextual actions with real counts (fees pending, classes
 * unmarked, staff absent). Each carries a tone, an icon, a title, a
 * context line, and a one-tap action.
 *
 * Footer tier: always-available verbs (Add student, Post announcement)
 * rendered as quiet text links — never urgent, always one tap away.
 *
 * When the top tier is empty, we show an AllClear banner instead and
 * the footer verbs move up to be the only thing on the shelf.
 */
export default function ActionShelf({
  items = [],
  footerActions = [],
  onNavigate,
}) {
  const hasItems = items.length > 0;

  return (
    <section className="action-shelf">
      <header className="action-shelf__head">
        <h2 className="action-shelf__title">
          {hasItems ? "Needs your attention" : "You're all caught up"}
        </h2>
        {hasItems && (
          <span className="action-shelf__count">{items.length}</span>
        )}
      </header>

      {hasItems ? (
        <div className="action-shelf__list">
          {items.map((item) => {
            const tone = TONE[item.kind] || TONE.info;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`action-row ${tone.dot}`}
                onClick={item.onAction}
              >
                <span className={`action-row__icon ${tone.icon}`}>
                  {Icon && <Icon size={16} strokeWidth={2.2} />}
                </span>
                <span className="action-row__body">
                  <span className="action-row__title">{item.title}</span>
                  {item.body && (
                    <span className="action-row__sub">{item.body}</span>
                  )}
                </span>
                <span className="action-row__cta">
                  <span className="action-row__cta-label">{item.action}</span>
                  <ArrowRight size={13} strokeWidth={2.4} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="action-shelf__clear">
          <Check size={16} strokeWidth={2.6} />
          <span>Nothing urgent right now. Pick a verb below to get going.</span>
        </div>
      )}

      {/* Always-available verbs — quiet footer */}
      <div className="action-shelf__verbs">
        {footerActions.map((verb) => {
          const Icon = verb.icon;
          return (
            <button
              key={verb.id}
              type="button"
              className="action-verb"
              onClick={() => onNavigate?.(verb.to, verb)}
            >
              <Icon size={12} strokeWidth={2.4} />
              <span>{verb.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Default always-available verbs (kept here so Dashboard stays lean). */
export const DEFAULT_VERBS = [
  { id: "student", label: "Add student", icon: Plus, to: "/students" },
  { id: "announce", label: "Post announcement", icon: Megaphone, to: "/messaging" },
];
