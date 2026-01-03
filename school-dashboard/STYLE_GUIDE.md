# Design Style Guide - Clean Modern Aesthetic (Inspired by ElevenLabs)

This style guide defines the visual language to be used in the application, specifically focusing on the sidebar and navigation elements. The design prioritizes cleanliness, minimalism, and focus on content.

## 1. Layout & Structure
- **Sidebar Width**: Fixed width of `260px` in expanded state.
- **Padding**: Uniform horizontal padding (`px-3` or `px-4`) for navigation items.
- **Vertical Rhythm**: 
  - Standard Item Height: `40px` to `44px`.
  - Section Spacing: `24px` to `32px` vertical gap between groups.
  - Item Gap: `2px` to `4px` vertical gap between adjacent items.

## 2. Typography
- **Font Family**: Inter (or system sans-serif).
- **Weights**:
  - Regular (400): Secondary text, inactive links.
  - Medium (500): Active links, Headers, Primary actions.
  - Semibold (600): Section Headers (subtle).
- **Sizes**:
  - **Main Links**: `14px` (0.875rem).
  - **Section Headers**: `12px` or `13px`, often uppercase or subtle.
  - **Profile/Footer**: `13px` to `14px`.

## 3. Color Palette
### Light Mode
- **Background**: `#FFFFFF` (White) or very subtle off-white `#FAFAFA`.
- **Primary Text**: `#111827` (Gray-900).
- **Secondary Text**: `#6B7280` (Gray-500).
- **Active Item Background**: `#F3F4F6` (Gray-100) or `#F9FAFB`.
- **Hover Item Background**: `#F9FAFB` (Gray-50) or `#F3F4F6`.
- **Border**: `#E5E7EB` (Gray-200).

### Dark Mode
- **Background**: `#09090B` (Zinc-950) or `#000000`.
- **Primary Text**: `#F9FAFB` (Gray-50).
- **Secondary Text**: `#A1A1AA` (Zinc-400).
- **Active Item Background**: `#27272A` (Zinc-800).
- **Hover Item Background**: `#18181B` (Zinc-900).
- **Border**: `#27272A` (Zinc-800).

## 4. Components & Interactions
### Navigation Item
- **Structure**: `[Icon] - [Gap: 10px] - [Label] - [Spacer] - [Badge/RightIcon]`.
- **Icon Size**: `18px` to `20px`. Stroke width: `2px` (standard) or `1.5px` (refined).
- **Border Radius**: `6px` or `8px` (slightly rounded standard) or `12px` (modern soft).
- **State Changes**:
  - **Idle**: Transparent background, Gray-500 text/icon.
  - **Hover**: Light Gray background, Gray-900 text.
  - **Active**: Slightly Darker Gray background, Gray-900 text (Medium weight).

### Section Header
- **Style**: Subtle, small text. often Uppercase or just muted plain text.
- **Color**: Gray-400/Gray-500.
- **Margin**: Bottom margin of `8px`.

### Badges / Tags
- **Appearance**: Pill-shaped, small font (`10px` or `11px`).
- **Styles**:
  - *New*: Light gray bg with dark text, or soft accent color.
  - *Beta*: Standard gray pill.

### Footer / Profile
- **Placement**: Pinned to bottom.
- **Content**: User Avatar + Name (Stacked or Inline) + Workspace Selector/Settings.
- **Upgrade CTA**: Prominent, potentially gradient or distinct border, often placed above the profile.

## 5. Visual Effects
- **Shadows**: Minimal to none. Flat design is preferred.
- **Borders**: Subtle 1px borders for separation (Right border for sidebar).
- **Transitions**: Fast (`150ms` - `200ms`), ease-out.

---
**Implementation Rule**: Avoid heavy colors. Use whitespace and typography hierarchy to organize content.
