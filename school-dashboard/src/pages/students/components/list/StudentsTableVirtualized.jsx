import React from "react";
import {
    Button, Checkbox,
} from "@heroui/react";
import { ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStudentsTableActions } from "./StudentsTableContext";
import {
    ClassCell,
    ParentInfoCell,
    AttendanceCell,
    AcademicPerformanceCell,
    FeeStatusCell,
    ActionsCell,
    StudentNameCell,
} from "./table-cells";

const COLUMN_WIDTHS = {
    class: 100,
    parentInfo: 180,
    attendance: 110,
    academicPerformance: 140,
};

/** Columns hidden on smaller screens to prevent horizontal scroll */
const MOBILE_HIDDEN_COLUMNS = new Set(["parentInfo", "attendance", "academicPerformance", "feeStatus"]);

/**
 * StudentsTableVirtualized
 *
 * Renders the sticky-header table with a virtual-scrolled tbody.
 * Data props are passed directly; action handlers are read from
 * StudentsTableContext to reduce prop drilling.
 */
function StudentsTableVirtualized({
    // ── Data ─────────────────────────────────────────────────────────────
    visibleItems,
    filteredItems,
    visibleColumnsArray,
    studentFeeStructures,
    currentAcademicYear,

    // ── Selection ────────────────────────────────────────────────────────
    selectedKeys,

    // ── Virtualizer ──────────────────────────────────────────────────────
    rowVirtualizer,
    tableContainerRef,

    // ── Sort ─────────────────────────────────────────────────────────────
    sortDescriptor,

    // ── Phone inline editing (data only) ─────────────────────────────────
    editingPhoneId,
    phoneInput,

    // ── Search query for parent-match indicator ───────────────────────
    searchQuery = "",

    // ── Empty state context ────────────────────────────────────────────
    hasActiveFilters = false,
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Action handlers from context (avoids 19-prop drilling)
    const {
        setSelectedKeys,
        setSortDescriptor,
        setEditingPhoneId,
        setPhoneInput,
        handleSavePhone,
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
        closeAllDropdowns,
        onClearFilters,
    } = useStudentsTableActions();

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
                            className="bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider h-12 border-b border-gray-200 dark:border-zinc-700 select-none pl-3 pr-3 sticky left-0 z-20 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 w-[40%] lg:w-[220px]"
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
                                    } ${MOBILE_HIDDEN_COLUMNS.has(column.key) ? "hidden lg:table-cell" : ""}`}
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
                                className="text-center py-16"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-default-500 text-sm">
                                        {hasActiveFilters
                                            ? t('students.list.noMatchingStudents', 'No students match your current filters')
                                            : t('students.list.noStudentsYet', 'No students found')}
                                    </p>
                                    {hasActiveFilters && onClearFilters && (
                                        <Button
                                            size="sm"
                                            variant="bordered"
                                            onPress={onClearFilters}
                                            className="mt-1"
                                        >
                                            {t('common.clearFilters', 'Clear Filters')}
                                        </Button>
                                    )}
                                </div>
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

                                const selectedBg = "bg-primary-50";
                                const defaultBg = "bg-white dark:bg-zinc-900 group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/50";
                                const bgClass = isSelected ? selectedBg : defaultBg;

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
                                        <StudentNameCell
                                            student={student}
                                            className={`py-4 border-b border-gray-200 dark:border-zinc-700 select-text pl-3 pr-3 sticky left-0 z-10 transition-colors w-[40%] lg:w-[220px] ${bgClass}`}
                                            searchQuery={searchQuery}
                                        />

                                        {/* Dynamic column cells */}
                                        {visibleColumnsArray
                                            .filter(
                                                (col) =>
                                                    col.key !== "name" && col.key !== "actions"
                                            )
                                            .map((column) => {
                                                const mobileHidden = MOBILE_HIDDEN_COLUMNS.has(column.key) ? " hidden lg:table-cell" : "";
                                                const baseTd = `py-4 border-b border-gray-200 dark:border-zinc-700 select-text px-3 transition-colors${mobileHidden} ${bgClass}`;

                                                if (column.key === "class") {
                                                    return <ClassCell key="class" student={student} className={baseTd} />;
                                                }

                                                if (column.key === "parentInfo") {
                                                    return (
                                                        <ParentInfoCell
                                                            key="parentInfo"
                                                            student={student}
                                                            className={baseTd}
                                                            editingPhoneId={editingPhoneId}
                                                            phoneInput={phoneInput}
                                                            setPhoneInput={setPhoneInput}
                                                            setEditingPhoneId={setEditingPhoneId}
                                                            handleSavePhone={handleSavePhone}
                                                        />
                                                    );
                                                }

                                                if (column.key === "attendance") {
                                                    return <AttendanceCell key="attendance" attendance={attendance} className={baseTd} />;
                                                }

                                                if (column.key === "academicPerformance") {
                                                    return <AcademicPerformanceCell key="academicPerformance" student={student} className={baseTd} />;
                                                }

                                                if (column.key === "feeStatus") {
                                                    return (
                                                        <FeeStatusCell
                                                            key="feeStatus"
                                                            student={student}
                                                            className={baseTd}
                                                            studentFeeStructures={studentFeeStructures}
                                                            currentAcademicYear={currentAcademicYear}
                                                        />
                                                    );
                                                }

                                                return null;
                                            })}

                                        {/* Actions cell */}
                                        {visibleColumnsArray.some(
                                            (col) => col.key === "actions"
                                        ) && (
                                            <ActionsCell
                                                student={student}
                                                className={`py-4 border-b border-gray-200 dark:border-zinc-700 select-text pr-6 transition-colors ${bgClass}`}
                                                handlePinStudent={handlePinStudent}
                                                handleUnpinStudent={handleUnpinStudent}
                                                setSelectedStudent={setSelectedStudent}
                                                setIsEditDrawerOpen={setIsEditDrawerOpen}
                                                setStudentToDelete={setStudentToDelete}
                                                onDeleteOpen={onDeleteOpen}
                                                setStatusChangeData={setStatusChangeData}
                                                onStatusChangeOpen={onStatusChangeOpen}
                                                setSelectedKeys={setSelectedKeys}
                                                onPromoteOpen={onPromoteOpen}
                                                setTcStudents={setTcStudents}
                                                onTcModalOpen={onTcModalOpen}
                                                handleBulkAction={handleBulkAction}
                                            />
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

// Memoize to prevent re-renders when parent state changes (e.g. modal opens)
export default React.memo(StudentsTableVirtualized);
