import { useTheme } from 'next-themes';
import { useMemo } from 'react';

/**
 * Chart color palette — CSS-04
 * Single source of truth for all Recharts fill/stroke colors.
 * These match the --color-chart-* tokens in index.css @theme.
 *
 * Usage in components:
 *   import { CHART_COLORS } from '../../utils/chartTheme';
 *   <Bar fill={CHART_COLORS.neutral} />
 *   <Area stroke={CHART_COLORS.chart1} />
 */
export const CHART_COLORS = {
  chart1:       '#8b5cf6',   // violet-500  — students / primary series
  chart2:       '#ec4899',   // pink-500    — staff / secondary series
  chart3:       '#10b981',   // emerald-500 — collected / positive
  chart4:       '#f59e0b',   // amber-500   — pending / warning
  neutral:      '#6b7280',   // gray-500    — neutral bars
  neutralLight: '#e5e7eb',   // gray-200    — area fill for neutral charts
  blue:         '#3b82f6',   // blue-500    — secondary metric
  primary:      '#374151',   // gray-700    — primary metric (dark)
};

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
