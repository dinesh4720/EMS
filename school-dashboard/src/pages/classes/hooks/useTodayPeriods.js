import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../../../context/AppContext";
import { DEFAULT_PERIODS } from "../../../utils/constants";
import { timetableApi, attendanceApi } from "../../../services/api/classes";

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

/**
 * Build a per-class daily-attendance map from the today-snapshot response.
 *
 * Attendance is recorded once per student per day (see the Attendance model's
 * unique index on schoolId+studentId+date) — there is no per-period attendance.
 * So a class is "marked" for the day when it has at least one recorded row.
 *
 * snapshot shape: { date, classes: { [classId]: { present, absent, ..., total } } }
 * returns Map<classId(string), { present, total, marked }>
 */
export function buildClassAttendanceMap(snapshot) {
  const map = new Map();
  const classes = snapshot?.classes || {};
  for (const [classId, counts] of Object.entries(classes)) {
    const total = Number(counts?.total) || 0;
    const present = Number(counts?.present) || 0;
    map.set(String(classId), { present, total, marked: total > 0 });
  }
  return map;
}

// Human label for a populated class ref (name + section, no duplication).
function classLabel(cls) {
  if (!cls) return "";
  const name = cls.name || "";
  const section = cls.section || "";
  if (section && !String(name).includes(section)) {
    return `${name} ${section}`.trim();
  }
  return name || section || "";
}

/**
 * Real class → period assignment for one period index on a given day.
 *
 * Each timetable's `schedule[day]` array is parallel to its `periods` array
 * (index i ↔ period i — see TimetableGrid), and a free period is an empty
 * `subject`. We surface only the classes that actually have a subject this
 * period today, with their real subject / teacher / room, and attach the
 * class's real daily attendance.
 *
 * `timetables`     — array of { classId(populated), periods, schedule }
 * `teacherById`    — Map<staffId, staff> for resolving teacher names
 * `classAttendance`— Map<classId, { present, total, marked }> from the snapshot
 */
export function buildSlotsForPeriod(
  periodIdx,
  fullDayName,
  timetables,
  teacherById,
  classAttendance
) {
  const slots = [];
  for (const tt of timetables || []) {
    const daySlots = tt?.schedule?.[fullDayName];
    if (!Array.isArray(daySlots)) continue;
    const slot = daySlots[periodIdx];
    const subject = (slot?.subject || "").trim();
    if (!subject) continue; // empty subject = free period for this class

    const cls = tt.classId && typeof tt.classId === "object" ? tt.classId : null;
    const classId = String(cls?._id || tt.classId || "");
    if (!classId) continue;

    const teacher = teacherById.get(String(slot.teacherId)) || null;
    const att =
      classAttendance.get(classId) || { present: 0, total: 0, marked: false };

    slots.push({
      classId,
      className: classLabel(cls),
      subject,
      teacherId: slot.teacherId ? String(slot.teacherId) : null,
      teacherName: teacher?.name || "—",
      room: slot.room || "—",
      attendance: { marked: att.marked, present: att.present, total: att.total },
    });
  }
  return slots;
}

// Count the real, scheduled (non-empty) class slots for a day across all
// classes. Zero means nobody has class today → a no-school day, derived from
// the real timetable instead of a hardcoded "Sundays only" rule.
function countScheduledForDay(fullDayName, timetables) {
  let n = 0;
  for (const tt of timetables || []) {
    const daySlots = tt?.schedule?.[fullDayName];
    if (!Array.isArray(daySlots)) continue;
    for (const slot of daySlots) {
      if ((slot?.subject || "").trim()) n += 1;
    }
  }
  return n;
}

/**
 * Phase 6 main data hook. Owns:
 *  - Period derivation from the real timetable bell schedule
 *  - Per-class slot assignment from the real timetable (no synthesis)
 *  - Per-class daily attendance from attendanceApi.getTodaySnapshot()
 *  - State machine evaluation for every slot
 *  - The 60s tick that re-renders so live/urgent/overdue transitions fire
 *
 * Data sources (the two endpoints the original TODO called for):
 *  - GET /timetable?academicYear=…   → every class's weekly schedule
 *  - GET /attendance/today-snapshot   → per-class present/total for today
 */
export default function useTodayPeriods() {
  const { staff = [], schoolSettings, selectedAcademicYear, currentAcademicYear } =
    useApp();
  const academicYear = selectedAcademicYear || currentAcademicYear;

  // Per-page tick — bumped every 60s so derived states recompute.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Real timetable for every class (shared react-query cache: the hook is
  // mounted by ClassesPage, TodayView and ByClassView but only fetches once).
  const timetableQuery = useQuery({
    queryKey: ["today-timetables", academicYear || "default"],
    queryFn: async () => {
      const res = await timetableApi.getAll(academicYear);
      return Array.isArray(res) ? res : res?.timetables || res?.data || [];
    },
    placeholderData: (prev) => prev,
    staleTime: 5 * 60_000,
  });

  // Real per-class attendance for today.
  const snapshotQuery = useQuery({
    queryKey: ["today-attendance-snapshot"],
    queryFn: () => attendanceApi.getTodaySnapshot(),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const timetables = useMemo(
    () => timetableQuery.data || [],
    [timetableQuery.data]
  );
  const classAttendance = useMemo(
    () => buildClassAttendanceMap(snapshotQuery.data),
    [snapshotQuery.data]
  );
  const teacherById = useMemo(() => {
    const m = new Map();
    for (const s of staff || []) m.set(String(s._id || s.id), s);
    return m;
  }, [staff]);

  const isLoading = timetableQuery.isPending || snapshotQuery.isPending;

  const result = useMemo(() => {
    const now = new Date();
    void tick; // ensure recompute on tick

    const dayName = DAY_NAMES[now.getDay()];
    const fullDayName = FULL_DAY_NAMES[now.getDay()];

    // Bell schedule: prefer the real timetable's periods (the schedule arrays
    // are aligned to them by index), then school settings, then the default.
    const periodsConfig =
      timetables.find((t) => Array.isArray(t.periods) && t.periods.length)
        ?.periods ||
      schoolSettings?.periods ||
      DEFAULT_PERIODS;
    const totalPeriodsScheduled = periodsConfig.length;

    // No-school day = nothing scheduled today in the real timetable. Once the
    // timetable has loaded and today is empty, treat it as a closed day.
    const scheduledTodayCount = countScheduledForDay(fullDayName, timetables);
    const isNoSchoolDay = !isLoading && scheduledTodayCount === 0;

    if (isNoSchoolDay) {
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
          totalPeriodsScheduled,
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
      const slots = isBreak
        ? []
        : buildSlotsForPeriod(
            idx,
            fullDayName,
            timetables,
            teacherById,
            classAttendance
          );

      const evaluatedSlots = slots.map((s) => ({
        ...s,
        state: derivePeriodState(
          { start, end, hasClass: true },
          now,
          s.attendance.marked
        ),
      }));

      // Period-level state: pick the "worst" of all slots; if no slots, skipped (break/free).
      let periodState = "skipped";
      if (evaluatedSlots.length > 0) {
        const order = ["overdue", "urgent", "live", "upcoming", "marked"];
        const found = order.find((s) =>
          evaluatedSlots.some((x) => x.state === s)
        );
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
  }, [timetables, classAttendance, teacherById, schoolSettings, isLoading, tick]);

  return { ...result, isLoading };
}
