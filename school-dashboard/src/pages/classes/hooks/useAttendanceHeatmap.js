/**
 * useAttendanceHeatmap
 * Computes the 30-day attendance-rate heatmap for a class (the data + the cell
 * level/non-working-day classifiers). Split out of `useAttendance` to keep that
 * hook focused; logic is transplanted verbatim, behaviour is identical.
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { attendanceApi } from "../../../services/api";
import logger from "../../../utils/logger";
import { DAY_NAMES, buildHeatmapDates } from "../utils/attendanceConstants";

export function useAttendanceHeatmap(resolvedClassId, date, schoolSettings, events) {
  const heatmapDates = useMemo(() => buildHeatmapDates(date), [date]);
  const [heatmap, setHeatmap] = useState({}); // { dateStr: { rate, marked, total, hasData } }

  useEffect(() => {
    if (!resolvedClassId) return;
    let cancelled = false;
    const start = heatmapDates[0];
    const end = heatmapDates[heatmapDates.length - 1];
    (async () => {
      try {
        const records = await attendanceApi.getClassHistory(resolvedClassId, start, end);
        if (cancelled) return;
        const byDate = {};
        const lateW = (schoolSettings?.attendanceRules?.lateWeight ?? 100) / 100;
        (Array.isArray(records) ? records : []).forEach(r => {
          const d = r.date;
          if (!d) return;
          if (!byDate[d]) byDate[d] = { present: 0, absent: 0, late: 0, leave: 0, halfday: 0, total: 0 };
          const s = String(r.status || '').toLowerCase();
          if (byDate[d][s] !== undefined) byDate[d][s] += 1;
          byDate[d].total += 1;
        });
        const summary = {};
        Object.entries(byDate).forEach(([d, c]) => {
          const effective = c.present + c.late * lateW + c.halfday * 0.5;
          const rate = c.total > 0 ? Math.round((effective / c.total) * 100) : 0;
          summary[d] = { rate, marked: c.total, hasData: c.total > 0 };
        });
        setHeatmap(summary);
      } catch (err) {
        logger.warn('Heatmap fetch failed:', err?.message);
        if (!cancelled) setHeatmap({});
      }
    })();
    return () => { cancelled = true; };
  }, [resolvedClassId, heatmapDates, schoolSettings?.attendanceRules?.lateWeight]);

  const isNonWorkingDate = useCallback((dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = DAY_NAMES[d.getDay()];
    const workingDays = schoolSettings?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (!workingDays.includes(dayOfWeek)) return true;
    const holiday = (events || []).find(e => e.type === 'holiday' && e.date === dateStr);
    return !!holiday;
  }, [schoolSettings?.workingDays, events]);

  const heatmapLevel = useCallback((dateStr) => {
    if (isNonWorkingDate(dateStr)) return 'is-non-working';
    const cell = heatmap[dateStr];
    if (!cell || !cell.hasData) return 'is-empty';
    const r = cell.rate;
    if (r < 60) return 'lv-danger';
    if (r < 75) return 'lv-warn';
    if (r >= 95) return 'lv-4';
    if (r >= 85) return 'lv-3';
    if (r >= 75) return 'lv-2';
    return 'lv-1';
  }, [heatmap, isNonWorkingDate]);

  return { heatmapDates, heatmap, heatmapLevel, isNonWorkingDate };
}
