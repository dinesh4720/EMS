import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './sanitizeUrl';

describe('sanitizeUrl', () => {
  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com/file.pdf')).toBe('http://example.com/file.pdf');
  });

  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf');
  });

  it('allows mailto URLs', () => {
    expect(sanitizeUrl('mailto:parent@example.com')).toBe('mailto:parent@example.com');
  });

  it('is case-insensitive on the protocol', () => {
    expect(sanitizeUrl('HTTPS://example.com')).toBe('HTTPS://example.com');
  });

  it('blocks the javascript: protocol (the stored-XSS vector from SEC-01)', () => {
    expect(sanitizeUrl('javascript:alert(document.cookie)')).toBe('#');
  });

  it('blocks a newline-broken javascript: payload (browser-stripped bypass)', () => {
    expect(sanitizeUrl('java\nscript:alert(document.cookie)')).toBe('#');
  });

  it('blocks a tab-broken javascript: payload', () => {
    expect(sanitizeUrl('java\tscript:alert(1)')).toBe('#');
  });

  it('blocks a carriage-return-broken javascript: payload', () => {
    expect(sanitizeUrl('java\rscript:alert(1)')).toBe('#');
  });

  it('blocks a javascript: payload wrapped in whitespace', () => {
    expect(sanitizeUrl('   javascript:alert(1)   ')).toBe('#');
  });

  it('blocks the data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('blocks the vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('#');
  });

  it('blocks protocol-relative URLs', () => {
    expect(sanitizeUrl('//evil.example.com/file.pdf')).toBe('#');
  });

  it('blocks relative-path tricks that look like a protocol', () => {
    expect(sanitizeUrl('/redirect?to=javascript:alert(1)')).toBe('/redirect?to=javascript:alert(1)');
  });

  it('returns "#" for null', () => {
    expect(sanitizeUrl(null)).toBe('#');
  });

  it('returns "#" for undefined', () => {
    expect(sanitizeUrl(undefined)).toBe('#');
  });

  it('returns "#" for non-string inputs (object/number/boolean)', () => {
    expect(sanitizeUrl({})).toBe('#');
    expect(sanitizeUrl(123)).toBe('#');
    expect(sanitizeUrl(true)).toBe('#');
  });

  it('returns "#" for an empty string', () => {
    expect(sanitizeUrl('')).toBe('#');
  });

  it('returns "#" for a whitespace-only string', () => {
    expect(sanitizeUrl('   \n\t  ')).toBe('#');
  });

  it('strips a leading control character from an otherwise-safe URL', () => {
    expect(sanitizeUrl('\nhttps://example.com/file.pdf')).toBe('https://example.com/file.pdf');
  });
});
