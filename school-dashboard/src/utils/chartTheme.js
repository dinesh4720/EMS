import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { chartSeries, chartStatus } from '../theme/colors';

/**
 * Chart color palette — single source of truth for all Recharts callsites.
 *
 * Aligned with the design-system `chartSeries` palette in theme/colors.js
 * (which mirrors the --chart-c1..c5 CSS variables in styles/tokens.css).
 *
 * Usage:
 *   import { CHART_COLORS } from '../../utils/chartTheme';
 *   <Bar fill={CHART_COLORS.chart1} />
 *   <Area stroke={CHART_COLORS.chart2} />
 */
export const CHART_COLORS = {
  chart1: chartSeries[0], // indigo (accent) — primary series
  chart2: chartSeries[1], // blue              — secondary series
  chart3: chartSeries[2], // green             — collected / positive
  chart4: chartSeries[3], // amber             — pending / warning
  chart5: chartSeries[4], // magenta           — fifth series

  // Status-tinted aliases for charts whose series correspond to a status
  // (paid/pending/overdue, present/absent, etc.).
  ok: chartStatus.ok,
  warn: chartStatus.warn,
  danger: chartStatus.danger,
  info: chartStatus.info,
  accent: chartStatus.accent,

  // Legacy aliases — kept so existing callsites keep compiling. Prefer
  // chart1..chart5 for new code.
  neutral: 'oklch(60% 0.005 270)',
  neutralLight: 'oklch(94% 0.005 270)',
  blue: chartSeries[1],
  primary: chartSeries[0],
};

/**
 * Hook that returns dark-mode-aware tokens for Recharts chrome (grid,
 * axis, tick, cursor, legend). Series colors come from CHART_COLORS.
 *
 * Grid / tick / tooltip colors resolve through CSS variables so they
 * stay in sync with the design-system token sheet automatically.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return useMemo(() => ({
    isDark,
    // CartesianGrid stroke — resolved via design-system token
    grid: 'var(--chart-grid)',
    gridAlt: isDark ? 'oklch(32% 0.005 270)' : 'oklch(91% 0.005 270)',
    // Axis tick fill — resolved via design-system token
    tick: 'var(--chart-axis)',
    // Axis stroke
    axis: isDark ? 'oklch(45% 0.005 270)' : 'oklch(72% 0.005 270)',
    // Tooltip content style object — uses CSS variables so it themes
    // correctly with the rest of the chrome.
    tooltipStyle: {
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-md)',
      color: 'var(--fg)',
      fontSize: 'var(--fs-12)',
    },
    tooltipItemStyle: {
      color: 'var(--fg-muted)',
    },
    tooltipLabelStyle: {
      color: 'var(--fg-subtle)',
      fontWeight: 520,
    },
    // Cursor fill for bar charts
    cursorFill: isDark ? 'oklch(100% 0 0 / 0.04)' : 'oklch(0% 0 0 / 0.04)',
    // Legend text color
    legendColor: 'var(--fg-muted)',
  }), [isDark]);
}
