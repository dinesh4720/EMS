import { useState, useMemo, useEffect, useRef } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Spinner,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import { Search, Filter, ArrowUpDown, MoreVertical, Eye, Edit, Trash2, X, ChevronDown, Check } from "lucide-react";
import { useApp } from "../../context/AppContext";

const ITEMS_PER_LOAD = 10;

export default function StaffList({ onStaffClick }) {
    const { staff, deleteStaff } = useApp();
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

    const [columnWidths] = useState({
        name: 280,
        role: 150,
        department: 140,
        contact: 120,
        status: 100,
        actions: 50
    });

    const roles = ["Teacher", "Admin", "Accountant", "Librarian", "Lab Assistant"];
    const departments = [...new Set(staff.map(s => s.department))];
    const statusOptions = ["active", "inactive", "transferred"];

    // Get counts for each status
    const statusCounts = useMemo(() => {
        return {
            all: staff.length,
            active: staff.filter(s => s.status === "active").length,
            inactive: staff.filter(s => s.status === "inactive").length,
            transferred: staff.filter(s => s.status === "transferred").length,
        };
    }, [staff]);

    const filteredItems = useMemo(() => {
        let filtered = [...staff];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter((s) =>
                s.name.toLowerCase().includes(lowerQuery) ||
                s.email.toLowerCase().includes(lowerQuery)
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
            case "transferred": return "bg-warning-500";
            default: return "bg-default-400";
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
                            onAction={(key) => setStatusFilter(key)}
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
                            <DropdownItem 
                                key="transferred" 
                                startContent={statusFilter === "transferred" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}
                                endContent={<span className="text-default-400 text-xs">{statusCounts.transferred}</span>}
                                className="capitalize"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-warning-500"></span>
                                    Transferred
                                </span>
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

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
                </div>

                {/* Right Side - Filters & Actions */}
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
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
                            onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0])}
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
                            onSelectionChange={(keys) => setDeptFilter(Array.from(keys)[0])}
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
                aria-label="Staff list table"
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                removeWrapper
                radius="none"
                classNames={{
                    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
                    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3",
                    th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default",
                    td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6",
                    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr:first-child>td]:pt-5",
                    tr: "",
                }}
            >
                <TableHeader>
                    <TableColumn key="name" allowsSorting style={{ width: columnWidths.name }}>STAFF MEMBER</TableColumn>
                    <TableColumn key="role" allowsSorting style={{ width: columnWidths.role }}>ROLE</TableColumn>
                    <TableColumn key="department" allowsSorting style={{ width: columnWidths.department }}>DEPARTMENT</TableColumn>
                    <TableColumn key="status" style={{ width: columnWidths.status }}>STATUS</TableColumn>
                    <TableColumn align="end" style={{ width: columnWidths.actions }}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={visibleItems} emptyContent="No staff members found">
                    {(s) => (
                        <TableRow key={s.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={`https://i.pravatar.cc/150?u=${s.id}`} 
                                        alt={s.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="flex flex-col">
                                        <span 
                                            className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer"
                                            onClick={() => onStaffClick(s.id)}
                                        >
                                            {s.name}
                                        </span>
                                        <span className="text-default-500 text-xs">{s.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-default-900 text-sm">{s.role}</span>
                                    <span className="text-default-500 text-xs">{s.code}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Chip size="sm" variant="flat" color="secondary" className="capitalize">
                                    {s.department}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${getStatusStyle(s.status)}`}>
                                    <span className="capitalize">{s.status}</span>
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
                                        <DropdownMenu aria-label="Staff actions">
                                            <DropdownItem
                                                key="view"
                                                startContent={<Eye size={14} />}
                                                onPress={() => onStaffClick(s.id)}
                                            >
                                                View Profile
                                            </DropdownItem>
                                            <DropdownItem
                                                key="edit"
                                                startContent={<Edit size={14} />}
                                                onPress={() => onStaffClick(s.id)}
                                            >
                                                Edit Details
                                            </DropdownItem>
                                            <DropdownItem
                                                key="delete"
                                                className="text-danger"
                                                color="danger"
                                                startContent={<Trash2 size={14} />}
                                                onPress={async () => {
                                                    try {
                                                        await deleteStaff(s.id);
                                                    } catch (err) {
                                                        console.error('Failed to delete staff:', err);
                                                    }
                                                }}
                                            >
                                                Delete Staff
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
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
