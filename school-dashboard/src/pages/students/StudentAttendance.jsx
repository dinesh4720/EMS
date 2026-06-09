import { attendanceApi } from '../../services/api';
import { useState, useMemo, memo, useRef, useEffect, useCallback } from "react";
import {
    Calendar
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Filter, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Check, X, Clock, UserCheck, UserX, Users, Layers, AlertCircle, Save } from "lucide-react";
import { useApp } from "../../context/AppContext";
import PhotoAvatar from "../../components/PhotoAvatar";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { toTodayDateString, formatShortDate } from '../../utils/dateFormatter';
import logger from '../../utils/logger';
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import Alert from "../../components/ui/Alert";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import SearchInput from "../../components/ui/SearchInput";
import Chip from "../../components/ui/Chip";
import IconButton from "../../components/ui/IconButton";
import Popover from "../../components/ui/Popover";
import DropdownMenu from "../../components/ui/DropdownMenu";
import Checkbox from "../../components/ui/Checkbox";



const StudentAttendance = memo(function StudentAttendance() {
  const { t } = useTranslation();
    const { students: allStudents } = useApp();
    // Only show active students for attendance marking (Bug #38)
    const students = useMemo(() => allStudents.filter(s => (s.status || 'active') === 'active'), [allStudents]);
    const [selectedDate, setSelectedDate] = useState(toTodayDateString());
    const [searchQuery, setSearchQuery] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));
    const [attendance, setAttendance] = useState({});
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const initializedRef = useRef(false);
    const messageTimerRef = useRef(null);

    const clearMessageAfter = useCallback((ms) => {
        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
        messageTimerRef.current = setTimeout(() => setSaveMessage(null), ms);
    }, []);

    useEffect(() => () => {
        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    }, []);

    // Controlled open state for toolbar dropdowns — mutual exclusion
    const [classDropdownOpen, setClassDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);

    const closeAllDropdowns = () => {
        setClassDropdownOpen(false);
        setStatusDropdownOpen(false);
        setBulkDropdownOpen(false);
    };

    const uniqueClasses = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);

    // Fetch existing attendance from backend, fall back to "unmarked"
    useEffect(() => {
        if (students.length === 0) return;
        // Skip the wasted fetch while auto-class-init is pending —
        // useEffect below will set classFilter and re-trigger this effect
        if (classFilter === 'all' && uniqueClasses.length > 0 && !initializedRef.current) return;

        let cancelled = false;
        setAttendanceLoading(true);
        setFetchError(null);

        const fetchAttendance = async () => {
            // Initialize all students as unmarked first
            const initial = {};
            students.forEach(s => {
                initial[s.id] = { status: "unmarked", inTime: "-", outTime: "-" };
            });

            try {
                if (classFilter !== 'all') {
                    // Fetch attendance for this class+date — resolve classId from students list
                    const classObj = students.find(s => s.classId === classFilter || s.class === classFilter);
                    const targetClassId = classObj?.classId || classFilter;
                    if (targetClassId) {
                        const data = await attendanceApi.getByClassDate(targetClassId, selectedDate);
                        if (!cancelled && data && typeof data === 'object') {
                            const entries = Array.isArray(data)
                                ? data.map(r => [String(r.studentId?._id || r.studentId || ''), r])
                                : Object.entries(data);
                            entries.forEach(([studentId, record]) => {
                                if (studentId && initial[studentId] !== undefined) {
                                    initial[studentId] = {
                                        status: record?.status || 'unmarked',
                                        inTime: record?.inTime || '-',
                                        outTime: record?.outTime || '-'
                                    };
                                }
                            });
                        }
                    }
                }
            } catch (error) {
                if (cancelled) return;
                logger.error('Failed to fetch attendance:', error);
                setFetchError(error?.message || 'Failed to load attendance');
            }

            if (!cancelled) {
                setAttendance(initial);
                setAttendanceLoading(false);
            }
        };

        fetchAttendance();
        return () => { cancelled = true; };
    }, [students, selectedDate, classFilter, uniqueClasses]);

    // Auto-select the first available class so the default view isn't empty
    useEffect(() => {
        if (classFilter === 'all' && uniqueClasses.length > 0 && !initializedRef.current) {
            initializedRef.current = true;
            setClassFilter(uniqueClasses[0]);
        }
    }, [uniqueClasses, classFilter]);

    const filteredStudents = useMemo(() => {
        let filtered = students;

        if (searchQuery) {
            const search = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(search) ||
                s.rollNo.toString().includes(search)
            );
        }

        if (classFilter !== "all") {
            filtered = filtered.filter(s => s.class === classFilter);
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(s => attendance[s.id]?.status === statusFilter);
        }

        return filtered;
    }, [students, searchQuery, classFilter, statusFilter, attendance]);

    const stats = useMemo(() => {
        // Count stats only for filtered students (matching current class filter)
        const total = filteredStudents.length;
        let present = 0, absent = 0, leave = 0, halfday = 0;

        for (const student of filteredStudents) {
            const status = attendance[student.id]?.status;
            if (status === "present") present++;
            else if (status === "absent") absent++;
            else if (status === "leave") leave++;
            else if (status === "halfday") halfday++;
        }

        return { total, present, absent, leave, halfday };
    }, [filteredStudents, attendance]);

    const handleStatusChange = (studentId, newStatus) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status: newStatus }
        }));
    };

    const handleBulkAction = (status) => {
        if (selectedKeys === "all") {
            // Mark all filtered students
            const updates = {};
            filteredStudents.forEach(s => {
                updates[s.id] = { ...attendance[s.id], status };
            });
            setAttendance(prev => ({ ...prev, ...updates }));
        } else if (selectedKeys.size > 0) {
            const updates = {};
            selectedKeys.forEach(id => {
                updates[id] = { ...attendance[id], status };
            });
            setAttendance(prev => ({ ...prev, ...updates }));
        }
        setSelectedKeys(new Set([]));
    };

    const handleSaveAttendance = async () => {
        if (isSaving) return;
        // classId is required by backend for bulk attendance
        const classStudent = filteredStudents.find(s => s.classId);
        if (!classStudent?.classId) {
            setSaveMessage({ type: 'error', text: t('attendance.selectValidClass', 'Please select a valid class') });
            clearMessageAfter(3000);
            return;
        }

        const attendanceData = filteredStudents
            .filter(s => {
                const status = attendance[s.id]?.status;
                return status && status !== 'unmarked';
            })
            .map(s => ({
                studentId: s.id,
                status: attendance[s.id].status
            }));

        if (attendanceData.length === 0) {
            setSaveMessage({ type: 'error', text: t('attendance.markAtLeastOne', 'Please mark attendance for at least one student before saving') });
            clearMessageAfter(3000);
            return;
        }

        try {
            setIsSaving(true);
            setSaveMessage(null);
            const response = await attendanceApi.markBulk({
                classId: classStudent.classId,
                date: selectedDate,
                attendance: attendanceData,
                clientTimestamp: new Date().toISOString(),
            });
            const savedCount = response?.results?.length ?? attendanceData.length;
            setSaveMessage({
                type: 'success',
                text: t('attendance.savedForStudents', 'Attendance saved for {{count}} students', { count: savedCount }),
            });
            clearMessageAfter(3000);
        } catch (error) {
            logger.error('Error saving attendance:', error);
            setSaveMessage({ type: 'error', text: error?.message || t('attendance.failedToSave', 'Failed to save attendance') });
            clearMessageAfter(5000);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "present": return "bg-[var(--ok-bg)] border-[var(--ok)]/20 text-[var(--ok)]";
            case "absent": return "bg-[var(--danger-bg)] border-[var(--danger)]/20 text-[var(--danger)]";
            case "leave": return "bg-[var(--warn-bg)] border-[var(--warn)]/20 text-[var(--warn)]";
            case "halfday": return "bg-[var(--info-bg)] border-[var(--info)]/20 text-[var(--info)]";
            default: return "bg-surface-2 border-divider text-fg-muted";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "present": return <Check size={14} className="text-[var(--ok)]" />;
            case "absent": return <X size={14} className="text-[var(--danger)]" />;
            case "leave": return <Clock size={14} className="text-[var(--warn)]" />;
            case "halfday": return <AlertCircle size={14} className="text-[var(--info)]" />;
            default: return <Clock size={14} className="text-fg-muted" />;
        }
    };

    const classFilterItems = [
        { key: "all", label: t('pages.allClasses'), onClick: () => setClassFilter("all") },
        ...uniqueClasses.map((cls) => ({
            key: cls,
            label: cls,
            onClick: () => setClassFilter(cls),
        })),
    ];

    const statusFilterItems = [
        { key: "all", label: t('pages.allStatus1'), onClick: () => setStatusFilter("all") },
        { key: "present", label: t('pages.present2'), onClick: () => setStatusFilter("present") },
        { key: "absent", label: t('pages.absent2'), onClick: () => setStatusFilter("absent") },
        { key: "leave", label: t('pages.onLeave1'), onClick: () => setStatusFilter("leave") },
        { key: "halfday", label: t('pages.halfDay'), onClick: () => setStatusFilter("halfday") },
    ];

    const bulkItems = [
        { key: "present", label: t('attendance.markSelectedPresent', 'Mark Selected Present'), icon: <Check size={14} className="text-ok" />, onClick: () => handleBulkAction("present") },
        { key: "halfday", label: t('attendance.markSelectedHalfDay', 'Mark Selected Half Day'), icon: <AlertCircle size={14} className="text-info" />, onClick: () => handleBulkAction("halfday") },
        { key: "absent", label: t('attendance.markSelectedAbsent', 'Mark Selected Absent'), icon: <X size={14} className="text-danger" />, onClick: () => handleBulkAction("absent") },
        { key: "leave", label: t('attendance.markSelectedOnLeave', 'Mark Selected On Leave'), icon: <Clock size={14} className="text-warn" />, onClick: () => handleBulkAction("leave") },
    ];

    const hasSelection = selectedKeys === "all" || selectedKeys.size > 0;
    const bulkDisabled = selectedKeys !== "all" && selectedKeys.size === 0;

    return (
        <div className="w-full flex flex-col">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
                <StatCard label={t('pages.totalStudents1')} value={stats.total} icon={Users} color="gray" />
                <StatCard label={t('pages.present2')} value={stats.present} icon={UserCheck} color="success" />
                <StatCard label={t('pages.absent2')} value={stats.absent} icon={UserX} color="danger" />
                <StatCard label={t('pages.onLeave1')} value={stats.leave} icon={Clock} color="warning" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-[var(--color-bg)] border-b border-[var(--color-border)] py-4 -mx-6 px-6">
                {/* Left Side - Date Picker */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-1">
                        <IconButton
                            variant="outline"
                            size="sm"
                            aria-label={t('common.previous', 'Previous day')}
                            icon={<ChevronLeft size={14} />}
                            onClick={() => {
                                const date = new Date(selectedDate);
                                date.setDate(date.getDate() - 1);
                                setSelectedDate(date.toISOString().split('T')[0]);
                            }}
                        />
                        <Popover
                            placement="bottom-start"
                            trigger={
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-[var(--color-border-strong)] text-sm bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 whitespace-nowrap"
                                >
                                    <CalendarDays size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
                                    <span>{formatShortDate(selectedDate)}</span>
                                </button>
                            }
                            contentClassName="p-0"
                        >
                            <Calendar
                                value={parseDate(selectedDate)}
                                onChange={(date) => setSelectedDate(date.toString())}
                                aria-label={t('aria.inputs.selectDate')}
                            />
                        </Popover>
                        <IconButton
                            variant="outline"
                            size="sm"
                            aria-label={t('common.next', 'Next day')}
                            icon={<ChevronRight size={14} />}
                            onClick={() => {
                                const date = new Date(selectedDate);
                                date.setDate(date.getDate() + 1);
                                setSelectedDate(date.toISOString().split('T')[0]);
                            }}
                            disabled={selectedDate >= toTodayDateString()}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(toTodayDateString())}
                        disabled={selectedDate === toTodayDateString()}
                    >
                        {t('common.today', 'Today')}
                    </Button>
                </div>

                {/* Right Side - Filters */}
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={t('pages.search1')}
                        name="student-attendance-search"
                    />

                    <DropdownMenu
                        ariaLabel={t('aria.menus.filterByClass')}
                        isOpen={classDropdownOpen}
                        onOpenChange={(open) => { if (open) closeAllDropdowns(); setClassDropdownOpen(open); }}
                        trigger={
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-[var(--color-border-strong)] text-sm bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 whitespace-nowrap"
                            >
                                <Filter size={16} className="text-[var(--color-text-muted)]" />
                                <span>{classFilter === "all" ? t('pages.class1', 'Class') : classFilter}</span>
                                <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
                            </button>
                        }
                        items={classFilterItems}
                    />

                    <DropdownMenu
                        ariaLabel={t('aria.menus.filterByStatus')}
                        isOpen={statusDropdownOpen}
                        onOpenChange={(open) => { if (open) closeAllDropdowns(); setStatusDropdownOpen(open); }}
                        trigger={
                            <button
                                type="button"
                                aria-label={t('aria.menus.filterByStatus')}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2"
                            >
                                <Filter size={16} className="text-[var(--color-text-muted)]" />
                            </button>
                        }
                        items={statusFilterItems}
                    />

                    {/* Bulk Actions */}
                    <DropdownMenu
                        ariaLabel={t('aria.menus.bulkActionsUpper')}
                        isOpen={bulkDropdownOpen}
                        onOpenChange={(open) => { if (open) closeAllDropdowns(); setBulkDropdownOpen(open); }}
                        trigger={
                            <button
                                type="button"
                                className={`inline-flex items-center gap-2 h-8 px-3 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 whitespace-nowrap ${
                                    hasSelection
                                        ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                                        : "bg-transparent border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                                }`}
                            >
                                <Layers size={16} className={hasSelection ? "text-white" : "text-[var(--color-text-muted)]"} />
                                <span>{t('pages.bulkActions1')}</span>
                                {hasSelection && (
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                        {selectedKeys === "all" ? filteredStudents.length : selectedKeys.size}
                                    </span>
                                )}
                                <ChevronDown size={14} className={hasSelection ? "text-white" : "text-[var(--color-text-muted)]"} />
                            </button>
                        }
                        items={bulkItems.map(item => ({
                            ...item,
                            isDisabled: bulkDisabled,
                        }))}
                    />

                    {/* Save Button */}
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Save size={16} />}
                        onClick={handleSaveAttendance}
                        loading={isSaving}
                        disabled={isSaving}
                        className="whitespace-nowrap"
                    >
                        {isSaving
                            ? t('common.saving', 'Saving...')
                            : t('attendance.saveAttendance', 'Save Attendance')}
                    </Button>
                </div>
            </div>

            {/* Inline save status / fetch error */}
            {saveMessage && (
                <Alert
                    variant={saveMessage.type === 'success' ? 'success' : saveMessage.type === 'warning' ? 'warning' : 'danger'}
                    className="mt-3 -mx-6 mx-0 sm:mx-1"
                    onClose={() => setSaveMessage(null)}
                >
                    {saveMessage.text}
                </Alert>
            )}
            {fetchError && !attendanceLoading && (
                <div className="mt-3 sm:mx-1">
                    <ErrorState
                        title="Failed to load attendance"
                        description={fetchError}
                        onRetry={() => { setFetchError(null); setAttendanceLoading(true); }}
                        size="sm"
                    />
                </div>
            )}

            {/* Class selection hint */}
            {classFilter !== "all" && (
                <p className="text-xs text-[var(--color-text-muted)] px-6 -mx-6 pt-2">
                    {t('attendance.showingForClassPrefix', 'Showing attendance for class')} <span className="font-medium text-[var(--color-text-secondary)]">{classFilter}</span>. {t('attendance.useClassFilterHint', 'Use the Class filter above to switch.')}
                </p>
            )}

            {/* Table */}
            {attendanceLoading ? (
                <div className="py-4 -mx-6 px-6">
                    <TablePageSkeleton title={false} searchBar={false} kpiCards={0} columns={6} rows={8} hasAvatar />
                </div>
            ) : (
            <div className="-mx-6 overflow-visible">
                <table className="w-[calc(100%+3rem)] border-spacing-0 border-collapse">
                    <thead>
                        <tr className="first:shadow-none">
                            <th className="bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-divider pl-6 pr-3 w-12 cursor-default hover:bg-transparent">
                                <Checkbox
                                    aria-label={selectedKeys === "all" || (filteredStudents.length > 0 && filteredStudents.every(s => selectedKeys.has(s.id.toString()))) ? "Deselect all" : "Select all"}
                                    checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedKeys.has(s.id.toString()))}
                                    indeterminate={filteredStudents.some(s => selectedKeys.has(s.id.toString())) && !filteredStudents.every(s => selectedKeys.has(s.id.toString()))}
                                    onChange={() => {
                                        if (filteredStudents.length > 0 && filteredStudents.every(s => selectedKeys.has(s.id.toString()))) {
                                            setSelectedKeys(new Set([]));
                                        } else {
                                            setSelectedKeys(new Set(filteredStudents.map(s => s.id.toString())));
                                        }
                                    }}
                                    size="sm"
                                />
                            </th>
                            <th className="bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-divider last:pr-6 w-[250px]" scope="col">{t('pages.sTUDENT')}</th>
                            <th className="bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-divider last:pr-6 w-[100px]" scope="col">{t('pages.cLASS')}</th>
                            <th className="bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-divider last:pr-6 w-[100px]" scope="col">{t('pages.rOLLNo')}</th>
                            <th className="bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-divider last:pr-6 w-[140px]" scope="col">{t('pages.sTATUS')}</th>
                            <th className="bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-divider last:pr-6 w-[100px]" scope="col">{t('pages.iNTime')}</th>
                            <th className="bg-transparent text-fg-faint font-medium text-xs uppercase tracking-wider h-12 border-b border-divider last:pr-6 w-[100px]" scope="col">{t('pages.oUTTime')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center">
                                    <EmptyState
                                        icon={Users}
                                        size="sm"
                                        title={t('attendance.noStudentsFound', 'No students found')}
                                        description={t('attendance.adjustFilters', 'Try adjusting the class or search filters.')}
                                    />
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map((student, idx) => {
                                const att = attendance[student.id] || { status: "unmarked", inTime: "-", outTime: "-" };
                                const isSelected = selectedKeys === "all" || selectedKeys.has(student.id.toString());
                                const isLast = idx === filteredStudents.length - 1;
                                return (
                                    <tr
                                        key={student.id}
                                        data-selected={isSelected || undefined}
                                        data-last={isLast || undefined}
                                        className="transition-colors hover:bg-surface-2/50 data-[selected=true]:bg-[var(--accent-bg)]"
                                    >
                                        <td className="py-5 border-b border-divider data-[last=true]:border-none pl-6 pr-3 w-12 transition-colors">
                                            <Checkbox
                                                aria-label={`Select ${student.name}`}
                                                checked={isSelected}
                                                onChange={() => {
                                                    const id = student.id.toString();
                                                    const newKeys = new Set(selectedKeys === "all" ? filteredStudents.map(s => s.id.toString()) : selectedKeys);
                                                    if (newKeys.has(id)) {
                                                        newKeys.delete(id);
                                                    } else {
                                                        newKeys.add(id);
                                                    }
                                                    setSelectedKeys(newKeys);
                                                }}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="py-5 border-b border-divider data-[last=true]:border-none last:pr-6 transition-colors w-[250px]">
                                            <div className="flex items-center gap-3">
                                                <PhotoAvatar
                                                    src={student.photo}
                                                    name={student.name}
                                                    alt={student.name}
                                                    type="student"
                                                    size="md"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-[var(--color-text-primary)] font-medium text-base">{student.name}</span>
                                                    <span className="text-[var(--color-text-muted)] text-xs">{student.email || t('common.noEmail', 'No email')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 border-b border-divider data-[last=true]:border-none last:pr-6 transition-colors w-[100px]">
                                            <Chip size="sm" color="info">{student.class}</Chip>
                                        </td>
                                        <td className="py-5 border-b border-divider data-[last=true]:border-none last:pr-6 transition-colors w-[100px]">
                                            <span className="text-[var(--color-text-secondary)] text-sm font-mono">#{student.rollNo?.toString().padStart(3, '0')}</span>
                                        </td>
                                        <td className="py-5 border-b border-divider data-[last=true]:border-none last:pr-6 transition-colors w-[140px]">
                                            <DropdownMenu
                                                ariaLabel={t('aria.misc.changeStatusUpper')}
                                                trigger={
                                                    <button
                                                        type="button"
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 ${getStatusStyle(att.status)}`}
                                                    >
                                                        {getStatusIcon(att.status)}
                                                        <span className="capitalize">{att.status}</span>
                                                        <ChevronDown size={12} className="opacity-50" />
                                                    </button>
                                                }
                                                items={[
                                                    { key: "present", label: t('pages.present2'), icon: <Check size={14} className="text-ok" />, onClick: () => handleStatusChange(student.id, "present") },
                                                    { key: "halfday", label: t('pages.halfDay'), icon: <AlertCircle size={14} className="text-info" />, onClick: () => handleStatusChange(student.id, "halfday") },
                                                    { key: "absent", label: t('pages.absent2'), icon: <X size={14} className="text-danger" />, onClick: () => handleStatusChange(student.id, "absent") },
                                                    { key: "leave", label: t('pages.onLeave1'), icon: <Clock size={14} className="text-warn" />, onClick: () => handleStatusChange(student.id, "leave") },
                                                ]}
                                            />
                                        </td>
                                        <td className="py-5 border-b border-divider data-[last=true]:border-none last:pr-6 transition-colors w-[100px]">
                                            <span className="text-[var(--color-text-secondary)] text-sm font-mono">{att.inTime || "-"}</span>
                                        </td>
                                        <td className="py-5 border-b border-divider data-[last=true]:border-none last:pr-6 transition-colors w-[100px]">
                                            <span className="text-[var(--color-text-secondary)] text-sm font-mono">{att.outTime || "-"}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    );
});

export default StudentAttendance;
