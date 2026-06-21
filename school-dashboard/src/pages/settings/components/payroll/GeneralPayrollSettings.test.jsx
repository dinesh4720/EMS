/**
 * @vitest-environment jsdom
 *
 * Regression tests for DS-02: PayrollSettings had no loading or error UI on the
 * initial fetch. Before the fix, GeneralPayrollSettings rendered the settings
 * cards seeded with hard-coded defaults (monthly / bank_transfer / 3-day
 * reminder) while the fetch was still in flight, and a failed fetch was
 * silently swallowed — leaving those fake defaults on screen as if they were
 * the saved configuration the admin could re-save.
 *
 * These tests assert the three render states:
 *   1. skeleton while the initial fetch is pending (no default-valued cards),
 *   2. the real cards once the fetch resolves,
 *   3. an ErrorState (with a working Retry) when the fetch rejects.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

// i18n: identity translator so assertions read against keys/literal copy.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

// toast + logger are side-effect only; stub them out.
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../../../utils/logger", () => ({ default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

// Mock the HeroUI-based child cards down to simple markers so the test
// exercises GeneralPayrollSettings' own load/error branching, not the cards.
vi.mock("./ScheduleCard", () => ({ default: () => <div data-testid="schedule-card" /> }));
vi.mock("./PaymentMethodCard", () => ({ default: () => <div data-testid="payment-card" /> }));
vi.mock("./RemindersCard", () => ({ default: () => <div data-testid="reminders-card" /> }));
vi.mock("./AccessPermissionsCard", () => ({ default: () => <div data-testid="access-card" /> }));

// The fetch under test.
vi.mock("../../../../services/api", () => ({
  settingsApi: { getPayrollSettings: vi.fn(), updatePayrollSettings: vi.fn() },
}));

import { settingsApi } from "../../../../services/api";
import GeneralPayrollSettings from "./GeneralPayrollSettings";

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("GeneralPayrollSettings — DS-02 loading/error states", () => {
  it("shows a skeleton (not default-valued cards) while the initial fetch is pending", () => {
    // A never-resolving promise keeps the component in its initialLoad state.
    settingsApi.getPayrollSettings.mockReturnValue(new Promise(() => {}));

    render(<GeneralPayrollSettings />);

    expect(screen.getByRole("status", { name: /loading payroll settings/i })).toBeTruthy();
    // The real settings cards must NOT render their default values during load.
    expect(screen.queryByTestId("schedule-card")).toBeNull();
    expect(screen.queryByTestId("payment-card")).toBeNull();
  });

  it("renders the settings cards once the fetch resolves", async () => {
    settingsApi.getPayrollSettings.mockResolvedValue({
      data: { disburseDate: 15, payrollCycle: "monthly", paymentMethod: "bank_transfer" },
    });

    render(<GeneralPayrollSettings />);

    expect(await screen.findByTestId("schedule-card")).toBeTruthy();
    expect(screen.getByTestId("payment-card")).toBeTruthy();
    expect(screen.getByTestId("reminders-card")).toBeTruthy();
    // Skeleton is gone.
    expect(screen.queryByRole("status", { name: /loading payroll settings/i })).toBeNull();
  });

  it("shows an ErrorState with a working Retry when the fetch fails", async () => {
    settingsApi.getPayrollSettings
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ data: { disburseDate: 10, payrollCycle: "monthly" } });

    render(<GeneralPayrollSettings />);

    // Error UI replaces the (would-be) default-valued cards.
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/couldn't load payroll settings/i)).toBeTruthy();
    expect(screen.queryByTestId("schedule-card")).toBeNull();

    // Retry re-runs the fetch; the second call succeeds and the cards appear.
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByTestId("schedule-card")).toBeTruthy();
    await waitFor(() => expect(settingsApi.getPayrollSettings).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
