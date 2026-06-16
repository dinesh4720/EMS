import { describe, it, expect } from 'vitest';
import {
  printPalette,
  PRINT_PALETTE,
  bg,
  fg,
  border,
  status,
  shadow,
} from './printPalette';

describe('printPalette', () => {
  it('exports a single source object via two names', () => {
    expect(printPalette).toBe(PRINT_PALETTE);
  });

  it('aliases point to the same values as the namespaced object', () => {
    expect(bg.paper).toBe(printPalette.ink.paper);
    expect(fg.body).toBe(printPalette.text.body);
    expect(border.default).toBe(printPalette.border.default);
    expect(status.danger).toBe(printPalette.status.danger);
    expect(shadow.soft).toBe(printPalette.shadow.soft);
  });

  it('uses WCAG-safe neutrals for the body / muted text', () => {
    // gray-900 (#111827) on white has a contrast ratio of ~16:1
    expect(fg.body).toBe('#111827');
    // gray-500 (#6b7280) is the lowest-contrast shade we accept for
    // meta text — it is the audit-approved minimum on white.
    expect(fg.muted).toBe('#6b7280');
  });

  it('uses the same status hex as the screen design tokens', () => {
    // The status colors are intentionally duplicated from
    // theme/colors.js so print and screen look identical.
    expect(status.ok).toBe('#22c55e'); // success.DEFAULT
    expect(status.danger).toBe('#ef4444'); // error.DEFAULT
    expect(status.warn).toBe('#f59e0b'); // warning.DEFAULT
    expect(status.info).toBe('#3b82f6'); // info.DEFAULT
  });

  it('treats paper and black as named constants that do not change', () => {
    expect(bg.paper).toBe('#ffffff');
    expect(fg.black).toBe('#000000');
  });

  it('every string value in the palette is a valid CSS color', () => {
    function assertColor(obj, path = '') {
      for (const [key, value] of Object.entries(obj)) {
        const here = path ? `${path}.${key}` : key;
        if (value && typeof value === 'object') {
          assertColor(value, here);
        } else if (typeof value === 'string') {
          const ok =
            value.startsWith('#') ||
            value.startsWith('rgb') ||
            value.startsWith('hsl');
          expect(ok, `${here} should be a valid CSS color, got "${value}"`).toBe(
            true
          );
        }
      }
    }
    assertColor(printPalette);
  });
});
