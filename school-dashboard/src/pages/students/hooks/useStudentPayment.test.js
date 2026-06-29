/**
 * @vitest-environment jsdom
 *
 * Regression coverage for PAG-26: recording a fee payment must invalidate the
 * Fees page queries (['fees-payments'] list + ['fees-summary'] KPIs) so they
 * stop serving pre-payment data until the cache happens to go stale.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal()),
  useTranslation: () => ({ t: (_key, fallback) => fallback ?? _key }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => "loading-toast-id"),
  },
}));

vi.mock("../../../utils/logger", () => ({
  default: { error: vi.fn() },
}));

vi.mock("../../../services/api", () => ({
  studentFeesApi: { recordPayment: vi.fn() },
}));

import { studentFeesApi } from "../../../services/api";
import toast from "react-hot-toast";
import { useStudentPayment } from "./useStudentPayment";

function makeHarness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }) =>
    createElement(QueryClientProvider, { client }, children);
  return { client, invalidateSpy, wrapper };
}

const FEE_STRUCTURE = {
  totalBalance: 1000,
  feeHeads: [{ feeHeadId: "fh1", balanceAmount: 1000 }],
};

describe("useStudentPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    studentFeesApi.recordPayment.mockResolvedValue({ success: true });
  });

  it("invalidates the fees-payments and fees-summary queries after a payment", async () => {
    const { invalidateSpy, wrapper } = makeHarness();
    const refetchFeeStructure = vi.fn().mockResolvedValue(undefined);
    const refetchStudent = vi.fn().mockResolvedValue(undefined);
    const feeHistoryRefetch = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useStudentPayment("student-1", {
          currentAcademicYear: "2025-2026",
          studentFeeStructure: FEE_STRUCTURE,
          refetchFeeStructure,
          refetchStudent,
          feeHistoryRefetch,
        }),
      { wrapper }
    );

    act(() => {
      result.current.setPaymentForm((prev) => ({ ...prev, amount: "500" }));
    });

    await act(async () => {
      await result.current.handleRecordPayment();
    });

    await waitFor(() =>
      expect(studentFeesApi.recordPayment).toHaveBeenCalledTimes(1)
    );

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([arg]) => arg?.queryKey?.[0]
    );
    expect(invalidatedKeys).toContain("fees-payments");
    expect(invalidatedKeys).toContain("fees-summary");
    // The pre-existing app-context invalidation must still fire too.
    expect(invalidatedKeys).toContain("app-context-data");
    expect(toast.success).toHaveBeenCalled();
  });

  it("does not record or invalidate when the amount is missing", async () => {
    const { invalidateSpy, wrapper } = makeHarness();

    const { result } = renderHook(
      () =>
        useStudentPayment("student-1", {
          currentAcademicYear: "2025-2026",
          studentFeeStructure: FEE_STRUCTURE,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleRecordPayment();
    });

    expect(studentFeesApi.recordPayment).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
