/**
 * @vitest-environment jsdom
 *
 * Regression test for PERF-07.
 *
 * The two app-context queries (appDataQuery / settingsDataQuery) hydrate the
 * entire domain dataset (staff + classes + sometimes all students) and feed
 * every domain context. They used to inherit the global queryClient defaults
 * (refetchOnWindowFocus:true, staleTime:30s), so every tab refocus re-fetched
 * the whole dataset, replaced all domain arrays, and triggered a full
 * context-cascade re-render.
 *
 * The fix opts these two queries out of focus-refetch (refetchOnWindowFocus:
 * false) and lengthens their staleTime. This test mounts AppProvider behind a
 * QueryClient whose DEFAULTS deliberately enable focus-refetch with staleTime:0
 * — so the only reason a window refocus does not re-run the fetch is the
 * per-query opt-out in AppContext.jsx. Remove that opt-out and this test fails.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { AppProvider } from "./AppContext";

// Shared spies for the two app-context fetchers (hoisted so vi.mock can use them).
const { fetchAppSpy, fetchSettingsSpy } = vi.hoisted(() => ({
  fetchAppSpy: vi.fn(),
  fetchSettingsSpy: vi.fn(),
}));

vi.mock("./appContextHelpers", async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    // Keep students out of scope so the lazy-load effect stays quiet.
    shouldHydrateStudentsForPath: () => false,
    fetchRoleAwareAppData: fetchAppSpy,
    fetchAppSettingsData: fetchSettingsSpy,
  };
});

// No socket side effects in the test.
vi.mock("./hooks/useSocketSync", () => ({ useSocketSync: () => {} }));

// A logged-in, non-super-admin user so the queries are enabled.
vi.mock("../utils/authSession", () => ({
  getStoredUser: () => ({ id: "u1", schoolId: "s1", role: "admin" }),
  clearStoredUser: () => {},
}));

vi.mock("../utils/roleUtils", () => ({ isSuperAdminRole: () => false }));

vi.mock("react-i18next", async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key, def) =>
        typeof def === "string" ? def : def?.defaultValue ?? key,
      i18n: { language: "en", changeLanguage: () => {} },
    }),
  };
});

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

function renderApp() {
  // Defaults intentionally hostile to PERF-07: focus-refetch ON, instantly stale.
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: true,
        staleTime: 0,
        gcTime: Infinity,
      },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AppProvider>
          <div>child</div>
        </AppProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("PERF-07 — app-context queries opt out of focus-refetch", () => {
  beforeEach(() => {
    fetchAppSpy.mockReset();
    fetchSettingsSpy.mockReset();
    fetchAppSpy.mockResolvedValue({
      staff: [],
      classes: [],
      staffAttendance: {},
      includeStudents: false,
    });
    fetchSettingsSpy.mockResolvedValue({});
    focusManager.setFocused(true);
  });

  afterEach(() => {
    cleanup();
  });

  it("does not re-fetch the whole dataset when the tab is refocused", async () => {
    renderApp();

    // Initial hydration: each fetcher runs exactly once.
    await waitFor(() => expect(fetchAppSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(fetchSettingsSpy).toHaveBeenCalledTimes(1));

    // Simulate the user blurring and refocusing the tab.
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      // Give react-query a chance to act on the focus signal.
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // The per-query refetchOnWindowFocus:false must suppress the refetch even
    // though the QueryClient default would otherwise refetch a stale query.
    expect(fetchAppSpy).toHaveBeenCalledTimes(1);
    expect(fetchSettingsSpy).toHaveBeenCalledTimes(1);
  });
});
