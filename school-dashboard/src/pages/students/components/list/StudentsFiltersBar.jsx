import { forwardRef, useState } from "react";
import { DropdownMenu, Checkbox } from "../../../../components/ui";
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

    const sortSections = [
        {
            title: t("pages.sortBy"),
            items: [
                {
                    key: "sort-name-asc",
                    label: t("pages.nameAZ"),
                    icon: sortDescriptor.column === "name" && sortDescriptor.direction === "ascending"
                        ? <Check size={14} className="text-teal-600" aria-hidden /> : <span className="w-3.5" />,
                    onClick: () => {
                        setSortDescriptor({ column: "name", direction: "ascending" });
                        setSortOpen(false);
                    },
                },
                {
                    key: "sort-name-desc",
                    label: t("pages.nameZA"),
                    icon: sortDescriptor.column === "name" && sortDescriptor.direction === "descending"
                        ? <Check size={14} className="text-teal-600" aria-hidden /> : <span className="w-3.5" />,
                    onClick: () => {
                        setSortDescriptor({ column: "name", direction: "descending" });
                        setSortOpen(false);
                    },
                },
                {
                    key: "sort-class-asc",
                    label: t("pages.classAscending"),
                    icon: sortDescriptor.column === "class" && sortDescriptor.direction === "ascending"
                        ? <Check size={14} className="text-teal-600" aria-hidden /> : <span className="w-3.5" />,
                    onClick: () => {
                        setSortDescriptor({ column: "class", direction: "ascending" });
                        setSortOpen(false);
                    },
                },
                {
                    key: "sort-class-desc",
                    label: t("pages.classDescending"),
                    icon: sortDescriptor.column === "class" && sortDescriptor.direction === "descending"
                        ? <Check size={14} className="text-teal-600" aria-hidden /> : <span className="w-3.5" />,
                    onClick: () => {
                        setSortDescriptor({ column: "class", direction: "descending" });
                        setSortOpen(false);
                    },
                },
            ],
        },
    ];

    const columnItems = ALL_COLUMNS.filter((col) => !col.required).map((column) => ({
        key: column.key,
        label: (
            <div className="flex items-center gap-2 w-full">
                {visibleColumns.has(column.key) ? (
                    <Check size={14} className="text-accent" aria-hidden />
                ) : (
                    <span className="w-3.5" />
                )}
                <span>{column.label}</span>
            </div>
        ),
        onClick: () => toggleColumn(column.key),
    }));

    const moreSections = [
        {
            title: "Actions",
            items: [
                {
                    key: "tc",
                    label: "Transfer Certificate",
                    icon: <FileText size={14} aria-hidden />,
                    onClick: () => { onNavigateToTC(); setMoreDropdownOpen(false); },
                },
            ],
        },
        {
            title: "Import / Export",
            items: [
                {
                    key: "upload",
                    label: "Bulk Upload CSV",
                    icon: <FileSpreadsheet size={14} aria-hidden />,
                    onClick: () => { setCsvFile(null); onCsvUploadOpen(); setMoreDropdownOpen(false); },
                },
                {
                    key: "download",
                    label: "Download List CSV",
                    icon: <Download size={14} aria-hidden />,
                    onClick: () => { downloadStudentList(); setMoreDropdownOpen(false); },
                },
            ],
        },
    ];

    const bulkSections = [
        {
            title: t("pages.academicActions"),
            items: [
                { key: "promote", label: "Promote / Mark Passed Out", icon: <ArrowUpCircle size={14} aria-hidden />, onClick: () => handleBulkAction("promote") },
                { key: "tc", label: "Generate TC", icon: <FileText size={14} aria-hidden />, onClick: () => handleBulkAction("tc") },
            ],
        },
        {
            title: t("pages.statusUpdates"),
            items: [
                { key: "deactivate", label: "Mark Inactive", icon: <UserX size={14} aria-hidden />, onClick: () => handleBulkAction("deactivate") },
                { key: "alumni", label: "Mark as Alumni", icon: <GraduationCap size={14} aria-hidden />, onClick: () => handleBulkAction("alumni") },
            ],
        },
        {
            title: t("pages.communication1"),
            items: [
                { key: "message", label: "Send Message to Parent", icon: <MessageSquare size={14} aria-hidden />, onClick: () => handleBulkAction("message") },
            ],
        },
        {
            title: t("pages.export1"),
            items: [
                { key: "download-selected", label: "Download Selected as CSV", icon: <Download size={14} aria-hidden />, onClick: downloadSelectedStudents },
            ],
        },
        {
            title: "Danger Zone",
            items: [
                { key: "delete", label: "Delete Selected", icon: <Trash2 size={14} aria-hidden />, isDestructive: true, onClick: () => handleBulkAction("delete") },
            ],
        },
    ];

    const rightActions = (
        <>
            {/* Sort dropdown */}
            <DropdownMenu
                ariaLabel={t("aria.menus.sortOptions")}
                menuClassName="min-w-[180px]"
                isOpen={sortOpen}
                onOpenChange={setSortOpen}
                trigger={
                    <button type="button" className="btn btn--sm">
                        <ArrowUpDown size={13} aria-hidden />
                        <span className="hidden sm:inline">{t("pages.sort")}</span>
                        <ChevronDown size={11} aria-hidden />
                    </button>
                }
                sections={sortSections}
            />

            {/* Columns dropdown */}
            <DropdownMenu
                ariaLabel={t("aria.menus.toggleColumns")}
                menuClassName="min-w-[180px]"
                closeOnSelect={false}
                isOpen={columnsOpen}
                onOpenChange={setColumnsOpen}
                trigger={
                    <button type="button" className="btn btn--sm">
                        <Columns3 size={13} aria-hidden />
                        <span className="hidden sm:inline">{t("pages.columns")}</span>
                        <ChevronDown size={11} aria-hidden />
                    </button>
                }
                sections={[{ title: t("pages.columns"), items: columnItems }]}
            />

            {/* More — data actions only */}
            <DropdownMenu
                ariaLabel="More options"
                menuClassName="min-w-[200px]"
                isOpen={moreDropdownOpen}
                onOpenChange={setMoreDropdownOpen}
                trigger={
                    <button type="button" className="btn btn--sm" aria-label="More options">
                        <MoreVertical size={13} aria-hidden />
                    </button>
                }
                sections={moreSections}
            />
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
                    role="searchbox"
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
                <DropdownMenu
                    ariaLabel={t("aria.menus.actions")}
                    menuClassName="max-h-[400px] overflow-y-auto"
                    placement="bottom-start"
                    isOpen={bulkDropdownOpen}
                    onOpenChange={(open) => setBulkDropdownOpen(open)}
                    trigger={
                        <button
                            type="button"
                            className="btn btn--sm"
                            style={{ height: 18, padding: "0 6px", fontSize: 11 }}
                        >
                            Actions <ChevronDown size={11} aria-hidden />
                        </button>
                    }
                    sections={bulkSections}
                />
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
