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
  useStaffFilterState,
  useStaffFiltersConfig,
} from "./StaffListFilters";
import { useStaffList } from "./hooks/useStaffList";
import { staffAttendanceApi } from "../../services/api";
import toast from "react-hot-toast";
import { isActiveStaff } from "./utils/staffHelpers";

// Mobile breakpoint — below this the right pane collapses to a Drawer
const MOBILE_MAX = 1099;
const DEFAULT_PAGE_SIZE = 25;

export default function StaffList({ onStaffClick, onAddStaff }) {
  const { staff = [], staffAttendance, loading, markStaffAttendance } = useApp();

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

  // ── Pills-based filter state (role / department / employment type / gender) ──
  // SCH-193 / PAG-28-FE: filter STATE is independent of facets, so it is
  // materialized first. The facet-derived pill options/counts are built later
  // via `useStaffFiltersConfig` once `useStaffList` returns the server payload.
  // The previous code derived these from the full in-memory `staff` array,
  // which (a) kept the dashboard on the client-side slice path and (b) produced
  // pill counts that ignored the active search; the server now computes the
  // same facets over `q` + `today` (excluding facet selections) in PR #131.
  const filterState = useStaffFilterState();
  const {
    roleFilter,
    departmentFilter,
    employmentTypeFilter,
    genderFilter,
    activeFiltersCount,
    handleFilterChange,
    clearAllFilters,
  } = filterState;

  // ── Server-driven pagination state (SCH-193 / PAG-28-FE) ──
  // `page` and `pageSize` live here (URL-synced below); `q` is the raw input
  // that gets debounced inside `useStaffList`. The segmented filter
  // (`all`/`active`/`today`) maps to server `status`/`today` params in the hook.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const {
    data: pageData,
    pagination,
    facets,
    loading: listLoading,
    clampedPage,
  } = useStaffList({
    q,
    filter,
    roleFilter,
    departmentFilter,
    employmentTypeFilter,
    genderFilter,
    page,
    pageSize,
  });

  // Build the pill-bar config from the server facets + current filter state.
  const filtersConfig = useStaffFiltersConfig(facets, filterState);

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

  // ── Visible rows for the current page ──
  // SCH-193: the server now returns the filtered, paginated slice. `pageData`
  // IS the visible set; we no longer filter+slice the shared AppContext `staff`
  // array client-side. `pagination.total` is the FULL filtered count (drives
  // the count chip + bulk "select all matching N" semantics); the rows we
  // render are just the current page.
  const visible = pageData;
  const totalMatching = pagination?.total ?? visible.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  // Stable id list for the shared bulk-selection hook.
  const visibleIds = useMemo(
    () => visible.map((s) => s._id || s.id),
    [visible]
  );

  // Bulk selection — shared hook (REVAMP-101): Esc clears, shift-click range,
  // "Select all" = visible only, "Select all matching N" CTA when applicable.
  // `totalMatching` is the server-computed filtered count so "select all
  // matching" advertises the true number even when only one page is loaded.
  const selection = useBulkSelection({
    visibleIds,
    totalMatching,
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

  // Selected staff record from the URL. The server-paged `visible` array only
  // holds the current page, so the detail-pane lookup falls back to the shared
  // AppContext `staff` list (which still bootstraps the full set for the ~40
  // other consumers). This keeps deep links (`/staffs?id=…`) working even when
  // the selected staff is not on page 1.
  const selectedStaff = useMemo(() => {
    if (!selectedId) return null;
    return (
      visible.find((s) => (s._id || s.id) === selectedId) ||
      staff.find((s) => (s._id || s.id) === selectedId) ||
      null
    );
  }, [selectedId, visible, staff]);

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

  // ── Page reset + clamp (SCH-193) ──
  // Reset to page 1 whenever the filter set changes (search, segmented filter,
  // or any facet). The server then re-evaluates `totalPages` for the new set.
  useEffect(() => {
    setPage(1);
  }, [q, filter, activeFiltersCount]);

  // Clamp page back into range. The hook exposes `clampedPage` (server-corrected)
  // so we update the local state without waiting for the next refetch.
  useEffect(() => {
    if (clampedPage && clampedPage !== page) {
      setPage(clampedPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPage]);

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
    // SCH-193: bulk selection may include staff not on the current page (e.g.
    // "select all matching N"). The page only holds `visible`, so phone
    // lookups fall back to the shared AppContext `staff` list to resolve
    // every selected id.
    const selectedSet = new Set(
      (selection.selectedIds || []).map((id) => String(id))
    );
    const isSelectedSource = (s) => {
      const id = String(s._id || s.id);
      return selection.allMatchingMode || selectedSet.has(id);
    };
    const selectedStaffList = [
      ...visible.filter(isSelectedSource),
      ...staff.filter((s) => {
        const id = String(s._id || s.id);
        // Avoid double-counting rows already picked from the current page.
        if (visible.some((v) => String(v._id || v.id) === id)) return false;
        return isSelectedSource(s);
      }),
    ];
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
  // The detail pane opens a status picker; this records today's attendance
  // for the chosen status via the shared optimistic markStaffAttendance flow
  // (toast + rollback on failure are handled there).
  const handleMarkAttendanceFor = useCallback(
    (s, status) => {
      if (!s || !status) return;
      const id = s._id || s.id;
      const checkIn =
        status === "present"
          ? new Date().toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-";
      markStaffAttendance(id, todayKey, status, checkIn);
    },
    [markStaffAttendance, todayKey]
  );

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
            {listLoading || loading
              ? "Loading…"
              : `${totalMatching}${pagination?.total != null ? ` of ${staff.length}` : ""}`}
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
          {listLoading || loading ? (
            <div style={{ padding: 16 }}>
              <SkeletonTable columns={4} rows={6} />
            </div>
          ) : visible.length === 0 ? (
            <StaffListEmptyState
              staffCount={staff.length}
              isFiltered={activeFiltersCount > 0 || Boolean(q) || filter !== "all"}
              onAddStaff={onAddStaff}
              onClearFilters={clearAllFilters}
            />
          ) : (
            visible.map((s) => {
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
        {!listLoading && !loading && visible.length > 0 && (
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
              totalItems={totalMatching}
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
            onClose={closeDetail}
            onViewProfile={() =>
              selectedStaff && handleViewProfile(selectedStaff)
            }
            onMarkAttendance={(status) =>
              selectedStaff && handleMarkAttendanceFor(selectedStaff, status)
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
              isMobile
              onClose={closeDetail}
              onViewProfile={() =>
                selectedStaff && handleViewProfile(selectedStaff)
              }
              onMarkAttendance={(status) =>
                selectedStaff && handleMarkAttendanceFor(selectedStaff, status)
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
