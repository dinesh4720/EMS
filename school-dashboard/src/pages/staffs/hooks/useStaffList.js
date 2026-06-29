import { useCallback, useEffect, useRef, useState } from "react";
import { staffApi } from "../../../services/api";
import { useDebounce } from "../../../hooks/useDebounce";
import logger from "../../../utils/logger";

// Debounce search input so we don't fire one server request per keystroke.
// 300ms matches the other server-paginated lists (Assets, Admissions, Library).
const SEARCH_DEBOUNCE_MS = 300;

// Facet keys the server returns — kept here so the hook can normalize a
// missing/short `facets` payload into a stable empty shape for the bar.
const FACET_KEYS = ["role", "department", "employmentType", "gender"];

const EMPTY_FACETS = {
  role: [],
  department: [],
  employmentType: [],
  gender: [],
};

function normalizeFacets(facets) {
  if (!facets || typeof facets !== "object") return EMPTY_FACETS;
  const out = { ...EMPTY_FACETS };
  for (const key of FACET_KEYS) {
    const list = Array.isArray(facets[key]) ? facets[key] : [];
    out[key] = list
      .filter((entry) => entry && entry.value != null && entry.value !== "")
      .map((entry) => ({ value: String(entry.value), count: Number(entry.count) || 0 }));
  }
  return out;
}

/**
 * useStaffList — server-driven data hook for the Staff list page (SCH-193).
 *
 * Owns the network plumbing that StaffList.jsx used to hand-roll:
 *   - debounced `q` so typing doesn't fire a request per keystroke
 *   - one AbortController per in-flight fetch; aborts on param change or unmount
 *   - smart `includeFacets`: request the 4 aggregation queries only when the
 *     filter set changes (search / facets / today / status), not when merely
 *     paging within the same filter set
 *   - clamps `page` back into range when the server reports `totalPages`
 *     smaller than the current page (last page of a deleted result set, etc.)
 *
 * @param {object}   opts
 * @param {string}   opts.q              Raw (un-debounced) search input
 * @param {string}   opts.filter         Segmented All/Active/Today filter
 * @param {string[]} opts.roleFilter     Multi-select role facet
 * @param {string}   opts.departmentFilter
 * @param {string}   opts.employmentTypeFilter
 * @param {string}   opts.genderFilter
 * @param {number}   opts.page           1-indexed current page
 * @param {number}   opts.pageSize       Items per page
 * @returns {{
 *   data: array,
 *   pagination: { page: number, limit: number, total: number, totalPages: number } | null,
 *   facets: object,
 *   loading: boolean,
 *   error: string | null,
 *   clampedPage: number,    // server-corrected page (may be < opts.page)
 *   reload: () => void,     // imperatively re-fetch with the current params
 * }}
 */
export function useStaffList({
  q,
  filter,
  roleFilter = [],
  departmentFilter = "all",
  employmentTypeFilter = "all",
  genderFilter = "all",
  page,
  pageSize,
}) {
  const debouncedQ = useDebounce(q, SEARCH_DEBOUNCE_MS);

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [facets, setFacets] = useState(EMPTY_FACETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clampedPage, setClampedPage] = useState(page);

  // Imperative reload trigger. Bumping the counter re-runs the fetch effect
  // without changing any params — useful after a mutate (add/update/delete)
  // when the caller wants to refresh the current view.
  const [reloadTick, setReloadTick] = useState(0);
  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  // Track the last filter-set we requested facets for. Paging within the same
  // filter set passes includeFacets=false to skip the 4 aggregation queries.
  const facetSignatureRef = useRef("");
  const isFirstFetchRef = useRef(true);

  // Array filters (`roleFilter`) are new array references per render in some
  // callers; stringify them so the effect dep comparison is value-based, not
  // identity-based. This avoids an infinite re-fetch loop when a parent
  // passes a fresh literal on every render (e.g. in tests or in components
  // that haven't memoized the prop).
  const roleFilterKey = JSON.stringify(roleFilter || []);
  const departmentFilterKey = departmentFilter || "all";
  const employmentTypeFilterKey = employmentTypeFilter || "all";
  const genderFilterKey = genderFilter || "all";

  useEffect(() => {
    const controller = new AbortController();

    // Reconstruct the role filter from its stable JSON key.
    const roleArray = JSON.parse(roleFilterKey);
    const roleParam = Array.isArray(roleArray) && roleArray.length > 0 ? roleArray : undefined;
    // Segmented filter → server params. `today` is a join flag, `active` is a
    // status filter; `all` sends neither.
    const todayParam = filter === "today" ? "true" : undefined;
    const statusParam = filter === "active" ? "active" : undefined;

    const filterSignature = JSON.stringify({
      q: debouncedQ,
      filter,
      role: roleParam || null,
      department: departmentFilter,
      employmentType: employmentTypeFilter,
      gender: genderFilter,
    });

    // The first fetch and every filter-set change need facets; mere paging
    // (page N+1 of the same set) does not.
    const includeFacets =
      isFirstFetchRef.current || facetSignatureRef.current !== filterSignature ? "true" : "false";

    setLoading(true);
    setError(null);

    staffApi
      .list(
        {
          page,
          limit: pageSize,
          q: debouncedQ || undefined,
          role: roleParam,
          department: departmentFilter,
          employmentType: employmentTypeFilter,
          gender: genderFilter,
          today: todayParam,
          status: statusParam,
          includeFacets,
        },
        { signal: controller.signal }
      )
      .then((result) => {
        // Defensive — a late-resolving response whose controller was aborted
        // (e.g. StrictMode remount) would try to setState on an unmounted hook.
        if (controller.signal.aborted) return;

        setData(Array.isArray(result.data) ? result.data : []);
        setPagination(result.pagination || null);
        if (result.facets) {
          setFacets(normalizeFacets(result.facets));
        }

        // Clamp page into range. The StaffList effect also watches `totalPages`
        // and will reset via setPage; this clampedPage value lets the caller
        // render a sane page number in the meantime.
        const totalPages = result.pagination?.totalPages || 1;
        if (page > totalPages) {
          setClampedPage(totalPages);
        } else {
          setClampedPage(page);
        }

        facetSignatureRef.current = filterSignature;
        isFirstFetchRef.current = false;
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err?.name === "AbortError") return;
        logger.error("useStaffList: failed to load staff page", err);
        setError(err?.message || "Failed to load staff");
        // Keep prior data on transient errors so the page doesn't blank out.
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // Array/scalar filter values are intentionally compared via the stringified
    // *Key variants above to avoid identity-based re-fetches when a parent
    // hands us a fresh array literal per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedQ,
    filter,
    roleFilterKey,
    departmentFilterKey,
    employmentTypeFilterKey,
    genderFilterKey,
    page,
    pageSize,
    reloadTick,
  ]);

  return { data, pagination, facets, loading, error, clampedPage, reload };
}

export default useStaffList;
