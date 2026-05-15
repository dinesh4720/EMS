import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Full-bleed frosted composer overlay (variation A) matching the design system.
 *
 *  <CreateComposer
 *    open={open} onClose={onClose}
 *    crumbs={["Staff", "New staff member"]}
 *    sections={[{id, num, label, count, done}]}
 *    activeSection={section} onSectionChange={setSection}
 *    title="Add a staff member" sub="They'll get an invite link…"
 *    headerExtras={...} navAside={...} footer={...}
 *  >body…</CreateComposer>
 */
export function CreateComposer({
  open,
  onClose,
  crumbs = [],
  sections,
  activeSection,
  onSectionChange,
  title,
  sub,
  headerExtras,
  navAside,
  footer,
  className,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const card = (
    <div className={cn("composer-frame fixed inset-0 z-[1000]", className)} role="dialog" aria-modal="true">
      <div className="composer">
        <div className="composer__head">
          <button type="button" className="iconbtn" style={{ width: 24, height: 24 }} title="Close" aria-label="Close" onClick={onClose}>
            <X size={13} />
          </button>
          {crumbs.length > 0 && (
            <div className="composer__crumbs">
              {crumbs.map((label, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <span key={`${label}-${i}`} className="flex items-center gap-2">
                    <span className={isLast ? "here" : undefined}>{label}</span>
                    {!isLast && <ChevronRight size={11} stroke="var(--fg-faint)" />}
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex-1" />
          {headerExtras}
        </div>

        <div className="composer__body">
          <div className="composer__nav">
            <div className="composer__nav-title">Sections</div>
            {sections?.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSectionChange?.(sec.id)}
                  className={cn("cnav", isActive && "is-active", sec.done && "is-done")}
                >
                  <span className="cnav__num">
                    {sec.done ? <Check size={10} strokeWidth={2.5} /> : sec.num}
                  </span>
                  <span className="flex-1 text-left">{sec.label}</span>
                  {sec.count && <span className="cnav__count">{sec.count}</span>}
                </button>
              );
            })}
            {navAside && <div className="mt-auto pt-4">{navAside}</div>}
          </div>

          <div className="composer__main">
            {title && <h2 className="composer__title">{title}</h2>}
            {sub && <p className="composer__sub">{sub}</p>}
            {children}
          </div>
        </div>

        {footer && <div className="composer__foot">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(card, document.body);
}
