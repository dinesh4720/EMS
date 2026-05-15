import { forwardRef, useState } from "react";
import {
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    DropdownSection, Checkbox,
} from "@heroui/react";
import {
    MoreVertical, ChevronDown, Search, X,
    ArrowUpDown, Columns3,
    Check, Download, UserX,
    ArrowUpCircle, MessageSquare, FileText, Trash2,
    GraduationCap, FileSpreadsheet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import FilterPillsBar from "../../../../components/ui/FilterPillsBar";

import BulkActionBar from "../../../../components/ui/BulkActionBar";
import { ALL_COLUMNS } from "../../utils/studentImportUtils";

// Segmented status filter — primary states. Less-common statuses (graduated,
// transferred) sit behind the More menu so the toolbar stays calm on mobile.
const STATUS_SEGMENTS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
    { key: "alumni", label: "Alumni" },
];

const StudentsFiltersBar = forwardRef(function StudentsFiltersBar({
    statusFilter,
    setStatusFilter,
    statusCounts,

    searchQuery,
    setSearchQuery,
    isSearching = false,

    selectedCount,
    handleBulkAction,
    downloadSelectedStudents,
    onClearSelection,

    filtersConfig,
    handleFilterChange,
    clearAllFilters,
    activeFiltersCount,

    sortDescriptor,
    setSortDescriptor,

    visibleColumns,
    toggleColumn,

    moreDropdownOpen,
    setMoreDropdownOpen,
    bulkDropdownOpen,
    setBulkDropdownOpen,
    csvInputRef,
    handleCSVUpload,
    setCsvFile,
    onCsvUploadOpen,
    downloadStudentList,
    onNavigateToTC,
}, searchRef) {
    const { t } = useTranslation();
    const [sortOpen, setSortOpen] = useState(false);
    const [columnsOpen, setColumnsOpen] = useState(false);

    // Clear only clears search and pill filters — status segments are primary
    // navigation tabs, not filters that need clearing.
    const showClear = activeFiltersCount > 0 || searchQuery;

    const rightActions = (
        <>
            {/* Sort dropdown */}
            <Dropdown isOpen={sortOpen} onOpenChange={setSortOpen}>
                <DropdownTrigger>
                    <button type="button" className="btn btn--sm">
                        <ArrowUpDown size={13} aria-hidden />
                        <span className="hidden sm:inline">{t("pages.sort")}</span>
                        <ChevronDown size={11} aria-hidden />
                    </button>
                </DropdownTrigger>
                <DropdownMenu aria-label={t("aria.menus.sortOptions")} className="min-w-[180px]">
                    <DropdownSection title={t("pages.sortBy")}>
                        <DropdownItem
                            key="sort-name-asc"
                            onPress={() => {
                                setSortDescriptor({ column: "name", direction: "ascending" });
                                setSortOpen(false);
                            }}
                            startContent={sortDescriptor.column === "name" && sortDescriptor.direction === "ascending"
                                ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5" />}
                        >{t("pages.nameAZ")}</DropdownItem>
                        <DropdownItem
                            key="sort-name-desc"
                            onPress={() => {
                                setSortDescriptor({ column: "name", direction: "descending" });
                                setSortOpen(false);
                            }}
                            startContent={sortDescriptor.column === "name" && sortDescriptor.direction === "descending"
                                ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5" />}
                        >{t("pages.nameZA")}</DropdownItem>
                        <DropdownItem
                            key="sort-class-asc"
                            onPress={() => {
                                setSortDescriptor({ column: "class", direction: "ascending" });
                                setSortOpen(false);
                            }}
                            startContent={sortDescriptor.column === "class" && sortDescriptor.direction === "ascending"
                                ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5" />}
                        >{t("pages.classAscending")}</DropdownItem>
                        <DropdownItem
                            key="sort-class-desc"
                            onPress={() => {
                                setSortDescriptor({ column: "class", direction: "descending" });
                                setSortOpen(false);
                            }}
                            startContent={sortDescriptor.column === "class" && sortDescriptor.direction === "descending"
                                ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5" />}
                        >{t("pages.classDescending")}</DropdownItem>
                    </DropdownSection>
                </DropdownMenu>
            </Dropdown>

            {/* Columns dropdown */}
            <Dropdown closeOnSelect={false} isOpen={columnsOpen} onOpenChange={setColumnsOpen}>
                <DropdownTrigger>
                    <button type="button" className="btn btn--sm">
                        <Columns3 size={13} aria-hidden />
                        <span className="hidden sm:inline">{t("pages.columns")}</span>
                        <ChevronDown size={11} aria-hidden />
                    </button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label={t("aria.menus.toggleColumns")}
                    closeOnSelect={false}
                    onAction={(key) => toggleColumn(key)}
                    className="min-w-[180px]"
                >
                    <DropdownSection title={t("pages.columns")}>
                        {ALL_COLUMNS.filter((col) => !col.required).map((column) => (
                            <DropdownItem key={column.key} textValue={column.label}>
                                <div className="flex items-center gap-2 w-full">
                                    <Checkbox
                                        isSelected={visibleColumns.has(column.key)}
                                        size="sm"
                                        tabIndex={-1}
                                        classNames={{ wrapper: "pointer-events-none" }}
                                    />
                                    <span>{column.label}</span>
                                </div>
                            </DropdownItem>
                        ))}
                    </DropdownSection>
                </DropdownMenu>
            </Dropdown>

            {/* More — data actions only */}
            <Dropdown isOpen={moreDropdownOpen} onOpenChange={setMoreDropdownOpen}>
                <DropdownTrigger>
                    <button type="button" className="btn btn--sm" aria-label="More options">
                        <MoreVertical size={13} aria-hidden />
                    </button>
                </DropdownTrigger>
                <DropdownMenu aria-label="More options" className="min-w-[200px]">
                    <DropdownSection title="Actions">
                        <DropdownItem
                            key="tc"
                            startContent={<FileText size={14} />}
                            onPress={() => { onNavigateToTC(); setMoreDropdownOpen(false); }}
                        >Transfer Certificate</DropdownItem>
                    </DropdownSection>
                    <DropdownSection title="Import / Export">
                        <DropdownItem
                            key="upload"
                            startContent={<FileSpreadsheet size={14} />}
                            onPress={() => { setCsvFile(null); onCsvUploadOpen(); setMoreDropdownOpen(false); }}
                        >Bulk Upload CSV</DropdownItem>
                        <DropdownItem
                            key="download"
                            startContent={<Download size={14} />}
                            onPress={() => { downloadStudentList(); setMoreDropdownOpen(false); }}
                        >Download List CSV</DropdownItem>
                    </DropdownSection>
                </DropdownMenu>
            </Dropdown>
        </>
    );

    return (
        <>
        <div className="toolbar" role="toolbar" aria-label="Students toolbar">
            {/* Status segmented filter */}
            <div className="seg" role="tablist" aria-label="Filter by status">
                {STATUS_SEGMENTS.map((s) => {
                    const count = statusCounts?.[s.key] ?? 0;
                    return (
                        <button
                            key={s.key}
                            type="button"
                            role="tab"
                            aria-selected={statusFilter === s.key}
                            className={`seg__btn ${statusFilter === s.key ? "is-active" : ""}`}
                            onClick={() => setStatusFilter(s.key)}
                        >
                            {s.label}
                            <span className="mono tnum" style={{ marginLeft: 6, color: "var(--fg-subtle)", fontSize: 11 }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <label className="toolbar__search" style={{ flex: "0 1 280px", minWidth: 0, marginLeft: "auto" }}>
                {isSearching ? (
                    <span
                        aria-hidden
                        style={{
                            width: 13, height: 13, flexShrink: 0,
                            border: "1.5px solid var(--border)",
                            borderTopColor: "var(--accent)",
                            borderRadius: "50%",
                            animation: "spin 600ms linear infinite",
                        }}
                    />
                ) : (
                    <Search size={13} style={{ color: "var(--fg-subtle)", flexShrink: 0 }} aria-hidden />
                )}
                <input
                    ref={searchRef}
                    type="search"
                    name="student-search-query"
                    placeholder={t('students.form.searchNameIdPhonePlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search students"
                    autoComplete="off"
                />
                {searchQuery ? (
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                        className="iconbtn"
                        style={{ width: 18, height: 18 }}
                    >
                        <X size={12} aria-hidden />
                    </button>
                ) : (
                    <span className="kbd" aria-hidden>/</span>
                )}
            </label>

            {/* Clear-all link — shown when any filter is active. */}
            {showClear && (
                <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                        clearAllFilters();
                        setSearchQuery("");
                    }}
                    style={{ color: "var(--fg-muted)" }}
                    aria-label="Clear all filters"
                >
                    Clear
                </button>
            )}

            {/* Bulk action chip — appears once rows are selected. */}
            <BulkActionBar
                selection={{
                    count: selectedCount,
                    visibleCount: selectedCount,
                    allMatchingMode: false,
                    allVisibleSelected: true,
                    someVisibleSelected: false,
                    clear: onClearSelection,
                    selectAllMatching: () => {},
                }}
            >
                <Dropdown
                    isOpen={bulkDropdownOpen}
                    onOpenChange={(open) => setBulkDropdownOpen(open)}
                    placement="bottom-start"
                >
                    <DropdownTrigger>
                        <button
                            type="button"
                            className="btn btn--sm"
                            style={{ height: 18, padding: "0 6px", fontSize: 11 }}
                        >
                            Actions <ChevronDown size={11} aria-hidden />
                        </button>
                    </DropdownTrigger>
                    <DropdownMenu
                        aria-label={t("aria.menus.actions")}
                        className="max-h-[400px] overflow-y-auto"
                    >
                        <DropdownSection title={t("pages.academicActions")}>
                            <DropdownItem key="promote" startContent={<ArrowUpCircle size={14} />} onPress={() => handleBulkAction("promote")}>
                                Promote / Mark Passed Out
                            </DropdownItem>
                            <DropdownItem key="tc" startContent={<FileText size={14} />} onPress={() => handleBulkAction("tc")}>
                                Generate TC
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title={t("pages.statusUpdates")}>
                            <DropdownItem key="deactivate" startContent={<UserX size={14} />} onPress={() => handleBulkAction("deactivate")}>
                                Mark Inactive
                            </DropdownItem>
                            <DropdownItem key="alumni" startContent={<GraduationCap size={14} />} onPress={() => handleBulkAction("alumni")}>
                                Mark as Alumni
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title={t("pages.communication1")}>
                            <DropdownItem key="message" startContent={<MessageSquare size={14} />} onPress={() => handleBulkAction("message")}>
                                Send Message to Parent
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title={t("pages.export1")}>
                            <DropdownItem key="download-selected" startContent={<Download size={14} />} onPress={downloadSelectedStudents}>
                                Download Selected as CSV
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title="Danger Zone">
                            <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 size={14} />} onPress={() => handleBulkAction("delete")}>
                                Delete Selected
                            </DropdownItem>
                        </DropdownSection>
                    </DropdownMenu>
                </Dropdown>
            </BulkActionBar>

            {/* Hidden file input (legacy CSV path) */}
            <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVUpload}
            />
        </div>

        {/* Filter pills bar — active filters + add filter + view controls */}
        <FilterPillsBar
            filters={filtersConfig}
            onFilterChange={handleFilterChange}
            onClearAll={clearAllFilters}
            activeFiltersCount={activeFiltersCount}
            rightActions={rightActions}
        />
        </>
    );
});

export default StudentsFiltersBar;
