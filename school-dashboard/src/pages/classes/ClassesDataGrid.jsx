/**
 * ClassesDataGrid
 * Pixel-faithful port of the Claude Design "Classes List - Data Grid" reference,
 * wired to real class data. Grade-grouped, collapsible sections. Self-contained
 * chrome (topbar + tabs + grouped body + footer). All four states handled.
 */
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import "../../components/dataGrid/dataGrid.css";
import "./classesGrid.css";
import PagePin from "../../components/ui/PagePin";
import { fmtIN } from "../students/utils/studentsGridHelpers";
import { buildGroups } from "./utils/classesGridHelpers";


/* ── Inline icons ──────────────────────────────────────────────────────────*/
const I = {
  search: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a3a7b0" strokeWidth="2.2" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>),
  caret: (p) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M9 6l6 6-6 6" /></svg>),
  collapse: (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M7 14l5-5 5 5M7 10l5 5 5-5" opacity=".5" /></svg>),
  bulk: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>),
  chevron: (p) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M6 9l6 6 6-6" /></svg>),
  filter: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M3 5h18M6 12h12M10 19h4" /></svg>),
  kebab: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>),
  plus: (p) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 5v14M5 12h14" /></svg>),
  user: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>),
  timetable: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>),
  promote: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M12 19V5M12 5l-5 5M12 5l5 5" /></svg>),
  exportDown: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M12 17V7M12 17l-4-4M12 17l4-4M5 21h14" /></svg>),
  trash: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13h10l1-13" /></svg>),
  clearX: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  open: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M7 17L17 7M9 7h8v8" /></svg>),
  edit: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6a6e78" strokeWidth="2" {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 5l4 4" /></svg>),
  empty: (p) => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cfd2d8" strokeWidth="1.6" {...p}><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 10h18M9 5v15" /></svg>),
};

const CheckBox = ({ on, onClick, label }) => (
  <span
    className={`sdg-check${on ? " is-on" : ""}`}
    role="checkbox" aria-checked={on} aria-label={label} tabIndex={0}
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onClick(e); } }}
  >
    {on && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.2 2.2 4.8-5.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
  </span>
);

// Column widths (header strip + group header + section rows share these)
const lead = { width: 30, flex: "none", display: "flex", alignItems: "center" };
const colName = { flex: "1.6", minWidth: 240 };
const colTeacher = { width: 210, flex: "none" };
const colStudents = { width: 150, flex: "none" };
const colSubjects = { width: 84, flex: "none", textAlign: "center" };
const colRoom = { width: 90, flex: "none" };
const colAtt = { width: 140, flex: "none" };
const colStatus = { width: 120, flex: "none" };
const colActions = { width: 44, flex: "none" };

export default function ClassesDataGrid({
  sections = [],
  summary = {},
  loading = false,
  error = null,
  onRetry,
  searchQuery = "",
  onSearchChange,
  tabs = [],
  activeTab,
  onTabChange,
  selectedKeys = new Set(),
  onToggleSection,
  onClearSelection,
  onBulkAction,
  onAddClass,
  onAddSection,
  onOpenSection,
  onAssignTeacher,
  onEditSection,
  onDeleteSection,
  moreActions = [],
  attendanceBar = null,
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [collapsed, setCollapsed] = useState(() => new Set());
  // Default to all grade groups minimized (allCollapsed=true; `collapsed` then
  // holds the grades the user has explicitly expanded).
  const [allCollapsed, setAllCollapsed] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [density, setDensity] = useState("Comfortable");
  const rowH = density === "Compact" ? 44 : 54;

  const closeMenu = () => setOpenMenu(null);
  const toggleMenu = (name) => setOpenMenu((cur) => (cur === name ? null : name));

  const groups = useMemo(
    () => buildGroups(sections, { collapsed, allCollapsed, selected: selectedKeys, dark: isDark }),
    [sections, collapsed, allCollapsed, selectedKeys, isDark]
  );

  const selectedCount = selectedKeys.size;
  const hasSelection = selectedCount > 0;

  const toggleGroup = (grade) => setCollapsed((prev) => { const n = new Set(prev); n.has(grade) ? n.delete(grade) : n.add(grade); return n; });
  const toggleCollapseAll = () => { setAllCollapsed((v) => !v); setCollapsed(new Set()); };

  const headStrip = (
    <div className="cdg-head">
      <div style={lead} />
      <div style={colName}>Class / Section</div>
      <div style={colTeacher}>Class teacher</div>
      <div style={colStudents}>Students</div>
      <div style={colSubjects}>Subjects</div>
      <div style={colRoom}>Room</div>
      <div style={colAtt}>Attendance</div>
      <div style={colStatus}>Status</div>
      <div style={colActions} />
    </div>
  );

  return (
    <div className="sdg">
      {/* ===== Topbar ===== */}
      <div className="sdg-topbar">
        <div style={{ display: "flex", alignItems: "baseline", gap: 11 }}>
          <span className="sdg-title">Classes</span>
          <PagePin label="Classes" />
          <span className="sdg-count-pill">{fmtIN(summary.classes || 0)} classes · {fmtIN(summary.sections || 0)} sections</span>
        </div>
        <div style={{ flex: 1 }} />
        <label className="sdg-search">
          <I.search />
          <input placeholder="Search class, section, teacher…" value={searchQuery} onChange={(e) => onSearchChange?.(e.target.value)} />
          <span className="sdg-kbd">⌘K</span>
        </label>
        <button type="button" className="sdg-btn-primary" onClick={onAddClass}>
          <span className="sdg-plus">+</span> Add class
        </button>
      </div>

      {/* ===== Tabs + controls ===== */}
      <div className="sdg-controls">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" className={`sdg-tab${activeTab === tab.key ? " is-active" : ""}`} onClick={() => onTabChange?.(tab.key)}>
            {tab.label} <span className="sdg-tab-count" style={tab.countColor ? { color: tab.countColor } : undefined}>{fmtIN(tab.count)}</span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button type="button" className="cdg-collapse" onClick={toggleCollapseAll}>
          <I.collapse /> {allCollapsed ? "Expand all" : "Collapse all"}
        </button>

        {/* Bulk actions */}
        <div style={{ position: "relative" }}>
          <button
            type="button" onClick={() => toggleMenu("bulk")} className="sdg-tool"
            style={hasSelection ? { background: "#eef0fe", borderColor: "#dcdefb", color: "#4f46e5" } : undefined}
          >
            <I.bulk /> Bulk actions
            {hasSelection && <span className="sdg-bulk-pill">{selectedCount}</span>}
            <I.chevron style={{ opacity: 0.6 }} />
          </button>
          {openMenu === "bulk" && (
            <>
              <div className="sdg-menu-overlay" onClick={closeMenu} />
              <div className="sdg-menu" style={{ width: 256 }}>
                <div className="sdg-menu-head">
                  <span>{hasSelection ? `${selectedCount} section${selectedCount > 1 ? "s" : ""} selected` : "No sections selected · acts on selection"}</span>
                </div>
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("assign"); }}><I.user /> Assign class teacher</button>
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("timetable"); }}><I.timetable /> Edit timetable</button>
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("promote"); }}><I.promote /> Promote sections</button>
                <button className="sdg-menu-item" onClick={() => { closeMenu(); onBulkAction?.("export"); }}><I.exportDown /> Export selected</button>
                <div className="sdg-menu-sep" />
                <button className="sdg-menu-item is-danger" onClick={() => { closeMenu(); onBulkAction?.("delete"); }}><I.trash /> Delete sections</button>
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

        <button type="button" className="sdg-tool"><I.filter /> Filter</button>

        {/* Density switcher (Comfortable / Compact) */}
        <div className="sdg-density" role="group" aria-label="Row density">
          <button type="button" className={`sdg-density-btn${density === "Comfortable" ? " is-active" : ""}`} title="Comfortable" aria-label="Comfortable density" aria-pressed={density === "Comfortable"} onClick={() => setDensity("Comfortable")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button type="button" className={`sdg-density-btn${density === "Compact" ? " is-active" : ""}`} title="Compact" aria-label="Compact density" aria-pressed={density === "Compact"} onClick={() => setDensity("Compact")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16M4 9h16M4 13h16M4 17h16M4 21h16" /></svg>
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <button type="button" className="sdg-tool-icon" aria-label="More actions" onClick={() => toggleMenu("more")}>
            <I.kebab />
          </button>
          {openMenu === "more" && moreActions.length > 0 && (
            <>
              <div className="sdg-menu-overlay" onClick={closeMenu} />
              <div className="sdg-menu" style={{ width: 220 }}>
                {moreActions.map((action, idx) => (
                  <button key={idx} className={`sdg-menu-item${action.danger ? " is-danger" : ""}`} onClick={() => { closeMenu(); action.onClick?.(); }}>
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

      {/* ===== Grouped body ===== */}
      <div className="cdg-bodywrap sdg-scroll">
        <div className="cdg-inner">
          {headStrip}

          {loading ? (
            <div style={{ padding: "26px 22px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, height: 46 }}>
                  <span className="sdg-skel" style={{ width: 32, height: 32, borderRadius: 9 }} />
                  <span className="sdg-skel" style={{ width: 150 + (i % 3) * 40, height: 12 }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="sdg-state">
              <I.empty />
              <div className="sdg-state-title">Couldn’t load classes</div>
              <div className="sdg-state-desc">{error.message || "Something went wrong while fetching the list."}</div>
              {onRetry && <button className="sdg-state-btn is-ghost" onClick={onRetry}>Try again</button>}
            </div>
          ) : groups.length === 0 ? (
            <div className="sdg-state">
              <I.empty />
              <div className="sdg-state-title">{(summary.sections || 0) === 0 ? "No classes yet" : "No classes matched"}</div>
              <div className="sdg-state-desc">{(summary.sections || 0) === 0 ? "Create your first grade and its sections." : "Try adjusting your search or tab."}</div>
              {(summary.sections || 0) === 0 && <button className="sdg-state-btn" onClick={onAddClass}><span style={{ fontSize: 16, lineHeight: 0 }}>+</span> Add class</button>}
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.grade}>
                {/* Group header */}
                <button type="button" className="cdg-group" onClick={() => toggleGroup(g.grade)}>
                  <div style={lead}>
                    <span className="cdg-caret" style={{ transform: `rotate(${g.open ? "90deg" : "0deg"})` }}><I.caret /></span>
                  </div>
                  <div style={{ ...colName, display: "flex", alignItems: "center", gap: 11 }}>
                    <span className="cdg-grade" style={{ background: g.badgeBg, color: g.badgeFg }}>{g.grade}</span>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                      <span className="cdg-gtitle">{g.title}</span>
                      <span className="cdg-gpill">{g.sectionCount} sections</span>
                      {g.hasWarning && <span className="cdg-warn"><span className="cdg-warn-dot" />{g.warning}</span>}
                    </span>
                  </div>
                  <div style={{ ...colTeacher, fontSize: 12, color: "#9499a3" }}>{g.teacherSummary}</div>
                  <div style={{ ...colStudents, display: "flex", alignItems: "center", gap: 9 }}>
                    <span className="cdg-mono" style={{ fontSize: 12, color: "#3f424a" }}>{g.students}</span>
                    <span style={{ fontSize: 11, color: "#b3b7bf" }}>/ {g.capacity}</span>
                  </div>
                  <div style={{ ...colSubjects }} className="cdg-mono"><span style={{ fontSize: 12, color: "#74787f" }}>{g.subjects}</span></div>
                  <div style={colRoom} />
                  <div style={{ ...colAtt, display: "flex", alignItems: "center", gap: 9 }}>
                    <span className="cdg-mono" style={{ fontSize: 12, color: "#2f8f57" }}>{g.avgAtt}</span>
                    <span style={{ fontSize: 11, color: "#b3b7bf" }}>avg</span>
                  </div>
                  <div style={colStatus} />
                  <div style={colActions} />
                </button>

                {/* Section rows */}
                {g.open && g.sections.map((s) => (
                  <div key={s.id} className={`cdg-row${s.selected ? " is-selected" : ""}`} style={{ height: rowH }} onClick={() => onOpenSection?.(s.raw)}>
                    <div style={lead}>
                      <CheckBox on={s.selected} onClick={() => onToggleSection?.(s.id)} label={`Select ${s.grade}-${s.section}`} />
                    </div>
                    <div style={{ ...colName, display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="cdg-indent" />
                      <span className="cdg-secbadge" style={{ background: s.secBg, color: s.secFg }}>{s.section}</span>
                      <span className="cdg-secname">Section {s.section}</span>
                    </div>
                    <div style={{ ...colTeacher, minWidth: 0 }}>
                      {s.hasTeacher ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                          <span className="cdg-tavatar" style={{ background: s.avBg, color: s.avFg }}>{s.teacherInitials}</span>
                          <span className="cdg-tname">{s.teacher}</span>
                        </span>
                      ) : (
                        <button type="button" className="cdg-assign" onClick={(e) => { e.stopPropagation(); onAssignTeacher?.(s.raw); }}>
                          <I.plus /> Assign teacher
                        </button>
                      )}
                    </div>
                    <div style={{ ...colStudents, display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="cdg-strength">{s.strength}<span className="sub">/{s.capTxt}</span></span>
                      <span className="cdg-fill-track"><span className="cdg-fill" style={{ width: s.fillW, background: s.fillTone }} /></span>
                    </div>
                    <div style={{ ...colSubjects, fontFamily: "'Geist Mono',monospace", fontSize: 12.5, color: "#74787f" }}>{s.subjects}</div>
                    <div style={{ ...colRoom, fontSize: 12.5, color: "#74787f" }}>{s.room}</div>
                    <div style={{ ...colAtt, display: "flex", alignItems: "center", gap: 9 }}>
                      <span className="cdg-mono" style={{ fontSize: 12, color: s.attNumTone, width: 34 }}>{s.attTxt}</span>
                      <span className="cdg-att-track"><span className="cdg-att-fill" style={{ width: s.attW, background: s.attBarTone }} /></span>
                    </div>
                    <div style={colStatus}>
                      <span className="cdg-status" style={{ background: s.statusBg, color: s.statusFg }}>
                        <span className="cdg-status-dot" style={{ background: s.statusDot }} />{s.statusLabel}
                      </span>
                    </div>
                    <div style={{ ...colActions, textAlign: "center" }}>
                      <span style={{ position: "relative", display: "inline-flex" }}>
                        <button type="button" className="sdg-row-kebab" aria-label={`Actions for ${s.grade}-${s.section}`} onClick={(e) => { e.stopPropagation(); toggleMenu(`row-${s.id}`); }}>
                          <I.kebab />
                        </button>
                        {openMenu === `row-${s.id}` && (
                          <>
                            <div className="sdg-menu-overlay" onClick={(e) => { e.stopPropagation(); closeMenu(); }} />
                            <div className="sdg-menu" style={{ width: 200, top: 30 }}>
                              <button className="sdg-menu-item" onClick={(e) => { e.stopPropagation(); closeMenu(); onOpenSection?.(s.raw); }}><I.open /> Open class</button>
                              <button className="sdg-menu-item" onClick={(e) => { e.stopPropagation(); closeMenu(); onAssignTeacher?.(s.raw); }}><I.user /> Assign teacher</button>
                              <button className="sdg-menu-item" onClick={(e) => { e.stopPropagation(); closeMenu(); onEditSection?.(s.raw); }}><I.edit /> Edit</button>
                              <div className="sdg-menu-sep" />
                              <button className="sdg-menu-item is-danger" onClick={(e) => { e.stopPropagation(); closeMenu(); onDeleteSection?.(s.raw); }}><I.trash /> Delete</button>
                            </div>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Trailing "Add section" CTA (per expanded grade group) */}
                {g.open && (
                  <div className="cdg-addrow">
                    <div style={lead} />
                    <button type="button" className="cdg-addrow-btn" onClick={(e) => { e.stopPropagation(); onAddSection?.(g.grade); }}>
                      <I.plus /> Add section
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== Footer ===== */}
      <div className="sdg-footer">
        <span className="sdg-foot-stat"><span className="sdg-mono">{fmtIN(summary.classes || 0)}</span> classes · <span className="sdg-mono">{fmtIN(summary.sections || 0)}</span> sections</span>
        <span className="sdg-foot-stat">Students <span className="sdg-mono">{fmtIN(summary.students || 0)}</span></span>
        <span className="sdg-foot-stat">Unassigned <span className="sdg-mono" style={{ color: "#c08a2e" }}>{fmtIN(summary.unassigned || 0)}</span></span>
        <div style={{ flex: 1 }} />
        <span className="sdg-foot-stat">Avg attendance <span className="sdg-mono" style={{ color: "#2f8f57" }}>{summary.avgAtt || "—"}</span></span>
      </div>
    </div>
  );
}
