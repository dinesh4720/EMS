# EMS School Dashboard — Design System

Canonical reference for the Superhuman/Linear-style revamp. **Every new screen must compose from these tokens, bare-class primitives, and layout patterns — never style ad-hoc.**

The interactive source of truth is `/style-guide` (dev-only). This document mirrors it for offline reference and code review.

The canonical implementation lives in:

| Layer | File |
| --- | --- |
| Tokens | `src/styles/tokens.css` |
| App shell + buttons + tables + status pills | `src/styles/shell.css` |
| Staff list — two-pane + frosted detail pane | `src/styles/staff.css` |
| Composer overlay + drawer + form atoms | `src/styles/create.css` |
| Frosted overlay base | `src/styles/frosted-overlay.css` |
| Reference pages | `src/pages/staffs/StaffList.jsx`, `StaffListRow.jsx`, `StaffDetailPane.jsx`, `AddStaffComposer.jsx` |

Treat the staffs revamp as the **canonical reference**. Anything that disagrees with it loses.

---

## How to use this system

1. Start from a **token** (`var(--accent)`, `var(--fg-muted)`, `var(--surface-2)`). Never inline a hex.
2. Reach for a **bare-class primitive** (`.btn`, `.input`, `.chip`, `.seg`, `.status`, `.composer`, `.detail-pane`). Never duplicate their CSS.
3. Compose **layout patterns** — two-pane with frosted detail, composer overlay, sticky-head/foot scroll panel.
4. Render the **four data states** on every fetching screen — skeleton, empty, error, success.
5. Validate forms with **Zod** schemas that mirror the backend Mongoose schema (see root `CLAUDE.md`).

If a primitive is missing, add it to `src/styles/*.css`, document it in the relevant `src/pages/styleguide/*Section.jsx`, and update this file. Never style ad-hoc.

---

## Tokens

Single source: `src/styles/tokens.css`. Tailwind v4 utility shims in `src/index.css` (`@theme inline`) alias the same values for `bg-surface` / `text-fg-muted` / `border-border-strong` style utilities.

### Type

```
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

--fs-11: 11px;   --fs-13: 13px;   --fs-15: 15px;
--fs-18: 18px;   --fs-24: 24px;   --fs-32: 32px;

--fw-regular: 420;  --fw-medium: 520;  --fw-semibold: 600;
```

Base body is **13px** Inter with `cv11`/`ss01`/`ss03` features and `tabular-nums` (`.tnum`) for any numeric column. Use `.mono` for IDs and codes.

### Spacing & radii

4-px grid:

```
--sp-1: 4   --sp-2: 8   --sp-3: 12   --sp-4: 16   --sp-5: 20
--sp-6: 24  --sp-8: 32  --sp-10: 40  --sp-12: 48

--r-sm: 4   --r-md: 6   --r-lg: 8   --r-xl: 12   --r-2xl: 16   --r-full: 999
```

### Density

```
--row-h: 36px            (table row)
--row-h-cozy: 44px       (touch density)
--topbar-h: 44px
--sidebar-w: 224px       --sidebar-w-collapsed: 56px
```

A `[data-density="compact"]` modifier on `<body>` tightens to `--row-h: 32px` / `--topbar-h: 40px`.

### Color — warm-neutral surface, indigo accent

Light (default):

```
--bg               app background        oklch(98.6% 0.003 80)
--surface          card / row            oklch(100% 0 0)
--surface-2        raised surface        oklch(97%   0.003 80)
--surface-hover    interactive hover     oklch(95%   0.004 80)
--border           1-px hairline         oklch(0% 0 0 / 0.08)
--border-strong    emphasized border     oklch(0% 0 0 / 0.14)
--divider          between rows          oklch(0% 0 0 / 0.05)

--fg               body text             oklch(18% 0.01  280)
--fg-muted         secondary             oklch(45% 0.008 280)
--fg-subtle        tertiary              oklch(60% 0.006 280)
--fg-faint         decorative only       oklch(72% 0.004 280)   ⚠ not AA
```

Accent — single indigo, used sparingly for primary CTAs, focus rings, and active state:

```
--accent           oklch(56% 0.19 270)
--accent-hover     oklch(50% 0.20 270)
--accent-bg        rgba accent / 0.10   (chip / focus halo)
--accent-border    rgba accent / 0.25
--accent-fg        oklch(98% 0.01 270)  (text on solid accent)
```

Status — **only** for status, never decoration:

```
--ok / --ok-bg            success / paid / present
--ok-border / --ok-hover  success border / hover state
--warn / --warn-bg        warning / pending / leave
--warn-border / --warn-hover  warning border / hover state
--danger / --danger-bg    error / overdue / absent
--danger-border / --danger-hover  error border / hover state
--info / --info-bg        scheduled / neutral system event
--info-border / --info-hover  info border / hover state
```

Chart palette — data visualization:

```
--chart-c1   indigo (accent)
--chart-c2   blue
--chart-c3   green
--chart-c4   amber
--chart-c5   magenta
--chart-grid grid line
--chart-axis axis line
```

Glass — frosted overlay base:

```
--glass-bg         rgba(255 255 255 / 0.62)
--glass-border     rgba(0 0 0 / 0.08)
--glass-blur       saturate(160%) blur(24px)
```

Dark mode auto-flips through the `[data-theme="dark"], .dark` selector — every token gets a dark counterpart in `tokens.css`. Component CSS only references the tokens, so no `dark:` variants are needed.

### Elevation

Barely-there:

```
--shadow-sm       0 1px 2px            (default cards stay flat)
--shadow-md       0 4px 16px -4px      (floating overlays)
--shadow-lg       0 24px 48px -16px    (full-screen sheets)
--shadow-glass    32px lift + 1px hairline   (composer / frosted detail)
```

### Aliases

`--border-token`, `--danger-token`, `--info-token` exist so direct CSS `var(--border-token)` references resolve. The Tailwind `@theme inline` block exposes the `--color-*-token` siblings used by utility classes (`bg-bg`, `border-border-strong`, …).

---

## Primitives — bare-class library

These are CSS classes that ship in `src/styles/{shell,staff,create,frosted-overlay}.css`. Drop them into JSX directly — no React wrappers needed. They are the building blocks for everything new.

### `.btn`

```html
<button class="btn">Cancel</button>
<button class="btn btn--primary">Save</button>
<button class="btn btn--accent">Add staff</button>
<button class="btn btn--ghost">Skip</button>
<button class="btn btn--sm">Receipt</button>     <!-- 24px -->
<button class="iconbtn" aria-label="More">…</button>
```

28-px height, 6-px radius, subtle inset highlight on `--primary` and `--accent`. Use these inside dense toolbars and table rows. The React `<Button />` primitive is for form actions and modal footers where a 36-px tap target reads better.

### `.chip` · `.status` · `.kbd`

```html
<span class="chip">3-A</span>
<span class="chip chip--ok">Active</span>

<span class="status status--ok"><span class="dot" />Paid</span>
<span class="status status--warn"><span class="dot" />Pending</span>
<span class="status status--danger"><span class="dot" />Overdue</span>

<kbd class="kbd">/</kbd>
```

Status pills carry **status only** — never use them for category or decoration. `.chip` variants (`chip--ok/warn/danger/info/accent`) are fine for tonal categorization.

### Form atoms — `.field` · `.input` · `.select` · `.textarea`

```html
<label class="field">
  <span class="field__label">Email <span class="req">*</span></span>
  <input class="input" type="email" />
  <span class="field__hint">Used for password resets</span>
</label>

<label class="field">
  <span class="field__label">Role</span>
  <select class="select"><option>Teaching</option></select>
</label>

<textarea class="textarea" rows={4} />
```

32-px input height, 6-px radius, focus ring uses `--accent-bg` halo. Icon prefix: wrap in `.field__icon-wrap` and use `.input--with-icon`. Suffix unit (e.g. ₹, %): `.field__suffix` + `.input--with-suffix`.

### `.seg` — segmented filter

```html
<div class="seg" role="tablist">
  <button class="seg__btn is-active">All</button>
  <button class="seg__btn">Active</button>
  <button class="seg__btn">Today</button>
</div>
```

22-px pill, used at the top of every list page for quick filters. Pair with `.toolbar__search`.

### `.toolbar`

```html
<div class="toolbar">
  <div class="toolbar__search">
    <Search size={13} /> <input placeholder="Search…" /> <span class="kbd">/</span>
  </div>
  <div class="seg">…</div>
</div>
```

Sits flush against the page edge under the page header. Holds search + filters + bulk-action chip. Border-bottom is the only chrome.

### `.optgrid` — segmented option picker

```html
<div class="optgrid">
  <button class="opt is-active">
    <span class="opt__icon"><GraduationCap size={14}/></span>
    Teaching
    <span class="opt__check"><Check size={10}/></span>
  </button>
  <button class="opt">…</button>
</div>
```

Wider-than-radio choices with an iconography lead. Used inside composer sections (role picker, employment type).

### `.taginput`

```html
<div class="taginput">
  <span class="tagchip">Maths <button aria-label="Remove">×</button></span>
  <span class="tagchip">Physics <button aria-label="Remove">×</button></span>
  <input placeholder="Add subject…" />
</div>
```

Mono-font chips inside a focusable container. Click-to-add, ⌫-to-remove.

### `.help-banner`

```html
<div class="help-banner">
  <Lightbulb size={14}/>
  <span><b>Tip.</b> Fill what you have — you can complete the rest later.</span>
  <button class="help-banner__close" aria-label="Dismiss">×</button>
</div>
```

Warm-amber inline tip. Distinct from accent so it doesn't compete with primary actions. Use sparingly — once per flow.

### `.disclosure` — "more options" reveal

```html
<button class="disclosure">Show advanced fields <ChevronDown size={11} /></button>
```

Inline accent link for progressive disclosure inside composer / drawer bodies.

### `.detail-pane`

```html
<aside class="detail-pane">
  <header class="detail-pane__head">…back / mail / phone / more…</header>
  <div class="detail-pane__hero">…avatar + name + role + chips…</div>
  <div class="detail-pane__metrics">
    <div class="dp-metric">
      <span class="dp-metric__label">Attendance</span>
      <span class="dp-metric__value mono tnum">94%</span>
    </div>
    … 2 more …
  </div>
  <section class="detail-pane__section">
    <ul class="dp-feed">
      <li><span class="dp-feed__time mono">09:12</span><span>Checked in</span></li>
      …
    </ul>
  </section>
  <section class="detail-pane__section">
    <div class="dp-kv"><span class="subtle">Email</span><span class="mono">…</span></div>
    …
  </section>
  <footer class="detail-pane__foot">
    <button class="btn">View profile</button>
    <button class="btn btn--accent" style="flex:1">Mark attendance</button>
  </footer>
</aside>
```

Frosted right pane in the two-pane shell. Head + foot are **sticky** so primary actions stay reachable while the body scrolls. See `StaffDetailPane.jsx` for the canonical implementation.

---

## Patterns

### Two-pane list

The canonical list shape across the dashboard.

```jsx
<div className="page" style={{
  display: "grid",
  gridTemplateColumns: "minmax(420px, 1fr) 380px",
  minHeight: 0,
}}>
  <div style={{ borderRight: "1px solid var(--border)", minHeight: 0, display: "flex", flexDirection: "column" }}>
    <header className="page__head">…title + Add CTA…</header>
    <div className="toolbar">…search + .seg + bulk chip…</div>
    <div role="listbox" style={{ flex: 1, overflow: "auto" }}>
      {visible.map(row => <ListRow … />)}
    </div>
  </div>
  <StaffDetailPane … />
</div>
```

- Left list scrolls independently; right pane stays pinned.
- Selection lives in the URL (`?id=…`) so back/forward and direct-link work.
- Auto-select first row on desktop when nothing is in the URL.
- `↑` / `↓` move selection; `/` focuses the search; `Esc` clears it.
- Below `1100px` the right pane collapses into a `stafflist__drawer` slide-over.

Canonical: `src/pages/staffs/StaffList.jsx`.

### Composer overlay

Full-bleed frosted card centered over the page. Replaces the legacy HeroUI `<Drawer>` for create / multi-step flows.

```jsx
createPortal(
  <div className="composer-overlay" onClick={maybeClose}>
    <div className="composer" role="dialog" aria-modal="true">
      <header className="composer__head">…breadcrumbs · X…</header>
      <div className="composer__body">
        <nav className="composer__nav">
          <button className="cnav is-active"><span className="cnav__num">1</span> Identity</button>
          <button className="cnav"><span className="cnav__num">2</span> Role</button>
          …
        </nav>
        <main className="composer__main">
          <h2 className="composer__title">Add staff</h2>
          <p className="composer__sub">Fill what you have, the rest can wait.</p>
          <section className="section">
            <header className="section__head"><span className="section__title">Identity</span></header>
            <div className="fgrid">
              <label className="field">…</label>
              <label className="field">…</label>
            </div>
          </section>
          …
        </main>
      </div>
      <footer className="composer__foot">
        <div className="composer__progress">
          <div className="composer__progress-bar"><div className="composer__progress-fill" style={{ width: "40%" }} /></div>
          2 of 5 sections
        </div>
        <button className="btn">Save draft</button>
        <button className="btn btn--accent">Save & continue</button>
      </footer>
    </div>
  </div>,
  document.body
)
```

- Portals to `document.body` to escape ancestor stacking / transforms.
- Card is solid `--surface` with a 1-px border + `--shadow-lg`; only the left section nav rail is frosted (so the form area stays sharp for long reads).
- No animation on the overlay scrim — only the card fades in. Animating the scrim breaks Chrome's `backdrop-filter` compositing.
- Section nav lives at 220 px. Each row is `.cnav` with a numbered `.cnav__num` chip and an optional `.cnav__count` on the right.

Canonical: `src/pages/staffs/AddStaffComposer.jsx`.

### Drawer — right-side sheet

Lightweight alternative to the composer for single-step edits.

```html
<div className="drawer-frame">
  <div className="drawer-scrim" />
  <aside className="drawer">
    <header className="drawer__head">…title + close…</header>
    <div className="stepper stepper--inline">
      <div className="stepper__item is-done">
        <span className="stepper__num"><Check size={11}/></span>
        <span className="stepper__lab">Details</span>
      </div>
      <span className="stepper__line" />
      <div className="stepper__item is-active">
        <span className="stepper__num">2</span>
        <span className="stepper__lab">Review</span>
      </div>
    </div>
    <div className="drawer__body">…fields…</div>
    <footer className="drawer__foot">…btn · btn--accent…</footer>
  </aside>
</div>
```

Uses solid `--surface` (no frost) since drawers are narrower and the underlying page is visually demoted by the scrim.

### Frosted overlay base

Generic frosted card pattern used by student detail, payment sheet, visitor sheet, calendar drawer, announcement composer. CSS lives in `src/styles/frosted-overlay.css`.

```jsx
<div className="frosted-overlay__backdrop" onClick={closeOnBackdrop}>
  <div className="frosted-overlay" role="dialog">
    <button className="frosted-overlay__close" onClick={onClose}><X /></button>
    <div className="frosted-overlay__body">…</div>
    <div className="frosted-overlay__footer">
      <button className="btn btn--accent btn--sm">Got it</button>
    </div>
  </div>
</div>
```

**Rule:** never place `transform`, `filter`, or `will-change` on any ancestor — they collapse the descendant's `backdrop-filter` into a no-op on Chrome.

### Sticky head & foot

When a panel scrolls, the action row must stay visible. The pattern (used in `.detail-pane`, `.composer`, `.drawer`):

- Inner body has `overflow: auto`, `min-height: 0`, `flex: 1`.
- Head: `position: sticky; top: 0; background: var(--surface); z-index: 1`.
- Foot: `position: sticky; bottom: 0; background: var(--surface); margin-top: auto`.

Never let the primary action scroll off the visible bottom edge.

### Toolbar + segmented filter

Below the page head, above the data:

```jsx
<div className="toolbar">
  <div className="toolbar__search">
    <Search size={13} aria-hidden /><input placeholder="Search…" /><span className="kbd">/</span>
  </div>
  <div className="seg">{filters.map(f => <button className={`seg__btn${active===f.key ? " is-active":""}`}>{f.label}</button>)}</div>
  {selected > 0 && <BulkChip />}
</div>
```

Live ref: `StaffList.jsx` lines 310-384.

### KPI strip · density table · period strip · class tile · chat · calendar · frosted overlay

These were carried over from the earlier revamp and are documented in `src/pages/styleguide/PatternsSection.jsx`. They compose from the same tokens — keep using them where they fit.

---

## Four-state data screen

Every fetching screen renders these four states. Skeleton uses the `.animate-shimmer` utility; empty / error compose from primitives.

```jsx
{loading && <Skeleton …/>}
{!loading && error && <ErrorState onRetry={refetch} />}
{!loading && !error && rows.length === 0 && <EmptyState …/>}
{!loading && !error && rows.length > 0 && <Content />}
```

No blank screens, no bare spinners.

---

## Accessibility baseline

- Semantic HTML before ARIA — `<button>`, `<nav>`, `<main>`, `<header>`.
- Every interactive element has a visible focus ring (`outline: 2px solid var(--accent)` or accent-bg halo).
- Keyboard operable: ⏎ activates, ↑/↓ navigates lists, `Esc` clears selection / closes overlay.
- Forms: every input has a programmatically-associated `<label>` and `aria-describedby` for hint / error.
- Color is never the only signal — pair status colors with a dot + text label.
- `prefers-reduced-motion` is honored in `src/index.css` — short-circuits animations.

---

## Responsive

Verify every screen at **375 px**, **768 px**, and **1280 px+**.

- Two-pane shell collapses below `1100 px`: list takes full width, detail becomes a `stafflist__drawer` slide-over.
- Composer card max-height is `calc(100vh - 48px)`; on narrow viewports the section nav scrolls independently.
- Topbar / sidebar widths are tokenised (`--topbar-h`, `--sidebar-w`, `--sidebar-w-collapsed`).

---

## Style guide structure

The `/style-guide` route is composed from these files:

| File | Covers |
| --- | --- |
| `src/pages/StyleGuide.jsx` | Shell — sticky TOC, theme + density toolbar, search filter |
| `src/pages/styleguide/shared.jsx` | `Story`, `StoryGroup`, `Swatch`, `ScaleRow`, `CopyButton`, `PropTable` |
| `src/pages/styleguide/TokensSection.jsx` | Color, typography, radius, elevation, spacing, motion, z-index, density |
| `src/pages/styleguide/PrimitivesSection.jsx` | `.btn`, `.chip`, `.status`, `.kbd`, `.input`, `.select`, `.seg`, `.field`, `.optgrid`, `.taginput`, `.help-banner`, `.disclosure` |
| `src/pages/styleguide/PatternsSection.jsx` | Two-pane shell, composer overlay, detail pane, sticky head/foot, toolbar + filter, KPI strip, density table, period strip, class tile, chat, calendar, frosted overlay |
| `src/pages/styleguide/IconsSection.jsx` | Searchable Lucide grid + size/stroke guidance |
| `src/pages/styleguide/AccessibilityResponsiveSection.jsx` | A11y checklist + breakpoints |

All chrome lives in `src/styles/styleguide.css`.

---

## Adding to the system

1. Add the CSS to the right file (`shell.css` for app-wide atoms; `create.css` for composer/drawer; `staff.css` for two-pane; new pattern → new `*.css` file imported from `index.css`).
2. Add a `<Story>` to the matching section file under `src/pages/styleguide/`.
3. Add an entry under the right group in this document.
4. Replace ad-hoc usages elsewhere in the codebase with the new class.
5. Refresh the visual regression baseline only if the change is intentional (`tests/visual/styleguide.spec.ts --update-snapshots`).

---

## Quick links

- Interactive style guide: `npm run dev` → `/style-guide` (dev-only route).
- Tokens: `src/styles/tokens.css`. Tailwind shims: `src/index.css` (`@theme inline`).
- Canonical staffs revamp: `src/pages/staffs/StaffList.jsx`, `StaffListRow.jsx`, `StaffDetailPane.jsx`, `AddStaffComposer.jsx`.
