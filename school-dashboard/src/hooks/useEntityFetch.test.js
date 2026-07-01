/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEntityFetch } from "./useEntityFetch";

// jsdom does not implement IntersectionObserver. Stub a minimal version that
// records observe/disconnect and lets the test fire intersection callbacks.
class MockIntersectionObserver {
  constructor(cb, options) {
    this.cb = cb;
    this.options = options;
    this.observed = [];
    this.disconnected = false;
    MockIntersectionObserver.instances.push(this);
  }
  observe(node) {
    this.observed.push(node);
    this.disconnected = false;
  }
  unobserve(node) {
    this.observed = this.observed.filter((n) => n !== node);
  }
  disconnect() {
    this.observed = [];
    this.disconnected = true;
  }
  // Test helper: simulate the sentinel scrolling into view.
  fire(isIntersecting) {
    this.cb([{ isIntersecting }], this);
  }
}
MockIntersectionObserver.instances = [];

const makeItems = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));

describe("useEntityFetch", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    global.IntersectionObserver = MockIntersectionObserver;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete global.IntersectionObserver;
  });

  it("slices to itemsPerLoad and reveals more after the sentinel intersects", () => {
    const { result } = renderHook(() =>
      useEntityFetch(makeItems(25), [], { itemsPerLoad: 10 })
    );

    expect(result.current.visibleItems).toHaveLength(10);
    expect(result.current.hasMore).toBe(true);

    // Attach the callback ref to a sentinel node (what `ref={loaderRef}` does).
    const node = document.createElement("div");
    act(() => result.current.loaderRef(node));
    const observer = MockIntersectionObserver.instances[0];
    expect(observer.observed).toContain(node);

    // Sentinel enters the viewport -> enters loading, then reveals after the delay.
    act(() => observer.fire(true));
    expect(result.current.isLoadingMore).toBe(true);

    act(() => vi.advanceTimersByTime(300));
    expect(result.current.visibleItems).toHaveLength(20);
    expect(result.current.isLoadingMore).toBe(false);

    // Reveal the last page; hasMore turns false.
    act(() => observer.fire(true));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.visibleItems).toHaveLength(25);
    expect(result.current.hasMore).toBe(false);
  });

  it("re-observes a sentinel that mounts after first render (conditional render fix)", () => {
    const { result } = renderHook(() =>
      useEntityFetch(makeItems(25), [], { itemsPerLoad: 10 })
    );

    // Sentinel is absent on first render (e.g. `{hasMore && <div ref={loaderRef}/>}`
    // gated behind data that has not arrived): React invokes the ref with null.
    act(() => result.current.loaderRef(null));
    const observer = MockIntersectionObserver.instances[0];
    expect(observer.observed).toHaveLength(0);

    // Sentinel mounts later -> the callback ref fires with the node and the
    // observer (re-)attaches. The old code observed nothing here.
    const node = document.createElement("div");
    act(() => result.current.loaderRef(node));
    expect(observer.observed).toContain(node);

    // Infinite scroll now engages.
    act(() => observer.fire(true));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.visibleItems).toHaveLength(20);
  });

  it("clears the pending load-more timer and disconnects the observer on unmount", () => {
    const clearSpy = vi.spyOn(global, "clearTimeout");
    const { result, unmount } = renderHook(() =>
      useEntityFetch(makeItems(25), [], { itemsPerLoad: 10 })
    );

    const node = document.createElement("div");
    act(() => result.current.loaderRef(node));
    const observer = MockIntersectionObserver.instances[0];

    // Start a load (300ms timer pending), then unmount before it fires.
    act(() => observer.fire(true));
    expect(result.current.isLoadingMore).toBe(true);

    act(() => unmount());

    expect(clearSpy).toHaveBeenCalled();
    expect(observer.disconnected).toBe(true);

    // The orphaned timer must not run after unmount.
    expect(() => vi.runAllTimers()).not.toThrow();
    clearSpy.mockRestore();
  });

  it("returns a stable callback ref across re-renders (no observe/detach thrash)", () => {
    const { result, rerender } = renderHook(
      ({ data }) => useEntityFetch(data, [data.length], { itemsPerLoad: 10 }),
      { initialProps: { data: makeItems(15) } }
    );

    const firstRef = result.current.loaderRef;
    act(() => rerender({ data: makeItems(30) }));
    expect(result.current.loaderRef).toBe(firstRef);
  });
});
