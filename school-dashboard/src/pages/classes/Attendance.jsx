import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@heroui/react";
import { Check, X, Bell, AlertTriangle, TrendingUp, TimerOff, LogOut, AlarmClock, CalendarDays, ChevronLeft, ChevronRight, WifiOff, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useSettings } from "../../context/SettingsContext";
import { attendanceApi, classesApi } from "../../services/api";
import { useTranslation } from 'react-i18next';
import { toTodayDateString } from '../../utils/dateFormatter';
import logger from '../../utils/logger';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useOfflineAttendanceSync } from '../../hooks/useOfflineAttendanceSync';
import { queueOfflineAttendance, getCachedAttendance } from '../../services/offlineAttendance';
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Modal from "../../components/ui/Modal";
import Drawer from "../../components/ui/Drawer";
import EmptyState from "../../components/ui/EmptyState";

const ATTENDANCE_STATUSES = [
  { key: 'present', labelKey: 'attendance.present', label: 'Present', icon: Check, shortcut: 'P' },
  { key: 'absent', labelKey: 'attendance.absent', label: 'Absent', icon: X, shortcut: 'A' },
  { key: 'late', labelKey: 'attendance.late', label: 'Late', icon: AlarmClock, shortcut: 'T' },
  { key: 'leave', labelKey: 'attendance.leave', label: 'Leave', icon: LogOut, shortcut: 'L' },
  { key: 'halfday', labelKey: 'attendance.halfDay', label: 'Half Day', icon: TimerOff, shortcut: 'H' },
];

const STATUS_MAP = Object.fromEntries(ATTENDANCE_STATUSES.map(s => [s.key, s]));
const SHORTCUT_MAP = Object.fromEntries(ATTENDANCE_STATUSES.map(s => [s.shortcut, s.key]));

const sid = (s) => String(s?._id || s?.id || '');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Format a Date object as YYYY-MM-DD using local-time components (avoids UTC drift). */
const toLocalDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Build the last 30 calendar days ending at `endDate`, oldest first. */
const buildHeatmapDates = (endDate) => {
  const end = new Date(`${endDate}T00:00:00`);
  const out = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    out.push(toLocalDateString(d));
  }
  return out;
};

export default function Attendance({ classId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { students, classesWithTeachers } = useApp();
  const { schoolSettings, events } = useSettings();
  const [date, setDate] = useState(toTodayDateString());
  const [selectedClass, setSelectedClass] = useState(classId || "");
  const [attendance, setAttendance] = useState({});
  const [view, setView] = useState('daily'); // daily | monthly

  const attendanceLockDays = schoolSettings?.attendanceLockDays ?? 7;
  // AUDIT-227 / BUG: lock-period off-by-one. Compare YYYY-MM-DD strings in local
  // time so the cutoff is inclusive of the boundary date (was using UTC + 00:00,
  // which silently advanced the cutoff for negative-offset timezones).
  const isLocked = useMemo(() => {
    if (!date) return false;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - attendanceLockDays);
    return date < toLocalDateString(cutoff);
  }, [date, attendanceLockDays]);

  const isFutureDate = useMemo(() => date > toTodayDateString(), [date]);

  const invalidDateReason = useMemo(() => {
    if (!date) return null;
    // Build using local components — `new Date('YYYY-MM-DDT00:00:00Z').getUTCDay()`
    // returns the wrong day for users west of UTC.
    const d = new Date(`${date}T00:00:00`);
    const dayOfWeek = DAY_NAMES[d.getDay()];
    const workingDays = schoolSettings?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (!workingDays.includes(dayOfWeek)) {
      return t('attendance.nonWorkingDay', '{{day}} is not a working day', { day: dayOfWeek });
    }
    const holiday = (events || []).find(e => e.type === 'holiday' && e.date === date);
    if (holiday) {
      return t('attendance.holidayDate', '{{date}} is a holiday ({{name}})', { date, name: holiday.title });
    }
    return null;
  }, [date, schoolSettings?.workingDays, events, t]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const isOnline = useOnlineStatus();
  const { pendingCount: offlinePendingCount, syncing: offlineSyncing, syncNow } = useOfflineAttendanceSync();
  const { isOpen: isOverwriteOpen, onOpen: onOverwriteOpen, onClose: onOverwriteClose } = useDisclosure();
  const { isOpen: isMarkAllOpen, onOpen: onMarkAllOpen, onClose: onMarkAllClose } = useDisclosure();
  const { isOpen: isRegOpen, onOpen: onRegOpen, onClose: onRegClose } = useDisclosure();
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const messageTimerRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const clearMessageAfter = useCallback((ms) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setSaveMessage(null), ms);
  }, []);

  useEffect(() => () => { if (messageTimerRef.current) clearTimeout(messageTimerRef.current); }, []);

  const isEmbedded = !!classId;

  useEffect(() => {
    if (!classId && !selectedClass && classesWithTeachers.length > 0) {
      const first = classesWithTeachers[0];
      setSelectedClass(first.id || first._id || `${first.name}-${first.section}`);
    }
  }, [classId, selectedClass, classesWithTeachers]);

  const resolvedClassId = useMemo(() => {
    if (classId) return classId;
    if (!selectedClass) return null;
    const directMatch = classesWithTeachers.find(c => String(c.id || c._id) === String(selectedClass));
    if (directMatch) return directMatch.id || directMatch._id;
    const lastDash = selectedClass.lastIndexOf('-');
    if (lastDash > 0) {
      const name = selectedClass.slice(0, lastDash);
      const section = selectedClass.slice(lastDash + 1);
      const cls = classesWithTeachers.find(c => c.name === name && c.section === section);
      return cls?.id || cls?._id || null;
    }
    return null;
  }, [classId, selectedClass, classesWithTeachers]);

  const classStudents = useMemo(() => {
    const targetClass = classId || selectedClass;
    return students.filter(s =>
      String(s.classId) === String(targetClass) &&
      (s.status || 'active') === 'active' &&
      s.isDeleted !== true
    );
  }, [students, selectedClass, classId]);

  const classStudentsRef = useRef(classStudents);
  useLayoutEffect(() => { classStudentsRef.current = classStudents; }, [classStudents]);

  const fetchAttendance = useCallback(async () => {
    if (!resolvedClassId || !date) return;
    const currentStudents = classStudentsRef.current;
    if (!currentStudents?.length) return;

    try {
      setIsLoadingAttendance(true);
      const data = await attendanceApi.getByClassDate(resolvedClassId, date);
      const existingAttendance = {};
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          data.forEach(record => {
            const studentId = String(record.studentId?._id || record.studentId || '');
            if (studentId) existingAttendance[studentId] = record.status || 'present';
          });
        } else {
          Object.entries(data).forEach(([studentId, record]) => {
            if (studentId && record?.status) existingAttendance[studentId] = record.status;
          });
        }
      }
      setHasExistingAttendance(Object.keys(existingAttendance).length > 0);
      setAttendance(prev => {
        const next = { ...prev };
        currentStudents.forEach(s => {
          const k = sid(s);
          if (!prev[k] || prev[k] === 'unmarked') next[k] = existingAttendance[k] || 'unmarked';
        });
        return next;
      });
    } catch (error) {
      logger.warn('No existing attendance found, initializing defaults:', error.message);
      // Try to load from offline cache as a fallback
      const cached = getCachedAttendance(resolvedClassId, date);
      if (cached?.attendance) {
        const cachedMap = {};
        cached.attendance.forEach(r => {
          if (r.studentId) cachedMap[r.studentId] = r.status;
        });
        setHasExistingAttendance(true);
        setAttendance(prev => {
          const next = { ...prev };
          currentStudents.forEach(s => {
            const k = sid(s);
            if (!prev[k] || prev[k] === 'unmarked') next[k] = cachedMap[k] || 'unmarked';
          });
          return next;
        });
      } else {
        setHasExistingAttendance(false);
        setAttendance(prev => {
          const next = { ...prev };
          currentStudents.forEach(s => {
            const k = sid(s);
            if (!prev[k] || prev[k] === 'unmarked') next[k] = 'unmarked';
          });
          return next;
        });
      }
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [resolvedClassId, date]);

  const prevFetchKeyRef = useRef('');
  useEffect(() => {
    if (classStudents.length > 0 && resolvedClassId && date) {
      const fetchKey = `${resolvedClassId}|${date}`;
      if (fetchKey !== prevFetchKeyRef.current) {
        prevFetchKeyRef.current = fetchKey;
        fetchAttendance();
      }
    }
  }, [classStudents.length, resolvedClassId, date, fetchAttendance]);

  // ---------- 30-day heatmap ----------
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

  // ---------- Mark actions ----------
  const isReadOnly = isLocked || isFutureDate || !!invalidDateReason;

  const markAttendance = useCallback((studentId, status) => {
    if (!isReadOnly) setAttendance(prev => ({ ...prev, [studentId]: status }));
  }, [isReadOnly]);

  const markAllPresent = () => { if (!isReadOnly) onMarkAllOpen(); };

  const handleConfirmMarkAllPresent = () => {
    onMarkAllClose();
    const newAttendance = {};
    classStudents.forEach(s => { newAttendance[sid(s)] = 'present'; });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  // ---------- Keyboard shortcuts: P/A/T/L/H apply to active row ----------
  useEffect(() => {
    if (isReadOnly) return;
    const handler = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key?.toUpperCase();
      const status = SHORTCUT_MAP[key];
      if (!status) return;
      const list = classStudentsRef.current;
      if (!list?.length) return;
      const idx = activeStudentId ? list.findIndex(s => sid(s) === activeStudentId) : -1;
      const target = idx >= 0 ? list[idx] : list[0];
      const targetId = sid(target);
      markAttendance(targetId, status);
      e.preventDefault();
      const nextIdx = (idx >= 0 ? idx : 0) + 1;
      if (nextIdx < list.length) setActiveStudentId(sid(list[nextIdx]));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeStudentId, markAttendance, isReadOnly]);

  const handleNotifyParents = async () => {
    if (!resolvedClassId || !date || isNotifying) return;
    setIsNotifying(true);
    try {
      const res = await classesApi.notifyParents({ classId: resolvedClassId, date });
      setSaveMessage({ type: 'success', text: res?.message || t('attendance.notifiedParents', 'Notified parents of {{count}} absent student(s)', { count: absentCount }) });
    } catch (error) {
      logger.warn('Notify parents failed:', error?.message);
      setSaveMessage({ type: 'error', text: error?.message || t('attendance.failedToNotifyParents', 'Failed to notify parents. The notification service may be unavailable.') });
    } finally {
      setIsNotifying(false);
      clearMessageAfter(4000);
    }
  };

  const handleSaveAttendance = () => {
    if (isLocked || isSaving || isSubmittingRef.current || invalidDateReason) return;
    if (date > toTodayDateString()) {
      setSaveMessage({ type: 'error', text: t('attendance.cannotSaveFutureDate', 'Cannot save attendance for a future date.') });
      clearMessageAfter(3000);
      return;
    }
    const validStatuses = ATTENDANCE_STATUSES.map(s => s.key);
    const markedStudents = classStudents.filter(s => validStatuses.includes(attendance[sid(s)]));
    if (markedStudents.length === 0) {
      setSaveMessage({ type: 'error', text: t('attendance.markAtLeastOne', 'Please mark attendance for at least one student before saving') });
      clearMessageAfter(3000);
      return;
    }
    if (!resolvedClassId) {
      setSaveMessage({ type: 'error', text: t('attendance.selectValidClass', 'Please select a valid class') });
      clearMessageAfter(3000);
      return;
    }
    if (hasExistingAttendance) {
      onOverwriteOpen();
      return;
    }
    performSave();
  };

  const performSave = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const validStatuses = ATTENDANCE_STATUSES.map(s => s.key);
    const markedStudents = classStudents.filter(s => validStatuses.includes(attendance[sid(s)]));
    try {
      setIsSaving(true);
      setSaveMessage(null);
      // BUG: half-day persistence — ensure status is sent verbatim (no client-side aliasing).
      const attendanceData = markedStudents.map(s => ({ studentId: sid(s), status: attendance[sid(s)] }));

      // If offline, queue locally instead of failing
      if (!isOnline) {
        const record = {
          classId: resolvedClassId,
          date,
          attendance: attendanceData,
          clientTimestamp: new Date().toISOString(),
        };
        const result = queueOfflineAttendance(record);
        if (result.success) {
          setHasExistingAttendance(true);
          setSaveMessage({
            type: 'warning',
            text: t('attendance.savedOffline', 'Saved offline for {{count}} students. Will sync when connection is restored.', { count: markedStudents.length }),
          });
          clearMessageAfter(5000);
        } else {
          setSaveMessage({ type: 'error', text: t('attendance.failedToQueueOffline', 'Failed to save offline. Please try again.') });
          clearMessageAfter(5000);
        }
        return;
      }

      const response = await attendanceApi.markBulk({
        classId: resolvedClassId,
        date,
        attendance: attendanceData,
        clientTimestamp: new Date().toISOString()
      });
      setHasExistingAttendance(true);
      const savedCount = response.results?.length ?? markedStudents.length;
      const skippedCount = response.skipped?.length ?? 0;
      const unmarkedRemaining = classStudents.length - markedStudents.length;
      const unmarkedWarning = unmarkedRemaining > 0 ? ` (${unmarkedRemaining} ${t('attendance.stillUnmarked', 'still unmarked')})` : '';

      if (skippedCount > 0 && savedCount === 0) {
        setSaveMessage({ type: 'error', text: t('attendance.allSkipped', 'No attendance saved — {{count}} record(s) were rejected by the server', { count: skippedCount }) });
        clearMessageAfter(5000);
      } else if (skippedCount > 0) {
        setSaveMessage({ type: 'warning', text: t('attendance.partialSave', 'Saved {{saved}} student(s); {{skipped}} record(s) could not be saved', { saved: savedCount, skipped: skippedCount }) + unmarkedWarning });
        clearMessageAfter(5000);
      } else {
        setSaveMessage({ type: 'success', text: t('attendance.savedForStudents', 'Attendance saved for {{count}} students', { count: savedCount }) + unmarkedWarning });
        clearMessageAfter(3000);
      }

      // BUG: parent notification trigger — auto-notify when any student is absent on save
      // and we have a valid class context (server-side acts as the single source of truth).
      if (response?.notifyAbsent !== false) {
        const absentMarked = markedStudents.filter(s => attendance[sid(s)] === 'absent').length;
        if (absentMarked > 0) {
          classesApi.notifyParents({ classId: resolvedClassId, date }).catch((err) =>
            logger.warn('Auto parent notify failed:', err?.message)
          );
        }
      }
    } catch (error) {
      logger.error('Error saving attendance:', error);
      // Network or server failure — try to queue offline as a fallback
      const isNetworkError =
        !error.status ||
        error.message?.includes('Network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('fetch') ||
        error.message?.includes('Failed to fetch');
      if (isNetworkError) {
        const attendanceData = markedStudents.map(s => ({ studentId: sid(s), status: attendance[sid(s)] }));
        const record = {
          classId: resolvedClassId,
          date,
          attendance: attendanceData,
          clientTimestamp: new Date().toISOString(),
        };
        const result = queueOfflineAttendance(record);
        if (result.success) {
          setHasExistingAttendance(true);
          setSaveMessage({
            type: 'warning',
            text: t('attendance.savedOffline', 'Saved offline for {{count}} students. Will sync when connection is restored.', { count: markedStudents.length }),
          });
          clearMessageAfter(5000);
          return;
        }
      }
      setSaveMessage({ type: 'error', text: error.message || t('attendance.failedToSave', 'Failed to save attendance') });
      clearMessageAfter(5000);
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleConfirmOverwrite = () => { onOverwriteClose(); performSave(); };

  const {
    presentCount, absentCount, lateCount, halfdayCount,
    unmarkedCount, markedCount, attendancePercent,
  } = useMemo(() => {
    const present = classStudents.filter(s => attendance[sid(s)] === 'present').length;
    const absent = classStudents.filter(s => attendance[sid(s)] === 'absent').length;
    const late = classStudents.filter(s => attendance[sid(s)] === 'late').length;
    const leave = classStudents.filter(s => attendance[sid(s)] === 'leave').length;
    const halfday = classStudents.filter(s => attendance[sid(s)] === 'halfday').length;
    const unmarked = classStudents.filter(s => !attendance[sid(s)] || attendance[sid(s)] === 'unmarked').length;
    const marked = present + absent + late + leave + halfday;
    const lateW = (schoolSettings?.attendanceRules?.lateWeight ?? 100) / 100;
    const effective = present + late * lateW + halfday * 0.5;
    const pct = marked > 0 ? Math.round((effective / marked) * 100) : 0;
    return {
      presentCount: present, absentCount: absent, lateCount: late,
      _leaveCount: leave, halfdayCount: halfday, unmarkedCount: unmarked,
      markedCount: marked, attendancePercent: pct,
    };
  }, [attendance, classStudents, schoolSettings?.attendanceRules?.lateWeight]);

  const shiftDate = (delta) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + delta);
    const next = toLocalDateString(d);
    if (next > toTodayDateString()) return;
    setDate(next);
  };

  const pctClass = markedCount === 0 ? '' : attendancePercent >= 85 ? 'dp-metric__value--ok' : attendancePercent >= 60 ? 'dp-metric__value--warn' : 'dp-metric__value--danger';

  return (
    <div className={`attn-page ${isEmbedded ? '' : ''}`}>
      {/* Toolbar */}
      <div className="attn-toolbar">
        <div className="attn-toolbar__left">
          {!classId && (
            <select
              className="attn-class-select"
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(e.target.value)}
              aria-label={t('pages.class1')}
            >
              {classesWithTeachers.map(c => (
                <option key={c.id || c._id || `${c.name}-${c.section}`} value={c.id || c._id || `${c.name}-${c.section}`}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
          )}
          <div className="attn-toolbar__date">
            <button type="button" className="iconbtn" onClick={() => shiftDate(-1)} aria-label={t('common.previous', 'Previous day')}>
              <ChevronLeft size={14} />
            </button>
            <input
              type="date"
              className="attn-date-input"
              value={date}
              max={toTodayDateString()}
              onChange={(e) => {
                const selected = e.target.value;
                if (selected > toTodayDateString()) {
                  setSaveMessage({ type: 'error', text: t('attendance.cannotMarkFutureDate', 'Cannot mark attendance for a future date.') });
                  clearMessageAfter(3000);
                  return;
                }
                setDate(selected);
              }}
              aria-label={t('pages.date', 'Date')}
            />
            <button type="button" className="iconbtn" onClick={() => shiftDate(1)} aria-label={t('common.next', 'Next day')} disabled={date >= toTodayDateString()}>
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm mono tnum"
              onClick={() => setDate(toTodayDateString())}
              disabled={date === toTodayDateString()}
            >
              {t('common.today', 'Today')}
            </button>
          </div>
          <div className="seg" role="tablist" aria-label={t('attendance.view', 'View')}>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'daily'}
              className={`seg__btn ${view === 'daily' ? 'is-active' : ''}`}
              onClick={() => setView('daily')}
            >
              {t('attendance.daily', 'Daily')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'monthly'}
              className={`seg__btn ${view === 'monthly' ? 'is-active' : ''}`}
              onClick={() => setView('monthly')}
            >
              {t('attendance.monthly', 'Monthly')}
            </button>
          </div>
          {isLoadingAttendance && (
            <span aria-hidden="true" className="inline-block w-4 h-4 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)] animate-spin" />
          )}
        </div>

        <div className="attn-toolbar__right">
          <Button
            size="sm"
            variant="outline"
            icon={<Check size={14} />}
            onClick={markAllPresent}
            disabled={isReadOnly}
          >
            {t('pages.markAllPresent')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<CalendarDays size={14} />}
            onClick={onRegOpen}
            disabled={isLocked || !classStudents.length}
          >
            {t('attendance.regularize', 'Regularize')}
          </Button>
          {absentCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              icon={<Bell size={14} />}
              onClick={handleNotifyParents}
              loading={isNotifying}
            >
              {t('attendance.notifyParents', 'Notify Parents')} ({absentCount})
            </Button>
          )}
        </div>
      </div>

      {isLocked && (
        <Alert variant="warning" className="mx-6">
          {t('pages.attendanceIsLockedUnlockInSettingsToMakeChanges')}
        </Alert>
      )}
      {invalidDateReason && !isLocked && (
        <Alert variant="danger" className="mx-6">{invalidDateReason}</Alert>
      )}
      {!isOnline && (
        <Alert variant="warning" className="mx-6">
          <span className="flex items-center gap-2">
            <WifiOff size={16} />
            {t('attendance.offlineMode', 'You are offline. Attendance will be saved locally and synced automatically when your connection is restored.')}
          </span>
        </Alert>
      )}
      {offlinePendingCount > 0 && isOnline && (
        <Alert variant="info" className="mx-6">
          <span className="flex items-center gap-2">
            <RefreshCw size={16} className={offlineSyncing ? 'animate-spin' : ''} />
            {offlineSyncing
              ? t('attendance.syncingOffline', 'Syncing {{count}} offline attendance record(s)...', { count: offlinePendingCount })
              : t('attendance.pendingSync', '{{count}} attendance record(s) saved offline. Click to retry.', { count: offlinePendingCount })}
            {!offlineSyncing && (
              <button
                type="button"
                className="underline ml-2"
                onClick={syncNow}
              >
                {t('common.syncNow', 'Sync now')}
              </button>
            )}
          </span>
        </Alert>
      )}

      {/* KPI metric strip */}
      <div className="attn-metrics">
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.total2')}</span>
          <span className="dp-metric__value mono tnum">{classStudents.length}</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.present2')}</span>
          <span className="dp-metric__value mono tnum dp-metric__value--ok">{presentCount}</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.absent2')}</span>
          <span className="dp-metric__value mono tnum dp-metric__value--danger">{absentCount}</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('attendance.late', 'Late')} / {t('attendance.halfDay', 'Half')}</span>
          <span className="dp-metric__value mono tnum dp-metric__value--warn">{lateCount + halfdayCount}</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.unmarked')}</span>
          <span className="dp-metric__value mono tnum">{unmarkedCount}</span>
        </div>
        <div className="dp-metric">
          <span className="dp-metric__label">{t('pages.attendanceRate')}</span>
          <span className={`dp-metric__value mono tnum ${pctClass}`}>
            {markedCount === 0 ? '—' : `${attendancePercent}%`}
          </span>
        </div>
      </div>

      {/* 30-day heatmap */}
      <div className="attn-heatmap">
        <div className="attn-heatmap__head">
          <span className="attn-heatmap__title">
            <TrendingUp size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
            {t('attendance.last30Days', 'Last 30 days')}
          </span>
          <span className="attn-heatmap__legend">
            <span>{t('attendance.low', 'Low')}</span>
            <span className="attn-heatmap__legend-sw lv-1" />
            <span className="attn-heatmap__legend-sw lv-2" />
            <span className="attn-heatmap__legend-sw lv-3" />
            <span className="attn-heatmap__legend-sw lv-4" />
            <span>{t('attendance.high', 'High')}</span>
          </span>
        </div>
        <div className="attn-heatmap__grid">
          {heatmapDates.map((d) => {
            const level = heatmapLevel(d);
            const cell = heatmap[d];
            const titleParts = [d];
            if (isNonWorkingDate(d)) titleParts.push(t('attendance.nonWorkingDayShort', 'Non-working'));
            else if (cell?.hasData) titleParts.push(`${cell.rate}% · ${cell.marked} ${t('attendance.marked', 'marked')}`);
            else titleParts.push(t('attendance.noData', 'No data'));
            return (
              <button
                key={d}
                type="button"
                className={`attn-heatmap__cell ${level} ${d === date ? 'is-selected' : ''}`}
                onClick={() => setDate(d)}
                title={titleParts.join(' · ')}
                aria-label={titleParts.join(', ')}
              />
            );
          })}
        </div>
      </div>

      {/* Mark grid */}
      {view === 'daily' && (
        <div className="attn-grid" role="table" aria-label={t('aria.misc.studentAttendanceProgress')}>
          <div className="attn-grid__head" role="row">
            <span role="columnheader">{t('pages.rOLL')}</span>
            <span role="columnheader">{t('pages.nAME')}</span>
            <span role="columnheader">{t('pages.sTATUS')}</span>
            <span role="columnheader">{t('pages.aCTIONS')}</span>
          </div>
          {classStudents.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState
                size="sm"
                title={t('attendance.noStudentsInClass', 'No students found in this class')}
              />
            </div>
          ) : (
            classStudents.map((student) => {
              const studentId = sid(student);
              const currentStatus = attendance[studentId];
              const cfg = STATUS_MAP[currentStatus];
              const isActive = activeStudentId === studentId;
              return (
                <div
                  key={studentId}
                  className={`attn-grid__row ${isActive ? 'is-active' : ''}`}
                  role="row"
                  onMouseEnter={() => setActiveStudentId(studentId)}
                  onFocus={() => setActiveStudentId(studentId)}
                >
                  <span className="attn-grid__roll" role="cell">#{student.rollNo}</span>
                  <button
                    type="button"
                    className="attn-grid__name"
                    role="cell"
                    onClick={() => navigate(`/students/${studentId}`)}
                  >
                    {student.name}
                  </button>
                  <span role="cell">
                    {cfg ? (
                      <span className={`status status--${cfg.key === 'present' ? 'ok' : cfg.key === 'absent' ? 'danger' : cfg.key === 'late' ? 'warn' : cfg.key === 'halfday' ? 'info' : 'info'}`}>
                        <span className="dot" />
                        {t(cfg.labelKey, cfg.label)}
                      </span>
                    ) : (
                      <span className="status">
                        <span className="dot" />
                        {t('attendance.notMarked', 'Not Marked')}
                      </span>
                    )}
                  </span>
                  <span className="attn-pillrow" role="cell">
                    {ATTENDANCE_STATUSES.map(({ key, label, labelKey, icon: Icon, shortcut }) => {
                      const active = currentStatus === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`attn-pill ${active ? `is-active is-${key}` : ''}`}
                          onClick={() => markAttendance(studentId, key)}
                          disabled={isReadOnly}
                          aria-pressed={active}
                          aria-label={t(labelKey, label)}
                          title={`${t(labelKey, label)} (${shortcut})`}
                        >
                          <Icon size={12} />
                          <span>{t(labelKey, label)}</span>
                          {isActive && !isReadOnly && <span className="kbd">{shortcut}</span>}
                        </button>
                      );
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === 'monthly' && (
        <div className="attn-heatmap" style={{ marginTop: 0 }}>
          <div className="attn-heatmap__head">
            <span className="attn-heatmap__title">{t('attendance.monthlyView', 'Monthly view')}</span>
            <span className="attn-heatmap__legend">{t('attendance.monthlyHint', 'Tap a day to mark its attendance')}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: '8px 0 0' }}>
            {t('attendance.useHeatmap', 'Use the calendar above to jump between dates.')}
          </p>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="attn-savebar">
        <div className="attn-savebar__left">
          {saveMessage ? (
            <span className={`attn-savebar__msg--${saveMessage.type === 'success' ? 'ok' : saveMessage.type === 'warning' ? 'warn' : 'danger'}`}>
              {saveMessage.text}
            </span>
          ) : (
            <span className="mono tnum">{markedCount}/{classStudents.length} {t('attendance.marked', 'marked')}</span>
          )}
          <span className="attn-savebar__hint">
            <span className="kbd">P</span>{t('attendance.present', 'Present')}
            <span className="kbd">A</span>{t('attendance.absent', 'Absent')}
            <span className="kbd">L</span>{t('attendance.leave', 'Leave')}
          </span>
        </div>
        <div className="attn-savebar__right">
          <Button
            size="sm"
            variant="ghost"
            onClick={markAllPresent}
            disabled={isReadOnly}
          >
            {t('pages.markAllPresent')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveAttendance}
            disabled={isReadOnly || isSaving}
            loading={isSaving}
            icon={!isOnline ? <WifiOff size={14} /> : null}
          >
            {isSaving
              ? t('common.saving', 'Saving...')
              : !isOnline
                ? t('attendance.saveOffline', 'Save Offline')
                : t('attendance.saveAttendance', 'Save Attendance')}
          </Button>
        </div>
      </div>

      {/* Regularize drawer */}
      <Drawer
        isOpen={isRegOpen}
        onClose={onRegClose}
        size="md"
        title={t('attendance.regularize', 'Regularize attendance')}
        description={`${date} · ${classStudents.length} ${t('pages.students', 'students')}`}
      >
        <div style={{ padding: 16 }}>
          {classStudents.length === 0 ? (
            <EmptyState size="sm" title={t('attendance.noStudentsInClass', 'No students found in this class')} />
          ) : (
            classStudents.map((student) => {
              const studentId = sid(student);
              const currentStatus = attendance[studentId] || 'unmarked';
              return (
                <div key={studentId} className="attn-regdrawer__row">
                  <div className="attn-regdrawer__meta">
                    <span className="attn-regdrawer__name">{student.name}</span>
                    <span className="attn-regdrawer__sub">#{student.rollNo}</span>
                  </div>
                  <div className="attn-pillrow">
                    {ATTENDANCE_STATUSES.map(({ key, label, labelKey, icon: Icon }) => {
                      const active = currentStatus === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`attn-pill ${active ? `is-active is-${key}` : ''}`}
                          onClick={() => markAttendance(studentId, key)}
                          disabled={isLocked}
                          aria-pressed={active}
                          aria-label={t(labelKey, label)}
                        >
                          <Icon size={12} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="sm" variant="ghost" onClick={onRegClose}>
              {t('common.close', 'Close')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => { onRegClose(); handleSaveAttendance(); }}
              disabled={isLocked}
            >
              {t('common.applyAndSave', 'Apply & Save')}
            </Button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={isMarkAllOpen}
        onClose={onMarkAllClose}
        size="sm"
        title={<span className="flex items-center gap-2"><AlertTriangle size={18} className="text-[var(--warn)]" />{t('attendance.markAllPresentTitle', 'Mark All Present?')}</span>}
        footer={<>
          <Button size="sm" variant="secondary" onClick={onMarkAllClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button size="sm" variant="primary" onClick={handleConfirmMarkAllPresent}>{t('attendance.markAllPresentConfirm', 'Mark All Present')}</Button>
        </>}
      >
        <p className="text-sm text-[var(--fg-muted)]">
          {t('attendance.markAllPresentMessage', 'This will mark all {{count}} students as present, overwriting any statuses already set individually.', { count: classStudents.length })}
        </p>
      </Modal>

      <Modal
        isOpen={isOverwriteOpen}
        onClose={onOverwriteClose}
        size="sm"
        title={<span className="flex items-center gap-2"><AlertTriangle size={18} className="text-[var(--warn)]" />{t('attendance.overwriteTitle', 'Attendance Already Saved')}</span>}
        footer={<>
          <Button size="sm" variant="secondary" onClick={onOverwriteClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button size="sm" variant="danger" onClick={handleConfirmOverwrite}>{t('attendance.overwriteConfirm', 'Overwrite')}</Button>
        </>}
      >
        <p className="text-sm text-[var(--fg-muted)]">
          {t('attendance.overwriteMessage', 'Attendance for this class on {{date}} has already been saved. Saving again will overwrite the existing records.', { date })}
        </p>
      </Modal>

      {absentCount > 0 && (
        <Alert variant="danger" title={t('pages.absenteesToday')} className="mx-6 mt-2">
          <div className="flex flex-wrap gap-2 mt-2">
            {classStudents.filter(s => attendance[sid(s)] === 'absent').map(s => (
              <button
                key={sid(s)}
                type="button"
                className="chip"
                onClick={() => navigate(`/students/${sid(s)}`)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </Alert>
      )}

    </div>
  );
}
