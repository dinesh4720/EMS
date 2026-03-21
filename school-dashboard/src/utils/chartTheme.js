import { useTheme } from 'next-themes';
import { useMemo } from 'react';

/**
 * Hook that returns dark-mode-aware colors for Recharts components.
 * Usage:
 *   const chart = useChartTheme();
 *   <CartesianGrid stroke={chart.grid} />
 *   <XAxis tick={{ fill: chart.tick, fontSize: 11 }} />
 *   <Tooltip contentStyle={chart.tooltipStyle} />
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return useMemo(() => ({
    isDark,
    // CartesianGrid stroke
    grid: isDark ? '#27272a' : '#f3f4f6',         // zinc-800 / gray-100
    gridAlt: isDark ? '#27272a' : '#e5e7eb',       // zinc-800 / gray-200
    // Axis tick fill
    tick: isDark ? '#a1a1aa' : '#9ca3af',          // zinc-400 / gray-400
    // Axis stroke (for XAxis/YAxis stroke prop)
    axis: isDark ? '#a1a1aa' : '#71717a',          // zinc-400 / zinc-500
    // Tooltip content style object (for Recharts Tooltip contentStyle)
    tooltipStyle: {
      backgroundColor: isDark ? '#09090b' : '#ffffff',
      border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
      borderRadius: '8px',
      boxShadow: isDark
        ? '0 4px 6px -1px rgb(0 0 0 / 0.3)'
        : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      color: isDark ? '#fafafa' : '#111827',
    },
    // Tooltip item style
    tooltipItemStyle: {
      color: isDark ? '#d4d4d8' : '#374151',       // zinc-300 / gray-700
    },
    // Tooltip label style
    tooltipLabelStyle: {
      color: isDark ? '#a1a1aa' : '#6b7280',       // zinc-400 / gray-500
    },
    // Cursor fill for bar charts
    cursorFill: isDark ? 'rgba(63,63,70,0.3)' : 'rgba(0,0,0,0.05)',
    // Legend text color
    legendColor: isDark ? '#d4d4d8' : '#374151',   // zinc-300 / gray-700
  }), [isDark]);
}
