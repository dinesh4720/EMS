import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStudentsListData } from "./hooks/useStudentsListData";
import EditStudentDrawer from "./EditStudentDrawer";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";
import Skeleton from "../../components/ui/Skeleton";
import { StudentCsvUploadModal, StudentCsvPreviewModal } from "./components/modals/StudentImportModals";
import StudentsFiltersBar from "./components/list/StudentsFiltersBar";
import StudentsTableVirtualized from "./components/list/StudentsTableVirtualized";
import StudentsBulkModals from "./components/list/StudentsBulkModals";
import { StudentsTableProvider } from "./components/list/StudentsTableContext";
import StudentOverlay from "../../components/students/StudentOverlay";
import useStudentOverlay from "../../hooks/useStudentOverlay";

function StudentsListSkeleton() {
  return (
    <div className="w-full flex flex-col flex-1 min-h-0" aria-busy="true" aria-live="polite">
      {/* Toolbar skeleton — matches .toolbar density */}
      <div className="toolbar" role="presentation">
        <Skeleton variant="rect" className="h-7" style={{ flex: "0 1 280px" }} />
        <Skeleton variant="rect" className="h-7 w-56" />
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Skeleton variant="rect" className="h-7 w-7" />
          <Skeleton variant="rect" className="h-7 w-20" />
          <Skeleton variant="rect" className="h-7 w-7" />
        </div>
      </div>
      {/* Row skeletons — match .stafflist__row density */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4"
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <Skeleton variant="rect" className="shrink-0" style={{ width: 16, height: 16, borderRadius: 4 }} />
            <Skeleton variant="circle" className="shrink-0" style={{ width: 28, height: 28 }} />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton variant="text" className="h-3" style={{ width: `${120 + (i % 4) * 24}px` }} />
              <Skeleton variant="text" className="h-2.5 w-24" />
            </div>
            <Skeleton variant="text" className="h-3 hidden lg:block" style={{ width: 64 }} />
            <Skeleton variant="text" className="h-3 hidden lg:block" style={{ width: 100 }} />
            <Skeleton variant="rect" className="hidden lg:block" style={{ width: 56, height: 18, borderRadius: 999 }} />
            <Skeleton variant="rect" className="shrink-0" style={{ width: 24, height: 24, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentsList() {
  const { t } = useTranslation();
  const {
    // loading
    contextLoading, listLoading,
    // students data
    students, filteredItems, visibleItems, selectedCount, currentAcademicYear, classes,
    // filter state
    searchQuery, setSearchQuery, deferredSearchQuery, statusFilter, setStatusFilter,
    // filter helpers
    filtersConfig, filterPresets, activeFiltersCount, isSearching,
    handleFilterChange, handlePresetClick, clearAllFilters,
    // dropdown state
    statusDropdownOpen, setStatusDropdownOpen,
    bulkDropdownOpen, setBulkDropdownOpen,
    filtersDropdownOpen, setFiltersDropdownOpen,
    sortDropdownOpen, setSortDropdownOpen,
    columnsDropdownOpen, setColumnsDropdownOpen,
    moreDropdownOpen, setMoreDropdownOpen,
    closeAllDropdowns,
    // sort / selection
    sortDescriptor, setSortDescriptor, selectedKeys, setSelectedKeys, statusCounts,
    // column visibility
    visibleColumns, toggleColumn, visibleColumnsArray,
    // table
    tableContainerRef, rowVirtualizer,
    // fee structures
    studentFeeStructures,
    // phone editing
    editingPhoneId, setEditingPhoneId, phoneInput, setPhoneInput, handleSavePhone,
    // pin
    handlePinStudent, handleUnpinStudent,
    // edit drawer
    isEditDrawerOpen, setIsEditDrawerOpen, selectedStudent, setSelectedStudent,
    // local override
    setLocalStudents,
    // refresh
    refreshStudentsList,
    // bulk modals
    isBulkActionOpen, onBulkActionClose,
    isPromoteOpen, onPromoteOpen, onPromoteClose, promotionPreview,
    isReminderOpen, onReminderClose, reminderMessage, setReminderMessage, reminderTime, setReminderTime, reminderTargetCount,
    isTcModalOpen, onTcModalOpen, onTcModalClose, tcStudents, setTcStudents,
    isDeleteOpen, onDeleteClose, onDeleteOpen, studentToDelete, setStudentToDelete, isDeleting, setIsDeleting,
    isStatusChangeOpen, onStatusChangeClose, onStatusChangeOpen, statusChangeData, setStatusChangeData,
    isCsvUploadOpen, onCsvUploadClose, onCsvUploadOpen,
    isPreviewOpen, onPreviewClose,
    // bulk handlers
    bulkAction, handleBulkAction, executeBulkAction, executeBulkDelete, executePromotion, executeSendReminders,
    isBulkDeleteOpen, onBulkDeleteClose, bulkDeleteStudents,
    // delete/update
    deleteStudent, updateStudent,
    // csv upload
    csvUpload,
    // helpers
    getClassOptions,
  } = useStudentsListData();

  const studentOverlay = useStudentOverlay();
  const visibleRowIds = useMemo(
    () => (filteredItems || []).map((s) => String(s.id || s._id)),
    [filteredItems]
  );

  // ── Keyboard nav (UI-revamp acceptance) ──────────────────────────────────
  // "/" focuses search, "Esc" clears selection, ArrowUp/Down navigates rows
  // (using studentOverlay when present, else the filtered list cursor).
  const searchRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "Escape" && !isTyping) {
        if (selectedKeys && selectedKeys.size > 0) {
          e.preventDefault();
          setSelectedKeys(new Set([]));
        }
        return;
      }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !isTyping) {
        const ids = visibleRowIds;
        if (ids.length === 0) return;
        const activeId = studentOverlay.studentId
          ? String(studentOverlay.studentId)
          : cursorRef.current;
        const idx = activeId ? ids.indexOf(activeId) : -1;
        const nextIdx =
          e.key === "ArrowDown"
            ? Math.min(ids.length - 1, idx + 1)
            : Math.max(0, idx === -1 ? 0 : idx - 1);
        const nextId = ids[nextIdx];
        if (!nextId) return;
        e.preventDefault();
        cursorRef.current = nextId;
        if (studentOverlay.studentId) {
          studentOverlay.navigate?.(nextId);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedKeys, setSelectedKeys, visibleRowIds, studentOverlay]);

  const handleClearSelection = useCallback(
    () => setSelectedKeys(new Set([])),
    [setSelectedKeys]
  );

  const {
    csvFile, setCsvFile, csvDragActive, csvProcessing,
    validatedStudents, previewFilter, setPreviewFilter, importProgress,
    csvInputRef, handleCSVUpload, handleCsvFileSelect, handleCsvDrag, handleCsvDrop,
    processCsvUpload, importValidStudents, downloadStudentList, downloadSelectedStudents, downloadCsvTemplate,
  } = csvUpload;

  if (contextLoading || listLoading) {
    return <StudentsListSkeleton />;
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <StudentsFiltersBar
        ref={searchRef}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusDropdownOpen={statusDropdownOpen}
        setStatusDropdownOpen={setStatusDropdownOpen}
        statusCounts={statusCounts}
        students={students}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        selectedCount={selectedCount}
        bulkDropdownOpen={bulkDropdownOpen}
        setBulkDropdownOpen={setBulkDropdownOpen}
        handleBulkAction={handleBulkAction}
        downloadSelectedStudents={downloadSelectedStudents}
        onClearSelection={handleClearSelection}
        filtersConfig={filtersConfig}
        handleFilterChange={handleFilterChange}
        clearAllFilters={clearAllFilters}
        activeFiltersCount={activeFiltersCount}
        filterPresets={filterPresets}
        handlePresetClick={handlePresetClick}
        filtersDropdownOpen={filtersDropdownOpen}
        setFiltersDropdownOpen={setFiltersDropdownOpen}
        sortDescriptor={sortDescriptor}
        setSortDescriptor={setSortDescriptor}
        sortDropdownOpen={sortDropdownOpen}
        setSortDropdownOpen={setSortDropdownOpen}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
        columnsDropdownOpen={columnsDropdownOpen}
        setColumnsDropdownOpen={setColumnsDropdownOpen}
        moreDropdownOpen={moreDropdownOpen}
        setMoreDropdownOpen={setMoreDropdownOpen}
        csvInputRef={csvInputRef}
        handleCSVUpload={handleCSVUpload}
        setCsvFile={setCsvFile}
        onCsvUploadOpen={onCsvUploadOpen}
        downloadStudentList={downloadStudentList}
      />

      {/* ── Virtualized Table ─────────────────────────────────────────────── */}
      <StudentsTableProvider actions={{
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
        onClearFilters: clearAllFilters,
      }}>
        <StudentsTableVirtualized
          visibleItems={visibleItems}
          filteredItems={filteredItems}
          visibleColumnsArray={visibleColumnsArray}
          studentFeeStructures={studentFeeStructures}
          currentAcademicYear={currentAcademicYear}
          selectedKeys={selectedKeys}
          rowVirtualizer={rowVirtualizer}
          tableContainerRef={tableContainerRef}
          sortDescriptor={sortDescriptor}
          editingPhoneId={editingPhoneId}
          phoneInput={phoneInput}
          searchQuery={deferredSearchQuery}
          hasActiveFilters={activeFiltersCount > 0}
          openStudent={studentOverlay.open}
          activeStudentId={studentOverlay.studentId}
        />
      </StudentsTableProvider>

      {/* ── Footer: row count ──────────────────────────────────────────────── */}
      <div className="border-t border-border-token px-6 py-3 shrink-0">
        <span className="text-fg-muted text-sm">
          {filteredItems.length === students.length
            ? t('pages.showingStudents', { count: students.length })
            : t('pages.showingFilteredStudents', { filtered: filteredItems.length, total: students.length })}
        </span>
      </div>

      {/* ── Bulk Modals ────────────────────────────────────────────────────── */}
      <StudentsBulkModals
        isBulkDeleteOpen={isBulkDeleteOpen}
        onBulkDeleteClose={onBulkDeleteClose}
        bulkDeleteStudents={bulkDeleteStudents}
        executeBulkDelete={executeBulkDelete}
        isBulkActionOpen={isBulkActionOpen}
        onBulkActionClose={onBulkActionClose}
        bulkAction={bulkAction}
        selectedCount={selectedCount}
        executeBulkAction={executeBulkAction}
        isPromoteOpen={isPromoteOpen}
        onPromoteClose={onPromoteClose}
        promotionPreview={promotionPreview}
        executePromotion={executePromotion}
        isReminderOpen={isReminderOpen}
        onReminderClose={onReminderClose}
        reminderTargetCount={reminderTargetCount}
        reminderMessage={reminderMessage}
        setReminderMessage={setReminderMessage}
        reminderTime={reminderTime}
        setReminderTime={setReminderTime}
        executeSendReminders={executeSendReminders}
        isTcModalOpen={isTcModalOpen}
        onTcModalClose={onTcModalClose}
        tcStudents={tcStudents}
        setSelectedKeys={setSelectedKeys}
        isDeleteOpen={isDeleteOpen}
        onDeleteClose={onDeleteClose}
        studentToDelete={studentToDelete}
        setStudentToDelete={setStudentToDelete}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        deleteStudent={deleteStudent}
        refreshStudentsList={refreshStudentsList}
        isStatusChangeOpen={isStatusChangeOpen}
        onStatusChangeClose={onStatusChangeClose}
        statusChangeData={statusChangeData}
        setStatusChangeData={setStatusChangeData}
        updateStudent={updateStudent}
      />

      {/* ── CSV Upload Modal ───────────────────────────────────────────────── */}
      <StudentCsvUploadModal
        isOpen={isCsvUploadOpen}
        onClose={onCsvUploadClose}
        csvFile={csvFile}
        setCsvFile={setCsvFile}
        csvDragActive={csvDragActive}
        csvInputRef={csvInputRef}
        csvProcessing={csvProcessing}
        handleCsvDrag={handleCsvDrag}
        handleCsvDrop={handleCsvDrop}
        handleCsvFileSelect={handleCsvFileSelect}
        downloadCsvTemplate={downloadCsvTemplate}
        processCsvUpload={processCsvUpload}
      />

      {/* ── CSV Preview Modal ──────────────────────────────────────────────── */}
      <StudentCsvPreviewModal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        validatedStudents={validatedStudents}
        previewFilter={previewFilter}
        setPreviewFilter={setPreviewFilter}
        csvProcessing={csvProcessing}
        importProgress={importProgress}
        importValidStudents={importValidStudents}
      />

      {/* ── Edit Student Drawer ────────────────────────────────────────────── */}
      <EditStudentDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => { setIsEditDrawerOpen(false); setSelectedStudent(null); }}
        student={selectedStudent}
        onUpdate={(updatedStudent) => {
          setLocalStudents(
            students.map((st) => String(st.id) === String(updatedStudent.id) ? { ...st, ...updatedStudent } : st)
          );
          setSelectedStudent(updatedStudent);
        }}
        classOptions={getClassOptions()}
        classesWithTeachers={classes}
      />

      <ScrollToTopButton />

      <StudentOverlay
        studentId={studentOverlay.studentId}
        rowIds={visibleRowIds}
        onClose={studentOverlay.close}
        onNavigate={studentOverlay.navigate}
      />
    </div>
  );
}
