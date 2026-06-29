import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../i18n/index", () => ({
  getDateLocale: () => "en-IN",
}));

import {
  getDaysUntil,
  formatUpcomingDayLabel,
  pickMostUrgentSubstitution,
  pickUpcomingPtmSession,
} from "./dashboardHelpers";

const NOON = new Date(2026, 5, 15, 12, 0, 0); // 2026-06-15T12:00 local

describe("getDaysUntil", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 when the target is today (time-of-day ignored)", () => {
    const sameDay = new Date(2026, 5, 15, 23, 59, 0);
    expect(getDaysUntil(sameDay, NOON)).toBe(0);
  });

  it("returns 1 for tomorrow", () => {
    expect(getDaysUntil(new Date(2026, 5, 16, 0, 1, 0), NOON)).toBe(1);
  });

  it("returns -1 for yesterday", () => {
    expect(getDaysUntil(new Date(2026, 5, 14, 23, 59, 0), NOON)).toBe(-1);
  });

  it("accepts an ISO date string", () => {
    expect(getDaysUntil("2026-06-18", NOON)).toBe(3);
  });

  it("returns null for invalid input", () => {
    expect(getDaysUntil(null, NOON)).toBeNull();
    expect(getDaysUntil("not-a-date", NOON)).toBeNull();
    expect(getDaysUntil(undefined, NOON)).toBeNull();
  });
});

describe("formatUpcomingDayLabel", () => {
  it("returns 'today' for the same day", () => {
    expect(formatUpcomingDayLabel(new Date(2026, 5, 15, 18, 0, 0), NOON)).toBe(
      "today"
    );
  });

  it("returns 'tomorrow' for the next day", () => {
    expect(formatUpcomingDayLabel(new Date(2026, 5, 16, 9, 0, 0), NOON)).toBe(
      "tomorrow"
    );
  });

  it("returns 'in N days' for 2-6 days out", () => {
    expect(formatUpcomingDayLabel(new Date(2026, 5, 17, 9, 0, 0), NOON)).toBe(
      "in 2 days"
    );
    expect(formatUpcomingDayLabel(new Date(2026, 5, 20, 9, 0, 0), NOON)).toBe(
      "in 5 days"
    );
  });

  it("returns a short locale date for 7+ days out", () => {
    const label = formatUpcomingDayLabel(
      new Date(2026, 11, 20, 9, 0, 0),
      NOON
    );
    expect(label).toMatch(/Dec/);
    expect(label).toMatch(/20/);
  });

  it("returns '—' for invalid input", () => {
    expect(formatUpcomingDayLabel(null, NOON)).toBe("—");
    expect(formatUpcomingDayLabel("garbage", NOON)).toBe("—");
  });
});

describe("pickMostUrgentSubstitution", () => {
  it("returns null for an empty list", () => {
    expect(pickMostUrgentSubstitution([])).toBeNull();
    expect(pickMostUrgentSubstitution(null)).toBeNull();
    expect(pickMostUrgentSubstitution(undefined)).toBeNull();
  });

  it("prefers an unassigned alert over a covered one regardless of priority", () => {
    const alerts = [
      { _id: "a", className: "9-A", priority: 30, substituteTeacherId: "t1" },
      { _id: "b", className: "10-B", priority: 5, substituteTeacherId: null },
    ];
    const result = pickMostUrgentSubstitution(alerts);
    expect(result.alert._id).toBe("b");
    expect(result.unassigned).toBe(true);
  });

  it("among unassigned alerts, picks the highest priority", () => {
    const alerts = [
      { _id: "a", priority: 10, substituteTeacherId: null, period: 1 },
      { _id: "b", priority: 25, substituteTeacherId: null, period: 5 },
      { _id: "c", priority: 15, substituteTeacherId: null, period: 2 },
    ];
    const result = pickMostUrgentSubstitution(alerts);
    expect(result.alert._id).toBe("b");
  });

  it("uses earliest period as a tie-breaker when priority is equal", () => {
    const alerts = [
      { _id: "a", priority: 20, substituteTeacherId: null, period: 5 },
      { _id: "b", priority: 20, substituteTeacherId: null, period: 2 },
      { _id: "c", priority: 20, substituteTeacherId: null, period: 1 },
    ];
    expect(pickMostUrgentSubstitution(alerts).alert._id).toBe("c");
  });

  it("falls back to a covered alert (unassigned=false) when none are unassigned", () => {
    const alerts = [
      { _id: "a", priority: 12, substituteTeacherId: "t1" },
      { _id: "b", priority: 30, substituteTeacherId: "t2" },
    ];
    const result = pickMostUrgentSubstitution(alerts);
    expect(result.alert._id).toBe("b");
    expect(result.unassigned).toBe(false);
  });
});

describe("pickUpcomingPtmSession", () => {
  it("returns null for an empty list", () => {
    expect(pickUpcomingPtmSession([], NOON)).toBeNull();
    expect(pickUpcomingPtmSession(null, NOON)).toBeNull();
  });

  it("skips completed, cancelled, and soft-deleted sessions", () => {
    const sessions = [
      { _id: "a", status: "completed", date: "2026-06-20" },
      { _id: "b", status: "cancelled", date: "2026-06-20" },
      { _id: "c", status: "scheduled", date: "2026-06-20", deletedAt: "2026-06-01" },
      { _id: "d", status: "scheduled", date: "2026-06-20", isDeleted: true },
    ];
    expect(pickUpcomingPtmSession(sessions, NOON)).toBeNull();
  });

  it("prefers an ongoing session over a future scheduled one", () => {
    const sessions = [
      { _id: "soon", status: "scheduled", date: "2026-06-16" },
      { _id: "now", status: "ongoing", date: "2026-06-20" },
    ];
    expect(pickUpcomingPtmSession(sessions, NOON)._id).toBe("now");
  });

  it("among scheduled sessions, picks the nearest date", () => {
    const sessions = [
      { _id: "far", status: "scheduled", date: "2026-07-01" },
      { _id: "near", status: "scheduled", date: "2026-06-17" },
      { _id: "mid", status: "scheduled", date: "2026-06-22" },
    ];
    expect(pickUpcomingPtmSession(sessions, NOON)._id).toBe("near");
  });

  it("accepts scheduledFor as a fallback when date is missing", () => {
    const sessions = [
      { _id: "a", status: "scheduled", scheduledFor: "2026-06-17" },
    ];
    expect(pickUpcomingPtmSession(sessions, NOON)._id).toBe("a");
  });

  it("skips sessions with neither date nor scheduledFor", () => {
    const sessions = [{ _id: "a", status: "scheduled" }];
    expect(pickUpcomingPtmSession(sessions, NOON)).toBeNull();
  });
});
