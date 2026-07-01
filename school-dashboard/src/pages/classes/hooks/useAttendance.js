/**
 * useAttendance
 * Encapsulates all state, data-fetching, derived values, and action handlers
 * for the class Attendance page. The Attendance component only composes UI from
 * what this hook returns. Behaviour is intentionally identical to the former
 * monolithic Attendance.jsx — logic was transplanted verbatim, not rewritten.
 */
import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { useApp } from "../../../context/AppContext";
import { useSettings } from "../../../context/SettingsContext";
import { attendanceApi, classesApi } from "../../../services/api";
import { useTranslation } from "react-i18next";
import { toTodayDateString } from "../../../utils/dateFormatter";
import logger from "../../../utils/logger";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { useOfflineAttendanceSync } from "../../../hooks/useOfflineAttendanceSync";
import { queueOfflineAttendance, getCachedAttendance } from "../../../services/offlineAttendance";
import { useAttendanceHeatmap } from "./useAttendanceHeatmap";
import {
  ATTENDANCE_STATUSES,
  SHORTCUT_MAP,
  DAY_NAMES,
  sid,
  toLocalDateString,
} from "../utils/attendanceConstants";

export function useAttendance(classId) {
  const { t } = useTranslation();
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

  // ---------- 30-day heatmap (extracted to its own hook) ----------
  const { heatmapDates, heatmap, heatmapLevel, isNonWorkingDate } =
    useAttendanceHeatmap(resolvedClassId, date, schoolSettings, events);

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

  const shiftDate = (delta) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + delta);
    const next = toLocalDateString(d);
    if (next > toTodayDateString()) return;
    setDate(next);
  };

  /** Date `<input>` change guard — rejects future dates with a transient message. */
  const handleDateInputChange = useCallback((selected) => {
    if (selected > toTodayDateString()) {
      setSaveMessage({ type: 'error', text: t('attendance.cannotMarkFutureDate', 'Cannot mark attendance for a future date.') });
      clearMessageAfter(3000);
      return;
    }
    setDate(selected);
  }, [t, clearMessageAfter]);

  const pctClass = markedCount === 0 ? '' : attendancePercent >= 85 ? 'dp-metric__value--ok' : attendancePercent >= 60 ? 'dp-metric__value--warn' : 'dp-metric__value--danger';

  return {
    // context / toolbar
    isEmbedded,
    classesWithTeachers,
    selectedClass, setSelectedClass,
    date, setDate, shiftDate, handleDateInputChange,
    view, setView,
    // status flags
    isLocked, invalidDateReason, isReadOnly,
    isLoadingAttendance, isSaving, isNotifying,
    isOnline, offlinePendingCount, offlineSyncing, syncNow,
    saveMessage,
    // data
    classStudents, attendance,
    activeStudentId, setActiveStudentId,
    // heatmap
    heatmapDates, heatmap, heatmapLevel, isNonWorkingDate,
    // counts
    presentCount, absentCount, lateCount, halfdayCount,
    unmarkedCount, markedCount, attendancePercent, pctClass,
    // actions
    markAttendance, markAllPresent, handleConfirmMarkAllPresent,
    handleNotifyParents, handleSaveAttendance, handleConfirmOverwrite,
    // disclosures
    isOverwriteOpen, onOverwriteClose,
    isMarkAllOpen, onMarkAllClose,
    isRegOpen, onRegOpen, onRegClose,
  };
}
