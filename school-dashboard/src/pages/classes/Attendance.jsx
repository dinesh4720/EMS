import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Select, SelectItem, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Textarea, Spinner } from "@heroui/react";
import { Download, Check, X, Lock, Bell, AlertTriangle, Users, Clock, TrendingUp, TimerOff, LogOut, AlarmClock } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useSettings } from "../../context/SettingsContext";
import { attendanceApi, classesApi } from "../../services/api";
import { useTranslation } from 'react-i18next';

const ITEMS_PER_LOAD = 10;

const ATTENDANCE_STATUSES = [
  { key: 'present', labelKey: 'attendance.present', label: 'Present', color: 'success', icon: Check, bgClass: 'bg-green-100', textClass: 'text-green-600' },
  { key: 'absent', labelKey: 'attendance.absent', label: 'Absent', color: 'danger', icon: X, bgClass: 'bg-red-100', textClass: 'text-red-600' },
  { key: 'late', labelKey: 'attendance.late', label: 'Late', color: 'warning', icon: AlarmClock, bgClass: 'bg-amber-100', textClass: 'text-amber-600' },
  { key: 'leave', labelKey: 'attendance.leave', label: 'Leave', color: 'secondary', icon: LogOut, bgClass: 'bg-purple-100', textClass: 'text-purple-600' },
  { key: 'halfday', labelKey: 'attendance.halfDay', label: 'Half Day', color: 'primary', icon: TimerOff, bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
];

const STATUS_MAP = Object.fromEntries(ATTENDANCE_STATUSES.map(s => [s.key, s]));

/** Safely extract student ID string, preferring _id (MongoDB) over id (virtual) */
const sid = (s) => String(s?._id || s?.id || '');

export default function Attendance({
  classId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { students, classesWithTeachers } = useApp();
  const { schoolSettings } = useSettings();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  // editReason state removed - was unused
  const [isNotifying, setIsNotifying] = useState(false);

  // Determine if we're embedded inside ClassDashboard (classId prop is an ObjectId)
  const isEmbedded = !!classId;

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

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
    const directMatch = classesWithTeachers.find(c => (c.id || c._id) === selectedClass);
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

      // Merge: set fetched data, default remaining students to "unmarked"
      const merged = {};
      currentStudents.forEach(s => {
        const studentId = sid(s);
        merged[studentId] = existingAttendance[studentId] || "unmarked";
      });
      setAttendance(prev => ({ ...prev, ...merged }));
    } catch (error) {
      // If 404 or no data, initialize all as unmarked
      console.warn('No existing attendance found, initializing defaults:', error.message);
      const newAttendance = {};
      currentStudents.forEach(s => {
        newAttendance[sid(s)] = "unmarked";
      });
      setAttendance(prev => ({ ...prev, ...newAttendance }));
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

  const visibleStudents = useMemo(() => {
    return classStudents.slice(0, visibleCount);
  }, [classStudents, visibleCount]);

  const hasMore = visibleCount < classStudents.length;

  // Reset visible count when class changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [selectedClass, classId]);

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_LOAD);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const markAttendance = (studentId, status) => {
    if (!isLocked) setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    if (!isLocked) {
      const newAttendance = {};
      classStudents.forEach(s => { newAttendance[sid(s)] = "present"; });
      setAttendance(prev => ({ ...prev, ...newAttendance }));
    }
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
      console.warn('Notify parents failed:', error?.message);
      setSaveMessage({
        type: 'error',
        text: error?.message || t('attendance.failedToNotifyParents', 'Failed to notify parents. The notification service may be unavailable.'),
      });
    } finally {
      setIsNotifying(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleSaveAttendance = async () => {
    if (isLocked || isSaving) return;

    // AUDIT-45: Prevent saving attendance for future dates
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setSaveMessage({ type: 'error', text: t('attendance.cannotSaveFutureDate', 'Cannot save attendance for a future date.') });
      setTimeout(() => setSaveMessage(null), 3000);
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
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    if (!resolvedClassId) {
      setSaveMessage({ type: 'error', text: t('attendance.selectValidClass', 'Please select a valid class') });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

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

      // Show success message with unmarked warning if applicable
      const savedCount = response.results?.length || markedStudents.length;
      const unmarkedWarning = unmarkedCount > 0 ? ` (${unmarkedCount} ${t('attendance.stillUnmarked', 'still unmarked')})` : '';
      setSaveMessage({
        type: 'success',
        text: t('attendance.savedForStudents', 'Attendance saved for {{count}} students', { count: savedCount }) + unmarkedWarning
      });

      // Auto-hide message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      setSaveMessage({
        type: 'error',
        text: error.message || t('attendance.failedToSave', 'Failed to save attendance')
      });

      // Auto-hide error message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = classStudents.filter(s => attendance[sid(s)] === "present").length;
  const absentCount = classStudents.filter(s => attendance[sid(s)] === "absent").length;
  const lateCount = classStudents.filter(s => attendance[sid(s)] === "late").length;
  const leaveCount = classStudents.filter(s => attendance[sid(s)] === "leave").length;
  const halfdayCount = classStudents.filter(s => attendance[sid(s)] === "halfday").length;
  const unmarkedCount = classStudents.filter(s => !attendance[sid(s)] || attendance[sid(s)] === "unmarked").length;
  const markedCount = presentCount + absentCount + lateCount + leaveCount + halfdayCount;
  // AUDIT-46: Count halfday as 0.5 present in percentage; late counts as fully present
  const effectivePresent = presentCount + lateCount + halfdayCount * 0.5;
  const attendancePercent = markedCount > 0 ? Math.round((effectivePresent / markedCount) * 100) : 0;
  const defaulters = classStudents.filter(s => attendance[sid(s)] === "absent");

  return (
    <div className={`w-full flex flex-col ${isEmbedded ? 'bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5' : ''}`}>
      {/* Toolbar */}
      <div className={`flex flex-col sm:flex-row justify-between gap-4 items-center border-b border-default-200 py-4 ${isEmbedded ? 'mb-0' : '-mx-6 -mt-6 px-6 mb-0'}`}>
        {/* Left Side - Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {!classId && (
            <Select
              size="sm"
              selectedKeys={selectedClass ? [selectedClass] : []}
              onChange={(e) => { setSelectedClass(e.target.value); }}
              className="w-[180px]"
              aria-label={t('pages.class1')}
              variant="flat"
              classNames={{
                trigger: "bg-default-100 data-[hover=true]:bg-default-200",
              }}
            >
              {classesWithTeachers.map(c => <SelectItem key={c.id || c._id || `${c.name}-${c.section}`} textValue={`${c.name} - ${c.section}`}>{c.name} - {c.section}</SelectItem>)}
            </Select>
          )}
          <Input
            type="date"
            size="sm"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              const selected = e.target.value;
              const today = new Date().toISOString().split('T')[0];
              if (selected > today) {
                setSaveMessage({ type: 'error', text: t('attendance.cannotMarkFutureDate', 'Cannot mark attendance for a future date.') });
                setTimeout(() => setSaveMessage(null), 3000);
                return;
              }
              setDate(selected);
            }}
            className="w-[150px]"
            variant="flat"
            classNames={{
              inputWrapper: "bg-default-100 data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-default-100",
            }}
          />
          {isLoadingAttendance && <Spinner size="sm" color="primary" />}
        </div>

        {/* Right Side - Actions */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button size="sm" color="success" variant="flat" startContent={<Check size={14} />} onPress={markAllPresent} isDisabled={isLocked}>{t('pages.markAllPresent')}</Button>
          {absentCount > 0 && <Button size="sm" color="warning" variant="flat" startContent={<Bell size={14} />} onPress={handleNotifyParents} isLoading={isNotifying}>{t('attendance.notifyParents', 'Notify Parents')} ({absentCount})</Button>}
        </div>
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 p-3 bg-warning-50 text-warning-700 rounded-lg mb-4 mx-1">
          <Lock size={16} />
          <span className="text-sm font-medium">{t('pages.attendanceIsLockedUnlockInSettingsToMakeChanges')}</span>
        </div>
      )}

      {/* KPI Stats - Card Grid Style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
        {/* Total */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Users size={16} className="text-gray-600 dark:text-zinc-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{classStudents.length}</h3>
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.total2')}</p>
        </div>

        {/* Present */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Check size={16} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{presentCount}</h3>
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.present2')}</p>
        </div>

        {/* Absent */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <X size={16} className="text-red-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{absentCount}</h3>
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.absent2')}</p>
        </div>

        {/* Late */}
        {lateCount > 0 && (
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlarmClock size={16} className="text-amber-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{lateCount}</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{t('attendance.late', 'Late')}</p>
          </div>
        )}

        {/* Leave */}
        {leaveCount > 0 && (
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <LogOut size={16} className="text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{leaveCount}</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{t('attendance.leave', 'Leave')}</p>
          </div>
        )}

        {/* Half Day */}
        {halfdayCount > 0 && (
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <TimerOff size={16} className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{halfdayCount}</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{t('attendance.halfDay', 'Half Day')}</p>
          </div>
        )}

        {/* Unmarked */}
        {unmarkedCount > 0 && (
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Clock size={16} className="text-gray-600 dark:text-zinc-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{unmarkedCount}</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.unmarked')}</p>
          </div>
        )}

        {/* Attendance Rate */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${markedCount === 0 ? 'bg-gray-100 dark:bg-zinc-800' : attendancePercent >= 75 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp size={16} className={markedCount === 0 ? 'text-gray-600 dark:text-zinc-400' : attendancePercent >= 75 ? 'text-green-600' : 'text-red-600'} />
            </div>
          </div>
          <h3 className={`text-xl font-semibold ${markedCount === 0 ? "text-gray-400 dark:text-zinc-500" : attendancePercent >= 75 ? "text-green-600" : "text-red-600"}`}>
            {markedCount === 0 ? "—" : `${attendancePercent}%`}
          </h3>
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.attendanceRate')}</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 mb-4 pb-4 border-b border-default-200">
        {saveMessage && (
          <span className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-success-600' : 'text-danger-600'}`}>
            {saveMessage.text}
          </span>
        )}
        <Button
          size="md"
          color="primary"
          onPress={handleSaveAttendance}
          isDisabled={isLocked || isSaving}
          isLoading={isSaving}
          className="font-medium px-8"
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
          isLoadingAttendance
            ? t('common.loading', 'Loading attendance...')
            : classStudents.length === 0
              ? t('attendance.noStudentsInClass', 'No students found in this class')
              : t('common.noData', 'No data')
        }>
          {visibleStudents.map((student) => (
            <TableRow key={sid(student)} className="hover:bg-default-50">
              <TableCell>
                <div className="py-4 text-default-600 text-sm">
                  {student.rollNo}
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4">
                  <span
                    className="font-medium text-default-900 hover:text-primary cursor-pointer transition-colors"
                    onClick={() => navigate(`/students/${sid(student)}`)}
                  >
                    {student.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4">
                  <Chip
                    size="sm"
                    color={STATUS_MAP[attendance[sid(student)]]?.color || "default"}
                    variant="flat"
                    className="capitalize"
                  >
                    {STATUS_MAP[attendance[sid(student)]] ? t(STATUS_MAP[attendance[sid(student)]].labelKey, STATUS_MAP[attendance[sid(student)]].label) : t('attendance.notMarked', 'Not Marked')}
                  </Chip>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-4 flex gap-1">
                  {ATTENDANCE_STATUSES.map(({ key, label, color, icon: Icon }) => {
                    const isActive = attendance[sid(student)] === key;
                    return (
                      <Button
                        key={key}
                        size="sm"
                        color={isActive ? color : "default"}
                        variant={isActive ? "solid" : "light"}
                        onPress={() => markAttendance(sid(student), key)}
                        isDisabled={isLocked}
                        className={`min-w-0 px-2 gap-1 text-xs ${isActive ? '' : 'text-default-400'}`}
                        startContent={<Icon size={13} />}
                      >
                        <span className="hidden sm:inline">{t(ATTENDANCE_STATUSES.find(s => s.key === key)?.labelKey || key, label)}</span>
                      </Button>
                    );
                  })}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Lazy loading indicator */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {isLoadingMore && <Spinner size="sm" color="primary" />}
        {!hasMore && classStudents.length > ITEMS_PER_LOAD && (
          <span className="text-default-400 text-sm">{t('attendance.allStudentsLoaded', 'All {{count}} students loaded', { count: classStudents.length })}</span>
        )}
      </div>

      {defaulters.length > 0 && (
        <Card className="mt-6 shadow-sm border border-danger-200 bg-danger-50/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-danger-100 rounded-md">
                <AlertTriangle size={16} className="text-danger-600" />
              </div>
              <span className="text-sm font-semibold text-danger-700">{t('pages.absenteesToday')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {defaulters.map(s => (
                <Chip
                  key={sid(s)}
                  size="sm"
                  variant="flat"
                  color="danger"
                  className="cursor-pointer hover:bg-danger-200/50 transition-colors border border-danger-100"
                  onClick={() => navigate(`/students/${sid(s)}`)}
                >
                  {s.name}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
