/**
 * i18n unit tests
 * Verifies locale mapping, fallback behaviour, and translation key integrity.
 *
 * Run with: npm run test:unit
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── en.json integrity ───────────────────────────────────────────────────────

import enJSON from './locales/en.json';

describe('en.json – structure and completeness', () => {
  it('is valid JSON with a non-empty object', () => {
    expect(typeof enJSON).toBe('object');
    expect(enJSON).not.toBeNull();
    expect(Object.keys(enJSON).length).toBeGreaterThan(0);
  });

  it('contains all required top-level namespaces', () => {
    const required = [
      'billing', 'calendar', 'common', 'exportCenter', 'confirm',
      'aria', 'constants', 'criticalAlerts', 'globalSearch',
      'intakeForms', 'login', 'signup',
    ];
    for (const ns of required) {
      expect(enJSON, `Missing namespace: ${ns}`).toHaveProperty(ns);
    }
  });

  it('has no null values at any depth', () => {
    function checkNoNull(obj, path = '') {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        expect(value, `Null value at: ${fullPath}`).not.toBeNull();
        if (typeof value === 'object' && !Array.isArray(value)) {
          checkNoNull(value, fullPath);
        }
      }
    }
    checkNoNull(enJSON);
  });

  it('all leaf values are non-empty strings', () => {
    function checkStrings(obj, path = '') {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          expect(value.trim(), `Empty string at: ${fullPath}`).not.toBe('');
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkStrings(value, fullPath);
        }
      }
    }
    checkStrings(enJSON);
  });

  it('confirm namespace has all required keys', () => {
    const confirmKeys = [
      'cancelAssignment', 'deleteGatePass', 'deleteVisitor', 'deleteAppointment',
      'deleteBook', 'deleteFeedback', 'deleteAdmission', 'deleteCallLog',
      'deleteRoom', 'deleteHostel', 'deleteItem', 'deleteItemNamed',
      'removeSubstitution', 'deleteTemplate', 'deleteFeeHead',
      'discardChanges', 'deleteRole', 'deletePermanently',
      'deleteReminder', 'deleteVendor', 'deleteAnnouncement',
      'applyFeeStructure', 'deleteBulkStaff', 'permanentDeleteStudent',
      'removeStudentFromRoute', 'markPassedOut', 'setDefaultSalary',
    ];
    for (const key of confirmKeys) {
      expect(enJSON.confirm, `Missing confirm.${key}`).toHaveProperty(key);
    }
  });

  it('aria namespace has tables, menus, buttons, inputs, charts, misc', () => {
    expect(enJSON.aria).toHaveProperty('tables');
    expect(enJSON.aria).toHaveProperty('menus');
    expect(enJSON.aria).toHaveProperty('buttons');
    expect(enJSON.aria).toHaveProperty('inputs');
    expect(enJSON.aria).toHaveProperty('charts');
    expect(enJSON.aria).toHaveProperty('misc');
  });

  it('constants namespace has all sub-sections', () => {
    expect(enJSON.constants).toHaveProperty('changelog');
    expect(enJSON.constants).toHaveProperty('feedback');
    expect(enJSON.constants).toHaveProperty('library');
    expect(enJSON.constants).toHaveProperty('notifications');
    expect(enJSON.constants).toHaveProperty('reminders');
    expect(enJSON.constants).toHaveProperty('permissions');
  });

  it('login namespace has all required keys', () => {
    const loginKeys = [
      'welcome', 'subtitle', 'emailLabel', 'passwordLabel',
      'signIn', 'signingIn', 'copyright',
    ];
    for (const key of loginKeys) {
      expect(enJSON.login, `Missing login.${key}`).toHaveProperty(key);
    }
  });

  it('exportCenter has types and columns', () => {
    expect(enJSON.exportCenter).toHaveProperty('types');
    expect(enJSON.exportCenter).toHaveProperty('columns');
    expect(enJSON.exportCenter.types).toHaveProperty('students');
    expect(enJSON.exportCenter.types).toHaveProperty('staff');
  });
});

// ─── LOCALE_MAP ───────────────────────────────────────────────────────────────

describe('LOCALE_MAP and SUPPORTED_LANGUAGES', () => {
  it('SUPPORTED_LANGUAGES covers all expected codes', async () => {
    const { SUPPORTED_LANGUAGES } = await import('./index.js');
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('ur');
    expect(codes).toContain('kn');
    expect(codes).toContain('ta');
    expect(codes).toContain('te');
  });

  it('Urdu is marked as RTL', async () => {
    const { SUPPORTED_LANGUAGES } = await import('./index.js');
    const urdu = SUPPORTED_LANGUAGES.find((l) => l.code === 'ur');
    expect(urdu).toBeDefined();
    expect(urdu?.dir).toBe('rtl');
  });

  it('all non-Urdu languages are LTR', async () => {
    const { SUPPORTED_LANGUAGES } = await import('./index.js');
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang.code !== 'ur') {
        expect(lang.dir, `${lang.code} should be ltr`).toBe('ltr');
      }
    }
  });
});

// ─── getDateLocale ────────────────────────────────────────────────────────────

describe('getDateLocale()', () => {
  it('returns a valid BCP-47 locale string for English', async () => {
    const { getDateLocale } = await import('./index.js');
    const locale = getDateLocale();
    // Should be a non-empty string like 'en-IN'
    expect(typeof locale).toBe('string');
    expect(locale.length).toBeGreaterThan(0);
    expect(locale).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
  });

  it('can be used with Intl.NumberFormat without throwing', async () => {
    const { getDateLocale } = await import('./index.js');
    const locale = getDateLocale();
    expect(() => new Intl.NumberFormat(locale).format(12345)).not.toThrow();
  });

  it('can be used with Intl.DateTimeFormat without throwing', async () => {
    const { getDateLocale } = await import('./index.js');
    const locale = getDateLocale();
    expect(() => new Intl.DateTimeFormat(locale).format(new Date())).not.toThrow();
  });
});

// ─── Translation key format ───────────────────────────────────────────────────

describe('Translation interpolation patterns', () => {
  it('interpolation uses {{variable}} syntax', () => {
    // Verify keys that use interpolation contain {{ }}
    const interpolated = [
      enJSON.billing.gracePeriodBanner,
      enJSON.billing.trialBanner,
      enJSON.confirm.deleteBulkStaff,
      enJSON.confirm.permanentDeleteStudent,
    ];
    for (const value of interpolated) {
      expect(value, `Expected {{...}} interpolation: "${value}"`).toMatch(/\{\{.+\}\}/);
    }
  });

  it('confirm.deleteSubject uses {{name}} interpolation', () => {
    expect(enJSON.confirm.deleteSubject).toContain('{{name}}');
  });

  it('confirm.deleteBulkStaff uses {{count}} interpolation', () => {
    expect(enJSON.confirm.deleteBulkStaff).toContain('{{count}}');
  });
});
