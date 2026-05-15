import { useRef, useEffect, useState } from "react";
import { cn } from "../../utils/cn";

/**
 * MobileResponsive — horizontal-scroll wrapper for data tables on small screens.
 *
 * Fixes the common pattern where a `rounded-lg overflow-hidden` card clips table
 * columns on screens < 768px. Wraps children in an `overflow-x-auto` scroller
 * and shows a right-edge inset shadow as a scroll affordance when content
 * extends beyond the visible area.
 *
 * Usage — replace the outer container div:
 *   Before: <div className="border rounded-lg overflow-hidden ...">
 *   After:  <MobileResponsive className="border rounded-lg overflow-hidden ...">
 *
 * The outer div (with border/rounded/overflow-hidden) keeps the card appearance.
 * The inner scroller enables horizontal panning without clipping columns.
 */
export default function MobileResponsive({ children, className }) {
  const scrollRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function check() {
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }

    check();
    el.addEventListener("scroll", check, { passive: true });

    const ro = new ResizeObserver(check);
    ro.observe(el);
    // Also observe the direct child (table element) so that async-loaded
    // rows that make the content wider than the container trigger the check.
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    // Watch for direct child replacement (e.g., loading skeleton → table)
    const mo = new MutationObserver(() => {
      if (el.firstElementChild) ro.observe(el.firstElementChild);
      check();
    });
    mo.observe(el, { childList: true });

    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div className={cn(className)}>
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          boxShadow: canScrollRight
            ? "inset -16px 0 12px -12px rgba(0,0,0,0.08)"
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
