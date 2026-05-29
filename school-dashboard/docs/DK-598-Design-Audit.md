# DK-598 — Design System Audit

> Status: **Complete**  
> Designer: UI/Visual Designer  
> Date: 2026-05-29

---

## 1. Token Coverage

### 1.1 Existing tokens used correctly ✅

| Token | Usage | Status |
|-------|-------|--------|
| `--sidebar-w` (224px) | Expanded width | ✅ |
| `--sidebar-w-collapsed` (56px) | Rail width | ✅ |
| `--surface-2` | Sidebar background | ✅ |
| `--border` | Right border | ✅ |
| `--divider` | Brand/footer separators | ✅ |
| `--fg-muted` | Default item text | ✅ |
| `--fg-faint` | Group headings | ✅ |
| `--accent-bg` | Active background | ✅ |
| `--accent` | Active border, focus ring | ✅ |
| `--shadow-flyout` | Flyout panel | ✅ |

### 1.2 Missing / needed tokens

| Token | Value | Where needed |
|-------|-------|--------------|
| `--sidebar-mobile-w` | `280px` | Mobile drawer width (if keeping side drawer). |
| `--bottom-bar-h` | `56px` | Mobile bottom tab bar height. |
| `--bottom-sheet-max-h` | `70vh` | Mobile "More" sheet. |
| `--flyout-group-divider` | `1px solid var(--divider)` | Gap between flyout groups (currently not tokenized). |

**Recommendation**: Add `--sidebar-mobile-w` and `--bottom-bar-h` to `tokens.css` under Density. The others can use existing `--divider` tokens.

---

## 2. Component Inventory

### 2.1 Existing primitives ✅

| Component | File | Notes |
|-----------|------|-------|
| `.sidebar__item` | `shell.css` | Solid base; covers default, hover, active, focus. |
| `.sidebar__item--child` | `shell.css` | Child indent + dot active state. |
| `.sidebar__item--parent` | `shell.css` | Flex split between link and chevron button. |
| `.sidebar__group` / `.sidebar__group-head` | `shell.css` | Collapsible section pattern. |
| `.nav-flyout` | `shell.css` | Positioned flyout panel. |
| `.brand-mark` | `shell.css` | Gradient + shadow treatment. |

### 2.2 Missing primitives

| Component | Spec | Priority |
|-----------|------|----------|
| `.bottom-bar` | Fixed bottom nav container, 56px, frosted glass, top border. | **P1 — Mobile** |
| `.bottom-bar__item` | Flex column, icon + label, active top border. | **P1 — Mobile** |
| `.bottom-sheet` | Fixed bottom sheet, 70vh, r:16px top, drag handle. | **P1 — Mobile** |
| `.fab` | 56px circle, `--accent` bg, `--shadow-md`, fixed position. | **P2 — Mobile** |
| `.flyout-group-header` | Non-interactive label inside flyout (10.5px uppercase). | **P2 — Rail** |

**Recommendation**: Add `.bottom-bar`, `.bottom-bar__item`, `.bottom-sheet` to `shell.css` (or `mobile.css` if the team prefers splitting). Add `.fab` to `shell.css` as a reusable atom.

---

## 3. CSS Architecture Review

### 3.1 Sidebar.jsx component structure

The JSX is well-structured:
- `PRIMARY_MODULES` array with `children[]` is clean and data-driven.
- `OPERATIONS`, `INSIGHTS`, `ADMINISTRATION` as separate arrays makes sense for tier-2 grouping.
- `NavGroup` component handles collapsible groups.
- `NavFlyout` handles hover-to-reveal.

### 3.2 Issues found

#### Issue A: Duplicate `className` prop on Pinned heading

```jsx
// Sidebar.jsx line 594-598
div
  data-coach="sidebar-pin"
  className="sidebar__heading"
  className="sidebar__heading--spaced"
```

**Impact**: React will only apply the second `className`. The first is silently dropped. If `sidebar__heading` provides base styles (font-size, color), they may be lost.

**Fix**: Merge into a single prop:
```jsx
className="sidebar__heading sidebar__heading--spaced"
```

#### Issue B: Flyout "More" dumps groups flat

```jsx
// Sidebar.jsx line 692-700
const flatItems = allTiered.flatMap((g) =>
  g.items.map((i) => ({ ...i, groupTitle: g.title }))
);
showFlyout(e.currentTarget, flatItems, null);
```

**Impact**: The 11 tier-2 items are rendered as a flat list with no visual grouping. This recreates the "wall of icons" problem in the collapsed rail.

**Fix**: Pass grouped data to `NavFlyout` and render group headers:
```jsx
<NavFlyout groups={[
  { title: "Operations", items: OPERATIONS },
  { title: "Insights", items: INSIGHTS },
  { title: "Administration", items: ADMINISTRATION }
]} />
```

Update `NavFlyout` to accept `groups` prop and render `.nav-flyout__group` headers.

#### Issue C: Mobile drawer is still a side drawer, not a bottom sheet

**Impact**: The acceptance criteria asks for a "mobile-specific navigation experience." A side drawer on a 375px phone steals 224px of horizontal space and feels like desktop ported to mobile.

**Fix**: Implement bottom tab bar + bottom sheet as specified in the UX Brief.

#### Issue D: No FAB on mobile

**Impact**: Common create actions (add student, add staff) require multiple taps through the drawer.

**Fix**: Add FAB on Dashboard, Students, and Staff screens.

#### Issue E: `--sidebar-w` vs `--sidebar-width` mismatch

`App.jsx` uses `var(--sidebar-width)` in Tailwind classes, but `tokens.css` defines `--sidebar-w`. `shell.css` also uses `--sidebar-w`.

**Impact**: If `--sidebar-width` is not defined, the `ml-[var(--sidebar-width)]` utility may resolve to `0px`.

**Fix**: Audit `index.css` `@theme inline` block and ensure `--sidebar-width` aliases `--sidebar-w`, or replace all usages with `--sidebar-w`.

---

## 4. Accessibility Audit

| Check | Status | Notes |
|-------|--------|-------|
| Semantic `<nav>` | ✅ | `<aside role="navigation" aria-label="Main navigation">` |
| `aria-expanded` on parents | ✅ | Present on chevron button. |
| `aria-controls` on parents | ✅ | Links to `nav-children-${id}`. |
| Focus rings | ✅ | `box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent)` |
| Mobile `Escape` to close | ✅ | Implemented. |
| `prefers-reduced-motion` | ⚠️ | Not explicitly handled for sidebar animations. Add `@media (prefers-reduced-motion: reduce)` to disable chevron rotation and flyout fade. |
| Bottom sheet a11y | ❌ | Not implemented yet. When added, needs `aria-modal="true"`, focus trap, and `role="dialog"`. |
| Flyout `role="menu"` | ⚠️ | Currently a plain `<div>`. Should use `role="menu"` with `role="menuitem"` children for screen readers. |

---

## 5. Responsive Audit

| Breakpoint | Current | Required | Gap |
|------------|---------|----------|-----|
| `< 768px` | Side drawer + hamburger | Bottom tab bar + bottom sheet | **Major** |
| `768px–1023px` | Collapsed rail + hamburger | Same (acceptable) | None |
| `≥ 1024px` | Expanded sidebar | Same (acceptable) | None |
| `≥ 1024px` zoomed / narrow window | Auto-collapse at 1024px | Same | ✅ |

---

## 6. Iconography Audit

| Icon | Modules used | Unique? | Action |
|------|--------------|---------|--------|
| `LayoutDashboard` | Dashboard | ✅ | — |
| `GraduationCap` | Students | ✅ | — |
| `Users` | Staff | ✅ | — |
| `Award` | Academics | ✅ | Changed from `BookOpen` |
| `BookOpen` | Classes | ✅ | — |
| `Calendar` | Calendar | ✅ | — |
| `MessageSquare` | Messaging | ✅ | — |
| `IndianRupee` | Fees | ✅ | — |
| `DoorOpen` | Front Desk | ✅ | — |
| `Library` | Library | ✅ | — |
| `Package` | Inventory | ✅ | — |
| `Building2` | Hostel | ✅ | — |
| `Bus` | Transport | ✅ | — |
| `FileBarChart` | Reports | ✅ | — |
| `BarChart3` | Analytics | ✅ | — |
| `Sparkles` | AI Assistant | ✅ | — |
| `FileText` | Intake Forms | ✅ | Changed from `ClipboardList` |
| `Database` | Data Tools | ✅ | — |
| `Palette` | Style Guide | ✅ | — |

**Result**: All top-level icons are now unique. ✅

---

## 7. Recommendations Summary

### Must-fix before QA (P1)

1. **Fix duplicate `className` on Pinned heading** (`Sidebar.jsx:594`).
2. **Fix flat flyout** — render grouped headers in the "More" flyout.
3. **Resolve `--sidebar-w` / `--sidebar-width` mismatch** in `App.jsx`.
4. **Add mobile bottom tab bar + bottom sheet** (new CSS + JSX).

### Should-fix before release (P2)

5. **Add FAB** on Dashboard/Students/Staff for mobile.
6. **Add `prefers-reduced-motion`** guard for all sidebar animations.
7. **Add flyout `role="menu"`** for screen readers.
8. **Add `--sidebar-mobile-w` and `--bottom-bar-h` tokens**.

### Nice-to-have (P3)

9. **Contextual sidebar** — when deep inside a module, surface its children at the top of the sidebar.
10. **Auto-pin frequently visited** pages based on local visit counts.
