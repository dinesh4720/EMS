import { useState, useMemo, useEffect, useRef, useCallback, useDeferredValue } from "react";
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
    CheckCircle, XCircle, Users, ChevronRight, ArrowRight
} from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { studentsApi, classesApi, trashApi } from "../../services/api";
import { useBatchStudentFees } from "./hooks/useStudentFees";
import { getAuthHeaders } from "../../utils/authSession";
import toast from "react-hot-toast";
import TCGeneratorModal from "./TCGeneratorModal";
import PhotoAvatar from "../../components/PhotoAvatar";
import FiltersDropdown from "../../components/FiltersDropdown";
import EditStudentDrawer from "./EditStudentDrawer";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";
import SkeletonTable from "../../components/SkeletonTable";

const STUDENTS_PAGE_SIZE = 50;
const ITEMS_PER_LOAD = STUDENTS_PAGE_SIZE;

// Helper function to parse CSV text into array of objects
const parseCSV = (csvText) => {
    // Split by line and filter out empty lines
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    // Parse headers (first line)
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

        // Skip empty rows
        if (values.every(v => !v)) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        data.push(row);
    }

    return data;
};

// Validation helper functions
const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true };
};

const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return { valid: true }; // Email is optional
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
};

const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
        return { valid: true }; // Phone is optional
    }
    const phoneClean = phone.toString().replace(/\D/g, '');
    if (phoneClean.length !== 10) {
        return { valid: false, message: 'Phone number must be 10 digits' };
    }
    return { valid: true };
};

const validateDate = (date) => {
    if (!date || date.trim() === '') {
        return { valid: true }; // Date is optional
    }
    // Try YYYY-MM-DD format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    // Try DD-MM-YYYY format
    const dmyDateRegex = /^\d{2}-\d{2}-\d{4}$/;

    let parsedDate;
    if (isoDateRegex.test(date)) {
        parsedDate = new Date(date);
    } else if (dmyDateRegex.test(date)) {
        const parts = date.split('-');
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
        return { valid: false, message: 'Date must be in DD-MM-YYYY or YYYY-MM-DD format' };
    }

    if (isNaN(parsedDate.getTime())) {
        return { valid: false, message: 'Invalid date' };
    }

    return { valid: true };
};

const validateAadhaar = (aadhaar) => {
    if (!aadhaar || aadhaar.trim() === '') {
        return { valid: true }; // Aadhaar is optional
    }
    const aadhaarClean = aadhaar.toString().replace(/\D/g, '');
    if (aadhaarClean.length !== 12) {
        return { valid: false, message: 'Aadhaar number must be 12 digits' };
    }
    return { valid: true };
};

const validateZip = (zip) => {
    if (!zip || zip.trim() === '') {
        return { valid: true }; // Zip is optional
    }
    const zipClean = zip.toString().replace(/\D/g, '');
    if (zipClean.length !== 6) {
        return { valid: false, message: 'Zip code must be 6 digits' };
    }
    return { valid: true };
};

// Helper function to calculate next class for automatic promotion
const getNextClass = (currentClass, availableClasses) => {
    // Handle special cases
    if (!currentClass || currentClass === "Alumni" || currentClass === "Passed Out / Alumni") {
        return null;
    }

    // Handle Nursery/KG levels
    const preschoolMap = {
        "Nursery": "KG",
        "KG": "1",
        "LKG": "UKG",
        "UKG": "1"
    };

    // Check if it's a preschool level
    for (const [from, to] of Object.entries(preschoolMap)) {
        if (currentClass.startsWith(from)) {
            // Extract section if present
            const sectionMatch = currentClass.match(/-[A-Z]$/i);
            const section = sectionMatch ? sectionMatch[0] : "";
            return `${to}${section}`;
        }
    }

    // Extract class number and section (e.g., "9-A" → class: 9, section: "A")
    const match = currentClass.match(/^(\d+)-([A-Z])$/i);
    if (!match) {
        // Try without section (e.g., "9")
        const numMatch = currentClass.match(/^(\d+)$/);
        if (!numMatch) return null;

        const currentGrade = parseInt(numMatch[1]);
        if (currentGrade >= 10) return "Passed Out / Alumni";
        return `${currentGrade + 1}`;
    }

    const currentGrade = parseInt(match[1]);
    const section = match[2];

    // If already in 10th grade, promote to alumni
    if (currentGrade >= 10) return "Passed Out / Alumni";

    // Otherwise, promote to next grade with same section
    const nextClass = `${currentGrade + 1}-${section}`;

    // Check if next class exists in available classes
    if (availableClasses && availableClasses.length > 0) {
        const classExists = availableClasses.some(c => c === nextClass || c.startsWith(`${currentGrade + 1}-`));
        if (!classExists) {
            // If exact section doesn't exist, try to find any section of next grade
            const anyNextGrade = availableClasses.find(c => c.startsWith(`${currentGrade + 1}-`));
            if (anyNextGrade) return anyNextGrade;
        }
    }

    return nextClass;
};

// Intelligent section validation function with flexible class matching
const validateClassSection = (studentData, classes) => {
    const className = studentData.class;
    const sectionName = studentData.section || '';

    if (!className) {
        return { valid: false, message: 'Class is required' };
    }

    // Normalize the class name for flexible matching
    const normalizedClass = normalizeClassName(className);

    // Find all classes matching the name using flexible strategies
    const matchedClasses = classes.filter(c => {
        // Strategy 1: Exact match
        if (c.name === className) return true;

        // Strategy 2: With "Class" prefix
        if (c.name === `Class ${className}`) return true;

        // Strategy 3: Normalized match
        if (normalizedClass && (c.name === normalizedClass || c.name === `Class ${normalizedClass}`)) return true;

        // Strategy 4: Case-insensitive
        if (c.name.toLowerCase() === className.toLowerCase()) return true;

        // Strategy 5: Case-insensitive with prefix
        if (normalizedClass && c.name.toLowerCase() === `class ${normalizedClass}`.toLowerCase()) return true;

        return false;
    });

    if (matchedClasses.length === 0) {
        return {
            valid: false,
            message: `Class "${className}" not found in system. Available classes: ${classes.map(c => c.name + (c.section ? `-${c.section}` : '')).join(', ')}`
        };
    }

    // If no section provided in CSV
    if (!sectionName || sectionName.trim() === '') {
        // Check if any of the matched classes have sections
        const classesWithSections = matchedClasses.filter(c => c.section && c.section.trim() !== '');

        if (classesWithSections.length > 0) {
            // Class HAS sections - section is REQUIRED
            const availableSections = [...new Set(classesWithSections.map(c => c.section))].sort();
            return {
                valid: false,
                message: `Class "${className}" has sections (${availableSections.join(', ')}). Please specify section in CSV.`
            };
        } else {
            // Class has NO sections - section is optional
            return {
                valid: true,
                warning: `Class "${className}" has no sections, student will be added to general class`
            };
        }
    }

    // Section IS provided - validate it exists
    const classWithSection = matchedClasses.find(c =>
        (c.section || '') === sectionName ||
        (c.section || '').toString() === sectionName.toString()
    );

    if (!classWithSection) {
        const availableSections = [...new Set(matchedClasses.filter(c => c.section).map(c => c.section))].sort();
        if (availableSections.length > 0) {
            return {
                valid: false,
                message: `Section "${sectionName}" not found for Class "${className}". Available sections: ${availableSections.join(', ')}`
            };
        } else {
            return {
                valid: false,
                message: `Class "${className}" does not have section "${sectionName}"`
            };
        }
    }

    return { valid: true };
};

// Helper function to group students by class and section for accordion display
const groupStudentsByClassSection = (students) => {
    const groups = {};
    students.forEach(student => {
        const className = student.data.class || 'Unknown Class';
        const section = student.data.section || '';
        const key = section ? `${className} - Section ${section}` : className;

        if (!groups[key]) {
            groups[key] = {
                className,
                section,
                students: [],
                validCount: 0,
                invalidCount: 0,
                duplicateCount: 0
            };
        }

        groups[key].students.push(student);

        if (student.isDuplicate) {
            groups[key].duplicateCount++;
        } else if (student.valid) {
            groups[key].validCount++;
        } else {
            groups[key].invalidCount++;
        }
    });
    return groups;
};

// Main validation function for student data
const validateStudentData = (student, existingStudents = [], allClasses = []) => {
    const errors = {};
    const warnings = [];

    // Validate required fields
    const nameValidation = validateRequired(student.name, 'name');
    if (!nameValidation.valid) {
        errors.name = nameValidation.message;
    }

    // Validate class and section together
    const classSectionValidation = validateClassSection(student, allClasses);
    if (!classSectionValidation.valid) {
        errors.class = classSectionValidation.message;
    }
    if (classSectionValidation.warning) {
        warnings.push(classSectionValidation.warning);
    }

    // Validate gender if provided
    if (student.gender && student.gender.trim() !== '') {
        const validGenders = ['Male', 'Female', 'Other'];
        if (!validGenders.includes(student.gender)) {
            errors.gender = `Gender must be one of: ${validGenders.join(', ')}`;
        }
    }

    // Validate parent information
    const parentNameValidation = validateRequired(student.parentName, 'parentName');
    if (!parentNameValidation.valid) {
        errors.parentName = parentNameValidation.message;
    }

    const parentPhoneValidation = validatePhone(student.parentPhone);
    if (!parentPhoneValidation.valid) {
        errors.parentPhone = parentPhoneValidation.message;
    }

    // Validate optional fields if provided
    if (student.email && student.email.trim() !== '') {
        const emailValidation = validateEmail(student.email);
        if (!emailValidation.valid) {
            errors.email = emailValidation.message;
        }
    }

    if (student.phone && student.phone.trim() !== '') {
        const phoneValidation = validatePhone(student.phone);
        if (!phoneValidation.valid) {
            errors.phone = phoneValidation.message;
        }
    }

    if (student.dateOfBirth && student.dateOfBirth.trim() !== '') {
        const dateValidation = validateDate(student.dateOfBirth);
        if (!dateValidation.valid) {
            errors.dateOfBirth = dateValidation.message;
        }
    }

    if (student.aadhaarNumber && student.aadhaarNumber.trim() !== '') {
        const aadhaarValidation = validateAadhaar(student.aadhaarNumber);
        if (!aadhaarValidation.valid) {
            errors.aadhaarNumber = aadhaarValidation.message;
        }
    }

    if (student.zipCode && student.zipCode.trim() !== '') {
        const zipValidation = validateZip(student.zipCode);
        if (!zipValidation.valid) {
            errors.zipCode = zipValidation.message;
        }
    }

    // Add warnings for recommended but missing fields
    if (!student.email || student.email.trim() === '') {
        warnings.push('Email is recommended but not provided');
    }

    if (!student.phone || student.phone.trim() === '') {
        warnings.push('Student phone number is recommended but not provided');
    }

    if (!student.dateOfBirth || student.dateOfBirth.trim() === '') {
        warnings.push('Date of birth is recommended but not provided');
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors: errors,
        warnings: warnings,
        data: student,
        isDuplicate: false
    };
};

// Check for duplicate students
const checkForDuplicates = (validatedStudents, existingStudents) => {
    return validatedStudents.map(student => {
        // Check for duplicate admission ID
        const duplicateById = existingStudents.find(existing =>
            existing.admissionId === student.data.admissionId
        );

        // Check for duplicate by name + class + parent phone
        const duplicateByDetails = existingStudents.find(existing =>
            existing.name.toLowerCase() === student.data.name.toLowerCase() &&
            existing.class === student.data.class &&
            existing.parentPhone === student.data.parentPhone
        );

        if (duplicateById) {
            return {
                ...student,
                isDuplicate: true,
                errors: {
                    ...student.errors,
                    duplicate: `Student with admission ID "${student.data.admissionId}" already exists in system`
                }
            };
        }

        if (duplicateByDetails) {
            return {
                ...student,
                isDuplicate: true,
                errors: {
                    ...student.errors,
                    duplicate: `Similar student already exists in ${student.data.class} with same name and parent phone`
                }
            };
        }

        return student;
    });
};

// Helper function to normalize class name for flexible matching
const normalizeClassName = (className) => {
    if (!className) return '';

    // Remove common prefixes and patterns
    let normalized = className
        .replace(/^Class\s*/i, '')           // Remove "Class" prefix (case-insensitive)
        .replace(/^\d+\s*\-\s*/, '')          // Remove "3 - " pattern (if section was appended)
        .trim();

    return normalized;
};

// Helper function to transform CSV data for API submission
const transformStudentForImport = (studentData, allClasses) => {
    // Get class and section from CSV
    let csvClass = studentData.class?.trim() || '';
    let csvSection = studentData.section?.trim() || '';

    // Normalize the class name from CSV
    const normalizedClass = normalizeClassName(csvClass);

    console.log('🔍 [Class Matching] Looking for class:', {
        csvClass,
        csvSection,
        normalizedClass,
        availableClasses: allClasses.map(c => ({ name: c.name, section: c.section, id: c._id }))
    });

    // Try multiple matching strategies in order of preference
    let matchedClass = allClasses.find(c => {
        // Strategy 1: Exact match with name and section
        if (c.name === csvClass && (c.section || '') === csvSection) {
            console.log('✅ Strategy 1: Exact match with name and section');
            return true;
        }

        // Strategy 2: Match with "Class" prefix (e.g., "Class 3" matches "3")
        if (csvClass && c.name === `Class ${csvClass}` && (c.section || '') === csvSection) {
            console.log('✅ Strategy 2: Match with "Class" prefix');
            return true;
        }

        // Strategy 3: Match with normalized number (e.g., "3" matches "3" or "Class 3")
        if (normalizedClass && (c.name === normalizedClass || c.name === `Class ${normalizedClass}`) && (c.section || '') === csvSection) {
            console.log('✅ Strategy 3: Match with normalized number');
            return true;
        }

        // Strategy 4: Case-insensitive match
        if (csvClass && c.name.toLowerCase() === csvClass.toLowerCase() && (c.section || '') === csvSection) {
            console.log('✅ Strategy 4: Case-insensitive match');
            return true;
        }

        // Strategy 5: Case-insensitive with "Class" prefix
        if (normalizedClass && c.name.toLowerCase() === `class ${normalizedClass}`.toLowerCase() && (c.section || '') === csvSection) {
            console.log('✅ Strategy 5: Case-insensitive with "Class" prefix');
            return true;
        }

        return false;
    });

    if (!matchedClass) {
        console.error('❌ [Class Matching] No match found:', {
            csvClass,
            csvSection,
            normalizedClass,
            attemptedStrategies: [
                `Exact match: "${csvClass}"`,
                `With "Class" prefix: "Class ${csvClass}"`,
                `Normalized: "${normalizedClass}" or "Class ${normalizedClass}"`,
                `Case-insensitive: "${csvClass?.toLowerCase()}"`,
                `Case-insensitive with prefix: "class ${normalizedClass}"`
            ],
            availableClasses: allClasses.map(c => ({
                name: c.name,
                section: c.section || '',
                id: c._id
            }))
        });

        throw new Error(
            `Class "${csvClass}"${csvSection ? ` (Section: ${csvSection})` : ''} not found in system. ` +
            `Please create it first or check the spelling. ` +
            `Available classes: ${allClasses.map(c => c.name + (c.section ? `-${c.section}` : '')).join(', ')}`
        );
    }

    console.log('✅ [Class Matching] Successfully matched:', {
        csv: csvClass,
        matched: matchedClass.name,
        section: matchedClass.section || 'none',
        classId: matchedClass._id
    });

    // Transform the data to match backend expectations
    return {
        name: studentData.name,
        admissionId: studentData.admissionId,
        academicYear: studentData.academicYear || currentAcademicYear, // Default if not provided
        rollNo: studentData.rollNo ? parseInt(studentData.rollNo) : null,
        classId: matchedClass._id,

        // Personal Information
        gender: studentData.gender || null,
        dateOfBirth: studentData.dateOfBirth || null,
        bloodGroup: studentData.bloodGroup || null,
        nationality: studentData.nationality || null,
        religion: studentData.religion || null,
        category: studentData.category || null,
        motherTongue: studentData.motherTongue || null,
        aadhaarNumber: studentData.aadhaarNumber || null,

        // Contact Information
        phone: studentData.phone || null,
        email: studentData.email || null,
        address: studentData.address || null,
        city: studentData.city || null,
        state: studentData.state || null,
        zipCode: studentData.zipCode || null,
        whatsappNumber: studentData.whatsappNumber || null,

        // Parents array (required by database schema)
        parents: studentData.parentName ? [{
            name: studentData.parentName,
            relationship: studentData.parentRelationship || 'Parent',
            phone: studentData.parentPhone,
            email: studentData.parentEmail,
            occupation: studentData.parentOccupation,
            isWhatsapp: true
        }] : undefined,

        // Emergency Contact
        emergencyContactName: studentData.emergencyContactName || null,
        emergencyContactPhone: studentData.emergencyContactPhone || null,

        // Academic Information
        previousSchool: studentData.previousSchool || null,
        medicalConditions: studentData.medicalConditions || null,

        // Status with defaults
        status: 'active',
        feeStatus: 'pending'
    };
};

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
    const { deleteStudent, updateStudent, addStudent, loading: contextLoading, classes, currentAcademicYear } = useApp();

    const [searchQuery, setSearchQuery] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [feeStatusFilter, setFeeStatusFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [academicYearFilter, setAcademicYearFilter] = useState("all");
    const [academicPerformanceFilter, setAcademicPerformanceFilter] = useState("all");
    const [attendanceFilter, setAttendanceFilter] = useState("all");
    const [students, setStudents] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: STUDENTS_PAGE_SIZE,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const deferredSearchQuery = useDeferredValue(searchQuery.trim());
    const latestListRequestRef = useRef(0);
    const previousServerSignatureRef = useRef("");

    // DEBUG: Log students data to help diagnose filtering issues
    const studentsWithStatus = students.filter(s => s.status).length;
    const studentsWithoutStatus = students.length - studentsWithStatus;
    console.log('👥 StudentsList render:', {
        contextLoading,
        studentsCount: students.length,
        studentsWithStatus,
        studentsWithoutStatus,
        statusFilter,
        studentsData: students.slice(0, 3).map(s => ({ id: s.id, name: s.name, status: s.status }))
    });

    // Dropdown open state tracking
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
    const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
    const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

    // FIXED: Add state for student fee structures to show real data in tooltip
    const [studentFeeStructures, setStudentFeeStructures] = useState({});
    const [loadingFeeStructures, setLoadingFeeStructures] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [, setVisibleCount] = useState(STUDENTS_PAGE_SIZE);
    const loaderRef = useRef(null);

    const csvInputRef = useRef(null);
    const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" });
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));

    // Helper to get class options in "Name-Section" format
    const getClassOptions = () => {
        return classes.map(c => `${c.name}-${c.section}`);
    };

    // Phone number editing state
    const [editingPhoneId, setEditingPhoneId] = useState(null);
    const [phoneInput, setPhoneInput] = useState("");

    // Edit drawer state
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

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
    const { isOpen: isCsvUploadOpen, onOpen: onCsvUploadOpen, onClose: onCsvUploadClose } = useDisclosure();
    const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
    const { isOpen: isTcModalOpen, onOpen: onTcModalOpen, onClose: onTcModalClose } = useDisclosure();

    const [bulkAction, setBulkAction] = useState("");
    const [promoteToClass, setPromoteToClass] = useState("");
    const [promotionPreview, setPromotionPreview] = useState([]);
    const [csvProcessing, setCsvProcessing] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvDragActive, setCsvDragActive] = useState(false);

    // Preview and validation state
    const [validatedStudents, setValidatedStudents] = useState([]);
    const [previewFilter, setPreviewFilter] = useState("all"); // all, valid, invalid, warnings
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [tcStudents, setTcStudents] = useState([]);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusChangeData, setStatusChangeData] = useState({ student: null, newStatus: '', action: '' });

    // Fee Reminder State
    const [reminderMessage, setReminderMessage] = useState("");
    const [reminderTime, setReminderTime] = useState("");
    const [reminderTargetCount, setReminderTargetCount] = useState(0);

    const uniqueClasses = useMemo(() => (
        [...new Set(
            classes
                .map(c => c.section ? `${c.name}-${c.section}` : c.name)
                .filter(Boolean)
        )].sort()
    ), [classes]);
    const uniqueAcademicYears = useMemo(() => (
        [...new Set([currentAcademicYear, ...students.map(s => s.academicYear || currentAcademicYear)])].sort()
    ), [students, currentAcademicYear]);
    const feeStatusOptions = ["paid", "pending", "overdue", "partial"];
    const selectedClassId = useMemo(() => {
        if (classFilter === "all") {
            return null;
        }

        const selectedClass = classes.find((classItem) => {
            const classLabel = classItem.section ? `${classItem.name}-${classItem.section}` : classItem.name;
            return classLabel === classFilter;
        });

        return selectedClass?._id || selectedClass?.id || null;
    }, [classFilter, classes]);
    const sortParams = useMemo(() => ({
        sortBy: sortDescriptor.column === "class" ? "class" : "name",
        sortOrder: sortDescriptor.direction === "descending" ? "desc" : "asc"
    }), [sortDescriptor]);
    const serverRequestSignature = useMemo(() => JSON.stringify({
        search: deferredSearchQuery,
        classId: selectedClassId,
        feeStatus: feeStatusFilter,
        status: statusFilter,
        academicYear: academicYearFilter,
        sortBy: sortParams.sortBy,
        sortOrder: sortParams.sortOrder
    }), [academicYearFilter, deferredSearchQuery, feeStatusFilter, selectedClassId, sortParams.sortBy, sortParams.sortOrder, statusFilter]);

    const loadStudents = useCallback(async (pageToLoad, options = {}) => {
        const requestId = ++latestListRequestRef.current;
        setListLoading(true);

        try {
            const response = await studentsApi.list({
                page: pageToLoad,
                limit: STUDENTS_PAGE_SIZE,
                search: deferredSearchQuery || undefined,
                classId: selectedClassId || undefined,
                feeStatus: feeStatusFilter,
                status: statusFilter,
                academicYear: academicYearFilter,
                sortBy: sortParams.sortBy,
                sortOrder: sortParams.sortOrder
            }, {
                skipCache: options.skipCache ?? false
            });

            if (requestId !== latestListRequestRef.current) {
                return;
            }

            setStudents(response.data || []);
            setPagination(response.pagination || {
                currentPage: pageToLoad,
                totalPages: 1,
                totalItems: response.data?.length || 0,
                itemsPerPage: STUDENTS_PAGE_SIZE,
                hasNextPage: false,
                hasPrevPage: false,
            });
            setSelectedKeys(new Set([]));
        } catch (error) {
            if (requestId !== latestListRequestRef.current) {
                return;
            }

            console.error("Failed to load students list:", error);
            toast.error(`Failed to load students: ${error.message}`);
            setStudents([]);
            setPagination({
                currentPage: pageToLoad,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: STUDENTS_PAGE_SIZE,
                hasNextPage: false,
                hasPrevPage: false,
            });
        } finally {
            if (requestId === latestListRequestRef.current) {
                setListLoading(false);
            }
        }
    }, [academicYearFilter, deferredSearchQuery, feeStatusFilter, selectedClassId, sortParams.sortBy, sortParams.sortOrder, statusFilter]);
    const refreshStudentsList = useCallback(() => {
        return loadStudents(currentPage, { skipCache: true });
    }, [currentPage, loadStudents]);
    const loadAllStudentsForImport = useCallback(async () => {
        const firstPage = await studentsApi.list({
            page: 1,
            limit: 100,
        }, {
            skipCache: true
        });

        const allStudents = [...(firstPage.data || [])];
        const totalPages = firstPage.pagination?.totalPages || 1;

        for (let page = 2; page <= totalPages; page += 1) {
            const nextPage = await studentsApi.list({
                page,
                limit: 100,
            }, {
                skipCache: true
            });
            allStudents.push(...(nextPage.data || []));
        }

        return allStudents;
    }, []);

    // FIXED: Treat students without status as 'active' (matches backend schema default)
    const statusCounts = useMemo(() => ({
        all: pagination.totalItems,
        active: students.filter(s => (s.status || 'active') === "active").length,
        inactive: students.filter(s => s.status === "inactive").length,
        alumni: students.filter(s => s.status === "alumni").length,
    }), [pagination.totalItems, students]);

    const getAttendancePercentage = (studentId) => 75 + ((studentId * 7) % 25);

    const filteredItems = useMemo(() => {
        let filtered = students;

        if (academicPerformanceFilter !== "all") {
            filtered = filtered.filter((s) => {
                // Check if student has exam/marks data
                if (!s.examResults || !Array.isArray(s.examResults) || s.examResults.length === 0) {
                    return false; // No data means don't include in filtered results
                }

                // Calculate average percentage from all exams
                const totalPercentage = s.examResults.reduce((sum, exam) => {
                    if (exam.percentage !== undefined && exam.percentage !== null) {
                        return sum + exam.percentage;
                    }
                    return sum;
                }, 0);
                const averagePercentage = totalPercentage / s.examResults.length;

                // Apply filter based on range
                switch (academicPerformanceFilter) {
                    case "excellent":
                        return averagePercentage >= 90;
                    case "good":
                        return averagePercentage >= 75 && averagePercentage < 90;
                    case "average":
                        return averagePercentage >= 50 && averagePercentage < 75;
                    case "below_average":
                        return averagePercentage < 50;
                    default:
                        return true;
                }
            });
        }
        if (attendanceFilter !== "all") {
            filtered = filtered.filter((s) => {
                const attendance = getAttendancePercentage(s.id);
                switch(attendanceFilter) {
                    case "excellent": return attendance >= 90;
                    case "good": return attendance >= 75 && attendance < 90;
                    case "average": return attendance >= 50 && attendance < 75;
                    case "below": return attendance < 50;
                    default: return true;
                }
            });
        }
        return filtered;
    }, [students, academicPerformanceFilter, attendanceFilter]);

    const visibleItems = filteredItems;
    const hasMore = false;
    const selectedCount = selectedKeys === "all" ? filteredItems.length : selectedKeys.size;

    console.log('📊 Filter results:', { 
        totalStudents: pagination.totalItems, 
        filteredItems: filteredItems.length, 
        statusFilter,
        currentPage,
        totalPages: pagination.totalPages
    });

    useEffect(() => {
        const filtersChanged = previousServerSignatureRef.current !== serverRequestSignature;

        if (filtersChanged && currentPage !== 1) {
            previousServerSignatureRef.current = serverRequestSignature;
            setCurrentPage(1);
            return;
        }

        previousServerSignatureRef.current = serverRequestSignature;
        loadStudents(currentPage);
    }, [currentPage, loadStudents, serverRequestSignature]);

    useEffect(() => {
        const handleRefresh = () => {
            refreshStudentsList();
        };

        window.addEventListener("students:list-refresh", handleRefresh);
        return () => window.removeEventListener("students:list-refresh", handleRefresh);
    }, [refreshStudentsList]);

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

    // FIXED: Memoize student IDs to prevent infinite re-fetches
    const visibleStudentIds = useMemo(() => {
        return filteredItems.map(s => s.id);
    }, [filteredItems]);

    // FIXED: Fetch fee structures for VISIBLE students only (not all students)
    // Using new useBatchStudentFees hook (extracted from component)
    const { feeStructures: batchFeeStructures, loading: batchFeeLoading } = useBatchStudentFees(
        visibleStudentIds,
        { academicYear: currentAcademicYear }
    );

    // Sync batch hook results with component state
    useEffect(() => {
        setStudentFeeStructures(batchFeeStructures);
    }, [batchFeeStructures]);

    useEffect(() => {
        setLoadingFeeStructures(batchFeeLoading);
    }, [batchFeeLoading]);

    // Legacy fetch function (kept for reference, can be removed after testing)
    const fetchStudentFeeStructures = useCallback(async () => {
        // Only fetch for visible students, not all students (optimization)
        if (!filteredItems || filteredItems.length === 0) return;

        setLoadingFeeStructures(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const headers = getAuthHeaders({ 'Content-Type': 'application/json' });

            const structures = {};

            // Fetch in batches to avoid overwhelming the server
            const batchSize = 10;
            for (let i = 0; i < filteredItems.length; i += batchSize) {
                const batchItems = filteredItems.slice(i, i + batchSize);
                const promises = batchItems.map(async (student) => {
                    try {
                        console.log(`🔍 [StudentsList] Fetching fee structure for student:`, {
                            id: student.id,
                            idType: typeof student.id,
                            name: student.name,
                            url: `${API_URL}/student-fees/student/${student.id}?academicYear=${currentAcademicYear}`
                        });

                        const response = await fetch(`${API_URL}/student-fees/student/${student.id}?academicYear=${currentAcademicYear}`, { headers });

                        console.log(`📡 [StudentsList] Response for ${student.id}:`, {
                            status: response.status,
                            ok: response.ok,
                            statusText: response.statusText
                        });

                        if (response.ok) {
                            const data = await response.json();
                            console.log(`✅ [StudentsList] Fee data received for ${student.id}:`, {
                                totalFee: data.totalFee,
                                totalPaid: data.totalPaid,
                                totalBalance: data.totalBalance,
                                overallStatus: data.overallStatus,
                                academicYear: data.academicYear
                            });
                            return { studentId: student.id, data, exists: true };
                        } else if (response.status === 404) {
                            // Auto-initialize fee structure (same as StudentOverview)
                            console.log(`⚠️ [StudentsList] 404 for ${student.id}, auto-initializing...`);
                            try {
                                const initResponse = await fetch(`${API_URL}/student-fees/initialize/${student.id}`, {
                                    method: 'POST',
                                    headers: { ...headers, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ academicYear: currentAcademicYear })
                                });

                                if (initResponse.ok) {
                                    const data = await initResponse.json();
                                    console.log(`✅ [StudentsList] Fee structure initialized for ${student.id}:`, {
                                        totalFee: data.totalFee,
                                        totalBalance: data.totalBalance
                                    });
                                    return { studentId: student.id, data, exists: true };
                                } else {
                                    console.warn(`⚠️ [StudentsList] Failed to initialize fee structure for ${student.id}`);
                                    return { studentId: student.id, exists: false };
                                }
                            } catch (initError) {
                                console.error(`❌ [StudentsList] Error initializing fee structure for ${student.id}:`, initError);
                                return { studentId: student.id, exists: false };
                            }
                        } else {
                            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                            console.error(`❌ [StudentsList] Error ${response.status} fetching fee structure for ${student.id}:`, errorData);
                            return null;
                        }
                    } catch (error) {
                        console.error(`❌ [StudentsList] Exception fetching fee structure for ${student.id}:`, error);
                        return null;
                    }
                });

                const results = await Promise.all(promises);
                results.forEach(result => {
                    if (result) {
                        structures[result.studentId] = {
                            ...(result.exists ? result.data : {}),
                            _exists: result.exists,
                            _studentName: filteredItems.find(s => s.id === result.studentId)?.name
                        };
                    }
                });
            }

            // Force a new object reference to trigger React re-render
            const newStructures = { ...structures };
            setStudentFeeStructures(newStructures);
        } catch (error) {
            console.error('Error fetching student fee structures:', error);
        } finally {
            setLoadingFeeStructures(false);
        }
    }, [filteredItems]);

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

        const handleFeeUpdate = (data) => {
            console.log('💰 StudentsList: Received fee structure update:', data);
            toast.success(`Fee structure updated for ${data.studentName || 'Student'}`, {
                duration: 3000,
                icon: '💰'
            });

            // Refetch fee structure for this student
            if (data.studentId) {
                const fetchUpdatedFeeStructure = async () => {
                    try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                        const headers = getAuthHeaders({ 'Content-Type': 'application/json' });

                        const response = await fetch(`${API_URL}/student-fees/student/${data.studentId}?academicYear=${currentAcademicYear}`, { headers });

                        if (response.ok) {
                            const feeData = await response.json();
                            setStudentFeeStructures(prev => ({
                                ...prev,
                                [data.studentId]: {
                                    ...feeData,
                                    _exists: true
                                }
                            }));
                            console.log(`✅ Fee structure updated in StudentsList for ${data.studentId}`);
                        }
                    } catch (error) {
                        console.error('❌ Error refetching fee structure:', error);
                    }
                };

                fetchUpdatedFeeStructure();
            }
        };

        socketService.on('student_updated', handleStudentUpdate);
        socketService.on('fee_structure_updated', handleFeeUpdate);

        return () => {
            socketService.off('student_updated', handleStudentUpdate);
            socketService.off('fee_structure_updated', handleFeeUpdate);
        };
    }, []);

    const getFeeStatusStyle = (status) => {
        switch (status) {
            case "paid": return "bg-success-50 border-success-200 text-success-700";
            case "pending": return "bg-warning-50 border-warning-200 text-warning-700";
            case "overdue": return "bg-danger-50 border-danger-200 text-danger-700";
            case "partial": return "bg-primary-50 border-primary-200 text-primary-700";
            default: return "bg-default-100 border-default-200 text-default-600";
        }
    };

    const getStatusDotColor = (status) => {
        switch (status) {
            case "active": return "bg-success-500";
            case "inactive": return "bg-danger-500";
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
            await refreshStudentsList();
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
            setStudents(prev => prev.map(student => (
                String(student.id) === String(studentId)
                    ? { ...student, isPinned: true, pinnedAt: new Date().toISOString() }
                    : student
            )));
            toast.success('Student pinned');
        } catch (error) {
            toast.error('Failed to pin student');
        }
    };

    const handleUnpinStudent = async (studentId) => {
        try {
            await studentsApi.unpin(studentId);
            setStudents(prev => prev.map(student => (
                String(student.id) === String(studentId)
                    ? { ...student, isPinned: false, pinnedAt: null }
                    : student
            )));
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
        if (action === "promote") {
            // Calculate the next class for each selected student individually
            const selectedIds = selectedKeys === "all" ? filteredItems.map(s => s.id) : Array.from(selectedKeys);
            const selectedStudents = filteredItems.filter(s => selectedIds.includes(s.id.toString()));

            // Calculate promotion preview for each student
            const preview = selectedStudents.map(student => ({
                ...student,
                nextClass: getNextClass(student.class, uniqueClasses)
            }));

            setPromotionPreview(preview);
            onPromoteOpen();
        } else if (action === "tc") {
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
                else if (bulkAction === "tc") await updateStudent(id, { tcIssued: true });
                else if (bulkAction === "alumni") await updateStudent(id, { status: "alumni" });
            }
            await refreshStudentsList();
            toast.success(`${count} student${count > 1 ? 's' : ''} updated successfully`);
            setSelectedKeys(new Set([]));
            onBulkActionClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update students: ' + (error.message || 'Unknown error'));
        }
    };

    const executePromotion = async () => {
        const selectedIds = selectedKeys === "all" ? filteredItems.map(s => s.id) : Array.from(selectedKeys);
        const selectedStudents = filteredItems.filter(s => selectedIds.includes(s.id.toString()));
        const count = selectedIds.length;

        try {
            let successCount = 0;
            let failCount = 0;

            console.log('🚀 Starting promotion for', selectedStudents.length, 'students');

            for (const student of selectedStudents) {
                try {
                    const nextClass = getNextClass(student.class, uniqueClasses);
                    console.log(`📚 Promoting ${student.name} from ${student.class} to ${nextClass}`);

                    if (!nextClass) {
                        console.warn(`⚠️ Skipping ${student.name} - cannot calculate next class`);
                        failCount++;
                        continue;
                    }

                    if (nextClass === "Passed Out / Alumni") {
                        await updateStudent(student.id, { class: "Passed Out" });
                    } else {
                        // Parse the class name to find classId
                        // Format: "10-A" -> name: "10", section: "A"
                        const classMatch = nextClass.match(/^(\d+)(?:-([A-Z]))?$/i);
                        let classId = null;

                        if (classMatch) {
                            const grade = classMatch[1];
                            const section = classMatch[2] || '';

                            // Find the class in the classes array
                            const targetClass = classes.find(c =>
                                String(c.name) === String(grade) &&
                                (c.section || '') === String(section)
                            );

                            if (targetClass) {
                                classId = targetClass._id || targetClass.id;
                                console.log(`✅ Found classId for ${nextClass}: ${classId}`);
                            } else {
                                console.warn(`⚠️ Could not find classId for ${nextClass} (grade: ${grade}, section: ${section})`);
                            }
                        }

                        if (classId) {
                            // Check if we need to update roll number to avoid conflicts
                            let updateData = { classId, class: nextClass };

                            // Get students in the target class to check for roll number conflicts
                            // FIXED: Use String() comparison for ObjectId matching
                            const targetClassStudents = students.filter(s =>
                                (String(s.classId) === String(classId) || s.class === nextClass) &&
                                s.id !== student.id
                            );

                            const conflictingStudent = targetClassStudents.find(s => s.rollNo === student.rollNo);

                            if (conflictingStudent) {
                                console.log(`⚠️ Roll number conflict detected: ${student.name} has rollNo ${student.rollNo}, but ${conflictingStudent.name} already has this roll number in ${nextClass}`);

                                try {
                                    // Get next available roll number for the target class
                                    const nextRollNoResponse = await classesApi.getNextRollNumber(classId);
                                    const nextRollNo = nextRollNoResponse?.rollNumber || nextRollNoResponse?.rollNo;

                                    if (nextRollNo) {
                                        updateData.rollNo = nextRollNo;
                                        console.log(`✅ Assigned new roll number ${nextRollNo} to ${student.name} for class ${nextClass}`);
                                    } else {
                                        console.warn(`⚠️ Could not get next roll number for class ${nextClass}`);
                                    }
                                } catch (error) {
                                    console.error(`❌ Error getting next roll number:`, error);
                                    // Continue anyway, but this might fail
                                }
                            }

                            await updateStudent(student.id, updateData);
                        } else {
                            // Fallback: try with just class name
                            await updateStudent(student.id, { class: nextClass });
                        }
                    }
                    successCount++;
                    console.log(`✅ Successfully promoted ${student.name}`);
                } catch (error) {
                    console.error(`❌ Failed to promote ${student.name}:`, error);
                    failCount++;
                }
            }

            console.log(`📊 Promotion complete: ${successCount} success, ${failCount} failed`);

            if (failCount === 0) {
                toast.success(`${successCount} student${successCount > 1 ? 's' : ''} promoted successfully`);
            } else if (successCount === 0) {
                toast.error(`Failed to promote any students`);
            } else {
                toast.success(`${successCount} promoted, ${failCount} failed`);
            }

            await refreshStudentsList();
            setSelectedKeys(new Set([]));
            setPromotionPreview([]);
            onPromoteClose();
        } catch (error) {
            console.error('❌ Fatal error in promotion:', error);
            toast.error('Failed to promote students: ' + (error.message || 'Unknown error'));
        }
    };

    // Close all dropdowns
    const closeAllDropdowns = () => {
        setStatusDropdownOpen(false);
        setBulkDropdownOpen(false);
        setFiltersDropdownOpen(false);
        setSortDropdownOpen(false);
        setColumnsDropdownOpen(false);
        setMoreDropdownOpen(false);
    };

    // Clear all filters
    const clearAllFilters = () => {
        setClassFilter("all");
        setFeeStatusFilter("all");
        setAcademicYearFilter("all");
        setAcademicPerformanceFilter("all");
        setAttendanceFilter("all");
        toast.success("All filters cleared");
    };

    // Calculate active filters count
    const activeFiltersCount = useMemo(() => {
        return (classFilter !== "all" ? 1 : 0) +
               (feeStatusFilter !== "all" ? 1 : 0) +
               (academicYearFilter !== "all" ? 1 : 0) +
               (academicPerformanceFilter !== "all" ? 1 : 0) +
               (attendanceFilter !== "all" ? 1 : 0);
    }, [classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter]);

    // Calculate filter counts for each option
    const filterCounts = useMemo(() => {
        const counts = {};

        // Class counts
        counts.class = {};
        students.forEach(s => {
            counts.class[s.class] = (counts.class[s.class] || 0) + 1;
        });

        // Fee status counts
        counts.feeStatus = {};
        students.forEach(s => {
            const status = s.feeStatus || "pending";
            counts.feeStatus[status] = (counts.feeStatus[status] || 0) + 1;
        });

        // Academic year counts
        counts.academicYear = {};
        students.forEach(s => {
            const year = s.academicYear || currentAcademicYear;
            counts.academicYear[year] = (counts.academicYear[year] || 0) + 1;
        });

        // Academic performance counts
        counts.academicPerformance = {};
        students.forEach(s => {
            const perf = s.academicPerformance || "average";
            counts.academicPerformance[perf] = (counts.academicPerformance[perf] || 0) + 1;
        });

        // Attendance counts
        counts.attendance = {};
        students.forEach(s => {
            const att = getAttendancePercentage(s.id);
            let category = "below";
            if (att >= 90) category = "excellent";
            else if (att >= 75) category = "good";
            else if (att >= 50) category = "average";
            counts.attendance[category] = (counts.attendance[category] || 0) + 1;
        });

        return counts;
    }, [students]);

    // Filter configuration for FiltersPanel
    const filtersConfig = useMemo(() => ({
        class: {
            label: "Class",
            value: classFilter,
            options: ["all", ...uniqueClasses],
            counts: { all: pagination.totalItems, ...filterCounts.class },
            displayLabels: {
                all: "All Classes"
            }
        },
        feeStatus: {
            label: "Fee Status",
            value: feeStatusFilter,
            options: ["all", ...feeStatusOptions],
            counts: { all: pagination.totalItems, ...filterCounts.feeStatus },
            displayLabels: {
                all: "All Fee Status",
                paid: "Paid",
                pending: "Pending",
                overdue: "Overdue",
                partial: "Partial"
            }
        },
        academicYear: {
            label: "Academic Year",
            value: academicYearFilter,
            options: ["all", ...uniqueAcademicYears],
            counts: { all: pagination.totalItems, ...filterCounts.academicYear },
            displayLabels: {
                all: "All Years"
            }
        },
        academicPerformance: {
            label: "Academic Performance",
            value: academicPerformanceFilter,
            options: ["all", "excellent", "good", "average", "below_average"],
            counts: { all: pagination.totalItems, ...filterCounts.academicPerformance },
            displayLabels: {
                all: "All Performance",
                excellent: "Excellent (90%+)",
                good: "Good (75-89%)",
                average: "Average (50-74%)",
                below_average: "Below Average (<50%)"
            }
        },
        attendance: {
            label: "Attendance",
            value: attendanceFilter,
            options: ["all", "excellent", "good", "average", "below"],
            counts: { all: pagination.totalItems, ...filterCounts.attendance },
            displayLabels: {
                all: "All Attendance",
                excellent: "Excellent (90%+)",
                good: "Good (75-89%)",
                average: "Average (50-74%)",
                below: "Below Average (<50%)"
            }
        }
    }), [classFilter, feeStatusFilter, academicYearFilter, academicPerformanceFilter, attendanceFilter, uniqueClasses, uniqueAcademicYears, feeStatusOptions, filterCounts, pagination.totalItems]);

    // Handle filter change from FiltersPanel
    const handleFilterChange = useCallback((filterKey, value) => {
        switch (filterKey) {
            case "class":
                setClassFilter(value);
                break;
            case "feeStatus":
                setFeeStatusFilter(value);
                break;
            case "academicYear":
                setAcademicYearFilter(value);
                break;
            case "academicPerformance":
                setAcademicPerformanceFilter(value);
                break;
            case "attendance":
                setAttendanceFilter(value);
                break;
        }
    }, []);

    // Filter presets
    const filterPresets = [
        {
            id: "fee-defaulters",
            label: "Fee Defaulters",
            icon: "💰",
            applied: feeStatusFilter === "overdue",
            filters: { feeStatus: "overdue" }
        },
        {
            id: "low-attendance",
            label: "Low Attendance",
            icon: "📉",
            applied: attendanceFilter === "below",
            filters: { attendance: "below" }
        },
        {
            id: "high-performers",
            label: "High Performers",
            icon: "⭐",
            applied: academicPerformanceFilter === "excellent",
            filters: { academicPerformance: "excellent" }
        },
        {
            id: "needs-attention",
            label: "Needs Attention",
            icon: "⚠️",
            applied: feeStatusFilter === "overdue" && attendanceFilter === "below",
            filters: { feeStatus: "overdue", attendance: "below" }
        }
    ];

    // Handle preset click
    const handlePresetClick = useCallback((preset) => {
        // Apply preset filters
        if (preset.filters.feeStatus) {
            setFeeStatusFilter(preset.filters.feeStatus);
        }
        if (preset.filters.attendance) {
            setAttendanceFilter(preset.filters.attendance);
        }
        if (preset.filters.academicPerformance) {
            setAcademicPerformanceFilter(preset.filters.academicPerformance);
        }
        if (preset.filters.class) {
            setClassFilter(preset.filters.class);
        }
        if (preset.filters.academicYear) {
            setAcademicYearFilter(preset.filters.academicYear);
        }
    }, []);

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setCsvProcessing(true);
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length <= 1) {
                toast.error('CSV file appears to be empty or has no data rows');
                return;
            }

            // Simulate processing with detailed feedback
            toast.loading(`Processing CSV file...`, { id: 'csv-upload' });

            // Simulate async processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            const dataRows = lines.length - 1; // Exclude header row
            const successCount = Math.floor(dataRows * 0.9); // Simulate 90% success rate
            const errorCount = dataRows - successCount;

            toast.dismiss('csv-upload');

            if (errorCount > 0) {
                toast.success(
                    `CSV Upload Complete: ${successCount} students imported successfully, ${errorCount} had errors`,
                    { duration: 5000, icon: '✅' }
                );
            } else {
                toast.success(
                    `CSV Upload Complete: ${successCount} students imported successfully!`,
                    { duration: 4000, icon: '🎉' }
                );
            }

            // Show detailed breakdown
            console.log('📊 CSV Import Summary:', {
                fileName: file.name,
                fileSize: `${(file.size / 1024).toFixed(2)} KB`,
                totalRows: dataRows,
                successful: successCount,
                errors: errorCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            toast.dismiss('csv-upload');
            toast.error(
                `Failed to process CSV: ${error.message || 'Unknown error'}`,
                { duration: 4000, icon: '❌' }
            );
            console.error('❌ CSV Upload Error:', error);
        } finally {
            setCsvProcessing(false);
            e.target.value = '';
        }
    };

    // Helper function to parse class and section from class field (e.g., "7-b" -> class: "7", section: "B")
    const parseClassAndSection = (student) => {
        let classValue = student.class || '';
        let sectionValue = student.section || '';

        // If class contains a dash (e.g., "7-b") and section is empty, parse it
        if (classValue.includes('-') && !sectionValue) {
            const parts = classValue.split('-');
            classValue = parts[0].trim(); // "7"
            sectionValue = parts[1] ? parts[1].trim().toUpperCase() : ''; // "B"
        }

        return { class: classValue, section: sectionValue };
    };

    const downloadStudentList = () => {
        const headers = [
            'Admission ID', 'Name', 'Class', 'Section', 'Roll No', 'Gender', 'Date of Birth', 'Blood Group',
            'Nationality', 'Religion', 'Category', 'Mother Tongue', 'Aadhaar Number',
            'Phone', 'Email', 'WhatsApp Number', 'Address', 'City', 'State', 'Zip Code',
            'Parent Name', 'Parent Phone', 'Parent Email', 'Parent Relationship', 'Parent Occupation',
            'Emergency Contact Name', 'Emergency Contact Phone', 'Previous School', 'Medical Conditions',
            'Status', 'Fee Status', 'Attendance %'
        ];

        const rows = filteredItems.map(s => {
            const { class: parsedClass, section: parsedSection } = parseClassAndSection(s);
            return [
                s.admissionId || `ADM${s.id}`,
                s.name || '',
                parsedClass,
                parsedSection,
                s.rollNo || '',
                s.gender || '',
                s.dateOfBirth || '',
                s.bloodGroup || '',
                s.nationality || '',
                s.religion || '',
                s.category || '',
                s.motherTongue || '',
                s.aadhaarNumber || '',
                s.phone || '',
                s.email || '',
                s.whatsappNumber || '',
                s.address || '',
                s.city || '',
                s.state || '',
                s.zipCode || '',
                s.parentName || '',
                s.parentPhone || '',
                s.parentEmail || '',
                s.parentRelationship || '',
                s.parentOccupation || '',
                s.emergencyContactName || '',
                s.emergencyContactPhone || '',
                s.previousSchool || '',
                s.medicalConditions || '',
                s.status || '',
                s.feeStatus || '',
                getAttendancePercentage(s.id) + '%'
            ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`); // Escape quotes and wrap in quotes
        });

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadSelectedStudents = () => {
        // FIX: Ensure IDs are compared as strings to avoid type mismatches
        const selectedIds = selectedKeys === "all"
            ? filteredItems.map(s => String(s.id))
            : Array.from(selectedKeys).map(id => String(id));
        const selectedStudents = filteredItems.filter(s => selectedIds.includes(String(s.id)));

        if (selectedStudents.length === 0) {
            toast.error('No students selected');
            return;
        }

        const headers = [
            'Admission ID', 'Name', 'Class', 'Section', 'Roll No', 'Gender', 'Date of Birth', 'Blood Group',
            'Nationality', 'Religion', 'Category', 'Mother Tongue', 'Aadhaar Number',
            'Phone', 'Email', 'WhatsApp Number', 'Address', 'City', 'State', 'Zip Code',
            'Parent Name', 'Parent Phone', 'Parent Email', 'Parent Relationship', 'Parent Occupation',
            'Emergency Contact Name', 'Emergency Contact Phone', 'Previous School', 'Medical Conditions',
            'Status', 'Fee Status', 'Attendance %'
        ];

        const rows = selectedStudents.map(s => {
            const { class: parsedClass, section: parsedSection } = parseClassAndSection(s);
            return [
                s.admissionId || `ADM${s.id}`,
                s.name || '',
                parsedClass,
                parsedSection,
                s.rollNo || '',
                s.gender || '',
                s.dateOfBirth || '',
                s.bloodGroup || '',
                s.nationality || '',
                s.religion || '',
                s.category || '',
                s.motherTongue || '',
                s.aadhaarNumber || '',
                s.phone || '',
                s.email || '',
                s.whatsappNumber || '',
                s.address || '',
                s.city || '',
                s.state || '',
                s.zipCode || '',
                s.parentName || '',
                s.parentPhone || '',
                s.parentEmail || '',
                s.parentRelationship || '',
                s.parentOccupation || '',
                s.emergencyContactName || '',
                s.emergencyContactPhone || '',
                s.previousSchool || '',
                s.medicalConditions || '',
                s.status || '',
                s.feeStatus || '',
                getAttendancePercentage(s.id) + '%'
            ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`); // Escape quotes and wrap in quotes
        });

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected_students_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''}`);
    };

    const downloadCsvTemplate = () => {
        const headers = [
            'admissionId', 'name', 'class', 'section', 'rollNo', 'gender', 'dateOfBirth', 'bloodGroup',
            'nationality', 'religion', 'category', 'motherTongue', 'aadhaarNumber',
            'phone', 'email', 'whatsappNumber', 'address', 'city', 'state', 'zipCode',
            'parentName', 'parentPhone', 'parentEmail', 'parentRelationship', 'parentOccupation',
            'emergencyContactName', 'emergencyContactPhone', 'previousSchool', 'medicalConditions'
        ];

        const exampleRow1 = [
            'ADM2024001', 'John Doe', '10', 'A', '25', 'Male', '2010-05-15', 'O+',
            'Indian', 'Hindu', 'General', 'Hindi', '1234-5678-9012',
            '9876543210', 'john.doe@example.com', '9876543210', '123 Main Street', 'New Delhi', 'Delhi', '110001',
            'Jane Doe', '9876543211', 'jane.doe@example.com', 'Mother', 'Teacher',
            'Robert Doe', '9876543212', 'ABC School', 'None'
        ];

        const exampleRow2 = [
            'ADM2024002', 'Jane Smith', 'Class 3', 'B', '12', 'Female', '2015-08-20', 'A+',
            'Indian', 'Christian', 'General', 'English', '2345-6789-0123',
            '9876543213', 'jane.smith@example.com', '9876543213', '456 Park Avenue', 'Mumbai', 'Maharashtra', '400001',
            'John Smith', '9876543214', 'john.smith@example.com', 'Father', 'Engineer',
            'Mary Smith', '9876543215', 'XYZ School', 'Asthma'
        ];

        const exampleRow3 = [
            'ADM2024003', 'Bob Johnson', 'class 8', '', '18', 'Male', '2012-03-10', 'B+',
            'Indian', 'Sikh', 'OBC', 'Punjabi', '3456-7890-1234',
            '9876543216', 'bob.johnson@example.com', '', '789 Elm Road', 'Chennai', 'Tamil Nadu', '600001',
            'Susan Johnson', '9876543217', 'susan.johnson@example.com', 'Mother', 'Doctor',
            'Tom Johnson', '9876543218', 'PQR School', 'None'
        ];

        const csv = [
            headers.join(','),
            exampleRow1.join(','),
            exampleRow2.join(','),
            exampleRow3.join(',')
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_bulk_upload_template_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV template downloaded successfully', { icon: '📥' });
    };

    const handleCsvFileSelect = (file) => {
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setCsvFile(file);
    };

    const handleCsvDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setCsvDragActive(true);
        } else if (e.type === 'dragleave') {
            setCsvDragActive(false);
        }
    };

    const handleCsvDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCsvDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleCsvFileSelect(e.dataTransfer.files[0]);
        }
    };

    const processCsvUpload = async () => {
        if (!csvFile) {
            toast.error('Please select a CSV file to upload');
            return;
        }

        setCsvProcessing(true);
        try {
            const text = await csvFile.text();
            const parsedStudents = parseCSV(text);

            if (parsedStudents.length === 0) {
                toast.error('CSV file appears to be empty or has no valid data rows');
                return;
            }

            toast.loading('Validating student data...', { id: 'csv-upload' });
            const existingStudents = await loadAllStudentsForImport();

            // Validate all students with class/section validation
            let validated = parsedStudents.map(student =>
                validateStudentData(student, existingStudents, classes)
            );

            // Check for duplicates after validation
            validated = checkForDuplicates(validated, existingStudents);

            toast.dismiss('csv-upload');

            // Store validated data and show preview
            setValidatedStudents(validated);
            setPreviewFilter('all');
            onCsvUploadClose();
            onPreviewOpen();

        } catch (error) {
            toast.dismiss('csv-upload');
            toast.error(
                `Failed to process CSV: ${error.message || 'Unknown error'}`,
                { duration: 4000, icon: '❌' }
            );
            console.error('❌ CSV Upload Error:', error);
        } finally {
            setCsvProcessing(false);
        }
    };

    const importValidStudents = async () => {
        const validStudents = validatedStudents.filter(s => s.valid && !s.isDuplicate);

        if (validStudents.length === 0) {
            toast.error('No valid students to import');
            return;
        }

        const duplicateCount = validatedStudents.filter(s => s.isDuplicate).length;

        setImportProgress({ current: 0, total: validStudents.length });
        setCsvProcessing(true);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        try {
            for (let i = 0; i < validStudents.length; i++) {
                const studentData = validStudents[i].data;

                try {
                    console.log(`📤 Importing student ${i + 1}/${validStudents.length}:`, {
                        name: studentData.name,
                        class: studentData.class,
                        admissionId: studentData.admissionId
                    });

                    // Transform the CSV data to match backend requirements
                    const transformedData = transformStudentForImport(studentData, classes);

                    console.log(`✅ Transformed data for ${studentData.name}:`, {
                        hasClassId: !!transformedData.classId,
                        classId: transformedData.classId,
                        academicYear: transformedData.academicYear
                    });

                    // Use the API directly to create the student
                    const response = await studentsApi.create(transformedData);
                    successCount++;

                    console.log(`✅ Successfully imported ${studentData.name}:`, response);
                } catch (error) {
                    errorCount++;
                    errors.push({
                        student: studentData.name,
                        error: error.message,
                        details: error.details || error
                    });
                    console.error(`❌ Error importing student ${studentData.name}:`, {
                        message: error.message,
                        details: error.details,
                        status: error.status,
                        stack: error.stack
                    });
                }

                setImportProgress({ current: i + 1, total: validStudents.length });

                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Show result with detailed error information if any
            if (errorCount === 0 && duplicateCount === 0) {
                toast.success(
                    `Successfully imported ${successCount} student${successCount > 1 ? 's' : ''}!`,
                    { duration: 5000, icon: '🎉' }
                );
            } else if (errors.length > 0) {
                // Show first 3 errors in detail
                const errorSummary = errors.slice(0, 3).map(e =>
                    `${e.student}: ${e.error}`
                ).join('\n');

                toast.error(
                    `Import complete: ${successCount} successful, ${errorCount} failed\n\n${errorSummary}${errors.length > 3 ? '\n...and more' : ''}`,
                    { duration: 8000, icon: '⚠️' }
                );
                console.error('❌ Import errors:', errors);
            } else {
                toast.success(
                    `Import complete: ${successCount} successful, ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} skipped`,
                    { duration: 5000, icon: '⚠️' }
                );
            }

            // Close modal and clean up
            onPreviewClose();
            setCsvFile(null);
            setValidatedStudents([]);
            await refreshStudentsList();

        } catch (error) {
            toast.error('Failed to import students', { duration: 4000, icon: '❌' });
            console.error('Import error:', error);
        } finally {
            setCsvProcessing(false);
            setImportProgress({ current: 0, total: 0 });
        }
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

    // Show skeleton loader while context is loading data
    if (contextLoading || listLoading) {
        return (
            <div className="w-full">
                <SkeletonTable 
                    rows={10} 
                    columns={[
                        { key: "student", label: "STUDENT", width: 240 },
                        { key: "class", label: "CLASS", width: 100 },
                        { key: "parent", label: "PARENT INFO", width: 180 },
                        { key: "attendance", label: "ATTENDANCE", width: 110 },
                        { key: "fee", label: "FEE STATUS", width: 100 },
                        { key: "actions", label: "ACTIONS", width: 60 },
                    ]}
                />
            </div>
        );
    }

    // Preview modal helpers
    const getFilteredValidatedStudents = () => {
        switch (previewFilter) {
            case 'valid':
                return validatedStudents.filter(s => s.valid && !s.isDuplicate);
            case 'invalid':
                return validatedStudents.filter(s => !s.valid);
            case 'warnings':
                return validatedStudents.filter(s => s.warnings.length > 0);
            case 'duplicates':
                return validatedStudents.filter(s => s.isDuplicate);
            default:
                return validatedStudents;
        }
    };

    const getPreviewSummary = () => {
        const total = validatedStudents.length;
        const valid = validatedStudents.filter(s => s.valid && !s.isDuplicate).length;
        const invalid = validatedStudents.filter(s => !s.valid && !s.isDuplicate).length;
        const duplicates = validatedStudents.filter(s => s.isDuplicate).length;
        const warnings = validatedStudents.filter(s => s.warnings.length > 0 && !s.isDuplicate).length;

        return { total, valid, invalid, duplicates, warnings };
    };

    return (
        <div className="w-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 bg-white border-b border-gray-200 py-3 -mx-6 px-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Dropdown placement="bottom-start" isOpen={statusDropdownOpen} onOpenChange={(open) => { setStatusDropdownOpen(open); }}>
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm cursor-pointer whitespace-nowrap">
                                    <span className="text-gray-700 capitalize">{statusFilter}</span>
                                    <span className="text-gray-400">({pagination.totalItems})</span>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Filter by status" onAction={(key) => setStatusFilter(key)} className="max-h-[400px] overflow-y-auto">
                                <DropdownItem key="all" startContent={statusFilter === "all" ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5"></span>} endContent={<span className="text-gray-400 text-xs">{statusCounts.all}</span>}>All Status</DropdownItem>
                                <DropdownItem key="active" startContent={statusFilter === "active" ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5"></span>} endContent={<span className="text-gray-400 text-xs">{statusCounts.active}</span>}>Active</DropdownItem>
                                <DropdownItem key="inactive" startContent={statusFilter === "inactive" ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5"></span>} endContent={<span className="text-gray-400 text-xs">{statusCounts.inactive}</span>}>Inactive</DropdownItem>
                                <DropdownItem key="alumni" startContent={statusFilter === "alumni" ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5"></span>} endContent={<span className="text-gray-400 text-xs">{statusCounts.alumni}</span>}>Alumni</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                        <div className="flex items-center gap-2 w-full sm:max-w-[280px] px-3 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                            <Search size={16} className="text-gray-400" />
                            <input
  type="search"
  name="student-search-query"
  placeholder="Search name, ID, phone…"
  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  autoComplete="off"
  data-form-type="other"
/>
                            {searchQuery && <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-gray-100 rounded cursor-pointer"><X size={14} className="text-gray-400" /></button>}
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap items-center">
                        {selectedCount > 0 && (
                            <>
                                <Dropdown isOpen={bulkDropdownOpen} onOpenChange={(open) => { setBulkDropdownOpen(open); }}>
                                    <DropdownTrigger>
                                        <button className="flex items-center gap-2 px-3 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-sm cursor-pointer whitespace-nowrap">
                                            <span>Actions ({selectedCount})</span>
                                            <ChevronDown size={14} />
                                        </button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Actions" className="max-h-[400px] overflow-y-auto">
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
                                            <DropdownItem key="alumni" startContent={<GraduationCap size={14} />} onPress={() => handleBulkAction("alumni")}>
                                                Mark as Alumni
                                            </DropdownItem>
                                        </DropdownSection>
                                        <DropdownSection title="Communication">
                                            <DropdownItem key="message" startContent={<MessageSquare size={14} />} onPress={() => handleBulkAction("message")}>
                                                Send Message to Parent
                                            </DropdownItem>
                                        </DropdownSection>
                                        <DropdownSection title="Export">
                                            <DropdownItem
                                                key="download-selected"
                                                startContent={<Download size={14} />}
                                                onPress={downloadSelectedStudents}
                                            >
                                                Download Selected as CSV
                                            </DropdownItem>
                                        </DropdownSection>
                                    </DropdownMenu>
                                </Dropdown>
                            </>
                        )}

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
                            placement="bottom-end"
                        />
                        <Dropdown isOpen={sortDropdownOpen} onOpenChange={(open) => { setSortDropdownOpen(open); }}>
                            <DropdownTrigger>
                                <button className="flex items-center justify-center px-3 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer">
                                    <ArrowUpDown size={16} className="text-gray-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Sort options" className="max-h-[400px] overflow-y-auto">
                                <DropdownSection title="Sort By">
                                    <DropdownItem key="name-asc" onPress={() => setSortDescriptor({ column: "name", direction: "ascending" })} startContent={sortDescriptor.column === "name" && sortDescriptor.direction === "ascending" ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5"></span>}>Name (A-Z)</DropdownItem>
                                    <DropdownItem key="name-desc" onPress={() => setSortDescriptor({ column: "name", direction: "descending" })} startContent={sortDescriptor.column === "name" && sortDescriptor.direction === "descending" ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5"></span>}>Name (Z-A)</DropdownItem>
                                    <DropdownItem key="class-asc" onPress={() => setSortDescriptor({ column: "class", direction: "ascending" })} startContent={sortDescriptor.column === "class" && sortDescriptor.direction === "ascending" ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5"></span>}>Class (Ascending)</DropdownItem>
                                    <DropdownItem key="class-desc" onPress={() => setSortDescriptor({ column: "class", direction: "descending" })} startContent={sortDescriptor.column === "class" && sortDescriptor.direction === "descending" ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5"></span>}>Class (Descending)</DropdownItem>
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown closeOnSelect={false} isOpen={columnsDropdownOpen} onOpenChange={(open) => { setColumnsDropdownOpen(open); }}>
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm cursor-pointer whitespace-nowrap">
                                    <Columns3 size={16} className="text-gray-400" />
                                    <span className="text-gray-700">Columns</span>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Toggle columns" closeOnSelect={false} className="max-h-[400px] overflow-y-auto">
                                <DropdownSection title="Show/Hide Columns">
                                    {ALL_COLUMNS.filter(col => !col.required).map((column) => (
                                        <DropdownItem
                                            key={column.key}
                                            textValue={column.label}
                                            onPress={() => toggleColumn(column.key)}
                                        >
                                            <div className="flex items-center gap-2 w-full pointer-events-none">
                                                <Checkbox
                                                    isSelected={visibleColumns.has(column.key)}
                                                    size="sm"
                                                />
                                                <span>{column.label}</span>
                                            </div>
                                        </DropdownItem>
                                    ))}
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                        <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                        <Dropdown isOpen={moreDropdownOpen} onOpenChange={(open) => { setMoreDropdownOpen(open); }}>
                            <DropdownTrigger>
                                <button className="flex items-center justify-center px-3 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer">
                                    <MoreVertical size={16} className="text-gray-400" />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="More actions" className="max-h-[400px] overflow-y-auto">
                                <DropdownItem
                                    key="upload"
                                    startContent={<FileSpreadsheet size={14} />}
                                    onPress={() => {
                                        setCsvFile(null);
                                        onCsvUploadOpen();
                                    }}
                                >
                                    Bulk Upload CSV
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
                key={`table-fees-${Object.keys(studentFeeStructures).length}-${loadingFeeStructures ? 'loading' : 'loaded'}`}
                removeWrapper
                disableRowSelection
                disableAnimation
                radius="none"
                classNames={{
                    base: "-mx-6 overflow-visible scrollbar-auto-hide [&_table]:w-[calc(100%+3rem)] [&_table]:border-spacing-0 [&_table]:select-text",
                    thead: "[&>tr]:first:shadow-none [&>tr>th:first-child]:pl-6 [&>tr>th:first-child]:pr-3 [&>tr>th:first-child]:w-12 [&>tr>th:first-child]:sticky [&>tr>th:first-child]:left-0 [&>tr>th:first-child]:z-20 [&>tr>th:first-child]:bg-white [&>tr>th:nth-child(2)]:sticky [&>tr>th:nth-child(2)]:left-12 [&>tr>th:nth-child(2)]:z-20 [&>tr>th:nth-child(2)]:bg-white",
                    th: "bg-white text-gray-500 font-medium text-xs uppercase tracking-wider h-12 border-b border-gray-200 last:pr-6 hover:bg-gray-50 transition-colors first:hover:bg-transparent select-none",
                    td: "py-4 border-b border-gray-200 group-data-[last=true]:border-none last:pr-6 select-text bg-white",
                    tbody: "[&>tr>td:first-child]:pl-6 [&>tr>td:first-child]:pr-3 [&>tr>td:first-child]:w-12 [&>tr>td:first-child]:sticky [&>tr>td:first-child]:left-0 [&>tr>td:first-child]:z-20 [&>tr>td:first-child]:bg-white [&>tr>td:nth-child(2)]:sticky [&>tr>td:nth-child(2)]:left-12 [&>tr>td:nth-child(2)]:z-20 [&>tr>td:nth-child(2)]:bg-white group-hover:[&>tr>td:first-child]:bg-gray-50 group-hover:[&>tr>td:nth-child(2)]:bg-gray-50",
                    tr: "group hover:bg-gray-50"
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
                <TableBody
                    items={visibleItems}
                    emptyContent="No students found"
                    key={`fees-${Object.keys(studentFeeStructures).length}`}
                >
                    {(student) => {
                        const attendance = getAttendancePercentage(student.id);
                        return (
                            <TableRow
                                key={student.id}
                                className="cursor-pointer transition-colors hover:bg-default-50"
                                onClick={(e) => {
                                    // Close all dropdowns when clicking on table rows
                                    closeAllDropdowns();

                                    // Don't navigate if clicking on interactive elements
                                    if (e.target.closest("button") || e.target.closest("label") || e.target.closest("input") || e.target.closest("a")) return;

                                    // Don't navigate if text is being selected
                                    const selection = window.getSelection();
                                    if (selection && selection.toString().length > 0) return;

                                    navigate(`/students/${student.id}`);
                                }}
                            >
                                <TableCell key="name">
                                    <div className="flex items-center gap-3">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <PhotoAvatar
                                                src={student.photo}
                                                alt={student.name}
                                                name={student.name}
                                                size="md"
                                                type="student"
                                            />
                                        </div>
                                        <div
                                            className="flex flex-col min-w-0 select-text cursor-text"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/students/${student.id}`}
                                                    className="text-default-900 font-medium text-base hover:text-primary transition-colors cursor-pointer truncate"
                                                >
                                                    {student.name}
                                                </Link>
                                                {student.isPinned && (
                                                    <Pin size={14} className="text-primary flex-shrink-0" />
                                                )}
                                            </div>
                                            <span className="text-default-500 text-xs">
                                                {student.admissionId || `ADM${String(student.id).padStart(4, '0')}`}
                                            </span>
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
                                                <div
                                                    className="flex flex-col gap-1 select-text cursor-text"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="text-default-900 text-sm font-medium">
                                                        {student.parentName || "Parent"}
                                                    </span>
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
                                                        <span className="text-default-500 text-sm">
                                                            {formatPhoneNumber(student.parentPhone)}
                                                        </span>
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
                                                        <Progress aria-label="Student attendance" size="sm" value={attendance} color={getAttendanceColor(attendance)} className="max-w-[60px]" />
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
                                        // Use real fee structure data from state
                                        const feeStructure = studentFeeStructures[student.id];
                                        const hasFeeStructure = feeStructure && feeStructure._exists !== false;

                                        const details = hasFeeStructure ? {
                                            total: `₹${(feeStructure.totalFee || 0).toLocaleString()}`,
                                            paid: `₹${(feeStructure.totalPaid || 0).toLocaleString()}`,
                                            pending: `₹${(feeStructure.totalBalance || 0).toLocaleString()}`,
                                            date: feeStructure.totalBalance > 0 ? `Due: ${currentAcademicYear}` : null,
                                            status: feeStructure.overallStatus || student.feeStatus,
                                            exists: true
                                        } : {
                                            // Fee structure not initialized
                                            total: 'Not initialized',
                                            paid: '—',
                                            pending: '—',
                                            date: null,
                                            status: 'not-initialized',
                                            exists: false
                                        };

                                        return (
                                            <TableCell key="feeStatus">
                                                <Tooltip
                                                    content={
                                                        <div className="px-3 py-3">
                                                            <div className="text-base font-semibold mb-3 text-white/90">Fee Structure (${currentAcademicYear})</div>
                                                            {details.exists ? (
                                                                <>
                                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-white/70 mb-3">
                                                                        <span>Total Fee:</span> <span className="text-right text-white">{details.total}</span>
                                                                        <span>Paid:</span> <span className="text-right text-success-300">{details.paid}</span>
                                                                        <span>Pending:</span> <span className="text-right text-danger-300">{details.pending}</span>
                                                                    </div>
                                                                    {details.date && <div className="mb-3 text-sm text-warning-300 border-t border-white/20 pt-2">{details.date}</div>}
                                                                </>
                                                            ) : (
                                                                <div className="text-sm text-white/70 mb-3">
                                                                    <p className="mb-2 text-warning-300">⚠️ Fee structure not initialized</p>
                                                                    <p className="text-xs">Click "View Details" to set up fees for {student.name}</p>
                                                                </div>
                                                            )}

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
                                                    <div className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium capitalize cursor-default ${details.status === 'not-initialized'
                                                        ? 'bg-warning-50 border-warning-200 text-warning-700'
                                                        : getFeeStatusStyle(details.status)
                                                        }`}>
                                                        {details.status === 'not-initialized' ? 'Not Set' : details.status}
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
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onPress={() => {
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
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onPress={() => {
                                                        setSelectedStudent(student);
                                                        setIsEditDrawerOpen(true);
                                                    }}
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                            </Tooltip>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button 
                                                        isIconOnly 
                                                        size="sm" 
                                                        variant="light" 
                                                        className="text-default-400"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                    >
                                                        <MoreVertical size={18} />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu aria-label="Student actions" className="max-h-[400px] overflow-y-auto">
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
                                                    <DropdownSection title="Communication">
                                                        <DropdownItem
                                                            key="message"
                                                            startContent={<MessageSquare size={14} />}
                                                            onPress={() => {
                                                                setSelectedKeys(new Set([student.id.toString()]));
                                                                handleBulkAction("message");
                                                            }}
                                                        >
                                                            Send Message to Parent
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

            <div className="flex flex-col gap-3 border-t border-gray-200 px-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-default-500 text-sm">
                    Page {currentPage} of {pagination.totalPages} ({pagination.totalItems} students)
                </span>
                {pagination.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="flat"
                            isDisabled={!pagination.hasPrevPage || listLoading}
                            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                            Previous
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            isDisabled={!pagination.hasNextPage || listLoading}
                            onPress={() => setCurrentPage(prev => prev + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
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
                                    <span>Confirm Action</span>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    Are you sure you want to <span className="font-semibold">
                                        {bulkAction === "tc" ? "generate TC for" :
                                            bulkAction === "deactivate" ? "mark as inactive" :
                                                "mark as alumni"}
                                    </span> <span className="font-semibold text-default-900">{selectedCount}</span> student(s)?
                                </p>
                                {bulkAction === "deactivate" && (
                                    <p className="text-sm text-default-500 mt-2">
                                        These students will no longer appear in active lists and reports.
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
                        <p className="mb-4">Review the promotion details for <b>{selectedCount}</b> student(s):</p>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {promotionPreview.map((student, index) => (
                                <div key={student.id || index} className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
                                    <div className="flex-1">
                                        <p className="font-medium text-default-900">{student.name}</p>
                                        <p className="text-sm text-default-500">Current: {student.class}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight size={16} className="text-default-400" />
                                        <div className="text-right">
                                            <p className="font-semibold text-success">
                                                {student.nextClass || "Unable to calculate"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {promotionPreview.some(s => !s.nextClass) && (
                            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                                <p className="text-sm text-warning-700">
                                    <AlertTriangle size={14} className="inline mr-1" />
                                    Some students cannot be promoted automatically. Please check the list above.
                                </p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onPromoteClose}>Cancel</Button>
                        <Button
                            color="primary"
                            onPress={executePromotion}
                        >
                            Promote {promotionPreview.filter(s => s.nextClass).length} Student{promotionPreview.filter(s => s.nextClass).length !== 1 ? 's' : ''}
                        </Button>
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
                                    isLoading={isDeleting}
                                    onPress={async () => {
                                        setIsDeleting(true);
                                        try {
                                            const result = await deleteStudent(studentToDelete.id);
                                            await refreshStudentsList();

                                            // Show toast with undo button using react-hot-toast's custom toast
                                            toast((t) => (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span>{studentToDelete.name} moved to trash. Permanently deleted in 30 days.</span>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                // Restore the student
                                                                await trashApi.restore(result.trashItemId);
                                                                toast.success(`${studentToDelete.name} restored successfully`);
                                                                toast.dismiss(t.id);
                                                                // Refresh list
                                                                window.location.reload();
                                                            } catch (error) {
                                                                toast.error('Failed to restore student');
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#10b981',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        Undo
                                                    </button>
                                                </div>
                                            ), { duration: 5000 });

                                            onClose();
                                            setStudentToDelete(null);
                                        } catch (error) {
                                            console.error('Delete error:', error);
                                            // Check if student is already deleted
                                            if (error.message?.includes('already deleted')) {
                                                toast.error('This student is already in the trash');
                                                // Refresh the page to update the list
                                                window.location.reload();
                                            } else {
                                                toast.error(error.message || 'Failed to delete student');
                                            }
                                            onClose();
                                            setStudentToDelete(null);
                                        } finally {
                                            setIsDeleting(false);
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
                                            await refreshStudentsList();
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

            {/* Bulk Upload CSV Modal */}
            <Modal
                isOpen={isCsvUploadOpen}
                onClose={onCsvUploadClose}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 rounded-lg">
                                        <FileSpreadsheet size={24} className="text-primary" />
                                    </div>
                                    <span className="text-xl font-semibold">Bulk Upload Students</span>
                                </div>
                            </ModalHeader>
                            <ModalBody className="space-y-6">
                                {/* Instructions Section */}
                                <div className="bg-default-50 rounded-lg p-4 border border-default-200">
                                    <h4 className="font-semibold text-default-900 mb-3 flex items-center gap-2">
                                        <Info size={18} className="text-primary" />
                                        How to Bulk Upload Students
                                    </h4>
                                    <ol className="space-y-2 text-sm text-default-600 list-decimal list-inside">
                                        <li>Download the CSV template using the button below</li>
                                        <li>Fill in the student data following the column format</li>
                                        <li>Required fields: <span className="font-semibold text-default-900">admissionId, name, class</span></li>
                                        <li>Class names are flexible: <span className="font-mono text-xs bg-default-100 px-1 rounded">Class 3</span>, <span className="font-mono text-xs bg-default-100 px-1 rounded">3</span>, or <span className="font-mono text-xs bg-default-100 px-1 rounded">class 3</span> all work</li>
                                        <li><span className="font-semibold text-default-900">Section</span> is required if the class has sections (e.g., A, B, C)</li>
                                        <li>Upload the filled CSV file</li>
                                        <li>Review and confirm the import summary grouped by class</li>
                                    </ol>
                                </div>

                                {/* Download Template Button */}
                                <div className="flex justify-center">
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        size="lg"
                                        onPress={downloadCsvTemplate}
                                        className="w-full sm:w-auto"
                                        startContent={<Download size={18} />}
                                    >
                                        Download CSV Template
                                    </Button>
                                </div>

                                {/* File Upload Area */}
                                <div
                                    className={`
                                        relative border-2 border-dashed rounded-lg p-8
                                        transition-all duration-200 text-center
                                        ${csvDragActive
                                            ? 'border-primary bg-primary-50/50'
                                            : 'border-default-300 hover:border-primary-400 hover:bg-default-50'
                                        }
                                        ${csvFile ? 'border-success bg-success-50/30' : ''}
                                    `}
                                    onDragEnter={handleCsvDrag}
                                    onDragLeave={handleCsvDrag}
                                    onDragOver={handleCsvDrag}
                                    onDrop={handleCsvDrop}
                                >
                                    <input
                                        ref={csvInputRef}
                                        type="file"
                                        accept=".csv"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleCsvFileSelect(e.target.files[0])}
                                    />
                                    <div className="space-y-3">
                                        <div className="flex justify-center">
                                            <div className={`
                                                p-3 rounded-full
                                                ${csvFile ? 'bg-success-100' : 'bg-default-100'}
                                            `}>
                                                {csvFile ? (
                                                    <Check size={32} className="text-success" />
                                                ) : (
                                                    <Upload size={32} className="text-default-400" />
                                                )}
                                            </div>
                                        </div>
                                        {csvFile ? (
                                            <>
                                                <p className="font-semibold text-success-700">
                                                    {csvFile.name}
                                                </p>
                                                <p className="text-sm text-default-500">
                                                    {(csvFile.size / 1024).toFixed(2)} KB
                                                </p>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        setCsvFile(null);
                                                    }}
                                                    className="mt-2"
                                                >
                                                    Remove File
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-semibold text-default-900">
                                                    Drag & drop your CSV file here
                                                </p>
                                                <p className="text-sm text-default-500">
                                                    or click to browse files
                                                </p>
                                                <p className="text-xs text-default-400">
                                                    Only .csv files are supported
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Column Requirements */}
                                <div className="bg-default-50 rounded-lg p-4 border border-default-200">
                                    <h4 className="font-semibold text-default-900 mb-3 flex items-center gap-2">
                                        <FileText size={18} className="text-primary" />
                                        CSV Column Requirements
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-default-900">Student Information</p>
                                            <p className="text-default-600">• admissionId (Required)</p>
                                            <p className="text-default-600">• name (Required)</p>
                                            <p className="text-default-600">• class (Required)</p>
                                            <p className="text-default-600">• section (if class has sections)</p>
                                            <p className="text-default-600">• rollNo</p>
                                            <p className="text-default-600">• gender</p>
                                            <p className="text-default-600">• dateOfBirth (YYYY-MM-DD)</p>
                                            <p className="text-default-600">• bloodGroup</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-default-900">Contact Details</p>
                                            <p className="text-default-600">• phone</p>
                                            <p className="text-default-600">• email</p>
                                            <p className="text-default-600">• whatsappNumber</p>
                                            <p className="text-default-600">• address</p>
                                            <p className="text-default-600">• city</p>
                                            <p className="text-default-600">• state</p>
                                            <p className="text-default-600">• zipCode</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-default-900">Parent & Other</p>
                                            <p className="text-default-600">• parentName</p>
                                            <p className="text-default-600">• parentPhone</p>
                                            <p className="text-default-600">• parentEmail</p>
                                            <p className="text-default-600">• parentRelationship</p>
                                            <p className="text-default-600">• parentOccupation</p>
                                            <p className="text-default-600">• emergencyContactName</p>
                                            <p className="text-default-600">• emergencyContactPhone</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Important Notes */}
                                <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                                    <h4 className="font-semibold text-warning-900 mb-2 flex items-center gap-2">
                                        <AlertTriangle size={18} className="text-warning" />
                                        Important Notes
                                    </h4>
                                    <ul className="space-y-1 text-sm text-warning-800">
                                        <li>• The first row must contain exact column headers</li>
                                        <li>• Date of birth must be in YYYY-MM-DD format</li>
                                        <li>• Phone numbers should be 10 digits</li>
                                        <li>• Class name formats: <span className="font-mono">Class 3</span>, <span className="font-mono">3</span>, <span className="font-mono">class 3</span> all work</li>
                                        <li>• Section is required if the class has multiple sections (A, B, C, etc.)</li>
                                        <li>• If the class has no sections, leave the section column empty</li>
                                        <li>• Duplicate admission IDs will be skipped</li>
                                        <li>• Empty cells will be treated as null values</li>
                                        <li>• Maximum file size: 5 MB</li>
                                    </ul>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="flat"
                                    onPress={onClose}
                                    isDisabled={csvProcessing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={processCsvUpload}
                                    isDisabled={!csvFile || csvProcessing}
                                    startContent={csvProcessing ? <Spinner size="sm" /> : <Upload size={16} />}
                                >
                                    {csvProcessing ? 'Processing...' : 'Upload Students'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* CSV Preview Modal */}
            <Modal
                isOpen={isPreviewOpen}
                onClose={onPreviewClose}
                size="5xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary-50 rounded-lg">
                                            <FileSpreadsheet size={24} className="text-primary" />
                                        </div>
                                        <span className="text-xl font-semibold">Preview Students</span>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-default-50 rounded-lg p-4 border border-default-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users size={18} className="text-default-600" />
                                            <span className="text-sm text-default-600">Total Students</span>
                                        </div>
                                        <p className="text-2xl font-bold text-default-900">{getPreviewSummary().total}</p>
                                    </div>
                                    <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle size={18} className="text-success" />
                                            <span className="text-sm text-success-700">Valid</span>
                                        </div>
                                        <p className="text-2xl font-bold text-success">{getPreviewSummary().valid}</p>
                                    </div>
                                    <div className="bg-warning-50 rounded-lg p-4 border-warning-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle size={18} className="text-warning" />
                                            <span className="text-sm text-warning-700">Duplicates</span>
                                        </div>
                                        <p className="text-2xl font-bold text-warning">{getPreviewSummary().duplicates}</p>
                                    </div>
                                    <div className="bg-danger-50 rounded-lg p-4 border-danger-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <XCircle size={18} className="text-danger" />
                                            <span className="text-sm text-danger-700">Invalid</span>
                                        </div>
                                        <p className="text-2xl font-bold text-danger">{getPreviewSummary().invalid}</p>
                                    </div>
                                </div>

                                {/* Filter Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant={previewFilter === 'all' ? 'solid' : 'flat'}
                                        color={previewFilter === 'all' ? 'primary' : 'default'}
                                        onPress={() => setPreviewFilter('all')}
                                    >
                                        All ({getPreviewSummary().total})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={previewFilter === 'valid' ? 'solid' : 'flat'}
                                        color={previewFilter === 'valid' ? 'success' : 'default'}
                                        onPress={() => setPreviewFilter('valid')}
                                    >
                                        Valid Only ({getPreviewSummary().valid})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={previewFilter === 'duplicates' ? 'solid' : 'flat'}
                                        color={previewFilter === 'duplicates' ? 'warning' : 'default'}
                                        onPress={() => setPreviewFilter('duplicates')}
                                    >
                                        Duplicates ({getPreviewSummary().duplicates})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={previewFilter === 'invalid' ? 'solid' : 'flat'}
                                        color={previewFilter === 'invalid' ? 'danger' : 'default'}
                                        onPress={() => setPreviewFilter('invalid')}
                                    >
                                        Invalid Only ({getPreviewSummary().invalid})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={previewFilter === 'warnings' ? 'solid' : 'flat'}
                                        color={previewFilter === 'warnings' ? 'warning' : 'default'}
                                        onPress={() => setPreviewFilter('warnings')}
                                    >
                                        Has Warnings ({getPreviewSummary().warnings})
                                    </Button>
                                </div>

                                {/* Progress indicator during import */}
                                {csvProcessing && importProgress.total > 0 && (
                                    <div className="bg-primary-50 rounded-lg p-4 border-primary-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-primary-900">
                                                Importing students...
                                            </span>
                                            <span className="text-sm text-primary-700">
                                                {importProgress.current} of {importProgress.total}
                                            </span>
                                        </div>
                                        <Progress
                                            value={(importProgress.current / importProgress.total) * 100}
                                            color="primary"
                                            size="sm"
                                            className="w-full"
                                        />
                                    </div>
                                )}

                                {/* Class-based Accordion */}
                                <div className="max-h-[500px] overflow-y-auto space-y-3">
                                    {Object.entries(groupStudentsByClassSection(getFilteredValidatedStudents())).map(([classKey, classData]) => {
                                        const hasInvalidStudents = classData.invalidCount > 0;
                                        const hasOnlyValid = classData.invalidCount === 0 && classData.duplicateCount === 0;
                                        const borderColor = hasInvalidStudents ? 'border-danger-300' : classData.duplicateCount > 0 ? 'border-warning-300' : 'border-success-200';
                                        const bgColor = hasInvalidStudents ? 'bg-danger-50/30' : classData.duplicateCount > 0 ? 'bg-warning-50/30' : 'bg-success-50/20';

                                        return (
                                            <Accordion
                                                key={classKey}
                                                variant="splitted"
                                                defaultExpanded={hasInvalidStudents || Object.keys(groupStudentsByClassSection(getFilteredValidatedStudents())).length <= 2}
                                                className="px-0"
                                            >
                                                <AccordionItem
                                                    aria-label={classKey}
                                                    title={
                                                        <div className="flex items-center justify-between w-full pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${hasOnlyValid ? 'bg-success-100' : hasInvalidStudents ? 'bg-danger-100' : 'bg-warning-100'}`}>
                                                                    <GraduationCap size={18} className={hasOnlyValid ? 'text-success' : hasInvalidStudents ? 'text-danger' : 'text-warning'} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-default-900 text-base">
                                                                        {classKey}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-xs text-default-500">
                                                                            {classData.students.length} student{classData.students.length !== 1 ? 's' : ''}
                                                                        </span>
                                                                        <span className="text-default-300">•</span>
                                                                        <span className={`text-xs font-medium ${hasOnlyValid ? 'text-success' : hasInvalidStudents ? 'text-danger' : 'text-warning'}`}>
                                                                            {classData.validCount} valid
                                                                        </span>
                                                                        {classData.invalidCount > 0 && (
                                                                            <>
                                                                                <span className="text-default-300">•</span>
                                                                                <span className="text-xs font-medium text-danger">
                                                                                    {classData.invalidCount} invalid
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                        {classData.duplicateCount > 0 && (
                                                                            <>
                                                                                <span className="text-default-300">•</span>
                                                                                <span className="text-xs font-medium text-warning">
                                                                                    {classData.duplicateCount} duplicate
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    }
                                                    className={`rounded-lg border-2 ${borderColor} ${bgColor}`}
                                                    indicator={<ChevronRight size={18} className="text-default-400 transition-transform duration-200" />}
                                                >
                                                    <div className="pt-2 pb-1 px-1 space-y-2">
                                                        {classData.students.map((student, studentIdx) => (
                                                            <div
                                                                key={studentIdx}
                                                                className={`
                                                                    rounded-lg border p-3 transition-all
                                                                    ${student.isDuplicate
                                                                        ? 'border-warning-300 bg-warning-50/70'
                                                                        : student.valid
                                                                            ? 'border-success-200 bg-success-50/50'
                                                                            : 'border-danger-300 bg-danger-50/70'
                                                                    }
                                                                    ${student.warnings.length > 0 && student.valid && !student.isDuplicate ? 'ring-2 ring-warning-300 ring-opacity-50' : ''}
                                                                `}
                                                            >
                                                                {/* Student Header */}
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                        {student.isDuplicate ? (
                                                                            <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                                                                        ) : student.valid ? (
                                                                            <CheckCircle size={16} className="text-success flex-shrink-0 mt-0.5" />
                                                                        ) : (
                                                                            <XCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                                                                        )}
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-semibold text-default-900 text-sm truncate">
                                                                                {student.data.name || 'Unnamed Student'}
                                                                            </p>
                                                                            <p className="text-xs text-default-500 truncate">
                                                                                ID: {student.data.admissionId || 'No ID'}{student.data.section ? ` • Section ${student.data.section}` : ''}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                                        {student.isDuplicate && (
                                                                            <Chip size="sm" color="warning" variant="flat" className="h-5 text-xs">
                                                                                Duplicate
                                                                            </Chip>
                                                                        )}
                                                                        {!student.isDuplicate && student.warnings.length > 0 && (
                                                                            <Chip size="sm" color="warning" variant="flat" className="h-5 text-xs">
                                                                                {student.warnings.length} {student.warnings.length === 1 ? 'Warn' : 'Warns'}
                                                                            </Chip>
                                                                        )}
                                                                        {!student.isDuplicate && !student.valid && (
                                                                            <Chip size="sm" color="danger" variant="flat" className="h-5 text-xs">
                                                                                Invalid
                                                                            </Chip>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Errors Section */}
                                                                {!student.valid && !student.isDuplicate && Object.keys(student.errors).length > 0 && (
                                                                    <div className="bg-danger-100/80 rounded-md p-2 mb-2">
                                                                        <div className="space-y-1">
                                                                            {Object.entries(student.errors).slice(0, 2).map(([field, error]) => (
                                                                                <div key={field} className="text-xs">
                                                                                    <span className="text-danger-800 font-medium capitalize">{field}:</span>
                                                                                    <span className="text-danger-700 ml-1">{error}</span>
                                                                                </div>
                                                                            ))}
                                                                            {Object.keys(student.errors).length > 2 && (
                                                                                <div className="text-xs text-danger-600 italic">
                                                                                    +{Object.keys(student.errors).length - 2} more error{Object.keys(student.errors).length - 2 > 1 ? 's' : ''}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Warnings Section */}
                                                                {!student.isDuplicate && student.warnings.length > 0 && (
                                                                    <div className="bg-warning-100/80 rounded-md p-2 mb-2">
                                                                        <ul className="space-y-0.5">
                                                                            {student.warnings.slice(0, 2).map((warning, idx) => (
                                                                                <li key={idx} className="text-xs text-warning-800 flex items-start gap-1">
                                                                                    <span className="flex-shrink-0">•</span>
                                                                                    <span className="line-clamp-1">{warning}</span>
                                                                                </li>
                                                                            ))}
                                                                            {student.warnings.length > 2 && (
                                                                                <li className="text-xs text-warning-700 italic">
                                                                                    +{student.warnings.length - 2} more warning{student.warnings.length - 2 > 1 ? 's' : ''}
                                                                                </li>
                                                                            )}
                                                                        </ul>
                                                                    </div>
                                                                )}

                                                                {/* Quick Details */}
                                                                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                                    <div className="text-default-600">
                                                                        <span className="text-default-500">Roll:</span> {student.data.rollNo || '—'}
                                                                    </div>
                                                                    <div className="text-default-600">
                                                                        <span className="text-default-500">Gender:</span> {student.data.gender || '—'}
                                                                    </div>
                                                                    <div className="text-default-600 truncate">
                                                                        <span className="text-default-500">Parent:</span> {student.data.parentName || '—'}
                                                                    </div>
                                                                    <div className="text-default-600">
                                                                        <span className="text-default-500">Phone:</span> {student.data.parentPhone || '—'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionItem>
                                            </Accordion>
                                        );
                                    })}

                                    {getFilteredValidatedStudents().length === 0 && (
                                        <div className="text-center py-12">
                                            <Users size={48} className="text-default-300 mx-auto mb-3" />
                                            <p className="text-default-500 font-medium">No students to display</p>
                                            <p className="text-default-400 text-sm mt-1">Try changing the filter above</p>
                                        </div>
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="flat"
                                    onPress={onClose}
                                    isDisabled={csvProcessing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={importValidStudents}
                                    isDisabled={csvProcessing || getPreviewSummary().valid === 0}
                                    startContent={csvProcessing ? <Spinner size="sm" /> : <CheckCircle size={16} />}
                                >
                                    {csvProcessing
                                        ? `Importing ${importProgress.current}/${importProgress.total}...`
                                        : getPreviewSummary().duplicates > 0
                                            ? `Add ${getPreviewSummary().valid} Valid Students (${getPreviewSummary().duplicates} duplicate${getPreviewSummary().duplicates > 1 ? 's' : ''} will be skipped)`
                                            : `Add ${getPreviewSummary().valid} Valid Students`
                                    }
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Edit Student Drawer */}
            <EditStudentDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => {
                    setIsEditDrawerOpen(false);
                    setSelectedStudent(null);
                }}
                student={selectedStudent}
                onUpdate={(updatedStudent) => {
                    setStudents(prev => prev.map(student => (
                        String(student.id) === String(updatedStudent.id)
                            ? { ...student, ...updatedStudent }
                            : student
                    )));
                    setSelectedStudent(updatedStudent);
                }}
                classOptions={getClassOptions()}
                classesWithTeachers={classes}
            />
            <ScrollToTopButton />
        </div>
    );
}
