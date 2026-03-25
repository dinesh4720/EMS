// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { confirmPermanentDeletion } from './studentDashboardUtils.jsx';

// Build a minimal i18n translation stub that records the last call made to it.
function makeTranslationSpy() {
  const spy = vi.fn((key, _defaultMsg, _opts) => key);
  return spy;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('confirmPermanentDeletion — return value mirrors window.confirm', () => {
  it('returns true when window.confirm returns true', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const t = makeTranslationSpy();

    const result = confirmPermanentDeletion('Alice', t);

    expect(result).toBe(true);
  });

  it('returns false when window.confirm returns false', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const t = makeTranslationSpy();

    const result = confirmPermanentDeletion('Bob', t);

    expect(result).toBe(false);
  });
});

describe('confirmPermanentDeletion — window.confirm call behavior', () => {
  it('calls window.confirm exactly once', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const t = makeTranslationSpy();

    confirmPermanentDeletion('Charlie', t);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('passes the translated message string to window.confirm', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Return a predictable translated string so we can assert on what confirm receives.
    const t = vi.fn(() => 'Translated confirmation message');

    confirmPermanentDeletion('Diana', t);

    expect(confirmSpy).toHaveBeenCalledWith('Translated confirmation message');
  });
});

describe('confirmPermanentDeletion — translation function (t) behavior', () => {
  it('calls the translation function exactly once', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const t = makeTranslationSpy();

    confirmPermanentDeletion('Eve', t);

    expect(t).toHaveBeenCalledTimes(1);
  });

  it('calls t with the correct i18n key as the first argument', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const t = makeTranslationSpy();

    confirmPermanentDeletion('Frank', t);

    expect(t).toHaveBeenCalledWith(
      'students.confirmPermanentDeletion',
      expect.any(String),
      expect.objectContaining({ name: 'Frank' })
    );
  });

  it('passes the student name inside the interpolation options object', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const t = makeTranslationSpy();

    confirmPermanentDeletion('Grace', t);

    const [, , opts] = t.mock.calls[0];
    expect(opts).toEqual(expect.objectContaining({ name: 'Grace' }));
  });

  it('uses a non-empty default message string as the second argument to t', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const t = makeTranslationSpy();

    confirmPermanentDeletion('Henry', t);

    const [, defaultMsg] = t.mock.calls[0];
    expect(typeof defaultMsg).toBe('string');
    expect(defaultMsg.length).toBeGreaterThan(0);
  });
});
