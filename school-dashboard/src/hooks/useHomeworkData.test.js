/**
 * @vitest-environment jsdom
 *
 * Unit tests for the PAG-08 homework data hook. Verifies the pure helpers
 * (buildHomeworkListParams, buildHomeworkStatsParams, computeHomeworkStats)
 * and the hook's wiring of the two TanStack queries.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useHomeworkData, {
  buildHomeworkListParams,
  buildHomeworkStatsParams,
  computeHomeworkStats,
} from "./useHomeworkData";
import { homeworkApi } from "../services/api";

// Mock the API module so we can capture calls and return deterministic data.
vi.mock("../services/api", () => ({
  homeworkApi: {
    getAll: vi.fn(),
    getStats: vi.fn(),
  },
}));

// Stable "future" / "past" timestamps so the overdue calc is deterministic.
const future = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const past = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) =>
    createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildHomeworkListParams", () => {
  it("includes page, limit and any non-all filter values", () => {
    expect(
      buildHomeworkListParams({ page: 2, limit: 25, status: "active", classId: "cls1" }),
    ).toEqual({ page: 2, limit: 25, status: "active", classId: "cls1" });
  });

  it("omits 'all' status and classId (no point sending the wildcard to the server)", () => {
    expect(buildHomeworkListParams({ page: 1, limit: 25, status: "all", classId: "all" })).toEqual({
      page: 1,
      limit: 25,
    });
  });

  it("trims and includes search, and omits blank search", () => {
    expect(buildHomeworkListParams({ page: 1, limit: 25, search: "  algebra  " }).search).toBe(
      "algebra",
    );
    expect(buildHomeworkListParams({ page: 1, limit: 25, search: "   " })).not.toHaveProperty(
      "search",
    );
  });

  it("defaults page and limit when called with no args", () => {
    expect(buildHomeworkListParams()).toEqual({ page: 1, limit: 25 });
  });
});

describe("buildHomeworkStatsParams", () => {
  it("omits page/limit (stats endpoint ignores them) but keeps the same filters", () => {
    expect(buildHomeworkStatsParams({ search: "x", status: "active" })).toEqual({
      search: "x",
      status: "active",
    });
  });
});

describe("computeHomeworkStats", () => {
  const hw = (overrides) => ({
    _id: Math.random().toString(),
    status: "active",
    dueDate: future(3),
    ...overrides,
  });

  it("tallies by status and marks active+past-due as overdue", () => {
    const list = [
      hw({ status: "active", dueDate: future(3) }),
      hw({ status: "active", dueDate: past(1) }),
      hw({ status: "completed", dueDate: past(2) }),
      hw({ status: "cancelled", dueDate: past(2) }),
    ];
    const stats = computeHomeworkStats(list);
    expect(stats).toEqual({ total: 4, active: 2, completed: 1, cancelled: 1, overdue: 1 });
  });

  it("returns zeros for an empty list", () => {
    expect(computeHomeworkStats([])).toEqual({
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
    });
  });

  it("tolerates non-array input without throwing", () => {
    expect(computeHomeworkStats(null)).toEqual({
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
    });
  });
});

describe("useHomeworkData hook", () => {
  it("fetches the list and the stats in parallel and exposes both", async () => {
    homeworkApi.getAll.mockResolvedValue({
      data: [{ _id: "h1", status: "active", dueDate: future(1) }],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
    homeworkApi.getStats.mockResolvedValue({
      total: 5,
      active: 3,
      completed: 1,
      cancelled: 0,
      overdue: 1,
    });

    const { result } = renderHook(
      () => useHomeworkData({ page: 1, limit: 25, search: "" }),
      { wrapper: makeWrapper() },
    );

    // TanStack Query resolves on a microtask. Yielding once before the
    // waitFor is enough to let the data flow back to result.current.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await waitFor(() => result.current.isLoading === false, { timeout: 2000 });
    expect(result.current.homework).toHaveLength(1);
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 25,
      total: 1,
      totalPages: 1,
    });
    expect(result.current.stats).toEqual({
      total: 5,
      active: 3,
      completed: 1,
      cancelled: 0,
      overdue: 1,
    });
  });

  it("falls back to a client-side stats compute when the stats endpoint has no data yet", async () => {
    const list = [
      { _id: "h1", status: "active", dueDate: future(1) },
      { _id: "h2", status: "active", dueDate: past(2) },
      { _id: "h3", status: "completed", dueDate: past(3) },
    ];
    homeworkApi.getAll.mockResolvedValue({ data: list, pagination: null });
    homeworkApi.getStats.mockResolvedValue({}); // empty body — treated as no data

    const { result } = renderHook(() => useHomeworkData({ page: 1, limit: 25 }), {
      wrapper: makeWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await waitFor(() => result.current.homework.length > 0, { timeout: 2000 });
    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.active).toBe(2);
    expect(result.current.stats.completed).toBe(1);
    expect(result.current.stats.overdue).toBe(1);
  });

  it("forwards the list query key with the page/limit/search filters", async () => {
    homeworkApi.getAll.mockResolvedValue({ data: [], pagination: null });
    homeworkApi.getStats.mockResolvedValue({});

    renderHook(
      () => useHomeworkData({ page: 2, limit: 50, search: "algebra", status: "active" }),
      { wrapper: makeWrapper() },
    );

    // Wait a tick for the queries to fire.
    await new Promise((resolve) => setTimeout(resolve, 10));

    // homeworkApi.getAll receives a params object (it builds the URL itself),
    // so the first call arg is the object the hook passed in.
    expect(homeworkApi.getAll.mock.calls.length).toBeGreaterThan(0);
    const listParams = homeworkApi.getAll.mock.calls[0][0];
    expect(listParams).toMatchObject({
      page: 2,
      limit: 50,
      search: "algebra",
      status: "active",
    });

    expect(homeworkApi.getStats.mock.calls.length).toBeGreaterThan(0);
    const statsParams = homeworkApi.getStats.mock.calls[0][0];
    expect(statsParams).toMatchObject({ search: "algebra", status: "active" });
    // Stats endpoint does not accept page/limit
    expect(statsParams).not.toHaveProperty("page");
    expect(statsParams).not.toHaveProperty("limit");
  });
});
