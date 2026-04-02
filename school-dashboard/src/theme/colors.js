/**
 * ============================================================
 * SINGLE SOURCE OF TRUTH — Consolidated Color System
 * ============================================================
 *
 * All color values for the EMS dashboard are defined here.
 * This file is consumed by:
 *   - heroui.js        → HeroUI component theme
 *   - index.css @theme → CSS custom properties & Tailwind utilities
 *   - JS/JSX           → Inline styles (charts, toasts, print layouts)
 *
 * IMPORTANT: When changing colors here, also update the
 * matching CSS variables in index.css @theme block.
 * The CSS @theme block cannot import JS, so they must stay in sync.
 *
 * TODO (AUDIT-176): Three color systems coexist in the dashboard:
 *   1. CSS custom properties (@theme / html.dark) — used by MinimalButton
 *   2. Tailwind utility classes (gray-*, zinc-*) — used by most components
 *   3. HeroUI semantic tokens (primary, danger, etc.) — used by HeroUI components
 * This creates maintenance burden: a color change may need updates in all three.
 * Long-term fix: migrate all custom components to CSS custom properties
 * (approach #1) so this file truly becomes the single source of truth.
 * ============================================================
 */

// --- Neutral / Gray Scale (maps to Tailwind neutral palette) ---
export const neutral = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
};

// --- Semantic Colors ---
export const primary = {
  DEFAULT: '#374151',   // gray-700 — main action buttons, primary UI
  hover: '#1f2937',     // gray-800
  foreground: '#ffffff',
};

export const accent = {
  DEFAULT: '#0d9488',   // teal-600
  hover: '#0f766e',     // teal-700
};

export const success = {
  DEFAULT: '#22c55e',   // green-500
  light: '#f0fdf4',     // green-50
  dark: '#15803d',      // green-700
  foreground: '#ffffff',
};

export const error = {
  DEFAULT: '#ef4444',   // red-500
  light: '#fef2f2',     // red-50
  dark: '#b91c1c',      // red-700
  foreground: '#ffffff',
};

export const warning = {
  DEFAULT: '#f59e0b',   // amber-500
  light: '#FEF3C7',     // amber-100
  dark: '#92400E',      // amber-800
  foreground: '#ffffff',
};

export const info = {
  DEFAULT: '#3b82f6',   // blue-500
  light: '#eff6ff',     // blue-50
  dark: '#1d4ed8',      // blue-700
  foreground: '#ffffff',
};

// --- Background & Surface ---
export const background = {
  DEFAULT: '#ffffff',
  secondary: '#fafafa',  // gray-50
  tertiary: '#f5f5f5',   // gray-100
  dark: '#09090b',       // zinc-950 (dark mode)
};

// --- Border ---
export const border = {
  DEFAULT: '#f0f0f0',
  strong: '#e5e5e5',     // gray-200
};

// --- Text ---
export const text = {
  primary: '#171717',    // gray-950
  secondary: '#525252',  // gray-600
  muted: '#737373',      // gray-500 (WCAG AA 4.5:1 on white)
  light: '#d4d4d4',      // gray-300
};

// --- Toast / Notification ---
export const toast = {
  background: '#363636',
  foreground: '#ffffff',
  successIcon: '#10b981',  // emerald-500
  errorIcon: '#ef4444',    // red-500
  undoButton: '#10b981',   // emerald-500
};

// --- Chart Colors ---
export const chart = {
  purple: '#8b5cf6',      // violet-500 (students)
  pink: '#ec4899',        // pink-500 (staff)
  green: '#10b981',       // emerald-500 (excellent/collected)
  blue: '#3b82f6',        // blue-500 (good/academic)
  amber: '#f59e0b',       // amber-500 (average/pending)
  red: '#ef4444',         // red-500 (poor)
  gray: '#6b7280',        // gray-500 (neutral/default)
  teal: '#14b8a6',        // teal-500 (sent/delivered)
  lightRed: '#f87171',    // red-400 (failed)
  darkGray: '#374151',    // gray-700 (primary bar)
  gridLine: '#f3f4f6',    // gray-100 (grid lines)
  axisText: '#9ca3af',    // gray-400 (axis tick labels)
  axisLine: '#71717a',    // zinc-500 (axis stroke)
  tooltipBorder: '#e5e7eb', // gray-200 (tooltip borders)
  areaFill: '#e5e7eb',    // gray-200 (area/fill background)
  // Pie chart gray scale (active → inactive)
  pieGray1: '#6b7280',    // gray-500
  pieGray2: '#9ca3af',    // gray-400
  pieGray3: '#d1d5db',    // gray-300
  pieGray4: '#e5e7eb',    // gray-200
};

// --- Layout ---
export const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
};

// --- Dark Mode Overrides ---
// Keep in sync with index.css html.dark {} overrides.
export const dark = {
  background: '#0a0a0a',        // zinc-950
  foreground: '#fafafa',         // neutral-50
  primary: {
    DEFAULT: '#d4d4d4',          // neutral-300
    hover: '#e5e5e5',            // neutral-200
    foreground: '#171717',       // neutral-900
  },
  accent: {
    DEFAULT: '#2dd4bf',          // teal-400
    hover: '#5eead4',            // teal-300
  },
  success: {
    DEFAULT: '#4ade80',          // green-400
    light: '#052e16',            // green-950
    dark: '#86efac',             // green-300
  },
  error: {
    DEFAULT: '#f87171',          // red-400
    light: '#450a0a',            // red-950
    dark: '#fca5a5',             // red-300
  },
  warning: {
    DEFAULT: '#fbbf24',          // amber-400
    light: '#451a03',            // amber-950
    dark: '#fcd34d',             // amber-300
  },
  info: {
    DEFAULT: '#60a5fa',          // blue-400
    light: '#172554',            // blue-950
    dark: '#93c5fd',             // blue-300
  },
  bg: {
    DEFAULT: '#0a0a0a',          // zinc-950
    secondary: '#171717',        // neutral-900
    tertiary: '#262626',         // neutral-800
  },
  border: {
    DEFAULT: '#262626',          // neutral-800
    strong: '#404040',           // neutral-700
  },
  text: {
    primary: '#fafafa',          // neutral-50
    secondary: '#a3a3a3',        // neutral-400
    muted: '#737373',            // neutral-500
    light: '#404040',            // neutral-700
  },
  chart: {
    purple: '#a78bfa',           // violet-400
    pink: '#f472b6',             // pink-400
    green: '#34d399',            // emerald-400
    blue: '#60a5fa',             // blue-400
    amber: '#fbbf24',            // amber-400
    red: '#f87171',              // red-400
    gray: '#9ca3af',             // gray-400
    gridLine: '#262626',         // neutral-800
    axisText: '#6b7280',         // gray-500
  },
};
