import { useState, useEffect } from 'react';

/**
 * useDebounce — delays updating the returned value until `delay` ms have
 * elapsed since the last change to `value`.
 *
 * Use this instead of bare setTimeout/clearTimeout whenever you need to
 * debounce any expensive side-effect (auto-save, search, API calls) that
 * should NOT fire on every keystroke.
 *
 * @param {*}      value  The raw value to debounce (string, object, etc.)
 * @param {number} delay  Milliseconds to wait before emitting the new value
 * @returns {*} The debounced value (lags `delay` ms behind `value`)
 *
 * @example
 * const debouncedQuery = useDebounce(searchInput, 400);
 * useEffect(() => { fetchResults(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
