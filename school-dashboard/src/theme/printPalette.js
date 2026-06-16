/**
 * ============================================================
 * Print / Export Palette — DS-15
 * ============================================================
 *
 * Single source of truth for hex colors used inside
 *   - print/export HTML templates (built as template literals
 *     and written into a new browser window via document.write
 *     or a Blob URL), and
 *   - the pre-React error page in main.jsx.
 *
 * Why this module exists
 * ----------------------
 * The audit found ~70 hex occurrences across 16 files. Most of
 * them live in print/export HTML where the template is detached
 * from the host document's CSS, so a CSS-variable indirection
 * would not work — the new window loads only the inline <style>
 * we ship with the template. Centralising the constants here
 * keeps every printable document visually consistent, makes a
 * future palette change a one-line edit, and gives downstream
 * callers (unit tests, storybook) a stable import surface.
 *
 * Scope (what belongs here)
 * -------------------------
 * - Background / surface / border / text colors used inside
 *   the printable HTML strings.
 * - Status-tinted colors (success / warn / danger) that appear
 *   on printed gate passes, payslips, and certificates.
 * - Shadow rgba used by the PrintPreviewModal chrome.
 *
 * What does NOT belong here
 * -------------------------
 * - Theme colors used in normal screen UI — those are already
 *   centralised in `theme/colors.js` (semantic tokens) and the
 *   `@theme` block in index.css. This file only covers the
 *   print/export world, which is deliberately decoupled from
 *   the design system tokens because printed documents must
 *   render identically on every device.
 * - The "primary / accent / brand" palette in `theme/colors.js`
 *   is for screen UI only. Print templates need print-safe
 *   neutrals (true black, true white, grays that print reliably
 *   on a monochrome printer) and these are not the same thing.
 *
 * The values below are the same ones that already appeared
 * inlined across the print templates; the migration is a pure
 * relocation — no visual change.
 */

const palette = {
  page: {
    background: '#ffffff',
    foreground: '#111827', // gray-900 — default body text
    muted: '#6b7280',      // gray-500 — meta / sub-text
    faint: '#9ca3af',      // gray-400 — axis / disclaimer text
    border: '#e5e7eb',     // gray-200 — table dividers
    borderStrong: '#374151', // gray-700 — table headers
  },

  // Alternating row backgrounds inside printable tables.
  row: {
    headBg: '#f3f4f6',     // gray-100 — thead background
    altBg: '#f9fafb',      // gray-50 — even-row stripe
    altBgSoft: '#fafafa',  // neutral-50 — softer stripe variant
  },

  // Surface tints for "box" / "card" sections on payslips, etc.
  surface: {
    base: '#f9fafb',       // gray-50 — pale card background
    box: '#f3f4f6',        // gray-100 — section header bg
  },

  // Status colors. Mirrors the semantic tokens in theme/colors.js
  // (so a paid payslip badge looks the same on screen and on paper)
  // but expressed in hex so the print template can use them.
  status: {
    successBg: '#f0fdf4',  // green-50
    successBorder: '#bbf7d0', // green-200
    successText: '#166534',   // green-800
    success: '#22c55e',       // green-500
    warn: '#f59e0b',          // amber-500
    warnBg: '#FEF3C7',        // amber-100
    warnText: '#92400E',      // amber-800
    danger: '#ef4444',        // red-500
    dangerBg: '#fef2f2',      // red-50
    dangerText: '#b91c1c',    // red-700
    info: '#3b82f6',          // blue-500
  },

  // Neutral text shades for body / labels / muted text inside
  // printable documents. Same scale as the neutral ramp in
  // theme/colors.js so screen and print look the same.
  text: {
    body: '#111827',          // gray-900 — body
    secondary: '#4b5563',     // gray-600 — secondary body
    label: '#374151',         // gray-700 — section labels
    caption: '#6b7280',       // gray-500 — captions
    disabled: '#9ca3af',      // gray-400 — disabled / faint
    inverse: '#ffffff',       // on dark backgrounds
  },

  // Borders & rules. The certificate modal uses #333 for a heavier
  // border; that lives here so it is still centrally swappable.
  border: {
    default: '#e5e7eb',       // gray-200
    strong: '#374151',        // gray-700
    heavy: '#333333',         // certificate frame (dark gray)
    black: '#000000',
  },

  // Inverse / dark surfaces (used by payslip "net salary" block).
  inverse: {
    background: '#111111',    // near-black
    foreground: '#ffffff',
  },

  // Card / container backgrounds. Kept separate from `surface`
  // because they semantically mean "container", not "surface tint".
  card: {
    base: '#ffffff',
    previewFrame: '#ffffff',
  },

  // Shadows — rgba strings, only used by chrome (PrintPreviewModal)
  // and the pre-React error page in main.jsx.
  shadow: {
    soft: 'rgba(0,0,0,0.08)',
    medium: 'rgba(0,0,0,0.18)',
  },

  // The two true colors used by every printable document regardless
  // of theme: pure white paper, pure black ink. These should never
  // change and are kept as named constants for clarity.
  ink: {
    paper: '#ffffff',
    black: '#000000',
  },
};

export const printPalette = palette;

// Convenience named re-exports for the most common values. The full
// object is also exported (`printPalette`) so callers can opt in to
// the namespaced form when they want to be explicit.
export const PRINT_PALETTE = palette;

// Shorthand aliases for the high-frequency colors so call sites
// stay readable (`background: bg.paper` vs `background: '#fff'`).
export const bg = {
  paper: palette.ink.paper,
  base: palette.surface.base,
  box: palette.surface.box,
  altRow: palette.row.altBg,
  altRowSoft: palette.row.altBgSoft,
  head: palette.row.headBg,
  inverse: palette.inverse.background,
};

export const fg = {
  body: palette.text.body,
  secondary: palette.text.secondary,
  label: palette.text.label,
  caption: palette.text.caption,
  disabled: palette.text.disabled,
  muted: palette.page.muted,
  faint: palette.page.faint,
  inverse: palette.inverse.foreground,
  black: palette.ink.black,
};

export const border = {
  default: palette.border.default,
  strong: palette.border.strong,
  heavy: palette.border.heavy,
  black: palette.border.black,
};

export const status = {
  ok: palette.status.success,
  okBg: palette.status.successBg,
  okBorder: palette.status.successBorder,
  okText: palette.status.successText,
  warn: palette.status.warn,
  warnBg: palette.status.warnBg,
  warnText: palette.status.warnText,
  danger: palette.status.danger,
  dangerBg: palette.status.dangerBg,
  dangerText: palette.status.dangerText,
  info: palette.status.info,
};

export const shadow = {
  soft: palette.shadow.soft,
  medium: palette.shadow.medium,
};
