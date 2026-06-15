import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, GraduationCap, Building2, Users, Sparkles, Lightbulb } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * Composer overlay — frosted full-bleed card portaled to body.
 * Replaces the legacy HeroUI <Drawer> for create / multi-step flows.
 * Solid surface for the form area, frosted nav rail on the left, no
 * scrim animation. Source of truth: src/pages/staffs/AddStaffComposer.jsx.
 * ────────────────────────────────────────────────────────────────── */
const COMPOSER_SECTIONS = [
  { key: "identity",   label: "Identity",   num: 1 },
  { key: "role",       label: "Role",       num: 2 },
  { key: "classes",    label: "Classes",    num: 3 },
  { key: "contact",    label: "Contact",    num: 4 },
  { key: "review",     label: "Review",     num: 5 },
];

export default function ComposerDemoOverlay({ open, onClose }) {
  const [active, setActive] = useState("identity");
  const [role, setRole] = useState("Teaching");
  if (!open || typeof document === "undefined") return null;
  const idx = COMPOSER_SECTIONS.findIndex((s) => s.key === active);
  const pct = Math.round(((idx + 1) / COMPOSER_SECTIONS.length) * 100);

  return createPortal(
    <div
      className="composer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="composer" role="dialog" aria-modal="true" aria-label="Composer demo">
        <header className="composer__head">
          <div className="composer__crumbs">
            <span>Staff</span>
            <span aria-hidden>›</span>
            <span className="here">New staff</span>
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close composer">
            <X size={14} aria-hidden />
          </button>
        </header>
        <div className="composer__body">
          <nav className="composer__nav" aria-label="Composer sections">
            <div className="composer__nav-title">Sections</div>
            {COMPOSER_SECTIONS.map((s, i) => {
              const isActive = active === s.key;
              const isDone = i < idx;
              return (
                <button
                  key={s.key}
                  type="button"
                  className={`cnav${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                  onClick={() => setActive(s.key)}
                >
                  <span className="cnav__num" aria-hidden>
                    {isDone ? <Check size={11} /> : s.num}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>
          <main className="composer__main">
            <h2 className="composer__title">Add staff</h2>
            <p className="composer__sub">Fill what you have — the rest can wait.</p>
            <div className="help-banner" style={{ marginBottom: 20 }}>
              <Lightbulb size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1 }}>
                <b>Tip.</b> Only <b>Identity</b> and <b>Role</b> are required to save a draft.
              </span>
            </div>
            <section className="section">
              <header className="section__head">
                <span className="section__title">Identity</span>
                <span className="section__hint">Name and code</span>
              </header>
              <div className="fgrid">
                <label className="field">
                  <span className="field__label">First name <span className="req">*</span></span>
                  <input className="input" placeholder="Asha" />
                </label>
                <label className="field">
                  <span className="field__label">Last name</span>
                  <input className="input" placeholder="Sharma" />
                </label>
                <label className="field span-2">
                  <span className="field__label">Staff code</span>
                  <input className="input" placeholder="EMP-014" />
                </label>
              </div>
            </section>
            <section className="section">
              <header className="section__head">
                <span className="section__title">Role</span>
              </header>
              <div className="optgrid">
                {[
                  { key: "Teaching", icon: GraduationCap },
                  { key: "Admin", icon: Building2 },
                  { key: "Support", icon: Users },
                  { key: "Leadership", icon: Sparkles },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`opt${role === key ? " is-active" : ""}`}
                    onClick={() => setRole(key)}
                  >
                    <span className="opt__icon" aria-hidden><Icon size={14} /></span>
                    {key}
                    <span className="opt__check" aria-hidden><Check size={10} /></span>
                  </button>
                ))}
              </div>
            </section>
          </main>
        </div>
        <footer className="composer__foot">
          <div className="composer__progress">
            <span>{idx + 1} of {COMPOSER_SECTIONS.length}</span>
            <div className="composer__progress-bar" aria-hidden>
              <div className="composer__progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={onClose}>Save draft</button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => {
              const next = COMPOSER_SECTIONS[idx + 1];
              if (next) setActive(next.key);
              else onClose?.();
            }}
          >
            {idx === COMPOSER_SECTIONS.length - 1 ? "Save & finish" : "Save & continue"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
