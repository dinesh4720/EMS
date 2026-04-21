import { request } from '../../services/api.js';
import { useState, useMemo, memo, useRef, useEffect } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    Popover, PopoverTrigger, PopoverContent, Calendar
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Filter, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Check, X, Clock, UserCheck, UserX, Users, Layers, AlertCircle, Save } from "lucide-react";
import { useApp } from "../../context/AppContext";
import PhotoAvatar from "../../components/PhotoAvatar";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { toTodayDateString, formatShortDate } from '../../utils/dateFormatter';
import logger from '../../utils/logger';
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import SearchInput from "../../components/ui/SearchInput";
import Chip from "../../components/ui/Chip";
import IconButton from "../../components/ui/IconButton";



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
    const initializedRef = useRef(false);

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

        const controller = new AbortController();
        setAttendanceLoading(true);

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
                        const data = await request(`/attendance/${encodeURIComponent(targetClassId)}/${encodeURIComponent(selectedDate)}`, { signal: controller.signal });
                        if (!controller.signal.aborted && data) {
                            Object.entries(data).forEach(([studentId, record]) => {
                                if (initial[studentId] !== undefined) {
                                    initial[studentId] = {
                                        status: record.status || 'unmarked',
                                        inTime: record.inTime || '-',
                                        outTime: record.outTime || '-'
                                    };
                                }
                            });
                        }
                    }
                }
            } catch (error) {
                if (error.name === 'AbortError') return;
                logger.error('Failed to fetch attendance:', error);
            }

            if (!controller.signal.aborted) {
                setAttendance(initial);
                setAttendanceLoading(false);
            }
        };

        fetchAttendance();
        return () => controller.abort();
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
        // classId is required by backend for bulk attendance
        const classStudent = filteredStudents.find(s => s.classId);
        if (!classStudent?.classId) {
            toast.error('Please select a class before saving attendance');
            return;
        }

        try {
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
                toast.error('No students have been marked. Please mark attendance before saving.');
                return;
            }

            await request('/attendance/bulk', {
                method: 'POST',
                body: JSON.stringify({
                    classId: classStudent.classId,
                    date: selectedDate,
                    attendance: attendanceData
                })
            });

            toast.success(t('toast.success.attendanceSavedSuccessfully'));
        } catch (error) {
            logger.error('Error saving attendance:', error);
            toast.error(error.message || 'Failed to save attendance');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "present": return "bg-success-50 border-success-200 text-success-700";
            case "absent": return "bg-danger-50 border-danger-200 text-danger-700";
            case "leave": return "bg-warning-50 border-warning-200 text-warning-700";
            case "halfday": return "bg-secondary-50 border-secondary-200 text-secondary-700";
            default: return "bg-default-100 border-default-200 text-default-600";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "present": return <Check size={14} className="text-success-600" />;
            case "absent": return <X size={14} className="text-danger-600" />;
            case "leave": return <Clock size={14} className="text-warning-600" />;
            case "halfday": return <AlertCircle size={14} className="text-secondary-600" />;
            default: return <Clock size={14} className="text-default-500" />;
        }
    };

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
                        <Popover placement="bottom-start">
                            <PopoverTrigger>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-[var(--color-border-strong)] text-sm bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 whitespace-nowrap"
                                >
                                    <CalendarDays size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
                                    <span>{formatShortDate(selectedDate)}</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
                                <Calendar
                                    value={parseDate(selectedDate)}
                                    onChange={(date) => setSelectedDate(date.toString())}
                                    aria-label={t('aria.inputs.selectDate')}
                                />
                            </PopoverContent>
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

                    <Dropdown isOpen={classDropdownOpen} onOpenChange={(open) => { if (open) closeAllDropdowns(); setClassDropdownOpen(open); }}>
                        <DropdownTrigger>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-[var(--color-border-strong)] text-sm bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 whitespace-nowrap"
                            >
                                <Filter size={16} className="text-[var(--color-text-muted)]" />
                                <span>{classFilter === "all" ? t('pages.class1', 'Class') : classFilter}</span>
                                <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t('aria.menus.filterByClass')}
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={new Set([classFilter])}
                            onSelectionChange={(keys) => setClassFilter(Array.from(keys)[0])}
                        >
                            <DropdownItem key="all">{t('pages.allClasses')}</DropdownItem>
                            {uniqueClasses.map((cls) => (
                                <DropdownItem key={cls}>{cls}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>

                    <Dropdown isOpen={statusDropdownOpen} onOpenChange={(open) => { if (open) closeAllDropdowns(); setStatusDropdownOpen(open); }}>
                        <DropdownTrigger>
                            <button
                                type="button"
                                aria-label={t('aria.menus.filterByStatus')}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2"
                            >
                                <Filter size={16} className="text-[var(--color-text-muted)]" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t('aria.menus.filterByStatus')}
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={new Set([statusFilter])}
                            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
                        >
                            <DropdownItem key="all">{t('pages.allStatus1')}</DropdownItem>
                            <DropdownItem key="present">{t('pages.present2')}</DropdownItem>
                            <DropdownItem key="absent">{t('pages.absent2')}</DropdownItem>
                            <DropdownItem key="leave">{t('pages.onLeave1')}</DropdownItem>
                            <DropdownItem key="halfday">{t('pages.halfDay')}</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Bulk Actions */}
                    <Dropdown isOpen={bulkDropdownOpen} onOpenChange={(open) => { if (open) closeAllDropdowns(); setBulkDropdownOpen(open); }}>
                        <DropdownTrigger>
                            <button
                                type="button"
                                className={`inline-flex items-center gap-2 h-8 px-3 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 whitespace-nowrap ${
                                    selectedKeys === "all" || selectedKeys.size > 0
                                        ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                                        : "bg-transparent border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                                }`}
                            >
                                <Layers size={16} className={selectedKeys === "all" || selectedKeys.size > 0 ? "text-white" : "text-[var(--color-text-muted)]"} />
                                <span>{t('pages.bulkActions1')}</span>
                                {(selectedKeys === "all" || selectedKeys.size > 0) && (
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                        {selectedKeys === "all" ? filteredStudents.length : selectedKeys.size}
                                    </span>
                                )}
                                <ChevronDown size={14} className={selectedKeys === "all" || selectedKeys.size > 0 ? "text-white" : "text-[var(--color-text-muted)]"} />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t('aria.menus.bulkActionsUpper')}
                            onAction={handleBulkAction}
                            disabledKeys={selectedKeys !== "all" && selectedKeys.size === 0 ? ["present", "absent", "leave", "halfday"] : []}
                        >
                            <DropdownItem key="present" startContent={<Check size={14} className="text-success" />} className="text-success">
                                {t('attendance.markSelectedPresent', 'Mark Selected Present')}
                            </DropdownItem>
                            <DropdownItem key="halfday" startContent={<AlertCircle size={14} className="text-secondary" />} className="text-secondary">
                                {t('attendance.markSelectedHalfDay', 'Mark Selected Half Day')}
                            </DropdownItem>
                            <DropdownItem key="absent" startContent={<X size={14} className="text-danger" />} className="text-danger">
                                {t('attendance.markSelectedAbsent', 'Mark Selected Absent')}
                            </DropdownItem>
                            <DropdownItem key="leave" startContent={<Clock size={14} className="text-warning" />} className="text-warning">
                                {t('attendance.markSelectedOnLeave', 'Mark Selected On Leave')}
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Save Button */}
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Save size={16} />}
                        onClick={handleSaveAttendance}
                        className="whitespace-nowrap"
                    >
                        {t('attendance.saveAttendance', 'Save Attendance')}
                    </Button>
                </div>
            </div>

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
            ) :
            <Table
                aria-label={t('aria.tables.studentAttendance')}
                selectionMode="multiple"
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                removeWrapper
                radius="none"
                classNames={{
                    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
                    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
                    th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 first:hover:bg-transparent first:cursor-default",
                    td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 transition-colors",
                    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-5 [&>tr[data-selected=true]>td]:bg-primary-50",
                    tr: "transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50 data-[selected=true]:bg-primary-50",
                }}
            >
                <TableHeader>
                    <TableColumn className="w-[250px]" scope="col">{t('pages.sTUDENT')}</TableColumn>
                    <TableColumn className="w-[100px]" scope="col">{t('pages.cLASS')}</TableColumn>
                    <TableColumn className="w-[100px]" scope="col">{t('pages.rOLLNo')}</TableColumn>
                    <TableColumn className="w-[140px]" scope="col">{t('pages.sTATUS')}</TableColumn>
                    <TableColumn className="w-[100px]" scope="col">{t('pages.iNTime')}</TableColumn>
                    <TableColumn className="w-[100px]" scope="col">{t('pages.oUTTime')}</TableColumn>
                </TableHeader>
                <TableBody
                    items={filteredStudents}
                    emptyContent={
                        <EmptyState
                            icon={Users}
                            size="sm"
                            title={t('attendance.noStudentsFound', 'No students found')}
                            description={t('attendance.adjustFilters', 'Try adjusting the class or search filters.')}
                        />
                    }
                >
                    {(student) => {
                        const att = attendance[student.id] || { status: "unmarked", inTime: "-", outTime: "-" };
                        return (
                            <TableRow key={student.id}>
                                <TableCell>
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
                                </TableCell>
                                <TableCell>
                                    <Chip size="sm" color="info">{student.class}</Chip>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[var(--color-text-secondary)] text-sm font-mono">#{student.rollNo?.toString().padStart(3, '0')}</span>
                                </TableCell>
                                <TableCell>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <button
                                                type="button"
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 ${getStatusStyle(att.status)}`}
                                            >
                                                {getStatusIcon(att.status)}
                                                <span className="capitalize">{att.status}</span>
                                                <ChevronDown size={12} className="opacity-50" />
                                            </button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label={t('aria.misc.changeStatusUpper')}
                                            onAction={(key) => handleStatusChange(student.id, key)}
                                        >
                                            <DropdownItem key="present" startContent={<Check size={14} className="text-success" />}>{t('pages.present2')}</DropdownItem>
                                            <DropdownItem key="halfday" startContent={<AlertCircle size={14} className="text-secondary" />}>{t('pages.halfDay')}</DropdownItem>
                                            <DropdownItem key="absent" startContent={<X size={14} className="text-danger" />}>{t('pages.absent2')}</DropdownItem>
                                            <DropdownItem key="leave" startContent={<Clock size={14} className="text-warning" />}>{t('pages.onLeave1')}</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[var(--color-text-secondary)] text-sm font-mono">{att.inTime || "-"}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[var(--color-text-secondary)] text-sm font-mono">{att.outTime || "-"}</span>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                </TableBody>
            </Table>
            }
        </div>
    );
});

export default StudentAttendance;
