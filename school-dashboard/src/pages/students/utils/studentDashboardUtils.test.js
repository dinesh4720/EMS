// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { CustomTooltip } from './studentDashboardUtils.jsx';

describe('CustomTooltip', () => {
  it('is exported as a function', () => {
    expect(typeof CustomTooltip).toBe('function');
  });

  it('returns null when not active', () => {
    const result = CustomTooltip({ active: false, payload: [], label: '' });
    expect(result).toBeNull();
  });
});
