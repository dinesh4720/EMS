/**
 * Attendance — shared constants and pure date helpers.
 * Extracted from the former Attendance.jsx god component so the hook and the
 * presentational sub-components can share a single source of truth.
 */
import { Check, X, AlarmClock, LogOut, TimerOff } from "lucide-react";

export const ATTENDANCE_STATUSES = [
  { key: 'present', labelKey: 'attendance.present', label: 'Present', icon: Check, shortcut: 'P' },
  { key: 'absent', labelKey: 'attendance.absent', label: 'Absent', icon: X, shortcut: 'A' },
  { key: 'late', labelKey: 'attendance.late', label: 'Late', icon: AlarmClock, shortcut: 'T' },
  { key: 'leave', labelKey: 'attendance.leave', label: 'Leave', icon: LogOut, shortcut: 'L' },
  { key: 'halfday', labelKey: 'attendance.halfDay', label: 'Half Day', icon: TimerOff, shortcut: 'H' },
];

export const STATUS_MAP = Object.fromEntries(ATTENDANCE_STATUSES.map(s => [s.key, s]));
export const SHORTCUT_MAP = Object.fromEntries(ATTENDANCE_STATUSES.map(s => [s.shortcut, s.key]));

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Stable string id for a student record (handles both `_id` and `id`). */
export const sid = (s) => String(s?._id || s?.id || '');

/** Format a Date object as YYYY-MM-DD using local-time components (avoids UTC drift). */
export const toLocalDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Build the last 30 calendar days ending at `endDate`, oldest first. */
export const buildHeatmapDates = (endDate) => {
  const end = new Date(`${endDate}T00:00:00`);
  const out = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    out.push(toLocalDateString(d));
  }
  return out;
};
