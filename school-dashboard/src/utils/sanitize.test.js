import { describe, it, expect } from 'vitest';
import { escapeHtml } from './sanitize';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes less-than signs', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater-than signs', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('escapes all special characters in one string', () => {
    expect(escapeHtml('<a href="\'test\'">Tom & Jerry</a>')).toBe(
      '&lt;a href=&quot;&#039;test&#039;&quot;&gt;Tom &amp; Jerry&lt;/a&gt;'
    );
  });

  it('returns an empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('coerces numbers to strings', () => {
    expect(escapeHtml(123)).toBe('123');
  });

  it('coerces booleans to strings', () => {
    expect(escapeHtml(true)).toBe('true');
  });

  it('returns an empty string for an empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('leaves safe text unchanged', () => {
    expect(escapeHtml('plain text')).toBe('plain text');
  });
});
