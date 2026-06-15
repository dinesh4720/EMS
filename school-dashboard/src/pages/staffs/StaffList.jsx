import {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Pagination from "../../components/common/Pagination";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { useApp } from "../../context/AppContext";
import useBulkSelection from "../../hooks/useBulkSelection";
import StaffListRow from "./StaffListRow";
import StaffDetailPane from "./StaffDetailPane";
import StaffListToolbar from "./StaffListToolbar";
import StaffListEmptyState from "./StaffListEmptyState";
import StaffListFilters, {
  FILTERS,
  staffMatchesFilter,
  searchMatch,
  useStaffFilters,
} from "./StaffListFilters";
import { staffAttendanceApi } from "../../services/api";
import toast from "react-hot-toast";
import { isActiveStaff } from "./utils/staffHelpers";

// Mobile breakpoint — below this the right pane collapses to a Drawer
const MOBILE_MAX = 1099;

export default function StaffList({ onStaffClick, onAddStaff }) {
  const { staff = [], staffAttendance, loading } = useApp();

  // ============ Routing first (Step 1) ============
  const navigate = useNavigate();
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

  // PageShell previously set the document title; preserve that behavior.
  useEffect(() => {
    const prev = document.title;
    document.title = "Staff · EMS";
    return () => { document.title = prev; };
  }, []);

  // ── Pills-based filter state, derivations, and handlers ──
  const {
    roleFilter,
    departmentFilter,
    employmentTypeFilter,
    genderFilter,
    filtersConfig,
    activeFiltersCount,
    handleFilterChange,
    clearAllFilters,
  } = useStaffFilters(staff);

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
      if (isActiveStaff(s)) active++;
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

  // ============ Pagination ============
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(visible.length / pageSize)),
    [visible.length, pageSize]
  );

  const paginatedVisible = useMemo(
    () => visible.slice((page - 1) * pageSize, page * pageSize),
    [visible, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [q, filter, activeFiltersCount]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // ============ Bulk action handlers ============
  const toggleCheck = useCallback(
    (s, event) => selection.toggle(s._id || s.id, event),
    [selection]
  );

  const handleBulkMarkPresent = async () => {
    if (!selection.selectedIds?.length) return;
    try {
      await staffAttendanceApi.markBulk({
        staffIds: selection.selectedIds,
        status: "present",
        date: todayKey,
      });
      toast.success(`Marked ${selection.count} staff present.`);
      selection.clear();
    } catch (err) {
      toast.error(err?.message || "Failed to mark attendance");
    }
  };

  const handleBulkMessage = () => {
    const selectedStaffList = visible.filter((s) =>
      selection.isSelected(s._id || s.id)
    );
    const phones = selectedStaffList
      .map((s) => s.phone || s.mobile)
      .filter(Boolean);
    if (!phones.length) {
      toast("No contact numbers available for selected staff.");
      return;
    }
    navigate(`/messaging?to=${encodeURIComponent(phones.join(","))}`);
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

  // Toolbar "Clear" resets search, pill filters, and the relevant URL params.
  const handleToolbarClear = useCallback(() => {
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
  }, [clearAllFilters, setSearchParams]);

  return (
    <div className="page" style={{ minHeight: 0, flex: 1, overflow: "hidden" }}>
      <header className="page__head">
        <div>
          <h1 className="page__title">Staff</h1>
          <p className="page__sub">
            {loading ? "Loading…" : `${visible.length} of ${staff.length}`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--accent"
          onClick={onAddStaff}
        >
          <Plus size={13} aria-hidden />
          Add staff
        </button>
      </header>

      <StaffListToolbar
        filter={filter}
        setFilter={setFilter}
        statusCounts={statusCounts}
        q={q}
        setQ={setQ}
        showClearButton={showClearButton}
        onClear={handleToolbarClear}
        rows={visible}
        selection={selection}
        onBulkMarkPresent={handleBulkMarkPresent}
        onBulkMessage={handleBulkMessage}
      />

      <StaffListFilters
        filtersConfig={filtersConfig}
        onFilterChange={handleFilterChange}
        onClearAll={clearAllFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <div
        style={
          isMobileViewport
            ? { display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }
            : {
                display: "grid",
                gridTemplateColumns: "minmax(420px, 1fr) 380px",
                gap: 0,
                minHeight: 0,
                flex: 1,
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

        {/* List rows */}
        <ul
          aria-label="Staff list"
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
            <StaffListEmptyState
              staffCount={staff.length}
              isFiltered={activeFiltersCount > 0 || Boolean(q)}
              onAddStaff={onAddStaff}
              onClearFilters={clearAllFilters}
            />
          ) : (
            paginatedVisible.map((s) => {
              const id = s._id || s.id;
              return (
                <StaffListRow
                  key={id}
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
        </ul>

        {/* Pagination footer */}
        {!loading && visible.length > 0 && (
          <div
            className="flex items-center justify-between px-4 py-2 border-t"
            style={{ borderColor: "var(--divider)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--fg-muted)" }}>Show</span>
              <select
                className="select select--sm"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                aria-label="Items per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm" style={{ color: "var(--fg-muted)" }}>per page</span>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={visible.length}
              itemLabel="staff"
            />
          </div>
        )}
        </div>

        {/* Right detail pane — desktop only (second grid column) */}
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

      </div>

      {/* Mobile: slide-over drawer for detail */}
      {isMobileViewport && detailVisible && (
        <>
          <button
            type="button"
            className="stafflist__drawer-overlay"
            aria-label="Close profile"
            onClick={closeDetail}
          />
          <div
            className="stafflist__drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Profile: ${selectedStaff?.name}`}
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
        </>
      )}
    </div>
  );
}
