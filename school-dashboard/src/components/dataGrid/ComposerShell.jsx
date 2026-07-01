/**
 * ComposerShell
 * Shared modal chrome for the create-entity composers (New student / Add staff)
 * from the Claude Design "…List - Data Grid" composer: header, left rail with
 * scroll-spy nav, scrollable form body, footer. Light/dark via `.cmp-*` CSS vars.
 */
import { useEffect, useRef, useState } from "react";
import "./composer.css";

const CloseIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
);
const DoneIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.2 2.2 4.8-5.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/**
 * @param {object[]} nav  [{ id, label, sub, done }]
 * @param {string}   railTitle
 * @param {string}   tip
 */
export default function ComposerShell({
  open, onClose, icon, title, subtitle, railTitle, tip, nav = [], footer, children,
}) {
  const [active, setActive] = useState(nav[0]?.id);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => { if (open) setActive(nav[0]?.id); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const onScroll = (e) => {
    const top = e.target.scrollTop;
    let act = nav[0]?.id;
    for (const n of nav) {
      const el = document.getElementById(`cmpsec-${n.id}`);
      if (el && el.offsetTop - 80 <= top) act = n.id;
    }
    if (act !== active) setActive(act);
  };
  const scrollTo = (id) => {
    const el = document.getElementById(`cmpsec-${id}`);
    const body = scrollRef.current;
    if (el && body) body.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: "smooth" });
    setActive(id);
  };

  return (
    <div className="cmp-overlay">
      <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="cmp-panel">
        {/* Header */}
        <div className="cmp-header">
          <span className="cmp-header-icon">{icon}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="cmp-title">{title}</span>
            <span className="cmp-sub">{subtitle}</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="cmp-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="cmp-body">
          {/* Rail */}
          <div className="cmp-rail">
            <span className="cmp-rail-title">{railTitle}</span>
            {nav.map((n, i) => {
              const isActive = active === n.id;
              return (
                <button key={n.id} type="button" className={`cmp-nav${isActive ? " is-active" : ""}`} onClick={() => scrollTo(n.id)}>
                  <span className="cmp-nav-dot" style={{
                    background: n.done ? "var(--acc)" : "var(--surface)",
                    color: n.done ? "#fff" : (isActive ? "var(--acc)" : "var(--muted-2)"),
                    border: `1.5px solid ${n.done ? "var(--acc)" : (isActive ? "var(--acc-line)" : "var(--field-border)")}`,
                  }}>
                    {n.done ? <DoneIcon /> : i + 1}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <span className="cmp-nav-label" style={{ fontWeight: isActive ? 600 : 500, color: isActive ? "var(--acc)" : "var(--tx)" }}>{n.label}</span>
                    <span className="cmp-nav-sub">{n.sub}</span>
                  </span>
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            {tip && (
              <div className="cmp-tip">
                <InfoIcon />
                <span>{tip}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="cmp-form" ref={scrollRef} onScroll={onScroll}>
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="cmp-footer">{footer}</div>
      </div>
    </div>
  );
}

/** Section wrapper — id must match a nav id (renders as #cmpsec-{id}). */
export function ComposerSection({ id, title, optional, count, desc, children }) {
  return (
    <div id={`cmpsec-${id}`} className="cmp-section">
      <div className="cmp-sec-head" style={desc ? { marginBottom: 6 } : undefined}>
        <span className="cmp-sec-title">{title}</span>
        {count != null && <span className="cmp-count">{count}</span>}
        {optional && <span className="cmp-sec-optional">Optional</span>}
        <span className="cmp-sec-rule" />
      </div>
      {desc && <p className="cmp-sec-desc">{desc}</p>}
      {children}
    </div>
  );
}
