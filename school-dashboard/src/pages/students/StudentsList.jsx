import { useState, useMemo, useEffect, useRef } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Spinner, Progress,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
    Select, SelectItem, Checkbox, Textarea, Input, Tooltip
} from "@heroui/react";
import {
    Search, Filter, ArrowUpDown, MoreVertical, Eye, Edit, Trash2, X, ChevronDown,
    Phone, Check, Download, Upload, UserX, FileOutput, Pin, PinOff,
    ArrowUpCircle, Calendar, Columns3, MessageSquare, GraduationCap, FileText, AlertTriangle
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { studentsApi } from "../../services/api";
import toast from "react-hot-toast";
import TCGeneratorModal from "./TCGeneratorModal";

const ITEMS_PER_LOAD = 15;

// Define all available columns
const ALL_COLUMNS = [
    { key: "name", label: "Student", required: true },
    { key: "class", label: "Class", required: false },
    { key: "parentInfo", label: "Parent Info", required: false },
    { key: "attendance", label: "Attendance", required: false },
    { key: "academicPerformance", label: "Academic Performance", required: false },
    { key: "feeStatus", label: "Fee Status", required: false },
    { key: "actions", label: "Actions", required: true },
];


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
    const [academicYearFilter, setAcademicYearFilter] = useState("all");

    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
    const [isLoading, setIsLoading] = useState(false);
    const loaderRef = useRef(null);
    const csvInputRef = useRef(null);
    const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));

    // Phone number editing state
    const [editingPhoneId, setEditingPhoneId] = useState(null);
    const [phoneInput, setPhoneInput] = useState("");

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem("studentListColumns");
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
            localStorage.setItem("studentListColumns", JSON.stringify([...newSet]));
            return newSet;
        });
    };

    // Memoize visible columns array
    const visibleColumnsArray = useMemo(() =>
        ALL_COLUMNS.filter(col => visibleColumns.has(col.key)),
        [visibleColumns]
    );

    const { isOpen: isBulkActionOpen, onOpen: onBulkActionOpen, onClose: onBulkActionClose } = useDisclosure();
    const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
    const { isOpen: isReminderOpen, onOpen: onReminderOpen, onClose: onReminderClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isStatusChangeOpen, onOpen: onStatusChangeOpen, onClose: onStatusChangeClose } = useDisclosure();

    const [bulkAction, setBulkAction] = useState("");
    const [promoteToClass, setPromoteToClass] = useState("");
    const [csvProcessing, setCsvProcessing] = useState(false);
    const { isOpen: isTcModalOpen, onOpen: onTcModalOpen, onClose: onTcModalClose } = useDisclosure();
    const [tcStudents, setTcStudents] = useState([]);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [statusChangeData, setStatusChangeData] = useState({ student: null, newStatus: '', action: '' });

    // Fee Reminder State
    const [reminderMessage, setReminderMessage] = useState("");
    const [reminderTime, setReminderTime] = useState("");
    const [reminderTargetCount, setReminderTargetCount] = useState(0);

    const uniqueClasses = useMemo(() => [...new Set(students.map(s => s.class))].sort(), [students]);
    const uniqueAcademicYears = useMemo(() => [...new Set(students.map(s => s.academicYear || "2024-25"))].sort(), [students]);
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
        if (academicYearFilter !== "all") filtered = filtered.filter((s) => (s.academicYear || "2024-25") === academicYearFilter);
        return filtered.sort((a, b) => {
            // Pinned students always come first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // If both are pinned or both are not pinned, sort by pinnedAt (most recent first)
            if (a.isPinned && b.isPinned) {
                if (a.pinnedAt && b.pinnedAt) {
                    const dateA = new Date(a.pinnedAt).getTime();
                    const dateB = new Date(b.pinnedAt).getTime();
                    if (dateA !== dateB) return dateB - dateA;
                }
            }
            // Then apply the selected sort
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [students, searchQuery, classFilter, feeStatusFilter, statusFilter, academicYearFilter, sortDescriptor]);

    const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);
    const hasMore = visibleCount < filteredItems.length;
    const selectedCount = selectedKeys === "all" ? filteredItems.length : selectedKeys.size;

    console.log('📊 Infinite scroll state:', { visibleCount, filteredLength: filteredItems.length, hasMore, isLoading });

    useEffect(() => {
        setVisibleCount(ITEMS_PER_LOAD);
        setIsLoading(false); // Reset loading when filters change
    }, [searchQuery, classFilter, feeStatusFilter, statusFilter, academicYearFilter, sortDescriptor]);

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

    // Listen for real-time student updates via Socket.IO
    useEffect(() => {
        const socketService = window.socketService;
        if (!socketService) {
            console.log('⚠️ Socket service not available in StudentsList');
            return;
        }

        const handleStudentUpdate = (data) => {
            console.log('📢 StudentsList: Received student update:', data);
            toast.success(`${data.name}'s profile was updated`, {
                duration: 3000,
                icon: '🔄'
            });
        };

        socketService.on('student_updated', handleStudentUpdate);

        return () => {
            socketService.off('student_updated', handleStudentUpdate);
        };
    }, []);

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

    // Get academic performance grade
    const getAcademicGrade = (studentId) => {
        const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"];
        return grades[(studentId * 3) % grades.length];
    };

    const getGradeColor = (grade) => {
        if (!grade) return "default";
        if (grade.startsWith("A")) return "success";
        if (grade.startsWith("B")) return "primary";
        return "warning";
    };

    // Format phone number to XXX XXX XXXX
    const formatPhoneNumber = (phone) => {
        if (!phone) return "N/A";
        const cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        return phone;
    };

    const handleSavePhone = async (studentId) => {
        if (!phoneInput.trim()) {
            toast.error('Please enter a phone number');
            return;
        }
        try {
            await updateStudent(studentId, { parentPhone: phoneInput });
            toast.success('Phone number added successfully');
            setEditingPhoneId(null);
            setPhoneInput("");
        } catch (error) {
            toast.error('Failed to add phone number');
        }
    };

    const handlePinStudent = async (studentId) => {
        try {
            await studentsApi.pin(studentId);
            toast.success('Student pinned');
        } catch (error) {
            toast.error('Failed to pin student');
        }
    };

    const handleUnpinStudent = async (studentId) => {
        try {
            await studentsApi.unpin(studentId);
            toast.success('Student unpinned');
        } catch (error) {
            toast.error('Failed to unpin student');
        }
    };

    const handleBulkAction = (action) => {
        if (action === "message") {
            const selectedIds = selectedKeys === "all" ? filteredItems.map(s => s.id) : Array.from(selectedKeys);
            setReminderTargetCount(selectedIds.length);
            setReminderMessage("");
            const now = new Date();
            now.setHours(now.getHours() + 1);
            now.setMinutes(0);
            const localIsoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setReminderTime(localIsoString);
            onReminderOpen();
            return;
        }

        setBulkAction(action);
        if (action === "promote") onPromoteOpen();
        else if (action === "tc") {
            const selectedIds = selectedKeys === "all" ? filteredItems.map(s => s.id) : Array.from(selectedKeys);
            const selectedStudents = filteredItems.filter(s => selectedIds.includes(s.id.toString()));
            setTcStudents(selectedStudents);
            onTcModalOpen();
        }
        else onBulkActionOpen();
    };

    const executeBulkAction = async () => {
        const selectedIds = selectedKeys === "all" ? filteredItems.map(s => s.id) : Array.from(selectedKeys);
        const count = selectedIds.length;
        try {
            for (const id of selectedIds) {
                if (bulkAction === "deactivate") await updateStudent(id, { status: "inactive" });
                else if (bulkAction === "transfer") await updateStudent(id, { status: "transferred" });
                else if (bulkAction === "tc") await updateStudent(id, { status: "transferred", tcIssued: true });
                else if (bulkAction === "alumni") await updateStudent(id, { status: "alumni" });
            }
            toast.success(`${count} student${count > 1 ? 's' : ''} updated successfully`);
            setSelectedKeys(new Set([]));
            onBulkActionClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update students: ' + (error.message || 'Unknown error'));
        }
    };

    const executePromotion = async () => {
        if (!promoteToClass) return;
        const selectedIds = selectedKeys === "all" ? filteredItems.map(s => s.id) : Array.from(selectedKeys);
        const count = selectedIds.length;
        try {
            for (const id of selectedIds) {
                if (promoteToClass === "Passed Out / Alumni") {
                    await updateStudent(id, { status: "alumni", class: "Alumni" });
                } else {
                    await updateStudent(id, { class: promoteToClass });
                }
            }
            toast.success(`${count} student${count > 1 ? 's' : ''} promoted`);
            setSelectedKeys(new Set([]));
            setPromoteToClass("");
            onPromoteClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to promote students: ' + (error.message || 'Unknown error'));
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
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleBulkMessage = () => {
        const targetStudents = filteredItems;
        if (targetStudents.length === 0) {
            toast.error("No students in current list");
            return;
        }

        setReminderTargetCount(targetStudents.length);
        setReminderMessage("");

        // Default to next hour
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);
        // Format to YYYY-MM-DDTHH:MM for datetime-local input
        const localIsoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setReminderTime(localIsoString);

        onReminderOpen();
    };

    const executeSendReminders = () => {
        onReminderClose();
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1500)),
            {
                loading: `Scheduling messages for ${reminderTargetCount} parents...`,
                success: `Messages scheduled for ${new Date(reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                error: 'Failed to schedule messages'
            }
        );
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
            <div className="flex flex-col gap-4 bg-background border-b border-default-200 py-4 -mx-6 px-6">
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
                        {selectedCount > 1 && (
                            <>
                                <Chip size="sm" variant="flat" className="bg-default-100 text-default-600 px-2 h-9 rounded-lg border border-default-200"><span className="font-semibold text-default-900 mr-1">{selectedCount}</span> selected</Chip>
                                <Dropdown>
                                    <DropdownTrigger>
                                        <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                            <span>Bulk Actions</span>
                                            <ChevronDown size={14} className="text-default-400" />
                                        </button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Bulk actions">
                                        <DropdownSection title="Academic Actions">
                                            <DropdownItem key="promote" startContent={<ArrowUpCircle size={14} />} onPress={() => handleBulkAction("promote")}>
                                                Promote / Mark Passed Out
                                            </DropdownItem>
                                            <DropdownItem key="tc" startContent={<FileText size={14} />} onPress={() => handleBulkAction("tc")}>
                                                Generate TC
                                            </DropdownItem>
                                        </DropdownSection>
                                        <DropdownSection title="Status Updates">
                                            <DropdownItem key="deactivate" startContent={<UserX size={14} />} onPress={() => handleBulkAction("deactivate")}>
                                                Mark Inactive
                                            </DropdownItem>
                                            <DropdownItem key="transfer" startContent={<ArrowUpCircle size={14} className="rotate-90" />} onPress={() => handleBulkAction("transfer")}>
                                                Mark Transferred
                                            </DropdownItem>
                                            <DropdownItem key="alumni" startContent={<GraduationCap size={14} />} onPress={() => handleBulkAction("alumni")}>
                                                Mark as Alumni
                                            </DropdownItem>
                                        </DropdownSection>
                                        <DropdownSection title="Communication">
                                            <DropdownItem key="message" startContent={<MessageSquare size={14} />} onPress={() => handleBulkAction("message")}>
                                                Send Message to Parent
                                            </DropdownItem>
                                        </DropdownSection>
                                    </DropdownMenu>
                                </Dropdown>
                            </>
                        )}

                        <Dropdown>
                            <DropdownTrigger>
                                <button className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm cursor-pointer whitespace-nowrap ${(classFilter !== "all" || feeStatusFilter !== "all" || academicYearFilter !== "all") ? "bg-primary-50/50 border-primary text-primary" : "bg-transparent border-default-300 hover:border-primary text-default-700"}`}>
                                    <Filter size={16} className={(classFilter !== "all" || feeStatusFilter !== "all" || academicYearFilter !== "all") ? "text-primary" : "text-default-400"} />
                                    <span>Filters</span>
                                    {(classFilter !== "all" || feeStatusFilter !== "all" || academicYearFilter !== "all") && (
                                        <Chip size="sm" color="primary" variant="solid" className="h-4 min-w-4 w-4 p-0 text-[10px]">
                                            {(classFilter !== "all" ? 1 : 0) + (feeStatusFilter !== "all" ? 1 : 0) + (academicYearFilter !== "all" ? 1 : 0)}
                                        </Chip>
                                    )}
                                    <ChevronDown size={14} className={(classFilter !== "all" || feeStatusFilter !== "all" || academicYearFilter !== "all") ? "text-primary" : "text-default-400"} />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Filters" closeOnSelect={false}>
                                <DropdownSection title="Class">
                                    <DropdownItem key="class-all" onPress={() => setClassFilter("all")} startContent={classFilter === "all" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>All Classes</DropdownItem>
                                    {uniqueClasses.map((cls) => (
                                        <DropdownItem key={`class-${cls}`} onPress={() => setClassFilter(cls)} startContent={classFilter === cls ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>{cls}</DropdownItem>
                                    ))}
                                </DropdownSection>
                                <DropdownSection title="Fee Status">
                                    <DropdownItem key="fee-all" onPress={() => setFeeStatusFilter("all")} startContent={feeStatusFilter === "all" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>All Fee Status</DropdownItem>
                                    {feeStatusOptions.map((status) => (
                                        <DropdownItem key={`fee-${status}`} onPress={() => setFeeStatusFilter(status)} startContent={feeStatusFilter === status ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>} className="capitalize">{status}</DropdownItem>
                                    ))}
                                </DropdownSection>
                                <DropdownSection title="Academic Year">
                                    <DropdownItem key="year-all" onPress={() => setAcademicYearFilter("all")} startContent={academicYearFilter === "all" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>All Years</DropdownItem>
                                    {uniqueAcademicYears.map((year) => (
                                        <DropdownItem key={`year-${year}`} onPress={() => setAcademicYearFilter(year)} startContent={academicYearFilter === year ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>{year}</DropdownItem>
                                    ))}
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                    <ArrowUpDown size={16} className="text-default-400" />
                                    <span>Sort</span>
                                    <ChevronDown size={14} className="text-default-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Sort options">
                                <DropdownSection title="Sort By">
                                    <DropdownItem key="name-asc" onPress={() => setSortDescriptor({ column: "name", direction: "ascending" })} startContent={sortDescriptor.column === "name" && sortDescriptor.direction === "ascending" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>Name (A-Z)</DropdownItem>
                                    <DropdownItem key="name-desc" onPress={() => setSortDescriptor({ column: "name", direction: "descending" })} startContent={sortDescriptor.column === "name" && sortDescriptor.direction === "descending" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>Name (Z-A)</DropdownItem>
                                    <DropdownItem key="class-asc" onPress={() => setSortDescriptor({ column: "class", direction: "ascending" })} startContent={sortDescriptor.column === "class" && sortDescriptor.direction === "ascending" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>Class (Ascending)</DropdownItem>
                                    <DropdownItem key="class-desc" onPress={() => setSortDescriptor({ column: "class", direction: "descending" })} startContent={sortDescriptor.column === "class" && sortDescriptor.direction === "descending" ? <Check size={14} className="text-primary" /> : <span className="w-3.5"></span>}>Class (Descending)</DropdownItem>
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown closeOnSelect={false}>
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 text-sm cursor-pointer whitespace-nowrap">
                                    <Columns3 size={16} className="text-default-400" />
                                    <span>Columns</span>
                                    <ChevronDown size={14} className="text-default-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Toggle columns" closeOnSelect={false}>
                                <DropdownSection title="Show/Hide Columns">
                                    {ALL_COLUMNS.map((column) => (
                                        <DropdownItem
                                            key={column.key}
                                            textValue={column.label}
                                            onPress={() => !column.required && toggleColumn(column.key)}
                                            className={column.required ? "opacity-50" : ""}
                                        >
                                            <div className="flex items-center gap-2 w-full pointer-events-none">
                                                <Checkbox
                                                    isSelected={visibleColumns.has(column.key)}
                                                    isDisabled={column.required}
                                                    size="sm"
                                                />
                                                <span>{column.label}</span>
                                                {column.required && <span className="text-default-400 text-xs">(required)</span>}
                                            </div>
                                        </DropdownItem>
                                    ))}
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                        <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                        <Dropdown>
                            <DropdownTrigger>
                                <button className="flex items-center justify-center px-3 py-2.5 bg-transparent rounded-lg border border-default-300 hover:border-primary transition-all duration-200 cursor-pointer">
                                    <MoreVertical size={16} className="text-default-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="More actions">
                                <DropdownItem
                                    key="upload"
                                    startContent={csvProcessing ? <Spinner size="sm" /> : <Upload size={14} />}
                                    onPress={() => csvInputRef.current?.click()}
                                    isDisabled={csvProcessing}
                                >
                                    {csvProcessing ? "Processing..." : "Bulk Upload CSV"}
                                </DropdownItem>
                                <DropdownItem
                                    key="download"
                                    startContent={<Download size={14} />}
                                    onPress={downloadStudentList}
                                >
                                    Download List CSV
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>

            </div>

            {/* Table */}
            <Table
                aria-label="Students list table"
                selectionMode="multiple"
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
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
                    <TableColumn key="name" allowsSorting align="start" style={{ width: 240, minWidth: 240 }}>STUDENT</TableColumn>
                    {visibleColumnsArray.filter(col => col.key !== "name" && col.key !== "actions").map((column) => (
                        <TableColumn
                            key={column.key}
                            allowsSorting={column.key === "class"}
                            style={{
                                width: column.key === "class" ? 100 : column.key === "parentInfo" ? 180 : column.key === "attendance" ? 110 : column.key === "academicPerformance" ? 140 : 100
                            }}
                        >
                            {column.label.toUpperCase()}
                        </TableColumn>
                    ))}
                    {visibleColumnsArray.some(col => col.key === "actions") && (
                        <TableColumn key="actions" align="end" style={{ width: 60 }}>ACTIONS</TableColumn>
                    )}
                </TableHeader>
                <TableBody items={visibleItems} emptyContent="No students found">
                    {(student) => {
                        const attendance = getAttendancePercentage(student.id);
                        return (
                            <TableRow
                                key={student.id}
                                className="cursor-pointer transition-colors hover:bg-default-50"
                                onClick={(e) => {
                                    if (e.target.closest("button") || e.target.closest("label") || e.target.closest("input") || e.target.closest("a")) return;
                                    navigate(`/students/${student.id}`);
                                }}
                            >
                                <TableCell key="name">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={student.photo || `https://i.pravatar.cc/150?u=student${student.id}`}
                                            alt={student.name}
                                            className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Link to={`/students/${student.id}`} className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer truncate">{student.name}</Link>
                                                {student.isPinned && (
                                                    <Pin size={14} className="text-primary flex-shrink-0" />
                                                )}
                                            </div>
                                            <span className="text-default-500 text-xs">{student.admissionId || `ADM${String(student.id).padStart(4, '0')}`}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                {visibleColumnsArray.filter(col => col.key !== "name" && col.key !== "actions").map((column) => {
                                    if (column.key === "class") {
                                        return (
                                            <TableCell key="class">
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-default-600 bg-default-100 group-hover:bg-default-200 transition-colors px-2.5 py-1 rounded-md">
                                                        {student.class}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        );
                                    }
                                    if (column.key === "parentInfo") {
                                        return (
                                            <TableCell key="parentInfo">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-default-900 text-sm font-medium">{student.parentName || "Parent"}</span>
                                                    {editingPhoneId === student.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="text"
                                                                value={phoneInput}
                                                                onChange={(e) => setPhoneInput(e.target.value)}
                                                                placeholder="Enter phone"
                                                                className="text-xs px-2 py-1 border border-default-300 rounded w-28 focus:outline-none focus:border-primary"
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="sm"
                                                                color="primary"
                                                                className="h-6 min-w-12 text-xs"
                                                                onPress={() => handleSavePhone(student.id)}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                className="h-6 min-w-12 text-xs"
                                                                onPress={() => {
                                                                    setEditingPhoneId(null);
                                                                    setPhoneInput("");
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : student.parentPhone ? (
                                                        <span className="text-default-500 text-sm">{formatPhoneNumber(student.parentPhone)}</span>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingPhoneId(student.id);
                                                                setPhoneInput("");
                                                            }}
                                                            className="text-primary text-xs hover:underline text-left"
                                                        >
                                                            + Add phone number
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        );
                                    }
                                    if (column.key === "attendance") {
                                        const isInvalid = isNaN(attendance);
                                        return (
                                            <TableCell key="attendance">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-xs font-semibold ${isInvalid ? 'text-default-400' : `text-${getAttendanceColor(attendance)}`}`}>
                                                        {isInvalid ? "N/A" : `${attendance}%`}
                                                    </span>
                                                    {!isInvalid ? (
                                                        <Progress size="sm" value={attendance} color={getAttendanceColor(attendance)} className="max-w-[60px]" />
                                                    ) : (
                                                        <div className="h-1 w-[60px] bg-default-100 rounded-full"></div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        );
                                    }
                                    if (column.key === "academicPerformance") {
                                        return (
                                            <TableCell key="academicPerformance">
                                                <Chip size="sm" variant="flat" color={getGradeColor(getAcademicGrade(student.id))} className="font-semibold">
                                                    {getAcademicGrade(student.id)}
                                                </Chip>
                                            </TableCell>
                                        );
                                    }
                                    if (column.key === "feeStatus") {
                                        const getFeeDetails = (status) => {
                                            if (status === 'paid') return { total: '₹45,000', paid: '₹45,000', pending: '₹0', date: null };
                                            if (status === 'overdue') return { total: '₹45,000', paid: '₹15,000', pending: '₹30,000', date: 'Due: 1 Dec 2025' };
                                            return { total: '₹45,000', paid: '₹30,000', pending: '₹15,000', date: 'Due: 15 Jan 2026' };
                                        };
                                        const details = getFeeDetails(student.feeStatus);

                                        return (
                                            <TableCell key="feeStatus">
                                                <Tooltip
                                                    content={
                                                        <div className="px-3 py-3">
                                                            <div className="text-base font-semibold mb-3 text-white/90">Fee Structure</div>
                                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-white/70 mb-3">
                                                                <span>Total Fee:</span> <span className="text-right text-white">{details.total}</span>
                                                                <span>Paid:</span> <span className="text-right text-success-300">{details.paid}</span>
                                                                <span>Pending:</span> <span className="text-right text-danger-300">{details.pending}</span>
                                                            </div>
                                                            {details.date && <div className="mb-3 text-sm text-warning-300 border-t border-white/20 pt-2">{details.date}</div>}

                                                            <div className="pt-2 border-t border-white/20">
                                                                <button
                                                                    className="text-primary-300 text-sm hover:text-primary-200 transition-colors w-full text-left"
                                                                    onClick={() => navigate(`/students/${student.id}?tab=fees`)}
                                                                >
                                                                    View full fee details →
                                                                </button>
                                                            </div>
                                                        </div>
                                                    }
                                                    placement="bottom"
                                                    closeDelay={0}
                                                    classNames={{
                                                        content: "bg-black text-white rounded-lg",
                                                    }}
                                                >
                                                    <div className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium capitalize cursor-default ${getFeeStatusStyle(student.feeStatus)}`}>
                                                        {student.feeStatus}
                                                    </div>
                                                </Tooltip>
                                            </TableCell>
                                        );
                                    }
                                    return null;
                                })}
                                {visibleColumnsArray.some(col => col.key === "actions") && (
                                    <TableCell key="actions">
                                        <div className="flex items-center justify-end gap-1">
                                            <Tooltip content={student.isPinned ? "Unpin student" : "Pin student"}>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    className={student.isPinned ? "text-primary" : "text-default-400"}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        if (student.isPinned) {
                                                            handleUnpinStudent(student.id);
                                                        } else {
                                                            handlePinStudent(student.id);
                                                        }
                                                    }}
                                                >
                                                    {student.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                                </Button>
                                            </Tooltip>
                                            <Tooltip content="Edit Details">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    className="text-default-400"
                                                    onPress={() => navigate(`/students/${student.id}`)}
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                            </Tooltip>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button isIconOnly size="sm" variant="light" className="text-default-400">
                                                        <MoreVertical size={18} />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu aria-label="Student actions">
                                                    <DropdownSection title="Status Actions">
                                                        <DropdownItem
                                                            key="inactive"
                                                            startContent={<UserX size={14} />}
                                                            onPress={() => {
                                                                setStatusChangeData({
                                                                    student,
                                                                    newStatus: 'inactive',
                                                                    action: 'Mark as Inactive'
                                                                });
                                                                onStatusChangeOpen();
                                                            }}
                                                        >
                                                            Mark as Inactive
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="transferred"
                                                            startContent={<ArrowUpCircle size={14} />}
                                                            onPress={() => {
                                                                setStatusChangeData({
                                                                    student,
                                                                    newStatus: 'transferred',
                                                                    action: 'Mark as Transferred'
                                                                });
                                                                onStatusChangeOpen();
                                                            }}
                                                        >
                                                            Mark as Transferred
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="alumni"
                                                            startContent={<GraduationCap size={14} />}
                                                            onPress={() => {
                                                                setStatusChangeData({
                                                                    student,
                                                                    newStatus: 'alumni',
                                                                    action: 'Mark as Alumni'
                                                                });
                                                                onStatusChangeOpen();
                                                            }}
                                                        >
                                                            Mark as Alumni
                                                        </DropdownItem>
                                                    </DropdownSection>
                                                    <DropdownSection title="Academic Actions">
                                                        <DropdownItem
                                                            key="promote"
                                                            startContent={<ArrowUpCircle size={14} />}
                                                            onPress={() => {
                                                                setSelectedKeys(new Set([student.id.toString()]));
                                                                onPromoteOpen();
                                                            }}
                                                        >
                                                            Promote Student
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="tc"
                                                            startContent={<FileText size={14} />}
                                                            onPress={() => {
                                                                setTcStudents([student]);
                                                                onTcModalOpen();
                                                            }}
                                                        >
                                                            Generate/Issue TC
                                                        </DropdownItem>
                                                    </DropdownSection>
                                                    <DropdownSection title="Danger Zone">
                                                        <DropdownItem
                                                            key="delete"
                                                            className="text-danger"
                                                            color="danger"
                                                            startContent={<Trash2 size={14} />}
                                                            onPress={() => {
                                                                setStudentToDelete(student);
                                                                onDeleteOpen();
                                                            }}
                                                        >
                                                            Delete Student
                                                        </DropdownItem>
                                                    </DropdownSection>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                    </TableCell>
                                )}
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
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 rounded-lg">
                                        <AlertTriangle size={24} className="text-primary" />
                                    </div>
                                    <span>Confirm Bulk Action</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    Are you sure you want to <span className="font-semibold">
                                        {bulkAction === "tc" ? "generate TC for" :
                                            bulkAction === "deactivate" ? "mark as inactive" :
                                                bulkAction === "alumni" ? "mark as alumni" :
                                                    "mark as transferred"}
                                    </span> <span className="font-semibold text-default-900">{selectedCount}</span> student(s)?
                                </p>
                                {bulkAction === "deactivate" && (
                                    <p className="text-sm text-default-500 mt-2">
                                        These students will no longer appear in active lists and reports.
                                    </p>
                                )}
                                {bulkAction === "transfer" && (
                                    <p className="text-sm text-default-500 mt-2">
                                        These students will be marked as transferred to another institution.
                                    </p>
                                )}
                                {bulkAction === "alumni" && (
                                    <p className="text-sm text-default-500 mt-2">
                                        These students will be moved to the alumni list.
                                    </p>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>Cancel</Button>
                                <Button color="primary" onPress={() => { executeBulkAction(); onClose(); }}>Confirm</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Promote Modal */}
            <Modal isOpen={isPromoteOpen} onClose={onPromoteClose}>
                <ModalContent>
                    <ModalHeader>Promote Students</ModalHeader>
                    <ModalBody>
                        <p className="mb-4">Select the class to promote {selectedCount} student(s) to:</p>
                        <Select label="Promote to Class" placeholder="Select class or status" selectedKeys={promoteToClass ? [promoteToClass] : []} onSelectionChange={(keys) => setPromoteToClass(Array.from(keys)[0])}>
                            {uniqueClasses.map(cls => <SelectItem key={cls}>{cls}</SelectItem>)}
                            <SelectItem key="Passed Out / Alumni">Passed Out / Alumni</SelectItem>
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onPromoteClose}>Cancel</Button>
                        <Button color="primary" onPress={executePromotion} isDisabled={!promoteToClass}>Promote</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Bulk Message Modal */}
            <Modal isOpen={isReminderOpen} onClose={onReminderClose}>
                <ModalContent>
                    <ModalHeader>Send Bulk Message to Parents</ModalHeader>
                    <ModalBody>
                        <p className="text-default-500 text-sm mb-2">
                            This will send a notification to the parents of <b>{reminderTargetCount}</b> students from the current list.
                        </p>
                        <div className="space-y-4">
                            <Textarea
                                label="Message"
                                placeholder="Enter message for parents"
                                value={reminderMessage}
                                onValueChange={setReminderMessage}
                                minRows={3}
                            />
                            <Input
                                type="datetime-local"
                                label="Schedule Delivery Time"
                                value={reminderTime}
                                onValueChange={setReminderTime}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onReminderClose}>Cancel</Button>
                        <Button color="primary" onPress={executeSendReminders} isDisabled={!reminderMessage || !reminderTime}>
                            Schedule Message
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* TC Generator Modal */}
            <TCGeneratorModal
                isOpen={isTcModalOpen}
                onClose={() => {
                    onTcModalClose();
                    setSelectedKeys(new Set([]));
                }}
                students={tcStudents}
            />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-danger-50 rounded-lg">
                                        <AlertTriangle size={24} className="text-danger" />
                                    </div>
                                    <span>Delete Student</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    Are you sure you want to delete <span className="font-semibold text-default-900">{studentToDelete?.name}</span>?
                                </p>
                                <p className="text-sm text-danger mt-2">
                                    This action cannot be undone. All student data including attendance, fees, and academic records will be permanently removed.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={async () => {
                                        try {
                                            await deleteStudent(studentToDelete.id);
                                            toast.success(`${studentToDelete.name} has been deleted`);
                                            onClose();
                                            setStudentToDelete(null);
                                        } catch (error) {
                                            toast.error('Failed to delete student');
                                        }
                                    }}
                                    startContent={<Trash2 size={16} />}
                                >
                                    Delete Student
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Status Change Confirmation Modal */}
            <Modal isOpen={isStatusChangeOpen} onClose={onStatusChangeClose}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 rounded-lg">
                                        <AlertTriangle size={24} className="text-primary" />
                                    </div>
                                    <span>{statusChangeData.action}</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    Are you sure you want to mark <span className="font-semibold text-default-900">{statusChangeData.student?.name}</span> as <span className="font-semibold capitalize">{statusChangeData.newStatus}</span>?
                                </p>
                                {statusChangeData.newStatus === 'inactive' && (
                                    <p className="text-sm text-default-500 mt-2">
                                        The student will no longer appear in active lists and reports.
                                    </p>
                                )}
                                {statusChangeData.newStatus === 'transferred' && (
                                    <p className="text-sm text-default-500 mt-2">
                                        The student will be marked as transferred to another institution.
                                    </p>
                                )}
                                {statusChangeData.newStatus === 'alumni' && (
                                    <p className="text-sm text-default-500 mt-2">
                                        The student will be moved to the alumni list.
                                    </p>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={async () => {
                                        try {
                                            await updateStudent(statusChangeData.student.id, { status: statusChangeData.newStatus });
                                            toast.success(`${statusChangeData.student.name} marked as ${statusChangeData.newStatus}`);
                                            onClose();
                                            setStatusChangeData({ student: null, newStatus: '', action: '' });
                                        } catch (error) {
                                            toast.error('Failed to update status');
                                        }
                                    }}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
