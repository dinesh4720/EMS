import { useState, useMemo } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
    Input, Divider, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import { Search, X, MoreVertical, Edit } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function StaffPayroll({ onStaffClick }) {
    const { staff, salarySettings, staffSalaries, updateStaffSalary } = useApp();
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editValues, setEditValues] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));

    const [columnWidths] = useState({
        name: 250,
        role: 150,
        gross: 150,
        deductions: 150,
        net: 150,
        actions: 50
    });

    // Helper to calculate totals for a single staff member
    const calculateTotals = (salaryData) => {
        if (!salaryData) return { totalEarnings: 0, totalDeductions: 0, netSalary: 0 };

        let totalEarnings = 0;
        salarySettings.earnings.forEach(item => {
            totalEarnings += Number(salaryData[item.id] || 0);
        });

        let totalDeductions = 0;
        salarySettings.deductions.forEach(item => {
            totalDeductions += Number(salaryData[item.id] || 0);
        });

        return { totalEarnings, totalDeductions, netSalary: totalEarnings - totalDeductions };
    };

    // Prepare table data
    const payrollData = useMemo(() => {
        let result = staff.filter(s => s.status === 'active').map(s => {
            const salary = staffSalaries[s.id] || {};
            const { totalEarnings, totalDeductions, netSalary } = calculateTotals(salary);
            return {
                ...s,
                salary,
                totalEarnings,
                totalDeductions,
                netSalary
            };
        });

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(lowerQuery) ||
                s.role.toLowerCase().includes(lowerQuery)
            );
        }

        return result;
    }, [staff, staffSalaries, salarySettings, searchQuery]);

    const handleEditClick = (staffMember) => {
        setSelectedStaffId(staffMember.id);
        setEditValues(staffSalaries[staffMember.id] || {});
        setIsDrawerOpen(true);
    };

    const handleSaveSalary = () => {
        if (selectedStaffId) {
            updateStaffSalary(selectedStaffId, editValues);
            setIsDrawerOpen(false);
        }
    };

    // Drawer Calculations
    const drawerTotals = calculateTotals(editValues);

    return (
        <div className="w-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
                {/* Left Side - Search */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
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

                {/* Right Side - Count */}
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <span className="text-sm text-default-500">{payrollData.length} staff members</span>
                </div>
            </div>

            {/* Table */}
            <Table
                aria-label="Staff Payroll Table"
                selectionMode="multiple"
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                removeWrapper
                radius="none"
                classNames={{
                    base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0",
                    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12",
                    th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default",
                    td: "py-5 border-b border-default-200 group-data-[last=true]:border-none last:pr-6",
                    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-5",
                    tr: "",
                }}
            >
                <TableHeader>
                    <TableColumn style={{ width: columnWidths.name }}>STAFF MEMBER</TableColumn>
                    <TableColumn style={{ width: columnWidths.role }}>ROLE</TableColumn>
                    <TableColumn align="end" style={{ width: columnWidths.gross }}>GROSS SALARY</TableColumn>
                    <TableColumn align="end" style={{ width: columnWidths.deductions }}>DEDUCTIONS</TableColumn>
                    <TableColumn align="end" style={{ width: columnWidths.net }}>NET SALARY</TableColumn>
                    <TableColumn align="end" style={{ width: columnWidths.actions }}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No staff members found">
                    {payrollData.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={`https://i.pravatar.cc/150?u=${item.id}`}
                                        alt={item.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="flex flex-col">
                                        <span 
                                            className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer"
                                            onClick={() => onStaffClick && onStaffClick(item.id)}
                                        >
                                            {item.name}
                                        </span>
                                        <span className="text-default-500 text-xs">{item.code}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-default-600 text-sm">{item.role}</span>
                            </TableCell>
                            <TableCell>
                                <span className="text-success-600 text-sm font-medium">
                                    ₹{item.totalEarnings.toLocaleString()}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="text-danger-600 text-sm font-medium">
                                    ₹{item.totalDeductions.toLocaleString()}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="text-default-900 text-sm font-semibold">
                                    ₹{item.netSalary.toLocaleString()}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-end">
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button isIconOnly size="sm" variant="light" className="text-default-400">
                                                <MoreVertical size={18} />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu aria-label="Salary actions">
                                            <DropdownItem
                                                key="edit"
                                                startContent={<Edit size={14} />}
                                                onPress={() => handleEditClick(item)}
                                            >
                                                Edit Salary
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Salary Edit Drawer */}
            <Drawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} placement="right" size="md">
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="border-b border-default-100">
                                Salary Details
                            </DrawerHeader>
                            <DrawerBody className="py-4 space-y-6">
                                {/* Earnings Section */}
                                <div>
                                    <h4 className="text-sm font-semibold text-success-600 mb-3 flex items-center justify-between">
                                        <span>Gross Salary (CTC)</span>
                                        <span>₹{drawerTotals.totalEarnings.toLocaleString()}</span>
                                    </h4>
                                    <div className="space-y-3 bg-success-50/50 p-4 rounded-lg">
                                        {salarySettings.earnings.map(head => (
                                            <Input
                                                key={head.id}
                                                label={head.name}
                                                type="number"
                                                size="sm"
                                                variant="bordered"
                                                value={editValues[head.id] || 0}
                                                onValueChange={(val) => setEditValues(prev => ({ ...prev, [head.id]: Number(val) }))}
                                                startContent={<div className="pointer-events-none flex items-center"><span className="text-default-400 text-small">₹</span></div>}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <Divider />

                                {/* Deductions Section */}
                                <div>
                                    <h4 className="text-sm font-semibold text-danger-600 mb-3 flex items-center justify-between">
                                        <span>Deductions</span>
                                        <span>₹{drawerTotals.totalDeductions.toLocaleString()}</span>
                                    </h4>
                                    <div className="space-y-3 bg-danger-50/50 p-4 rounded-lg">
                                        {salarySettings.deductions.map(head => (
                                            <Input
                                                key={head.id}
                                                label={head.name}
                                                type="number"
                                                size="sm"
                                                variant="bordered"
                                                value={editValues[head.id] || 0}
                                                onValueChange={(val) => setEditValues(prev => ({ ...prev, [head.id]: Number(val) }))}
                                                startContent={<div className="pointer-events-none flex items-center"><span className="text-default-400 text-small">₹</span></div>}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </DrawerBody>
                            <DrawerFooter className="border-t border-default-100 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs text-default-500">Net Salary</span>
                                    <span className="text-xl font-bold">₹{drawerTotals.netSalary.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="light" onPress={onClose}>Cancel</Button>
                                    <Button color="primary" onPress={handleSaveSalary}>Save Changes</Button>
                                </div>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
