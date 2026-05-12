import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Search, Wallet, BellRing, X, Plus, Clock, AlertTriangle, TrendingUp, TrendingDown,
  ChevronLeft, Mail, Phone, MoreHorizontal, Check, GraduationCap, Building2, Users,
  Sparkles, Lightbulb,
} from "lucide-react";

import { Story, StoryGroup } from "./shared";
import BulkActionBar from "../../components/ui/BulkActionBar";
import useBulkSelection from "../../hooks/useBulkSelection";

/* ──────────────────────────────────────────────────────────────────
 * Patterns — scoped, page-level patterns built from primitives + tokens.
 * These have hand-written CSS in src/styles/{classes,fees,calendar,messaging}.
 * ────────────────────────────────────────────────────────────────── */

const DENSITY_ROWS = [
  { id: "5",  roll: 5,  name: "Aarav Joshi",  klass: "Class 3 · A", term: "Term 1", amount: 13000, status: "ok" },
  { id: "8",  roll: 8,  name: "Riya Mehta",   klass: "Class 3 · A", term: "Term 1", amount: 13000, status: "danger" },
  { id: "12", roll: 12, name: "Karan Singh",  klass: "Class 3 · A", term: "Term 1", amount: 13000, status: "warn" },
  { id: "17", roll: 17, name: "Asha Sharma",  klass: "Class 3 · A", term: "Term 1", amount: 13000, status: "ok" },
];

function DensityTableDemo() {
  const [selected, setSelected] = useState(new Set(["8"]));
  const allSelected = selected.size === DENSITY_ROWS.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(DENSITY_ROWS.map((r) => r.id)));

  return (
    <Story title="Fees table — interactive" sub={`${selected.size} selected`} layout="plain">
      <div className="fees-table" role="table">
        <div className="fees-table__head" role="row">
          <CheckboxCell
            label="Select all rows"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleAll}
          />
          <span>Roll</span>
          <span>Student</span>
          <span>Term</span>
          <span className="fees-table__amount">Amount</span>
          <span>Status</span>
          <span className="fees-table__action">Action</span>
        </div>
        {DENSITY_ROWS.map((row) => {
          const isSelected = selected.has(row.id);
          const STATUS_LABEL = { ok: "Paid", warn: "Pending", danger: "Overdue" }[row.status];
          return (
            <div
              key={row.id}
              role="row"
              className={`fees-table__row${isSelected ? " is-selected" : ""}`}
            >
              <CheckboxCell
                label={`Select ${row.name}`}
                checked={isSelected}
                onChange={() => toggle(row.id)}
              />
              <span className="mono tnum">{row.roll}</span>
              <span>
                <div className="fees-table__name">{row.name}</div>
                <div className="fees-table__sub">{row.klass}</div>
              </span>
              <span className="subtle">{row.term}</span>
              <span className="fees-table__amount tnum">
                ₹{row.amount.toLocaleString("en-IN")}
              </span>
              <span>
                <span className={`status status--${row.status}`}>
                  <span className="dot" aria-hidden />
                  {STATUS_LABEL}
                </span>
              </span>
              <span className="fees-table__action">
                {row.status === "ok" ? (
                  <button type="button" className="btn btn--sm">Receipt</button>
                ) : (
                  <button type="button" className="btn btn--accent btn--sm">
                    <Wallet size={13} aria-hidden /> Collect
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Story>
  );
}

function CheckboxCell({ label, checked, indeterminate, onChange }) {
  return (
    <input
      type="checkbox"
      className="sg-tbl-checkbox"
      aria-label={label}
      checked={!!checked}
      onChange={(e) => onChange?.(e.target.checked)}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate && !checked;
      }}
    />
  );
}

function FrostedDemoOverlay({ open, onClose }) {
  if (!open || typeof document === "undefined") return null;
  // Portal to body — frosted-overlay relies on `position: fixed` reading the
  // viewport. Any ancestor with `transform` (Framer Motion, sticky chrome,
  // some Tailwind utilities) silently demotes that to the ancestor's box.
  return createPortal(
    <div
      className="frosted-overlay__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="frosted-overlay"
        role="dialog"
        aria-label="Demo overlay"
        style={{ width: 480 }}
      >
        <button
          type="button"
          className="frosted-overlay__close"
          onClick={onClose}
          aria-label="Close demo"
        >
          <X size={16} aria-hidden />
        </button>
        <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid var(--divider)" }}>
          <h3 className="text-fg" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Frosted overlay base
          </h3>
          <p className="text-fg-muted" style={{ fontSize: 12, marginTop: 2 }}>
            Shared chrome — used by student detail, payment sheet, visitor sheet,
            calendar drawer, announcement composer.
          </p>
        </div>
        <div className="frosted-overlay__body">
          <p className="text-fg-muted text-sm">
            Backdrop dims at <code>rgba(0,0,0,0.3)</code>; card uses{" "}
            <code>backdrop-filter: saturate(160%) blur(24px)</code>. Don&rsquo;t put{" "}
            <code>transform</code> on any ancestor or the blur breaks.
          </p>
        </div>
        <div className="frosted-overlay__footer">
          <span className="frosted-overlay__footer-link">Esc / backdrop / X all close</span>
          <button type="button" className="btn btn--accent btn--sm" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Two-pane shell — canonical list shape from staffs revamp.
 * ────────────────────────────────────────────────────────────────── */
const TWO_PANE_STAFF = [
  { id: "s1", name: "Asha Sharma", role: "Class teacher · 3-A", status: "ok", initials: "AS" },
  { id: "s2", name: "Vikram Singh", role: "Maths · 4-B", status: "warn", initials: "VS" },
  { id: "s3", name: "Deepak Mehta", role: "Science · 5-A", status: "ok", initials: "DM" },
  { id: "s4", name: "Riya Kapoor", role: "Library", status: "danger", initials: "RK" },
];

function TwoPaneDemo() {
  const [selected, setSelected] = useState("s1");
  const active = TWO_PANE_STAFF.find((s) => s.id === selected) || TWO_PANE_STAFF[0];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 280px",
        height: 360,
        borderTop: "1px solid var(--divider)",
        borderBottom: "1px solid var(--divider)",
      }}
    >
      <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="toolbar" style={{ flex: "none" }}>
          <div className="toolbar__search" style={{ flex: 1 }}>
            <Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
            <input placeholder="Search staff…" aria-label="Demo search" />
            <span className="kbd" aria-hidden>/</span>
          </div>
        </div>
        <div role="listbox" aria-label="Staff demo" style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {TWO_PANE_STAFF.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={selected === s.id}
              onClick={() => setSelected(s.id)}
              className={`stafflist__row${selected === s.id ? " is-active" : ""}`}
              style={{ width: "100%", background: "transparent" }}
            >
              <span
                className="avatar avatar--sm"
                style={{ width: 26, height: 26, fontSize: 11 }}
                aria-hidden
              >
                {s.initials}
              </span>
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 520, color: "var(--fg)" }}>{s.name}</span>
                <span className="subtle" style={{ fontSize: 11.5 }}>{s.role}</span>
              </span>
              <span className={`status status--${s.status}`}>
                <span className="dot" aria-hidden />
                {s.status === "ok" ? "Present" : s.status === "warn" ? "Late" : "Absent"}
              </span>
            </button>
          ))}
        </div>
      </div>
      <DetailPaneMini staff={active} onClear={() => setSelected(active.id)} />
    </div>
  );
}

function DetailPaneMini({ staff, onClear }) {
  return (
    <aside className="detail-pane" aria-label={`Demo profile for ${staff.name}`}>
      <div className="detail-pane__head">
        <button
          type="button"
          className="iconbtn"
          style={{ width: 22, height: 22 }}
          onClick={onClear}
          aria-label="Back"
        >
          <ChevronLeft size={13} aria-hidden />
        </button>
        <span className="subtle mono tnum" style={{ fontSize: 11 }}>EMP-{staff.id.toUpperCase()}</span>
        <div style={{ flex: 1 }} />
        <button type="button" className="iconbtn" style={{ width: 22, height: 22 }} aria-label="Email">
          <Mail size={13} aria-hidden />
        </button>
        <button type="button" className="iconbtn" style={{ width: 22, height: 22 }} aria-label="Call">
          <Phone size={13} aria-hidden />
        </button>
        <button type="button" className="iconbtn" style={{ width: 22, height: 22 }} aria-label="More">
          <MoreHorizontal size={14} aria-hidden />
        </button>
      </div>
      <div className="detail-pane__hero" style={{ padding: "16px 16px 12px" }}>
        <span
          className="avatar"
          style={{ width: 44, height: 44, fontSize: 15 }}
          aria-hidden
        >
          {staff.initials}
        </span>
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>{staff.name}</span>
          <span className="subtle" style={{ fontSize: 12 }}>{staff.role}</span>
          <div className="row gap-2" style={{ marginTop: 4 }}>
            <span className={`status status--${staff.status}`}>
              <span className="dot" aria-hidden />
              {staff.status === "ok" ? "Active" : staff.status === "warn" ? "On leave" : "Inactive"}
            </span>
            <span className="chip mono tnum">3-A</span>
          </div>
        </div>
      </div>
      <div className="detail-pane__metrics" style={{ margin: "0 16px" }}>
        <div className="dp-metric">
          <span className="dp-metric__label">Attendance</span>
          <span className="dp-metric__value mono tnum">94%</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Check-in</span>
          <span className="dp-metric__value mono tnum">08:42</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">Joined</span>
          <span className="dp-metric__value mono tnum" style={{ fontSize: 13 }}>2024-07</span>
        </div>
      </div>
      <div className="detail-pane__section" style={{ padding: "16px" }}>
        <div className="card__title" style={{ marginBottom: 8 }}>Recent activity</div>
        <ul className="dp-feed">
          <li><span className="dp-feed__time mono tnum">09:12</span><span>Checked in</span></li>
          <li><span className="dp-feed__time mono tnum">Mon</span><span>Marked attendance for 3-A</span></li>
          <li><span className="dp-feed__time mono tnum">Mar 14</span><span>Sent term-end remarks</span></li>
        </ul>
      </div>
      <div className="detail-pane__section" style={{ padding: "16px" }}>
        <div className="card__title" style={{ marginBottom: 8 }}>Contact</div>
        <div className="dp-kv"><span className="subtle">Email</span><span className="mono">asha@school.in</span></div>
        <div className="dp-kv"><span className="subtle">Phone</span><span className="mono tnum">+91 98xxx-12345</span></div>
      </div>
      <div className="detail-pane__foot">
        <button type="button" className="btn">View profile</button>
        <button type="button" className="btn btn--accent" style={{ flex: 1 }}>Mark attendance</button>
      </div>
    </aside>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Composer overlay — frosted full-bleed card portal'd to body.
 * ────────────────────────────────────────────────────────────────── */
const COMPOSER_SECTIONS = [
  { key: "identity",   label: "Identity",   num: 1 },
  { key: "role",       label: "Role",       num: 2 },
  { key: "classes",    label: "Classes",    num: 3 },
  { key: "contact",    label: "Contact",    num: 4 },
  { key: "review",     label: "Review",     num: 5 },
];

function ComposerDemoOverlay({ open, onClose }) {
  const [active, setActive] = useState("identity");
  const [role, setRole] = useState("Teaching");
  if (!open || typeof document === "undefined") return null;
  const idx = COMPOSER_SECTIONS.findIndex((s) => s.key === active);
  const pct = Math.round(((idx + 1) / COMPOSER_SECTIONS.length) * 100);

  return createPortal(
    <div
      className="composer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="composer" role="dialog" aria-modal="true" aria-label="Composer demo">
        <header className="composer__head">
          <div className="composer__crumbs">
            <span>Staff</span>
            <span aria-hidden>›</span>
            <span className="here">New staff</span>
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close composer">
            <X size={14} aria-hidden />
          </button>
        </header>
        <div className="composer__body">
          <nav className="composer__nav" aria-label="Composer sections">
            <div className="composer__nav-title">Sections</div>
            {COMPOSER_SECTIONS.map((s, i) => {
              const isActive = active === s.key;
              const isDone = i < idx;
              return (
                <button
                  key={s.key}
                  type="button"
                  className={`cnav${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                  onClick={() => setActive(s.key)}
                >
                  <span className="cnav__num" aria-hidden>
                    {isDone ? <Check size={11} /> : s.num}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>
          <main className="composer__main">
            <h2 className="composer__title">Add staff</h2>
            <p className="composer__sub">Fill what you have — the rest can wait.</p>
            <div className="help-banner" style={{ marginBottom: 20 }}>
              <Lightbulb size={14} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1 }}>
                <b>Tip.</b> Only <b>Identity</b> and <b>Role</b> are required to save a draft.
              </span>
            </div>
            <section className="section">
              <header className="section__head">
                <span className="section__title">Identity</span>
                <span className="section__hint">Name and code</span>
              </header>
              <div className="fgrid">
                <label className="field">
                  <span className="field__label">First name <span className="req">*</span></span>
                  <input className="input" placeholder="Asha" />
                </label>
                <label className="field">
                  <span className="field__label">Last name</span>
                  <input className="input" placeholder="Sharma" />
                </label>
                <label className="field span-2">
                  <span className="field__label">Staff code</span>
                  <input className="input" placeholder="EMP-014" />
                </label>
              </div>
            </section>
            <section className="section">
              <header className="section__head">
                <span className="section__title">Role</span>
              </header>
              <div className="optgrid">
                {[
                  { key: "Teaching", icon: GraduationCap },
                  { key: "Admin", icon: Building2 },
                  { key: "Support", icon: Users },
                  { key: "Leadership", icon: Sparkles },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`opt${role === key ? " is-active" : ""}`}
                    onClick={() => setRole(key)}
                  >
                    <span className="opt__icon" aria-hidden><Icon size={14} /></span>
                    {key}
                    <span className="opt__check" aria-hidden><Check size={10} /></span>
                  </button>
                ))}
              </div>
            </section>
          </main>
        </div>
        <footer className="composer__foot">
          <div className="composer__progress">
            <span>{idx + 1} of {COMPOSER_SECTIONS.length}</span>
            <div className="composer__progress-bar" aria-hidden>
              <div className="composer__progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={onClose}>Save draft</button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => {
              const next = COMPOSER_SECTIONS[idx + 1];
              if (next) setActive(next.key);
              else onClose?.();
            }}
          >
            {idx === COMPOSER_SECTIONS.length - 1 ? "Save & finish" : "Save & continue"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Sticky head + foot — scroll body with pinned chrome.
 * ────────────────────────────────────────────────────────────────── */
function StickyHeadFootDemo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 240,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--divider)",
          background: "var(--surface)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--fg)",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        Header — stays pinned
      </header>
      <div style={{ flex: 1, overflow: "auto", padding: "14px", minHeight: 0 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <p
            key={i}
            style={{
              fontSize: 12.5,
              color: "var(--fg-muted)",
              margin: "0 0 10px",
            }}
          >
            Row {i + 1} — scroll the body and watch the header / footer stay in place.
          </p>
        ))}
      </div>
      <footer
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--divider)",
          background: "var(--surface)",
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          position: "sticky",
          bottom: 0,
          zIndex: 1,
        }}
      >
        <button type="button" className="btn btn--sm">Cancel</button>
        <button type="button" className="btn btn--accent btn--sm">Confirm</button>
      </footer>
    </div>
  );
}

function BulkActionBarDemo() {
  const ROWS = [
    { id: "1", name: "Aarav Joshi" },
    { id: "2", name: "Riya Mehta" },
    { id: "3", name: "Karan Singh" },
    { id: "4", name: "Asha Sharma" },
    { id: "5", name: "Devansh Iyer" },
  ];
  const visibleIds = ROWS.map((r) => r.id);
  const selection = useBulkSelection({
    visibleIds,
    totalMatching: 142, // pretend the filter matches 142 records across pages
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          className="btn btn--sm"
          onClick={selection.toggleAllVisible}
        >
          {selection.allVisibleSelected ? "Deselect visible" : "Select visible"}
        </button>
        <BulkActionBar selection={selection} totalMatching={142}>
          <button type="button" className="btn btn--sm">
            <BellRing size={12} aria-hidden /> Send reminder
          </button>
          <button type="button" className="btn btn--sm">
            Mark paid
          </button>
        </BulkActionBar>
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 4, margin: 0, padding: 0, listStyle: "none" }}>
        {ROWS.map((r) => (
          <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={selection.isSelected(r.id)}
              onClick={(e) => {
                e.preventDefault();
                selection.toggle(r.id, e);
              }}
              onChange={() => {}}
              aria-label={`Select ${r.name}`}
            />
            <span>{r.name}</span>
          </li>
        ))}
      </ul>
      <p className="subtle" style={{ fontSize: 11, margin: 0 }}>
        Tip: hold <kbd className="kbd">Shift</kbd> and click to extend the range.
        Press <kbd className="kbd">Esc</kbd> to clear.
      </p>
    </div>
  );
}

export default function PatternsSection() {
  const [filter, setFilter] = useState("all");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [bulkSelect, setBulkSelect] = useState(false);

  return (
    <>
      <StoryGroup
        id="pattern-two-pane"
        title="Two-pane list + frosted detail"
        sub="Canonical list shape — left list scrolls, right .detail-pane stays pinned with sticky head/foot. Selection lives in the URL so back/forward and direct-link work. Source of truth: src/pages/staffs/StaffList.jsx."
      >
        <Story title="Live mini two-pane" layout="plain">
          <TwoPaneDemo />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-composer"
        title="Composer overlay"
        sub="Full-bleed frosted card portaled to document.body. Replaces the legacy HeroUI <Drawer> for create / multi-step flows. Solid surface for the form area, frosted nav rail on the left, no scrim animation. Source of truth: src/pages/staffs/AddStaffComposer.jsx."
      >
        <Story title="Live composer overlay">
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => setComposerOpen(true)}
          >
            <Plus size={14} aria-hidden /> Open composer overlay
          </button>
          <ComposerDemoOverlay open={composerOpen} onClose={() => setComposerOpen(false)} />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-detail-pane"
        title="Frosted detail pane"
        sub=".detail-pane / .detail-pane__head / .detail-pane__hero / .detail-pane__metrics / .dp-metric / .dp-feed / .dp-kv / .detail-pane__foot — the right rail of the two-pane shell. Head + foot are sticky so primary actions stay reachable while the body scrolls."
      >
        <Story title="Standalone pane" layout="plain">
          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
            <div style={{ width: 320, height: 420, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", display: "flex" }}>
              <DetailPaneMini staff={TWO_PANE_STAFF[0]} onClear={() => {}} />
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-sticky"
        title="Sticky head & foot"
        sub="Scroll body with pinned chrome — the recipe used inside .detail-pane, .composer, and .drawer. Body gets overflow:auto + min-height:0; head and foot are position:sticky."
      >
        <Story title="Live scroll demo" layout="plain">
          <div style={{ padding: 16 }}>
            <StickyHeadFootDemo />
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-toolbar"
        title="Toolbar + segmented filter"
        sub=".toolbar / .toolbar__search / .seg / .seg__btn — used at the top of list pages"
      >
        <Story title="Search + segmented filter" layout="plain">
          <div className="toolbar" style={{ borderBottom: "none", padding: 16 }}>
            <div className="toolbar__search" style={{ flex: 1, maxWidth: 320 }}>
              <Search size={13} style={{ color: "var(--fg-subtle)" }} aria-hidden />
              <input type="text" placeholder="Search…" aria-label="Search demo" />
              <span className="kbd" aria-hidden>/</span>
            </div>
            <div className="seg" role="tablist" aria-label="Filter">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "needs", label: "Needs attention" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`seg__btn${filter === f.key ? " is-active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-tile"
        title="KPI tile"
        sub=".tile — dense numerical summary used across dashboard, fees, front-desk"
      >
        <Story title="Tile grid" layout="grid">
          <div className="tile">
            <div className="tile__head"><span className="subtle text-xs">Total students</span></div>
            <div className="tile__value tnum">1,247</div>
            <div className="tile__sub">+12 this term</div>
          </div>
          <div className="tile">
            <div className="tile__head"><span className="subtle text-xs">Attendance</span></div>
            <div className="tile__value tnum">94%</div>
            <div className="tile__sub" style={{ color: "var(--ok)" }}>↑ +1.2 vs last week</div>
          </div>
          <div className="tile">
            <div className="tile__head"><span className="subtle text-xs">Outstanding fees</span></div>
            <div className="tile__value tnum">₹1.84L</div>
            <div className="tile__sub" style={{ color: "var(--danger)" }}>23 students overdue</div>
          </div>
          <div className="tile">
            <div className="tile__head"><span className="subtle text-xs">Active staff</span></div>
            <div className="tile__value tnum">87</div>
            <div className="tile__sub">3 on leave today</div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-kpi"
        title="KPI strips"
        sub=".fees-kpi / .fd-kpi / .academics-kpi — clickable cells that filter the table below"
      >
        <Story title="Fees KPI strip" layout="plain">
          <div style={{ padding: 16 }}>
            <div className="fees-kpi">
              <button type="button" className="fees-kpi__cell">
                <div className="fees-kpi__head">
                  <span className="fees-kpi__label">Collected today</span>
                  <span className="fees-kpi__icon fees-kpi__icon--ok" aria-hidden>
                    <Wallet size={13} />
                  </span>
                </div>
                <span className="fees-kpi__value tnum">₹52,400</span>
                <span className="fees-kpi__sub">
                  <span className="fees-kpi__delta fees-kpi__delta--up">
                    <TrendingUp size={11} aria-hidden /> +12%
                  </span>
                  vs yesterday
                </span>
              </button>
              <button type="button" className="fees-kpi__cell">
                <div className="fees-kpi__head">
                  <span className="fees-kpi__label">Outstanding total</span>
                  <span className="fees-kpi__icon fees-kpi__icon--warn" aria-hidden>
                    <Clock size={13} />
                  </span>
                </div>
                <span className="fees-kpi__value tnum">₹1,84,200</span>
                <span className="fees-kpi__sub">
                  <span className="fees-kpi__delta fees-kpi__delta--down">
                    <TrendingDown size={11} aria-hidden /> −3%
                  </span>
                  pending + overdue
                </span>
              </button>
              <button type="button" className="fees-kpi__cell is-active">
                <div className="fees-kpi__head">
                  <span className="fees-kpi__label">Overdue · students</span>
                  <span className="fees-kpi__icon fees-kpi__icon--danger" aria-hidden>
                    <AlertTriangle size={13} />
                  </span>
                </div>
                <span className="fees-kpi__value fees-kpi__value--danger tnum">23</span>
                <span className="fees-kpi__sub">tap to triage</span>
              </button>
            </div>
          </div>
        </Story>

        <Story title="Bulk action chip" sub="Legacy .fees-bulk surface (pre-REVAMP-101)">
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setBulkSelect((v) => !v)}
          >
            Toggle selection
          </button>
          {bulkSelect && (
            <div className="fees-bulk" role="status">
              <span className="fees-bulk__label">
                <span className="fees-bulk__count">3</span> selected
              </span>
              <span className="fees-bulk__divider" aria-hidden />
              <button type="button" className="btn btn--sm">
                <BellRing size={12} aria-hidden /> Send reminder
              </button>
              <button type="button" className="btn btn--sm">Mark paid</button>
              <span style={{ flex: 1 }} />
              <button type="button" className="btn btn--sm" onClick={() => setBulkSelect(false)}>
                Clear
              </button>
            </div>
          )}
        </Story>

        <Story
          title="Bulk action bar (canonical)"
          sub="useBulkSelection + <BulkActionBar/> — Esc clears, shift-click range, 'Select all matching N' when filtered (REVAMP-101)"
        >
          <BulkActionBarDemo />
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-table"
        title="Density table"
        sub=".fees-table grid pattern — also fd-table, academics-table"
      >
        <DensityTableDemo />
      </StoryGroup>

      <StoryGroup
        id="pattern-period"
        title="Period strip"
        sub=".period-strip + .period-cell — Phase 6 Classes attendance"
      >
        <Story title="Period cells with state variants" layout="plain">
          <div style={{ padding: 16 }}>
            <div className="period-strip" role="tablist" aria-label="Sample periods" style={{ "--period-count": 8 }}>
              <button type="button" role="tab" className="period-cell period-cell--marked is-selected">
                <span className="period-cell__top">
                  <span className="period-cell__num">1</span>
                  <span className="period-cell__time">08:00</span>
                </span>
                <span className="period-cell__bottom">
                  <span className="dot" aria-hidden />
                  <span>Marked</span>
                </span>
              </button>
              <button type="button" role="tab" className="period-cell period-cell--overdue">
                <span className="period-cell__top">
                  <span className="period-cell__num">2</span>
                  <span className="period-cell__time">08:45</span>
                </span>
                <span className="period-cell__bottom">
                  <span className="dot" aria-hidden />
                  <span>Overdue</span>
                </span>
              </button>
              <button type="button" role="tab" className="period-cell period-cell--skipped" disabled>
                <span className="period-cell__top">
                  <span className="period-cell__num">3</span>
                  <span className="period-cell__time">09:30</span>
                </span>
                <span className="period-cell__bottom">
                  <span className="dot" aria-hidden />
                  <span>Break</span>
                </span>
              </button>
              <button type="button" role="tab" className="period-cell period-cell--live">
                <span className="period-cell__top">
                  <span className="period-cell__num">4</span>
                  <span className="period-cell__time">09:45</span>
                </span>
                <span className="period-cell__bottom">
                  <span className="dot" aria-hidden />
                  <span>Live</span>
                </span>
              </button>
              <button type="button" role="tab" className="period-cell period-cell--urgent">
                <span className="period-cell__top">
                  <span className="period-cell__num">5</span>
                  <span className="period-cell__time">10:30</span>
                </span>
                <span className="period-cell__bottom">
                  <span className="dot" aria-hidden />
                  <span>Urgent</span>
                </span>
              </button>
              <button type="button" role="tab" className="period-cell period-cell--upcoming">
                <span className="period-cell__top">
                  <span className="period-cell__num">6</span>
                  <span className="period-cell__time">11:15</span>
                </span>
                <span className="period-cell__bottom">
                  <span className="dot" aria-hidden />
                  <span>Upcoming</span>
                </span>
              </button>
              <button type="button" role="tab" className="period-cell period-cell--upcoming">
                <span className="period-cell__top">
                  <span className="period-cell__num">7</span>
                  <span className="period-cell__time">12:00</span>
                </span>
                <span className="period-cell__bottom">
                  <span className="dot" aria-hidden />
                  <span>Upcoming</span>
                </span>
              </button>
              <button type="button" role="tab" className="period-cell period-cell--upcoming">
                <span className="period-cell__top">
                  <span className="period-cell__num">8</span>
                  <span className="period-cell__time">12:45</span>
                </span>
                <span className="period-cell__bottom">
                  <span className="dot" aria-hidden />
                  <span>Upcoming</span>
                </span>
              </button>
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-class-tile"
        title="Class tile"
        sub=".class-tile — attendance % grid with sparkline"
      >
        <Story title="By-class grid" layout="plain">
          <div style={{ padding: 16 }}>
            <div className="class-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              <a href="#pattern-class-tile" className="class-tile" onClick={(e) => e.preventDefault()}>
                <div className="class-tile__head"><span className="class-tile__name">Class 3-A</span></div>
                <div className="class-tile__pct class-tile__pct--ok">94<span style={{ fontSize: 14 }}>%</span></div>
                <div className="class-tile__sub">28 / 30 present</div>
                <div className="class-tile__chart spark">
                  {[40, 60, 75, 80, 85, 90, 94].map((h, i, arr) => (
                    <span
                      key={i}
                      className={`spark__bar${i === arr.length - 1 ? " is-now" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="class-tile__foot"><span className="class-tile__teacher">Asha Sharma</span></div>
              </a>
              <a href="#pattern-class-tile" className="class-tile" onClick={(e) => e.preventDefault()}>
                <div className="class-tile__head"><span className="class-tile__name">Class 4-B</span></div>
                <div className="class-tile__pct class-tile__pct--warn">68<span style={{ fontSize: 14 }}>%</span></div>
                <div className="class-tile__sub">22 / 32 present</div>
                <div className="class-tile__chart spark">
                  {[80, 75, 70, 72, 68, 65, 68].map((h, i, arr) => (
                    <span
                      key={i}
                      className={`spark__bar${i === arr.length - 1 ? " is-now" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="class-tile__foot"><span className="class-tile__teacher">Vikram Singh</span></div>
              </a>
              <a href="#pattern-class-tile" className="class-tile" onClick={(e) => e.preventDefault()}>
                <div className="class-tile__head"><span className="class-tile__name">Class 5-A</span></div>
                <div className="class-tile__pct class-tile__pct--danger">42<span style={{ fontSize: 14 }}>%</span></div>
                <div className="class-tile__sub">13 / 31 present</div>
                <div className="class-tile__chart spark">
                  {[55, 50, 48, 45, 44, 43, 42].map((h, i, arr) => (
                    <span
                      key={i}
                      className={`spark__bar${i === arr.length - 1 ? " is-now" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="class-tile__foot"><span className="class-tile__teacher">Deepak Mehta</span></div>
              </a>
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-chat"
        title="Chat list + bubbles"
        sub=".chat-list / .chat-bubble — Phase 10 Messaging"
      >
        <Story title="Two-pane chat" layout="plain">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr",
              gap: 0,
              borderTop: "1px solid var(--divider)",
              height: 320,
            }}
          >
            <div className="chat-list" style={{ borderRight: "1px solid var(--divider)" }}>
              <div className="chat-list__row is-active">
                <span className="dot" style={{ background: "var(--accent)", width: 28, height: 28, borderRadius: "50%" }} />
                <div>
                  <div className="chat-list__name">Asha Sharma</div>
                  <div className="chat-list__preview">Thanks for the update!</div>
                </div>
                <div className="chat-list__meta">
                  <span className="chat-list__time">10:42</span>
                  <span className="chat-list__unread">2</span>
                </div>
              </div>
              <div className="chat-list__row">
                <span className="dot" style={{ background: "var(--surface-2)", width: 28, height: 28, borderRadius: "50%" }} />
                <div>
                  <div className="chat-list__name">Karan Singh</div>
                  <div className="chat-list__preview">Will the field trip…</div>
                </div>
                <div className="chat-list__meta">
                  <span className="chat-list__time">09:15</span>
                </div>
              </div>
            </div>
            <div className="chat-thread">
              <div className="chat-thread__messages">
                <div className="chat-bubble chat-bubble--them">
                  Hi! Quick question about Riya&rsquo;s homework today.
                  <div className="chat-bubble__time">10:38</div>
                </div>
                <div className="chat-bubble chat-bubble--me">
                  Sure — she had Math worksheet pages 4–6 and the science write-up.
                  <div className="chat-bubble__time">10:40</div>
                </div>
                <div className="chat-bubble chat-bubble--them">
                  Thanks for the update!
                  <div className="chat-bubble__time">10:42</div>
                </div>
              </div>
              <div className="chat-input">
                <input type="text" placeholder="Type a message…" disabled />
                <button type="button" className="btn btn--accent btn--sm" disabled>
                  Send
                </button>
              </div>
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-calendar"
        title="Calendar grid"
        sub=".calendar-month + .calendar-event — Phase 8"
      >
        <Story title="Monthly grid with event tones" layout="plain">
          <div style={{ padding: 16 }}>
            <div className="calendar-month">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="calendar-month__header">{d}</div>
              ))}
              {Array.from({ length: 28 }).map((_, i) => {
                const day = i + 1;
                const isToday = day === 12;
                const events =
                  day === 5 ? [{ kind: "exam", text: "Maths" }] :
                  day === 12 ? [{ kind: "meeting", text: "PTM" }] :
                  day === 18 ? [{ kind: "holiday", text: "Holiday" }] : [];
                return (
                  <div
                    key={i}
                    className={`calendar-month__cell${isToday ? " is-today" : ""}`}
                  >
                    <div className="calendar-month__date">{day}</div>
                    {events.map((e, j) => (
                      <div key={j} className={`calendar-event calendar-event--${e.kind}`}>
                        {e.text}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </Story>
      </StoryGroup>

      <StoryGroup
        id="pattern-frosted"
        title="Frosted overlay"
        sub=".frosted-overlay — shared chrome for student detail, payment sheet, visitor sheet, calendar drawer"
      >
        <Story title="Live demo">
          <button type="button" className="btn btn--accent" onClick={() => setOverlayOpen(true)}>
            <Plus size={14} aria-hidden /> Open frosted overlay
          </button>
          <FrostedDemoOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />
        </Story>
      </StoryGroup>
    </>
  );
}
