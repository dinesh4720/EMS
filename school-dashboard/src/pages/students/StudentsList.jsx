import { useStudentsListData } from "./hooks/useStudentsListData";
import EditStudentDrawer from "./EditStudentDrawer";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";
import { StudentCsvUploadModal, StudentCsvPreviewModal } from "./components/modals/StudentImportModals";
import StudentsFiltersBar from "./components/list/StudentsFiltersBar";
import StudentsTableVirtualized from "./components/list/StudentsTableVirtualized";
import StudentsBulkModals from "./components/list/StudentsBulkModals";
import { StudentsTableProvider } from "./components/list/StudentsTableContext";

export default function StudentsList() {
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
    bulkAction, handleBulkAction, executeBulkAction, executePromotion, executeSendReminders,
    // delete/update
    deleteStudent, updateStudent,
    // csv upload
    csvUpload,
    // helpers
    getClassOptions,
  } = useStudentsListData();

  const {
    csvFile, setCsvFile, csvDragActive, csvProcessing,
    validatedStudents, previewFilter, setPreviewFilter, importProgress,
    csvInputRef, handleCSVUpload, handleCsvFileSelect, handleCsvDrag, handleCsvDrop,
    processCsvUpload, importValidStudents, downloadStudentList, downloadSelectedStudents, downloadCsvTemplate,
  } = csvUpload;

  if (contextLoading || listLoading) {
    return (
      <div className="w-full space-y-4">
        {/* Toolbar skeleton */}
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-24 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          <div className="h-9 flex-1 max-w-xs bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
        </div>
        {/* Table skeleton */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
            <div className="w-5 h-5 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse shrink-0" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" style={{ minWidth: 240 }} />
            <div className="h-3 w-10 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" style={{ minWidth: 100 }} />
            <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" style={{ minWidth: 180 }} />
            <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" style={{ minWidth: 110 }} />
            <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" style={{ minWidth: 100 }} />
            <div className="h-3 w-8 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" style={{ minWidth: 60 }} />
          </div>
          {/* Rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-b-0">
              {/* Checkbox */}
              <div className="w-5 h-5 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse shrink-0" />
              {/* Student: avatar + name + roll */}
              <div className="flex items-center gap-3" style={{ minWidth: 240 }}>
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 rounded animate-pulse bg-gray-200 dark:bg-zinc-700" style={{ width: `${100 + (i % 3) * 30}px` }} />
                  <div className="h-2.5 w-16 rounded animate-pulse bg-gray-100 dark:bg-zinc-800" />
                </div>
              </div>
              {/* Class */}
              <div style={{ minWidth: 100 }}>
                <div className="h-3.5 w-14 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              {/* Parent info */}
              <div className="space-y-1.5" style={{ minWidth: 180 }}>
                <div className="h-3.5 rounded animate-pulse bg-gray-200 dark:bg-zinc-700" style={{ width: `${90 + (i % 4) * 20}px` }} />
                <div className="h-2.5 w-24 rounded animate-pulse bg-gray-100 dark:bg-zinc-800" />
              </div>
              {/* Attendance bar */}
              <div className="space-y-1" style={{ minWidth: 110 }}>
                <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse" style={{ width: `${50 + (i % 5) * 10}%` }} />
                </div>
                <div className="h-2.5 w-8 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              {/* Fee status chip */}
              <div style={{ minWidth: 100 }}>
                <div className="h-6 w-16 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse" />
              </div>
              {/* Actions */}
              <div style={{ minWidth: 60 }}>
                <div className="h-7 w-7 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <StudentsFiltersBar
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
        />
      </StudentsTableProvider>

      {/* ── Footer: row count ──────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-zinc-700 px-6 py-3 shrink-0">
        <span className="text-default-500 text-sm">
          {filteredItems.length === students.length
            ? `Showing ${students.length} student${students.length !== 1 ? "s" : ""}`
            : `Showing ${filteredItems.length} of ${students.length} student${students.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ── Bulk Modals ────────────────────────────────────────────────────── */}
      <StudentsBulkModals
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
    </div>
  );
}
