import { useState, useMemo, useEffect, useRef } from "react";

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
  const loaderRef = useRef(null);

  // Refs let the IntersectionObserver callback read current values without stale closures
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const hasMore = visibleCount < items.length;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;

  // Reset visible count whenever filter-related deps change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setVisibleCount(itemsPerLoad); }, resetDeps);

  // Attach IntersectionObserver once on mount. Refs (hasMoreRef, isLoadingMoreRef)
  // are kept current on every render, so the callback never reads stale values and
  // the observer does not need to be recreated on state changes.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + itemsPerLoad);
            setIsLoadingMore(false);
          }, LOAD_DELAY_MS);
        }
      },
      { rootMargin: '0px 0px 200px 0px', threshold: 0 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { visibleItems, hasMore, isLoadingMore, loaderRef };
}
