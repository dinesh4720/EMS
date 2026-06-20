/**
 * @vitest-environment jsdom
 *
 * Regression tests for DS-01 (SCH-148).
 *
 * Previously ParentManagement rendered a text-only "Loading…" cell and
 * SWALLOWED fetch failures (only logging them), so a failed API call fell
 * through to the empty branch and showed "No parent accounts found" — telling
 * admins their parent accounts had vanished when the request had merely failed.
 *
 * These tests assert the four-state rule for the table:
 *  - loading  → skeleton (aria-busy), never the empty copy
 *  - error    → ErrorState with a retry, never the empty copy
 *  - empty    → the empty copy only when the fetch genuinely returns no rows
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";

// t(key, fallback) → fallback (or key) so we can assert on stable copy without
// booting the real i18n instance.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback ?? key }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../i18n/index", () => ({ getDateLocale: () => "en-US" }));

const getAll = vi.fn();
vi.mock("../../services/api", () => ({
  parentApi: {
    getAll: (...args) => getAll(...args),
    getById: vi.fn(),
    resetPassword: vi.fn(),
    updateStatus: vi.fn(),
    bulkCreate: vi.fn(),
  },
}));

import ParentManagement from "./ParentManagement";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  getAll.mockReset();
});

describe("ParentManagement — DS-01 loading/error states", () => {
  it("shows a loading skeleton on first paint, not the empty copy", () => {
    // Never resolve, so the component stays in the loading state.
    getAll.mockReturnValue(new Promise(() => {}));
    render(<ParentManagement />);

    expect(screen.getByLabelText(/loading table/i)).toBeInTheDocument();
    expect(screen.queryByText(/No parent accounts found/i)).not.toBeInTheDocument();
  });

  it("shows an error state with retry when the fetch fails — not 'no data'", async () => {
    getAll.mockRejectedValue(new Error("network down"));
    render(<ParentManagement />);

    expect(
      await screen.findByText(/Failed to load parent accounts/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    // The bug: a failed fetch must NOT masquerade as an empty result.
    expect(screen.queryByText(/No parent accounts found/i)).not.toBeInTheDocument();
  });

  it("treats success:false the same as a failure", async () => {
    getAll.mockResolvedValue({ success: false, message: "forbidden" });
    render(<ParentManagement />);

    expect(
      await screen.findByText(/Failed to load parent accounts/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No parent accounts found/i)).not.toBeInTheDocument();
  });

  it("shows the empty copy only when the fetch genuinely returns no rows", async () => {
    getAll.mockResolvedValue({
      success: true,
      data: { parents: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
    });
    render(<ParentManagement />);

    // The mocked t() returns the raw key when no fallback is supplied, so the
    // empty copy renders as the "noParentAccountsFound" key here.
    expect(
      await screen.findByText(/noParentAccountsFound|No parent accounts found/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Failed to load parent accounts/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/loading table/i)).not.toBeInTheDocument();
  });
});
