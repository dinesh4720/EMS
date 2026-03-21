import { useEffect, useRef } from "react";

/**
 * Returns an AbortSignal that auto-aborts when deps change or on unmount.
 * Usage:
 *   const signal = useAbortSignal([activeTab, id, academicYear]);
 *   useEffect(() => {
 *     fetch(url, { signal }).then(...).catch(e => { if (e.name === 'AbortError') return; });
 *   }, [signal]);
 */
export function useAbortSignal(deps = []) {
  const controllerRef = useRef(null);

  // Abort previous controller and create a new one whenever deps change
  useEffect(() => {
    controllerRef.current = new AbortController();
    const controller = controllerRef.current;
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return controllerRef.current?.signal;
}
