/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  usePaginatedQuery,
  normalizePaginatedResponse,
} from "./usePaginatedQuery";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) =>
    createElement(QueryClientProvider, { client }, children);
}

function pageResponse({ page = 1, limit = 20, total = 50, data } = {}) {
  return {
    data: data ?? Array.from({ length: Math.min(limit, total - (page - 1) * limit) }, (_, i) => ({
      _id: `r-${page}-${i}`,
      n: (page - 1) * limit + i,
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("normalizePaginatedResponse", () => {
  it("passes through canonical { data, pagination } shape", () => {
    const upstream = pageResponse({ page: 2, limit: 10, total: 25 });
    const out = normalizePaginatedResponse(upstream, { page: 2, limit: 10 });
    expect(out.data).toBe(upstream.data);
    expect(out.pagination.totalItems).toBe(25);
    expect(out.pagination.totalPages).toBe(3);
    expect(out.pagination.hasNextPage).toBe(true);
    expect(out.pagination.hasPrevPage).toBe(true);
  });

  it("synthesizes pagination from a bare array", () => {
    const out = normalizePaginatedResponse([1, 2, 3, 4, 5], { page: 1, limit: 20 });
    expect(out.data).toEqual([1, 2, 3, 4, 5]);
    expect(out.pagination.totalItems).toBe(5);
    expect(out.pagination.totalPages).toBe(1);
    expect(out.pagination.hasNextPage).toBe(false);
    expect(out.pagination.hasPrevPage).toBe(false);
  });

  it("marks hasNextPage when a bare array exceeds limit", () => {
    const arr = Array.from({ length: 30 }, (_, i) => i);
    const out = normalizePaginatedResponse(arr, { page: 1, limit: 20 });
    expect(out.pagination.totalPages).toBe(2);
    expect(out.pagination.hasNextPage).toBe(true);
  });

  it("returns empty data + single page for null", () => {
    const out = normalizePaginatedResponse(null, { page: 1, limit: 20 });
    expect(out.data).toEqual([]);
    expect(out.pagination.totalPages).toBe(1);
  });

  it("synthesizes pagination when data is present but pagination block is missing", () => {
    const out = normalizePaginatedResponse(
      { data: [1, 2, 3] },
      { page: 1, limit: 20 }
    );
    expect(out.data).toEqual([1, 2, 3]);
    expect(out.pagination.totalItems).toBe(3);
    expect(out.pagination.totalPages).toBe(1);
  });
});

describe("usePaginatedQuery", () => {
  it("returns isLoading=true on first render and items once resolved", async () => {
    const queryFn = vi.fn().mockResolvedValue(pageResponse({ page: 1, total: 5 }));

    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "list"],
          queryFn,
          limit: 20,
        }),
      { wrapper: makeWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toEqual([]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(5);
    expect(result.current.totalItems).toBe(5);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.isError).toBe(false);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPrevPage).toBe(false);
  });

  it("passes page, limit, and signal through to queryFn", async () => {
    const queryFn = vi.fn().mockResolvedValue(pageResponse({ page: 2, total: 100, limit: 10 }));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "list"],
          queryFn,
          page: 2,
          limit: 10,
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryFn).toHaveBeenCalledTimes(1);
    const [params] = queryFn.mock.calls[0];
    expect(params.page).toBe(2);
    expect(params.limit).toBe(10);
    expect(params.signal).toBeInstanceOf(AbortSignal);
  });

  it("merges filters into both queryKey and queryFn params", async () => {
    const queryFn = vi.fn().mockResolvedValue(pageResponse({ total: 0 }));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "list"],
          queryFn,
          filters: { search: "aarav", status: "active" },
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const [params] = queryFn.mock.calls[0];
    expect(params.search).toBe("aarav");
    expect(params.status).toBe("active");
  });

  it("exposes pagination booleans and isEmpty correctly", async () => {
    const queryFn = vi.fn().mockResolvedValue(pageResponse({ total: 0 }));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "empty"],
          queryFn,
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(0);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.totalItems).toBe(0);
  });

  it("setPage clamps to >= 1 and re-fetches", async () => {
    const queryFn = vi.fn().mockImplementation(({ page }) => pageResponse({ page, total: 50 }));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "pager"],
          queryFn,
          limit: 10,
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPage(0));
    expect(result.current.page).toBe(1);

    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.page).toBe(3));
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPrevPage).toBe(true);
  });

  it("nextPage / prevPage move within bounds", async () => {
    const queryFn = vi.fn().mockImplementation(({ page }) => pageResponse({ page, total: 50 }));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "nav"],
          queryFn,
          limit: 10,
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.page).toBe(1);
    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.page).toBe(2));
    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.page).toBe(3));
    act(() => result.current.prevPage());
    await waitFor(() => expect(result.current.page).toBe(2));
  });

  it("setLimit resets page to 1", async () => {
    const queryFn = vi.fn().mockImplementation(({ page }) => pageResponse({ page, total: 100 }));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "limit"],
          queryFn,
          page: 3,
          limit: 10,
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.page).toBe(3);

    act(() => result.current.setLimit(25));
    await waitFor(() => expect(result.current.limit).toBe(25));
    expect(result.current.page).toBe(1);
  });

  it("setFilters replaces filters and resets page to 1", async () => {
    const queryFn = vi.fn().mockImplementation(({ page, search }) => pageResponse({ page, total: 100 }));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "filters"],
          queryFn,
          page: 4,
          filters: { search: "" },
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.page).toBe(4);

    act(() => result.current.setFilters({ search: "riya" }));
    await waitFor(() => expect(result.current.page).toBe(1));
    const [params] = queryFn.mock.calls[queryFn.mock.calls.length - 1];
    expect(params.search).toBe("riya");
  });

  it("exposes isError and error when queryFn rejects", async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "err"],
          queryFn,
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("boom");
    expect(result.current.items).toEqual([]);
  });

  it("applies select to lift a sub-field into items", async () => {
    const queryFn = vi.fn().mockResolvedValue({
      hostels: [
        { _id: "h1", name: "Block A" },
        { _id: "h2", name: "Block B" },
      ],
    });
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "select"],
          queryFn,
          select: (res) => res.hostels,
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // select() lifted `hostels` to the response root. The wrapper sees a bare
    // array and synthesizes single-page pagination from its length.
    expect(result.current.items).toEqual([
      { _id: "h1", name: "Block A" },
      { _id: "h2", name: "Block B" },
    ]);
    expect(result.current.totalItems).toBe(2);
  });

  it("treats enabled=false as not fetching", async () => {
    const queryFn = vi.fn().mockResolvedValue(pageResponse({ total: 0 }));
    const { result } = renderHook(
      () =>
        usePaginatedQuery({
          queryKey: ["t", "disabled"],
          queryFn,
          enabled: false,
        }),
      { wrapper: makeWrapper() }
    );

    // Wait a tick to let any state settle.
    await new Promise((r) => setTimeout(r, 10));
    expect(queryFn).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
