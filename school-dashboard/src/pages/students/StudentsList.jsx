import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
// Translations removed — all text is plain English to match StaffList style
import { Plus, Users, Printer } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/common/Pagination";
import { useNavigate } from "react-router-dom";
import { useStudentsListData } from "./hooks/useStudentsListData";
import EditStudentDrawer from "./EditStudentDrawer";
import ScrollToTopButton from "../../components/ui/ScrollToTopButton";
import Skeleton from "../../components/ui/Skeleton";
import { StudentCsvUploadModal, StudentCsvPreviewModal } from "./components/modals/StudentImportModals";
import { PageShell } from "../../components/ui";
import StudentsFiltersBar from "./components/list/StudentsFiltersBar";
import StudentsBulkModals from "./components/list/StudentsBulkModals";
// Removed StudentsTableProvider — no longer needed with row-list layout
import StudentListRow from "./StudentListRow";
import StudentDetailPane from "./StudentDetailPane";
import ExportMenu from "../../components/ui/ExportMenu";
import PrintPreviewModal from "../../components/ui/PrintPreviewModal";
import toast from "react-hot-toast";

// Mobile breakpoint — below this the right pane collapses to a Drawer
const MOBILE_MAX = 1099;

function StudentsListSkeleton() {
  return (
    <div className="w-full flex flex-col flex-1 min-h-0" aria-busy="true" aria-live="polite">
      {/* Row skeletons */}
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

export default function StudentsList({ onAddStudent }) {
  const navigate = useNavigate();
  const {
    // loading
    contextLoading, listLoading,
    // students data
    students, filteredItems, visibleItems, selectedCount, classes,
    // filter state
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    // filter helpers
    filtersConfig, activeFiltersCount, isSearching,
    handleFilterChange, clearAllFilters,
    // dropdown state
    bulkDropdownOpen, setBulkDropdownOpen,
    moreDropdownOpen, setMoreDropdownOpen,
    // sort / selection
    sortDescriptor, setSortDescriptor, selectedKeys, setSelectedKeys, statusCounts,
    // column visibility
    visibleColumns, toggleColumn,
    // edit drawer
    isEditDrawerOpen, setIsEditDrawerOpen, selectedStudent, setSelectedStudent,
    // local override
    setLocalStudents,
    // refresh
    refreshStudentsList,
    // bulk modals
    isBulkActionOpen, onBulkActionClose,
    isPromoteOpen, onPromoteClose, promotionPreview,
    isReminderOpen, onReminderClose, reminderMessage, setReminderMessage, reminderTime, setReminderTime, reminderTargetCount,
    isTcModalOpen, onTcModalClose, tcStudents,
    isDeleteOpen, onDeleteClose, studentToDelete, setStudentToDelete, isDeleting, setIsDeleting,
    isStatusChangeOpen, onStatusChangeClose, statusChangeData, setStatusChangeData,
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

  // ============ Routing (URL-driven selection) ============
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id") || null;

  const setSelectedId = useCallback(
    (id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("id", id);
          else next.delete("id");
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  // ============ Mobile viewport detection ============
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth <= MOBILE_MAX
      : false
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= MOBILE_MAX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ============ Selected student ============
  const selectedStudentRecord = useMemo(() => {
    if (!selectedId) return null;
    return visibleItems.find((st) => String(st.id || st._id) === selectedId) || null;
  }, [selectedId, visibleItems]);

  const handleViewProfile = useCallback(
    (student) => {
      const id = student.id || student._id;
      navigate(`/students/${id}`);
    },
    [navigate]
  );

  // Auto-select first visible student on desktop when nothing is selected
  useEffect(() => {
    if (isMobileViewport) return;
    if (selectedId) return;
    if (visibleItems.length === 0) return;
    const first = visibleItems[0];
    const firstId = String(first.id || first._id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("id", firstId);
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileViewport, selectedId, visibleItems.length]);

  // ============ Keyboard nav ============
  const listRef = useRef(null);
  const rowRefs = useRef(new Map());

  const moveSelection = useCallback(
    (delta) => {
      if (paginatedItems.length === 0) return;
      const ids = paginatedItems.map((st) => String(st.id || st._id));
      const currentIdx = ids.indexOf(selectedId);
      const nextIdx =
        currentIdx === -1
          ? delta > 0
            ? 0
            : paginatedItems.length - 1
          : Math.min(paginatedItems.length - 1, Math.max(0, currentIdx + delta));
      const nextStudent = paginatedItems[nextIdx];
      if (!nextStudent) return;
      const nextId = String(nextStudent.id || nextStudent._id);
      setSelectedId(nextId);
      requestAnimationFrame(() => {
        rowRefs.current.get(nextId)?.scrollIntoView({ block: "nearest" });
        rowRefs.current.get(nextId)?.focus({ preventScroll: true });
      });
    },
    [paginatedItems, selectedId, setSelectedId]
  );

  const handleListKeyDown = useCallback(
    (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedStudentRecord) {
          handleViewProfile(selectedStudentRecord);
        }
      } else if (e.key === "Escape") {
        if (selectedCount > 0) {
          setSelectedKeys(new Set([]));
          return;
        }
        e.preventDefault();
        setSelectedId(null);
      }
    },
    [moveSelection, setSelectedId, selectedCount, setSelectedKeys, selectedStudentRecord, handleViewProfile]
  );

  // ============ Bulk toggle ============
  const toggleCheck = useCallback(
    (student, event) => {
      const id = String(student.id || student._id);
      if (event?.shiftKey) {
        // Simple range select
        const ids = visibleItems.map((st) => String(st.id || st._id));
        const lastId = rowRefs.current.get("__lastClicked__");
        if (lastId) {
          const idxA = ids.indexOf(lastId);
          const idxB = ids.indexOf(id);
          if (idxA !== -1 && idxB !== -1) {
            const [lo, hi] = idxA < idxB ? [idxA, idxB] : [idxB, idxA];
            const newKeys = new Set(selectedKeys);
            for (let i = lo; i <= hi; i++) {
              newKeys.add(ids[i]);
            }
            setSelectedKeys(newKeys);
            rowRefs.current.set("__lastClicked__", id);
            return;
          }
        }
      }
      const newKeys = new Set(selectedKeys);
      if (newKeys.has(id)) newKeys.delete(id);
      else newKeys.add(id);
      setSelectedKeys(newKeys);
      rowRefs.current.set("__lastClicked__", id);
    },
    [visibleItems, selectedKeys, setSelectedKeys]
  );

  const handleClearSelection = useCallback(
    () => setSelectedKeys(new Set([])),
    [setSelectedKeys]
  );

  const handleMessageParent = useCallback(() => {
    if (!selectedStudentRecord) return;
    const parentPhone = selectedStudentRecord.parentPhone || selectedStudentRecord.fatherPhone || selectedStudentRecord.motherPhone;
    const parentEmail = selectedStudentRecord.parentEmail || selectedStudentRecord.fatherEmail || selectedStudentRecord.motherEmail;
    if (!parentPhone && !parentEmail) {
      toast("No parent contact available.");
      return;
    }
    navigate(`/messaging?to=${encodeURIComponent(parentPhone || parentEmail)}`);
  }, [selectedStudentRecord, navigate]);

  const closeDetail = () => setSelectedId(null);
  const detailVisible = !!selectedStudentRecord;

  // ============ Pagination ============
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(visibleItems.length / pageSize)),
    [visibleItems.length, pageSize]
  );

  const paginatedItems = useMemo(
    () => visibleItems.slice((page - 1) * pageSize, page * pageSize),
    [visibleItems, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, activeFiltersCount]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const {
    csvFile, setCsvFile, csvDragActive, csvProcessing,
    validatedStudents, previewFilter, setPreviewFilter, importProgress,
    csvInputRef, handleCSVUpload, handleCsvFileSelect, handleCsvDrag, handleCsvDrop,
    processCsvUpload, importValidStudents, downloadStudentList, downloadSelectedStudents, downloadCsvTemplate,
  } = csvUpload;

  const [printOpen, setPrintOpen] = useState(false);

  if (contextLoading || listLoading) {
    return (
      <PageShell
        title="Students"
        description="Loading…"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Students" }]}
        bodyPadding="none"
        scrollable={false}
      >
        <StudentsListSkeleton />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Students"
      description={`${filteredItems.length} of ${students.length}`}
      actions={
        <div className="row gap-2">
          <ExportMenu
            rows={visibleItems}
            columns={[
              { key: "name", label: "Name" },
              { key: "admissionNo", label: "Admission No", accessor: (s) => s.admissionNo || s.admissionNumber || "—" },
              { key: "className", label: "Class", accessor: (s) => s.className || s.class || s.classSection || "—" },
              { key: "rollNo", label: "Roll No", accessor: (s) => s.rollNo || s.rollNumber || "—" },
              { key: "gender", label: "Gender", accessor: (s) => s.gender || "—" },
              { key: "parentPhone", label: "Parent Phone", accessor: (s) => s.parentPhone || s.fatherPhone || s.motherPhone || "—" },
              { key: "parentEmail", label: "Parent Email", accessor: (s) => s.parentEmail || s.fatherEmail || s.motherEmail || "—" },
              { key: "status", label: "Status", accessor: (s) => s.status || "active" },
            ]}
            filename="students-list"
            title="Students List"
          />
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setPrintOpen(true)}
            aria-label="Print preview"
          >
            <Printer size={14} aria-hidden />
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={onAddStudent}
          >
            <Plus size={13} aria-hidden />
            New Student
          </button>
        </div>
      }
      toolbar={
        <StudentsFiltersBar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusCounts={statusCounts}
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
          sortDescriptor={sortDescriptor}
          setSortDescriptor={setSortDescriptor}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          moreDropdownOpen={moreDropdownOpen}
          setMoreDropdownOpen={setMoreDropdownOpen}
          csvInputRef={csvInputRef}
          handleCSVUpload={handleCSVUpload}
          setCsvFile={setCsvFile}
          onCsvUploadOpen={onCsvUploadOpen}
          downloadStudentList={downloadStudentList}
          onNavigateToTC={() => navigate('/students/transfer-certificate')}
        />
      }
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Students" }]}
      bodyPadding="none"
      scrollable={false}
    >
      <div
        style={
          isMobileViewport
            ? { display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }
            : {
                display: "grid",
                gridTemplateColumns: "minmax(420px, 1fr) 380px",
                gap: 0,
                minHeight: 0,
                flex: 1,
              }
        }
      >
        {/* Left list */}
        <div
          style={{
            borderRight: isMobileViewport ? "none" : "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >

        {/* List rows */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Student list"
          tabIndex={0}
          onKeyDown={handleListKeyDown}
          style={{
            flex: 1,
            overflow: "auto",
            outline: "none",
            minHeight: 0,
          }}
        >
          {visibleItems.length === 0 ? (
            <EmptyState
              icon={Users}
              title={students.length === 0 ? "No students yet" : "No students matched"}
              description={
                students.length === 0
                  ? "Get started by adding your first student."
                  : activeFiltersCount > 0 || searchQuery
                  ? "Try adjusting your filters or search query."
                  : "No students found for the current view."
              }
              action={
                students.length === 0 ? (
                  <button type="button" className="btn btn--accent" onClick={onAddStudent}>
                    <Plus size={13} aria-hidden /> New Student
                  </button>
                ) : (
                  <button type="button" className="btn btn--ghost" onClick={clearAllFilters}>
                    Clear filters
                  </button>
                )
              }
              size="md"
            />
          ) : (
            paginatedItems.map((student) => {
              const id = String(student.id || student._id);
              return (
                <StudentListRow
                  key={id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(id, el);
                    else rowRefs.current.delete(id);
                  }}
                  student={student}
                  isActive={selectedId === id}
                  isChecked={selectedKeys.has(id)}
                  onSelect={() => setSelectedId(id)}
                  onToggleCheck={toggleCheck}
                  onViewProfile={handleViewProfile}
                  attendancePct={student.attendancePercentage}
                />
              );
            })
          )}
        </div>

        {/* Pagination footer */}
        {visibleItems.length > 0 && (
          <div
            className="flex items-center justify-between px-4 py-2 border-t"
            style={{ borderColor: "var(--divider)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--fg-muted)" }}>Show</span>
              <select
                className="select select--sm"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                aria-label="Items per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm" style={{ color: "var(--fg-muted)" }}>per page</span>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={visibleItems.length}
              itemLabel="students"
            />
          </div>
        )}

      </div>

      {/* Right detail pane — desktop only */}
      {!isMobileViewport && (
        <StudentDetailPane
          student={selectedStudentRecord}
          onClose={closeDetail}
          onViewProfile={() => selectedStudentRecord && handleViewProfile(selectedStudentRecord)}
          onMessageParent={handleMessageParent}
        />
      )}

      {/* Mobile: slide-over drawer for detail */}
      {isMobileViewport && detailVisible && (
        <div
          className="stafflist__drawer-overlay"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            className="stafflist__drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Profile: ${selectedStudentRecord?.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <StudentDetailPane
              student={selectedStudentRecord}
              isMobile
              onClose={closeDetail}
              onViewProfile={() => selectedStudentRecord && handleViewProfile(selectedStudentRecord)}
              onMessageParent={handleMessageParent}
            />
          </div>
        </div>
      )}

      {/* ── Bulk Modals ── */}
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

      {/* ── CSV Upload Modal ── */}
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

      {/* ── CSV Preview Modal ── */}
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

      {/* ── Edit Student Drawer ── */}
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

      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Students List"
      >
        <div className="p-6">
          <h1 className="text-lg font-semibold mb-4">Students List</h1>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Admission No</th>
                <th className="text-left py-2 px-3">Class</th>
                <th className="text-left py-2 px-3">Roll No</th>
                <th className="text-left py-2 px-3">Gender</th>
                <th className="text-left py-2 px-3">Parent Phone</th>
                <th className="text-left py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((s) => (
                <tr key={s.id || s._id} className="border-b">
                  <td className="py-2 px-3">{s.name}</td>
                  <td className="py-2 px-3">{s.admissionNo || s.admissionNumber || "—"}</td>
                  <td className="py-2 px-3">{s.className || s.class || s.classSection || "—"}</td>
                  <td className="py-2 px-3">{s.rollNo || s.rollNumber || "—"}</td>
                  <td className="py-2 px-3">{s.gender || "—"}</td>
                  <td className="py-2 px-3">{s.parentPhone || s.fatherPhone || s.motherPhone || "—"}</td>
                  <td className="py-2 px-3">{s.status || "active"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>
    </PageShell>
  );
}
