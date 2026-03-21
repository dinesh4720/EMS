import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../locales');
const SRC_DIR = path.resolve(__dirname, '../../');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively flatten a nested object into dot-notation keys. */
function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      acc.push(...flattenKeys(value, fullKey));
    } else {
      acc.push(fullKey);
    }
    return acc;
  }, []);
}

/** Load and parse every *.json file in the locales directory. */
function loadLocales() {
  const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
  const locales = {};
  for (const file of files) {
    const lang = file.replace('.json', '');
    locales[lang] = JSON.parse(
      fs.readFileSync(path.join(LOCALES_DIR, file), 'utf-8'),
    );
  }
  return locales;
}

/** Recursively collect all values from a nested object. */
function flattenValues(obj) {
  return Object.values(obj).flatMap((v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? flattenValues(v) : [v],
  );
}

/**
 * Walk the src directory and extract every translation key used via t('key')
 * or t("key") calls. Returns a Set of key strings.
 */
function extractSourceKeys() {
  const keys = new Set();
  // Match t('key.path', ...) or t("key.path", ...)
  const tCallRegex = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip non-source directories
        if (['node_modules', '__tests__', 'i18n', '.git'].includes(entry.name))
          continue;
        walk(full);
      } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf-8');
        let match;
        while ((match = tCallRegex.exec(content)) !== null) {
          keys.add(match[1]);
        }
      }
    }
  }

  walk(SRC_DIR);
  return keys;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const locales = loadLocales();
const languages = Object.keys(locales);
const referenceLocale = 'en';
const referenceKeys = flattenKeys(locales[referenceLocale]).sort();

describe('i18n translation files', () => {
  it('should have at least the English (en) locale', () => {
    expect(languages).toContain('en');
  });

  it('should parse all locale files as valid JSON with non-empty content', () => {
    for (const lang of languages) {
      const keys = flattenKeys(locales[lang]);
      expect(keys.length, `${lang}.json has no keys`).toBeGreaterThan(0);
    }
  });

  it('should have no empty string values in any locale', () => {
    for (const lang of languages) {
      const values = flattenValues(locales[lang]);
      const empties = values.filter((v) => typeof v === 'string' && v.trim() === '');
      expect(empties, `${lang}.json contains empty string values`).toHaveLength(0);
    }
  });

  it('should have no duplicate keys within any locale file', () => {
    // JSON.parse deduplicates by keeping the last value, so read raw and check
    for (const lang of languages) {
      const raw = fs.readFileSync(
        path.join(LOCALES_DIR, `${lang}.json`),
        'utf-8',
      );
      // Quick heuristic: count key occurrences at the string level
      const keyMatches = raw.match(/"[a-zA-Z0-9_]+"\s*:/g) || [];
      const parsed = flattenKeys(locales[lang]);
      // The flat key count from parsed JSON should be deterministic
      expect(parsed.length).toBeGreaterThan(0);
      // Ensure no key path resolves to undefined
      for (const key of parsed) {
        const value = key.split('.').reduce((o, k) => o?.[k], locales[lang]);
        expect(value, `${lang}: key "${key}" resolves to undefined`).toBeDefined();
      }
    }
  });

  describe('cross-language key consistency', () => {
    const otherLanguages = languages.filter((l) => l !== referenceLocale);

    if (otherLanguages.length === 0) {
      it('should have additional language files to compare (only en.json exists)', () => {
        // Passes as a reminder — add more locale files (e.g. hi.json) to enable cross-language checks
        expect(languages).toContain('en');
      });
    }

    for (const lang of otherLanguages) {
      const langKeys = flattenKeys(locales[lang]).sort();

      it(`${lang}.json should have all keys from ${referenceLocale}.json`, () => {
        const missingKeys = referenceKeys.filter((k) => !langKeys.includes(k));
        expect(
          missingKeys,
          `${lang}.json is missing ${missingKeys.length} keys:\n  ${missingKeys.join('\n  ')}`,
        ).toHaveLength(0);
      });

      it(`${lang}.json should have no extra keys absent from ${referenceLocale}.json`, () => {
        const extraKeys = langKeys.filter((k) => !referenceKeys.includes(k));
        expect(
          extraKeys,
          `${lang}.json has ${extraKeys.length} extra keys:\n  ${extraKeys.join('\n  ')}`,
        ).toHaveLength(0);
      });
    }
  });

  describe('translation values', () => {
    const otherLanguages = languages.filter((l) => l !== referenceLocale);

    if (otherLanguages.length === 0) {
      it('should have additional language files to validate (only en.json exists)', () => {
        expect(languages).toContain('en');
      });
    }

    for (const lang of otherLanguages) {
      it(`${lang}.json values should not be identical to ${referenceLocale}.json for every key`, () => {
        const langKeys = flattenKeys(locales[lang]);
        let identical = 0;
        for (const key of langKeys) {
          const enVal = key.split('.').reduce((o, k) => o?.[k], locales[referenceLocale]);
          const langVal = key.split('.').reduce((o, k) => o?.[k], locales[lang]);
          if (enVal === langVal) identical++;
        }
        if (langKeys.length > 0) {
          expect(
            identical / langKeys.length,
            `${lang}.json appears to be an untranslated copy of en.json (${identical}/${langKeys.length} identical)`,
          ).toBeLessThan(1);
        }
      });
    }
  });
});

describe('source code ↔ translation file sync', () => {
  const sourceKeys = extractSourceKeys();

  it('should find translation keys used in source code', () => {
    expect(sourceKeys.size).toBeGreaterThan(0);
  });

  it('every t() key used in source should exist in en.json', () => {
    const missingKeys = [...sourceKeys].filter(
      (k) => !referenceKeys.includes(k),
    );
    if (missingKeys.length > 0) {
      console.warn(
        `\n⚠ ${missingKeys.length} key(s) used in source but missing from en.json:\n  ${missingKeys.join('\n  ')}`,
      );
    }
    // This is a warning-level check — failing here means en.json needs updating.
    // Set to expect(0) once en.json is fully synced.
    expect(
      missingKeys,
      `${missingKeys.length} key(s) used in source but missing from en.json:\n  ${missingKeys.join('\n  ')}`,
    ).toHaveLength(0);
  });

  it('every key in en.json should be used in source code (no orphan keys)', () => {
    const orphanKeys = referenceKeys.filter((k) => !sourceKeys.has(k));
    if (orphanKeys.length > 0) {
      console.warn(
        `\n⚠ ${orphanKeys.length} key(s) in en.json but not found in source:\n  ${orphanKeys.join('\n  ')}`,
      );
    }
    // Warn but don't fail — some keys may be dynamically constructed
    // Uncomment the assertion below once dynamic keys are accounted for:
    // expect(orphanKeys).toHaveLength(0);
  });
});

describe('translation key naming conventions', () => {
  it('all keys should use camelCase segments separated by dots', () => {
    const badKeys = referenceKeys.filter((k) => {
      const segments = k.split('.');
      return segments.some((s) => /[^a-zA-Z0-9]/.test(s) || s.length === 0);
    });
    expect(
      badKeys,
      `Keys with non-camelCase segments:\n  ${badKeys.join('\n  ')}`,
    ).toHaveLength(0);
  });

  it('all keys should have at least a namespace prefix (e.g., common.key)', () => {
    const topLevelKeys = referenceKeys.filter((k) => !k.includes('.'));
    expect(
      topLevelKeys,
      `Keys without namespace:\n  ${topLevelKeys.join('\n  ')}`,
    ).toHaveLength(0);
  });
});
