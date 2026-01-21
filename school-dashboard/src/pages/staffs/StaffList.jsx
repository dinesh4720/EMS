import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Spinner, Avatar,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection
} from "@heroui/react";
import { Search, Filter, ArrowUpDown, Edit, Trash2, X, ChevronDown, Check, Download, Users, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const ITEMS_PER_LOAD = 10;

export default function StaffList({ onStaffClick, onStaffEdit }) {
    const { staff, deleteStaff, updateStaff, updateStaffLocal, staffAttendance } = useApp();
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [isLoading, setIsLoading] = useState(false);
    const loaderRef = useRef(null);
    const [sortDescriptor, setSortDescriptor] = useState({
        column: "name",
        direction: "ascending",
    });
    const [selectedStaff, setSelectedStaff] = useState(new Set());
    const [showDeptSubmenu, setShowDeptSubmenu] = useState(false);
    const deptItemRef = useRef(null);

    const [columnWidths] = useState({
        name: 260,
        role: 140,
        department: 130,
        contact: 140,
        attendance: 120,
        status: 120,
        actions: 80
    });

    const roles = ["Teacher", "Admin", "Principal", "Vice Principal", "Accountant", "Librarian", "Lab Assistant"];
    const departments = [...new Set(staff.map(s => s.department))];
    const statusOptions = ["active", "inactive"];

    // Get counts for each status
    const statusCounts = useMemo(() => {
        return {
            all: staff.length,
            active: staff.filter(s => s.status === "active").length,
            inactive: staff.filter(s => s.status === "inactive").length,
        };
    }, [staff]);

    // Calculate attendance percentage for each staff
    const getAttendancePercentage = (staffId) => {
        // Get attendance records for this staff member
        const attendanceRecords = staffAttendance && staffAttendance[staffId] ? staffAttendance[staffId] : [];

        if (attendanceRecords.length === 0) return 0;

        const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'Present').length;
        return Math.round((presentDays / attendanceRecords.length) * 100);
    };

    const filteredItems = useMemo(() => {
        let filtered = [...staff];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter((s) =>
                s.name.toLowerCase().includes(lowerQuery) ||
                s.email.toLowerCase().includes(lowerQuery) ||
                s.code?.toLowerCase().includes(lowerQuery) ||
                s.phone?.toLowerCase().includes(lowerQuery)
            );
        }

        if (roleFilter !== "all") {
            filtered = filtered.filter((s) => s.role === roleFilter);
        }

        if (deptFilter !== "all") {
            filtered = filtered.filter((s) => s.department === deptFilter);
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter((s) => s.status === statusFilter);
        }

        return filtered.sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [staff, searchQuery, roleFilter, deptFilter, statusFilter, sortDescriptor]);

    const visibleItems = useMemo(() => {
        return filteredItems.slice(0, visibleCount);
    }, [filteredItems, visibleCount]);

    const selectedCount = selectedStaff === "all" ? filteredItems.length : selectedStaff.size;

    const hasMore = visibleCount < filteredItems.length;

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_LOAD);
    }, [searchQuery, roleFilter, deptFilter, statusFilter, sortDescriptor]);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    setIsLoading(true);
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

    // Listen for real-time staff updates via Socket.IO
    useEffect(() => {
        const socketService = window.socketService;
        if (!socketService) {
            console.log('⚠️ Socket service not available yet');
            return;
        }

        const handleStaffUpdate = (data) => {
            console.log('📢 Received staff update:', data);
            
            // Directly update the staff member in state without API call
            updateStaffLocal(data.staffId, {
                name: data.name,
                role: data.role,
                department: data.department,
                status: data.status,
                phone: data.phone,
                email: data.email,
                picture: data.picture
            });
            
            toast.success(`${data.name}'s profile was updated`, {
                duration: 3000,
                icon: '🔄'
            });
        };

        console.log('🎧 Setting up staff_updated listener');
        socketService.on('staff_updated', handleStaffUpdate);

        return () => {
            console.log('🔇 Removing staff_updated listener');
            socketService.off('staff_updated', handleStaffUpdate);
        };
    }, [updateStaffLocal]);

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

    // Handle status change
    const handleStatusChange = async (staffId, newStatus) => {
        try {
            const staffMember = staff.find(s => s.id === staffId);
            await updateStaff(staffId, { ...staffMember, status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    // Export functions
    const exportToCSV = () => {
        const headers = ["Staff Name", "Employee ID", "Role", "Department", "Contact", "Email", "Status", "Attendance %"];
        const rows = filteredItems.map(s => [
            s.name,
            s.code,
            s.role,
            s.department,
            s.phone || "N/A",
            s.email,
            s.status,
            `${getAttendancePercentage(s.id)}%`
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `staff-list-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success("Staff list exported successfully");
    };

    const exportToPDF = () => {
        toast.info("PDF export feature coming soon");
    };

    // Bulk actions
    // Bulk actions
    const getSelectedIds = () => {
        if (selectedStaff === "all") {
            return filteredItems.map(s => s.id);
        }
        return Array.from(selectedStaff);
    };

    const handleBulkStatusChange = async (newStatus) => {
        if (selectedCount === 0) return;

        try {
            const ids = getSelectedIds();
            const updates = ids.map(async (staffId) => {
                const numericId = Number(staffId);
                const staffMember = staff.find(s => s.id === numericId);
                if (staffMember) {
                    await updateStaff(numericId, { ...staffMember, status: newStatus });
                }
            });

            await Promise.all(updates);
            toast.success(`Status updated to ${newStatus} for ${selectedCount} staff members`);
            setSelectedStaff(new Set());
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleBulkRoleChange = async (newRole) => {
        if (selectedCount === 0) return;

        try {
            const ids = getSelectedIds();
            const updates = ids.map(async (staffId) => {
                const numericId = Number(staffId);
                const staffMember = staff.find(s => s.id === numericId);
                if (staffMember) {
                    await updateStaff(numericId, { ...staffMember, role: newRole });
                }
            });

            await Promise.all(updates);
            toast.success(`Role updated to ${newRole} for ${selectedCount} staff members`);
            setSelectedStaff(new Set());
        } catch (err) {
            toast.error("Failed to update role");
        }
    };

    const handleBulkDepartmentChange = async (newDept) => {
        if (selectedCount === 0) return;

        try {
            const ids = getSelectedIds();
            const updates = ids.map(async (staffId) => {
                const numericId = Number(staffId);
                const staffMember = staff.find(s => s.id === numericId);
                if (staffMember) {
                    await updateStaff(numericId, { ...staffMember, department: newDept });
                }
            });

            await Promise.all(updates);
            toast.success(`Department updated to ${newDept} for ${selectedCount} staff members`);
            setSelectedStaff(new Set());
        } catch (err) {
            toast.error("Failed to update department");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCount === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedCount} staff members?`)) {
            return;
        }

        try {
            const ids = getSelectedIds();
            const deletions = ids.map(async (staffId) => {
                await deleteStaff(Number(staffId));
            });

            await Promise.all(deletions);
            toast.success(`${selectedCount} staff members deleted successfully`);
            setSelectedStaff(new Set());
        } catch (err) {
            toast.error("Failed to delete staff members");
        }
    };

    return (
        <div className="w-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
                {/* Left Side - Status Filter & Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Status Filter */}
                    <Dropdown placement="bottom-start">
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap capitalize">
                                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(statusFilter)}`}></span>
                                <span>{statusFilter}</span>
                                <span className="text-default-500">{statusCounts[statusFilter]}</span>
                                <ChevronDown size={14} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Filter by status"
                            onAction={(key) => {
                                setStatusFilter(key);
                                toast.info(`Filter applied: ${key === 'all' ? 'All status' : key}`);
                            }}
                        >
                            <DropdownItem
                                key="all"
                                startContent={statusFilter === "all" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}
                                endContent={<span className="text-default-400 text-xs">{statusCounts.all}</span>}
                            >
                                All Status
                            </DropdownItem>
                            <DropdownItem
                                key="active"
                                startContent={statusFilter === "active" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}
                                endContent={<span className="text-default-400 text-xs">{statusCounts.active}</span>}
                                className="capitalize"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success-500"></span>
                                    Active
                                </span>
                            </DropdownItem>
                            <DropdownItem
                                key="inactive"
                                startContent={statusFilter === "inactive" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}
                                endContent={<span className="text-default-400 text-xs">{statusCounts.inactive}</span>}
                                className="capitalize"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-danger-500"></span>
                                    Inactive
                                </span>
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    <div className="flex items-center gap-2 w-full sm:max-w-[280px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                        <Search size={16} className="text-default-400" />
                        <input
                            type="search"
                            name="staff-search-query"
                            placeholder="Search by name, email, or ID..."
                            className="flex-1 bg-transparent outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                            data-form-type="other"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer">
                                <X size={14} className="text-default-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side - Filters & Actions */}
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    {/* Bulk Actions */}
                    {selectedCount > 0 && (
                        <div className="relative">
                            <Dropdown>
                                <DropdownTrigger>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap text-default-900">
                                        <Users size={16} className="text-default-400" />
                                        <span>Bulk Actions ({selectedCount})</span>
                                        <ChevronDown size={14} className="text-default-400" />
                                    </button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Bulk actions" className="relative">
                                    <DropdownSection title="Change Status" showDivider>
                                        <DropdownItem
                                            key="status-active"
                                            onPress={() => handleBulkStatusChange("active")}
                                            startContent={<span className="w-2 h-2 rounded-full bg-success-500"></span>}
                                        >
                                            Set as Active
                                        </DropdownItem>
                                        <DropdownItem
                                            key="status-inactive"
                                            onPress={() => handleBulkStatusChange("inactive")}
                                            startContent={<span className="w-2 h-2 rounded-full bg-danger-500"></span>}
                                        >
                                            Set as Inactive
                                        </DropdownItem>
                                    </DropdownSection>
                                    <DropdownSection title="Change Role" showDivider>
                                        {roles.map((role) => (
                                            <DropdownItem
                                                key={`role-${role}`}
                                                onPress={() => handleBulkRoleChange(role)}
                                            >
                                                Set as {role}
                                            </DropdownItem>
                                        ))}
                                    </DropdownSection>
                                    <DropdownSection title="Change Department" showDivider>
                                        <DropdownItem
                                            key="dept-submenu"
                                            textValue="Move to Department"
                                            className="relative [&>span]:w-full"
                                        >
                                            <div
                                                ref={deptItemRef}
                                                className={`flex items-center justify-between w-full cursor-pointer group/dept ${showDeptSubmenu ? "bg-default-100 text-default-900" : "text-default-700"}`}
                                                onPointerEnter={() => setShowDeptSubmenu(true)}
                                                onPointerLeave={() => {
                                                    // Small delay to allow moving to submenu
                                                    setTimeout(() => {
                                                        const submenu = document.querySelector('.dept-submenu');
                                                        if (submenu && !submenu.matches(':hover')) {
                                                            setShowDeptSubmenu(false);
                                                        }
                                                    }, 100);
                                                }}
                                            >
                                                <span>Move to Department</span>
                                                <ChevronRight size={14} className="text-default-400" />
                                            </div>
                                        </DropdownItem>
                                    </DropdownSection>
                                    <DropdownSection title="Actions">
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            onPress={handleBulkDelete}
                                            startContent={<Trash2 size={14} />}
                                        >
                                            Delete Selected
                                        </DropdownItem>
                                    </DropdownSection>
                                </DropdownMenu>
                            </Dropdown>

                            {/* Department Submenu Portal */}
                            {showDeptSubmenu && deptItemRef.current && createPortal(
                                <div
                                    className="dept-submenu fixed bg-content1 border border-default-200 rounded-lg shadow-xl p-1 min-w-[200px] max-h-[300px] overflow-y-auto"
                                    style={{
                                        left: `${deptItemRef.current.getBoundingClientRect().right + 8}px`,
                                        top: `${deptItemRef.current.getBoundingClientRect().top}px`,
                                        zIndex: 2147483647
                                    }}
                                    onPointerEnter={() => {
                                        console.log('Pointer entered submenu');
                                        setShowDeptSubmenu(true);
                                    }}
                                    onPointerLeave={() => {
                                        console.log('Pointer left submenu');
                                        setShowDeptSubmenu(false);
                                    }}
                                >
                                    {departments.map((dept) => (
                                        <button
                                            key={`dept-${dept}`}
                                            onClick={() => {
                                                handleBulkDepartmentChange(dept);
                                                setShowDeptSubmenu(false);
                                            }}
                                            className="w-full text-left px-2 py-1.5 text-sm font-normal text-default-700 rounded-md hover:bg-default-100 hover:text-default-900 transition-colors"
                                        >
                                            {dept}
                                        </button>
                                    ))}
                                </div>,
                                document.body
                            )}
                        </div>
                    )}

                    {/* Export */}
                    <Dropdown>
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                <Download size={16} className="text-default-400" />
                                <span>Export</span>
                                <ChevronDown size={14} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Export options">
                            <DropdownItem key="csv" onPress={exportToCSV}>
                                Export as CSV
                            </DropdownItem>
                            <DropdownItem key="pdf" onPress={exportToPDF}>
                                Export as PDF
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Role Filter */}
                    <Dropdown>
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                <Filter size={16} className="text-default-400" />
                                <span>{roleFilter === "all" ? "Role" : roleFilter}</span>
                                <ChevronDown size={14} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Filter by role"
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={new Set([roleFilter])}
                            onSelectionChange={(keys) => {
                                const role = Array.from(keys)[0];
                                setRoleFilter(role);
                                toast.info(`Filter applied: ${role === 'all' ? 'All roles' : role}`);
                            }}
                        >
                            <DropdownItem key="all">All Roles</DropdownItem>
                            {roles.map((role) => (
                                <DropdownItem key={role}>{role}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>

                    {/* Department Filter */}
                    <Dropdown>
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                <span>{deptFilter === "all" ? "Department" : deptFilter}</span>
                                <ChevronDown size={14} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Filter by department"
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={new Set([deptFilter])}
                            onSelectionChange={(keys) => {
                                const dept = Array.from(keys)[0];
                                setDeptFilter(dept);
                                toast.info(`Filter applied: ${dept === 'all' ? 'All departments' : dept}`);
                            }}
                        >
                            <DropdownItem key="all">All Departments</DropdownItem>
                            {departments.map((dept) => (
                                <DropdownItem key={dept}>{dept}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>

                    {/* Sort */}
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
                            <DropdownItem key="role">Role</DropdownItem>
                            <DropdownItem key="department">Department</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            {/* Table */}
            <Table
                aria-label="All Staff table"
                selectionMode="multiple"
                selectedKeys={selectedStaff}
                onSelectionChange={setSelectedStaff}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                onRowAction={(key) => onStaffClick(key)} // Don't convert to number - MongoDB IDs are strings
                removeWrapper
                radius="none"
                classNames={{
                    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
                    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12 [&>tr>th:first-child]:sticky [&>tr>th:first-child]:left-0 [&>tr>th:first-child]:z-20 [&>tr>th:first-child]:bg-background [&>tr>th:nth-child(2)]:sticky [&>tr>th:nth-child(2)]:left-12 [&>tr>th:nth-child(2)]:z-20 [&>tr>th:nth-child(2)]:bg-background",
                    th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors first:hover:bg-transparent",
                    td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6",
                    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr>td:first-child]:sticky [&>tr>td:first-child]:left-0 [&>tr>td:first-child]:z-20 [&>tr>td:first-child]:bg-background [&>tr>td:nth-child(2)]:sticky [&>tr>td:nth-child(2)]:left-12 [&>tr>td:nth-child(2)]:z-20 [&>tr>td:nth-child(2)]:bg-background group-hover:[&>tr>td:first-child]:bg-default-50 group-hover:[&>tr>td:nth-child(2)]:bg-default-50",
                    tr: "group"
                }}
            >
                <TableHeader>
                    <TableColumn key="name" allowsSorting style={{ width: columnWidths.name }}>STAFF NAME</TableColumn>
                    <TableColumn key="role" allowsSorting style={{ width: columnWidths.role }}>ROLE</TableColumn>
                    <TableColumn key="department" allowsSorting style={{ width: columnWidths.department }}>DEPARTMENT</TableColumn>
                    <TableColumn key="contact" style={{ width: columnWidths.contact }}>CONTACT INFO</TableColumn>
                    <TableColumn key="attendance" style={{ width: columnWidths.attendance }}>ATTENDANCE %</TableColumn>
                    <TableColumn key="status" style={{ width: columnWidths.status }}>STATUS</TableColumn>
                    <TableColumn key="actions" align="end" style={{ width: columnWidths.actions }}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={visibleItems} emptyContent="No staff members found">
                    {(s) => (
                        <TableRow
                            key={s.id}
                            className="cursor-pointer transition-colors hover:bg-default-50"
                        >
                            <TableCell key="name">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={s.picture || s.photo}
                                        name={s.name}
                                        className="w-10 h-10"
                                        showFallback
                                    />
                                    <div className="flex flex-col">
                                        <Link
                                            to={`/staffs/${s.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer"
                                        >
                                            {s.name}
                                        </Link>
                                        <span className="text-default-500 text-xs">{s.code}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell key="role">
                                <span className="text-default-900 text-sm">{s.role}</span>
                            </TableCell>
                            <TableCell key="department">
                                <Chip size="sm" variant="flat" color="secondary" className="capitalize">
                                    {s.department}
                                </Chip>
                            </TableCell>
                            <TableCell key="contact">
                                <div className="flex flex-col gap-1">
                                    <span className="text-default-900 text-xs">{s.phone || "N/A"}</span>
                                    <span className="text-default-500 text-xs">{s.email}</span>
                                </div>
                            </TableCell>
                            <TableCell key="attendance">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-default-200 rounded-full h-1.5 w-16">
                                        <div
                                            className="bg-success-500 h-1.5 rounded-full transition-all"
                                            style={{ width: `${getAttendancePercentage(s.id)}%` }}
                                        />
                                    </div>
                                    <span className="text-default-900 text-xs font-medium min-w-[35px]">
                                        {getAttendancePercentage(s.id)}%
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell key="status">
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${getStatusStyle(s.status)}`}>
                                                <span className="capitalize">{s.status}</span>
                                                <ChevronDown size={12} />
                                            </button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Change status"
                                            onAction={(key) => handleStatusChange(s.id, key)}
                                        >
                                            <DropdownItem key="active">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-success-500"></span>
                                                    Active
                                                </span>
                                            </DropdownItem>
                                            <DropdownItem key="inactive">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-danger-500"></span>
                                                    Inactive
                                                </span>
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            </TableCell>
                            <TableCell key="actions">
                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="text-default-400 hover:text-primary"
                                        onPress={() => onStaffEdit ? onStaffEdit(s.id) : onStaffClick(s.id)}
                                    >
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="text-default-400 hover:text-danger"
                                        onPress={async () => {
                                            try {
                                                await deleteStaff(s.id);
                                                toast.success(`${s.name} deleted successfully`);
                                            } catch (err) {
                                                console.error('Failed to delete staff:', err);
                                                toast.error('Failed to delete staff member');
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Lazy Loading Indicator */}
            <div ref={loaderRef} className="flex justify-center py-4">
                {isLoading && <Spinner size="sm" color="primary" />}
                {!hasMore && filteredItems.length > ITEMS_PER_LOAD && (
                    <span className="text-default-400 text-sm">All {filteredItems.length} staff members loaded</span>
                )}
            </div>
        </div>
    );
}
