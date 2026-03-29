import {
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    DropdownSection, Checkbox,
} from "@heroui/react";
import {
    Search, ArrowUpDown, MoreVertical, ChevronDown,
    Check, Download, UserX,
    ArrowUpCircle, Columns3, MessageSquare, FileText,
} from "lucide-react";
import { GraduationCap, FileSpreadsheet } from "lucide-react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import FiltersDropdown from "../../../../components/FiltersDropdown";
import { ALL_COLUMNS } from "../../utils/studentImportUtils";

/**
 * StudentsFiltersBar
 *
 * The full toolbar strip shown above the student table:
 *   - Status tab dropdown  (all / active / inactive / alumni)
 *   - Search input
 *   - Bulk-actions dropdown  (shown only when rows are selected)
 *   - Filters dropdown (FiltersDropdown component)
 *   - Sort dropdown
 *   - Columns dropdown
 *   - More-actions dropdown (bulk CSV upload / download list)
 *   - Hidden file input for the legacy CSV upload path
 */
export default function StudentsFiltersBar({
    // ── Status filter ────────────────────────────────────────────────────
    statusFilter,
    setStatusFilter,
    statusDropdownOpen,
    setStatusDropdownOpen,
    statusCounts,
    students,

    // ── Search ───────────────────────────────────────────────────────────
    searchQuery,
    setSearchQuery,

    // ── Bulk actions ─────────────────────────────────────────────────────
    selectedCount,
    bulkDropdownOpen,
    setBulkDropdownOpen,
    handleBulkAction,
    downloadSelectedStudents,

    // ── Filters ──────────────────────────────────────────────────────────
    filtersConfig,
    handleFilterChange,
    clearAllFilters,
    activeFiltersCount,
    filterPresets,
    handlePresetClick,
    filtersDropdownOpen,
    setFiltersDropdownOpen,

    // ── Sort ─────────────────────────────────────────────────────────────
    sortDescriptor,
    setSortDescriptor,
    sortDropdownOpen,
    setSortDropdownOpen,

    // ── Columns ──────────────────────────────────────────────────────────
    visibleColumns,
    toggleColumn,
    columnsDropdownOpen,
    setColumnsDropdownOpen,

    // ── Search debounce ──────────────────────────────────────────────────
    isSearching = false,

    // ── More (CSV upload / download) ─────────────────────────────────────
    moreDropdownOpen,
    setMoreDropdownOpen,
    csvInputRef,
    handleCSVUpload,
    setCsvFile,
    onCsvUploadOpen,
    downloadStudentList,
}) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 py-3 px-6 shrink-0">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                {/* Left side: status filter + search */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Dropdown
                        placement="bottom-start"
                        isOpen={statusDropdownOpen}
                        onOpenChange={(open) => setStatusDropdownOpen(open)}
                    >
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm cursor-pointer whitespace-nowrap">
                                <span className="text-gray-700 dark:text-zinc-300 capitalize">
                                    {statusFilter}
                                </span>
                                <span className="text-gray-400 dark:text-zinc-500">
                                    ({students.length})
                                </span>
                                <ChevronDown size={14} className="text-gray-400 dark:text-zinc-500" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t("aria.menus.filterByStatus")}
                            onAction={(key) => setStatusFilter(key)}
                            className="max-h-[400px] overflow-y-auto"
                        >
                            <DropdownItem
                                key="all"
                                startContent={
                                    statusFilter === "all" ? (
                                        <Check size={14} className="text-teal-600" />
                                    ) : (
                                        <span className="w-3.5"></span>
                                    )
                                }
                                endContent={
                                    <span className="text-gray-400 dark:text-zinc-500 text-xs">
                                        {statusCounts.all}
                                    </span>
                                }
                            >
                                {t("pages.allStatus1")}
                            </DropdownItem>
                            <DropdownItem
                                key="active"
                                startContent={
                                    statusFilter === "active" ? (
                                        <Check size={14} className="text-teal-600" />
                                    ) : (
                                        <span className="w-3.5"></span>
                                    )
                                }
                                endContent={
                                    <span className="text-gray-400 dark:text-zinc-500 text-xs">
                                        {statusCounts.active}
                                    </span>
                                }
                            >
                                {t("pages.active")}
                            </DropdownItem>
                            <DropdownItem
                                key="inactive"
                                startContent={
                                    statusFilter === "inactive" ? (
                                        <Check size={14} className="text-teal-600" />
                                    ) : (
                                        <span className="w-3.5"></span>
                                    )
                                }
                                endContent={
                                    <span className="text-gray-400 dark:text-zinc-500 text-xs">
                                        {statusCounts.inactive}
                                    </span>
                                }
                            >
                                {t("pages.inactive")}
                            </DropdownItem>
                            <DropdownItem
                                key="alumni"
                                startContent={
                                    statusFilter === "alumni" ? (
                                        <Check size={14} className="text-teal-600" />
                                    ) : (
                                        <span className="w-3.5"></span>
                                    )
                                }
                                endContent={
                                    <span className="text-gray-400 dark:text-zinc-500 text-xs">
                                        {statusCounts.alumni}
                                    </span>
                                }
                            >
                                {t("pages.alumni")}
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Search */}
                    <div className="flex items-center gap-2 w-full sm:max-w-[280px] px-3 py-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                        {isSearching ? (
                            <div className="w-4 h-4 border-2 border-gray-300 dark:border-zinc-600 border-t-teal-500 rounded-full animate-spin flex-shrink-0" />
                        ) : (
                            <Search size={16} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                        )}
                        <input
                            type="search"
                            name="student-search-query"
                            placeholder={t('students.form.searchNameIdPhonePlaceholder')}
                            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                            data-form-type="other"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                            >
                                <X size={14} className="text-gray-400 dark:text-zinc-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right side: bulk actions + filter tools */}
                <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap items-center">
                    {/* Bulk actions — visible only when rows are selected */}
                    {selectedCount > 0 && (
                        <Dropdown
                            isOpen={bulkDropdownOpen}
                            onOpenChange={(open) => setBulkDropdownOpen(open)}
                        >
                            <DropdownTrigger>
                                <button className="flex items-center gap-2 px-3 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-sm cursor-pointer whitespace-nowrap">
                                    <span>Actions ({selectedCount})</span>
                                    <ChevronDown size={14} />
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label={t("aria.menus.actions")}
                                className="max-h-[400px] overflow-y-auto"
                            >
                                <DropdownSection title={t("pages.academicActions")}>
                                    <DropdownItem
                                        key="promote"
                                        startContent={<ArrowUpCircle size={14} />}
                                        onPress={() => handleBulkAction("promote")}
                                    >
                                        Promote / Mark Passed Out
                                    </DropdownItem>
                                    <DropdownItem
                                        key="tc"
                                        startContent={<FileText size={14} />}
                                        onPress={() => handleBulkAction("tc")}
                                    >
                                        Generate TC
                                    </DropdownItem>
                                </DropdownSection>
                                <DropdownSection title={t("pages.statusUpdates")}>
                                    <DropdownItem
                                        key="deactivate"
                                        startContent={<UserX size={14} />}
                                        onPress={() => handleBulkAction("deactivate")}
                                    >
                                        Mark Inactive
                                    </DropdownItem>
                                    <DropdownItem
                                        key="alumni"
                                        startContent={<GraduationCap size={14} />}
                                        onPress={() => handleBulkAction("alumni")}
                                    >
                                        Mark as Alumni
                                    </DropdownItem>
                                </DropdownSection>
                                <DropdownSection title={t("pages.communication1")}>
                                    <DropdownItem
                                        key="message"
                                        startContent={<MessageSquare size={14} />}
                                        onPress={() => handleBulkAction("message")}
                                    >
                                        Send Message to Parent
                                    </DropdownItem>
                                </DropdownSection>
                                <DropdownSection title={t("pages.export1")}>
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
                    )}

                    {/* Filters dropdown */}
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

                    {/* Sort dropdown */}
                    <Dropdown
                        isOpen={sortDropdownOpen}
                        onOpenChange={(open) => setSortDropdownOpen(open)}
                    >
                        <DropdownTrigger>
                            <button className="flex items-center justify-center px-3 py-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer">
                                <ArrowUpDown size={16} className="text-gray-400 dark:text-zinc-500" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t("aria.menus.sortOptions")}
                            className="max-h-[400px] overflow-y-auto"
                        >
                            <DropdownSection title={t("pages.sortBy")}>
                                <DropdownItem
                                    key="name-asc"
                                    onPress={() =>
                                        setSortDescriptor({ column: "name", direction: "ascending" })
                                    }
                                    startContent={
                                        sortDescriptor.column === "name" &&
                                        sortDescriptor.direction === "ascending" ? (
                                            <Check size={14} className="text-teal-600" />
                                        ) : (
                                            <span className="w-3.5"></span>
                                        )
                                    }
                                >
                                    {t("pages.nameAZ")}
                                </DropdownItem>
                                <DropdownItem
                                    key="name-desc"
                                    onPress={() =>
                                        setSortDescriptor({ column: "name", direction: "descending" })
                                    }
                                    startContent={
                                        sortDescriptor.column === "name" &&
                                        sortDescriptor.direction === "descending" ? (
                                            <Check size={14} className="text-teal-600" />
                                        ) : (
                                            <span className="w-3.5"></span>
                                        )
                                    }
                                >
                                    {t("pages.nameZA")}
                                </DropdownItem>
                                <DropdownItem
                                    key="class-asc"
                                    onPress={() =>
                                        setSortDescriptor({ column: "class", direction: "ascending" })
                                    }
                                    startContent={
                                        sortDescriptor.column === "class" &&
                                        sortDescriptor.direction === "ascending" ? (
                                            <Check size={14} className="text-teal-600" />
                                        ) : (
                                            <span className="w-3.5"></span>
                                        )
                                    }
                                >
                                    {t("pages.classAscending")}
                                </DropdownItem>
                                <DropdownItem
                                    key="class-desc"
                                    onPress={() =>
                                        setSortDescriptor({
                                            column: "class",
                                            direction: "descending",
                                        })
                                    }
                                    startContent={
                                        sortDescriptor.column === "class" &&
                                        sortDescriptor.direction === "descending" ? (
                                            <Check size={14} className="text-teal-600" />
                                        ) : (
                                            <span className="w-3.5"></span>
                                        )
                                    }
                                >
                                    {t("pages.classDescending")}
                                </DropdownItem>
                            </DropdownSection>
                        </DropdownMenu>
                    </Dropdown>

                    {/* Columns dropdown */}
                    <Dropdown
                        closeOnSelect={false}
                        isOpen={columnsDropdownOpen}
                        onOpenChange={(open) => setColumnsDropdownOpen(open)}
                    >
                        <DropdownTrigger>
                            <button className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm cursor-pointer whitespace-nowrap">
                                <Columns3 size={16} className="text-gray-400 dark:text-zinc-500" />
                                <span className="text-gray-700 dark:text-zinc-300">
                                    {t("pages.columns")}
                                </span>
                                <ChevronDown size={14} className="text-gray-400 dark:text-zinc-500" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t("aria.menus.toggleColumns")}
                            closeOnSelect={false}
                            className="max-h-[400px] overflow-y-auto"
                        >
                            <DropdownSection title="Show/Hide Columns">
                                {ALL_COLUMNS.filter((col) => !col.required).map((column) => (
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

                    {/* Hidden file input (legacy path — opened by csvInputRef) */}
                    <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCSVUpload}
                    />

                    {/* More actions dropdown */}
                    <Dropdown
                        isOpen={moreDropdownOpen}
                        onOpenChange={(open) => setMoreDropdownOpen(open)}
                    >
                        <DropdownTrigger>
                            <button className="flex items-center justify-center px-3 py-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer">
                                <MoreVertical size={16} className="text-gray-400 dark:text-zinc-500" />
                            </button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={t("aria.menus.moreActions")}
                            className="max-h-[400px] overflow-y-auto"
                        >
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
    );
}
