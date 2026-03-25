import {
    Button, Chip, Checkbox, Tooltip,
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection,
} from "@heroui/react";
import { Progress } from "@heroui/react";
import {
    ArrowUpDown, Edit, Trash2,
    Pin, PinOff,
    ArrowUpCircle, MessageSquare,
    UserX, FileText, MoreVertical,
} from "lucide-react";
import { GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PhotoAvatar from "../../../../components/PhotoAvatar";

const COLUMN_WIDTHS = {
    class: 100,
    parentInfo: 180,
    attendance: 110,
    academicPerformance: 140,
};

/** ── Helper: fee badge color classes ─────────────────────────────── */
function getFeeStatusStyle(status) {
    switch (status) {
        case "paid":    return "bg-success-50 border-success-200 text-success-700";
        case "pending": return "bg-warning-50 border-warning-200 text-warning-700";
        case "overdue": return "bg-danger-50 border-danger-200 text-danger-700";
        case "partial": return "bg-primary-50 border-primary-200 text-primary-700";
        default:        return "bg-default-100 border-default-200 text-default-600";
    }
}

/** ── Helper: attendance progress bar color ───────────────────────── */
function getAttendanceColor(percentage) {
    return percentage >= 90 ? "success" : percentage >= 75 ? "warning" : "danger";
}

/** ── Helper: academic grade chip color ──────────────────────────── */
function getGradeColor(grade) {
    if (!grade) return "default";
    if (grade.startsWith("A")) return "success";
    if (grade.startsWith("B")) return "primary";
    return "warning";
}

/** ── Helper: derive letter grade from percentage ─────────────────── */
function getAcademicGrade(percentage) {
    if (percentage == null || isNaN(percentage)) return null;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
}

/** ── Helper: phone number formatter ─────────────────────────────── */
function formatPhoneNumber(phone) {
    if (!phone) return "N/A";
    const cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
}

/**
 * StudentsTableVirtualized
 *
 * Renders the sticky-header table with a virtual-scrolled tbody.
 * All data and handler props are drilled in — this component has
 * no local state of its own.
 */
export default function StudentsTableVirtualized({
    // ── Data ─────────────────────────────────────────────────────────────
    visibleItems,
    filteredItems,
    visibleColumnsArray,
    studentFeeStructures,
    currentAcademicYear,

    // ── Selection ────────────────────────────────────────────────────────
    selectedKeys,
    setSelectedKeys,

    // ── Virtualizer ──────────────────────────────────────────────────────
    rowVirtualizer,
    tableContainerRef,

    // ── Sort ─────────────────────────────────────────────────────────────
    sortDescriptor,
    setSortDescriptor,

    // ── Phone inline editing ─────────────────────────────────────────────
    editingPhoneId,
    setEditingPhoneId,
    phoneInput,
    setPhoneInput,
    handleSavePhone,

    // ── Row actions ──────────────────────────────────────────────────────
    handlePinStudent,
    handleUnpinStudent,
    setSelectedStudent,
    setIsEditDrawerOpen,
    setStudentToDelete,
    onDeleteOpen,
    setStatusChangeData,
    onStatusChangeOpen,
    setTcStudents,
    onTcModalOpen,
    handleBulkAction,
    onPromoteOpen,

    // ── Dropdown close helper ────────────────────────────────────────────
    closeAllDropdowns,
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div
            ref={tableContainerRef}
            className="overflow-auto scrollbar-auto-hide flex-1 min-h-0"
        >
            <table className="w-full border-spacing-0 select-text border-collapse">
                {/* ── Sticky header ─────────────────────────────────────────────── */}
                <thead className="sticky top-0 z-30">
                    <tr>
                        {/* Select-all checkbox */}
                        <th className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 text-center w-12 min-w-12">
                            <Checkbox
                                size="md"
                                classNames={{ base: "p-0 m-0", wrapper: "m-0" }}
                                isSelected={
                                    selectedKeys === "all" ||
                                    (selectedKeys.size > 0 &&
                                        selectedKeys.size === filteredItems.length)
                                }
                                isIndeterminate={
                                    selectedKeys !== "all" &&
                                    selectedKeys.size > 0 &&
                                    selectedKeys.size < filteredItems.length
                                }
                                onValueChange={(checked) => {
                                    if (checked) {
                                        setSelectedKeys(
                                            new Set(filteredItems.map((s) => s.id.toString()))
                                        );
                                    } else {
                                        setSelectedKeys(new Set([]));
                                    }
                                }}
                                aria-label={t("aria.buttons.selectAllStudents")}
                            />
                        </th>

                        {/* Student name (sticky left) */}
                        <th
                            className="bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-gray-200 dark:border-zinc-700 select-none pl-3 pr-3 sticky left-0 z-20 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 w-[220px] min-w-[220px]"
                            onClick={() =>
                                setSortDescriptor((prev) => ({
                                    column: "name",
                                    direction:
                                        prev.column === "name" && prev.direction === "ascending"
                                            ? "descending"
                                            : "ascending",
                                }))
                            }
                        >
                            <div className="flex items-center gap-1">
                                STUDENT
                                {sortDescriptor.column === "name" && (
                                    <ArrowUpDown size={12} className="text-gray-400 dark:text-zinc-500" />
                                )}
                            </div>
                        </th>

                        {/* Dynamic columns */}
                        {visibleColumnsArray
                            .filter((col) => col.key !== "name" && col.key !== "actions")
                            .map((column) => (
                                <th
                                    key={column.key}
                                    className={`bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-gray-200 dark:border-zinc-700 select-none px-3 text-left ${
                                        column.key === "class"
                                            ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                                            : ""
                                    }`}
                                    style={{ width: COLUMN_WIDTHS[column.key] ?? 100 }}
                                    onClick={
                                        column.key === "class"
                                            ? () =>
                                                  setSortDescriptor((prev) => ({
                                                      column: "class",
                                                      direction:
                                                          prev.column === "class" &&
                                                          prev.direction === "ascending"
                                                              ? "descending"
                                                              : "ascending",
                                                  }))
                                            : undefined
                                    }
                                >
                                    <div className="flex items-center gap-1">
                                        {column.label.toUpperCase()}
                                        {column.key === "class" &&
                                            sortDescriptor.column === "class" && (
                                                <ArrowUpDown
                                                    size={12}
                                                    className="text-gray-400 dark:text-zinc-500"
                                                />
                                            )}
                                    </div>
                                </th>
                            ))}

                        {/* Actions column header */}
                        {visibleColumnsArray.some((col) => col.key === "actions") && (
                            <th className="bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-gray-200 dark:border-zinc-700 select-none pr-6 text-right w-[60px]">
                                ACTIONS
                            </th>
                        )}
                    </tr>
                </thead>

                {/* ── Virtual body ───────────────────────────────────────────────── */}
                <tbody>
                    {visibleItems.length === 0 ? (
                        <tr>
                            <td
                                colSpan={visibleColumnsArray.length + 2}
                                className="text-center py-12 text-default-500"
                            >
                                No students found
                            </td>
                        </tr>
                    ) : (
                        <>
                            {/* Top spacer */}
                            {rowVirtualizer.getVirtualItems().length > 0 && (
                                <tr
                                    style={{
                                        height: rowVirtualizer.getVirtualItems()[0].start,
                                    }}
                                >
                                    <td colSpan={visibleColumnsArray.length + 2} />
                                </tr>
                            )}

                            {/* Rendered virtual rows */}
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const student = visibleItems[virtualRow.index];
                                if (!student) return null;
                                const attendance = student.attendancePercentage ?? null;
                                const isSelected =
                                    selectedKeys === "all" ||
                                    selectedKeys.has(student.id?.toString());

                                return (
                                    <tr
                                        key={student.id}
                                        data-index={virtualRow.index}
                                        ref={rowVirtualizer.measureElement}
                                        className={`group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50 ${
                                            isSelected ? "bg-primary-50" : ""
                                        }`}
                                        onClick={(e) => {
                                            closeAllDropdowns();
                                            if (
                                                e.target.closest("button") ||
                                                e.target.closest("label") ||
                                                e.target.closest("input") ||
                                                e.target.closest("a")
                                            )
                                                return;
                                            const selection = window.getSelection();
                                            if (selection && selection.toString().length > 0)
                                                return;
                                            navigate(`/students/${student.id}`);
                                        }}
                                    >
                                        {/* Checkbox cell */}
                                        <td
                                            className={`py-4 border-b border-gray-200 dark:border-zinc-700 text-center transition-colors w-12 min-w-12 ${
                                                isSelected
                                                    ? "bg-primary-50"
                                                    : "group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/50"
                                            }`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                size="md"
                                                classNames={{ base: "p-0 m-0", wrapper: "m-0" }}
                                                isSelected={isSelected}
                                                onValueChange={(checked) => {
                                                    const id = student.id.toString();
                                                    const newKeys = new Set(
                                                        selectedKeys === "all"
                                                            ? filteredItems.map((s) => s.id.toString())
                                                            : selectedKeys
                                                    );
                                                    if (checked) {
                                                        newKeys.add(id);
                                                    } else {
                                                        newKeys.delete(id);
                                                    }
                                                    setSelectedKeys(newKeys);
                                                }}
                                                aria-label={`Select ${student.name}`}
                                            />
                                        </td>

                                        {/* Student name (sticky left) */}
                                        <td
                                            className={`py-4 border-b border-gray-200 dark:border-zinc-700 select-text pl-3 pr-3 sticky left-0 z-10 transition-colors w-[220px] min-w-[220px] ${
                                                isSelected
                                                    ? "bg-primary-50"
                                                    : "bg-white dark:bg-zinc-900 group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/50"
                                            }`}
                                        >
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
                                                            <Pin
                                                                size={14}
                                                                className="text-primary flex-shrink-0"
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="text-default-500 text-xs">
                                                        {student.admissionId ||
                                                            `ADM${String(student.id).padStart(4, "0")}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Dynamic column cells */}
                                        {visibleColumnsArray
                                            .filter(
                                                (col) =>
                                                    col.key !== "name" && col.key !== "actions"
                                            )
                                            .map((column) => {
                                                const baseTd = `py-4 border-b border-gray-200 dark:border-zinc-700 select-text px-3 transition-colors ${
                                                    isSelected
                                                        ? "bg-primary-50"
                                                        : "bg-white dark:bg-zinc-900 group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/50"
                                                }`;

                                                if (column.key === "class") {
                                                    return (
                                                        <td key="class" className={baseTd}>
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-default-600 bg-default-100 group-hover:bg-default-200 transition-colors px-2.5 py-1 rounded-md">
                                                                    {student.class}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                if (column.key === "parentInfo") {
                                                    return (
                                                        <td key="parentInfo" className={baseTd}>
                                                            <div
                                                                className="flex flex-col gap-1 select-text cursor-text"
                                                                onMouseDown={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                onPointerDown={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <span className="text-default-900 text-sm font-medium">
                                                                    {student.parentName || "Parent"}
                                                                </span>
                                                                {editingPhoneId === student.id ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            type="text"
                                                                            value={phoneInput}
                                                                            onChange={(e) =>
                                                                                setPhoneInput(
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            placeholder={t(
                                                                                "pages.enterPhone"
                                                                            )}
                                                                            className="text-xs px-2 py-1 border border-default-300 rounded w-28 focus:outline-none focus:border-primary"
                                                                            onClick={(e) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                            autoFocus
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            color="primary"
                                                                            className="h-6 min-w-12 text-xs"
                                                                            onPress={() =>
                                                                                handleSavePhone(
                                                                                    student.id
                                                                                )
                                                                            }
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="light"
                                                                            className="h-6 min-w-12 text-xs"
                                                                            onPress={() => {
                                                                                setEditingPhoneId(
                                                                                    null
                                                                                );
                                                                                setPhoneInput("");
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                ) : student.parentPhone ? (
                                                                    <span className="text-default-500 text-sm">
                                                                        {formatPhoneNumber(
                                                                            student.parentPhone
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingPhoneId(
                                                                                student.id
                                                                            );
                                                                            setPhoneInput("");
                                                                        }}
                                                                        className="text-primary text-xs hover:underline text-left"
                                                                    >
                                                                        + Add phone number
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                if (column.key === "attendance") {
                                                    const isInvalid = isNaN(attendance);
                                                    return (
                                                        <td key="attendance" className={baseTd}>
                                                            <div className="flex flex-col gap-1">
                                                                <span
                                                                    className={`text-xs font-semibold ${
                                                                        isInvalid
                                                                            ? "text-default-400"
                                                                            : `text-${getAttendanceColor(attendance)}`
                                                                    }`}
                                                                >
                                                                    {isInvalid
                                                                        ? "N/A"
                                                                        : `${attendance}%`}
                                                                </span>
                                                                {!isInvalid ? (
                                                                    <Progress
                                                                        aria-label={t(
                                                                            "aria.misc.studentAttendanceProgress"
                                                                        )}
                                                                        size="sm"
                                                                        value={attendance}
                                                                        color={getAttendanceColor(
                                                                            attendance
                                                                        )}
                                                                        className="max-w-[60px]"
                                                                    />
                                                                ) : (
                                                                    <div className="h-1 w-[60px] bg-default-100 rounded-full"></div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                if (column.key === "academicPerformance") {
                                                    const grade = getAcademicGrade(student.latestResultPercentage);
                                                    return (
                                                        <td key="academicPerformance" className={baseTd}>
                                                            {grade ? (
                                                                <Chip
                                                                    size="sm"
                                                                    variant="flat"
                                                                    color={getGradeColor(grade)}
                                                                    className="font-semibold"
                                                                >
                                                                    {grade}
                                                                </Chip>
                                                            ) : (
                                                                <span className="text-xs text-default-400">N/A</span>
                                                            )}
                                                        </td>
                                                    );
                                                }

                                                if (column.key === "feeStatus") {
                                                    const feeStructure =
                                                        studentFeeStructures[student.id];
                                                    const hasFeeStructure =
                                                        feeStructure &&
                                                        feeStructure._exists !== false;

                                                    const details = hasFeeStructure
                                                        ? {
                                                              total: `₹${(
                                                                  feeStructure.totalFee || 0
                                                              ).toLocaleString()}`,
                                                              paid: `₹${(
                                                                  feeStructure.totalPaid || 0
                                                              ).toLocaleString()}`,
                                                              pending: `₹${(
                                                                  feeStructure.totalBalance || 0
                                                              ).toLocaleString()}`,
                                                              date:
                                                                  feeStructure.totalBalance > 0
                                                                      ? `Due: ${currentAcademicYear}`
                                                                      : null,
                                                              status:
                                                                  feeStructure.overallStatus ||
                                                                  student.feeStatus,
                                                              exists: true,
                                                          }
                                                        : {
                                                              total: "Not initialized",
                                                              paid: "—",
                                                              pending: "—",
                                                              date: null,
                                                              status: "not-initialized",
                                                              exists: false,
                                                          };

                                                    return (
                                                        <td key="feeStatus" className={baseTd}>
                                                            <Tooltip
                                                                content={
                                                                    <div className="px-3 py-3">
                                                                        <div className="text-base font-semibold mb-3 text-white/90">
                                                                            Fee Structure (
                                                                            {currentAcademicYear})
                                                                        </div>
                                                                        {details.exists ? (
                                                                            <>
                                                                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-white/70 mb-3">
                                                                                    <span>
                                                                                        {t(
                                                                                            "pages.totalFee2"
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text-right text-white">
                                                                                        {details.total}
                                                                                    </span>
                                                                                    <span>
                                                                                        {t(
                                                                                            "pages.paid3"
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text-right text-success-300">
                                                                                        {details.paid}
                                                                                    </span>
                                                                                    <span>
                                                                                        {t(
                                                                                            "pages.pending3"
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text-right text-danger-300">
                                                                                        {details.pending}
                                                                                    </span>
                                                                                </div>
                                                                                {details.date && (
                                                                                    <div className="mb-3 text-sm text-warning-300 border-t border-white/20 pt-2">
                                                                                        {details.date}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <div className="text-sm text-white/70 mb-3">
                                                                                <p className="mb-2 text-warning-300">
                                                                                    {t(
                                                                                        "pages.feeStructureNotInitialized"
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-xs">
                                                                                    Click "View
                                                                                    Details" to set
                                                                                    up fees for{" "}
                                                                                    {student.name}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        <div className="pt-2 border-t border-white/20">
                                                                            <button
                                                                                className="text-primary-300 text-sm hover:text-primary-200 transition-colors w-full text-left"
                                                                                onClick={() =>
                                                                                    navigate(
                                                                                        `/students/${student.id}?tab=fees`
                                                                                    )
                                                                                }
                                                                            >
                                                                                View full fee
                                                                                details →
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                }
                                                                placement="bottom"
                                                                closeDelay={0}
                                                                classNames={{
                                                                    content:
                                                                        "bg-black text-white rounded-lg",
                                                                }}
                                                            >
                                                                <div
                                                                    className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium capitalize cursor-default ${
                                                                        details.status ===
                                                                        "not-initialized"
                                                                            ? "bg-warning-50 border-warning-200 text-warning-700"
                                                                            : getFeeStatusStyle(
                                                                                  details.status
                                                                              )
                                                                    }`}
                                                                >
                                                                    {details.status ===
                                                                    "not-initialized"
                                                                        ? "Not Set"
                                                                        : details.status}
                                                                </div>
                                                            </Tooltip>
                                                        </td>
                                                    );
                                                }

                                                return null;
                                            })}

                                        {/* Actions cell */}
                                        {visibleColumnsArray.some(
                                            (col) => col.key === "actions"
                                        ) && (
                                            <td
                                                className={`py-4 border-b border-gray-200 dark:border-zinc-700 select-text pr-6 transition-colors ${
                                                    isSelected
                                                        ? "bg-primary-50"
                                                        : "bg-white dark:bg-zinc-900 group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/50"
                                                }`}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Pin / Unpin */}
                                                    <Tooltip
                                                        content={
                                                            student.isPinned
                                                                ? "Unpin student"
                                                                : "Pin student"
                                                        }
                                                    >
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            className={
                                                                student.isPinned
                                                                    ? "text-primary"
                                                                    : "text-default-400"
                                                            }
                                                            onMouseDown={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            onPress={() => {
                                                                if (student.isPinned) {
                                                                    handleUnpinStudent(student.id);
                                                                } else {
                                                                    handlePinStudent(student.id);
                                                                }
                                                            }}
                                                        >
                                                            {student.isPinned ? (
                                                                <PinOff size={16} />
                                                            ) : (
                                                                <Pin size={16} />
                                                            )}
                                                        </Button>
                                                    </Tooltip>

                                                    {/* Edit */}
                                                    <Tooltip content="Edit Details">
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            className="text-default-400"
                                                            onMouseDown={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            onPress={() => {
                                                                setSelectedStudent(student);
                                                                setIsEditDrawerOpen(true);
                                                            }}
                                                        >
                                                            <Edit size={16} />
                                                        </Button>
                                                    </Tooltip>

                                                    {/* Per-row more-actions */}
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                className="text-default-400"
                                                                onMouseDown={(e) =>
                                                                    e.preventDefault()
                                                                }
                                                            >
                                                                <MoreVertical size={18} />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu
                                                            aria-label={t(
                                                                "aria.menus.studentActions"
                                                            )}
                                                            className="max-h-[400px] overflow-y-auto"
                                                        >
                                                            <DropdownSection
                                                                title={t("pages.statusActions")}
                                                            >
                                                                <DropdownItem
                                                                    key="inactive"
                                                                    startContent={
                                                                        <UserX size={14} />
                                                                    }
                                                                    onPress={() => {
                                                                        setStatusChangeData({
                                                                            student,
                                                                            newStatus: "inactive",
                                                                            action:
                                                                                "Mark as Inactive",
                                                                        });
                                                                        onStatusChangeOpen();
                                                                    }}
                                                                >
                                                                    Mark as Inactive
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="alumni"
                                                                    startContent={
                                                                        <GraduationCap size={14} />
                                                                    }
                                                                    onPress={() => {
                                                                        setStatusChangeData({
                                                                            student,
                                                                            newStatus: "alumni",
                                                                            action: "Mark as Alumni",
                                                                        });
                                                                        onStatusChangeOpen();
                                                                    }}
                                                                >
                                                                    Mark as Alumni
                                                                </DropdownItem>
                                                            </DropdownSection>
                                                            <DropdownSection
                                                                title={t("pages.academicActions")}
                                                            >
                                                                <DropdownItem
                                                                    key="promote"
                                                                    startContent={
                                                                        <ArrowUpCircle size={14} />
                                                                    }
                                                                    onPress={() => {
                                                                        setSelectedKeys(
                                                                            new Set([
                                                                                student.id.toString(),
                                                                            ])
                                                                        );
                                                                        onPromoteOpen();
                                                                    }}
                                                                >
                                                                    Promote Student
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="tc"
                                                                    startContent={
                                                                        <FileText size={14} />
                                                                    }
                                                                    onPress={() => {
                                                                        setTcStudents([student]);
                                                                        onTcModalOpen();
                                                                    }}
                                                                >
                                                                    Generate/Issue TC
                                                                </DropdownItem>
                                                            </DropdownSection>
                                                            <DropdownSection
                                                                title={t("pages.communication1")}
                                                            >
                                                                <DropdownItem
                                                                    key="message"
                                                                    startContent={
                                                                        <MessageSquare size={14} />
                                                                    }
                                                                    onPress={() => {
                                                                        setSelectedKeys(
                                                                            new Set([
                                                                                student.id.toString(),
                                                                            ])
                                                                        );
                                                                        handleBulkAction("message");
                                                                    }}
                                                                >
                                                                    Send Message to Parent
                                                                </DropdownItem>
                                                            </DropdownSection>
                                                            <DropdownSection
                                                                title={t("pages.dangerZone")}
                                                            >
                                                                <DropdownItem
                                                                    key="delete"
                                                                    className="text-danger"
                                                                    color="danger"
                                                                    startContent={
                                                                        <Trash2 size={14} />
                                                                    }
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
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}

                            {/* Bottom spacer */}
                            {rowVirtualizer.getVirtualItems().length > 0 && (
                                <tr
                                    style={{
                                        height:
                                            rowVirtualizer.getTotalSize() -
                                            (rowVirtualizer
                                                .getVirtualItems()
                                                .at(-1)?.end ?? 0),
                                    }}
                                >
                                    <td colSpan={visibleColumnsArray.length + 2} />
                                </tr>
                            )}
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
}
