import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const LOAD_DELAY_MS = 300;
const DEFAULT_ITEMS_PER_LOAD = 10;

/**
 * Generic client-side pagination with IntersectionObserver scroll-to-load.
 *
 * Encapsulates the visibleCount / isLoadingMore / loaderRef / IntersectionObserver
 * pattern that was previously duplicated across many list pages.
 *
 * @param {Array}  items              - Pre-filtered array to paginate (slice source)
 * @param {Array}  [resetDeps=[]]     - Deps that reset the visible count (e.g. filter changes)
 * @param {Object} [options]
 * @param {number} [options.itemsPerLoad=10] - Items to reveal per load step
 * @returns {{ visibleItems, hasMore, isLoadingMore, loaderRef }}
 *   `loaderRef` is a *callback ref* — attach it with `ref={loaderRef}` exactly as
 *   before. It works for sentinels that are rendered conditionally (e.g.
 *   `{hasMore && <div ref={loaderRef} />}`): React invokes it the moment the
 *   sentinel mounts, so the observer (re-)attaches then instead of only once.
 *
 * @example
 *   const { visibleItems, hasMore, isLoadingMore, loaderRef } =
 *     useEntityFetch(filteredRecords, [searchQuery, statusFilter]);
 *
 *   // Rename visibleItems if needed:
 *   const { visibleItems: visibleStaff, ... } = useEntityFetch(filteredStaff, [...]);
 */
export function useEntityFetch(items, resetDeps = [], { itemsPerLoad = DEFAULT_ITEMS_PER_LOAD } = {}) {
  const [visibleCount, setVisibleCount] = useState(itemsPerLoad);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs let the IntersectionObserver callback read current values without stale
  // closures, so the single observer never needs to be recreated on state changes.
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const itemsPerLoadRef = useRef(itemsPerLoad);
  const observerRef = useRef(null);
  const loadTimerRef = useRef(null);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const hasMore = visibleCount < items.length;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;
  itemsPerLoadRef.current = itemsPerLoad;

  // Reset visible count whenever filter-related deps change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setVisibleCount(itemsPerLoad); }, resetDeps);

  // Lazily build the single observer. Its callback reads live state via refs.
  const getObserver = useCallback(() => {
    if (observerRef.current) return observerRef.current;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          setIsLoadingMore(true);
          // Track the pending timer so it can be cleared on unmount.
          loadTimerRef.current = setTimeout(() => {
            loadTimerRef.current = null;
            setVisibleCount((prev) => prev + itemsPerLoadRef.current);
            setIsLoadingMore(false);
          }, LOAD_DELAY_MS);
        }
      },
      { rootMargin: '0px 0px 200px 0px', threshold: 0 }
    );
    return observerRef.current;
  }, []);

  // Callback ref. React calls it with the sentinel node when it mounts and with
  // null when it unmounts, so a conditionally-rendered sentinel is (re-)observed
  // exactly when it appears — fixing the previous "observer attaches once on
  // mount, before the sentinel exists" bug. The identity is stable, so React
  // does not detach/reattach on every render.
  const loaderRef = useCallback((node) => {
    const observer = getObserver();
    observer.disconnect();
    if (node) observer.observe(node);
  }, [getObserver]);

  // Tear down the observer and any pending load-more timer on unmount so neither
  // outlives the component (MEM-15).
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    };
  }, []);

  return { visibleItems, hasMore, isLoadingMore, loaderRef };
}
