/**
 * @vitest-environment jsdom
 *
 * Regression test for MEM-14: the hover open/close/aim timeouts must be
 * cleared on unmount so a stray timer can't fire (and setState) after the
 * nav is torn down (route change / logout).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useNavHover } from "./useNavHover";

// A section with a panel triggers the OPEN_DELAY timer on hover.
const panelSection = { id: "academics", panel: true };

// A minimal element stub — onItemEnter only needs getBoundingClientRect.
const makeEl = () => ({
  getBoundingClientRect: () => ({
    left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10,
  }),
});

// Hover a panel rail item → schedules the OPEN_DELAY open timer.
function hoverPanelItem(result) {
  act(() => {
    result.current.hoverProps(panelSection).onMouseEnter({
      currentTarget: makeEl(),
    });
  });
}

describe("useNavHover unmount cleanup (MEM-14)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("leaves no pending hover timer after unmount", () => {
    const { result, unmount } = renderHook(() => useNavHover());

    hoverPanelItem(result);
    // The open timer is now armed.
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    act(() => {
      unmount();
    });

    // Without cleanup this timer would survive and fire post-unmount.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("calls clearTimeout during unmount teardown", () => {
    const { result, unmount } = renderHook(() => useNavHover());

    hoverPanelItem(result);

    // Ignore the clearTimeout calls the enter handler itself makes; only
    // assert on what unmount does.
    const clearSpy = vi.spyOn(global, "clearTimeout");
    act(() => {
      unmount();
    });

    expect(clearSpy).toHaveBeenCalled();
  });

  it("does not reopen the panel when timers elapse after unmount", () => {
    const { result, unmount } = renderHook(() => useNavHover());
    expect(result.current.openId).toBeNull();

    hoverPanelItem(result);

    act(() => {
      unmount();
    });
    // Advance past every hover delay (260ms aim is the longest). No throw,
    // no reopen.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }).not.toThrow();
    expect(result.current.openId).toBeNull();
  });
});
