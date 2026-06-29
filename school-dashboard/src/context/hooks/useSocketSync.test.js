/**
 * @vitest-environment jsdom
 *
 * Regression coverage for MEM-08: the unmount race between the effect cleanup
 * and the dynamic import() of socketServiceEnhanced.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Shared mock singleton — mirrors the parts of socketServiceEnhanced the hook touches.
const mockService = vi.hoisted(() => ({
  connect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}));

const { getStoredUser } = vi.hoisted(() => ({ getStoredUser: vi.fn() }));

vi.mock("../../services/socketServiceEnhanced", () => ({ default: mockService }));
vi.mock("../../utils/authSession", () => ({ getStoredUser }));
vi.mock("../../utils/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useSocketSync } from "./useSocketSync";

// All 8 events the hook subscribes to.
const EVENTS = [
  "connect_error",
  "error",
  "staff_updated",
  "student_updated",
  "class_updated",
  "attendance_updated",
  "fee_payment_created",
  "student_created",
];

function makeProps(userId = "user-1") {
  return {
    userId,
    staff: [],
    updateStaffLocal: vi.fn(),
    updateStudentLocal: vi.fn(),
    updateClassLocal: vi.fn(),
    setStaffAttendance: vi.fn(),
    syncFeePaymentLocal: vi.fn(),
    setStudents: vi.fn(),
  };
}

// Drain microtasks (dynamic import resolution) plus a macrotask, so any pending
// import().then() has definitely had the chance to run.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useSocketSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoredUser.mockReturnValue({ id: "user-1" });
  });

  it("does nothing when there is no stored user", async () => {
    getStoredUser.mockReturnValue(null);
    renderHook(() => useSocketSync(makeProps()));
    await flush();
    expect(mockService.connect).not.toHaveBeenCalled();
    expect(mockService.on).not.toHaveBeenCalled();
  });

  it("connects and registers all 8 listeners on mount, removing them on unmount", async () => {
    const { unmount } = renderHook(() => useSocketSync(makeProps()));

    await waitFor(() => expect(mockService.on).toHaveBeenCalledTimes(EVENTS.length));
    expect(mockService.connect).toHaveBeenCalledTimes(1);
    expect(mockService.on.mock.calls.map(([e]) => e).sort()).toEqual([...EVENTS].sort());

    unmount();

    // Every registered (event, handler) pair is removed with the exact same handler reference.
    expect(mockService.off).toHaveBeenCalledTimes(EVENTS.length);
    const onPairs = mockService.on.mock.calls.map(([e, fn]) => [e, fn]);
    const offPairs = mockService.off.mock.calls.map(([e, fn]) => [e, fn]);
    onPairs.forEach((pair) => expect(offPairs).toContainEqual(pair));
  });

  it("MEM-08: never registers listeners if unmounted before the dynamic import resolves", async () => {
    // Render starts the effect (which kicks off the async import) and then unmount
    // synchronously — before the import().then() microtask runs.
    const { unmount } = renderHook(() => useSocketSync(makeProps()));
    unmount();

    // Let the still-pending import() resolve. The `active` guard must short-circuit it.
    await flush();

    // No listeners registered ⇒ none can leak. Without the guard, on() would fire 8×
    // here with no matching off(), leaking 8 listeners on the shared singleton.
    expect(mockService.on).not.toHaveBeenCalled();
    expect(mockService.connect).not.toHaveBeenCalled();
    expect(mockService.off).not.toHaveBeenCalled();
  });
});
