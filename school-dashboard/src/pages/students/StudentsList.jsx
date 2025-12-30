import { useState, useMemo, useEffect, useRef } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Spinner, Progress,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
    Select, SelectItem
} from "@heroui/react";
import { 
    Search, Filter, ArrowUpDown, MoreVertical, Eye, Edit, Trash2, X, ChevronDown, 
    Phone, Check, Download, Upload, UserX, FileOutput, 
    ArrowUpCircle, Users, Calendar
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import toast from "react-hot-toast";

const ITEMS_PER_LOAD = 15;
const academicYears = ["2024-25", "2025-26", "2023-24"];    

export default function StudentsList() {
    const navigate = useNavigate();
    const { students, deleteStudent, updateStudent, loading: contextLoading } = useApp();
    
    console.log('👥 StudentsList render:', { 
        contextLoading, 
        studentsCount: students.length,
        studentsData: students.slice(0, 3).map(s => ({ id: s.id, name: s.name }))
    });
    
    const [searchQuery, setSearchQuery] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [feeStatusFilter, setFeeStatusFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [academicYear, setAcademicYear] = useState("2024-25");
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [isLoading, setIsLoading] = useState(false);
    const loaderRef = useRef(null);
    const csvInputRef = useRef(null);
    const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));
    
    const { isOpen: isBulkActionOpen, onOpen: onBulkActionOpen, onClose: onBulkActionClose } = useDisclosure();
    const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
    const [bulkAction, setBulkAction] = useState("");
    const [promoteToClass, setPromoteToClass] = useState("");
    const [csvProcessing, setCsvProcessing] = useState(false);

    const uniqueClasses = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);
    const feeStatusOptions = ["paid", "pending", "overdue"];

    const statusCounts = useMemo(() => ({
        all: students.length,
        active: students.filter(s => s.status === "active").length,
        inactive: students.filter(s => s.status === "inactive").length,
        transferred: students.filter(s => s.status === "transferred").length,
        alumni: students.filter(s => s.status === "alumni").length,
    }), [students]);

    const getAttendancePercentage = (studentId) => 75 + ((studentId * 7) % 25);

    const filteredItems = useMemo(() => {
        let filtered = students;
        if (searchQuery) {
            const search = searchQuery.toLowerCase();
            filtered = filtered.filter((s) =>
                s.name.toLowerCase().includes(search) ||
                s.email?.toLowerCase().includes(search) ||
                s.admissionId?.toLowerCase().includes(search) ||
                s.parentName?.toLowerCase().includes(search) ||
                s.parentPhone?.includes(search)
            );
        }
        if (classFilter !== "all") filtered = filtered.filter((s) => s.class === classFilter);
        if (feeStatusFilter !== "all") filtered = filtered.filter((s) => s.feeStatus === feeStatusFilter);
        if (statusFilter !== "all") filtered = filtered.filter((s) => s.status === statusFilter);
        return filtered.sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [students, searchQuery, classFilter, feeStatusFilter, statusFilter, sortDescriptor]);

    const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);
    const hasMore = visibleCount < filteredItems.length;
    const selectedCount = selectedKeys === "all" ? filteredItems.length : selectedKeys.size;

    console.log('📊 Infinite scroll state:', { visibleCount, filteredLength: filteredItems.length, hasMore, isLoading });

    useEffect(() => { 
        setVisibleCount(ITEMS_PER_LOAD); 
        setIsLoading(false); // Reset loading when filters change
    }, [searchQuery, classFilter, feeStatusFilter, statusFilter, sortDescriptor]);

    useEffect(() => {
        // Force loading to false if no more items
        if (!hasMore) {
            console.log('🛑 No more items, clearing loading state');
            setIsLoading(false);
            return;
        }
        
        let timeoutId;
        const observer = new IntersectionObserver((entries) => {
            console.log('👁️ Intersection observer triggered:', { 
                isIntersecting: entries[0].isIntersecting, 
                hasMore
            });
            
            if (entries[0].isIntersecting && hasMore) {
                console.log('⏳ Loading more items...');
                setIsLoading(true);
                timeoutId = setTimeout(() => { 
                    setVisibleCount(prev => {
                        const newCount = prev + ITEMS_PER_LOAD;
                        console.log('✅ Loaded more items:', { prev, newCount });
                        return newCount;
                    }); 
                    setIsLoading(false); 
                }, 300);
            }
        }, { threshold: 0.1 });
        
        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }
        
        return () => { 
            if (timeoutId) clearTimeout(timeoutId); 
            observer.disconnect(); 
        };
    }, [hasMore]);

    const getFeeStatusStyle = (status) => {
        switch (status) {
            case "paid": return "bg-success-50 border-success-200 text-success-700";
            case "pending": return "bg-warning-50 border-warning-200 text-warning-700";
            case "overdue": return "bg-danger-50 border-danger-200 text-danger-700";
            default: return "bg-default-100 border-default-200 text-default-600";
        }
    };

    const getStatusDotColor = (status) => {
        switch (status) {
            case "active": return "bg-success-500";
            case "inactive": return "bg-danger-500";
            case "transferred": return "bg-warning-500";
            case "alumni": return "bg-purple-500";
            default: return "bg-default-400";
        }
    };

    const getAttendanceColor = (percentage) => percentage >= 90 ? "success" : percentage >= 75 ? "warning" : "danger";

    const handleBulkAction = (action) => {
        setBulkAction(action);
        if (action === "promote") onPromoteOpen();
        else onBulkActionOpen();
    };

    const executeBulkAction = async () => {
        const selectedIds = selectedKeys === "all" ? filteredItems.map(s => s.id) : Array.from(selectedKeys).map(id => parseInt(id));
        const count = selectedIds.length;
        try {
            for (const id of selectedIds) {
                if (bulkAction === "deactivate") await updateStudent(id, { status: "inactive" });
                else if (bulkAction === "transfer") await updateStudent(id, { status: "transferred" });
                else if (bulkAction === "tc") await updateStudent(id, { status: "transferred", tcIssued: true });
            }
            toast.success(`${count} student${count > 1 ? 's' : ''} updated successfully`);
            setSelectedKeys(new Set([]));
            onBulkActionClose();
        } catch (error) {
            toast.error('Failed to update students');
        }
    };

    const executePromotion = async () => {
        if (!promoteToClass) return;
        const selectedIds = selectedKeys === "all" ? filteredItems.map(s => s.id) : Array.from(selectedKeys).map(id => parseInt(id));
        const count = selectedIds.length;
        try {
            for (const id of selectedIds) await updateStudent(id, { class: promoteToClass });
            toast.success(`${count} student${count > 1 ? 's' : ''} promoted to ${promoteToClass}`);
            setSelectedKeys(new Set([]));
            setPromoteToClass("");
            onPromoteClose();
        } catch (error) {
            toast.error('Failed to promote students');
        }
    };

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCsvProcessing(true);
        try {
            const text = await file.text();
            const lines = text.split('\n');
            toast.success(`CSV processed! ${lines.length - 1} students imported`);
        } catch (error) {
            toast.error('Failed to process CSV file');
        } finally {
            setCsvProcessing(false);
            e.target.value = '';
        }
    };

    const downloadStudentList = () => {
        const headers = ['Admission ID', 'Name', 'Class', 'Parent Name', 'Parent Phone', 'Status', 'Fee Status', 'Attendance %'];
        const rows = filteredItems.map(s => [
            s.admissionId || `ADM${s.id}`, s.name, s.class, s.parentName || '', s.parentPhone || '', s.status, s.feeStatus, getAttendancePercentage(s.id) + '%'
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${academicYear}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Show loading spinner while context is loading data
    if (contextLoading) {
        return (
            <div className="w-full h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" color="primary" />
                    <p className="text-default-500">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 bg-background border-b border-default-200 py-4 -mx-6 -mt-6 px-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Dropdown placement="bottom-start">
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap capitalize">
                                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(statusFilter)}`}></span>
                                    <span>{statusFilter}</span>
                                    <span className="text-default-500">{statusCounts[statusFilter]}</span>
                                    <ChevronDown size={14} className="text-default-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Filter by status" onAction={(key) => setStatusFilter(key)}>
                                <DropdownItem key="all" startContent={statusFilter === "all" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>} endContent={<span className="text-default-400 text-xs">{statusCounts.all}</span>}>All Status</DropdownItem>
                                <DropdownItem key="active" startContent={statusFilter === "active" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>} endContent={<span className="text-default-400 text-xs">{statusCounts.active}</span>}><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success-500"></span>Active</span></DropdownItem>
                                <DropdownItem key="inactive" startContent={statusFilter === "inactive" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>} endContent={<span className="text-default-400 text-xs">{statusCounts.inactive}</span>}><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-danger-500"></span>Inactive</span></DropdownItem>
                                <DropdownItem key="transferred" startContent={statusFilter === "transferred" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>} endContent={<span className="text-default-400 text-xs">{statusCounts.transferred}</span>}><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning-500"></span>Transferred</span></DropdownItem>
                                <DropdownItem key="alumni" startContent={statusFilter === "alumni" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>} endContent={<span className="text-default-400 text-xs">{statusCounts.alumni}</span>}><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Alumni</span></DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                        <div className="flex items-center gap-2 w-full sm:max-w-[280px] px-3 py-2 bg-default-100 rounded-lg border border-default-200 hover:border-primary hover:bg-default-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                            <Search size={16} className="text-default-400" />
                            <input type="text" placeholder="Search by name, ID, parent..." className="flex-1 bg-transparent outline-none text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            {searchQuery && <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-default-200 rounded cursor-pointer"><X size={14} className="text-default-400" /></button>}
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap items-center">
                        <Dropdown>
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg border border-primary-200 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                    <Calendar size={14} className="text-primary" />
                                    <span className="text-primary-700 font-medium">{academicYear}</span>
                                    <ChevronDown size={14} className="text-primary-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Academic Year" onAction={(key) => setAcademicYear(key)}>
                                {academicYears.map(year => <DropdownItem key={year} startContent={academicYear === year ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>{year}</DropdownItem>)}
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                    <Filter size={16} className="text-default-400" />
                                    <span>{classFilter === "all" ? "Class" : classFilter}</span>
                                    <ChevronDown size={14} className="text-default-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Filter by class" disallowEmptySelection selectionMode="single" selectedKeys={new Set([classFilter])} onSelectionChange={(keys) => setClassFilter(Array.from(keys)[0])}>
                                <DropdownItem key="all">All Classes</DropdownItem>
                                {uniqueClasses.map((cls) => <DropdownItem key={cls}>{cls}</DropdownItem>)}
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                    <span>{feeStatusFilter === "all" ? "Fee Status" : feeStatusFilter}</span>
                                    <ChevronDown size={14} className="text-default-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Filter by fee status" disallowEmptySelection selectionMode="single" selectedKeys={new Set([feeStatusFilter])} onSelectionChange={(keys) => setFeeStatusFilter(Array.from(keys)[0])}>
                                <DropdownItem key="all">All Fee Status</DropdownItem>
                                {feeStatusOptions.map((status) => <DropdownItem key={status} className="capitalize">{status}</DropdownItem>)}
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger>
                                <button className="p-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer"><ArrowUpDown size={16} className="text-default-400" /></button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Sort options" disallowEmptySelection selectionMode="single" selectedKeys={new Set([sortDescriptor.column])} onSelectionChange={(keys) => setSortDescriptor({ column: Array.from(keys)[0], direction: sortDescriptor.direction })}>
                                <DropdownItem key="name">Name</DropdownItem>
                                <DropdownItem key="class">Class</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                            <>
                                <Chip size="sm" variant="flat" color="primary" className="px-3"><Users size={12} className="mr-1" /> {selectedCount} selected</Chip>
                                <Dropdown>
                                    <DropdownTrigger><Button size="sm" variant="flat" color="primary">Bulk Actions <ChevronDown size={14} /></Button></DropdownTrigger>
                                    <DropdownMenu aria-label="Bulk actions">
                                        <DropdownSection title="Status Actions">
                                            <DropdownItem key="tc" startContent={<FileOutput size={14} />} onPress={() => handleBulkAction("tc")}>Issue TC</DropdownItem>
                                            <DropdownItem key="deactivate" startContent={<UserX size={14} />} onPress={() => handleBulkAction("deactivate")}>Mark Inactive</DropdownItem>
                                            <DropdownItem key="transfer" startContent={<ArrowUpCircle size={14} />} onPress={() => handleBulkAction("transfer")}>Mark Transferred</DropdownItem>
                                        </DropdownSection>
                                        <DropdownSection title="Academic">
                                            <DropdownItem key="promote" startContent={<ArrowUpCircle size={14} />} onPress={() => handleBulkAction("promote")}>Promote to Next Class</DropdownItem>
                                        </DropdownSection>
                                    </DropdownMenu>
                                </Dropdown>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                        <Button size="sm" variant="flat" startContent={csvProcessing ? <Spinner size="sm" /> : <Upload size={14} />} onPress={() => csvInputRef.current?.click()} isDisabled={csvProcessing} title="Upload CSV to bulk add students">{csvProcessing ? "Processing..." : "Bulk Upload"}</Button>
                        <Button size="sm" variant="flat" startContent={<Download size={14} />} onPress={downloadStudentList} title="Download student list as CSV">Download List</Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Table aria-label="Students list table" selectionMode="multiple" selectedKeys={selectedKeys} onSelectionChange={setSelectedKeys} sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor} removeWrapper radius="none"
                classNames={{ base: "-mx-6 overflow-visible [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0", thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12", th: "bg-transparent text-default-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-default-200 last:pr-6 hover:bg-default-100 transition-colors cursor-pointer [&_svg]:text-default-300 [&:hover_svg]:text-default-500 [&_svg]:opacity-100 first:hover:bg-transparent first:cursor-default", td: "py-4 border-b border-default-200 group-data-[last=true]:border-none last:pr-6", tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr:first-child>td]:pt-4", tr: "" }}>
                <TableHeader>
                    <TableColumn key="name" allowsSorting style={{ width: 220 }}>STUDENT</TableColumn>
                    <TableColumn key="admissionId" style={{ width: 120 }}>ADMISSION ID</TableColumn>
                    <TableColumn key="class" allowsSorting style={{ width: 100 }}>CLASS</TableColumn>
                    <TableColumn style={{ width: 180 }}>PARENT INFO</TableColumn>
                    <TableColumn style={{ width: 100 }}>ATTENDANCE</TableColumn>
                    <TableColumn style={{ width: 100 }}>FEE STATUS</TableColumn>
                    <TableColumn align="end" style={{ width: 50 }}>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={visibleItems} emptyContent="No students found">
                    {(student) => {
                        const attendance = getAttendancePercentage(student.id);
                        return (
                            <TableRow key={student.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img src={`https://i.pravatar.cc/150?u=student${student.id}`} alt={student.name} className="w-9 h-9 rounded-full" />
                                        <div className="flex flex-col">
                                            <Link to={`/students/${student.id}`} className="text-default-900 font-medium text-sm hover:text-primary transition-colors cursor-pointer">{student.name}</Link>
                                            <span className="text-default-500 text-xs">{student.email || "No email"}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><span className="text-default-700 text-sm font-mono">{student.admissionId || `ADM${String(student.id).padStart(4, '0')}`}</span></TableCell>
                                <TableCell><Chip size="sm" variant="flat" color="primary" className="capitalize w-fit">{student.class}</Chip></TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-default-900 text-xs font-medium">{student.parentName || "Parent"}</span>
                                        <div className="flex items-center gap-1">
                                            <Phone size={12} className="text-default-400" />
                                            <span className="text-default-500 text-xs">{student.parentPhone || "N/A"}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-xs font-semibold text-${getAttendanceColor(attendance)}`}>{attendance}%</span>
                                        <Progress size="sm" value={attendance} color={getAttendanceColor(attendance)} className="max-w-[60px]" />
                                    </div>
                                </TableCell>
                                <TableCell><div className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium capitalize ${getFeeStatusStyle(student.feeStatus)}`}>{student.feeStatus}</div></TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button isIconOnly size="sm" variant="light" className="text-default-400"><MoreVertical size={18} /></Button>
                                            </DropdownTrigger>
                                            <DropdownMenu aria-label="Student actions">
                                                <DropdownItem key="view" startContent={<Eye size={14} />} onPress={() => navigate(`/students/${student.id}`)}>View Profile</DropdownItem>
                                                <DropdownItem key="edit" startContent={<Edit size={14} />} onPress={() => navigate(`/students/${student.id}`)}>Edit Details</DropdownItem>
                                                <DropdownItem 
                                                    key="delete" 
                                                    className="text-danger" 
                                                    color="danger" 
                                                    startContent={<Trash2 size={14} />} 
                                                    onPress={async () => {
                                                        try {
                                                            await deleteStudent(student.id);
                                                            toast.success(`${student.name} deleted successfully`);
                                                        } catch (error) {
                                                            toast.error('Failed to delete student');
                                                        }
                                                    }}
                                                >
                                                    Delete Student
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                </TableBody>
            </Table>

            <div ref={loaderRef} className="flex justify-center py-4">
                {isLoading && <Spinner size="sm" color="primary" />}
                {!hasMore && filteredItems.length > ITEMS_PER_LOAD && <span className="text-default-400 text-sm">All {filteredItems.length} students loaded</span>}
            </div>

            {/* Bulk Action Modal */}
            <Modal isOpen={isBulkActionOpen} onClose={onBulkActionClose}>
                <ModalContent>
                    <ModalHeader>Confirm Bulk Action</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to {bulkAction === "tc" ? "issue TC for" : bulkAction === "deactivate" ? "mark as inactive" : "mark as transferred"} {selectedCount} student(s)?</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onBulkActionClose}>Cancel</Button>
                        <Button color="primary" onPress={executeBulkAction}>Confirm</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Promote Modal */}
            <Modal isOpen={isPromoteOpen} onClose={onPromoteClose}>
                <ModalContent>
                    <ModalHeader>Promote Students</ModalHeader>
                    <ModalBody>
                        <p className="mb-4">Select the class to promote {selectedCount} student(s) to:</p>
                        <Select label="Promote to Class" placeholder="Select class" selectedKeys={promoteToClass ? [promoteToClass] : []} onSelectionChange={(keys) => setPromoteToClass(Array.from(keys)[0])}>
                            {uniqueClasses.map(cls => <SelectItem key={cls}>{cls}</SelectItem>)}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onPromoteClose}>Cancel</Button>
                        <Button color="primary" onPress={executePromotion} isDisabled={!promoteToClass}>Promote</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
