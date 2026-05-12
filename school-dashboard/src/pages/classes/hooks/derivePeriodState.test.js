import { describe, it, expect } from "vitest";
import {
  derivePeriodState,
  ATTENDANCE_CUTOFF_MINUTES,
  URGENCY_THRESHOLD_MINUTES,
} from "./useTodayPeriods";

// Build a Date that's `mins` minutes after a fixed anchor (10:00 today).
const anchor = new Date();
anchor.setHours(10, 0, 0, 0);
const at = (mins) => new Date(anchor.getTime() + mins * 60_000);

const period = {
  start: at(0),       // 10:00
  end: at(45),        // 10:45
  hasClass: true,
};
// Cutoff at 10:30 (start + 30 min).
// Urgent window: 10:20 → 10:30 (last 10 min before cutoff).

describe("derivePeriodState", () => {
  describe("structural fallbacks", () => {
    it("returns 'skipped' for null period", () => {
      expect(derivePeriodState(null, at(5), false)).toBe("skipped");
    });

    it("returns 'skipped' for period without start/end", () => {
      expect(derivePeriodState({ hasClass: true }, at(5), false)).toBe("skipped");
    });

    it("returns 'skipped' when hasClass is false (free / break)", () => {
      expect(
        derivePeriodState({ ...period, hasClass: false }, at(5), false)
      ).toBe("skipped");
    });
  });

  describe("'marked' precedence", () => {
    it("returns 'marked' regardless of when, when attendance is recorded", () => {
      expect(derivePeriodState(period, at(-30), true)).toBe("marked"); // before start
      expect(derivePeriodState(period, at(5), true)).toBe("marked"); // live window
      expect(derivePeriodState(period, at(25), true)).toBe("marked"); // urgent window
      expect(derivePeriodState(period, at(60), true)).toBe("marked"); // overdue window
    });
  });

  describe("'upcoming' — before start", () => {
    it("returns 'upcoming' at exactly 1 min before start", () => {
      expect(derivePeriodState(period, at(-1), false)).toBe("upcoming");
    });
    it("returns 'upcoming' at 30 min before start", () => {
      expect(derivePeriodState(period, at(-30), false)).toBe("upcoming");
    });
  });

  describe("'live' / 'urgent' / 'overdue' boundaries", () => {
    it("at start (0 min): live (cutoff 30m away, urgent threshold 10m)", () => {
      expect(derivePeriodState(period, at(0), false)).toBe("live");
    });
    it("at 9 min after start: live (still 21m to cutoff)", () => {
      expect(derivePeriodState(period, at(9), false)).toBe("live");
    });
    it("at 19 min after start: live (just over 11m to cutoff)", () => {
      expect(derivePeriodState(period, at(19), false)).toBe("live");
    });
    it("at exactly 20 min after start: urgent (10m to cutoff)", () => {
      // urgentMinutes is inclusive: minutesToCutoff <= 10 → urgent
      expect(derivePeriodState(period, at(20), false)).toBe("urgent");
    });
    it("at 25 min after start: urgent (5m to cutoff)", () => {
      expect(derivePeriodState(period, at(25), false)).toBe("urgent");
    });
    it("at 29 min after start: urgent (1m to cutoff)", () => {
      expect(derivePeriodState(period, at(29), false)).toBe("urgent");
    });
    it("at exactly 30 min after start: overdue (cutoff reached)", () => {
      // now >= cutoff → overdue
      expect(derivePeriodState(period, at(30), false)).toBe("overdue");
    });
    it("at 31 min after start: overdue", () => {
      expect(derivePeriodState(period, at(31), false)).toBe("overdue");
    });
    it("at 60 min after start (period already ended): overdue", () => {
      expect(derivePeriodState(period, at(60), false)).toBe("overdue");
    });
  });

  describe("custom cutoff / urgency overrides", () => {
    it("respects custom cutoffMinutes", () => {
      // cutoff 15 min, urgency 5 min: at min 5 → live
      expect(derivePeriodState(period, at(5), false, 15, 5)).toBe("live");
      // at min 10 → urgent (5m to cutoff)
      expect(derivePeriodState(period, at(10), false, 15, 5)).toBe("urgent");
      // at min 15 → overdue
      expect(derivePeriodState(period, at(15), false, 15, 5)).toBe("overdue");
    });
  });

  describe("default constants are sensible", () => {
    it("ATTENDANCE_CUTOFF_MINUTES is 30", () => {
      expect(ATTENDANCE_CUTOFF_MINUTES).toBe(30);
    });
    it("URGENCY_THRESHOLD_MINUTES is 10", () => {
      expect(URGENCY_THRESHOLD_MINUTES).toBe(10);
    });
  });
});
