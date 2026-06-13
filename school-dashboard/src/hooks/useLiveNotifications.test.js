/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../services/api", () => ({
  notificationsApi: { getUnreadCount: vi.fn() },
}));

import { notificationsApi } from "../services/api";
import { useLiveNotifications } from "./useLiveNotifications";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe("useLiveNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onCountChange with the fetched unread count", async () => {
    notificationsApi.getUnreadCount.mockResolvedValue({ count: 7 });
    const onCountChange = vi.fn();

    renderHook(() => useLiveNotifications({ onCountChange }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(onCountChange).toHaveBeenCalledWith(7));
  });

  it("does not fetch while paused", async () => {
    notificationsApi.getUnreadCount.mockResolvedValue({ count: 3 });
    const onCountChange = vi.fn();

    renderHook(() => useLiveNotifications({ onCountChange, paused: true }), {
      wrapper: makeWrapper(),
    });

    // Give any (incorrect) async fetch a chance to fire before asserting.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(notificationsApi.getUnreadCount).not.toHaveBeenCalled();
    expect(onCountChange).not.toHaveBeenCalled();
  });

  it("falls back to 0 when the request fails", async () => {
    notificationsApi.getUnreadCount.mockRejectedValue(new Error("boom"));
    const onCountChange = vi.fn();

    renderHook(() => useLiveNotifications({ onCountChange }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(onCountChange).toHaveBeenCalledWith(0));
  });
});
