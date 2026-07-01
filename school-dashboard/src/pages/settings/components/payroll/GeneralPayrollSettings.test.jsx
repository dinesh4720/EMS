/**
 * @vitest-environment jsdom
 *
 * Regression tests for DS-02 (SCH-149).
 *
 * GeneralPayrollSettings used to render the Schedule/Payment/Reminder cards with
 * their DEFAULT values during the initial fetch (no skeleton), and its fetch
 * `catch` only logged the error and flipped `initialLoad` off — so a failed
 * fetch silently showed fabricated defaults (monthly / bank_transfer / 3-day
 * reminder) as if they were the school's real, saved settings.
 *
 * These tests assert the four-state rule:
 *  - loading → skeleton cards (role="status"), never the settings cards
 *  - error   → ErrorState with a Retry, never fabricated defaults
 *  - retry   → re-fetches and recovers to the success view
 *  - success → the real settings cards
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback ?? key }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const getPayrollSettings = vi.fn();
vi.mock("../../../../services/api", () => ({
  settingsApi: {
    getPayrollSettings: (...args) => getPayrollSettings(...args),
    updatePayrollSettings: vi.fn(),
  },
}));

// Stub the child cards so the success assertion is about THIS component's
// state machine, not the cards' internals.
vi.mock("./ScheduleCard", () => ({ default: () => <div data-testid="schedule-card" /> }));
vi.mock("./PaymentMethodCard", () => ({ default: () => <div data-testid="payment-card" /> }));
vi.mock("./RemindersCard", () => ({ default: () => <div data-testid="reminders-card" /> }));
vi.mock("./AccessPermissionsCard", () => ({ default: () => <div data-testid="access-card" /> }));

import GeneralPayrollSettings from "./GeneralPayrollSettings";

const OK = {
  data: { disburseDate: 5, payrollCycle: "monthly", paymentMethod: "bank_transfer" },
};

// A rejected promise the component will receive (and catch), with a no-op
// handler attached so Node's global unhandled-rejection detector stays quiet —
// the component owns the rejection, this just silences the false positive.
const rejects = (msg) => () => {
  const p = Promise.reject(new Error(msg));
  p.catch(() => {});
  return p;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
beforeEach(() => getPayrollSettings.mockReset());

describe("GeneralPayrollSettings — DS-02 loading/error states", () => {
  it("renders skeleton cards while loading, not the settings cards", async () => {
    let resolve;
    getPayrollSettings.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<GeneralPayrollSettings />);

    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("schedule-card")).not.toBeInTheDocument();

    // settle so no pending promise dangles into the next test
    resolve(OK);
    await screen.findByTestId("schedule-card");
  });

  it("shows an error state with Retry on fetch failure — not fabricated defaults", async () => {
    getPayrollSettings.mockImplementationOnce(rejects("500"));
    render(<GeneralPayrollSettings />);

    expect(
      await screen.findByText(/Failed to load payroll settings/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    // The bug: a failed fetch must NOT render the settings cards (fake defaults).
    expect(screen.queryByTestId("schedule-card")).not.toBeInTheDocument();
  });

  it("recovers to the success view when Retry succeeds", async () => {
    getPayrollSettings
      .mockImplementationOnce(rejects("500"))
      .mockImplementationOnce(() => Promise.resolve(OK));
    render(<GeneralPayrollSettings />);

    const retry = await screen.findByRole("button", { name: /retry/i });
    fireEvent.click(retry);

    expect(await screen.findByTestId("schedule-card")).toBeInTheDocument();
    expect(screen.queryByText(/Failed to load payroll settings/i)).not.toBeInTheDocument();
    expect(getPayrollSettings).toHaveBeenCalledTimes(2);
  });

  it("renders the settings cards on a successful initial fetch", async () => {
    getPayrollSettings.mockResolvedValue(OK);
    render(<GeneralPayrollSettings />);

    expect(await screen.findByTestId("schedule-card")).toBeInTheDocument();
    expect(screen.getByTestId("payment-card")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryAllByRole("status")).toHaveLength(0));
  });
});
