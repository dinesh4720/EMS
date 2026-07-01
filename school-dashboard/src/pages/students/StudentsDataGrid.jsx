/**
 * StudentsDataGrid
 * Pixel-faithful port of the Claude Design "Students List - Data Grid" reference,
 * wired to real student data. Self-contained chrome (topbar + tabs + grid + footer)
 * — renders all four states (loading / error / empty / success).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import "../../components/dataGrid/dataGrid.css";
import PagePin from "../../components/ui/PagePin";
import {
  ACCENT,
  avatarPalette,
  mutedTone,
  trackEmpty,
  fmtIN,
  initialsOf,
  genderShort,
  formatDob,
  pickGuardian,
  attNumTone,
  attBarTone,
  feeOf,
  statusOf,
  sortStudents,
  pageRange,
} from "./utils/studentsGridHelpers";

const sid = (s) => String(s.id || s._id);

/* ── Inline icons (exact strokes from the design) ──────────────────────────*/
const I = {
  search: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a3a7b0" strokeWidth="2.2" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>),
  bulk: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>),
  chevron: (p) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M6 9l6 6 6-6" /></svg>),
  filter: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M3 5h18M6 12h12M10 19h4" /></svg>),
  columns: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>),
  kebab: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>),
  message: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M4 4h16v12H7l-3 3V4z" /></svg>),
  promote: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M12 19V5M12 5l-5 5M12 5l5 5" /></svg>),
  cert: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>),
  userCircle: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>),
  exportDown: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M12 17V7M12 17l-4-4M12 17l4-4M5 21h14" /></svg>),
  trash: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13h10l1-13" /></svg>),
  clearX: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  edit: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 5l4 4" /></svg>),
  open: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M7 17L17 7M9 7h8v8" /></svg>),
  star: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" /></svg>),
  check: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.4" {...p}><path d="M5 12.5l4 4 10-10.5" /></svg>),
  empty: (p) => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cfd2d8" strokeWidth="1.6" {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5.4 5.5-5.4s5.5 2.4 5.5 5.4" /><path d="M17 9h4M19 7v4" /></svg>),
};

const CheckBox = ({ on, dash, onClick, label }) => (
  <span
    className={`sdg-check${on || dash ? " is-on" : ""}`}
    role="checkbox"
    aria-checked={dash ? "mixed" : on}
    aria-label={label}
    tabIndex={0}
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onClick(e); } }}
  >
    {on && !dash && (
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.2 2.2 4.8-5.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    )}
    {dash && <span className="sdg-check-dash" />}
  </span>
);

/* Toggleable middle columns (Name + checkbox + actions are always shown). */
const MIDDLE_COLUMNS = [
  { key: "id", label: "Adm ID", width: 130, thPad: "0 14px 0 18px" },
  { key: "class", label: "Class", width: 80, sort: "cls" },
  { key: "roll", label: "Roll", width: 60 },
  { key: "gender", label: "Gender", width: 72 },
  { key: "dob", label: "DOB", width: 118 },
  { key: "guardian", label: "Guardian", width: 184 },
  { key: "phone", label: "Phone", width: 138 },
  { key: "attendance", label: "Attendance", width: 124, sort: "att" },
  { key: "fees", label: "Fees", width: 112 },
  { key: "balance", label: "Balance", width: 114, align: "right", sort: "bal", indBefore: true },
  { key: "status", label: "Status", width: 108 },
];

export default function StudentsDataGrid({
  students = [],
  totalEnrolled = 0,
  loading = false,
  error = null,
  onRetry,
  // search
  searchQuery = "",
  onSearchChange,
  // tabs (legacy) — or status dropdown when statusOptions provided
  tabs = [],
  activeTab,
  onTabChange,
  statusOptions = null,
  statusSel,
  onStatusSelect,
  // attendance bar strip (React node) + dues click
  attendanceBar = null,
  onDuesClick,
  totalDue,
  // selection
  selectedKeys = new Set(),
  onToggleRow,
  onToggleAll,
  onClearSelection,
  // actions
  onBulkAction,
  onAddStudent,
  onOpenStudent,
  onEditStudent,
  onDeleteStudent,
  onPin,
  onUnpin,
  // filter
  activeFiltersCount = 0,
  feeStatusFilter = [],
  onFeeFilterToggle,
  onClearFilters,
  // more-actions menu items: [{ label, icon, onClick, danger }]
  moreActions = [],
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [openMenu, setOpenMenu] = useState(null); // 'bulk' | 'filter' | 'columns' | 'more' | 'pagesize' | `row-${id}`
  const [hiddenCols, setHiddenCols] = useState(() => new Set());
  const [density, setDensity] = useState("Comfortable");
  const rowH = density === "Compact" ? 42 : 52;
  const gridRef = useRef(null);

  const closeMenu = () => setOpenMenu(null);
  const toggleMenu = (name) => setOpenMenu((cur) => (cur === name ? null : name));

  const setSort = (key) => {
    if (!key) return;
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
  };

  // sorted full list (pinned floated to top)
  const sorted = useMemo(() => sortStudents(students, sortKey, sortDir), [students, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setPage(1); }, [searchQuery, activeTab, statusSel, pageSize]);

  const pageStudents = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize]
  );

  // map page rows → display values
  const rows = useMemo(
    () => pageStudents.map((s, i) => {
      const pal = avatarPalette(i, isDark);
      const g = pickGuardian(s);
      const att = Number(s.attendancePercentage);
      const hasAtt = Number.isFinite(att);
      const fee = feeOf(s, isDark);
      const st = statusOf(s.status, isDark);
      const cls = s.class || s.className || "—";
      const sec = s.section || "";
      return {
        raw: s,
        id: sid(s),
        selected: selectedKeys.has(sid(s)),
        pinned: !!s.isPinned,
        initials: initialsOf(s.name),
        avBg: pal[0], avFg: pal[1],
        name: s.name || "—",
        admId: s.admissionNo || s.admissionNumber || s.admissionId || s.code || "—",
        clsLabel: sec ? `${cls} · ${sec}` : cls,
        roll: s.rollNo || s.rollNumber || "—",
        gen: genderShort(s.gender),
        dob: formatDob(s.dateOfBirth || s.dob),
        guardianName: g.name,
        rel: g.relation,
        phone: s.parentPhone || s.fatherPhone || s.motherPhone || s.guardian?.phone || "—",
        hasAtt,
        attTxt: hasAtt ? `${att}%` : "—",
        attW: hasAtt ? `${Math.max(0, Math.min(100, att))}%` : "0%",
        attNum: hasAtt ? attNumTone(att, isDark) : mutedTone(isDark),
        attBar: hasAtt ? attBarTone(att, isDark) : trackEmpty(isDark),
        fee, st,
      };
    }),
    [pageStudents, selectedKeys, isDark]
  );

  const allIds = useMemo(() => students.map(sid), [students]);
  const selectedCount = selectedKeys.size;
  const hasSelection = selectedCount > 0;
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedKeys.has(id));
  const someSelected = hasSelection && !allSelected;

  const visibleMiddle = MIDDLE_COLUMNS.filter((c) => !hiddenCols.has(c.key));
  const tableMinWidth = 48 + 236 + 52 + visibleMiddle.reduce((sum, c) => sum + c.width, 0);

  // footer stats
  const dues = useMemo(() => students.reduce((s, st) => s + Number(st.balanceAmount ?? st.balance ?? 0), 0), [students]);
  const avgAtt = useMemo(() => {
    const vals = students.map((s) => Number(s.attendancePercentage)).filter(Number.isFinite);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }, [students]);

  const ind = (key) => (key === sortKey ? (sortDir === "asc" ? "↑" : "↓") : "↕");
  const sortColor = (key) => (key === sortKey ? ACCENT.accent : "#9499a3");
  const arrColor = (key) => (key === sortKey ? ACCENT.accent : "#cdd0d6");

  const toggleColumn = (key) =>
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  // ── header cell ───────────────────────────────────────────────────────────
  const renderHeaderCell = (col) => {
    const sortable = !!col.sort;
    const style = { width: col.width, minWidth: col.width };
    if (col.thPad) style.padding = col.thPad;
    const indEl = sortable ? (
      <span className="sdg-th-ind" style={{ color: arrColor(col.sort) }}>{ind(col.sort)}</span>
    ) : null;
    return (
      <th
        key={col.key}
        className={`sdg-th${sortable ? " is-sortable" : ""}${col.align === "right" ? " is-right" : ""}`}
        style={{ ...style, color: sortable ? sortColor(col.sort) : "#9499a3" }}
        onClick={sortable ? () => setSort(col.sort) : undefined}
      >
        {col.indBefore && indEl}{col.indBefore ? " " : ""}{col.label}{!col.indBefore && indEl ? <> {indEl}</> : null}
      </th>
    );
  };

  // ── body cell ─────────────────────────────────────────────────────────────
  const renderCell = (col, r) => {
    const style = { width: col.width, minWidth: col.width };
    if (col.thPad) style.padding = col.thPad;
    let content = null;
    switch (col.key) {
      case "id": content = <span className="sdg-c-id sdg-mono">{r.admId}</span>; break;
      case "class": content = <span className="sdg-c-class">{r.clsLabel}</span>; break;
      case "roll": content = <span className="sdg-c-roll sdg-mono">{r.roll}</span>; break;
      case "gender": content = <span className="sdg-c-gender">{r.gen}</span>; break;
      case "dob": content = <span className="sdg-c-dob sdg-mono">{r.dob}</span>; break;
      case "guardian":
        content = (
          <span className="sdg-c-guardian">{r.guardianName}{r.rel ? <span className="sdg-rel"> · {r.rel}</span> : null}</span>
        ); break;
      case "phone": content = <span className="sdg-c-phone sdg-mono">{r.phone}</span>; break;
      case "attendance":
        content = (
          <span className="sdg-att">
            <span className="sdg-att-num sdg-mono" style={{ color: r.attNum }}>{r.attTxt}</span>
            <span className="sdg-att-track"><span className="sdg-att-fill" style={{ width: r.attW, background: r.attBar }} /></span>
          </span>
        ); break;
      case "fees":
        content = (
          <span className="sdg-fee" style={{ background: r.fee.feeBg, color: r.fee.feeLabelTone }}>
            <span className="sdg-fee-dot" style={{ background: r.fee.feeDot }} />{r.fee.slabel}
          </span>
        ); break;
      case "balance":
        content = <span className="sdg-mono" style={{ color: r.fee.balTone }}>{r.fee.balDisp}</span>; break;
      case "status":
        content = (
          <span className="sdg-status">
            <span className="sdg-status-dot" style={{ background: r.st.statusDot }} />
            <span className="sdg-status-text" style={{ color: r.st.statusTextTone }}>{r.st.label}</span>
          </span>
        ); break;
      default: content = null;
    }
    return (
      <td key={col.key} className={`sdg-td${col.align === "right" ? " sdg-bal" : ""}`} style={style}>{content}</td>
    );
  };

  const colSpanAll = 3 + visibleMiddle.length; // checkbox + name + actions + middle

  return (
    <div className="sdg" ref={gridRef}>
      {/* ===== Topbar ===== */}
      <div className="sdg-topbar">
        <div style={{ display: "flex", alignItems: "baseline", gap: 11 }}>
          <span className="sdg-title">Students</span>
          <PagePin label="Students" />
          <span className="sdg-count-pill">{fmtIN(totalEnrolled)} enrolled</span>
        </div>
        <div style={{ flex: 1 }} />
        <label className="sdg-search">
          <I.search />
          <input
            placeholder="Search students…"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          <span className="sdg-kbd">⌘K</span>
        </label>
        <button type="button" className="sdg-btn-primary" onClick={onAddStudent}>
          <span className="sdg-plus">+</span> New student
        </button>
      </div>

      {/* ===== Tabs / status dropdown + controls ===== */}
      <div className="sdg-controls">
        {statusOptions ? (
          (() => {
            const sel = statusOptions.find((o) => o.key === statusSel) || statusOptions[0];
            return (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className={`sdg-statusdrop${openMenu === "status" ? " is-open" : ""}`}
                  onClick={() => toggleMenu("status")}
                >
                  {sel?.label} <span className="sdg-statusdrop-count">{fmtIN(sel?.count ?? 0)}</span>
                  <I.chevron style={{ opacity: 0.5 }} />
                </button>
                {openMenu === "status" && (
                  <>
                    <div className="sdg-menu-overlay" onClick={closeMenu} />
                    <div className="sdg-statusmenu">
                      {statusOptions.map((o) => (
                        <button
                          key={o.key}
                          type="button"
                          className="sdg-statusmenu-item"
                          onClick={() => { closeMenu(); onStatusSelect?.(o.key); }}
                        >
                          <span className="sdg-statusmenu-dot" style={{ background: o.dot }} />{o.label}
                          <div style={{ flex: 1 }} />
                          <span className="sdg-statusmenu-count">{fmtIN(o.count ?? 0)}</span>
                          {o.key === statusSel && <span className="sdg-statusmenu-check"><I.check width="13" height="13" /></span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()
        ) : (
          tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`sdg-tab${activeTab === tab.key ? " is-active" : ""}`}
              onClick={() => onTabChange?.(tab.key)}
            >
              {tab.label} <span className="sdg-tab-count">{fmtIN(tab.count)}</span>
            </button>
          ))
        )}

        <div style={{ flex: 1 }} />

        {/* Bulk actions */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => toggleMenu("bulk")}
            className="sdg-tool"
            style={hasSelection ? { background: ACCENT.accentBg, borderColor: ACCENT.accentLine, color: ACCENT.accent } : undefined}
          >
            <I.bulk /> Bulk actions
            {hasSelection && <span className="sdg-bulk-pill">{selectedCount}</span>}
            <I.chevron style={{ opacity: 0.6 }} />
          </button>
          {openMenu === "bulk" && (
            <>
              <div className="sdg-menu-overlay" onClick={closeMenu} />
              <div className="sdg-menu">
                <div className="sdg-menu-head">
                  <span>{hasSelection ? `${selectedCount} student${selectedCount > 1 ? "s" : ""} selected` : "No rows selected · acts on selection"}</span>
                </div>
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("message"); }}><I.message /> Message parents</button>
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("promote"); }}><I.promote /> Promote to next class</button>
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("tc"); }}><I.cert /> Generate certificate</button>
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("deactivate"); }}><I.userCircle /> Mark inactive</button>
                <div className="sdg-menu-sep" />
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("export"); }}><I.exportDown /> Export selected</button>
                <button className="sdg-menu-item is-danger" onClick={() => { closeMenu(); onBulkAction?.("delete"); }}><I.trash /> Delete</button>
                {hasSelection && (
                  <>
                    <div className="sdg-menu-sep" />
                    <button className="sdg-menu-item" style={{ color: "#74787f" }} onClick={() => { closeMenu(); onClearSelection?.(); }}><I.clearX /> Clear selection</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Filter */}
        <div style={{ position: "relative" }}>
          <button type="button" className="sdg-tool" onClick={() => toggleMenu("filter")}>
            <I.filter /> Filter
            {activeFiltersCount > 0 && <span className="sdg-badge-count">{activeFiltersCount}</span>}
          </button>
          {openMenu === "filter" && (
            <>
              <div className="sdg-menu-overlay" onClick={closeMenu} />
              <div className="sdg-menu" style={{ width: 220 }}>
                <div className="sdg-menu-head"><span>Fee status</span></div>
                {[["paid", "Paid"], ["pending", "Pending"], ["overdue", "Overdue"], ["partial", "Partial"]].map(([val, label]) => (
                  <button key={val} className="sdg-menu-item" onClick={() => onFeeFilterToggle?.(val)}>
                    {label}
                    {feeStatusFilter.includes(val) && <span className="sdg-menu-check"><I.check width="14" height="14" /></span>}
                  </button>
                ))}
                {activeFiltersCount > 0 && (
                  <>
                    <div className="sdg-menu-sep" />
                    <button className="sdg-menu-item" style={{ color: "#74787f" }} onClick={() => { closeMenu(); onClearFilters?.(); }}><I.clearX /> Clear filters</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Columns */}
        <div style={{ position: "relative" }}>
          <button type="button" className="sdg-tool" onClick={() => toggleMenu("columns")}>
            <I.columns /> Columns
          </button>
          {openMenu === "columns" && (
            <>
              <div className="sdg-menu-overlay" onClick={closeMenu} />
              <div className="sdg-menu" style={{ width: 200 }}>
                <div className="sdg-menu-head"><span>Visible columns</span></div>
                {MIDDLE_COLUMNS.map((col) => (
                  <button key={col.key} className="sdg-menu-item" onClick={() => toggleColumn(col.key)}>
                    {col.label}
                    {!hiddenCols.has(col.key) && <span className="sdg-menu-check"><I.check width="14" height="14" /></span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Density switcher (Comfortable / Compact) */}
        <div className="sdg-density" role="group" aria-label="Row density">
          <button
            type="button"
            className={`sdg-density-btn${density === "Comfortable" ? " is-active" : ""}`}
            title="Comfortable" aria-label="Comfortable density" aria-pressed={density === "Comfortable"}
            onClick={() => setDensity("Comfortable")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button
            type="button"
            className={`sdg-density-btn${density === "Compact" ? " is-active" : ""}`}
            title="Compact" aria-label="Compact density" aria-pressed={density === "Compact"}
            onClick={() => setDensity("Compact")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16M4 9h16M4 13h16M4 17h16M4 21h16" /></svg>
          </button>
        </div>

        {/* More actions */}
        <div style={{ position: "relative" }}>
          <button type="button" className="sdg-tool-icon" aria-label="More actions" onClick={() => toggleMenu("more")}>
            <I.kebab />
          </button>
          {openMenu === "more" && moreActions.length > 0 && (
            <>
              <div className="sdg-menu-overlay" onClick={closeMenu} />
              <div className="sdg-menu" style={{ width: 220 }}>
                {moreActions.map((action, idx) => (
                  <button
                    key={idx}
                    className={`sdg-menu-item${action.danger ? " is-danger" : ""}`}
                    onClick={() => { closeMenu(); action.onClick?.(); }}
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== Today's attendance bar ===== */}
      {attendanceBar}

      {/* ===== Grid ===== */}
      <div className="sdg-gridwrap sdg-scroll">
        <table className="sdg-table" style={{ minWidth: tableMinWidth }}>
          <thead>
            <tr>
              <th className="sdg-th sdg-th-check">
                <CheckBox
                  on={allSelected}
                  dash={someSelected}
                  label="Select all students"
                  onClick={() => onToggleAll?.(allIds)}
                />
              </th>
              <th
                className="sdg-th sdg-th-name is-sortable"
                style={{ width: 236, minWidth: 236, color: sortColor("name") }}
                onClick={() => setSort("name")}
              >
                Name <span className="sdg-th-ind" style={{ color: arrColor("name") }}>{ind("name")}</span>
              </th>
              {visibleMiddle.map(renderHeaderCell)}
              <th className="sdg-th sdg-th-actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <tr className="sdg-row" key={`skel-${i}`}>
                  <td className="sdg-td sdg-td-check"><span className="sdg-skel" style={{ width: 16, height: 16, borderRadius: 5 }} /></td>
                  <td className="sdg-td sdg-td-name" style={{ height: rowH }}>
                    <span className="sdg-name-cell">
                      <span className="sdg-skel" style={{ width: 30, height: 30, borderRadius: 9 }} />
                      <span className="sdg-skel" style={{ width: 120 + (i % 4) * 22, height: 11 }} />
                    </span>
                  </td>
                  {visibleMiddle.map((c) => (
                    <td key={c.key} className="sdg-td" style={{ width: c.width, minWidth: c.width }}>
                      <span className="sdg-skel" style={{ width: Math.min(c.width - 28, 70), height: 10 }} />
                    </td>
                  ))}
                  <td className="sdg-td sdg-td-actions" />
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={colSpanAll}>
                <div className="sdg-state">
                  <I.empty />
                  <div className="sdg-state-title">Couldn’t load students</div>
                  <div className="sdg-state-desc">{error.message || "Something went wrong while fetching the list."}</div>
                  {onRetry && <button className="sdg-state-btn is-ghost" onClick={onRetry}>Try again</button>}
                </div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={colSpanAll}>
                <div className="sdg-state">
                  <I.empty />
                  <div className="sdg-state-title">{totalEnrolled === 0 ? "No students yet" : "No students matched"}</div>
                  <div className="sdg-state-desc">
                    {totalEnrolled === 0
                      ? "Get started by adding your first student."
                      : "Try adjusting your search, tab, or filters."}
                  </div>
                  {totalEnrolled === 0
                    ? <button className="sdg-state-btn" onClick={onAddStudent}><span style={{ fontSize: 16, lineHeight: 0 }}>+</span> New student</button>
                    : (activeFiltersCount > 0 && <button className="sdg-state-btn is-ghost" onClick={onClearFilters}>Clear filters</button>)}
                </div>
              </td></tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className={`sdg-row${r.selected ? " is-selected" : ""}`}
                  onClick={() => onOpenStudent?.(r.raw)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="sdg-td sdg-td-check" style={{ height: rowH }}>
                    <CheckBox on={r.selected} label={`Select ${r.name}`} onClick={() => onToggleRow?.(r.id)} />
                  </td>
                  <td className="sdg-td sdg-td-name" style={{ height: rowH }}>
                    <span className="sdg-name-cell">
                      <span className="sdg-avatar" style={{ background: r.avBg, color: r.avFg }}>{r.initials}</span>
                      <span className="sdg-name-wrap">
                        {r.pinned && <span className="sdg-star">★</span>}
                        <span className="sdg-name">{r.name}</span>
                      </span>
                    </span>
                  </td>
                  {visibleMiddle.map((col) => renderCell(col, r))}
                  <td className="sdg-td sdg-td-actions" style={{ height: rowH }}>
                    <span style={{ position: "relative", display: "inline-flex" }}>
                      <button
                        type="button"
                        className="sdg-row-kebab"
                        aria-label={`Actions for ${r.name}`}
                        onClick={(e) => { e.stopPropagation(); toggleMenu(`row-${r.id}`); }}
                      >
                        <I.kebab />
                      </button>
                      {openMenu === `row-${r.id}` && (
                        <>
                          <div className="sdg-menu-overlay" onClick={(e) => { e.stopPropagation(); closeMenu(); }} />
                          <div className="sdg-menu" style={{ width: 190, top: 30 }}>
                            <button className="sdg-menu-item" onClick={(e) => { e.stopPropagation(); closeMenu(); onOpenStudent?.(r.raw); }}><I.open /> Open profile</button>
                            <button className="sdg-menu-item" onClick={(e) => { e.stopPropagation(); closeMenu(); onEditStudent?.(r.raw); }}><I.edit /> Edit</button>
                            <button className="sdg-menu-item" onClick={(e) => { e.stopPropagation(); closeMenu(); (r.pinned ? onUnpin : onPin)?.(r.id); }}><I.star /> {r.pinned ? "Unpin" : "Pin to top"}</button>
                            <div className="sdg-menu-sep" />
                            <button className="sdg-menu-item is-danger" onClick={(e) => { e.stopPropagation(); closeMenu(); onDeleteStudent?.(r.raw); }}><I.trash /> Delete</button>
                          </div>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Footer ===== */}
      <div className="sdg-footer">
        <span className="sdg-foot-stat">
          <span className="sdg-mono">{fmtIN(rows.length)}</span> of <span className="sdg-mono">{fmtIN(sorted.length)}</span>
        </span>
        <span
          className={`sdg-foot-stat tip${onDuesClick ? " is-clickable" : ""}`}
          onClick={onDuesClick}
          role={onDuesClick ? "button" : undefined}
          tabIndex={onDuesClick ? 0 : undefined}
          onKeyDown={onDuesClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDuesClick(); } } : undefined}
        >
          Dues <span className="sdg-mono" style={{ color: "#be123c" }}>₹{fmtIN(totalDue ?? dues)}</span>
          {onDuesClick && <span className="tip__bub">Click to apply due filter to the students</span>}
        </span>
        <span className="sdg-foot-stat">Avg attendance <span className="sdg-mono" style={{ color: "#2f8f57" }}>{avgAtt == null ? "—" : `${avgAtt}%`}</span></span>

        <div style={{ flex: 1 }} />

        <div style={{ position: "relative" }}>
          <button type="button" className="sdg-pagesize" onClick={() => toggleMenu("pagesize")}>
            {pageSize} / page <span className="caret">▾</span>
          </button>
          {openMenu === "pagesize" && (
            <>
              <div className="sdg-menu-overlay" onClick={closeMenu} />
              <div className="sdg-pagesize-menu">
                {[10, 25, 50, 100].map((n) => (
                  <button
                    key={n}
                    className={`sdg-pagesize-item${pageSize === n ? " is-active" : ""}`}
                    onClick={() => { setPageSize(n); closeMenu(); }}
                  >
                    {n} / page
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="sdg-pager">
          <button type="button" className="sdg-pager-edge" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">‹</button>
          {pageRange(page, totalPages).map((p) =>
            typeof p === "string"
              ? <span key={p} className="sdg-pager-gap">…</span>
              : <button key={p} type="button" className={`sdg-pager-num${p === page ? " is-active" : ""}`} onClick={() => setPage(p)}>{p}</button>
          )}
          <button type="button" className="sdg-pager-edge" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page">›</button>
        </div>
      </div>
    </div>
  );
}
