import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, MessageSquare, CheckCircle2 } from "lucide-react";
import SkeletonTable from "../../components/skeletons/SkeletonTable";
import { useApp } from "../../context/AppContext";
import ToolbarSearch from "../../components/ui/ToolbarSearch";
import BulkActionBar from "../../components/ui/BulkActionBar";
import FilterPillsBar from "../../components/ui/FilterPillsBar";
import useBulkSelection from "../../hooks/useBulkSelection";
import StaffListRow from "./StaffListRow";
import StaffDetailPane from "./StaffDetailPane";
import toast from "react-hot-toast";

// Mobile breakpoint — below this the right pane collapses to a Drawer
const MOBILE_MAX = 1099;

// Filters surfaced on the toolbar (segmented). README spec: All | Active | Today.
const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "today", label: "Today" },
];

function staffMatchesFilter(s, filter, todayStatusOf) {
  if (filter === "all") return true;
  if (filter === "active") return (s.status || "active") === "active";
  if (filter === "today") {
    const status = todayStatusOf?.(s);
    return status === "present" || status === "absent" || status === "leave";
  }
  return true;
}

function searchMatch(s, q) {
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

export default function StaffList({ onStaffClick, onAddStaff }) {
  const { staff = [], staffAttendance, loading } = useApp();

  // ============ Routing first (Step 1) ============
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id") || null;
  const initialQ = searchParams.get("q") || "";
  const urlFilter = searchParams.get("filter");
  const filter = FILTERS.some((f) => f.key === urlFilter) ? urlFilter : "all";

  const setSelectedId = useCallback(
    (id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("id", id);
          else next.delete("id");
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  const setFilter = useCallback(
    (key) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (key && key !== "all") next.set("filter", key);
          else next.delete("filter");
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  // ============ Local UI state ============
  const [q, setQ] = useState(initialQ);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth <= MOBILE_MAX
      : false
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= MOBILE_MAX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Pills-based filter state ──
  const [roleFilter, setRoleFilter] = useState(() => parseArrayFilter("role"));
  const [departmentFilter, setDepartmentFilter] = useState(() => parseStringFilter("department"));
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState(() => parseStringFilter("employmentType"));
  const [genderFilter, setGenderFilter] = useState(() => parseStringFilter("gender"));

  // Today's attendance lookup for a given staff member.
  const todayKey = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );
  const todayStatusOf = useCallback(
    (s) => {
      const id = s._id || s.id;
      const recorded = staffAttendance?.[id]?.[todayKey]?.status;
      if (recorded) return String(recorded).toLowerCase();
      return null;
    },
    [staffAttendance, todayKey]
  );

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

  // Search + filter pass — preserves underlying ordering
  const visible = useMemo(() => {
    return staff.filter((s) => {
      if (!searchMatch(s, q)) return false;
      if (!staffMatchesFilter(s, filter, todayStatusOf)) return false;

      // Role filter (multi-select, OR)
      if (roleFilter.length > 0) {
        const staffRoles = Array.isArray(s.role) ? s.role : [s.role].filter(Boolean);
        if (!roleFilter.some((r) => staffRoles.includes(r))) return false;
      }

      // Department filter (single-select)
      if (departmentFilter !== "all" && s.department !== departmentFilter) return false;

      // Employment type filter (single-select)
      if (employmentTypeFilter !== "all" && s.employmentType !== employmentTypeFilter) return false;

      // Gender filter (single-select)
      if (genderFilter !== "all" && s.gender !== genderFilter) return false;

      return true;
    });
  }, [staff, q, filter, todayStatusOf, roleFilter, departmentFilter, employmentTypeFilter, genderFilter]);

  // Stable id list for the shared bulk-selection hook.
  const visibleIds = useMemo(
    () => visible.map((s) => s._id || s.id),
    [visible]
  );

  // Bulk selection — shared hook (REVAMP-101): Esc clears, shift-click range,
  // "Select all" = visible only, "Select all matching N" CTA when applicable.
  const selection = useBulkSelection({
    visibleIds,
    totalMatching: visible.length,
  });

  const statusCounts = useMemo(() => {
    const all = staff.length;
    let active = 0;
    let today = 0;
    for (const s of staff) {
      if ((s.status || "active") === "active") active++;
      const tStatus = todayStatusOf(s);
      if (tStatus === "present" || tStatus === "absent" || tStatus === "leave") today++;
    }
    return { all, active, today };
  }, [staff, todayStatusOf]);

  // Selected staff record from the URL
  const selectedStaff = useMemo(() => {
    if (!selectedId) return null;
    return (
      staff.find((s) => (s._id || s.id) === selectedId) || null
    );
  }, [selectedId, staff]);

  // Auto-select the first visible staff on desktop when nothing is in
  // the URL — matches the design's two-pane default state where the
  // detail panel is always populated.
  useEffect(() => {
    if (isMobileViewport) return;
    if (selectedId) return;
    if (visible.length === 0) return;
    const first = visible[0];
    setSelectedId(first._id || first.id);
    // Replace history entry so this auto-pick doesn't clog back-navigation.
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("id", first._id || first.id);
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileViewport, selectedId, visible.length]);

  // ============ Keyboard nav (Step 3) — scoped to list focus ============
  const listRef = useRef(null);
  const rowRefs = useRef(new Map());

  const moveSelection = useCallback(
    (delta) => {
      if (visible.length === 0) return;
      const currentIdx = visible.findIndex(
        (s) => (s._id || s.id) === selectedId
      );
      const nextIdx =
        currentIdx === -1
          ? delta > 0
            ? 0
            : visible.length - 1
          : Math.min(visible.length - 1, Math.max(0, currentIdx + delta));
      const nextStaff = visible[nextIdx];
      if (!nextStaff) return;
      const nextId = nextStaff._id || nextStaff.id;
      setSelectedId(nextId);
      // Scroll the row into view next tick (after render)
      requestAnimationFrame(() => {
        rowRefs.current.get(nextId)?.scrollIntoView({
          block: "nearest",
        });
        rowRefs.current.get(nextId)?.focus({ preventScroll: true });
      });
    },
    [visible, selectedId, setSelectedId]
  );

  const handleListKeyDown = useCallback(
    (e) => {
      // Ignore typing inside the search input — we only act on row buttons
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1);
      } else if (e.key === "Enter") {
        // Enter on a row keeps selection — for now we just confirm by no-op.
        // (Could open profile in future; spec says "keeps it".)
        e.preventDefault();
      } else if (e.key === "Escape") {
        // If a selection exists, useBulkSelection handles Esc → clear.
        // Otherwise fall through and clear the row focus.
        if (selection.count > 0) return;
        e.preventDefault();
        setSelectedId(null);
      }
    },
    [moveSelection, setSelectedId, selection.count]
  );

  // ============ Bulk action handlers ============
  const toggleCheck = useCallback(
    (s, event) => selection.toggle(s._id || s.id, event),
    [selection]
  );

  const handleBulkMarkPresent = () => {
    // Stub — the underlying mark-present endpoint isn't wired yet.
    // TODO: call attendanceApi.bulkMark({ staffIds: selection.selectedIds, status: 'present' })
    toast.success(
      `Marked ${selection.count} staff present (queued — endpoint not wired yet).`
    );
    selection.clear();
  };

  const handleBulkMessage = () => {
    // TODO: open compose drawer pre-populated with selected recipients
    toast(`Message ${selection.count} staff (compose UI pending).`);
  };

  // ============ Single-row mark-attendance ============
  const handleMarkAttendanceFor = (s) => {
    // Stub — real flow opens a status picker (present/absent/leave).
    // TODO: open mark-attendance popover with status choices
    toast.success(`Marked ${s.name} present (endpoint not wired yet).`);
  };

  // ============ Detail-pane "View profile" → deep dashboard ============
  const handleViewProfile = useCallback(
    (s) => {
      const id = s._id || s.id;
      if (onStaffClick) onStaffClick(id);
    },
    [onStaffClick]
  );

  const closeDetail = () => setSelectedId(null);

  // The detail pane in mobile mode is a slide-over Drawer
  const detailVisible = !!selectedStaff;

  const showClearButton = filter !== "all" || q || activeFiltersCount > 0;

  return (
    <div
      className="page"
      style={
        isMobileViewport
          ? { display: "flex", flexDirection: "column", minHeight: 0 }
          : {
              display: "grid",
              gridTemplateColumns: "minmax(420px, 1fr) 380px",
              gap: 0,
              minHeight: 0,
            }
      }
    >
      {/* Left list */}
      <div
        style={{
          borderRight: isMobileViewport ? "none" : "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div className="page__head" style={{ paddingBottom: 12 }}>
          <div>
            <h1 className="page__title">Staff</h1>
            <div className="page__sub">
              <span className="mono tnum">{visible.length}</span> of{" "}
              <span className="mono tnum">{staff.length}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--accent"
            onClick={onAddStaff}
          >
            <Plus size={13} aria-hidden />
            Add staff
          </button>
        </div>

        {/* Toolbar: segmented + search + bulk-action chip */}
        <div className="toolbar">
          <div className="seg" role="tablist" aria-label="Filter staff">
            {FILTERS.map((f) => {
              const count = statusCounts?.[f.key] ?? 0;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`seg__btn ${filter === f.key ? "is-active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  <span className="mono tnum" style={{ marginLeft: 6, color: "var(--fg-subtle)", fontSize: 11 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <ToolbarSearch
            value={q}
            onChange={setQ}
            urlParam="q"
            placeholder="Search staff…"
            ariaLabel="Search staff"
            style={{ marginLeft: "auto", flex: "0 1 280px", minWidth: 0 }}
          />

          {showClearButton && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setQ("");
                clearAllFilters();
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete("filter");
                    next.delete("q");
                    return next;
                  },
                  { replace: false }
                );
              }}
              style={{ color: "var(--fg-muted)" }}
              aria-label="Clear all filters"
            >
              Clear
            </button>
          )}

          <BulkActionBar
            selection={selection}
            totalMatching={visible.length}
          >
            <button
              type="button"
              className="btn btn--sm"
              onClick={handleBulkMarkPresent}
            >
              <CheckCircle2 size={12} aria-hidden /> Mark present
            </button>
            <button
              type="button"
              className="btn btn--sm"
              onClick={handleBulkMessage}
            >
              <MessageSquare size={12} aria-hidden /> Message
            </button>
          </BulkActionBar>
        </div>

        {/* Filter pills bar */}
        <FilterPillsBar
          filters={filtersConfig}
          onFilterChange={handleFilterChange}
          onClearAll={clearAllFilters}
          activeFiltersCount={activeFiltersCount}
        />

        {/* List rows */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Staff list"
          tabIndex={0}
          onKeyDown={handleListKeyDown}
          style={{
            flex: 1,
            overflow: "auto",
            outline: "none",
            minHeight: 0,
          }}
        >
          {loading ? (
            <div style={{ padding: 16 }}>
              <SkeletonTable columns={4} rows={6} />
            </div>
          ) : visible.length === 0 ? (
            <div
              className="subtle"
              style={{ padding: 32, textAlign: "center", fontSize: 13 }}
            >
              No staff matched.
            </div>
          ) : (
            visible.map((s) => {
              const id = s._id || s.id;
              return (
                <StaffListRow
                  key={id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(id, el);
                    else rowRefs.current.delete(id);
                  }}
                  staff={s}
                  isActive={selectedId === id}
                  isChecked={selection.isSelected(id)}
                  onSelect={() => setSelectedId(id)}
                  onToggleCheck={toggleCheck}
                  todayStatus={todayStatusOf(s)}
                  attendancePct={s.attendancePct}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Right detail pane — desktop only inline; mobile renders below */}
      {!isMobileViewport && (
        <StaffDetailPane
          staff={selectedStaff}
          todayStatus={selectedStaff ? todayStatusOf(selectedStaff) : null}
          attendancePct={selectedStaff?.attendancePct}
          checkInTime={
            selectedStaff
              ? staffAttendance?.[selectedStaff._id || selectedStaff.id]?.[
                  todayKey
                ]?.checkIn || null
              : null
          }
          recentActivity={[]}
          onClose={closeDetail}
          onViewProfile={() =>
            selectedStaff && handleViewProfile(selectedStaff)
          }
          onMarkAttendance={() =>
            selectedStaff && handleMarkAttendanceFor(selectedStaff)
          }
        />
      )}

      {/* Mobile: slide-over drawer for detail */}
      {isMobileViewport && detailVisible && (
        <div
          className="stafflist__drawer-overlay"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            className="stafflist__drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Profile: ${selectedStaff?.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <StaffDetailPane
              staff={selectedStaff}
              todayStatus={selectedStaff ? todayStatusOf(selectedStaff) : null}
              attendancePct={selectedStaff?.attendancePct}
              checkInTime={
                selectedStaff
                  ? staffAttendance?.[selectedStaff._id || selectedStaff.id]?.[
                      todayKey
                    ]?.checkIn || null
                  : null
              }
              recentActivity={[]}
              isMobile
              onClose={closeDetail}
              onViewProfile={() =>
                selectedStaff && handleViewProfile(selectedStaff)
              }
              onMarkAttendance={() =>
                selectedStaff && handleMarkAttendanceFor(selectedStaff)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
