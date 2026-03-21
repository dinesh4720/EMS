import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Spinner, Progress,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Textarea, Select, SelectItem, Input,
    Popover, PopoverTrigger, PopoverContent, Calendar
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Search, Filter, ArrowUpDown, Layers, MoreVertical, Check, X, Clock, ChevronDown, Download, AlertCircle, CalendarDays, ChevronLeft, ChevronRight, UserCheck, UserX, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import PhotoAvatar from "../../components/PhotoAvatar";

const ITEMS_PER_LOAD = 10;

export default function StaffAttendance() {
    const { staff, staffAttendance: attendance, markStaffAttendance: markAttendance, fetchStaffAttendanceForDate, markAllStaffAttendance: markBulkAttendance } = useApp();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendancePeriod, setAttendancePeriod] = useState("this_month");
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch attendance when date changes
    useEffect(() => {
        fetchStaffAttendanceForDate(selectedDate);
    }, [selectedDate, fetchStaffAttendanceForDate]);

    const loaderRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortDescriptor, setSortDescriptor] = useState({
        column: "name",
        direction: "ascending",
    });
    const [columnWidths] = useState({
        name: 250,
        status: 120,
        attendance: 160,
        inTime: 100,
        outTime: 100,
        actions: 50
    });

    // Reason modal state
    const [reasonModalOpen, setReasonModalOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState({ staffId: null, status: null });
    const [reason, setReason] = useState("");

    // Download modal state
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [downloadType, setDownloadType] = useState("this_week");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    // Generate consistent random attendance for each staff member (seeded by staffId)
    const getOverallAttendance = useCallback((staffId) => {
        const staffAtt = attendance[staffId];
        if (staffAtt) {
            const dates = Object.keys(staffAtt);
            if (dates.length > 0) {
                const presentDays = dates.filter(d => staffAtt[d]?.status === "present" || staffAtt[d]?.status === "halfday").length;
                const halfDays = dates.filter(d => staffAtt[d]?.status === "halfday").length;
                return Math.round(((presentDays - (halfDays * 0.5)) / dates.length) * 100);
            }
        }
        // Generate random percentage based on staffId for consistency
        const seed = staffId * 13 % 100;
        return Math.min(98, Math.max(65, seed + 30));
    }, [attendance]);

    const dailyAttendance = useMemo(() => {
        const result = {};

        staff.forEach(s => {
            const att = attendance[s.id]?.[selectedDate];
            const defaultValue = { status: "unmarked", inTime: "-", outTime: "-" };
            result[s.id] = att || defaultValue;
        });
        return result;
    }, [staff, attendance, selectedDate]);

    const kpiStats = useMemo(() => {
        const activeStaff = staff.filter(s => s.status === "active");
        const total = activeStaff.length;
        const present = activeStaff.filter(s => dailyAttendance[s.id]?.status === "present").length;
        const absent = activeStaff.filter(s => dailyAttendance[s.id]?.status === "absent").length;
        const leave = activeStaff.filter(s => dailyAttendance[s.id]?.status === "leave").length;
        const halfday = activeStaff.filter(s => dailyAttendance[s.id]?.status === "halfday").length;
        const unmarked = activeStaff.filter(s => dailyAttendance[s.id]?.status === "unmarked").length;
        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

        return { total, present, absent, leave, halfday, unmarked, attendanceRate };
    }, [staff, dailyAttendance]);

    const filteredStaff = useMemo(() => {
        let result = staff.filter(s => s.status === "active");

        if (statusFilter !== "all") {
            result = result.filter(s => {
                const status = dailyAttendance[s.id]?.status || "unmarked";
                return status === statusFilter;
            });
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(lowerQuery) ||
                s.role.toLowerCase().includes(lowerQuery) ||
                s.department.toLowerCase().includes(lowerQuery)
            );
        }

        return result.sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [staff, searchQuery, statusFilter, dailyAttendance, sortDescriptor]);

    const visibleStaff = useMemo(() => {
        return filteredStaff.slice(0, visibleCount);
    }, [filteredStaff, visibleCount]);

    const hasMore = visibleCount < filteredStaff.length;

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_LOAD);
    }, [searchQuery, statusFilter, sortDescriptor]);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    setIsLoading(true);
                    // Simulate loading delay for smooth UX
                    setTimeout(() => {
                        setVisibleCount(prev => prev + ITEMS_PER_LOAD);
                        setIsLoading(false);
                    }, 300);
                }
            },
            { threshold: 0.1 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading]);

    const handleStatusChange = (staffId, status) => {
        if (status === "absent" || status === "leave" || status === "halfday") {
            setPendingStatus({ staffId, status });
            setReason("");
            setReasonModalOpen(true);
        } else {
            // FIXED: Use consistent time based on current time or default
            const now = new Date();
            const inTime = status === "present" ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : "-";
            markAttendance(staffId, selectedDate, status, inTime, "-");
        }
    };

    const handleConfirmReason = () => {
        if (pendingStatus.staffId && pendingStatus.status) {
            // FIXED: Use consistent time based on current time or default
            const now = new Date();
            const inTime = pendingStatus.status === "halfday" ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : "-";
            markAttendance(pendingStatus.staffId, selectedDate, pendingStatus.status, inTime, "-", reason);
        }
        setReasonModalOpen(false);
        setPendingStatus({ staffId: null, status: null });
        setReason("");
    };

    const handleBulkAction = (action) => {
        if (action === "absent" || action === "leave" || action === "halfday") {
            setPendingStatus({ staffId: "bulk", status: action });
            setReason("");
            setReasonModalOpen(true);
        } else {
            // FIXED: Use consistent time for all staff in bulk operation
            const now = new Date();
            const inTime = action === "present" ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : "-";
            const idsToProcess = selectedKeys === "all" ? filteredStaff.map(s => s.id) : Array.from(selectedKeys);

            markBulkAttendance(selectedDate, action, idsToProcess, "", inTime, "-");

            setSelectedKeys(new Set([]));
        }
    };

    const handleBulkReasonConfirm = () => {
        // FIXED: Use consistent time for all staff in bulk operation
        const now = new Date();
        const inTime = pendingStatus.status === "halfday" ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : "-";
        const idsToProcess = selectedKeys === "all" ? filteredStaff.map(s => s.id) : Array.from(selectedKeys);

        markBulkAttendance(selectedDate, pendingStatus.status, idsToProcess, reason, inTime, "-");

        setSelectedKeys(new Set([]));
        setReasonModalOpen(false);
        setPendingStatus({ staffId: null, status: null });
        setReason("");
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

    const getStatusLabel = (status) => {
        if (!status || status === "unmarked" || status === null) return "Not Marked";
        if (status === "halfday") return "Half Day";
        if (status === "leave") return "On Leave";
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getStatusStyle = (status) => {
        if (!status || status === "unmarked" || status === null) {
            return "bg-default-100 border-default-200 text-default-600";
        }
        switch (status) {
            case "present": return "bg-success-50 border-success-200 text-success-700";
            case "absent": return "bg-danger-50 border-danger-200 text-danger-700";
            case "leave": return "bg-warning-50 border-warning-200 text-warning-700";
            case "halfday": return "bg-secondary-50 border-secondary-200 text-secondary-700";
            default: return "bg-default-100 border-default-200 text-default-600";
        }
    };


    const getDateRange = () => {
        const today = new Date();
        let startDate, endDate;

        switch (downloadType) {
            case "this_week": {
                const dayOfWeek = today.getDay();
                startDate = new Date(today);
                startDate.setDate(today.getDate() - dayOfWeek);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            }
            case "monthly": {
                const year = parseInt(selectedYear);
                const month = parseInt(selectedMonth);
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month + 1, 0);
                break;
            }
            case "yearly": {
                const year = parseInt(selectedYear);
                startDate = new Date(year, 0, 1);
                endDate = new Date(year, 11, 31);
                break;
            }
            case "custom": {
                startDate = customStartDate ? new Date(customStartDate) : today;
                endDate = customEndDate ? new Date(customEndDate) : today;
                break;
            }
            default:
                startDate = today;
                endDate = today;
        }

        return { startDate, endDate };
    };

    const handleDownloadReport = () => {
        const { startDate, endDate } = getDateRange();
        const headers = ["Name", "Department", "Role", "Date", "Status", "Check In", "Check Out", "Reason"];
        const rows = [];

        filteredStaff.forEach(s => {
            const staffAtt = attendance[s.id] || {};
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const att = staffAtt[dateStr] || { status: "unmarked", inTime: "-", outTime: "-", reason: "" };
                rows.push([
                    s.name,
                    s.department,
                    s.role,
                    dateStr,
                    getStatusLabel(att.status),
                    att.inTime,
                    att.outTime,
                    att.reason || ""
                ]);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        const typeLabel = downloadType === "this_week" ? "This Week" :
            downloadType === "monthly" ? `${months[parseInt(selectedMonth)]} ${selectedYear}` :
                downloadType === "yearly" ? selectedYear :
                    `${customStartDate} to ${customEndDate}`;

        const csvContent = [
            `Staff Attendance Report - ${typeLabel}`,
            "",
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `attendance-report-${downloadType}-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloadModalOpen(false);
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());


    return (
        <div className="w-full flex flex-col">
            {/* Reason Modal */}
            <Modal isOpen={reasonModalOpen} onOpenChange={setReasonModalOpen} size="md">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Enter Reason for {getStatusLabel(pendingStatus.status)}
                            </ModalHeader>
                            <ModalBody>
                                <Textarea
                                    label="Reason"
                                    placeholder="Please provide a reason..."
                                    value={reason}
                                    onValueChange={setReason}
                                    minRows={3}
                                    variant="bordered"
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>Cancel</Button>
                                <Button
                                    color="primary"
                                    onPress={pendingStatus.staffId === "bulk" ? handleBulkReasonConfirm : handleConfirmReason}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Download Report Modal */}
            <Modal isOpen={downloadModalOpen} onOpenChange={setDownloadModalOpen} size="md">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Download Attendance Report</ModalHeader>
                            <ModalBody className="gap-4">
                                <Select
                                    label="Report Type"
                                    selectedKeys={new Set([downloadType])}
                                    onSelectionChange={(keys) => setDownloadType(Array.from(keys)[0])}
                                    variant="bordered"
                                >
                                    <SelectItem key="this_week">This Week</SelectItem>
                                    <SelectItem key="monthly">Monthly</SelectItem>
                                    <SelectItem key="yearly">Yearly</SelectItem>
                                    <SelectItem key="custom">Custom Date Range</SelectItem>
                                </Select>

                                {downloadType === "monthly" && (
                                    <div className="flex gap-3">
                                        <Select
                                            label="Month"
                                            selectedKeys={new Set([selectedMonth])}
                                            onSelectionChange={(keys) => setSelectedMonth(Array.from(keys)[0])}
                                            variant="bordered"
                                            className="flex-1"
                                        >
                                            {months.map((month, index) => (
                                                <SelectItem key={index.toString()}>{month}</SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            label="Year"
                                            selectedKeys={new Set([selectedYear])}
                                            onSelectionChange={(keys) => setSelectedYear(Array.from(keys)[0])}
                                            variant="bordered"
                                            className="flex-1"
                                        >
                                            {years.map(year => (
                                                <SelectItem key={year}>{year}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                {downloadType === "yearly" && (
                                    <Select
                                        label="Year"
                                        selectedKeys={new Set([selectedYear])}
                                        onSelectionChange={(keys) => setSelectedYear(Array.from(keys)[0])}
                                        variant="bordered"
                                    >
                                        {years.map(year => (
                                            <SelectItem key={year}>{year}</SelectItem>
                                        ))}
                                    </Select>
                                )}

                                {downloadType === "custom" && (
                                    <div className="flex gap-3">
                                        <Input
                                            type="date"
                                            label="Start Date"
                                            value={customStartDate}
                                            onValueChange={setCustomStartDate}
                                            variant="bordered"
                                            className="flex-1"
                                        />
                                        <Input
                                            type="date"
                                            label="End Date"
                                            value={customEndDate}
                                            onValueChange={setCustomEndDate}
                                            variant="bordered"
                                            className="flex-1"
                                        />
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>Cancel</Button>
                                <Button color="primary" startContent={<Download size={16} />} onPress={handleDownloadReport}>
                                    Download
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 -mx-6 -mt-6 px-6 pt-6">
                <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={18} className="text-default-500" />
                        <span className="text-xs text-default-500 uppercase tracking-wider">Total Staff</span>
                    </div>
                    <p className="text-2xl font-semibold text-default-900">{kpiStats.total}</p>
                </div>
                <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                    <div className="flex items-center gap-2 mb-2">
                        <UserCheck size={18} className="text-success-600" />
                        <span className="text-xs text-success-700 uppercase tracking-wider">Present</span>
                    </div>
                    <p className="text-2xl font-semibold text-success-700">{kpiStats.present}</p>
                </div>
                <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
                    <div className="flex items-center gap-2 mb-2">
                        <UserX size={18} className="text-danger-600" />
                        <span className="text-xs text-danger-700 uppercase tracking-wider">Absent</span>
                    </div>
                    <p className="text-2xl font-semibold text-danger-700">{kpiStats.absent}</p>
                </div>
                <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-warning-600" />
                        <span className="text-xs text-warning-700 uppercase tracking-wider">On Leave</span>
                    </div>
                    <p className="text-2xl font-semibold text-warning-700">{kpiStats.leave}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-1">
                        <Popover placement="bottom-start">
                            <PopoverTrigger>
                                <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const date = new Date(selectedDate);
                                            date.setDate(date.getDate() - 1);
                                            setSelectedDate(date.toISOString().split('T')[0]);
                                        }}
                                        className="p-0.5 hover:bg-default-100 rounded cursor-pointer"
                                    >
                                        <ChevronLeft size={14} className="text-default-400" />
                                    </div>
                                    <CalendarDays size={16} className="text-default-400 flex-shrink-0" />
                                    <span>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (selectedDate < new Date().toISOString().split('T')[0]) {
                                                const date = new Date(selectedDate);
                                                date.setDate(date.getDate() + 1);
                                                setSelectedDate(date.toISOString().split('T')[0]);
                                            }
                                        }}
                                        className={`p-0.5 hover:bg-default-100 rounded cursor-pointer ${selectedDate >= new Date().toISOString().split('T')[0] ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        <ChevronRight size={14} className="text-default-400" />
                                    </div>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
                                <Calendar
                                    value={parseDate(selectedDate)}
                                    onChange={(date) => setSelectedDate(date.toString())}
                                    aria-label="Select date"
                                />
                            </PopoverContent>
                        </Popover>
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            disabled={selectedDate === new Date().toISOString().split('T')[0]}
                            className="px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Today
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 w-full sm:max-w-[250px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                        <Search size={16} className="text-default-400" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="flex-1 bg-transparent outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
                                <X size={14} className="text-default-400" />
                            </button>
                        )}
                    </div>
                    <Dropdown>
                        <DropdownTrigger>
                            <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
                                <Filter size={16} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Filter by status"
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={new Set([statusFilter])}
                            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
                        >
                            <DropdownItem key="all">All Status</DropdownItem>
                            <DropdownItem key="present">Present</DropdownItem>
                            <DropdownItem key="absent">Absent</DropdownItem>
                            <DropdownItem key="halfday">Half Day</DropdownItem>
                            <DropdownItem key="leave">On Leave</DropdownItem>
                            <DropdownItem key="unmarked">Not Marked</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    <Dropdown>
                        <DropdownTrigger>
                            <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
                                <ArrowUpDown size={16} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Sort options"
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={new Set([sortDescriptor.column])}
                            onSelectionChange={(keys) => setSortDescriptor({ column: Array.from(keys)[0], direction: sortDescriptor.direction })}
                        >
                            <DropdownItem key="name">Name</DropdownItem>
                            <DropdownItem key="department">Department</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    <button
                        className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap"
                        onClick={() => setDownloadModalOpen(true)}
                    >
                        <Download size={16} className="text-default-400" />
                        <span>Download Report</span>
                    </button>

                    <Dropdown>
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                <Layers size={16} className="text-default-400" />
                                <span>Bulk Actions</span>
                                <ChevronDown size={14} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Bulk Actions"
                            onAction={handleBulkAction}
                        >
                            <DropdownItem key="present" className="text-success">Mark Selected Present</DropdownItem>
                            <DropdownItem key="halfday" className="text-secondary">Mark Selected Half Day</DropdownItem>
                            <DropdownItem key="absent" className="text-danger">Mark Selected Absent</DropdownItem>
                            <DropdownItem key="leave" className="text-warning">Mark Selected On Leave</DropdownItem>
                            <DropdownItem key="unmarked">Mark Selected Not Marked</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>


            {/* Table */}
            <Table
                aria-label="Staff attendance table"
                selectionMode="multiple"
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                removeWrapper
                classNames={{
                    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
                    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
                    th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default",
                    td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6 transition-colors",
                    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-5 [&>tr[data-selected=true]>td]:bg-primary-50",
                    tr: "transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900 data-[selected=true]:bg-primary-50",
                }}
                radius="none"
            >
                <TableHeader>
                    <TableColumn key="name" allowsSorting style={{ width: columnWidths.name }}>STAFF MEMBER</TableColumn>
                    <TableColumn key="status" allowsSorting style={{ width: columnWidths.status }}>STATUS</TableColumn>
                    <TableColumn key="inTime" style={{ width: columnWidths.inTime }}>
                        <span className="whitespace-normal leading-tight">CHECK IN</span>
                    </TableColumn>
                    <TableColumn key="outTime" style={{ width: columnWidths.outTime }}>
                        <span className="whitespace-normal leading-tight">CHECK OUT</span>
                    </TableColumn>
                    <TableColumn key="attendance" style={{ width: columnWidths.attendance, minWidth: columnWidths.attendance }}>
                        <Dropdown>
                            <DropdownTrigger>
                                <div className="flex items-center gap-1 cursor-pointer w-full h-full">
                                    <span className="whitespace-normal leading-tight">{attendancePeriod === "this_week" ? "THIS WEEK AVG" : attendancePeriod === "this_month" ? "THIS MONTH AVG" : "THIS YEAR AVG"}</span>
                                    <ChevronDown size={12} />
                                </div>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Select attendance period"
                                selectionMode="single"
                                selectedKeys={new Set([attendancePeriod])}
                                onSelectionChange={(keys) => setAttendancePeriod(Array.from(keys)[0])}
                            >
                                <DropdownItem key="this_week">This Week</DropdownItem>
                                <DropdownItem key="this_month">This Month</DropdownItem>
                                <DropdownItem key="this_year">This Year</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </TableColumn>
                    <TableColumn align="end" style={{ width: columnWidths.actions }}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No staff found">
                    {visibleStaff.map((s) => {
                        const att = dailyAttendance[s.id];
                        const overallPercentage = getOverallAttendance(s.id);

                        return (
                            <TableRow key={s.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <PhotoAvatar
                                            src={s.picture || s.photo}
                                            name={s.name}
                                            size="md"
                                            type="staff"
                                        />
                                        <div className="flex flex-col">
                                            <span
                                                className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer"
                                                onClick={() => navigate(`/staffs/${s.id}`)}
                                            >
                                                {s.name}
                                            </span>
                                            <span className="text-default-500 text-xs">{s.code}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <div className="relative group">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all text-xs font-medium ${getStatusStyle(att.status)}`}>
                                                    {getStatusIcon(att.status)}
                                                    <span>{getStatusLabel(att.status)}</span>
                                                    <ChevronDown size={12} className="opacity-50" />
                                                </div>
                                                {att.reason && (att.status === "absent" || att.status === "leave" || att.status === "halfday") && (
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-default-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-normal break-words w-max max-w-[calc(100vw-2rem)] sm:max-w-xs z-50 pointer-events-none">
                                                        <div className="relative">
                                                            <div className="font-semibold mb-1">
                                                                {att.status === "absent" ? "Absent Reason" : att.status === "leave" ? "Leave Reason" : "Half Day Reason"}
                                                            </div>
                                                            <div className="text-default-300">
                                                                {att.reason}
                                                            </div>
                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-default-900"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Change Status"
                                            onAction={(key) => handleStatusChange(s.id, key)}
                                        >
                                            <DropdownItem key="present" startContent={<Check size={14} className="text-success" />}>Present</DropdownItem>
                                            <DropdownItem key="halfday" startContent={<AlertCircle size={14} className="text-secondary" />}>Half Day</DropdownItem>
                                            <DropdownItem key="absent" startContent={<X size={14} className="text-danger" />}>Absent</DropdownItem>
                                            <DropdownItem key="leave" startContent={<Clock size={14} className="text-warning" />}>On Leave</DropdownItem>
                                            <DropdownItem key="unmarked" startContent={<Clock size={14} className="text-default-400" />}>Not Marked</DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </TableCell>
                                <TableCell>
                                    <span className="text-default-600 text-sm font-mono">
                                        {att.inTime}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-default-600 text-sm font-mono">
                                        {att.outTime}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Progress
                                            value={overallPercentage}
                                            size="sm"
                                            className="max-w-[150px]"
                                            classNames={{
                                                indicator: overallPercentage >= 90
                                                    ? "bg-emerald-300"
                                                    : overallPercentage >= 75
                                                        ? "bg-amber-300"
                                                        : "bg-rose-300",
                                                track: "bg-default-100"
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-default-700 min-w-[32px]">{overallPercentage}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button isIconOnly size="sm" variant="light" className="text-default-400">
                                                    <MoreVertical size={18} />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu aria-label="Actions">
                                                <DropdownItem key="view" onPress={() => navigate(`/staffs/${s.id}`)}>View Profile</DropdownItem>
                                                <DropdownItem key="edit">Edit Attendance</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Lazy Load Indicator */}
            <div ref={loaderRef} className="flex justify-center py-4">
                {isLoading && (
                    <Spinner size="sm" color="primary" />
                )}
                {!hasMore && filteredStaff.length > ITEMS_PER_LOAD && (
                    <span className="text-default-400 text-sm">All {filteredStaff.length} staff members loaded</span>
                )}
            </div>
        </div>
    );
}
