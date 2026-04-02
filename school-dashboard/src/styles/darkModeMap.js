/**
 * Dark Mode Color Mapping Reference
 *
 * Use this as a guide when adding dark: variants to components.
 * Pattern: light class -> dark: equivalent
 *
 * Import and reference this map when converting components to support dark mode.
 */

const darkModeMap = {
  // Backgrounds
  'bg-white':      'dark:bg-zinc-950',   // #0a0a0a  — page-level background
  'bg-white-card': 'dark:bg-zinc-900',   // #18181b  — elevated cards/surfaces (MinimalCard, StatCard, ConfirmDialog)
  'bg-gray-50':    'dark:bg-zinc-900',   // #18181b
  'bg-gray-100':   'dark:bg-zinc-800',   // #27272a (was #3f3f46, corrected)
  'bg-gray-200':   'dark:bg-zinc-700',   // #3f3f46

  // Text
  'text-gray-900': 'dark:text-zinc-100', // #f4f4f5
  'text-gray-800': 'dark:text-zinc-200', // #e4e4e7
  'text-gray-700': 'dark:text-zinc-300', // #d4d4d8
  'text-gray-600': 'dark:text-zinc-400', // #a1a1aa
  'text-gray-500': 'dark:text-zinc-500', // #71717a
  'text-gray-400': 'dark:text-zinc-600', // #52525b

  // Borders
  'border-gray-100': 'dark:border-zinc-800', // #27272a
  'border-gray-200': 'dark:border-zinc-800', // #27272a
  'border-gray-300': 'dark:border-zinc-700', // #3f3f46

  // Surfaces (CSS variable driven)
  'bg-surface':       'var(--color-surface)',       // light: n/a, dark: #18181b
  'bg-surface-hover':  'var(--color-surface-hover)', // light: n/a, dark: #27272a

  // Dividers
  'divide-gray-100': 'dark:divide-zinc-800',
  'divide-gray-200': 'dark:divide-zinc-800',
};

export default darkModeMap;
