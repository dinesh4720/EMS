import { useState, useMemo, useEffect } from "react";
import { useEntityFetch } from "../../hooks/useEntityFetch";
import {
    Table, TableHeader, TableColumn, TableBody, Spinner,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
} from "@heroui/react";
import { ArrowUpDown, X, ChevronDown, Download, AlertTriangle, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";
import FiltersDropdown from "../../components/FiltersDropdown";
import { STAFF_ROLES } from "../../constants/roles";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";
import SearchInput from "../../components/ui/SearchInput";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import { useTranslation } from "react-i18next";
import { getSocketService } from "../../services/socketServiceEnhanced.js";
import { exportToCSV, exportToPDF } from "./utils/staffExportUtils";
import { useStaffBulkActions } from "./hooks/useStaffBulkActions";
import StaffStatusFilter from "./components/StaffStatusFilter";
import StaffTableRow from "./components/StaffTableRow";
import StaffBulkActionsDropdown from "./components/StaffBulkActionsDropdown";

const ITEMS_PER_LOAD = 10;

function StaffListSkeleton() {
    return (
        <div className="w-full space-y-4" aria-busy="true" aria-live="polite">
            <div className="flex items-center gap-3 px-2 py-3">
                <Skeleton variant="rect" className="h-8 w-24" />
                <Skeleton variant="rect" className="h-9 flex-1 max-w-xs" />
                <Skeleton variant="rect" className="h-8 w-20" />
                <Skeleton variant="rect" className="h-8 w-20" />
            </div>
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
                    <Skeleton variant="rect" className="h-5 w-5 shrink-0" />
                    <Skeleton variant="text" className="h-3 w-16" style={{ minWidth: 240 }} />
                    <Skeleton variant="text" className="h-3 w-12" style={{ minWidth: 140 }} />
                    <Skeleton variant="text" className="h-3 w-20" style={{ minWidth: 140 }} />
                    <Skeleton variant="text" className="h-3 w-16" style={{ minWidth: 100 }} />
                    <Skeleton variant="text" className="h-3 w-14" style={{ minWidth: 120 }} />
                    <Skeleton variant="text" className="h-3 w-8" style={{ minWidth: 80 }} />
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-b-0"
                    >
                        <Skeleton variant="rect" className="h-5 w-5 shrink-0" />
                        <div className="flex items-center gap-3" style={{ minWidth: 240 }}>
                            <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
                            <div className="space-y-1.5">
                                <Skeleton variant="text" className="h-3.5" style={{ width: `${110 + (i % 3) * 30}px` }} />
                                <Skeleton variant="text" className="h-2.5 w-16" />
                            </div>
                        </div>
                        <div style={{ minWidth: 140 }}>
                            <Skeleton variant="rect" className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="space-y-1.5" style={{ minWidth: 140 }}>
                            <Skeleton variant="text" className="h-3.5 w-28" />
                            <Skeleton variant="text" className="h-2.5 w-24" />
                        </div>
                        <div className="space-y-1" style={{ minWidth: 100 }}>
                            <Skeleton variant="rect" className="h-2 w-full rounded-full" />
                            <Skeleton variant="text" className="h-2.5 w-8" />
                        </div>
                        <div style={{ minWidth: 120 }}>
                            <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
                        </div>
                        <div style={{ minWidth: 80 }}>
                            <Skeleton variant="rect" className="h-7 w-7" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Hoisted so it's not recreated on each render
const TABLE_CLASSNAMES = {
    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12 [&>tr>th:first-child]:sticky [&>tr>th:first-child]:left-0 [&>tr>th:first-child]:z-20 [&>tr>th:first-child]:bg-white [&>tr>th:first-child]:dark:bg-zinc-950 [&>tr>th:nth-child(2)]:sticky [&>tr>th:nth-child(2)]:left-12 [&>tr>th:nth-child(2)]:z-20 [&>tr>th:nth-child(2)]:bg-white [&>tr>th:nth-child(2)]:dark:bg-zinc-950",
    th: "bg-white dark:bg-zinc-950 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-gray-200 dark:border-zinc-800 last:pr-6 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors first:hover:bg-transparent select-none",
    td: "py-5 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 group-data-[last=true]:border-none last:pr-6 select-text transition-colors group-hover:bg-gray-50 dark:group-hover:bg-zinc-900/50",
    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr>td:first-child]:sticky [&>tr>td:first-child]:left-0 [&>tr>td:first-child]:z-20 [&>tr>td:first-child]:bg-white [&>tr>td:first-child]:dark:bg-zinc-950 [&>tr>td:nth-child(2)]:sticky [&>tr>td:nth-child(2)]:left-12 [&>tr>td:nth-child(2)]:z-20 [&>tr>td:nth-child(2)]:bg-white [&>tr>td:nth-child(2)]:dark:bg-zinc-950 [&>tr:hover>td:first-child]:!bg-gray-50 dark:[&>tr:hover>td:first-child]:!bg-zinc-900/50 [&>tr:hover>td:nth-child(2)]:!bg-gray-50 dark:[&>tr:hover>td:nth-child(2)]:!bg-zinc-900/50 [&>tr[data-selected=true]>td]:bg-primary-50 [&>tr[data-selected=true]>td]:dark:bg-primary-950/30 [&>tr[data-selected=true]>td:first-child]:bg-primary-50 [&>tr[data-selected=true]>td:first-child]:dark:bg-primary-950/30 [&>tr[data-selected=true]>td:nth-child(2)]:bg-primary-50 [&>tr[data-selected=true]>td:nth-child(2)]:dark:bg-primary-950/30",
    tr: "group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900/50 data-[selected=true]:bg-primary-50 dark:data-[selected=true]:bg-primary-950/30",
};

export default function StaffList({ onStaffClick, onStaffEdit }) {
    const { t } = useTranslation();
    const { staff, deleteStaff, updateStaff, updateStaffLocal, staffAttendance, loading: contextLoading, error: contextError } = useApp();
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });
    const [selectedStaff, setSelectedStaff] = useState(new Set());
    const [openDropdowns, setOpenDropdowns] = useState({
        status: false,
        bulk: false,
        export: false,
        role: false,
        sort: false,
    });

    const [columnWidths] = useState({
        name: 260,
        role: 140,
        contact: 140,
        attendance: 100,
        status: 120,
        actions: 80,
    });

    const roles = STAFF_ROLES;
    const statusOptions = ["active", "inactive", "on-leave", "suspended", "terminated"];
    const departmentOptions = [
        "Academic", "Science", "Mathematics", "Languages", "Social Studies",
        "Arts", "Sports", "Administration", "Accounts", "IT", "Library",
        "Transport", "Maintenance", "Others",
    ];

    // ── Counts ───────────────────────────────────────────────────────────────
    const getRoleCounts = () => {
        const counts = { all: staff.length };
        roles.forEach((role) => {
            counts[role] = staff.filter((s) => {
                const staffRoles = Array.isArray(s.role) ? s.role : [s.role];
                return staffRoles.includes(role);
            }).length;
        });
        return counts;
    };

    const statusCounts = useMemo(() => ({
        all: staff.length,
        active: staff.filter((s) => s.status === "active").length,
        inactive: staff.filter((s) => s.status === "inactive").length,
        "on-leave": staff.filter((s) => s.status === "on-leave").length,
        suspended: staff.filter((s) => s.status === "suspended").length,
        terminated: staff.filter((s) => s.status === "terminated").length,
    }), [staff]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (roleFilter !== "all") count++;
        if (statusFilter !== "active") count++;
        if (departmentFilter !== "all") count++;
        if (searchQuery) count++;
        return count;
    }, [roleFilter, statusFilter, departmentFilter, searchQuery]);

    // ── Filters config ───────────────────────────────────────────────────────
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
                "lab assistant": "Lab Assistant",
            },
        },
        status: {
            label: "Status",
            value: statusFilter,
            options: ["all", ...statusOptions],
            counts: statusCounts,
            displayLabels: {
                all: "All Status",
                active: "Active",
                inactive: "Inactive",
                "on-leave": "On Leave",
                suspended: "Suspended",
                terminated: "Terminated",
            },
        },
        department: {
            label: "Department",
            value: departmentFilter,
            options: ["all", ...departmentOptions],
            counts: (() => {
                const counts = { all: staff.length };
                departmentOptions.forEach((dept) => {
                    counts[dept] = staff.filter((s) => s.department === dept).length;
                });
                return counts;
            })(),
            displayLabels: departmentOptions.reduce(
                (acc, dept) => { acc[dept] = dept; return acc; },
                { all: "All Departments" }
            ),
        },
    }), [roleFilter, statusFilter, departmentFilter, staff, roles, statusOptions, statusCounts]);

    const filterPresets = [
        {
            id: "active-teachers",
            label: "Active Teachers",
            filters: { role: "Teacher", status: "active" },
            applied: roleFilter === "Teacher" && statusFilter === "active",
        },
        {
            id: "all-active",
            label: "All Active Staff",
            filters: { role: "all", status: "active" },
            applied: statusFilter === "active" && roleFilter === "all",
        },
        {
            id: "admins",
            label: "Admin Staff",
            filters: { role: "Admin", status: "all" },
            applied: roleFilter === "Admin",
        },
    ];

    // ── Attendance helper ────────────────────────────────────────────────────
    const getAttendancePercentage = (staffId) => {
        const attendanceRecordsObj =
            staffAttendance && staffAttendance[staffId] ? staffAttendance[staffId] : {};
        const attendanceRecords = Object.values(attendanceRecordsObj);
        if (attendanceRecords.length === 0) return 0;
        const presentDays = attendanceRecords.filter(
            (r) => r.status?.toLowerCase() === "present"
        ).length;
        return Math.round((presentDays / attendanceRecords.length) * 100);
    };

    // ── Filtered + sorted items ──────────────────────────────────────────────
    const filteredItems = useMemo(() => {
        let filtered = [...staff];
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) =>
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
        if (departmentFilter !== "all") {
            filtered = filtered.filter((s) => s.department === departmentFilter);
        }
        return filtered.sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [staff, searchQuery, roleFilter, statusFilter, departmentFilter, sortDescriptor]);

    const { visibleItems, hasMore, isLoadingMore: isLoading, loaderRef } = useEntityFetch(
        filteredItems,
        [searchQuery, roleFilter, statusFilter, departmentFilter, sortDescriptor]
    );

    // ── Bulk actions hook ────────────────────────────────────────────────────
    const {
        deleteConfirm,
        bulkConfirm,
        selectedCount,
        handleBulkStatusChange,
        handleBulkRoleChange,
        confirmBulkAction,
        closeBulkConfirm,
        handleBulkDelete,
        handleSingleDelete,
        confirmDelete,
        closeDeleteConfirm,
    } = useStaffBulkActions({
        selectedStaff,
        setSelectedStaff,
        filteredItems,
        staff,
        updateStaff,
        deleteStaff,
    });

    // ── Real-time socket updates ─────────────────────────────────────────────
    useEffect(() => {
        const socketService = getSocketService();
        if (!socketService?.isConnected()) return;

        const handleStaffUpdate = (data) => {
            updateStaffLocal(data.staffId, {
                name: data.name,
                role: data.role,
                status: data.status,
                phone: data.phone,
                email: data.email,
                picture: data.picture,
            });
            toast.success(`${data.name}'s profile was updated`, { duration: 3000, icon: "🔄" });
        };

        socketService.on("staff_updated", handleStaffUpdate);
        return () => socketService.off("staff_updated", handleStaffUpdate);
    }, [updateStaffLocal]);

    // ── Status helpers ───────────────────────────────────────────────────────
    const handleStatusChange = async (staffId, newStatus) => {
        try {
            await updateStaff(staffId, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch {
            toast.error(t("toast.error.failedToUpdateStatus"));
        }
    };

    const clearAllFilters = () => {
        setRoleFilter("all");
        setStatusFilter("all");
        setDepartmentFilter("all");
        setSearchQuery("");
        toast.success(t("toast.success.allFiltersCleared"));
    };

    const handleFilterChange = (filterKey, value) => {
        if (filterKey === "role") setRoleFilter(value);
        else if (filterKey === "status") setStatusFilter(value);
        else if (filterKey === "department") setDepartmentFilter(value);
    };

    const handlePresetClick = (preset) => {
        const { filters } = preset;
        setRoleFilter(filters.role);
        setStatusFilter(filters.status);
        if (filters.department) setDepartmentFilter(filters.department);
        toast.success(`Applied preset: ${preset.label}`);
    };

    const exportSuccessMsg = t("toast.success.staffListExportedSuccessfully");

    if (contextLoading && staff.length === 0) {
        return <StaffListSkeleton />;
    }

    if (contextError && staff.length === 0) {
        return (
            <ErrorState
                size="lg"
                title={t("pages.failedToLoadStaff", "Failed to load staff")}
                error={contextError}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (!contextLoading && staff.length === 0) {
        return (
            <EmptyState
                size="lg"
                icon={Users}
                title={t("pages.noStaffYet", "No staff members yet")}
                description={t("pages.noStaffYetDescription", "Add your first staff member to start managing your team.")}
            />
        );
    }

    return (
        <div className="w-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 py-4 -mx-6 -mt-6 px-6">
                {/* Left Side - Status Filter & Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <StaffStatusFilter
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        statusCounts={statusCounts}
                        isOpen={openDropdowns.status}
                        onOpenChange={(isOpen) => setOpenDropdowns((prev) => ({ ...prev, status: isOpen }))}
                    />

                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        name="staff-search-query"
                        placeholder={t("pages.searchByNameEmailOrId")}
                        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                        className="w-full sm:max-w-[280px] px-3 py-2.5 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-teal-500 hover:bg-gray-50 dark:hover:bg-zinc-900 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all duration-200"
                    />
                </div>

                {/* Right Side - Filters & Actions */}
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <FiltersDropdown
                        filters={filtersConfig}
                        onFilterChange={handleFilterChange}
                        onClearAll={clearAllFilters}
                        onApply={() => {}}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activeFiltersCount={activeFiltersCount}
                        presets={filterPresets}
                        onPresetClick={handlePresetClick}
                    />

                    {/* Bulk Actions */}
                    <StaffBulkActionsDropdown
                        selectedCount={selectedCount}
                        roles={roles}
                        isOpen={openDropdowns.bulk}
                        onOpenChange={(isOpen) => setOpenDropdowns((prev) => ({ ...prev, bulk: isOpen }))}
                        onBulkStatusChange={handleBulkStatusChange}
                        onBulkRoleChange={handleBulkRoleChange}
                        onBulkDelete={handleBulkDelete}
                    />

                    {/* Export */}
                    <Dropdown
                        isOpen={openDropdowns.export}
                        onOpenChange={(isOpen) => setOpenDropdowns((prev) => ({ ...prev, export: isOpen }))}
                    >
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                <Download size={16} className="text-default-400" />
                                <span>{t("pages.export1")}</span>
                                <ChevronDown size={14} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label={t("aria.menus.exportOptions")} className="max-h-[400px] overflow-y-auto">
                            <DropdownItem key="csv" onPress={() => exportToCSV(filteredItems, getAttendancePercentage, exportSuccessMsg)}>
                                Export as CSV
                            </DropdownItem>
                            <DropdownItem key="pdf" onPress={() => exportToPDF(filteredItems, exportSuccessMsg)}>
                                Export as PDF
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Clear Filters */}
                    {(roleFilter !== "all" || statusFilter !== "active" || departmentFilter !== "all" || searchQuery) && (
                        <button
                            onClick={clearAllFilters}
                            className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-danger hover:bg-danger-50 transition-all duration-200 cursor-pointer group"
                            title={t("pages.clearAllFilters")}
                        >
                            <X size={16} className="text-default-400 group-hover:text-danger" />
                        </button>
                    )}

                    {/* Sort */}
                    <Dropdown
                        isOpen={openDropdowns.sort}
                        onOpenChange={(isOpen) => setOpenDropdowns((prev) => ({ ...prev, sort: isOpen }))}
                    >
                        <DropdownTrigger>
                            <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer" aria-label={t("aria.buttons.sort")}>
                                <ArrowUpDown size={16} className="text-default-400" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t("aria.menus.sortOptions")}
                            className="max-h-[400px] overflow-y-auto"
                            disallowEmptySelection
                            selectionMode="single"
                            selectedKeys={new Set([sortDescriptor.column])}
                            onSelectionChange={(keys) => {
                                setSortDescriptor({ column: Array.from(keys)[0], direction: sortDescriptor.direction });
                                setOpenDropdowns((prev) => ({ ...prev, sort: false }));
                            }}
                        >
                            <DropdownItem key="name">{t("pages.name1")}</DropdownItem>
                            <DropdownItem key="role">{t("pages.role1")}</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            {/* Table */}
            <Table
                aria-label={t("aria.tables.allStaff")}
                selectionMode="multiple"
                selectedKeys={selectedStaff}
                onSelectionChange={setSelectedStaff}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                removeWrapper
                radius="none"
                onClick={() => setOpenDropdowns({ status: false, bulk: false, export: false, role: false, sort: false })}
                classNames={TABLE_CLASSNAMES}
            >
                <TableHeader>
                    <TableColumn key="name" allowsSorting style={{ width: columnWidths.name }} scope="col">{t("pages.sTAFFName")}</TableColumn>
                    <TableColumn key="role" allowsSorting style={{ width: columnWidths.role }} scope="col">{t("pages.rOLE")}</TableColumn>
                    <TableColumn key="contact" style={{ width: columnWidths.contact }} scope="col">{t("pages.cONTACTInfo")}</TableColumn>
                    <TableColumn key="attendance" style={{ width: columnWidths.attendance }} scope="col">ATTENDANCE %</TableColumn>
                    <TableColumn key="status" style={{ width: columnWidths.status }} scope="col">{t("pages.sTATUS")}</TableColumn>
                    <TableColumn key="actions" align="end" style={{ width: columnWidths.actions }} scope="col">{t("pages.aCTIONS")}</TableColumn>
                </TableHeader>
                <TableBody
                    items={visibleItems}
                    emptyContent={
                        <EmptyState
                            size="md"
                            icon={Users}
                            title={t("pages.noStaffMatchFilters", "No staff match these filters")}
                            description={t("pages.tryAdjustingFilters", "Try clearing filters or adjusting your search.")}
                        />
                    }
                >
                    {(s) => (
                        <StaffTableRow
                            key={s.id}
                            s={s}
                            onStaffClick={onStaffClick}
                            onStaffEdit={onStaffEdit}
                            onStatusChange={handleStatusChange}
                            onDelete={handleSingleDelete}
                            getAttendancePercentage={getAttendancePercentage}
                        />
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

            {/* Bulk Status/Role Change Confirmation Modal */}
            <Modal
                isOpen={bulkConfirm.isOpen}
                onClose={closeBulkConfirm}
                size="sm"
                title={`Confirm Bulk ${bulkConfirm.type === "status" ? "Status" : "Role"} Change`}
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={closeBulkConfirm}
                            disabled={bulkConfirm.isProcessing}
                        >
                            {t("pages.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={confirmBulkAction}
                            loading={bulkConfirm.isProcessing}
                        >
                            Confirm
                        </Button>
                    </>
                }
            >
                <div className="text-sm text-gray-600 dark:text-zinc-400">
                    <p className="mb-2">
                        Change {bulkConfirm.type} to <strong className="capitalize">{bulkConfirm.value}</strong> for <strong>{bulkConfirm.ids.length}</strong> staff member{bulkConfirm.ids.length !== 1 ? "s" : ""}?
                    </p>
                    <ul className="list-disc pl-5 max-h-32 overflow-y-auto space-y-1">
                        {bulkConfirm.names.slice(0, 10).map((name, idx) => <li key={idx}>{name}</li>)}
                        {bulkConfirm.names.length > 10 && <li className="text-gray-400">...and {bulkConfirm.names.length - 10} more</li>}
                    </ul>
                    {bulkConfirm.selfAdminWarning && (
                        <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg flex gap-2">
                            <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-warning-800 dark:text-warning-200">
                                <strong>Warning:</strong> This will remove your own Admin role. You will lose access to admin-only features immediately once the page refreshes.
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={closeDeleteConfirm}
                onConfirm={confirmDelete}
                title={t("pages.confirmDeletion", "Confirm Deletion")}
                message={
                    deleteConfirm.staffIds.length === 1
                        ? `Are you sure you want to delete ${deleteConfirm.staffNames[0]}? This action cannot be easily undone.`
                        : `Are you sure you want to delete ${deleteConfirm.staffIds.length} staff members?`
                }
                confirmText={deleteConfirm.staffIds.length === 1 ? t("pages.delete", "Delete") : `Delete ${deleteConfirm.staffIds.length} Staff`}
                cancelText={t("pages.cancel", "Cancel")}
                variant="danger"
                isLoading={deleteConfirm.isDeleting}
            >
                <>
                    <div className="flex items-start gap-2 rounded-md bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 p-3 text-sm text-warning-700 dark:text-warning-400">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>Their timetable assignments and class teacher roles will be automatically removed.</span>
                    </div>
                    {deleteConfirm.staffIds.length > 1 && (
                        <ul className="mt-3 list-disc pl-5 max-h-32 overflow-y-auto space-y-1 text-sm text-gray-600 dark:text-zinc-400">
                            {deleteConfirm.staffNames.slice(0, 10).map((name, idx) => <li key={idx}>{name}</li>)}
                            {deleteConfirm.staffNames.length > 10 && <li className="text-gray-400">...and {deleteConfirm.staffNames.length - 10} more</li>}
                        </ul>
                    )}
                </>
            </ConfirmDialog>
        </div>
    );
}
