# DK-598 — Sidebar Wireframes & Component Specs

> Status: **Design Hand-off**  
> Designer: UI/Visual Designer  
> Date: 2026-05-29

---

## 1. Expanded Sidebar (Desktop ≥ 1024px)

### 1.1 Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Width | 224px | `--sidebar-w` |
| Padding | 12px | `--sp-3` |
| Gap between items | 1px | — |
| Border-right | 1px solid `--border` | — |
| Background | `--surface-2` | — |

### 1.2 Brand bar

```
┌─────────────────────────────┐  ← sidebar top
│  ┌───┐ SchoolName            │  ← brand-mark (26×26px, r:7px) + brand-name (13px, fw:600)
│  │ 🎓│ 2025-26               │  ← brand-sub (10.5px, --fg-subtle)
│  └───┘                       │
├─────────────────────────────┤  ← border-bottom: 1px solid --divider
```

- Brand mark background: `linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)`.
- Brand mark shadow: `0 2px 8px -2px color-mix(in oklab, var(--accent) 40%, transparent), inset 0 -1px 0 rgba(0,0,0,0.15)`.
- Padding: `6px 8px 12px`.
- Margin-bottom: `8px`.

### 1.3 Workspace section

```
┌─────────────────────────────┐
│  WORKSPACE                   │  ← sidebar__heading (10.5px, uppercase, --fg-faint, ls:0.06em)
│  ┌─────────────────────────┐│
│  │ ◇ Dashboard             ││  ← sidebar__item (h:28px, r:6px, 13px, --fg-muted)
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🎓 Students      ▶      ││  ← parent module; chevron 20×20px, r:4px
│  └─────────────────────────┘│
│    ● Attendance             │  ← sidebar__item--child (h:26px, pl:32px, 12px)
│    ● Form Submissions       │
│    ● Promotion              │
│    ● Transfer Certificate   │
│  ┌─────────────────────────┐│
│  │ 👤 Staff         ▶      ││
│  └─────────────────────────┘│
│    ● Payroll                │
│    ● Bulk Subjects          │
│  ┌─────────────────────────┐│
│  │ 🏆 Academics     ▶      ││
│  └─────────────────────────┘│
│    ● Exams                  │
│    ● Homework               │
│    ● PTM                    │
│    ● Timetable Wizard       │
│  ┌─────────────────────────┐│
│  │ 📖 Classes              ││  ← simple item (no children)
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 📅 Calendar             ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 💬 Messaging       3    ││  ← badge: --surface-2, 10.5px mono, r:999px, border
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ ₹ Fees                  ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

#### Item spec (default)

```css
.sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  height: 28px;
  border-radius: 6px;
  color: var(--fg-muted);
  font-size: 13px;
  font-weight: 460;
  transition: background 120ms, color 120ms;
}
```

#### Item spec (active)

```css
.sidebar__item.is-active {
  background: var(--accent-bg);
  color: var(--fg);
  font-weight: 520;
  box-shadow: inset 2px 0 0 var(--accent);
}
```

#### Child item spec (active)

```css
.sidebar__item--child.is-active {
  background: var(--accent-bg);
  color: var(--fg);
  font-weight: 520;
  box-shadow: none;
}
.sidebar__item--child.is-active::before {
  content: "";
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--accent);
}
```

#### Chevron spec

- Size: 20×20px container, 14px icon.
- Rotation: 0° → 90° on expand.
- Transition: `transform 150ms`.

### 1.4 Collapsible groups

```
┌─────────────────────────────┐
│  OPERATIONS            ▶    │  ← sidebar__group-head (h:28px, 10.5px, uppercase, --fg-faint)
├─────────────────────────────┤  ← when expanded
│  🚪 Front Desk              │
│  📚 Library                 │
│  📦 Inventory               │
│  🏢 Hostel                  │
│  🚌 Transport               │
├─────────────────────────────┤
│  INSIGHTS              ▶    │
├─────────────────────────────┤
│  ADMINISTRATION        ▶    │
└─────────────────────────────┘
```

- Group header hover: `background: var(--surface-hover); color: var(--fg-muted);`
- Auto-expand when active route is inside the group.

### 1.5 Pinned section

```
┌─────────────────────────────┐
│  PINNED                      │  ← sidebar__heading--spaced (margin-top: var(--sp-4))
│  ┌─────────────────────────┐│
│  │ 📊 My Report            ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 🎓 Class 3-A            ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

- Pinned items use the same `.sidebar__item` styling.
- If a pinned page has no known icon, render a 6px dot in `--info` instead of an icon.

### 1.6 Footer

```
┌─────────────────────────────┐
├─────────────────────────────┤  ← border-top: 1px solid --divider; padding-top: 8px
│  ⚙️ Settings                │
│  ┌───┐ User Name            │  ← avatar (28×28px, r:999px) + name (13px)
│  │ 👤│ user@school.in       │  ← email (11.5px, --fg-subtle)
│  └───┘                      │
└─────────────────────────────┘
```

---

## 2. Collapsed Rail (Desktop 768px–1023px or manual toggle)

### 2.1 Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Width | 56px | `--sidebar-w-collapsed` |
| Padding | 8px | `--sp-2` |
| Item size | 36×36px | — |
| Border-radius | 6px | `--r-md` |

### 2.2 Rail layout

```
┌─────┐
│ 🎓  │  ← brand-mark only (26×26px, centered)
├─────┤
│ ◇   │
│ 🎓  │
│ 👤  │
│ 🏆  │
│ 📖  │
│ 📅  │
│ 💬  │  ← badge: corner dot + count chip (top:4px, right:4px)
│ ₹   │
├─────┤
│ 📊  │  ← pinned (if any)
├─────┤
│ ⋯   │  ← "More" trigger (36×36px, hover → flyout)
├─────┤
│ ⚙️  │
│ 👤  │  ← user avatar only
└─────┘
```

### 2.3 Flyout (hover on parent with children)

```
     ┌────────────────────┐
     │ Students           │  ← nav-flyout__title (10.5px, uppercase, --fg-faint)
     │ ● Attendance       │  ← nav-flyout__item (h:28px, r:6px, 13px)
     │ ● Form Submissions │
     │ ● Promotion        │
     │ ● Transfer Certif… │
     └────────────────────┘
```

- Position: fixed, `left: calc(var(--sidebar-w-collapsed) + 4px)`.
- Background: `--surface`, border: 1px solid `--border`, r:8px.
- Shadow: `--shadow-flyout`.
- Min-width: 180px.
- Active item: `--accent-bg` background.

### 2.4 Flyout (hover on "More")

```
     ┌────────────────────┐
     │ Operations         │
     │ 🚪 Front Desk      │
     │ 📚 Library         │
     │ 📦 Inventory       │
     │ 🏢 Hostel          │
     │ 🚌 Transport       │
     ├────────────────────┤
     │ Insights           │
     │ 📊 Reports         │
     │ 📈 Analytics       │
     │ ✨ AI Assistant    │
     ├────────────────────┤
     │ Administration     │
     │ 📝 Intake Forms    │
     │ 🗄️ Data Tools      │
     │ 🎨 Style Guide     │
     └────────────────────┘
```

- Group titles are non-interactive, 10.5px uppercase, `--fg-faint`.
- Divider between groups: 1px solid `--divider`.

---

## 3. Mobile (< 768px)

### 3.1 Bottom tab bar

```
┌─────────────────────────────────────┐
│  ◇      🎓      📅      💬      ⋯  │
│ Dash  Students Calendar  Msg  More │
└─────────────────────────────────────┘
```

- Height: 56px + `env(safe-area-inset-bottom)`.
- Background: `--surface` with `border-top: 1px solid --border`.
- Backdrop-filter: `saturate(180%) blur(20px)` (frosted chrome).
- Active tab: icon color `--accent`, label `--accent`, 2px top border in `--accent`.
- Inactive: icon `--fg-muted`, label `--fg-faint`.
- Font: 10.5px, fw:500.
- Badge: 16×16px red circle (`--accent`) on Messaging icon, white text, 10px mono.

### 3.2 "More" bottom sheet

- Triggered by "More" tab or swipe-up gesture.
- Height: 70vh, max-height 560px.
- Background: `--surface`, border-radius: 16px 16px 0 0.
- Drag handle: 36×4px, r:2px, `--fg-faint`, centered at top.
- Content: full nav hierarchy + search bar pinned at top.
- Close: tap scrim, drag down, or tap X.

### 3.3 FAB (quick action)

- Visible on Dashboard, Students, Staff.
- Size: 56px circle.
- Background: `--accent`, icon: `--accent-fg`.
- Shadow: `--shadow-md`.
- Position: `right: 16px; bottom: calc(16px + 56px + env(safe-area-inset-bottom));`
- Tap: opens native create menu (bottom sheet with options).

### 3.4 Mobile drawer (legacy fallback)

If bottom sheet is not implemented in this phase, the existing side drawer is acceptable with these adjustments:
- Width: 280px (not full 224px; wider for touch).
- Item height: 44px (cozy tap target).
- Child indent: 40px.
- Search input is always visible at top.

---

## 4. Animation Specs

| Interaction | Duration | Easing | Property |
|-------------|----------|--------|----------|
| Hover background | 120ms | ease | background, color |
| Chevron rotate | 150ms | ease | transform |
| Flyout fade | 120ms | ease-out | opacity |
| Flyout slide | 150ms | ease-out | transform (translateX -4px → 0) |
| Mobile drawer | 200ms | cubic-bezier(0.32, 0.72, 0, 1) | transform |
| Bottom sheet | 300ms | cubic-bezier(0.32, 0.72, 0, 1) | transform |
| Sidebar collapse/expand | 200ms | ease | width |

`prefers-reduced-motion`: all durations → 0ms, opacity only.

---

## 5. Edge Cases

### 5.1 Long school name

- Brand name: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 164px;`

### 5.2 Long page label

- All labels: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`

### 5.3 Many pinned pages

- Pinned section scrolls independently within the nav scroll area.
- Max pinned: 10 (arbitrary sanity limit; enforced by utility).

### 5.4 No pinned pages

- "Pinned" heading and section are hidden entirely.

### 5.5 Deep linking

- On direct load of `/students/attendance`, the Students parent must be auto-expanded and Attendance child marked active.
- Operations/Insights/Administration must auto-expand if the active route lives inside.
