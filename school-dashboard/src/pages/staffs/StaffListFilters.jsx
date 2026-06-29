import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import FilterPillsBar from "../../components/ui/FilterPillsBar";
import { isActiveStaff } from "./utils/staffHelpers";

// Filters surfaced on the toolbar (segmented). README spec: All | Active | Today.
export const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "today", label: "Today" },
];

export function staffMatchesFilter(s, filter, todayStatusOf) {
  if (filter === "all") return true;
  if (filter === "active") return isActiveStaff(s);
  if (filter === "today") {
    const status = todayStatusOf?.(s);
    return status === "present" || status === "absent" || status === "leave";
  }
  return true;
}

export function searchMatch(s, q) {
  if (!q) return true;
  const t = q.toLowerCase();
  const role = Array.isArray(s.role) ? s.role.join(" ") : s.role || "";
  return (
    (s.name || "").toLowerCase().includes(t) ||
    (s.staffNumber || s.code || "").toLowerCase().includes(t) ||
    (s.email || "").toLowerCase().includes(t) ||
    role.toLowerCase().includes(t)
  );
}

/* ── sessionStorage helpers for staff filter values ── */
const parseArrayFilter = (key) => {
  const raw = sessionStorage.getItem(`staff-filter-${key}`);
  if (!raw || raw === "all") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed !== "all" ? [parsed] : [];
  } catch {
    return raw !== "all" ? [raw] : [];
  }
};
const parseStringFilter = (key, defaultValue = "all") => {
  const raw = sessionStorage.getItem(`staff-filter-${key}`);
  return raw && raw !== "all" ? raw : defaultValue;
};

const EMPTY_FACETS = { role: [], department: [], employmentType: [], gender: [] };
const FACET_KEYS = ["role", "department", "employmentType", "gender"];

/**
 * Normalizes whatever the caller passes into the facet shape `<FilterPillsBar/>`
 * consumes. SCH-193: the canonical input is the server-returned `facets` object
 * (`{ role: [{ value, count }, ...], ... }`). `null`/`undefined` degrades to an
 * empty facet set so the pill bar simply has no options until the server
 * payload lands.
 */
function useResolvedFacets(input) {
  return useMemo(() => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return EMPTY_FACETS;
    }
    const out = { ...EMPTY_FACETS };
    for (const key of FACET_KEYS) {
      const list = Array.isArray(input[key]) ? input[key] : [];
      out[key] = list
        .filter((entry) => entry && entry.value != null && entry.value !== "")
        .map((entry) => ({
          value: String(entry.value),
          count: Number(entry.count) || 0,
        }));
    }
    return out;
  }, [input]);
}

/**
 * Pills-based staff filter STATE (role / department / employment type / gender),
 * its sessionStorage persistence, the active-filter tally, and change handlers.
 *
 * SCH-193 / PAG-28-FE: this hook owns only the STATE. The facet-derived pill
 * options/counts live in `useStaffFiltersConfig`, which is called AFTER the
 * server payload arrives so it can render pills from real data. Splitting the
 * two avoids the chicken-and-egg where `useStaffList` needs the filter state
 * but the facets it returns are what feed the pill config.
 */
export function useStaffFilterState() {
  const [roleFilter, setRoleFilter] = useState(() => parseArrayFilter("role"));
  const [departmentFilter, setDepartmentFilter] = useState(() => parseStringFilter("department"));
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState(() => parseStringFilter("employmentType"));
  const [genderFilter, setGenderFilter] = useState(() => parseStringFilter("gender"));

  const activeFiltersCount =
    roleFilter.length +
    (departmentFilter !== "all" ? 1 : 0) +
    (employmentTypeFilter !== "all" ? 1 : 0) +
    (genderFilter !== "all" ? 1 : 0);

  const handleFilterChange = useCallback((filterKey, value) => {
    const setters = {
      role: setRoleFilter,
      department: setDepartmentFilter,
      employmentType: setEmploymentTypeFilter,
      gender: setGenderFilter,
    };
    const setter = setters[filterKey];
    if (!setter) return;

    if (filterKey === "role") {
      setter((prev) => {
        if (value === "all") {
          sessionStorage.setItem("staff-filter-role", JSON.stringify([]));
          return [];
        }
        const next = prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
        sessionStorage.setItem("staff-filter-role", JSON.stringify(next));
        return next;
      });
    } else {
      const next = value === "all" ? "all" : value;
      setter(next);
      sessionStorage.setItem(`staff-filter-${filterKey}`, next);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setRoleFilter([]);
    setDepartmentFilter("all");
    setEmploymentTypeFilter("all");
    setGenderFilter("all");
    ["role", "department", "employmentType", "gender"].forEach((k) =>
      sessionStorage.removeItem(`staff-filter-${k}`)
    );
    toast.success("All filters cleared");
  }, []);

  return {
    roleFilter,
    departmentFilter,
    employmentTypeFilter,
    genderFilter,
    activeFiltersCount,
    handleFilterChange,
    clearAllFilters,
  };
}

/**
 * Build the `filtersConfig` shape `<FilterPillsBar/>` consumes from the server
 * facets + the current filter state. SCH-193: pill `options` + `counts` come
 * from the server-returned `facets` aggregate (computed by GET /staff over
 * `q` + `today`, excluding facet selections). Each facet is `[{ value, count }]`
 * server-side; the bar wants `options: string[]` and `counts: { [value]: number }`.
 */
export function useStaffFiltersConfig(facets, filterState) {
  const resolved = useResolvedFacets(facets);

  return useMemo(() => {
    const buildOptions = (key) => resolved[key].map((f) => f.value);
    const buildCounts = (key) =>
      Object.fromEntries(resolved[key].map((f) => [f.value, f.count]));

    return {
      role: {
        label: "Role",
        value: filterState.roleFilter,
        mode: "multi",
        options: buildOptions("role"),
        counts: buildCounts("role"),
        displayLabels: {},
      },
      department: {
        label: "Department",
        value: filterState.departmentFilter,
        mode: "single",
        options: buildOptions("department"),
        counts: buildCounts("department"),
        displayLabels: {},
      },
      employmentType: {
        label: "Employment Type",
        value: filterState.employmentTypeFilter,
        mode: "single",
        options: buildOptions("employmentType"),
        counts: buildCounts("employmentType"),
        displayLabels: {},
      },
      gender: {
        label: "Gender",
        value: filterState.genderFilter,
        mode: "single",
        options: buildOptions("gender"),
        counts: buildCounts("gender"),
        displayLabels: {},
      },
    };
  }, [
    resolved,
    filterState.roleFilter,
    filterState.departmentFilter,
    filterState.employmentTypeFilter,
    filterState.genderFilter,
  ]);
}

/**
 * Back-compat single-call API: state + facet-driven config in one hook.
 *
 * SCH-193 / PAG-28-FE: callers that don't need the split (none in this codebase
 * today — kept for tests and any external consumer) can use this. When `facets`
 * is null/empty, the returned `filtersConfig` has no options but the filter
 * STATE is fully usable; the caller rebuilds via `useStaffFiltersConfig` once
 * the server payload arrives. `StaffList.jsx` uses the split form so the hook
 * order is stable across renders even before `facets` lands.
 */
export function useStaffFilters(facets) {
  const state = useStaffFilterState();
  const filtersConfig = useStaffFiltersConfig(facets, state);
  return { ...state, filtersConfig };
}

/**
 * Presentational pills bar for the staff list. State and derivations live in
 * `useStaffFilterState` + `useStaffFiltersConfig`; this just renders the shared
 * FilterPillsBar.
 */
export default function StaffListFilters({
  filtersConfig,
  onFilterChange,
  onClearAll,
  activeFiltersCount,
}) {
  return (
    <FilterPillsBar
      filters={filtersConfig}
      onFilterChange={onFilterChange}
      onClearAll={onClearAll}
      activeFiltersCount={activeFiltersCount}
    />
  );
}
