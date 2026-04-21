import { useEffect } from 'react';

/**
 * Attaches a debounced window resize listener.
 * Fires callback at most once per `delay` ms after resize stops.
 *
 * @param {() => void} callback - Stable function reference (wrap in useCallback if needed)
 * @param {number} [delay=150] - Debounce delay in milliseconds
 */
export function useWindowResize(callback, delay = 150) {
  useEffect(() => {
    let timeout;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(callback, delay);
    };
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      clearTimeout(timeout);
    };
  }, [callback, delay]);
}
