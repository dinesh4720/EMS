import { forwardRef } from "react";
import {
    Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
    DropdownSection, Checkbox,
} from "@heroui/react";
import {
    ArrowUpDown, MoreVertical, ChevronDown, Search, X,
    Check, Download, UserX,
    ArrowUpCircle, Columns3, MessageSquare, FileText, Trash2,
    GraduationCap, FileSpreadsheet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import FiltersDropdown from "../../../../components/FiltersDropdown";
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
    filterPresets,
    handlePresetClick,

    sortDescriptor,
    setSortDescriptor,
    sortDropdownOpen,
    setSortDropdownOpen,

    visibleColumns,
    toggleColumn,
    columnsDropdownOpen,
    setColumnsDropdownOpen,

    moreDropdownOpen,
    setMoreDropdownOpen,
    bulkDropdownOpen,
    setBulkDropdownOpen,
    csvInputRef,
    handleCSVUpload,
    setCsvFile,
    onCsvUploadOpen,
    downloadStudentList,
}, searchRef) {
    const { t } = useTranslation();

    return (
        <div className="toolbar" role="toolbar" aria-label="Students toolbar">
            {/* Search */}
            <label className="toolbar__search" style={{ flex: "0 1 280px", minWidth: 0 }}>
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
                            {count > 0 && (
                                <span className="mono tnum" style={{ marginLeft: 6, color: "var(--fg-subtle)", fontSize: 11 }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Clear-all link — shown when any filter is active.
                REVAMP-102: keeps the toolbar consistent with StaffList reference. */}
            {(activeFiltersCount > 0 || (statusFilter && statusFilter !== "active") || searchQuery) && (
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

            {/* Bulk action chip — appears once rows are selected.
                Uses shared <BulkActionBar/> for consistent count/clear behavior
                (REVAMP-101). Selection state lives in useStudentsListData for now;
                future revamp can migrate it to useBulkSelection in full. */}
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

            {/* Right-aligned tool group */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
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

                {/* Sort dropdown — minimal trigger */}
                <Dropdown isOpen={sortDropdownOpen} onOpenChange={setSortDropdownOpen}>
                    <DropdownTrigger>
                        <button type="button" className="btn" aria-label={t("aria.menus.sortOptions")}>
                            <ArrowUpDown size={13} aria-hidden />
                        </button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label={t("aria.menus.sortOptions")} className="max-h-[400px] overflow-y-auto">
                        <DropdownSection title={t("pages.sortBy")}>
                            <DropdownItem
                                key="name-asc"
                                onPress={() => setSortDescriptor({ column: "name", direction: "ascending" })}
                                startContent={sortDescriptor.column === "name" && sortDescriptor.direction === "ascending"
                                    ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5" />}
                            >{t("pages.nameAZ")}</DropdownItem>
                            <DropdownItem
                                key="name-desc"
                                onPress={() => setSortDescriptor({ column: "name", direction: "descending" })}
                                startContent={sortDescriptor.column === "name" && sortDescriptor.direction === "descending"
                                    ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5" />}
                            >{t("pages.nameZA")}</DropdownItem>
                            <DropdownItem
                                key="class-asc"
                                onPress={() => setSortDescriptor({ column: "class", direction: "ascending" })}
                                startContent={sortDescriptor.column === "class" && sortDescriptor.direction === "ascending"
                                    ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5" />}
                            >{t("pages.classAscending")}</DropdownItem>
                            <DropdownItem
                                key="class-desc"
                                onPress={() => setSortDescriptor({ column: "class", direction: "descending" })}
                                startContent={sortDescriptor.column === "class" && sortDescriptor.direction === "descending"
                                    ? <Check size={14} className="text-teal-600" /> : <span className="w-3.5" />}
                            >{t("pages.classDescending")}</DropdownItem>
                        </DropdownSection>
                    </DropdownMenu>
                </Dropdown>

                {/* Columns dropdown */}
                <Dropdown closeOnSelect={false} isOpen={columnsDropdownOpen} onOpenChange={setColumnsDropdownOpen}>
                    <DropdownTrigger>
                        <button type="button" className="btn">
                            <Columns3 size={13} aria-hidden />
                            <span className="hidden sm:inline">{t("pages.columns")}</span>
                            <ChevronDown size={11} aria-hidden />
                        </button>
                    </DropdownTrigger>
                    <DropdownMenu
                        aria-label={t("aria.menus.toggleColumns")}
                        closeOnSelect={false}
                        onAction={(key) => toggleColumn(key)}
                        className="max-h-[400px] overflow-y-auto"
                    >
                        <DropdownSection title="Show/Hide Columns">
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

                {/* Hidden file input (legacy CSV path) */}
                <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVUpload}
                />

                {/* More-actions menu (CSV import / export) */}
                <Dropdown isOpen={moreDropdownOpen} onOpenChange={setMoreDropdownOpen}>
                    <DropdownTrigger>
                        <button type="button" className="btn" aria-label={t("aria.menus.moreActions")}>
                            <MoreVertical size={13} aria-hidden />
                        </button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label={t("aria.menus.moreActions")} className="max-h-[400px] overflow-y-auto">
                        <DropdownItem
                            key="upload"
                            startContent={<FileSpreadsheet size={14} />}
                            onPress={() => { setCsvFile(null); onCsvUploadOpen(); }}
                        >Bulk Upload CSV</DropdownItem>
                        <DropdownItem
                            key="download"
                            startContent={<Download size={14} />}
                            onPress={downloadStudentList}
                        >Download List CSV</DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    );
});

export default StudentsFiltersBar;
