import { useEffect, useState } from "react";

/**
 * Returns true when the user prefers reduced motion.
 * Use this to disable or shorten Framer Motion / Recharts animations.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setReduced(false);
      return;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return reduced;
}

export default useReducedMotion;
