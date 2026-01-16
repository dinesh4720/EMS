import { useState, useEffect } from "react";
import { Card, CardBody, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Tabs, Tab } from "@heroui/react";
import { Plus, Trash2, Edit2, CheckCircle, AlertCircle, IndianRupee, Users, Settings, FileText } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { settingsApi } from "../../services/api";
import toast from "react-hot-toast";
import StaffPayroll from "../../pages/staffs/StaffPayroll";
import SalaryTemplates from "./SalaryTemplates";

function SalaryComponents() {
    const { salarySettings, updateSalarySettings } = useApp();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [modalType, setModalType] = useState("earnings");
    const [itemName, setItemName] = useState("");

    const handleOpenAdd = (type) => {
        setModalType(type);
        setItemName("");
        onOpen();
    };

    const handleAdd = () => {
        if (!itemName.trim()) return;
        updateSalarySettings(modalType, "add", { name: itemName });
        onClose();
    };

    const handleRemove = (type, id) => {
        updateSalarySettings(type, "remove", { id });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings Card */}
                <Card className="shadow-sm border border-default-200">
                    <CardBody className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-success-50 rounded-lg text-success">
                                    <IndianRupee size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Earnings Components</h3>
                                    <p className="text-xs text-default-500">Define salary additions</p>
                                </div>
                            </div>
                            <Button size="sm" color="success" variant="flat" startContent={<Plus size={16} />} onPress={() => handleOpenAdd("earnings")}>
                                Add Component
                            </Button>
                        </div>

                        <Table
                            aria-label="Earnings Table"
                            shadow="none"
                            radius="none"
                            isStriped={false}
                            removeWrapper
                            classNames={{
                                table: "w-full",
                                th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
                                td: "py-4 border-b border-default-100",
                                tr: "transition-opacity hover:bg-default-50/30",
                                wrapper: "p-0"
                            }}
                        >
                            <TableHeader>
                                <TableColumn>COMPONENT NAME</TableColumn>
                                <TableColumn width={80} align="center">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {salarySettings.earnings.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleRemove("earnings", item.id)} title="Remove Component">
                                                <Trash2 size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Deductions Card */}
                <Card className="shadow-sm border border-default-200">
                    <CardBody className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-danger-50 rounded-lg text-danger">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Deductions Components</h3>
                                    <p className="text-xs text-default-500">Define salary deductions</p>
                                </div>
                            </div>
                            <Button size="sm" color="danger" variant="flat" startContent={<Plus size={16} />} onPress={() => handleOpenAdd("deductions")}>
                                Add Component
                            </Button>
                        </div>

                        <Table
                            aria-label="Deductions Table"
                            shadow="none"
                            radius="none"
                            isStriped={false}
                            removeWrapper
                            classNames={{
                                table: "w-full",
                                th: "bg-transparent text-default-500 font-semibold text-xs uppercase tracking-wider h-12 border-b border-default-200",
                                td: "py-4 border-b border-default-100",
                                tr: "transition-opacity hover:bg-default-50/30",
                                wrapper: "p-0"
                            }}
                        >
                            <TableHeader>
                                <TableColumn>COMPONENT NAME</TableColumn>
                                <TableColumn width={80} align="center">ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {salarySettings.deductions.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleRemove("deductions", item.id)} title="Remove Component">
                                                <Trash2 size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>

            <Modal isOpen={isOpen} onClose={onClose} size="sm">
                <ModalContent>
                    <ModalHeader>Add {modalType === "earnings" ? "Earning" : "Deduction"} Component</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Component Name"
                            placeholder="e.g. Travel Allowance"
                            value={itemName}
                            onValueChange={setItemName}
                            variant="bordered"
                            autoFocus
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>Cancel</Button>
                        <Button color="primary" onPress={handleAdd}>Add</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}

function GeneralPayrollSettings() {
    const [disburseDate, setDisburseDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Fetch payroll settings on component mount
    useEffect(() => {
        const fetchPayrollSettings = async () => {
            try {
                const data = await settingsApi.getPayrollSettings();
                setDisburseDate(data.data?.disburseDate || "");
                setInitialLoad(false);
            } catch (error) {
                console.error('Failed to fetch payroll settings:', error);
                // Don't show toast on initial load to avoid spam
                setInitialLoad(false);
            }
        };

        fetchPayrollSettings();
    }, []);

    const handleSave = async () => {
        // Validate input
        if (!disburseDate || disburseDate < 1 || disburseDate > 31) {
            toast.error('Please enter a valid date between 1 and 31');
            return;
        }

        setLoading(true);
        try {
            await settingsApi.updatePayrollSettings({ disburseDate: parseInt(disburseDate) });
            toast.success('Payroll settings saved successfully');
        } catch (error) {
            console.error('Failed to save payroll settings:', error);
            toast.error(error.message || 'Failed to save payroll settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border border-default-200">
                <CardBody className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-50 rounded-lg text-primary">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Payroll Configuration</h3>
                            <p className="text-xs text-default-500">Configure general payroll settings</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-default-700">Payroll Disburse Date</label>
                            <p className="text-xs text-default-500">Day of the month when payroll is disbursed</p>
                            <Input
                                type="number"
                                label="Disburse Date"
                                placeholder="e.g. 1, 15, 30"
                                min="1"
                                max="31"
                                value={disburseDate}
                                onValueChange={setDisburseDate}
                                variant="bordered"
                                description="Enter a value between 1 and 31"
                                isDisabled={initialLoad}
                                endContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">day of month</span>
                                    </div>
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            color="primary"
                            onPress={handleSave}
                            isLoading={loading}
                            isDisabled={initialLoad || !disburseDate}
                        >
                            Save Settings
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

export default function PayrollSettings() {
    return (
        <div className="space-y-6 animate-fade-in">
            <Tabs
                size="md"
                variant="underlined"
                color="primary"
                classNames={{
                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-10",
                    tabContent: "group-data-[selected=true]:text-primary text-default-500 font-medium"
                }}
            >
                <Tab
                    key="general"
                    title={
                        <div className="flex items-center gap-2">
                            <Settings size={16} />
                            <span>General Settings</span>
                        </div>
                    }
                >
                    <div className="pt-2">
                        <GeneralPayrollSettings />
                    </div>
                </Tab>
                <Tab
                    key="salaries"
                    title={
                        <div className="flex items-center gap-2">
                            <Users size={16} />
                            <span>Staff Salaries (CTC)</span>
                        </div>
                    }
                >
                    <div className="pt-2">
                        <StaffPayroll />
                    </div>
                </Tab>
                <Tab
                    key="templates"
                    title={
                        <div className="flex items-center gap-2">
                            <FileText size={16} />
                            <span>Salary Templates</span>
                        </div>
                    }
                >
                    <div className="pt-2">
                        <SalaryTemplates />
                    </div>
                </Tab>
                <Tab
                    key="components"
                    title={
                        <div className="flex items-center gap-2">
                            <Settings size={16} />
                            <span>Salary Components</span>
                        </div>
                    }
                >
                    <div className="pt-2">
                        <SalaryComponents />
                    </div>
                </Tab>
            </Tabs>
        </div>
    );
}
