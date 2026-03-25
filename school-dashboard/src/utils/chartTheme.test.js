import { describe, it, expect } from 'vitest';
import { CHART_COLORS } from './chartTheme';

/**
 * chartTheme.js exports CHART_COLORS (a plain object) and useChartTheme (a React hook).
 * useChartTheme depends on next-themes and React, so we test it separately.
 * Here we validate the static CHART_COLORS constant thoroughly.
 */

describe('CHART_COLORS', () => {
  const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

  it('exports chart1 as a valid 6-digit hex color', () => {
    expect(CHART_COLORS.chart1).toMatch(HEX_REGEX);
  });

  it('exports chart2 as a valid 6-digit hex color', () => {
    expect(CHART_COLORS.chart2).toMatch(HEX_REGEX);
  });

  it('exports chart3 as a valid 6-digit hex color', () => {
    expect(CHART_COLORS.chart3).toMatch(HEX_REGEX);
  });

  it('exports chart4 as a valid 6-digit hex color', () => {
    expect(CHART_COLORS.chart4).toMatch(HEX_REGEX);
  });

  it('exports neutral as a valid 6-digit hex color', () => {
    expect(CHART_COLORS.neutral).toMatch(HEX_REGEX);
  });

  it('exports neutralLight as a valid 6-digit hex color', () => {
    expect(CHART_COLORS.neutralLight).toMatch(HEX_REGEX);
  });

  it('exports blue as a valid 6-digit hex color', () => {
    expect(CHART_COLORS.blue).toMatch(HEX_REGEX);
  });

  it('exports primary as a valid 6-digit hex color', () => {
    expect(CHART_COLORS.primary).toMatch(HEX_REGEX);
  });

  it('contains exactly 8 color keys', () => {
    expect(Object.keys(CHART_COLORS)).toHaveLength(8);
  });

  it('chart1 maps to violet (starts with #8b5)', () => {
    expect(CHART_COLORS.chart1.toLowerCase()).toMatch(/^#8b5/);
  });

  it('chart3 maps to emerald green (starts with #10b)', () => {
    expect(CHART_COLORS.chart3.toLowerCase()).toMatch(/^#10b/);
  });

  it('all color values are unique (no accidental duplicates)', () => {
    const values = Object.values(CHART_COLORS).map(v => v.toLowerCase());
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
