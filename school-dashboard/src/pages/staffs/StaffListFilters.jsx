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

/* ── sessionStorage helpers for staff filters ── */
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

/**
 * Owns the pills-based staff filter state (role / department / employment
 * type / gender), its sessionStorage persistence, and the derived option
 * lists, counts, and active-filter tally. Returns everything the list shell
 * needs to filter `visible` plus what <StaffListFilters/> needs to render.
 */
export function useStaffFilters(staff) {
  const [roleFilter, setRoleFilter] = useState(() => parseArrayFilter("role"));
  const [departmentFilter, setDepartmentFilter] = useState(() => parseStringFilter("department"));
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState(() => parseStringFilter("employmentType"));
  const [genderFilter, setGenderFilter] = useState(() => parseStringFilter("gender"));

  // ── Derived unique filter values ──
  const uniqueRoles = useMemo(() => {
    const set = new Set();
    staff.forEach((s) => {
      if (Array.isArray(s.role)) s.role.forEach((r) => { if (r) set.add(r); });
      else if (s.role) set.add(s.role);
    });
    return [...set].sort();
  }, [staff]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set();
    staff.forEach((s) => { if (s.department) set.add(s.department); });
    return [...set].sort();
  }, [staff]);

  const uniqueEmploymentTypes = useMemo(() => {
    const set = new Set();
    staff.forEach((s) => { if (s.employmentType) set.add(s.employmentType); });
    return [...set].sort();
  }, [staff]);

  const uniqueGenders = useMemo(() => {
    const set = new Set();
    staff.forEach((s) => { if (s.gender) set.add(s.gender); });
    return [...set].sort();
  }, [staff]);

  // ── Filter counts ──
  const filterCounts = useMemo(() => {
    const roleCounts = {};
    const deptCounts = {};
    const empCounts = {};
    const genderCounts = {};
    staff.forEach((s) => {
      if (Array.isArray(s.role)) {
        s.role.forEach((r) => { if (r) roleCounts[r] = (roleCounts[r] || 0) + 1; });
      } else if (s.role) {
        roleCounts[s.role] = (roleCounts[s.role] || 0) + 1;
      }
      if (s.department) deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
      if (s.employmentType) empCounts[s.employmentType] = (empCounts[s.employmentType] || 0) + 1;
      if (s.gender) genderCounts[s.gender] = (genderCounts[s.gender] || 0) + 1;
    });
    return { role: roleCounts, department: deptCounts, employmentType: empCounts, gender: genderCounts };
  }, [staff]);

  // ── Active filter count ──
  const activeFiltersCount =
    roleFilter.length +
    (departmentFilter !== "all" ? 1 : 0) +
    (employmentTypeFilter !== "all" ? 1 : 0) +
    (genderFilter !== "all" ? 1 : 0);

  // ── Filter config for FilterPillsBar ──
  const filtersConfig = useMemo(() => ({
    role: {
      label: "Role",
      value: roleFilter,
      mode: "multi",
      options: uniqueRoles,
      counts: filterCounts.role,
      displayLabels: {},
    },
    department: {
      label: "Department",
      value: departmentFilter,
      mode: "single",
      options: uniqueDepartments,
      counts: filterCounts.department,
      displayLabels: {},
    },
    employmentType: {
      label: "Employment Type",
      value: employmentTypeFilter,
      mode: "single",
      options: uniqueEmploymentTypes,
      counts: filterCounts.employmentType,
      displayLabels: {},
    },
    gender: {
      label: "Gender",
      value: genderFilter,
      mode: "single",
      options: uniqueGenders,
      counts: filterCounts.gender,
      displayLabels: {},
    },
  }), [roleFilter, departmentFilter, employmentTypeFilter, genderFilter, uniqueRoles, uniqueDepartments, uniqueEmploymentTypes, uniqueGenders, filterCounts]);

  // ── Filter change handler ──
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
    filtersConfig,
    activeFiltersCount,
    handleFilterChange,
    clearAllFilters,
  };
}

/**
 * Presentational pills bar for the staff list. State and derivations live in
 * `useStaffFilters`; this just renders the shared FilterPillsBar.
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
