import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { DEFAULT_PERIODS } from "../../../utils/constants";

// Phase 6 · cutoff + urgency thresholds.
// TODO: read these from schoolSettings.attendance once exposed:
//   schoolSettings.attendance = { cutoffMinutes, urgencyMinutes }
export const ATTENDANCE_CUTOFF_MINUTES = 30;
export const URGENCY_THRESHOLD_MINUTES = 10;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Parse "HH:MM" (24h, school local) into a Date for "today" at that wall-clock time.
function timeOnDate(hhmm, base) {
  if (!hhmm || typeof hhmm !== "string") return null;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Pure state-machine for one period given the current time and attendance.
 * Tested independently — see derivePeriodState.test.js.
 *
 * Returns one of: 'upcoming' | 'live' | 'urgent' | 'overdue' | 'marked' | 'skipped'.
 *
 * `period` shape: { start: Date, end: Date, hasClass: boolean }
 * `marked` is a boolean — true if attendance is recorded for this period.
 */
export function derivePeriodState(
  period,
  now,
  marked,
  cutoffMinutes = ATTENDANCE_CUTOFF_MINUTES,
  urgencyMinutes = URGENCY_THRESHOLD_MINUTES
) {
  if (!period || !period.start || !period.end) return "skipped";
  if (!period.hasClass) return "skipped";
  if (marked) return "marked";

  const cutoff = new Date(period.start.getTime() + cutoffMinutes * 60_000);

  if (now < period.start) return "upcoming";
  if (now >= cutoff) return "overdue";
  // now is between period.start and cutoff
  const minutesToCutoff = (cutoff.getTime() - now.getTime()) / 60_000;
  if (minutesToCutoff <= urgencyMinutes) return "urgent";
  return "live";
}

// Holiday detection — until a real holidays endpoint is consumed,
// treat Sundays as the only "no school" days. Everything else is a school day.
// TODO: read from schoolSettings.holidays / events.
function isWeekendOrHoliday(now) {
  return now.getDay() === 0; // Sunday
}

// Deterministic class → period assignment until the real timetable lands.
// Hash class.id to assign each class to N periods of the day.
// TODO: replace with class.timetable[dayOfWeek] once the schema exposes it.
function synthSlotsForPeriod(periodIdx, periods, classes, staff) {
  if (!Array.isArray(classes) || classes.length === 0) return [];
  const teacherById = new Map(
    (staff || []).map((s) => [String(s._id || s.id), s])
  );
  // Each class is scheduled for this period if (hash + periodIdx) is even.
  // Picks ~half the classes per period — realistic class density.
  const slots = [];
  for (const c of classes) {
    const hash = String(c._id || c.id || c.name || "")
      .split("")
      .reduce((a, ch) => (a + ch.charCodeAt(0)) % 1000, 0);
    if ((hash + periodIdx * 7) % 2 !== 0) continue;
    const teacher = teacherById.get(String(c.classTeacherId)) || null;
    slots.push({
      classId: c._id || c.id,
      className: c.name || c.section || "",
      subject: c.subjects?.[periodIdx % (c.subjects?.length || 1)] || "—",
      teacherId: teacher?._id || teacher?.id || null,
      teacherName: teacher?.name || c.teacher || "—",
      room: c.room || "—",
    });
  }
  return slots;
}

/**
 * Phase 6 main data hook. Owns:
 *  - Period derivation from school settings (or DEFAULT_PERIODS fallback)
 *  - Per-class slot assignment (synthesized; see TODO)
 *  - State machine evaluation for every slot
 *  - The 60s tick that re-renders so live/urgent/overdue transitions fire
 *
 * TODO: replace with a single `GET /api/classes/today/periods` call once the
 * backend exposes it. Proposed shape documented in the Phase 6 README.
 */
export default function useTodayPeriods() {
  const { classes, staff, schoolSettings } = useApp();

  // Per-page tick — bumped every 60s so derived states recompute.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Today's attendance — TODO: real per-class attendance fetch with marked status.
  // For now, no class is marked (everything renders Live/Upcoming/Urgent/Overdue).
  // Wire to `attendanceApi.getTodaySnapshot()` per-class result when shape stabilises.
  const markedSet = useMemo(() => new Set(), []);

  return useMemo(() => {
    const now = new Date();
    void tick; // ensure recompute on tick

    const dayName = DAY_NAMES[now.getDay()];
    const fullDayName = FULL_DAY_NAMES[now.getDay()];

    const periodsConfig = schoolSettings?.periods || DEFAULT_PERIODS;
    const totalPeriodsScheduled = periodsConfig.length;

    if (isWeekendOrHoliday(now)) {
      return {
        periods: [],
        dayMeta: {
          todayLabel: now.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          dayName,
          fullDayName,
          isWeekendOrHoliday: true,
          isSchoolDayComplete: false,
          totalCovered: 0,
          totalScheduled: 0,
          overdueIds: [],
          unmarkedCount: 0,
          activePeriodNumber: null,
        },
      };
    }

    const periods = periodsConfig.map((p, idx) => {
      const start = timeOnDate(p.startTime || p.start, now);
      const end = timeOnDate(p.endTime || p.end, now);
      const isBreak = !!p.isBreak;
      const slots = isBreak ? [] : synthSlotsForPeriod(idx, periodsConfig, classes, staff);

      const evaluatedSlots = slots.map((s) => ({
        ...s,
        attendance: { marked: markedSet.has(s.classId), present: 0, total: 0 },
        state: derivePeriodState(
          { start, end, hasClass: true },
          now,
          markedSet.has(s.classId)
        ),
      }));

      // Period-level state: pick the "worst" of all slots; if no slots, skipped (break/free).
      let periodState = "skipped";
      if (evaluatedSlots.length > 0) {
        const order = ["overdue", "urgent", "live", "upcoming", "marked"];
        const found = order.find((s) => evaluatedSlots.some((x) => x.state === s));
        periodState = found || "skipped";
      }

      return {
        number: idx + 1,
        name: p.name || `Period ${idx + 1}`,
        start,
        end,
        startLabel: p.startTime || p.start,
        endLabel: p.endTime || p.end,
        isBreak,
        state: periodState,
        slots: evaluatedSlots,
      };
    });

    const overdueIds = periods.flatMap((p) =>
      p.slots.filter((s) => s.state === "overdue").map((s) => s.classId)
    );
    const unmarkedCount = periods.reduce(
      (n, p) =>
        n + p.slots.filter((s) => s.state !== "marked" && !p.isBreak).length,
      0
    );
    const totalCovered = periods.reduce(
      (n, p) => n + p.slots.filter((s) => s.state === "marked").length,
      0
    );
    const totalScheduledSlots = periods.reduce(
      (n, p) => n + p.slots.length,
      0
    );

    const lastPeriod = periods[periods.length - 1];
    const isSchoolDayComplete = !!(lastPeriod?.end && now > lastPeriod.end);

    const livePeriod = periods.find(
      (p) => p.state === "live" || p.state === "urgent"
    );
    const activePeriodNumber = livePeriod?.number ?? null;

    return {
      periods,
      dayMeta: {
        todayLabel: now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        dayName,
        fullDayName,
        isWeekendOrHoliday: false,
        isSchoolDayComplete,
        totalCovered,
        totalScheduled: totalScheduledSlots,
        totalPeriodsScheduled,
        overdueIds,
        unmarkedCount,
        activePeriodNumber,
      },
    };
  }, [classes, staff, schoolSettings, markedSet, tick]);
}
