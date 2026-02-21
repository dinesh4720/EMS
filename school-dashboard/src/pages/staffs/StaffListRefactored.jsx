import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Spinner, Progress,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
    Select, SelectItem, Checkbox, Textarea, Input, Tooltip
} from "@heroui/react";
import {
    Search, ArrowUpDown, MoreVertical, Eye, Edit, Trash2, X, ChevronDown,
    Phone, Check, Download, Upload, UserX, FileOutput, Pin, PinOff,
    ArrowUpCircle, Calendar, Columns3, MessageSquare, GraduationCap, FileText, AlertTriangle, Info, FileSpreadsheet,
    CheckCircle, XCircle, Users, ChevronRight, ArrowRight, Briefcase
} from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { trashApi } from "../../services/api";
import toast from "react-hot-toast";
import PhotoAvatar from "../../components/PhotoAvatar";
import FiltersDropdown from "../../components/FiltersDropdown";
import { STAFF_ROLES } from "../../constants/roles";

const ITEMS_PER_LOAD = 15;

const ALL_COLUMNS = [
    { key: "name", label: "Staff Member", required: true },
    { key: "role", label: "Role", required: false },
    { key: "department", label: "Department", required: false },
    { key: "classes", label: "Classes Assigned", required: false },
    { key: "contact", label: "Contact Info", required: false },
    { key: "attendance", label: "Attendance", required: false },
    { key: "status", label: "Status", required: false },
    { key: "actions", label: "Actions", required: true },
];

export default function StaffListRefactored({ onStaffClick, onStaffEdit }) {
    const navigate = useNavigate();
    const { staff, deleteStaff, updateStaff, updateStaffLocal, staffAttendance, classesWithTeachers, loading: contextLoading } = useApp();

    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [attendanceFilter, setAttendanceFilter] = useState("all");

    // Dropdown open state tracking
    const [openDropdowns, setOpenDropdowns] = useState({
        status: false,
        bulk: false,
        export: false,
        role: false,
        department: false,
        sort: false,
        columns: false
    });

    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [isLoading, setIsLoading] = useState(false);
    const loaderRef = useRef(null);
    const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });
    const [selectedStaff, setSelectedStaff] = useState(new Set([]));
    const [showDeptSubmenu, setShowDeptSubmenu] = useState(false);
    const deptItemRef = useRef(null);

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem("staffListColumns");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const validKeys = ALL_COLUMNS.map(col => col.key);
                const validSaved = parsed.filter(key => validKeys.includes(key));
                ALL_COLUMNS.forEach(col => {
                    if (col.required && !validSaved.includes(col.key)) {
                        validSaved.push(col.key);
                    }
                });
                return new Set(validSaved);
            } catch {
                return new Set(ALL_COLUMNS.map(col => col.key));
            }
        }
        return new Set(ALL_COLUMNS.map(col => col.key));
    });

    const toggleColumn = (columnKey) => {
        const column = ALL_COLUMNS.find(c => c.key === columnKey);
        if (column?.required) return;

        setVisibleColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(columnKey)) {
                newSet.delete(columnKey);
            } else {
                newSet.add(columnKey);
            }
            localStorage.setItem("staffListColumns", JSON.stringify([...newSet]));
            return newSet;
        });
    };

    const visibleColumnsArray = useMemo(() =>
        ALL_COLUMNS.filter(col => visibleColumns.has(col.key)),
        [visibleColumns]
    );

    const roles = STAFF_ROLES || ["Teacher", "Admin", "Principal", "Accountant", "Librarian", "Lab Assistant", "Driver", "Support Staff"];
    const departments = useMemo(() => [...new Set(staff.map(s => s.department || "General"))].sort(), [staff]);
    const statusOptions = ["active", "inactive"];

    // Filter counts
    const statusCounts = useMemo(() => ({
        all: staff.length,
        active: staff.filter(s => (s.status || 'active') === "active").length,
        inactive: staff.filter(s => s.status === "inactive").length,
    }), [staff]);

    const getRoleCounts = () => {
        const counts = { all: staff.length };
        roles.forEach(role => {
            counts[role] = staff.filter(s => {
                const staffRoles = Array.isArray(s.role) ? s.role : [s.role];
                return staffRoles.includes(role);
            }).length;
        });
        return counts;
    };

    const getDepartmentCounts = () => {
        const counts = { all: staff.length };
        departments.forEach(dept => {
            counts[dept] = staff.filter(s => s.department === dept).length;
        });
        return counts;
    };

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (roleFilter !== "all") count++;
        if (deptFilter !== "all") count++;
        if (statusFilter !== "active") count++; // Default is active, so if distinct from 'active', count it? Or logic: if 'all', count it? Usually default is 'all' but here 'active' is default view.
        // Wait, StudentsList default statusFilter is 'active'.
        if (searchQuery) count++;
        if (attendanceFilter !== "all") count++;
        return count;
    }, [roleFilter, deptFilter, statusFilter, searchQuery, attendanceFilter]);

    // Filters Config
    const filtersConfig = useMemo(() => ({
        role: {
            label: "Role",
            value: roleFilter,
            options: ["all", ...roles],
            counts: getRoleCounts(),
            displayLabels: { all: "All Roles", ...roles.reduce((acc, r) => ({ ...acc, [r]: r }), {}) }
        },
        department: {
            label: "Department",
            value: deptFilter,
            options: ["all", ...departments],
            counts: getDepartmentCounts(),
            displayLabels: { all: "All Departments", ...departments.reduce((acc, d) => ({ ...acc, [d]: d }), {}) }
        },
        status: {
            label: "Status",
            value: statusFilter,
            options: ["all", ...statusOptions],
            counts: statusCounts,
            displayLabels: { all: "All Status", active: "Active", inactive: "Inactive" }
        }
    }), [roleFilter, deptFilter, statusFilter, staff, roles, departments, statusCounts]);

    // Filter Presets
    const filterPresets = [
        {
            id: "active-teachers",
            label: "Active Teachers",
            filters: { role: "Teacher", status: "active", department: "all" },
            applied: roleFilter === "Teacher" && statusFilter === "active"
        },
        {
            id: "admins",
            label: "Admin Staff",
            filters: { role: "Admin", status: "active", department: "all" },
            applied: roleFilter === "Admin"
        }
    ];

    // Attendance Helper
    const getAttendancePercentage = (staffId) => {
        const attendanceRecordsObj = staffAttendance && staffAttendance[staffId] ? staffAttendance[staffId] : {};
        const attendanceRecords = Object.values(attendanceRecordsObj);
        if (attendanceRecords.length === 0) return 0;
        const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'Present').length;
        return Math.round((presentDays / attendanceRecords.length) * 100);
    };

    // Class Teacher Helper
    const getClassTeacherAssignments = (staffId) => {
        if (!classesWithTeachers || !staffId) return [];
        return classesWithTeachers.filter(cls =>
            cls.classTeacherId && String(cls.classTeacherId) === String(staffId)
        );
    };

    // Filter Logic
    const filteredItems = useMemo(() => {
        let filtered = [...staff];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter((s) =>
                s.name.toLowerCase().includes(lowerQuery) ||
                s.email?.toLowerCase().includes(lowerQuery) ||
                s.code?.toLowerCase().includes(lowerQuery) ||
                s.phone?.toLowerCase().includes(lowerQuery)
            );
        }

        if (roleFilter !== "all") {
            filtered = filtered.filter((s) => {
                const staffRoles = Array.isArray(s.role) ? s.role : [s.role];
                return staffRoles.includes(roleFilter);
            });
        }

        if (deptFilter !== "all") {
            filtered = filtered.filter((s) => s.department === deptFilter);
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter((s) => (s.status || 'active') === statusFilter);
        }

        if (attendanceFilter !== "all") {
            filtered = filtered.filter((s) => {
                const att = getAttendancePercentage(s.id);
                switch (attendanceFilter) {
                    case "high": return att >= 90;
                    case "medium": return att >= 75 && att < 90;
                    case "low": return att < 75;
                    default: return true;
                }
            });
        }

        return filtered.sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [staff, searchQuery, roleFilter, deptFilter, statusFilter, attendanceFilter, sortDescriptor]);

    const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);
    const hasMore = visibleCount < filteredItems.length;
    const selectedCount = selectedStaff === "all" ? filteredItems.length : selectedStaff.size;

    // Reset visible count
    useEffect(() => {
        setVisibleCount(ITEMS_PER_LOAD);
        setIsLoading(false);
    }, [searchQuery, roleFilter, deptFilter, statusFilter, attendanceFilter, sortDescriptor]);

    // Intersection Observer
    useEffect(() => {
        if (!hasMore) {
            setIsLoading(false);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setIsLoading(true);
                setTimeout(() => {
                    setVisibleCount(prev => prev + ITEMS_PER_LOAD);
                    setIsLoading(false);
                }, 300);
            }
        }, { threshold: 0.1 });

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore]);

    // Socket.IO Listener
    useEffect(() => {
        const socketService = window.socketService;
        if (!socketService) return;

        const handleStaffUpdate = (data) => {
            updateStaffLocal(data.staffId, {
                name: data.name,
                role: data.role,
                department: data.department,
                status: data.status,
                phone: data.phone,
                email: data.email,
                picture: data.picture
            });
            toast.success(`${data.name}'s profile updated`);
        };

        socketService.on('staff_updated', handleStaffUpdate);
        return () => socketService.off('staff_updated', handleStaffUpdate);
    }, [updateStaffLocal]);

    // Status Helpers
    const getStatusStyle = (status) => {
        switch (status) {
            case "active": return "bg-success-50 border-success-200 text-success-700";
            case "inactive": return "bg-danger-50 border-danger-200 text-danger-700";
            default: return "bg-default-100 border-default-200 text-default-600";
        }
    };

    const getStatusDotColor = (status) => {
        switch (status) {
            case "active": return "bg-success-500";
            case "inactive": return "bg-danger-500";
            default: return "bg-default-400";
        }
    };

    // Actions
    const handleStatusChange = async (staffId, newStatus) => {
        try {
            const staffMember = staff.find(s => s.id === staffId);
            await updateStaff(staffId, { ...staffMember, status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const clearAllFilters = () => {
        setRoleFilter("all");
        setDeptFilter("all");
        setStatusFilter("active");
        setAttendanceFilter("all");
        setSearchQuery("");
        toast.success("All filters cleared");
    };

    const handleFilterChange = (filterKey, value) => {
        switch (filterKey) {
            case "role": setRoleFilter(value); break;
            case "department": setDeptFilter(value); break;
            case "status": setStatusFilter(value); break;
            default: break;
        }
    };

    const handlePresetClick = (preset) => {
        const { filters } = preset;
        setRoleFilter(filters.role);
        setDeptFilter(filters.department);
        setStatusFilter(filters.status);
        toast.success(`Applied preset: ${preset.label}`);
    };

    const exportToCSV = () => {
        const headers = ["Staff Name", "Employee ID", "Role", "Department", "Contact", "Email", "Status", "Attendance %"];
        const rows = filteredItems.map(s => [
            s.name,
            s.code,
            Array.isArray(s.role) ? s.role.join(', ') : s.role,
            s.department,
            s.phone || "N/A",
            s.email,
            s.status || "active",
            `${getAttendancePercentage(s.id)}%`
        ]);
        const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `staff-list-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success("Staff list exported successfully");
    };

    const getSelectedIds = () => selectedStaff === "all" ? filteredItems.map(s => s.id) : Array.from(selectedStaff);

    const handleBulkStatusChange = async (newStatus) => {
        if (selectedCount === 0) return;
        try {
            const ids = getSelectedIds();
            await Promise.all(ids.map(id => {
                const staffMember = staff.find(s => s.id === Number(id));
                return staffMember ? updateStaff(Number(id), { ...staffMember, status: newStatus }) : Promise.resolve();
            }));
            toast.success(`Status updated for ${selectedCount} staff members`);
            setSelectedStaff(new Set());
        } catch (err) { toast.error("Failed to update status"); }
    };

    const handleBulkRoleChange = async (newRole) => {
        if (selectedCount === 0) return;
        try {
            const ids = getSelectedIds();
            await Promise.all(ids.map(id => {
                const staffMember = staff.find(s => s.id === Number(id));
                return staffMember ? updateStaff(Number(id), { ...staffMember, role: newRole }) : Promise.resolve();
            }));
            toast.success(`Role updated for ${selectedCount} staff members`);
            setSelectedStaff(new Set());
        } catch (err) { toast.error("Failed to update role"); }
    };

    const handleBulkDepartmentChange = async (newDept) => {
        if (selectedCount === 0) return;
        try {
            const ids = getSelectedIds();
            await Promise.all(ids.map(id => {
                const staffMember = staff.find(s => s.id === Number(id));
                return staffMember ? updateStaff(Number(id), { ...staffMember, department: newDept }) : Promise.resolve();
            }));
            toast.success(`Department updated for ${selectedCount} staff members`);
            setSelectedStaff(new Set());
        } catch (err) { toast.error("Failed to update department"); }
    };

    const handleBulkDelete = async () => {
        if (selectedCount === 0) return;
        if (!confirm(`Delete ${selectedCount} staff members?`)) return;
        try {
            const ids = getSelectedIds();
            await Promise.all(ids.map(id => deleteStaff(Number(id))));
            toast.success(`${selectedCount} staff members deleted`);
            setSelectedStaff(new Set());
        } catch (err) { toast.error("Failed to delete staff members"); }
    };

    return (
        <div className="w-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white border-b border-gray-200 py-4 -mx-6 -mt-6 px-6 sticky top-0 z-30 shadow-sm">
                {/* Left Side */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Status Filter */}
                    <Dropdown isOpen={openDropdowns.status} onOpenChange={(isOpen) => setOpenDropdowns(prev => ({ ...prev, status: isOpen }))}>
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-teal-500 transition-all text-sm whitespace-nowrap">
                                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(statusFilter)}`}></span>
                                <span className="text-gray-700 capitalize">{statusFilter === 'all' ? 'All Status' : statusFilter}</span>
                                <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-xs">{statusCounts[statusFilter]}</span>
                                <ChevronDown size={14} className="text-gray-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu onAction={(key) => { setStatusFilter(key); setOpenDropdowns(prev => ({ ...prev, status: false })); }}>
                            <DropdownItem key="all" startContent={statusFilter === "all" && <Check size={14} />}>All Status</DropdownItem>
                            <DropdownItem key="active" startContent={<span className="w-2 h-2 rounded-full bg-success-500" />}>Active</DropdownItem>
                            <DropdownItem key="inactive" startContent={<span className="w-2 h-2 rounded-full bg-danger-500" />}>Inactive</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Search */}
                    <div className="flex items-center gap-2 w-full sm:max-w-[280px] px-3 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-teal-500 focus-within:border-teal-500 transition-all">
                        <Search size={16} className="text-gray-400" />
                        <input
                            type="search"
                            placeholder="Search staff..."
                            className="flex-1 bg-transparent outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && <button onClick={() => setSearchQuery("")}><X size={14} className="text-gray-400" /></button>}
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <FiltersDropdown
                        filters={filtersConfig}
                        onFilterChange={handleFilterChange}
                        onClearAll={clearAllFilters}
                        activeFiltersCount={activeFiltersCount}
                        presets={filterPresets}
                        onPresetClick={handlePresetClick}
                    />

                    {/* Bulk Actions */}
                    {selectedCount > 0 && (
                        <div className="relative">
                            <Dropdown isOpen={openDropdowns.bulk} onOpenChange={(isOpen) => setOpenDropdowns(prev => ({ ...prev, bulk: isOpen }))}>
                                <DropdownTrigger>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-300 hover:border-primary text-sm whitespace-nowrap">
                                        <Users size={16} className="text-gray-500" />
                                        <span>Bulk ({selectedCount})</span>
                                        <ChevronDown size={14} className="text-gray-400" />
                                    </button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Bulk actions">
                                    <DropdownSection title="Change Status">
                                        <DropdownItem key="active" onPress={() => handleBulkStatusChange("active")}>Set Active</DropdownItem>
                                        <DropdownItem key="inactive" onPress={() => handleBulkStatusChange("inactive")}>Set Inactive</DropdownItem>
                                    </DropdownSection>
                                    <DropdownSection title="Actions">
                                        <DropdownItem key="delete" className="text-danger" color="danger" onPress={handleBulkDelete}>Delete Selected</DropdownItem>
                                    </DropdownSection>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    )}

                    {/* Columns Toggle */}
                    <Dropdown isOpen={openDropdowns.columns} onOpenChange={(isOpen) => setOpenDropdowns(prev => ({ ...prev, columns: isOpen }))} closeOnSelect={false}>
                        <DropdownTrigger>
                            <button className="p-2 bg-white rounded-lg border border-gray-200 hover:border-primary text-gray-500">
                                <Columns3 size={18} />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Toggle columns">
                            {ALL_COLUMNS.map(col => (
                                <DropdownItem key={col.key} onPress={() => toggleColumn(col.key)} startContent={visibleColumns.has(col.key) ? <Check size={14} /> : <div className="w-3.5" />}>
                                    {col.label}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>

                    {/* Export */}
                    <Dropdown isOpen={openDropdowns.export} onOpenChange={(isOpen) => setOpenDropdowns(prev => ({ ...prev, export: isOpen }))}>
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-primary text-sm">
                                <Download size={16} className="text-gray-500" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            <DropdownItem key="csv" onPress={exportToCSV}>Export CSV</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            {/* Table */}
            <Table
                aria-label="Staff table"
                selectionMode="multiple"
                selectedKeys={selectedStaff}
                onSelectionChange={setSelectedStaff}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                onRowAction={(key) => onStaffClick(key)}
                removeWrapper
                radius="none"
                disableRowSelection
                disableAnimation
                classNames={{
                    base: "-mx-6 overflow-visible scrollbar-auto-hide [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
                    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12 [&>tr>th:first-child]:sticky [&>tr>th:first-child]:left-0 [&>tr>th:first-child]:z-20 [&>tr>th:first-child]:bg-white [&>tr>th:nth-child(2)]:sticky [&>tr>th:nth-child(2)]:left-12 [&>tr>th:nth-child(2)]:z-20 [&>tr>th:nth-child(2)]:bg-white",
                    th: "bg-white text-gray-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-gray-200 last:pr-6 hover:bg-gray-50 transition-colors first:hover:bg-transparent select-none",
                    td: "py-4 border-b border-gray-200 group-data-[last=true]:border-none last:pr-6 select-text bg-white",
                    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr>td:first-child]:sticky [&>tr>td:first-child]:left-0 [&>tr>td:first-child]:z-20 [&>tr>td:first-child]:bg-white [&>tr>td:nth-child(2)]:sticky [&>tr>td:nth-child(2)]:left-12 [&>tr>td:nth-child(2)]:z-20 [&>tr>td:nth-child(2)]:bg-white group-hover:[&>tr>td:first-child]:bg-gray-50 group-hover:[&>tr>td:nth-child(2)]:bg-gray-50",
                    tr: "group hover:bg-gray-50 transition-colors cursor-pointer"
                }}
            >
                <TableHeader columns={visibleColumnsArray}>
                    {(column) => (
                        <TableColumn
                            key={column.key}
                            allowsSorting={column.key !== 'actions'}
                            align={column.key === 'actions' ? 'end' : 'start'}
                            style={{
                                width: column.key === "name" ? 240 : column.key === "actions" ? 60 : 150
                            }}
                        >
                            {column.label.toUpperCase()}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={visibleItems} emptyContent="No staff found">
                    {(item) => (
                        <TableRow
                            key={item.id}
                            className="cursor-pointer transition-colors hover:bg-default-50"
                            onClick={(e) => {
                                if (e.target.closest("button") || e.target.closest("label") || e.target.closest("input") || e.target.closest("a")) return;
                                const selection = window.getSelection();
                                if (selection && selection.toString().length > 0) return;
                                onStaffClick(item.id);
                            }}
                        >
                            {(columnKey) => (
                                <TableCell>
                                    {columnKey === "name" && (
                                        <div className="flex items-center gap-3">
                                            <PhotoAvatar src={item.picture || item.photo} name={item.name} size="md" />
                                            <div>
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.code || item.staffId || item.id}</p>
                                            </div>
                                        </div>
                                    )}
                                    {columnKey === "role" && (
                                        <div className="flex flex-wrap gap-1">
                                            {Array.isArray(item.role) ? item.role.map((r, i) => <Chip key={i} size="sm" variant="flat">{r}</Chip>) : <Chip size="sm" variant="flat">{item.role}</Chip>}
                                        </div>
                                    )}
                                    {columnKey === "department" && (
                                        <Chip size="sm" variant="dot" color="primary" classNames={{ content: "font-medium text-gray-600" }}>{item.department}</Chip>
                                    )}
                                    {columnKey === "classes" && (
                                        (Array.isArray(item.role) ? item.role.includes('Teacher') : item.role === 'Teacher') ? (
                                            <div className="flex flex-col gap-1">
                                                {getClassTeacherAssignments(item.id).slice(0, 2).map((cls, i) => (
                                                    <Link key={i} to={`/classes/${cls.id}`} onClick={e => e.stopPropagation()} className="text-xs text-blue-600 hover:underline">{cls.name}-{cls.section}</Link>
                                                ))}
                                                {getClassTeacherAssignments(item.id).length > 2 && <span className="text-xs text-gray-400">+{getClassTeacherAssignments(item.id).length - 2} more</span>}
                                                {getClassTeacherAssignments(item.id).length === 0 && <span className="text-xs text-gray-400">-</span>}
                                            </div>
                                        ) : <span className="text-gray-300">-</span>
                                    )}
                                    {columnKey === "contact" && (
                                        <div className="text-xs">
                                            <p className="text-gray-900">{item.phone || "N/A"}</p>
                                            <p className="text-gray-500 truncate max-w-[150px]">{item.email}</p>
                                        </div>
                                    )}
                                    {columnKey === "attendance" && (
                                        <div className="flex items-center gap-2">
                                            <Progress value={getAttendancePercentage(item.id)} size="sm" color={getAttendancePercentage(item.id) > 80 ? "success" : "warning"} className="max-w-[80px]" />
                                            <span className="text-xs font-medium">{getAttendancePercentage(item.id)}%</span>
                                        </div>
                                    )}
                                    {columnKey === "status" && (
                                        <Chip size="sm" variant="flat" color={item.status === 'active' ? "success" : "danger"} className="capitalize">{item.status || 'active'}</Chip>
                                    )}
                                    {columnKey === "actions" && (
                                        <div className="flex justify-end gap-1">
                                            <Button isIconOnly size="sm" variant="light" onPress={() => onStaffEdit ? onStaffEdit(item.id) : null}><Edit size={16} className="text-gray-400 hover:text-gray-700" /></Button>
                                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => deleteStaff(item.id)}><Trash2 size={16} /></Button>
                                        </div>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Lazy Loader */}
            <div ref={loaderRef} className="flex justify-center py-6">
                {isLoading && <Spinner size="sm" color="primary" />}
                {!hasMore && filteredItems.length > 0 && <span className="text-xs text-gray-400">All staff loaded</span>}
            </div>
        </div>
    );
}
