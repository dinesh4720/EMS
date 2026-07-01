/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../services/api", () => ({
  hostelApi: { getHostels: vi.fn(), getRooms: vi.fn() },
  studentsApi: { list: vi.fn() },
}));

import { hostelApi, studentsApi } from "../services/api";
import { useHostelLookups } from "./useHostelLookups";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe("useHostelLookups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hostelApi.getHostels.mockResolvedValue({ hostels: [{ _id: "h1", name: "Block A" }] });
    hostelApi.getRooms.mockResolvedValue({ rooms: [{ _id: "r1", number: "101" }] });
    studentsApi.list.mockResolvedValue({ data: [{ _id: "s1", name: "Asha" }] });
  });

  it("loads the hostel list on mount", async () => {
    const { result } = renderHook(() => useHostelLookups(undefined, ""), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.hostels).toHaveLength(1));
    expect(result.current.hostels[0].name).toBe("Block A");
  });

  it("does not load rooms until a hostel is selected", async () => {
    const { result } = renderHook(() => useHostelLookups(undefined, ""), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.hostels).toHaveLength(1));
    expect(result.current.rooms).toEqual([]);
    expect(hostelApi.getRooms).not.toHaveBeenCalled();
  });

  it("loads available rooms for the selected hostel", async () => {
    const { result } = renderHook(() => useHostelLookups("h1", ""), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.rooms).toHaveLength(1));
    expect(hostelApi.getRooms).toHaveBeenCalledWith({ hostelId: "h1", available: true });
  });

  it("does not load filter rooms until a filter hostel is selected", async () => {
    const { result } = renderHook(() => useHostelLookups(undefined, "", ""), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.hostels).toHaveLength(1));
    expect(result.current.filterRooms).toEqual([]);
    expect(hostelApi.getRooms).not.toHaveBeenCalled();
  });

  it("loads ALL rooms (not just available) for the filter hostel (PAG-20)", async () => {
    const { result } = renderHook(() => useHostelLookups(undefined, "", "h1"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.filterRooms).toHaveLength(1));
    expect(hostelApi.getRooms).toHaveBeenCalledWith({ hostelId: "h1" });
  });

  it("does not search students for terms shorter than 2 characters", async () => {
    const { result } = renderHook(() => useHostelLookups(undefined, "a"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.hostels).toHaveLength(1));
    expect(result.current.students).toEqual([]);
    expect(studentsApi.list).not.toHaveBeenCalled();
  });

  it("runs a debounced student search for terms of 2+ characters", async () => {
    const { result } = renderHook(() => useHostelLookups(undefined, "asha"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(studentsApi.list).toHaveBeenCalledWith({ search: "asha", limit: 30 }));
    await waitFor(() => expect(result.current.students).toHaveLength(1));
    expect(result.current.students[0].name).toBe("Asha");
  });
});
