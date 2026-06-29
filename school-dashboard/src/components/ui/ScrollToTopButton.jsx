import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

const getScrollTop = () => {
  const doc = document.documentElement;
  return window.scrollY ?? doc.scrollTop ?? 0;
};

const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
};

export default function ScrollToTopButton({
  showAfter = 300,
  throttleMs = 100,
  ariaLabel = "Scroll to top",
  className = "",
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const pendingRef = useRef(false);

  const updateVisibility = useCallback(() => {
    const y = getScrollTop();
    setVisible(y >= showAfter);
  }, [showAfter]);

  const onScroll = useCallback(() => {
    if (timeoutRef.current) {
      pendingRef.current = true;
      return;
    }

    updateVisibility();

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      if (pendingRef.current) {
        pendingRef.current = false;
        updateVisibility();
      }
    }, throttleMs);
  }, [throttleMs, updateVisibility]);

  useEffect(() => {
    updateVisibility();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      pendingRef.current = false;
    };
  }, [onScroll, updateVisibility]);

  const handleClick = useCallback(() => {
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    window.scrollTo({ top: 0, left: 0, behavior });
  }, []);

  const visibilityClasses = useMemo(
    () =>
      visible
        ? "opacity-100 translate-y-0 pointer-events-auto"
        : "opacity-0 translate-y-2 pointer-events-none",
    [visible],
  );

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={handleClick}
      className={[
        "fixed right-4 bottom-6 z-50",
        "md:right-6 md:bottom-8",
        "h-11 w-11 rounded-full shadow-lg",
        "bg-fg text-bg hover:bg-fg-muted",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "focus-visible:ring-offset-bg",
        "transition-[opacity,transform] duration-200 ease-out",
        visibilityClasses,
        className,
      ].join(" ")}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}

