import { describe, it, expect } from 'vitest';
import {
  neutral,
  primary,
  accent,
  success,
  error,
  warning,
  info,
  background,
  border,
  text,
  toast,
  chart,
  dark,
} from './colors';

// Helper: checks that every string value in an object starts with '#', 'rgb', or 'hsl'.
// Nested objects are traversed recursively.
function assertColorValues(obj, path = '') {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      assertColorValues(value, currentPath);
    } else if (typeof value === 'string') {
      expect(
        value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl'),
        `Expected ${currentPath} ("${value}") to be a valid CSS color`
      ).toBe(true);
    }
  }
}

describe('colors — exported objects are defined', () => {
  it('neutral is a non-null object', () => {
    expect(neutral).toBeDefined();
    expect(typeof neutral).toBe('object');
    expect(neutral).not.toBeNull();
  });

  it('primary is a non-null object', () => {
    expect(primary).toBeDefined();
    expect(typeof primary).toBe('object');
    expect(primary).not.toBeNull();
  });

  it('success is a non-null object', () => {
    expect(success).toBeDefined();
    expect(typeof success).toBe('object');
    expect(success).not.toBeNull();
  });

  it('error is a non-null object', () => {
    expect(error).toBeDefined();
    expect(typeof error).toBe('object');
    expect(error).not.toBeNull();
  });

  it('warning is a non-null object', () => {
    expect(warning).toBeDefined();
    expect(typeof warning).toBe('object');
    expect(warning).not.toBeNull();
  });

  it('info is a non-null object', () => {
    expect(info).toBeDefined();
    expect(typeof info).toBe('object');
    expect(info).not.toBeNull();
  });

  it('background is a non-null object', () => {
    expect(background).toBeDefined();
    expect(typeof background).toBe('object');
    expect(background).not.toBeNull();
  });

  it('text is a non-null object', () => {
    expect(text).toBeDefined();
    expect(typeof text).toBe('object');
    expect(text).not.toBeNull();
  });

  it('chart is a non-null object', () => {
    expect(chart).toBeDefined();
    expect(typeof chart).toBe('object');
    expect(chart).not.toBeNull();
  });
});

describe('colors — DEFAULT keys present on semantic tokens', () => {
  it('primary has a DEFAULT key', () => {
    expect(primary).toHaveProperty('DEFAULT');
  });

  it('success has a DEFAULT key', () => {
    expect(success).toHaveProperty('DEFAULT');
  });

  it('error has a DEFAULT key', () => {
    expect(error).toHaveProperty('DEFAULT');
  });

  it('warning has a DEFAULT key', () => {
    expect(warning).toHaveProperty('DEFAULT');
  });

  it('info has a DEFAULT key', () => {
    expect(info).toHaveProperty('DEFAULT');
  });

  it('accent has a DEFAULT key', () => {
    expect(accent).toHaveProperty('DEFAULT');
  });
});

describe('colors — neutral scale keys', () => {
  it('neutral has key "50"', () => {
    expect(neutral).toHaveProperty('50');
  });

  it('neutral has key "100"', () => {
    expect(neutral).toHaveProperty('100');
  });

  it('neutral has key "900"', () => {
    expect(neutral).toHaveProperty('900');
  });

  it('neutral.50 is a non-empty string', () => {
    expect(typeof neutral[50]).toBe('string');
    expect(neutral[50].length).toBeGreaterThan(0);
  });

  it('neutral.900 is a non-empty string', () => {
    expect(typeof neutral[900]).toBe('string');
    expect(neutral[900].length).toBeGreaterThan(0);
  });
});

describe('colors — color value format', () => {
  it('all primary values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(primary);
  });

  it('all neutral values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(neutral);
  });

  it('all success values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(success);
  });

  it('all error values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(error);
  });

  it('all warning values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(warning);
  });

  it('all info values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(info);
  });

  it('all background values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(background);
  });

  it('all text values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(text);
  });

  it('all chart values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(chart);
  });

  it('all toast values start with "#", "rgb", or "hsl"', () => {
    assertColorValues(toast);
  });
});

describe('colors — background keys', () => {
  it('background has a DEFAULT key', () => {
    expect(background).toHaveProperty('DEFAULT');
  });

  it('background has a "secondary" key (serves as "card"-level surface)', () => {
    expect(background).toHaveProperty('secondary');
  });
});

describe('colors — text keys', () => {
  it('text has a "primary" key', () => {
    expect(text).toHaveProperty('primary');
  });

  it('text has a "secondary" key', () => {
    expect(text).toHaveProperty('secondary');
  });

  it('text.primary is a non-empty string', () => {
    expect(typeof text.primary).toBe('string');
    expect(text.primary.length).toBeGreaterThan(0);
  });
});

describe('colors — dark mode object', () => {
  it('dark is a non-null object', () => {
    expect(dark).toBeDefined();
    expect(typeof dark).toBe('object');
    expect(dark).not.toBeNull();
  });

  it('dark.primary has a DEFAULT key', () => {
    expect(dark.primary).toHaveProperty('DEFAULT');
  });

  it('dark.text has a "primary" key', () => {
    expect(dark.text).toHaveProperty('primary');
  });
});
