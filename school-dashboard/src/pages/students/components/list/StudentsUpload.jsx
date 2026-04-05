import { useState, useCallback, useRef } from "react";
import { studentsApi } from "../../../../services/api";
import {
    parseCSV,
    validateStudentData,
    checkForDuplicates,
    transformStudentForImport,
} from "../../utils/studentImportUtils";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { toTodayDateString } from "../../../../utils/dateFormatter";

/**
 * useStudentsUpload
 *
 * Custom hook that encapsulates all CSV upload/import state and logic.
 * Returns state variables and handler functions to be used by StudentsList.
 *
 * @param {object} options
 * @param {Array}  options.classes            - Array of class objects from AppContext
 * @param {string} options.currentAcademicYear - Current academic year string
 * @param {Function} options.refreshStudentsList - Callback to refetch the student list
 * @param {Function} options.onPreviewOpen    - Opens the CSV preview modal
 * @param {Function} options.onPreviewClose   - Closes the CSV preview modal
 * @param {Function} options.onCsvUploadClose - Closes the CSV upload modal
 * @param {Array}   options.filteredItems     - Currently filtered students (for download)
 * @param {Set|string} options.selectedKeys   - Selected student keys (for download selected)
 */
export function useStudentsUpload({
    classes,
    currentAcademicYear,
    refreshStudentsList,
    onPreviewOpen,
    onPreviewClose,
    onCsvUploadClose,
    filteredItems,
    selectedKeys,
}) {
    const { t } = useTranslation();

    // CSV upload state
    const [csvFile, setCsvFile] = useState(null);
    const [csvDragActive, setCsvDragActive] = useState(false);
    const [csvProcessing, setCsvProcessing] = useState(false);

    // Preview / import state
    const [validatedStudents, setValidatedStudents] = useState([]);
    const [previewFilter, setPreviewFilter] = useState("all"); // all | valid | invalid | warnings
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

    // Hidden file input ref (passed back to the toolbar)
    const csvInputRef = useRef(null);

    // Helper — load ALL students for duplicate checking during import
    const loadAllStudentsForImport = useCallback(async () => {
        const firstPage = await studentsApi.list(
            { page: 1, limit: 100 },
            { skipCache: true }
        );

        const allStudents = [...(firstPage.data || [])];
        const totalPages = firstPage.pagination?.totalPages || 1;

        for (let page = 2; page <= totalPages; page += 1) {
            const nextPage = await studentsApi.list(
                { page, limit: 100 },
                { skipCache: true }
            );
            allStudents.push(...(nextPage.data || []));
        }

        return allStudents;
    }, []);

    // Helper — parse class and section from combined class field (e.g. "7-b")
    const parseClassAndSection = (student) => {
        let classValue = student.class || "";
        let sectionValue = student.section || "";

        if (classValue.includes("-") && !sectionValue) {
            const parts = classValue.split("-");
            classValue = parts[0].trim();
            sectionValue = parts[1] ? parts[1].trim().toUpperCase() : "";
        }

        return { class: classValue, section: sectionValue };
    };

    // Helper — use real attendance percentage from backend data
    const getAttendancePercentage = (student) => {
        if (student.attendancePercentage != null) return student.attendancePercentage;
        return null;
    };

    // ── File input change handler (legacy simple upload path) ──────────────
    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith(".csv")) {
            toast.error(t("toast.error.pleaseUploadAValidCsvFile"));
            return;
        }

        // Use the validated import path instead of simulating success
        handleCsvFileSelect(file);
        e.target.value = "";
        toast("CSV file selected. Use the import button to validate and process.", { icon: "📄" });
        return;
    };

    // ── File select helper (used by drag-and-drop and file picker) ─────────
    const handleCsvFileSelect = (file) => {
        if (!file) return;
        if (!file.name.endsWith(".csv")) {
            toast.error(t("toast.error.pleaseUploadAValidCsvFile"));
            return;
        }
        setCsvFile(file);
    };

    // ── Drag handlers ──────────────────────────────────────────────────────
    const handleCsvDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setCsvDragActive(true);
        } else if (e.type === "dragleave") {
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

    // ── Full validated CSV process ─────────────────────────────────────────
    const processCsvUpload = async () => {
        if (!csvFile) {
            toast.error(t("toast.error.pleaseSelectACsvFileToUpload"));
            return;
        }

        setCsvProcessing(true);
        try {
            const text = await csvFile.text();
            const parsedStudents = parseCSV(text);

            if (parsedStudents.length === 0) {
                toast.error(
                    t("toast.error.cSVFileAppearsToBeEmptyOrHasNoValidDataRows")
                );
                return;
            }

            toast.loading("Validating student data...", { id: "csv-upload" });
            const existingStudents = await loadAllStudentsForImport();

            let validated = parsedStudents.map((student) =>
                validateStudentData(student, existingStudents, classes)
            );
            validated = checkForDuplicates(validated, existingStudents);

            toast.dismiss("csv-upload");

            setValidatedStudents(validated);
            setPreviewFilter("all");
            onCsvUploadClose();
            onPreviewOpen();
        } catch (error) {
            toast.dismiss("csv-upload");
            toast.error(
                `Failed to process CSV: ${error.message || "Unknown error"}`,
                { duration: 4000, icon: "❌" }
            );
            console.error("❌ CSV Upload Error:", error);
        } finally {
            setCsvProcessing(false);
        }
    };

    // ── Import validated students to backend ───────────────────────────────
    const importValidStudents = async () => {
        const validStudents = validatedStudents.filter(
            (s) => s.valid && !s.isDuplicate
        );

        if (validStudents.length === 0) {
            toast.error(t("toast.error.noValidStudentsToImport"));
            return;
        }

        const duplicateCount = validatedStudents.filter((s) => s.isDuplicate).length;

        setImportProgress({ current: 0, total: validStudents.length });
        setCsvProcessing(true);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        try {
            for (let i = 0; i < validStudents.length; i++) {
                const studentData = validStudents[i].data;

                try {
                    const transformedData = transformStudentForImport(
                        studentData,
                        classes,
                        currentAcademicYear
                    );
                    await studentsApi.create(transformedData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push({
                        student: studentData.name,
                        error: error.message,
                        details: error.details || error,
                    });
                    console.error(
                        `❌ Error importing student ${studentData.name}:`,
                        {
                            message: error.message,
                            details: error.details,
                            status: error.status,
                            stack: error.stack,
                        }
                    );
                }

                setImportProgress({ current: i + 1, total: validStudents.length });
                await new Promise((resolve) => setTimeout(resolve, 200));
            }

            if (errorCount === 0 && duplicateCount === 0) {
                toast.success(
                    `Successfully imported ${successCount} student${successCount > 1 ? "s" : ""}!`,
                    { duration: 5000, icon: "🎉" }
                );
            } else if (errors.length > 0) {
                const errorSummary = errors
                    .slice(0, 3)
                    .map((e) => `${e.student}: ${e.error}`)
                    .join("\n");
                toast.error(
                    `Import complete: ${successCount} successful, ${errorCount} failed\n\n${errorSummary}${errors.length > 3 ? "\n...and more" : ""}`,
                    { duration: 8000, icon: "⚠️" }
                );
                console.error("❌ Import errors:", errors);
            } else {
                toast.success(
                    `Import complete: ${successCount} successful, ${duplicateCount} duplicate${duplicateCount > 1 ? "s" : ""} skipped`,
                    { duration: 5000, icon: "⚠️" }
                );
            }

            onPreviewClose();
            setCsvFile(null);
            setValidatedStudents([]);
            await refreshStudentsList();
        } catch (error) {
            toast.error("Failed to import students", { duration: 4000, icon: "❌" });
            console.error("Import error:", error);
        } finally {
            setCsvProcessing(false);
            setImportProgress({ current: 0, total: 0 });
        }
    };

    // ── Download helpers ───────────────────────────────────────────────────
    const CSV_HEADERS_DISPLAY = [
        "Admission ID",
        "Name",
        "Class",
        "Section",
        "Roll No",
        "Gender",
        "Date of Birth",
        "Blood Group",
        "Nationality",
        "Religion",
        "Category",
        "Mother Tongue",
        "Aadhaar Number",
        "Phone",
        "Email",
        "WhatsApp Number",
        "Address",
        "City",
        "State",
        "Zip Code",
        "Parent Name",
        "Parent Phone",
        "Parent Email",
        "Parent Relationship",
        "Parent Occupation",
        "Emergency Contact Name",
        "Emergency Contact Phone",
        "Previous School",
        "Medical Conditions",
        "Status",
        "Fee Status",
        "Attendance %",
    ];

    const buildRow = (s) => {
        const { class: parsedClass, section: parsedSection } = parseClassAndSection(s);
        return [
            s.admissionId || `ADM${s.id}`,
            s.name || "",
            parsedClass,
            parsedSection,
            s.rollNo || "",
            s.gender || "",
            s.dateOfBirth || "",
            s.bloodGroup || "",
            s.nationality || "",
            s.religion || "",
            s.category || "",
            s.motherTongue || "",
            s.aadhaarNumber || "",
            s.phone || "",
            s.email || "",
            s.whatsappNumber || "",
            s.address || "",
            s.city || "",
            s.state || "",
            s.zipCode || "",
            s.parentName || "",
            s.parentPhone || "",
            s.parentEmail || "",
            s.parentRelationship || "",
            s.parentOccupation || "",
            s.emergencyContactName || "",
            s.emergencyContactPhone || "",
            s.previousSchool || "",
            s.medicalConditions || "",
            s.status || "",
            s.feeStatus || "",
            (getAttendancePercentage(s) != null ? getAttendancePercentage(s) + "%" : "N/A"),
        ].map(
            (field) => `"${(field || "").toString().replace(/"/g, '""')}"`
        );
    };

    const triggerDownload = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadStudentList = () => {
        const rows = filteredItems.map(buildRow);
        const csv = [CSV_HEADERS_DISPLAY.join(","), ...rows.map((r) => r.join(","))].join("\n");
        triggerDownload(csv, `students_${toTodayDateString()}.csv`);
    };

    const downloadSelectedStudents = () => {
        const selectedIds =
            selectedKeys === "all"
                ? filteredItems.map((s) => String(s.id))
                : Array.from(selectedKeys).map((id) => String(id));
        const selectedStudents = filteredItems.filter((s) =>
            selectedIds.includes(String(s.id))
        );

        if (selectedStudents.length === 0) {
            toast.error(t("toast.error.noStudentsSelected"));
            return;
        }

        const rows = selectedStudents.map(buildRow);
        const csv = [CSV_HEADERS_DISPLAY.join(","), ...rows.map((r) => r.join(","))].join("\n");
        triggerDownload(
            csv,
            `selected_students_${toTodayDateString()}.csv`
        );
        toast.success(
            `Downloaded ${selectedStudents.length} student${selectedStudents.length > 1 ? "s" : ""}`
        );
    };

    const downloadCsvTemplate = () => {
        const headers = [
            "admissionId",
            "name",
            "class",
            "section",
            "rollNo",
            "gender",
            "dateOfBirth",
            "bloodGroup",
            "nationality",
            "religion",
            "category",
            "motherTongue",
            "aadhaarNumber",
            "phone",
            "email",
            "whatsappNumber",
            "address",
            "city",
            "state",
            "zipCode",
            "parentName",
            "parentPhone",
            "parentEmail",
            "parentRelationship",
            "parentOccupation",
            "emergencyContactName",
            "emergencyContactPhone",
            "previousSchool",
            "medicalConditions",
        ];

        const exampleRow1 = [
            "ADM2024001",
            "Aarav Sharma",
            "10",
            "A",
            "25",
            "Male",
            "2010-05-15",
            "O+",
            "Indian",
            "Hindu",
            "General",
            "Hindi",
            "1234-5678-9012",
            "9876543210",
            "aarav.sharma@example.com",
            "9876543210",
            "42 MG Road",
            "New Delhi",
            "Delhi",
            "110001",
            "Sunita Sharma",
            "9876543211",
            "sunita.sharma@example.com",
            "Mother",
            "Teacher",
            "Rajesh Sharma",
            "9876543212",
            "Delhi Public School",
            "None",
        ];

        const exampleRow2 = [
            "ADM2024002",
            "Priya Patel",
            "Class 3",
            "B",
            "12",
            "Female",
            "2015-08-20",
            "A+",
            "Indian",
            "Hindu",
            "OBC",
            "Gujarati",
            "2345-6789-0123",
            "9876543213",
            "priya.patel@example.com",
            "9876543213",
            "15 Shivaji Nagar",
            "Mumbai",
            "Maharashtra",
            "400001",
            "Ramesh Patel",
            "9876543214",
            "ramesh.patel@example.com",
            "Father",
            "Engineer",
            "Meera Patel",
            "9876543215",
            "Kendriya Vidyalaya",
            "Asthma",
        ];

        const exampleRow3 = [
            "ADM2024003",
            "Gurpreet Singh",
            "class 8",
            "",
            "18",
            "Male",
            "2012-03-10",
            "B+",
            "Indian",
            "Sikh",
            "General",
            "Punjabi",
            "3456-7890-1234",
            "9876543216",
            "gurpreet.singh@example.com",
            "",
            "78 Anna Salai",
            "Chennai",
            "Tamil Nadu",
            "600001",
            "Harpreet Kaur",
            "9876543217",
            "harpreet.kaur@example.com",
            "Mother",
            "Doctor",
            "Manpreet Singh",
            "9876543218",
            "Navodaya Vidyalaya",
            "None",
        ];

        const csv = [
            headers.join(","),
            exampleRow1.join(","),
            exampleRow2.join(","),
            exampleRow3.join(","),
        ].join("\n");

        triggerDownload(
            csv,
            `student_bulk_upload_template_${toTodayDateString()}.csv`
        );
        toast.success("CSV template downloaded successfully", { icon: "📥" });
    };

    return {
        // state
        csvFile,
        setCsvFile,
        csvDragActive,
        csvProcessing,
        validatedStudents,
        previewFilter,
        setPreviewFilter,
        importProgress,
        csvInputRef,
        // handlers
        handleCSVUpload,
        handleCsvFileSelect,
        handleCsvDrag,
        handleCsvDrop,
        processCsvUpload,
        importValidStudents,
        downloadStudentList,
        downloadSelectedStudents,
        downloadCsvTemplate,
    };
}
