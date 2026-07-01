/**
 * @vitest-environment jsdom
 *
 * Tests for the server-driven Staff list data hook (SCH-193 / PAG-28-FE).
 *
 * Covers the three behaviours that previously lived inline in StaffList.jsx
 * and now belong to the hook: debounced `q`, smart `includeFacets` (only
 * re-request the 4 aggregation queries when the filter SET changes, not when
 * merely paging within the same set), abort-on-unmount, page-clamp on a
 * shrunken result set, and facet normalization for the FilterPillsBar.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("../../../services/api", () => ({
  staffApi: { list: vi.fn() },
}));

import { staffApi } from "../../../services/api";
import { useStaffList } from "./useStaffList";

const FACETS_PAYLOAD = {
  role: [
    { value: "Teacher", count: 3 },
    { value: "Admin", count: 1 },
    // Should be stripped — server shouldn't send nulls, but be defensive.
    { value: "", count: 0 },
    { value: null, count: 0 },
  ],
  department: [{ value: "Math", count: 2 }],
  employmentType: [{ value: "Full-Time", count: 4 }],
  gender: [{ value: "Female", count: 2 }],
};

const EMPTY_RESPONSE = {
  data: [],
  pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
  facets: { role: [], department: [], employmentType: [], gender: [] },
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default mock — always return a value so re-renders don't blow up.
  staffApi.list.mockResolvedValue(EMPTY_RESPONSE);
});

describe("useStaffList", () => {
  it("issues the initial fetch with includeFacets=true and surfaces the facets", async () => {
    staffApi.list.mockResolvedValueOnce({
      data: [{ _id: "s1", name: "Asha" }],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      facets: FACETS_PAYLOAD,
    });

    const { result } = renderHook(() =>
      useStaffList({
        q: "",
        filter: "all",
        roleFilter: [],
        departmentFilter: "all",
        employmentTypeFilter: "all",
        genderFilter: "all",
        page: 1,
        pageSize: 25,
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(staffApi.list).toHaveBeenCalledTimes(1);
    const [params] = staffApi.list.mock.calls[0];
    expect(params.includeFacets).toBe("true");
    expect(params.page).toBe(1);
    expect(params.limit).toBe(25);

    expect(result.current.data).toHaveLength(1);
    expect(result.current.pagination.total).toBe(1);
    // The empty/null facet entries were filtered out; values coerced to strings.
    expect(result.current.facets.role).toEqual([
      { value: "Teacher", count: 3 },
      { value: "Admin", count: 1 },
    ]);
  });

  it("debounces q so typing does not fire one request per keystroke (uses real timers)", async () => {
    // Hold a list of all calls so we can assert on the call sequence.
    const calls = [];
    staffApi.list.mockImplementation((params) => {
      calls.push(params.q);
      return Promise.resolve(EMPTY_RESPONSE);
    });

    const { rerender } = renderHook(
      ({ q }) =>
        useStaffList({
          q,
          filter: "all",
          roleFilter: [],
          departmentFilter: "all",
          employmentTypeFilter: "all",
          genderFilter: "all",
          page: 1,
          pageSize: 25,
        }),
      { initialProps: { q: "a" } }
    );

    // The first fetch fires on mount with the initial q value.
    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(1));

    // Rapid keystrokes within the debounce window — should NOT trigger extra
    // requests yet.
    rerender({ q: "ab" });
    rerender({ q: "abc" });
    // Yield to the microtask queue but stay inside the 300ms window.
    await Promise.resolve();
    expect(staffApi.list).toHaveBeenCalledTimes(1);

    // Wait past the 300ms debounce threshold for the final q="abc".
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    // Exactly one extra fetch (for "abc"), not one per keystroke.
    expect(staffApi.list).toHaveBeenCalledTimes(2);
    expect(calls[1]).toBe("abc");
  }, 10_000);

  it("sends includeFacets=false when paging within the same filter set", async () => {
    let callIndex = 0;
    const responses = [
      {
        data: [{ _id: "s1" }],
        pagination: { page: 1, limit: 1, total: 2, totalPages: 2 },
        facets: FACETS_PAYLOAD,
      },
      {
        data: [{ _id: "s2" }],
        pagination: { page: 2, limit: 1, total: 2, totalPages: 2 },
        // No facets key — simulated `includeFacets=false` response.
      },
    ];
    staffApi.list.mockImplementation(() => Promise.resolve(responses[callIndex++]));

    const { result, rerender } = renderHook(
      ({ page }) =>
        useStaffList({
          q: "",
          filter: "all",
          roleFilter: [],
          departmentFilter: "all",
          employmentTypeFilter: "all",
          genderFilter: "all",
          page,
          pageSize: 1,
        }),
      { initialProps: { page: 1 } }
    );

    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(1));
    expect(staffApi.list.mock.calls[0][0].includeFacets).toBe("true");

    // Page 2 of the same filter set — facets should be skipped server-side.
    rerender({ page: 2 });
    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(2));
    expect(staffApi.list.mock.calls[1][0].includeFacets).toBe("false");
    expect(staffApi.list.mock.calls[1][0].page).toBe(2);

    // Facets from page 1 are preserved in hook state (page 2's response
    // omitted them since we asked includeFacets=false).
    expect(result.current.facets.role).toHaveLength(2);
    expect(result.current.facets.role[0]).toEqual({ value: "Teacher", count: 3 });
  });

  it("re-requests facets when the filter SET changes (new role selection)", async () => {
    const { rerender } = renderHook(
      ({ roleFilter }) =>
        useStaffList({
          q: "",
          filter: "all",
          roleFilter,
          departmentFilter: "all",
          employmentTypeFilter: "all",
          genderFilter: "all",
          page: 1,
          pageSize: 25,
        }),
      { initialProps: { roleFilter: [] } }
    );

    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(1));
    expect(staffApi.list.mock.calls[0][0].includeFacets).toBe("true");

    rerender({ roleFilter: ["Teacher"] });
    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(2));
    expect(staffApi.list.mock.calls[1][0].includeFacets).toBe("true");
    expect(staffApi.list.mock.calls[1][0].role).toEqual(["Teacher"]);
  });

  it("maps segmented filter 'today' to today=true and 'active' to status=active", async () => {
    const { rerender } = renderHook(
      ({ filter }) =>
        useStaffList({
          q: "",
          filter,
          roleFilter: [],
          departmentFilter: "all",
          employmentTypeFilter: "all",
          genderFilter: "all",
          page: 1,
          pageSize: 25,
        }),
      { initialProps: { filter: "all" } }
    );

    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(1));
    expect(staffApi.list.mock.calls[0][0].today).toBeUndefined();
    expect(staffApi.list.mock.calls[0][0].status).toBeUndefined();

    rerender({ filter: "today" });
    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(2));
    expect(staffApi.list.mock.calls[1][0].today).toBe("true");
    expect(staffApi.list.mock.calls[1][0].status).toBeUndefined();

    rerender({ filter: "active" });
    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(3));
    expect(staffApi.list.mock.calls[2][0].today).toBeUndefined();
    expect(staffApi.list.mock.calls[2][0].status).toBe("active");
  });

  it("clamps page back into range when the server reports fewer pages", async () => {
    staffApi.list.mockResolvedValueOnce({
      data: [],
      pagination: { page: 5, limit: 25, total: 0, totalPages: 1 },
    });

    const { result } = renderHook(() =>
      useStaffList({
        q: "",
        filter: "all",
        roleFilter: [],
        departmentFilter: "all",
        employmentTypeFilter: "all",
        genderFilter: "all",
        page: 5, // out of range — server has only 1 page
        pageSize: 25,
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.clampedPage).toBe(1);
  });

  it("aborts the in-flight request on unmount (AbortController signal passed through)", async () => {
    // Hold the request open so we can observe the unmount abort.
    let resolveList;
    staffApi.list.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        })
    );

    const { unmount } = renderHook(() =>
      useStaffList({
        q: "",
        filter: "all",
        roleFilter: [],
        departmentFilter: "all",
        employmentTypeFilter: "all",
        genderFilter: "all",
        page: 1,
        pageSize: 25,
      })
    );

    await waitFor(() => expect(staffApi.list).toHaveBeenCalledTimes(1));
    const [, opts] = staffApi.list.mock.calls[0];
    expect(opts.signal).toBeInstanceOf(AbortSignal);
    expect(opts.signal.aborted).toBe(false);

    unmount();

    // The cleanup function aborts the controller tied to this fetch.
    expect(opts.signal.aborted).toBe(true);

    // Allow the dangling promise to settle so vitest doesn't hang.
    resolveList(EMPTY_RESPONSE);
  });

  it("normalizes missing facets into the empty facet shape (no undefined keys)", async () => {
    // Backend omits facets entirely (includeFacets=false branch).
    staffApi.list.mockResolvedValueOnce({
      data: [{ _id: "s1" }],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() =>
      useStaffList({
        q: "",
        filter: "all",
        roleFilter: [],
        departmentFilter: "all",
        employmentTypeFilter: "all",
        genderFilter: "all",
        page: 1,
        pageSize: 25,
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.facets).toEqual({
      role: [],
      department: [],
      employmentType: [],
      gender: [],
    });
  });
});
