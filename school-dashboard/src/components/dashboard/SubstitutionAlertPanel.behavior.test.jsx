/**
 * @vitest-environment jsdom
 *
 * Regression tests for MEM-13 — SubstitutionAlertPanel polling.
 *
 * Guards three fixes:
 *  1. The 2-minute poll is paused while the tab is hidden and resumed on
 *     refocus (no background requests the user can't see).
 *  2. Each fetchAlerts call is given an AbortSignal and the prior in-flight
 *     request is aborted when a newer call starts (stale-response guard).
 *  3. The in-flight request is aborted on unmount.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { requestMock, socketOn, socketOff } = vi.hoisted(() => ({
  requestMock: vi.fn((_endpoint, _options) =>
    Promise.resolve({ success: true, alerts: [], summary: { urgentAlerts: 0 } })
  ),
  socketOn: vi.fn(),
  socketOff: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  request: (...args) => requestMock(...args),
}));

vi.mock('../../services/socketServiceEnhanced', () => ({
  default: { on: socketOn, off: socketOff },
}));

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({ staff: [], classes: [], schoolSettings: {} }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('react-hot-toast', () => ({
  default: { custom: vi.fn(), dismiss: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../utils/dateFormatter', () => ({
  toTodayDateString: () => '2026-06-29',
}));

import SubstitutionAlertPanel from './SubstitutionAlertPanel';

function renderPanel() {
  return render(
    <MemoryRouter>
      <SubstitutionAlertPanel />
    </MemoryRouter>
  );
}

async function flush(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

function setHidden(hidden) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true, writable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('SubstitutionAlertPanel poll — MEM-13', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    requestMock.mockClear();
    socketOn.mockClear();
    socketOff.mockClear();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true, writable: true });
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('passes an AbortSignal to every fetch', async () => {
    renderPanel();
    await flush(0);
    expect(requestMock).toHaveBeenCalledTimes(1);
    const [, options] = requestMock.mock.calls[0];
    expect(options).toBeTruthy();
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('aborts the prior in-flight request when a new fetchAlerts starts', async () => {
    // Make request stay pending so the interval-tick call supersedes it.
    requestMock.mockImplementation(() => new Promise(() => {}));
    renderPanel();
    await flush(0);
    expect(requestMock).toHaveBeenCalledTimes(1);
    const firstSignal = requestMock.mock.calls[0][1].signal;
    expect(firstSignal.aborted).toBe(false);

    // Advance past the 2-minute interval → second fetch fires, first is aborted.
    await flush(120000);
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(firstSignal.aborted).toBe(true);
  });

  it('pauses the 2-minute poll while the tab is hidden, resumes on refocus', async () => {
    renderPanel();
    await flush(0);
    expect(requestMock).toHaveBeenCalledTimes(1); // initial fetch

    // Hide tab → interval is cleared; advancing the clock must NOT fire a poll.
    setHidden(true);
    await flush(120000);
    expect(requestMock).toHaveBeenCalledTimes(1);

    // Refocus → catch-up fetch fires immediately + interval resumes.
    setHidden(false);
    await flush(0);
    expect(requestMock).toHaveBeenCalledTimes(2); // catch-up fetch on refocus
  });

  it('aborts the in-flight request on unmount', async () => {
    requestMock.mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderPanel();
    await flush(0);
    const signal = requestMock.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(false);

    unmount();
    expect(signal.aborted).toBe(true);
  });
});
