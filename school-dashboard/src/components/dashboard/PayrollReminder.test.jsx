/**
 * @vitest-environment jsdom
 *
 * Regression coverage for the fetch cancellation guard (MEM-17): a payroll
 * reminder request still in flight when the component unmounts must not apply
 * state or fire a toast once it resolves.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

vi.mock("../../services/api", () => ({
  settingsApi: { getPayrollReminder: vi.fn() },
}));

vi.mock("react-hot-toast", () => ({
  default: { custom: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("../../utils/logger", () => ({
  default: { error: vi.fn() },
}));

import { settingsApi } from "../../services/api";
import toast from "react-hot-toast";
import PayrollReminder from "./PayrollReminder";

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const flushMicrotasks = () => new Promise((done) => setTimeout(done, 0));

function renderReminder() {
  return render(
    <MemoryRouter>
      <PayrollReminder />
    </MemoryRouter>
  );
}

describe("PayrollReminder — fetch cancellation guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fires the reminder toast when the fetch resolves while mounted", async () => {
    settingsApi.getPayrollReminder.mockResolvedValue({
      shouldShow: true,
      message: "Payday is approaching",
    });

    renderReminder();

    await waitFor(() => expect(toast.custom).toHaveBeenCalledTimes(1));
  });

  it("ignores a response that resolves after unmount (no stale toast)", async () => {
    const pending = deferred();
    settingsApi.getPayrollReminder.mockReturnValue(pending.promise);

    const { unmount } = renderReminder();

    // Unmount while the request is still in flight, then resolve it.
    unmount();
    pending.resolve({ shouldShow: true, message: "Payday is approaching" });
    await flushMicrotasks();

    expect(toast.custom).not.toHaveBeenCalled();
  });
});
