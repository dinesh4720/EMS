import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, useDisclosure } from "@heroui/react";
import { Check, X, Bell, AlertTriangle, Users, Clock, TrendingUp, TimerOff, LogOut, AlarmClock } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useSettings } from "../../context/SettingsContext";
import { attendanceApi, classesApi } from "../../services/api";
import { useTranslation } from 'react-i18next';
import { toTodayDateString } from '../../utils/dateFormatter';
import logger from '../../utils/logger';
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import Alert from "../../components/ui/Alert";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import Chip from "../../components/ui/Chip";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";


const ITEMS_PER_LOAD = 10;

// DS Chip supports: neutral/primary/success/warning/danger/info
const ATTENDANCE_STATUSES = [
  { key: 'present', labelKey: 'attendance.present', label: 'Present', color: 'success', icon: Check },
  { key: 'absent', labelKey: 'attendance.absent', label: 'Absent', color: 'danger', icon: X },
  { key: 'late', labelKey: 'attendance.late', label: 'Late', color: 'warning', icon: AlarmClock },
  { key: 'leave', labelKey: 'attendance.leave', label: 'Leave', color: 'info', icon: LogOut },
  { key: 'halfday', labelKey: 'attendance.halfDay', label: 'Half Day', color: 'primary', icon: TimerOff },
];

const STATUS_MAP = Object.fromEntries(ATTENDANCE_STATUSES.map(s => [s.key, s]));

/** Safely extract student ID string, preferring _id (MongoDB) over id (virtual) */
const sid = (s) => String(s?._id || s?.id || '');

export default function Attendance({
  classId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { students, classesWithTeachers } = useApp();
  const { schoolSettings, events } = useSettings();
  const [date, setDate] = useState(toTodayDateString());
  const [selectedClass, setSelectedClass] = useState(classId || "");
  const [attendance, setAttendance] = useState({});
  // AUDIT-227: Use school setting for lock period, fallback to 7 days
  const attendanceLockDays = schoolSettings?.attendanceLockDays ?? 7;
  const isLocked = useMemo(() => {
    if (!date) return false;
    const selected = new Date(date + 'T00:00:00Z'); // Use UTC to avoid timezone issues
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - attendanceLockDays);
    cutoff.setHours(0, 0, 0, 0);
    return selected < cutoff;
  }, [date, attendanceLockDays]);
  const isFutureDate = useMemo(() => {
    if (!date) return false;
    return date > toTodayDateString();
  }, [date]);

  // AUDIT-444: Check if selected date is a holiday or non-working day
  const invalidDateReason = useMemo(() => {
    if (!date) return null;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(date + 'T00:00:00Z');
    const dayOfWeek = dayNames[d.getUTCDay()];
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
  const { isOpen: isOverwriteOpen, onOpen: onOverwriteOpen, onClose: onOverwriteClose } = useDisclosure();
  const { isOpen: isMarkAllOpen, onOpen: onMarkAllOpen, onClose: onMarkAllClose } = useDisclosure();
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const messageTimerRef = useRef(null);
  // Synchronous guard against double-click race condition — React state updates
  // are batched so isSaving may still be false on a fast second click
  const isSubmittingRef = useRef(false);

  // Helper: auto-clear saveMessage after `ms`, cancelling any previous timer
  const clearMessageAfter = useCallback((ms) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setSaveMessage(null), ms);
  }, []);

  // Cleanup message timer on unmount
  useEffect(() => {
    return () => { if (messageTimerRef.current) clearTimeout(messageTimerRef.current); };
  }, []);

  // Determine if we're embedded inside ClassDashboard (classId prop is an ObjectId)
  const isEmbedded = !!classId;


  // Set default selected class when classesWithTeachers loads (for standalone mode)
  useEffect(() => {
    if (!classId && !selectedClass && classesWithTeachers.length > 0) {
      const first = classesWithTeachers[0];
      // Use class ID as key to avoid issues with hyphens in class names
      setSelectedClass(first.id || first._id || `${first.name}-${first.section}`);
    }
  }, [classId, selectedClass, classesWithTeachers]);

  // Resolve the actual class ID for API calls
  const resolvedClassId = useMemo(() => {
    if (classId) return classId; // ObjectId from ClassDashboard
    if (!selectedClass) return null;
    // selectedClass is now a class ID; fall back to name-section lookup for legacy values
    const directMatch = classesWithTeachers.find(c => String(c.id || c._id) === String(selectedClass));
    if (directMatch) return directMatch.id || directMatch._id;
    // Legacy fallback: name-section string
    const lastDash = selectedClass.lastIndexOf('-');
    if (lastDash > 0) {
      const name = selectedClass.slice(0, lastDash);
      const section = selectedClass.slice(lastDash + 1);
      const cls = classesWithTeachers.find(c => c.name === name && c.section === section);
      return cls?.id || cls?._id || null;
    }
    return null;
  }, [classId, selectedClass, classesWithTeachers]);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    if (classId) {
      // When classId is an ObjectId (embedded in ClassDashboard), filter by classId
      return students.filter(s =>
        String(s.classId) === String(classId) &&
        (s.status || 'active') === 'active' &&
        s.isDeleted !== true
      );
    }
    // When in standalone mode, filter by class ID (selectedClass is now an ID)
    return students.filter(s =>
      String(s.classId) === String(selectedClass) &&
      (s.status || 'active') === 'active' &&
      s.isDeleted !== true
    );
  }, [students, selectedClass, classId]);

  // Keep a ref to classStudents so fetchAttendance doesn't re-trigger
  // whenever the context gives students a new array reference
  const classStudentsRef = useRef(classStudents);
  useLayoutEffect(() => {
    classStudentsRef.current = classStudents;
  }, [classStudents]);

  // Fetch existing attendance from API when date or class changes
  const fetchAttendance = useCallback(async () => {
    if (!resolvedClassId || !date) return;
    const currentStudents = classStudentsRef.current;
    if (!currentStudents?.length) return;

    try {
      setIsLoadingAttendance(true);
      const data = await attendanceApi.getByClassDate(resolvedClassId, date);

      // Backend returns an object map: { [studentId]: { status, markedBy } }
      // or an array of records — handle both formats
      const existingAttendance = {};
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          // Array format: [{ studentId, status, ... }]
          data.forEach(record => {
            const studentId = String(record.studentId?._id || record.studentId || '');
            if (studentId) existingAttendance[studentId] = record.status || "present";
          });
        } else {
          // Object map format: { [studentId]: { status, markedBy } }
          Object.entries(data).forEach(([studentId, record]) => {
            if (studentId && record?.status) {
              existingAttendance[studentId] = record.status;
            }
          });
        }
      }

      // Track whether attendance was already saved for this class+date
      const hasRecords = Object.keys(existingAttendance).length > 0;
      setHasExistingAttendance(hasRecords);

      // AUDIT-803: Merge fetched data without overwriting entries the user has already
      // toggled mid-session. If the user clicked a cell before the API responded,
      // their choice wins; only "unmarked" (untouched) slots get the server value.
      setAttendance(prev => {
        const next = { ...prev };
        currentStudents.forEach(s => {
          const studentId = sid(s);
          if (!prev[studentId] || prev[studentId] === "unmarked") {
            next[studentId] = existingAttendance[studentId] || "unmarked";
          }
        });
        return next;
      });
    } catch (error) {
      // If 404 or no data, initialize untouched students as unmarked but keep user edits
      logger.warn('No existing attendance found, initializing defaults:', error.message);
      setHasExistingAttendance(false);
      setAttendance(prev => {
        const next = { ...prev };
        currentStudents.forEach(s => {
          const studentId = sid(s);
          if (!prev[studentId] || prev[studentId] === "unmarked") {
            next[studentId] = "unmarked";
          }
        });
        return next;
      });
    } finally {
      setIsLoadingAttendance(false);
    }
  // Only re-fetch when the actual classId or date changes, NOT when classStudents reference changes
  }, [resolvedClassId, date]);

  // Fetch attendance when classId or date changes, or when students first become available
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

  const { visibleItems: visibleStudents, hasMore, isLoadingMore, loaderRef } = useEntityFetch(
    classStudents,
    [selectedClass, classId]
  );

  const markAttendance = (studentId, status) => {
    if (!isLocked && !isFutureDate && !invalidDateReason) setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    if (!isLocked && !isFutureDate && !invalidDateReason) onMarkAllOpen();
  };

  const handleConfirmMarkAllPresent = () => {
    onMarkAllClose();
    const newAttendance = {};
    classStudents.forEach(s => { newAttendance[sid(s)] = "present"; });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  const handleNotifyParents = async () => {
    if (!resolvedClassId || !date || isNotifying) return;
    setIsNotifying(true);
    try {
      const res = await classesApi.notifyParents({ classId: resolvedClassId, date });
      setSaveMessage({
        type: 'success',
        text: res?.message || t('attendance.notifiedParents', 'Notified parents of {{count}} absent student(s)', { count: absentCount }),
      });
    } catch (error) {
      // Graceful fallback: if the endpoint doesn't exist or fails, show a toast-style message
      logger.warn('Notify parents failed:', error?.message);
      setSaveMessage({
        type: 'error',
        text: error?.message || t('attendance.failedToNotifyParents', 'Failed to notify parents. The notification service may be unavailable.'),
      });
    } finally {
      setIsNotifying(false);
      clearMessageAfter(4000);
    }
  };

  // AUDIT-455: Validate before save, prompt confirmation if overwriting existing attendance
  const handleSaveAttendance = () => {
    if (isLocked || isSaving || isSubmittingRef.current || invalidDateReason) return;

    // AUDIT-45: Prevent saving attendance for future dates
    const today = toTodayDateString();
    if (date > today) {
      setSaveMessage({ type: 'error', text: t('attendance.cannotSaveFutureDate', 'Cannot save attendance for a future date.') });
      clearMessageAfter(3000);
      return;
    }

    // Only send students who have been explicitly marked with a valid status
    const validStatuses = ATTENDANCE_STATUSES.map(s => s.key);
    const markedStudents = classStudents.filter(s =>
      validStatuses.includes(attendance[sid(s)])
    );

    if (markedStudents.length === 0) {
      setSaveMessage({
        type: 'error',
        text: t('attendance.markAtLeastOne', 'Please mark attendance for at least one student before saving')
      });
      clearMessageAfter(3000);
      return;
    }

    if (!resolvedClassId) {
      setSaveMessage({ type: 'error', text: t('attendance.selectValidClass', 'Please select a valid class') });
      clearMessageAfter(3000);
      return;
    }

    // If attendance already exists for this class+date, confirm before overwriting
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
    const markedStudents = classStudents.filter(s =>
      validStatuses.includes(attendance[sid(s)])
    );

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Convert attendance state to API format - only marked students
      const attendanceData = markedStudents.map(student => ({
        studentId: sid(student),
        status: attendance[sid(student)]
      }));

      // Use the resolved class ID (ObjectId) for the API call
      const response = await attendanceApi.markBulk({
        classId: resolvedClassId,
        date: date,
        attendance: attendanceData,
        clientTimestamp: new Date().toISOString()
      });

      // After successful save, mark as existing so subsequent saves also warn
      setHasExistingAttendance(true);

      const savedCount = response.results?.length ?? markedStudents.length;
      const skippedCount = response.skipped?.length ?? 0;
      const unmarkedRemaining = classStudents.length - markedStudents.length;
      const unmarkedWarning = unmarkedRemaining > 0 ? ` (${unmarkedRemaining} ${t('attendance.stillUnmarked', 'still unmarked')})` : '';

      if (skippedCount > 0 && savedCount === 0) {
        // All submitted records were rejected by the server
        setSaveMessage({
          type: 'error',
          text: t('attendance.allSkipped', 'No attendance saved — {{count}} record(s) were rejected by the server', { count: skippedCount }),
        });
        clearMessageAfter(5000);
      } else if (skippedCount > 0) {
        // Partial save — some records were skipped
        setSaveMessage({
          type: 'warning',
          text: t('attendance.partialSave', 'Saved {{saved}} student(s); {{skipped}} record(s) could not be saved', { saved: savedCount, skipped: skippedCount }) + unmarkedWarning,
        });
        clearMessageAfter(5000);
      } else {
        setSaveMessage({
          type: 'success',
          text: t('attendance.savedForStudents', 'Attendance saved for {{count}} students', { count: savedCount }) + unmarkedWarning,
        });
        clearMessageAfter(3000);
      }
    } catch (error) {
      logger.error('Error saving attendance:', error);
      setSaveMessage({
        type: 'error',
        text: error.message || t('attendance.failedToSave', 'Failed to save attendance')
      });

      // Auto-hide error message after 5 seconds
      clearMessageAfter(5000);
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleConfirmOverwrite = () => {
    onOverwriteClose();
    performSave();
  };

  // AUDIT-803: Wrap summary counts in useMemo so React sees attendance as an explicit
  // dependency. Without this, any future refactor that hoists these out of the render
  // body (e.g. for perf) could silently produce stale totals after a cell toggle.
  const {
    presentCount, absentCount, lateCount, leaveCount, halfdayCount,
    unmarkedCount, markedCount, attendancePercent, defaulters,
  } = useMemo(() => {
    const present  = classStudents.filter(s => attendance[sid(s)] === "present").length;
    const absent   = classStudents.filter(s => attendance[sid(s)] === "absent").length;
    const late     = classStudents.filter(s => attendance[sid(s)] === "late").length;
    const leave    = classStudents.filter(s => attendance[sid(s)] === "leave").length;
    const halfday  = classStudents.filter(s => attendance[sid(s)] === "halfday").length;
    const unmarked = classStudents.filter(s => !attendance[sid(s)] || attendance[sid(s)] === "unmarked").length;
    const marked   = present + absent + late + leave + halfday;
    // AUDIT-46/456: Count halfday as 0.5; late weight is configurable via school settings (default 100%)
    const lateW    = (schoolSettings?.attendanceRules?.lateWeight ?? 100) / 100;
    const effective = present + late * lateW + halfday * 0.5;
    const pct      = marked > 0 ? Math.round((effective / marked) * 100) : 0;
    const abs      = classStudents.filter(s => attendance[sid(s)] === "absent");
    return {
      presentCount: present, absentCount: absent, lateCount: late,
      leaveCount: leave, halfdayCount: halfday, unmarkedCount: unmarked,
      markedCount: marked, attendancePercent: pct, defaulters: abs,
    };
  }, [attendance, classStudents, schoolSettings?.attendanceRules?.lateWeight]);

  return (
    <div className={`w-full flex flex-col ${isEmbedded ? 'bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5' : ''}`}>
      {/* Toolbar */}
      <div className={`flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-[var(--color-border)] py-4 ${isEmbedded ? 'mb-0' : '-mx-6 -mt-6 px-6 mb-0'}`}>
        {/* Left Side - Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {!classId && (
            <Select
              size="sm"
              value={selectedClass || ''}
              onChange={(e) => { setSelectedClass(e.target.value); }}
              className="w-[180px]"
              aria-label={t('pages.class1')}
            >
              {classesWithTeachers.map(c => (
                <option key={c.id || c._id || `${c.name}-${c.section}`} value={c.id || c._id || `${c.name}-${c.section}`}>
                  {c.name} - {c.section}
                </option>
              ))}
            </Select>
          )}
          <Input
            type="date"
            size="sm"
            value={date}
            max={toTodayDateString()}
            onChange={(e) => {
              const selected = e.target.value;
              const today = toTodayDateString();
              if (selected > today) {
                setSaveMessage({ type: 'error', text: t('attendance.cannotMarkFutureDate', 'Cannot mark attendance for a future date.') });
                clearMessageAfter(3000);
                return;
              }
              setDate(selected);
            }}
            className="w-[150px]"
            aria-label={t('pages.date', 'Date')}
          />
          {isLoadingAttendance && (
            <span
              aria-hidden="true"
              className="inline-block w-4 h-4 rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-primary)] animate-spin"
            />
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            icon={<Check size={14} />}
            onClick={markAllPresent}
            disabled={isLocked || isFutureDate || !!invalidDateReason}
          >
            {t('pages.markAllPresent')}
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
        <Alert variant="warning" className="mb-4 mx-1">
          {t('pages.attendanceIsLockedUnlockInSettingsToMakeChanges')}
        </Alert>
      )}

      {invalidDateReason && !isLocked && (
        <Alert variant="danger" className="mb-4 mx-1">
          {invalidDateReason}
        </Alert>
      )}

      {/* KPI Stats - Card Grid Style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
        <StatCard label={t('pages.total2')} value={classStudents.length} icon={Users} color="gray" />
        <StatCard label={t('pages.present2')} value={presentCount} icon={Check} color="success" />
        <StatCard label={t('pages.absent2')} value={absentCount} icon={X} color="danger" />
        {lateCount > 0 && <StatCard label={t('attendance.late', 'Late')} value={lateCount} icon={AlarmClock} color="warning" />}
        {leaveCount > 0 && <StatCard label={t('attendance.leave', 'Leave')} value={leaveCount} icon={LogOut} color="purple" />}
        {halfdayCount > 0 && <StatCard label={t('attendance.halfDay', 'Half Day')} value={halfdayCount} icon={TimerOff} color="primary" />}
        {unmarkedCount > 0 && <StatCard label={t('pages.unmarked')} value={unmarkedCount} icon={Clock} color="gray" />}
        <StatCard
          label={t('pages.attendanceRate')}
          value={markedCount === 0 ? '—' : `${attendancePercent}%`}
          icon={TrendingUp}
          color={markedCount === 0 ? 'gray' : attendancePercent >= 75 ? 'success' : 'danger'}
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 mb-4 pb-4 border-b border-[var(--color-border)]">
        {saveMessage && (
          <span className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-[var(--color-success)]' : saveMessage.type === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'}`}>
            {saveMessage.text}
          </span>
        )}
        <Button
          size="md"
          variant="primary"
          onClick={handleSaveAttendance}
          disabled={isLocked || isFutureDate || isSaving || !!invalidDateReason}
          loading={isSaving}
          className="px-8"
        >
          {isSaving ? t('common.saving', 'Saving...') : t('attendance.saveAttendance', 'Save Attendance')}
        </Button>
      </div>

      {/* Main Table */}
      <Table
        aria-label={t('aria.misc.studentAttendanceProgress')}
        radius="none"
        removeWrapper
        classNames={{
          base: `${isEmbedded ? '' : '-mx-6'} overflow-visible [&_table]:border-spacing-0 [&_table]:select-text ${isEmbedded ? '' : '[&_table]:w-[calc(100%+3rem)]'}`,
          thead: `[&>tr]:first:shadow-none [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12 ${isEmbedded ? '' : '[&_tr>th:first-child]:pl-6'}`,
          th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default select-none",
          td: "py-0 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 select-text",
          tbody: `[&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-0 ${isEmbedded ? '' : '[&>tr>td:first-child]:pl-6'}`,
          tr: "",
        }}
      >
        <TableHeader>
          <TableColumn scope="col">{t('pages.rOLL')}</TableColumn>
          <TableColumn scope="col">{t('pages.nAME')}</TableColumn>
          <TableColumn scope="col">{t('pages.sTATUS')}</TableColumn>
          <TableColumn scope="col">{t('pages.aCTIONS')}</TableColumn>
        </TableHeader>
        <TableBody emptyContent={
          isLoadingAttendance ? (
            <div className="py-6 flex justify-center">
              <span
                aria-hidden="true"
                className="inline-block w-5 h-5 rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-primary)] animate-spin"
              />
            </div>
          ) : (
            <EmptyState
              icon={Users}
              size="sm"
              title={classStudents.length === 0
                ? t('attendance.noStudentsInClass', 'No students found in this class')
                : t('common.noData', 'No data')}
            />
          )
        }>
          {visibleStudents.map((student) => {
            const currentStatus = attendance[sid(student)];
            const statusConfig = STATUS_MAP[currentStatus];
            return (
              <TableRow key={sid(student)} className="hover:bg-[var(--color-bg-secondary)]">
                <TableCell>
                  <div className="py-4 text-[var(--color-text-secondary)] text-sm">
                    {student.rollNo}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4">
                    <button
                      type="button"
                      className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)] cursor-pointer transition-colors bg-transparent border-0 p-0 text-left"
                      onClick={() => navigate(`/students/${sid(student)}`)}
                    >
                      {student.name}
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4">
                    <Chip
                      size="sm"
                      color={statusConfig?.color || "neutral"}
                      className="capitalize"
                    >
                      {statusConfig ? t(statusConfig.labelKey, statusConfig.label) : t('attendance.notMarked', 'Not Marked')}
                    </Chip>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="py-4 flex gap-1 flex-wrap">
                    {ATTENDANCE_STATUSES.map(({ key, label, labelKey, color, icon: Icon }) => {
                      const isActive = currentStatus === key;
                      const isDisabled = isLocked || isFutureDate || !!invalidDateReason;
                      return (
                        <Chip
                          key={key}
                          size="sm"
                          color={color}
                          selected={isActive}
                          onClick={isDisabled ? undefined : () => markAttendance(sid(student), key)}
                          disabled={isDisabled}
                          startContent={<Icon size={13} />}
                          aria-pressed={isActive}
                          aria-label={t(labelKey, label)}
                        >
                          <span className="hidden sm:inline">{t(labelKey, label)}</span>
                        </Chip>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Lazy loading indicator */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {isLoadingMore && (
          <span
            aria-hidden="true"
            className="inline-block w-4 h-4 rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-primary)] animate-spin"
          />
        )}
        {!hasMore && classStudents.length > ITEMS_PER_LOAD && (
          <span className="text-[var(--color-text-muted)] text-sm">{t('attendance.allStudentsLoaded', 'All {{count}} students loaded', { count: classStudents.length })}</span>
        )}
      </div>

      <Modal
        isOpen={isMarkAllOpen}
        onClose={onMarkAllClose}
        size="sm"
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[var(--color-warning)]" />
            {t('attendance.markAllPresentTitle', 'Mark All Present?')}
          </span>
        }
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={onMarkAllClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button size="sm" variant="primary" onClick={handleConfirmMarkAllPresent}>
              {t('attendance.markAllPresentConfirm', 'Mark All Present')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t('attendance.markAllPresentMessage', 'This will mark all {{count}} students as present, overwriting any statuses already set individually.', { count: classStudents.length })}
        </p>
      </Modal>

      <Modal
        isOpen={isOverwriteOpen}
        onClose={onOverwriteClose}
        size="sm"
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[var(--color-warning)]" />
            {t('attendance.overwriteTitle', 'Attendance Already Saved')}
          </span>
        }
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={onOverwriteClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button size="sm" variant="danger" onClick={handleConfirmOverwrite}>
              {t('attendance.overwriteConfirm', 'Overwrite')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t('attendance.overwriteMessage', 'Attendance for this class on {{date}} has already been saved. Saving again will overwrite the existing records.', { date })}
        </p>
      </Modal>

      {defaulters.length > 0 && (
        <Alert
          variant="danger"
          title={t('pages.absenteesToday')}
          className="mt-6"
        >
          <div className="flex flex-wrap gap-2 mt-2">
            {defaulters.map(s => (
              <Chip
                key={sid(s)}
                size="sm"
                color="danger"
                onClick={() => navigate(`/students/${sid(s)}`)}
              >
                {s.name}
              </Chip>
            ))}
          </div>
        </Alert>
      )}
    </div>
  );
}
