import { describe, it, expect } from "vitest";
import {
  appendCappedFeePayment,
  MAX_LIVE_FEE_PAYMENTS,
} from "../SettingsContext";

// [PERF-01] Regression coverage: the live socket-synced fee-payment list must
// stay bounded and de-duplicated no matter how many events arrive.
describe("appendCappedFeePayment (PERF-01)", () => {
  const payment = (id) => ({ id, studentId: `stu-${id}`, amount: 100 });

  it("appends a new payment to the end", () => {
    const next = appendCappedFeePayment([payment(1)], payment(2));
    expect(next).toEqual([payment(1), payment(2)]);
  });

  it("never grows beyond the cap, keeping the most recent entries", () => {
    let list = [];
    // Simulate a busy collection day: far more events than the cap.
    for (let i = 1; i <= MAX_LIVE_FEE_PAYMENTS + 500; i++) {
      list = appendCappedFeePayment(list, payment(i));
    }
    expect(list).toHaveLength(MAX_LIVE_FEE_PAYMENTS);
    // Oldest were evicted; newest retained.
    expect(list[0].id).toBe(501);
    expect(list[list.length - 1].id).toBe(MAX_LIVE_FEE_PAYMENTS + 500);
  });

  it("respects a custom cap", () => {
    let list = [];
    for (let i = 1; i <= 10; i++) {
      list = appendCappedFeePayment(list, payment(i), 3);
    }
    expect(list.map((p) => p.id)).toEqual([8, 9, 10]);
  });

  it("de-dupes by id (socket reconnect replay / optimistic echo)", () => {
    const list = appendCappedFeePayment([payment(1), payment(2)], payment(1));
    // The duplicate id moves to the end exactly once; no double entry.
    expect(list).toHaveLength(2);
    expect(list.map((p) => p.id)).toEqual([2, 1]);
  });

  it("appends entries without an id (no dedup key) rather than dropping them", () => {
    const noId = { studentId: "stu-x", amount: 50 };
    const list = appendCappedFeePayment([payment(1)], noId);
    expect(list).toHaveLength(2);
    expect(list[1]).toBe(noId);
  });

  it("tolerates a non-array prev (defensive)", () => {
    expect(appendCappedFeePayment(undefined, payment(1))).toEqual([payment(1)]);
    expect(appendCappedFeePayment(null, payment(1))).toEqual([payment(1)]);
  });
});
