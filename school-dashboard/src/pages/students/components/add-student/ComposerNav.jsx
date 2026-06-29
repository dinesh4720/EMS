import { Check, Sparkles, X } from "lucide-react";

export default function ComposerNav({
  sectionStatus,
  activeSection,
  onGoToSection,
  helpDismissed,
  onDismissHelp,
}) {
  return (
    <nav className="composer__nav" aria-label="Sections">
      <div className="composer__nav-title">Sections</div>
      {sectionStatus.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onGoToSection(s.id)}
          className={`cnav ${activeSection === s.id ? "is-active" : ""} ${s.done ? "is-done" : ""}`}
          aria-current={activeSection === s.id ? "true" : undefined}
        >
          <span className="cnav__num" aria-hidden>
            {s.done ? <Check size={10} strokeWidth={2.5} aria-hidden /> : s.index + 1}
          </span>
          <span className="cnav__label">
            {s.label}
          </span>
          {s.countLabel && <span className="cnav__count">{s.countLabel}</span>}
        </button>
      ))}

      <div className="composer__nav-spacer" />
      {!helpDismissed && (
        <div className="help-banner help-banner--sm">
          <Sparkles size={12} className="help-banner__icon" aria-hidden />
          <span className="help-banner__text">
            Fill what you have — most fields can be edited later from the
            student profile.
          </span>
          <button
            type="button"
            onClick={onDismissHelp}
            aria-label="Dismiss tip"
            className="help-banner__close"
          >
            <X size={11} aria-hidden />
          </button>
        </div>
      )}
    </nav>
  );
}
