# DK-598 — Sidebar Navigation Redesign: UX Brief

> Status: **In Review**  
> Designer: UI/Visual Designer  
> Date: 2026-05-29

---

## 1. Problem Statement (validated)

The legacy sidebar suffered from six critical UX failures:

1. **8-item hard limit** buried Attendance, Academics, Homework, Reports, Library, Front Desk behind an undifferentiated "More" bucket.
2. **Orphaned sub-routes** — `/students/attendance`, `/staffs/payroll`, etc. — had no visual parent; they were dumped flat.
3. **Collapsed rail was un-scannable** — 19 "More" items rendered as a wall of identical-sized icons; pinned pages showed only a colored dot with no icon/label.
4. **Duplicate icons** — BookOpen (Classes + Subjects), ClipboardList (Homework + Intake Forms), Users (Staff + PTM) created ambiguity when labels were hidden.
5. **Mobile = desktop dumped into a drawer** — no mobile-specific prioritization, no bottom tab bar, no quick-action FAB.
6. **Static global launcher** — the sidebar never adapted to the active module; it offered no contextual sub-navigation.

---

## 2. Proposed Information Architecture

### 2.1 Guiding principles

- **Progressive disclosure** — daily-use items are visible; secondary items are one click away inside a group.
- **Parent–child fidelity** — every sub-route lives under its semantic parent.
- **Icon uniqueness** — no Lucide icon is reused across two top-level modules.
- **Mobile-first priority** — bottom tabs get the 4 most frequent destinations; everything else is in a drawer or command palette.
- **Contextual adaptation** — when inside a deep module, the sidebar can surface module-specific shortcuts (Phase 2).

### 2.2 Module hierarchy

```
Workspace (always visible)
├── Dashboard
├── Students
│   ├── Attendance
│   ├── Form Submissions
│   ├── Promotion
│   └── Transfer Certificate
├── Staff
│   ├── Payroll
│   └── Bulk Subjects
├── Academics
│   ├── Exams
│   ├── Homework
│   ├── PTM
│   └── Timetable Wizard
├── Classes
├── Calendar
├── Messaging
└── Fees

Operations (collapsible group)
├── Front Desk
├── Library
├── Inventory
├── Hostel
└── Transport

Insights (collapsible group)
├── Reports
├── Analytics
└── AI Assistant

Administration (collapsible group)
├── Intake Forms
├── Data Tools
└── Style Guide

Pinned (user-defined, appears when ≥1 pin exists)

Footer (always visible)
├── Settings
└── User Menu
```

### 2.3 Rationale for ordering

| Position | Module | Rationale |
|----------|--------|-----------|
| 1 | Dashboard | Home anchor; expected first. |
| 2 | Students | Highest daily traffic (attendance, records). |
| 3 | Staff | Second-highest traffic; payroll is a weekly ritual. |
| 4 | Academics | Exams + Homework + PTM are weekly cycles. |
| 5 | Classes | Timetable viewing is daily. |
| 6 | Calendar | Schedule reference is daily. |
| 7 | Messaging | Chat + announcements; badge-driven. |
| 8 | Fees | Monthly cadence, but high urgency. |

Operations, Insights, and Administration are **tier-2** and start collapsed. They expand automatically when the active route lives inside them.

---

## 3. Iconography & Uniqueness Matrix

| Module | Icon | Lucide name | Notes |
|--------|------|-------------|-------|
| Dashboard | ◇ | `LayoutDashboard` | — |
| Students | 🎓 | `GraduationCap` | — |
| Staff | 👤 | `Users` | — |
| Academics | 🏆 | `Award` | Changed from `BookOpen` to avoid collision with Classes. |
| Classes | 📖 | `BookOpen` | — |
| Calendar | 📅 | `Calendar` | — |
| Messaging | 💬 | `MessageSquare` | — |
| Fees | ₹ | `IndianRupee` | — |
| Front Desk | 🚪 | `DoorOpen` | — |
| Library | 📚 | `Library` | — |
| Inventory | 📦 | `Package` | — |
| Hostel | 🏢 | `Building2` | — |
| Transport | 🚌 | `Bus` | — |
| Reports | 📊 | `FileBarChart` | — |
| Analytics | 📈 | `BarChart3` | — |
| AI Assistant | ✨ | `Sparkles` | — |
| Intake Forms | 📝 | `FileText` | Changed from `ClipboardList` to avoid collision with Homework. |
| Data Tools | 🗄️ | `Database` | — |
| Style Guide | 🎨 | `Palette` | — |
| Settings | ⚙️ | `Settings` | — |

**Child icons** are allowed to repeat parent semantics (e.g. `FileBarChart` under Academics for Exams) because they are always shown with a label.

---

## 4. Mobile Strategy

### 4.1 Bottom tab bar (primary)

On viewports `< 768px`, a **bottom tab bar** replaces the sidebar as the primary nav for the 4 most frequent destinations:

```
[Dashboard] [Students] [Calendar] [Messaging]
```

- **Height**: 56px (safe-area-inset-bottom aware).
- **Active state**: icon filled + label in `--accent`; 2px top border in `--accent`.
- **Badge**: red dot on Messaging when `unreadCount > 0`.
- **More**: a fifth "More" tab opens the full drawer for everything else.

### 4.2 Drawer (secondary)

- Swipe-up / tap "More" opens a **bottom sheet** (not a side drawer) on mobile.
- Sheet height: 70% viewport, scrollable.
- Contains the full hierarchy: Workspace modules → Operations → Insights → Administration → Pinned.
- Search bar is pinned to the top of the sheet.

### 4.3 Quick-action FAB

A floating action button (`+` icon) is visible on mobile **only on Dashboard, Students, and Staff** screens. It triggers the most common create action for that screen:
- Dashboard → Add student
- Students → Add student
- Staff → Add staff

- **Size**: 56px circle.
- **Color**: `--accent` background, `--accent-fg` icon.
- **Shadow**: `--shadow-md`.
- **Position**: bottom-right, 16px from edges, 72px from bottom (above tab bar).

---

## 5. Collapsed Rail Strategy

### 5.1 Rail width

`--sidebar-w-collapsed: 56px` (already in tokens).

### 5.2 Rail contents

- Brand mark (graduation-cap icon, no text).
- Primary module icons (8 items).
- Pinned items (if any).
- "More" trigger (`MoreHorizontal` icon) — hover opens a **grouped flyout**.
- Settings icon.
- User avatar.

### 5.3 Flyout behavior

**Hover delay**: 150ms enter, 200ms leave (already implemented).

**Flyout structure**: tier-2 groups must **not** be dumped flat. Instead:

```
┌─────────────────────────────┐
│  Operations          ▼      │  ← group header, non-interactive
│  Front Desk                   │
│  Library                      │
│  Inventory                    │
│  Hostel                       │
│  Transport                    │
│  ─────────────────────────    │
│  Insights            ▼      │
│  Reports                      │
│  Analytics                    │
│  AI Assistant                 │
│  ─────────────────────────    │
│  Administration      ▼      │
│  Intake Forms                 │
│  Data Tools                   │
│  Style Guide                  │
└─────────────────────────────┘
```

- Each group header is 10.5px uppercase, `--fg-faint`, non-interactive.
- Group body gap: 1px.
- Min-width: 180px.
- Background: `--surface` with `--shadow-flyout`.
- Active item: `--accent-bg` background, `--accent` left border inset.

---

## 6. States & Interactions

### 6.1 Default

- Background: transparent.
- Text: `--fg-muted`.
- Icon: `--fg-muted`, 15px, stroke-width 1.6.

### 6.2 Hover

- Background: `--surface-hover`.
- Text: `--fg`.
- Transition: 120ms ease.

### 6.3 Active (current route)

- Background: `--accent-bg`.
- Text: `--fg`, font-weight 520.
- Left inset border: 2px solid `--accent` (box-shadow inset).
- Transition: 120ms ease.

### 6.4 Expanded parent

- Parent row shows a chevron (`ChevronRight`) rotated 90°.
- Child list is visible below with 32px left indent.
- Child active state: 4px dot in `--accent` at left: 18px (instead of inset border).

### 6.5 Collapsed parent hover

- Flyout appears to the right of the icon.
- Flyout title = parent module name.
- Flyout items = children.

### 6.6 Focus-visible

- Box-shadow: `0 0 0 2px var(--bg), 0 0 0 4px var(--accent)`.
- For active item: combine inset border + focus ring.

---

## 7. Search Behavior

- Search input is visible **only on mobile** (below the brand bar) and **inside the mobile bottom-sheet drawer**.
- Desktop: rely on Command Palette (`/` or `⌘K`).
- Search filters all nav items (modules, children, groups) in real-time.
- When searching, all collapsible groups auto-expand.
- Empty state: "No pages match 'xyz'" in `--fg-faint`, 13px.

---

## 8. Accessibility Requirements

- Sidebar is `<aside role="navigation" aria-label="Main navigation">`.
- Every `<NavLink>` has an `aria-label` when collapsed (tooltip = label).
- Parent chevrons are `<button>` with `aria-expanded` and `aria-controls`.
- Group headers are `<button>` with `aria-expanded`.
- Flyout has `role="menu"` (or is a positioned `<div>` with roving tabindex).
- Keyboard: `Tab` moves through items; `Space`/`Enter` activates; `→` expands parent; `←` collapses.
- `Escape` closes mobile drawer / flyout.
- `prefers-reduced-motion`: disable chevron rotation and flyout fade.

---

## 9. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< 768px` | Sidebar hidden. Bottom tab bar + FAB + drawer. |
| `768px – 1023px` | Sidebar collapsed rail by default. Tap burger to expand. |
| `≥ 1024px` | Sidebar expanded by default. Collapse on manual toggle or zoom. |

---

## 10. Open Questions / Phase 2

1. **Contextual sidebar** — When inside `/students/*`, should the sidebar reorder to show Students children at the top? (Recommended: yes, with a "← Back to main nav" link.)
2. **Role-based filtering** — Should Operations/Insights/Administration be hidden based on RBAC? (Likely yes; needs permission matrix.)
3. **Analytics integration** — Can we auto-populate Pinned based on most-visited routes?
