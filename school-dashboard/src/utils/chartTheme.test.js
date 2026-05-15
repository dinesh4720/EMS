import { describe, it, expect } from 'vitest';
import { CHART_COLORS } from './chartTheme';

/**
 * chartTheme.js exports CHART_COLORS (a plain object) and useChartTheme (a React hook).
 * useChartTheme depends on next-themes and React, so we test it separately.
 * Here we validate the static CHART_COLORS constant thoroughly.
 */

describe('CHART_COLORS', () => {
  const CSS_COLOR_REGEX = /^(#[0-9a-fA-F]{6}|oklch\(.+\))$/;

  it.each([
    'chart1',
    'chart2',
    'chart3',
    'chart4',
    'chart5',
    'ok',
    'warn',
    'danger',
    'info',
    'accent',
    'neutral',
    'neutralLight',
    'blue',
    'primary',
  ])('exports %s as a valid CSS color token', key => {
    expect(CHART_COLORS[key]).toMatch(CSS_COLOR_REGEX);
  });

  it('contains the expected series, status, and legacy aliases', () => {
    expect(Object.keys(CHART_COLORS).sort()).toEqual([
      'accent',
      'blue',
      'chart1',
      'chart2',
      'chart3',
      'chart4',
      'chart5',
      'danger',
      'info',
      'neutral',
      'neutralLight',
      'ok',
      'primary',
      'warn',
    ]);
  });

  it('keeps legacy aliases mapped to their current series colors', () => {
    expect(CHART_COLORS.primary).toBe(CHART_COLORS.chart1);
    expect(CHART_COLORS.blue).toBe(CHART_COLORS.chart2);
  });

  it('keeps primary chart series colors unique', () => {
    const values = [
      CHART_COLORS.chart1,
      CHART_COLORS.chart2,
      CHART_COLORS.chart3,
      CHART_COLORS.chart4,
      CHART_COLORS.chart5,
    ].map(v => v.toLowerCase());
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
