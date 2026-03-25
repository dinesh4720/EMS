import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Spinner, Avatar,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection
} from "@heroui/react";
import { Search, Filter, ArrowUpDown, Edit, Trash2, X, ChevronDown, Check, Download, Users, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PhotoAvatar from "../../components/PhotoAvatar";
import FiltersDropdown from "../../components/FiltersDropdown";
import { STAFF_ROLES } from "../../constants/roles";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";
import { useTranslation } from 'react-i18next';


const ITEMS_PER_LOAD = 10;

export default function StaffList({
  onStaffClick, onStaffEdit }) {
  const { t } = useTranslation();
    const { staff, deleteStaff, updateStaff, updateStaffLocal, staffAttendance } = useApp();
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [isLoading, setIsLoading] = useState(false);
    const loaderRef = useRef(null);
    const [sortDescriptor, setSortDescriptor] = useState({
        column: "name",
        direction: "ascending",
    });
    const [selectedStaff, setSelectedStaff] = useState(new Set());
    const [openDropdowns, setOpenDropdowns] = useState({
        status: false,
        bulk: false,
        export: false,
        role: false,
        sort: false
    });

    const [columnWidths] = useState({
        name: 260,
        role: 140,
        contact: 140,
        attendance: 100,
        status: 120,
        actions: 80
    });

    const roles = STAFF_ROLES; // Use centralized roles
    const statusOptions = ["active", "inactive"];

    // Calculate counts for filters
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

    // Get counts for each status (moved here to be used in filtersConfig)
    const statusCounts = useMemo(() => {
        return {
            all: staff.length,
            active: staff.filter(s => s.status === "active").length,
            inactive: staff.filter(s => s.status === "inactive").length,
        };
    }, [staff]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (roleFilter !== "all") count++;
        if (statusFilter !== "active") count++;
        if (searchQuery) count++;
        return count;
    }, [roleFilter, statusFilter, searchQuery]);

    // Filters configuration for FiltersPanel
    const filtersConfig = useMemo(() => ({
        role: {
            label: "Role",
            value: roleFilter,
            options: ["all", ...roles],
            counts: getRoleCounts(),
            displayLabels: {
                all: "All Roles",
                teacher: "Teacher",
                admin: "Admin",
                principal: "Principal",
                "vice principal": "Vice Principal",
                accountant: "Accountant",
                librarian: "Librarian",
                "lab assistant": "Lab Assistant"
            }
        },
        status: {
            label: "Status",
            value: statusFilter,
            options: ["all", ...statusOptions],
            counts: statusCounts,
            displayLabels: {
                all: "All Status",
                active: "Active",
                inactive: "Inactive"
            }
        }
    }), [roleFilter, statusFilter, staff, roles, statusOptions, statusCounts]);

    // Quick presets for common filter combinations
    const filterPresets = [
        {
            id: "active-teachers",
            label: "Active Teachers",
            filters: { role: "Teacher", status: "active" },
            applied: roleFilter === "Teacher" && statusFilter === "active"
        },
        {
            id: "all-active",
            label: "All Active Staff",
            filters: { role: "all", status: "active" },
            applied: statusFilter === "active" && roleFilter === "all"
        },
        {
            id: "admins",
            label: "Admin Staff",
            filters: { role: "Admin", status: "all" },
            applied: roleFilter === "Admin"
        }
    ];

    // Calculate attendance percentage for each staff
    const getAttendancePercentage = (staffId) => {
        // Get attendance records for this staff member
        const attendanceRecordsObj = staffAttendance && staffAttendance[staffId] ? staffAttendance[staffId] : {};

        // Convert object to array of records
        const attendanceRecords = Object.values(attendanceRecordsObj);

        if (attendanceRecords.length === 0) return 0;

        const presentDays = attendanceRecords.filter(r => r.status?.toLowerCase() === 'present').length;
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
            filtered = filtered.filter((s) => {
                const staffRoles = Array.isArray(s.role) ? s.role : [s.role];
                return staffRoles.includes(roleFilter);
            });
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
    }, [staff, searchQuery, roleFilter, statusFilter, sortDescriptor]);

    const visibleItems = useMemo(() => {
        return filteredItems.slice(0, visibleCount);
    }, [filteredItems, visibleCount]);

    const selectedCount = selectedStaff === "all" ? filteredItems.length : selectedStaff.size;

    const hasMore = visibleCount < filteredItems.length;

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_LOAD);
    }, [searchQuery, roleFilter, statusFilter, sortDescriptor]);

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
            return;
        }

        const handleStaffUpdate = (data) => {
            // Directly update the staff member in state without API call
            updateStaffLocal(data.staffId, {
                name: data.name,
                role: data.role,
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

        socketService.on('staff_updated', handleStaffUpdate);

        return () => {
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
            await updateStaff(staffId, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error(t('toast.error.failedToUpdateStatus'));
        }
    };

    // Clear all filters
    const clearAllFilters = () => {
        setRoleFilter("all");
        setStatusFilter("all");
        setSearchQuery("");
        toast.success(t('toast.success.allFiltersCleared'));
    };

    // Handle filter changes from FiltersPanel
    const handleFilterChange = (filterKey, value) => {
        switch (filterKey) {
            case "role":
                setRoleFilter(value);
                break;
            case "status":
                setStatusFilter(value);
                break;
            default:
                break;
        }
    };

    // Handle preset click
    const handlePresetClick = (preset) => {
        const { filters } = preset;
        setRoleFilter(filters.role);
        setStatusFilter(filters.status);
        toast.success(`Applied preset: ${preset.label}`);
    };

    // Export functions
    const exportToCSV = () => {
        const headers = ["Staff Name", "Employee ID", "Role", "Contact", "Email", "Status", "Attendance %"];
        const rows = filteredItems.map(s => [
            s.name,
            s.code,
            Array.isArray(s.role) ? s.role.join(', ') : s.role,
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
        toast.success(t('toast.success.staffListExportedSuccessfully'));
    };

    const exportToPDF = () => {
        const rows = filteredItems.map(s => `
          <tr>
            <td>${s.name || ''}</td>
            <td>${s.code || ''}</td>
            <td>${Array.isArray(s.role) ? s.role.join(', ') : (s.role || '')}</td>
            <td>${s.department || ''}</td>
            <td>${s.phone || 'N/A'}</td>
            <td>${s.email || ''}</td>
            <td>${s.status || ''}</td>
          </tr>`).join('');

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Staff List</title>
<style>
body{font-family:'Segoe UI',Arial,sans-serif;margin:40px;color:#111}
h1{font-size:20px;font-weight:700;margin-bottom:4px}
p{font-size:12px;color:#888;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f3f4f6;text-align:left;padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151}
td{padding:8px 12px;border:1px solid #e5e7eb}
tr:nth-child(even) td{background:#f9fafb}
@media print{body{margin:20px}}
</style></head>
<body>
<h1>Staff List</h1>
<p>Generated on ${new Date().toLocaleDateString()} — ${filteredItems.length} staff member(s)</p>
<table>
<thead><tr><th>Name</th><th>Code</th><th>Role</th><th>Department</th><th>Phone</th><th>Email</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;

        const w = window.open('', '_blank', 'width=1000,height=700');
        if (!w) { toast.error('Pop-up blocked. Allow pop-ups to export PDF.'); return; }
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 400);
        toast.success(t('toast.success.staffListExportedSuccessfully'));
    };

    // Bulk actions
    const getSelectedIds = () => {
        if (selectedStaff === "all") {
            return filteredItems.map(s => s.id);
        }
        return Array.from(selectedStaff);
    };

    const handleBulkStatusChange = async (newStatus) => {
        if (selectedCount === 0) return;

        const ids = getSelectedIds();
        const results = await Promise.allSettled(
            ids.map(staffId => updateStaff(staffId, { status: newStatus }))
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed === 0) {
            toast.success(`Status updated to ${newStatus} for ${selectedCount} staff members`);
        } else {
            toast.error(`${failed} of ${ids.length} updates failed`);
        }
        setSelectedStaff(new Set());
    };

    const handleBulkRoleChange = async (newRole) => {
        if (selectedCount === 0) return;

        const ids = getSelectedIds();
        const results = await Promise.allSettled(
            ids.map(staffId => updateStaff(staffId, { role: newRole }))
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed === 0) {
            toast.success(`Role updated to ${newRole} for ${selectedCount} staff members`);
        } else {
            toast.error(`${failed} of ${ids.length} updates failed`);
        }
        setSelectedStaff(new Set());
    };

    const handleBulkDelete = async () => {
        if (selectedCount === 0) return;

        if (!confirm(t('confirm.deleteBulkStaff', { count: selectedCount }))) {
            return;
        }

        const ids = getSelectedIds();
        const results = await Promise.allSettled(
            ids.map(staffId => deleteStaff(staffId))
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed === 0) {
            toast.success(`${selectedCount} staff members deleted successfully`);
        } else {
            toast.error(`${failed} of ${ids.length} deletions failed`);
        }
        setSelectedStaff(new Set());
    };

    return (
        <div className="w-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 py-4 -mx-6 -mt-6 px-6">
                {/* Left Side - Status Filter & Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Status Filter */}
                    <Dropdown
                        placement="bottom-start"
                        isOpen={openDropdowns.status}
                        onOpenChange={(isOpen) => {
                            setOpenDropdowns(prev => ({ ...prev, status: isOpen }));
                        }}
                    >
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-teal-500 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all duration-200 text-sm cursor-pointer whitespace-nowrap capitalize">
                                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(statusFilter)}`}></span>
                                <span className="text-gray-700 dark:text-zinc-300">{statusFilter}</span>
                                <span className="text-gray-500 dark:text-zinc-400">{statusCounts[statusFilter]}</span>
                                <ChevronDown size={14} className="text-gray-400 dark:text-zinc-500" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t('aria.menus.filterByStatus')}
                            className="max-h-[400px] overflow-y-auto"
                            onAction={(key) => {
                                setStatusFilter(key);
                                setOpenDropdowns(prev => ({ ...prev, status: false }));
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

                    <div className="flex items-center gap-2 w-full sm:max-w-[280px] px-3 py-2.5 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-teal-500 hover:bg-gray-50 dark:hover:bg-zinc-900 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all duration-200">
                        <Search size={16} className="text-gray-400 dark:text-zinc-500" />
                        <input
                            type="search"
                            name="staff-search-query"
                            placeholder={t('pages.searchByNameEmailOrId')}
                            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                            data-form-type="other"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded cursor-pointer">
                                <X size={14} className="text-gray-400 dark:text-zinc-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side - Filters & Actions */}
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    {/* Filters Dropdown */}
                    <FiltersDropdown
                        filters={filtersConfig}
                        onFilterChange={handleFilterChange}
                        onClearAll={clearAllFilters}
                        onApply={() => { }}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activeFiltersCount={activeFiltersCount}
                        presets={filterPresets}
                        onPresetClick={handlePresetClick}
                    />

                    {/* Bulk Actions */}
                    {selectedCount > 0 && (
                        <div className="relative">
                            <Dropdown
                                isOpen={openDropdowns.bulk}
                                onOpenChange={(isOpen) => {
                                    setOpenDropdowns(prev => ({ ...prev, bulk: isOpen }));
                                }}
                            >
                                <DropdownTrigger>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap text-default-900">
                                        <Users size={16} className="text-default-400" />
                                        <span>{t('pages.bulkActions1')}</span>
                                        <span className="text-default-500">({selectedCount})</span>
                                        <ChevronDown size={14} className="text-default-400" />
                                    </button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label={t('aria.menus.bulkActions')} className="max-h-[400px] overflow-y-auto relative">
                                    <DropdownSection title={t('pages.changeStatus1')} showDivider>
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
                                    <DropdownSection title={t('pages.changeRole')} showDivider>
                                        {roles.map((role) => (
                                            <DropdownItem
                                                key={`role-${role}`}
                                                onPress={() => handleBulkRoleChange(role)}
                                            >
                                                Set as {role}
                                            </DropdownItem>
                                        ))}
                                    </DropdownSection>
                                    <DropdownSection title={t('pages.actions1')}>
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
                        </div>
                    )}

                    {/* Export */}
                    <Dropdown
                        isOpen={openDropdowns.export}
                        onOpenChange={(isOpen) => {
                            setOpenDropdowns(prev => ({ ...prev, export: isOpen }));
                        }}
                    >
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                <Download size={16} className="text-default-400" />
                                <span>{t('pages.export1')}</span>
                                <ChevronDown size={14} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label={t('aria.menus.exportOptions')} className="max-h-[400px] overflow-y-auto">
                            <DropdownItem key="csv" onPress={exportToCSV}>
                                Export as CSV
                            </DropdownItem>
                            <DropdownItem key="pdf" onPress={exportToPDF}>
                                Export as PDF
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Clear Filters Button */}
                    {(roleFilter !== "all" || statusFilter !== "active" || searchQuery) && (
                        <button
                            onClick={clearAllFilters}
                            className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-danger hover:bg-danger-50 transition-all duration-200 cursor-pointer group"
                            title={t('pages.clearAllFilters')}
                        >
                            <X size={16} className="text-default-400 group-hover:text-danger" />
                        </button>
                    )}

                    {/* Sort */}
                    <Dropdown
                        isOpen={openDropdowns.sort}
                        onOpenChange={(isOpen) => {
                            setOpenDropdowns(prev => ({ ...prev, sort: isOpen }));
                        }}
                    >
                        <DropdownTrigger>
                            <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer" aria-label={t('aria.buttons.sort')}>
                                <ArrowUpDown size={16} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t('aria.menus.sortOptions')}
                            className="max-h-[400px] overflow-y-auto"
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={new Set([sortDescriptor.column])}
                            onSelectionChange={(keys) => {
                                setSortDescriptor({ column: Array.from(keys)[0], direction: sortDescriptor.direction });
                                setOpenDropdowns(prev => ({ ...prev, sort: false }));
                            }}
                        >
                            <DropdownItem key="name">{t('pages.name1')}</DropdownItem>
                            <DropdownItem key="role">{t('pages.role1')}</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            {/* Table */}
            <Table
                aria-label={t('aria.tables.allStaff')}
                selectionMode="multiple"
                selectedKeys={selectedStaff}
                onSelectionChange={setSelectedStaff}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                onRowAction={(key) => onStaffClick(key)} // Don't convert to number - MongoDB IDs are strings
                removeWrapper
                radius="none"
                onClick={() => {
                    // Close all dropdowns when clicking on the table
                    setOpenDropdowns({
                        status: false,
                        bulk: false,
                        export: false,
                        role: false,
                        sort: false
                    });
                }}
                classNames={{
                    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
                    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12 [&>tr>th:first-child]:sticky [&>tr>th:first-child]:left-0 [&>tr>th:first-child]:z-20 [&>tr>th:first-child]:bg-white [&>tr>th:first-child]:dark:bg-zinc-950 [&>tr>th:nth-child(2)]:sticky [&>tr>th:nth-child(2)]:left-12 [&>tr>th:nth-child(2)]:z-20 [&>tr>th:nth-child(2)]:bg-white [&>tr>th:nth-child(2)]:dark:bg-zinc-950",
                    th: "bg-transparent text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-gray-200 dark:border-zinc-800 last:pr-6 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors first:hover:bg-transparent select-none",
                    td: "py-5 border-b border-gray-200 dark:border-zinc-800 group-data-[last=true]:border-none last:pr-6 select-text transition-colors",
                    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr>td:first-child]:sticky [&>tr>td:first-child]:left-0 [&>tr>td:first-child]:z-20 [&>tr>td:first-child]:bg-white [&>tr>td:first-child]:dark:bg-zinc-950 [&>tr>td:nth-child(2)]:sticky [&>tr>td:nth-child(2)]:left-12 [&>tr>td:nth-child(2)]:z-20 [&>tr>td:nth-child(2)]:bg-white [&>tr>td:nth-child(2)]:dark:bg-zinc-950 [&>tr:hover>td:first-child]:bg-gray-50 [&>tr:hover>td:first-child]:dark:bg-zinc-900 [&>tr:hover>td:nth-child(2)]:bg-gray-50 [&>tr:hover>td:nth-child(2)]:dark:bg-zinc-900 [&>tr[data-selected=true]>td]:bg-primary-50 [&>tr[data-selected=true]>td:first-child]:bg-primary-50 [&>tr[data-selected=true]>td:nth-child(2)]:bg-primary-50",
                    tr: "group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900 data-[selected=true]:bg-primary-50"
                }}
            >
                <TableHeader>
                    <TableColumn key="name" allowsSorting style={{ width: columnWidths.name }} scope="col">{t('pages.sTAFFName')}</TableColumn>
                    <TableColumn key="role" allowsSorting style={{ width: columnWidths.role }} scope="col">{t('pages.rOLE')}</TableColumn>
                    <TableColumn key="contact" style={{ width: columnWidths.contact }} scope="col">{t('pages.cONTACTInfo')}</TableColumn>
                    <TableColumn key="attendance" style={{ width: columnWidths.attendance }} scope="col">ATTENDANCE %</TableColumn>
                    <TableColumn key="status" style={{ width: columnWidths.status }} scope="col">{t('pages.sTATUS')}</TableColumn>
                    <TableColumn key="actions" align="end" style={{ width: columnWidths.actions }} scope="col">{t('pages.aCTIONS')}</TableColumn>
                </TableHeader>
                <TableBody items={visibleItems} emptyContent="No staff members found">
                    {(s) => (
                        <TableRow
                            key={s.id}
                            onClick={(e) => {
                                // Don't navigate if clicking on interactive elements
                                if (e.target.closest("button") || e.target.closest("label") || e.target.closest("input") || e.target.closest("a")) return;

                                // Don't navigate if text is being selected
                                const selection = window.getSelection();
                                if (selection && selection.toString().length > 0) return;

                                onStaffClick(s.id);
                            }}
                        >
                            <TableCell key="name">
                                <div className="flex items-center gap-3">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <PhotoAvatar
                                            src={s.picture || s.photo}
                                            alt={s.name}
                                            name={s.name}
                                            size="md"
                                            type="staff"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <Link
                                            to={`/staffs/${s.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-gray-800 dark:text-zinc-200 font-medium text-base hover:text-teal-600 transition-colors cursor-pointer"
                                        >
                                            {s.name}
                                        </Link>
                                        <span className="text-gray-500 dark:text-zinc-400 text-xs">{s.code}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell key="role">
                                <div className="flex flex-wrap gap-1">
                                    {Array.isArray(s.role) ? (
                                        s.role.map((r, idx) => (
                                            <span key={r} className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs rounded-md capitalize">
                                                {r}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-800 dark:text-zinc-200 text-sm">{s.role}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell key="contact">
                                <div className="flex flex-col gap-1">
                                    <span className="text-gray-800 dark:text-zinc-200 text-xs">{s.phone || "N/A"}</span>
                                    <span className="text-gray-500 dark:text-zinc-400 text-xs">{s.email}</span>
                                </div>
                            </TableCell>
                            <TableCell key="attendance">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5 w-16">
                                        <div
                                            className="bg-teal-500 h-1.5 rounded-full transition-all"
                                            style={{ width: `${getAttendancePercentage(s.id)}%` }}
                                        />
                                    </div>
                                    <span className="text-gray-800 dark:text-zinc-200 text-xs font-medium min-w-[35px]">
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
                                            aria-label={t('aria.misc.changeStatus')}
                                            onAction={(key) => handleStatusChange(s.id, key)}
                                        >
                                            <DropdownItem key="active">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                                    Active
                                                </span>
                                            </DropdownItem>
                                            <DropdownItem key="inactive">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
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
                                        className="text-gray-400 dark:text-zinc-500 hover:text-teal-600"
                                        onPress={() => onStaffEdit ? onStaffEdit(s.id) : onStaffClick(s.id)}
                                    >
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="text-gray-400 dark:text-zinc-500 hover:text-red-600"
                                        onPress={async () => {
                                            try {
                                                await deleteStaff(s.id);
                                                toast.success(`${s.name} deleted successfully`);
                                            } catch (err) {
                                                console.error('Failed to delete staff:', err);
                                                toast.error(t('toast.error.failedToDeleteStaffMember'));
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
            <ScrollToTopButton />
        </div>
    );
}
