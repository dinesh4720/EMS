import { useStudentsListData } from "./hooks/useStudentsListData";
import EditStudentDrawer from "./EditStudentDrawer";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";
import SkeletonTable from "../../components/skeletons/SkeletonTable";
import { StudentCsvUploadModal, StudentCsvPreviewModal } from "./components/modals/StudentImportModals";
import StudentsFiltersBar from "./components/list/StudentsFiltersBar";
import StudentsTableVirtualized from "./components/list/StudentsTableVirtualized";
import StudentsBulkModals from "./components/list/StudentsBulkModals";

export default function StudentsList() {
  const {
    // loading
    contextLoading, listLoading,
    // students data
    students, filteredItems, visibleItems, selectedCount, currentAcademicYear, classes,
    // filter state
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    // filter helpers
    filtersConfig, filterPresets, activeFiltersCount,
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
    localStudents, setLocalStudents,
    // refresh
    refreshStudentsList,
    // bulk modals
    isBulkActionOpen, onBulkActionClose,
    isPromoteOpen, onPromoteClose, promotionPreview,
    isReminderOpen, onReminderClose, reminderMessage, setReminderMessage, reminderTime, setReminderTime, reminderTargetCount,
    isTcModalOpen, onTcModalClose, tcStudents, setTcStudents,
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
      <div className="w-full">
        <SkeletonTable
          rows={10}
          columns={[
            { key: "student",    label: "STUDENT",     width: 240 },
            { key: "class",      label: "CLASS",       width: 100 },
            { key: "parent",     label: "PARENT INFO", width: 180 },
            { key: "attendance", label: "ATTENDANCE",  width: 110 },
            { key: "fee",        label: "FEE STATUS",  width: 100 },
            { key: "actions",    label: "ACTIONS",     width: 60  },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
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
      <StudentsTableVirtualized
        visibleItems={visibleItems}
        filteredItems={filteredItems}
        visibleColumnsArray={visibleColumnsArray}
        studentFeeStructures={studentFeeStructures}
        currentAcademicYear={currentAcademicYear}
        selectedKeys={selectedKeys}
        setSelectedKeys={setSelectedKeys}
        rowVirtualizer={rowVirtualizer}
        tableContainerRef={tableContainerRef}
        sortDescriptor={sortDescriptor}
        setSortDescriptor={setSortDescriptor}
        editingPhoneId={editingPhoneId}
        setEditingPhoneId={setEditingPhoneId}
        phoneInput={phoneInput}
        setPhoneInput={setPhoneInput}
        handleSavePhone={handleSavePhone}
        handlePinStudent={handlePinStudent}
        handleUnpinStudent={handleUnpinStudent}
        setSelectedStudent={setSelectedStudent}
        setIsEditDrawerOpen={setIsEditDrawerOpen}
        setStudentToDelete={setStudentToDelete}
        onDeleteOpen={onDeleteOpen}
        setStatusChangeData={setStatusChangeData}
        onStatusChangeOpen={onStatusChangeOpen}
        setTcStudents={setTcStudents}
        onTcModalOpen={() => {}}
        handleBulkAction={handleBulkAction}
        onPromoteOpen={() => {}}
        closeAllDropdowns={closeAllDropdowns}
      />

      {/* ── Footer: row count ──────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-zinc-700 px-6 py-3 shrink-0">
        <span className="text-default-500 text-sm">
          {filteredItems.length} student{filteredItems.length !== 1 ? "s" : ""}
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
            students.map((s) => String(s.id) === String(updatedStudent.id) ? { ...s, ...updatedStudent } : s)
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
