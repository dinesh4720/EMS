/**
 * usePaginatedQuery — shared wrapper around TanStack Query for server-paginated
 * list endpoints.
 *
 * Goal: replace the `useState(loading)/useState(data)/useState(error)` +
 * `useEffect(..., [])` + manual AbortController plumbing that ~250 pages
 * hand-roll today. See CODE-03 in the audit.
 *
 * It does NOT replace the existing `hooks/useEntityFetch.js` — that one
 * paginates an *already-fetched* array client-side via IntersectionObserver.
 * This hook handles the much more common case: the backend owns paging and the
 * UI just shows a page.
 *
 * @example
 *   // Before (hand-rolled):
 *   const [items, setItems] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState(null);
 *   const [page, setPage] = useState(1);
 *   useEffect(() => {
 *     const ctrl = new AbortController();
 *     api.list({ page, limit: 20, search })
 *       .then((res) => setItems(res.data))
 *       .catch(setError)
 *       .finally(() => setLoading(false));
 *     return () => ctrl.abort();
 *   }, [page, search]);
 *
 *   // After:
 *   const { items, page, setPage, totalPages, isLoading, isError, isEmpty } =
 *     usePaginatedQuery({
 *       queryKey: queryKeys.students.list({ search }),
 *       queryFn: ({ page, limit, search }, { signal }) =>
 *         studentsApi.list({ page, limit, search }, { signal }),
 *       page: 1,
 *       limit: 20,
 *       filters: { search },
 *     });
 *
 * Contract
 * ────────
 *   queryFn  — async (params, { signal }) => Promise<PaginatedResponse | T[]>
 *              where params = { page, limit, ...filters, signal }.
 *              The response can be either:
 *                (a) { data: T[], pagination: { currentPage, totalPages,
 *                      totalItems, itemsPerPage, hasNextPage, hasPrevPage } }
 *                    — matches `studentsApi.list`, `studentsApi.getAll`, etc.
 *                (b) bare T[]                 — when the endpoint is uncapped
 *                    (e.g. legacy /announcements, /reminders). The wrapper
 *                    synthesizes a single-page pagination from the array.
 *
 *   select   — optional (response, { page, limit, ...filters }) => shape.
 *              Use it to lift a specific field out of the response, e.g.
 *              select: (res) => res.hostels, then items is the array.
 *
 *   keepPreviousData — default true. While a new page is loading, the previous
 *              page's items remain in `items` so the list doesn't flash empty.
 *              Set to false if the page has its own skeleton that wants a
 *              clean "isFetching" state.
 */

import { useCallback, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

const DEFAULT_LIMIT = 20;

/**
 * Normalize whatever the endpoint returned into `{ data, pagination }`.
 *
 * Two input shapes are accepted:
 *   1. { data, pagination } — the canonical paginated response
 *   2. T[]                  — a bare array; synthesize single-page pagination
 *   3. anything else        — treat it as `data` and synthesize pagination
 *      (e.g. a resource that returns `{ items: [...] }` and no pagination
 *      block — the caller's `select` should already have lifted `items`
 *      out before this point, but if it hasn't we still render something
 *      instead of crashing.)
 *
 * @param {unknown} response
 * @param {{ page: number, limit: number }} pageParams
 * @returns {{ data: unknown[], pagination: Pagination }}
 */
export function normalizePaginatedResponse(response, { page, limit }) {
  const pagination = {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
    hasNextPage: false,
    hasPrevPage: page > 1,
  };

  if (response == null) {
    return { data: [], pagination };
  }

  // Shape 1: { data, pagination }
  if (typeof response === "object" && !Array.isArray(response) && "data" in response) {
    const data = Array.isArray(response.data) ? response.data : [];
    const upstream = response.pagination;
    if (upstream && typeof upstream === "object") {
      return {
        data,
        pagination: {
          currentPage: upstream.currentPage ?? page,
          totalPages: upstream.totalPages ?? Math.max(1, Math.ceil((upstream.totalItems ?? data.length) / limit)),
          totalItems: upstream.totalItems ?? data.length,
          itemsPerPage: upstream.itemsPerPage ?? limit,
          hasNextPage:
            typeof upstream.hasNextPage === "boolean"
              ? upstream.hasNextPage
              : (upstream.currentPage ?? page) < (upstream.totalPages ?? 1),
          hasPrevPage:
            typeof upstream.hasPrevPage === "boolean"
              ? upstream.hasPrevPage
              : (upstream.currentPage ?? page) > 1,
        },
      };
    }
    // No pagination block — synthesize from the data length.
    pagination.totalItems = data.length;
    pagination.totalPages = data.length === 0 ? 1 : Math.ceil(data.length / limit);
    pagination.hasNextPage = data.length > limit;
    return { data, pagination };
  }

  // Shape 2: bare array
  if (Array.isArray(response)) {
    const total = response.length;
    return {
      data: response,
      pagination: {
        ...pagination,
        totalItems: total,
        totalPages: total === 0 ? 1 : Math.max(1, Math.ceil(total / limit)),
        hasNextPage: total > limit,
      },
    };
  }

  // Shape 3: unknown — wrap defensively
  return { data: [], pagination };
}

/**
 * Stable string key for the filters object so the queryKey changes predictably
 * when filters change, but stays the same when the caller passes a fresh
 * object literal with the same contents.
 */
function serializeFilters(filters) {
  if (!filters || typeof filters !== "object") return [];
  return Object.keys(filters)
    .sort()
    .map((k) => [k, filters[k]]);
}

/**
 * @typedef {Object} Pagination
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {number} totalItems
 * @property {number} itemsPerPage
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 */

/**
 * @typedef {Object} UsePaginatedQueryParams
 * @property {ReadonlyArray<unknown>} queryKey            - Base key; page/limit are appended.
 * @property {(params: { page: number, limit: number, signal: AbortSignal } & Record<string, unknown>) => Promise<unknown>} queryFn
 * @property {number} [page=1]
 * @property {number} [limit=20]
 * @property {Record<string, unknown>} [filters={}]      - Extra params merged into queryKey + queryFn.
 * @property {boolean} [enabled=true]
 * @property {number} [staleTime]
 * @property {number} [gcTime]
 * @property {boolean} [keepPreviousData=true]
 * @property {(response: unknown, params: object) => unknown} [select]  - Optional post-fetch transform.
 */

/**
 * @typedef {Object} UsePaginatedQueryResult
 * @property {Array<unknown>} items
 * @property {number} page
 * @property {number} limit
 * @property {Pagination} pagination
 * @property {number} totalItems
 * @property {number} totalPages
 * @property {boolean} isLoading        - True only on the first load (no cached data).
 * @property {boolean} isFetching       - True on first load + every background refetch.
 * @property {boolean} isError
 * @property {Error|null} error
 * @property {boolean} isEmpty          - True when the load completed and items is [].
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 * @property {(next: number) => void} setPage
 * @property {(next: number) => void} setLimit
 * @property {() => void} nextPage
 * @property {() => void} prevPage
 * @property {() => Promise<unknown>} refetch
 * @property {(filters: Record<string, unknown>) => void} setFilters  - Replace filters; resets page to 1.
 */

/**
 * usePaginatedQuery
 *
 * NOTE: The `page`/`limit` values passed in are *initial* values. The hook
 * keeps its own internal state so that callers don't need to wire up their
 * own `useState(page)` plumbing. If you need controlled page state (e.g. to
 * persist page in the URL), read `page` and call `setPage` from your own
 * `useSearchParams`.
 *
 * @param {UsePaginatedQueryParams} params
 * @returns {UsePaginatedQueryResult}
 */
export function usePaginatedQuery({
  queryKey,
  queryFn,
  page: initialPage = 1,
  limit: initialLimit = DEFAULT_LIMIT,
  filters: initialFilters = {},
  enabled = true,
  staleTime,
  gcTime,
  keepPreviousData: keepPrev = true,
  select,
} = {}) {
  if (!Array.isArray(queryKey)) {
    throw new TypeError("usePaginatedQuery: queryKey must be an array");
  }
  if (typeof queryFn !== "function") {
    throw new TypeError("usePaginatedQuery: queryFn must be a function");
  }

  // Internal page/limit/filters state. We keep them here (rather than reading
  // from a parent) so a hand-off like `usePaginatedQuery({ page: urlPage })`
  // doesn't fight with the hook's own paging actions.
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [filters, setFiltersState] = useState(initialFilters);

  // Serialized filters ensure the queryKey is referentially stable across
  // re-renders that pass a fresh object literal.
  const stableFilters = useMemo(
    () => Object.fromEntries(serializeFilters(filters)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(serializeFilters(filters))]
  );

  const fullQueryKey = useMemo(
    () => [...queryKey, { page, limit, filters: stableFilters }],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(queryKey), page, limit, JSON.stringify(stableFilters)]
  );

  const result = useQuery({
    queryKey: fullQueryKey,
    enabled,
    staleTime,
    gcTime,
    placeholderData: keepPrev ? keepPreviousData : undefined,
    queryFn: async ({ signal }) => {
      const params = { page, limit, ...stableFilters, signal };
      return queryFn(params, { signal });
    },
    select: (response) => {
      const transformed = select ? select(response, { page, limit, ...stableFilters }) : response;
      return normalizePaginatedResponse(transformed, { page, limit });
    },
  });

  const items = result.data?.data ?? [];
  // `totalItems` and `totalPages` are derived from the most recent successful
  // response. They stay stable while a new page is loading (placeholderData
  // reuses the prior normalized result), so the totals in the UI never flash
  // back to 0 mid-pagination.
  const totalItems = result.data?.pagination?.totalItems ?? 0;
  const totalPages = result.data?.pagination?.totalPages ?? 1;
  const itemsPerPage = result.data?.pagination?.itemsPerPage ?? limit;
  const upstreamCurrentPage = result.data?.pagination?.currentPage ?? page;

  // `hasNextPage` / `hasPrevPage` are computed from the *user-controlled*
  // `page` state plus the (stable) totalPages. This avoids a brief mismatch
  // when paginating with keepPreviousData: e.g. moving to page 2, the
  // placeholder still reports upstream currentPage=1, but the UI should
  // already be reflecting "I'm on page 2 now".
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const isEmpty = !result.isLoading && !result.isError && items.length === 0;

  const setPage = useCallback((next) => {
    if (typeof next !== "number" || !Number.isFinite(next)) return;
    setPageState(Math.max(1, Math.floor(next)));
  }, []);

  const setLimit = useCallback((next) => {
    if (typeof next !== "number" || !Number.isFinite(next) || next <= 0) return;
    setLimitState(Math.floor(next));
    setPageState(1);
  }, []);

  const setFilters = useCallback((next) => {
    setFiltersState(next || {});
    setPageState(1);
  }, []);

  const nextPage = useCallback(() => {
    setPageState((p) => (p < totalPages ? p + 1 : p));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPageState((p) => (p > 1 ? p - 1 : p));
  }, []);

  return {
    items,
    page,
    limit,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage,
      // Surface the upstream currentPage as a hint — when keepPreviousData is
      // active this can briefly lag `page`, which is why the derived
      // `hasNextPage` / `hasPrevPage` below use `page` instead.
      upstreamCurrentPage,
      hasNextPage,
      hasPrevPage,
    },
    totalItems,
    totalPages,
    isLoading: result.isPending,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    isEmpty,
    hasNextPage,
    hasPrevPage,
    setPage,
    setLimit,
    setFilters,
    nextPage,
    prevPage,
    refetch: result.refetch,
  };
}

export default usePaginatedQuery;
