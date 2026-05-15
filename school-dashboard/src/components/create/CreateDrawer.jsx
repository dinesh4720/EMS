import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, X } from "lucide-react";
import { Stepper } from "./Stepper";
import { cn } from "../../utils/cn";

/**
 * Right-side stepped drawer matching the design system "create" pattern.
 *
 * Renders: scrim + 540px sheet with head (title/sub + close), stepper,
 * scrolling body, and footer. Footer is fully customizable.
 *
 *  <CreateDrawer
 *    open={open} onClose={() => setOpen(false)}
 *    title="New staff member" subtitle="Step 2 of 3 · Anika Rao"
 *    steps={[{n:1,label:"Identity"}, ...]} current={2}
 *    footer={<>...</>}
 *  >
 *    body…
 *  </CreateDrawer>
 */
export function CreateDrawer({
  open,
  onClose,
  title,
  subtitle,
  steps,
  current,
  headerExtras,
  footer,
  hideClose = false,
  className,
  bodyClassName,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sheet = (
    <div className={cn("drawer-frame fixed inset-0 z-[1000]", className)} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
      <button
        type="button"
        aria-label="Close"
        className="drawer-scrim cursor-default"
        onClick={onClose}
      />
      <aside className="drawer">
        <div className="drawer__head">
          <div className="flex-1 min-w-0">
            {title && <h2 className="drawer__title truncate">{title}</h2>}
            {subtitle && <div className="drawer__sub truncate">{subtitle}</div>}
          </div>
          {headerExtras}
          {!hideClose && (
            <>
              <button type="button" className="iconbtn" style={{ width: 26, height: 26 }} title="More" aria-label="More">
                <MoreHorizontal size={13} />
              </button>
              <button type="button" className="iconbtn" style={{ width: 26, height: 26 }} title="Close" aria-label="Close" onClick={onClose}>
                <X size={13} />
              </button>
            </>
          )}
        </div>

        {steps && current !== undefined && <Stepper steps={steps} current={current} />}

        <div className={cn("drawer__body", bodyClassName)}>{children}</div>

        {footer && <div className="drawer__foot">{footer}</div>}
      </aside>
    </div>
  );

  return createPortal(sheet, document.body);
}
