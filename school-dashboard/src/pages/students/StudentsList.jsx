import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, Upload, FileText, Printer, FileSpreadsheet } from "lucide-react";
import { useStudentsListData } from "./hooks/useStudentsListData";
import StudentsDataGrid from "./StudentsDataGrid";
import AttendanceBar from "../../components/dataGrid/AttendanceBar";
import AttendanceBoard from "../../components/dataGrid/AttendanceBoard";
import CreateStudentComposer from "./CreateStudentComposer";
import { buildAttendanceBoard } from "../classes/utils/classesGridHelpers";
import { useApp } from "../../context/AppContext";
import EditStudentDrawer from "./EditStudentDrawer";
import { StudentCsvUploadModal, StudentCsvPreviewModal } from "./components/modals/StudentImportModals";
import StudentsBulkModals from "./components/list/StudentsBulkModals";
import PrintPreviewModal from "../../components/ui/PrintPreviewModal";

const sid = (s) => String(s.id || s._id);
const isDefaulter = (s) => {
  const bal = Number(s.balanceAmount ?? s.balance ?? 0);
  const fs = String(s.feeStatus || "").toLowerCase();
  return bal > 0 || fs === "overdue" || fs === "partial" || fs === "pending";
};
const menuIcon = (Icon) => <Icon size={15} color="#6a6e78" aria-hidden />;

export default function StudentsList({ onAddStudent }) {
  const navigate = useNavigate();
  const {
    listLoading, listError,
    students, visibleItems,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    feeStatusFilter, activeFiltersCount, handleFilterChange, clearAllFilters,
    selectedKeys, setSelectedKeys,
    refreshStudentsList,
    handlePinStudent, handleUnpinStudent,
    // edit drawer
    isEditDrawerOpen, setIsEditDrawerOpen, selectedStudent, setSelectedStudent,
    setLocalStudents,
    // bulk modals
    isBulkActionOpen, onBulkActionClose,
    isPromoteOpen, onPromoteClose, promotionPreview,
    isReminderOpen, onReminderClose, reminderMessage, setReminderMessage, reminderTime, setReminderTime, reminderTargetCount,
    isTcModalOpen, onTcModalClose, tcStudents,
    isDeleteOpen, onDeleteClose, onDeleteOpen, studentToDelete, setStudentToDelete, isDeleting, setIsDeleting,
    isStatusChangeOpen, onStatusChangeClose, statusChangeData, setStatusChangeData,
    isCsvUploadOpen, onCsvUploadClose, onCsvUploadOpen,
    isPreviewOpen, onPreviewClose,
    // bulk handlers
    bulkAction, handleBulkAction, executeBulkAction, executeBulkDelete, executePromotion, executeSendReminders,
    isBulkDeleteOpen, onBulkDeleteClose, bulkDeleteStudents,
    deleteStudent, updateStudent,
    csvUpload,
    getClassOptions,
    classes,
    currentAcademicYear,
  } = useStudentsListData();
  const { addStudent } = useApp();
  const [createOpen, setCreateOpen] = useState(false);

  // This grid manages all status views client-side, so keep the dataset complete.
  useEffect(() => {
    if (statusFilter !== "all") setStatusFilter("all");
  }, [statusFilter, setStatusFilter]);

  const {
    csvFile, setCsvFile, csvDragActive, csvProcessing,
    validatedStudents, previewFilter, setPreviewFilter, importProgress,
    csvInputRef, handleCsvFileSelect, handleCsvDrag, handleCsvDrop,
    processCsvUpload, importValidStudents, downloadStudentList, downloadSelectedStudents, downloadCsvTemplate,
  } = csvUpload;

  // Status dropdown (replaces the old tab bar) + dues-only filter toggle.
  const [statusSel, setStatusSel] = useState("active");
  const [duesOnly, setDuesOnly] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);

  const board = useMemo(() => buildAttendanceBoard(classes || []), [classes]);

  const isStatus = (s, key) => {
    const st = String(s.status || "active").toLowerCase();
    if (key === "active") return st === "active";
    if (key === "inactive") return st === "inactive" || st === "suspended";
    if (key === "alumni") return st === "alumni" || st === "graduated";
    return true;
  };

  // Counts over the full loaded dataset.
  const counts = useMemo(() => ({
    all: students.length,
    active: students.filter((s) => isStatus(s, "active")).length,
    inactive: students.filter((s) => isStatus(s, "inactive")).length,
    alumni: students.filter((s) => isStatus(s, "alumni")).length,
    defaulters: students.filter(isDefaulter).length,
  }), [students]);

  const statusOptions = useMemo(() => ([
    { key: "active", label: "Active", count: counts.active, dot: "#37985f" },
    { key: "inactive", label: "Inactive", count: counts.inactive, dot: "#b3b7bf" },
    { key: "alumni", label: "Alumni", count: counts.alumni, dot: "#2a9bb5" },
  ]), [counts]);

  // ── Displayed list (status dropdown + optional dues filter) ───────────────
  const displayed = useMemo(() => {
    let list = visibleItems.filter((s) => isStatus(s, statusSel));
    if (duesOnly) list = list.filter(isDefaulter);
    return list;
  }, [visibleItems, statusSel, duesOnly]);

  const totalDue = useMemo(
    () => displayed.reduce((sum, s) => sum + Number(s.balanceAmount ?? s.balance ?? 0), 0),
    [displayed]
  );
  const avgAtt = useMemo(() => {
    const vals = displayed.map((s) => Number(s.attendancePercentage)).filter(Number.isFinite);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }, [displayed]);
  const attTracked = useMemo(
    () => displayed.filter((s) => Number.isFinite(Number(s.attendancePercentage))).length,
    [displayed]
  );

  // ── Selection ─────────────────────────────────────────────────────────────
  const onToggleRow = useCallback((id) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [setSelectedKeys]);

  const onToggleAll = useCallback((ids) => {
    setSelectedKeys((prev) => {
      const allOn = ids.length > 0 && ids.every((id) => prev.has(id));
      return allOn ? new Set() : new Set(ids);
    });
  }, [setSelectedKeys]);

  const onClearSelection = useCallback(() => setSelectedKeys(new Set()), [setSelectedKeys]);

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const onBulkAction = useCallback((key) => {
    if (selectedKeys.size === 0) {
      toast("Select one or more students first.");
      return;
    }
    if (key === "export") { downloadSelectedStudents(); return; }
    handleBulkAction(key);
  }, [selectedKeys, downloadSelectedStudents, handleBulkAction]);

  // ── Row actions ───────────────────────────────────────────────────────────
  const onOpenStudent = useCallback((student) => navigate(`/students/${sid(student)}`), [navigate]);
  const onEditStudent = useCallback((student) => { setSelectedStudent(student); setIsEditDrawerOpen(true); }, [setSelectedStudent, setIsEditDrawerOpen]);
  const onDeleteStudent = useCallback((student) => { setStudentToDelete(student); onDeleteOpen(); }, [setStudentToDelete, onDeleteOpen]);

  // ── "More actions" kebab menu ─────────────────────────────────────────────
  const moreActions = useMemo(() => ([
    { label: "Export list (CSV)", icon: menuIcon(Download), onClick: () => downloadStudentList() },
    { label: "Import students", icon: menuIcon(Upload), onClick: () => onCsvUploadOpen() },
    { label: "Download CSV template", icon: menuIcon(FileSpreadsheet), onClick: () => downloadCsvTemplate() },
    { label: "Print list", icon: menuIcon(Printer), onClick: () => setPrintOpen(true) },
    { label: "Transfer certificates", icon: menuIcon(FileText), onClick: () => navigate("/students/transfer-certificate") },
  ]), [downloadStudentList, onCsvUploadOpen, downloadCsvTemplate, navigate]);

  return (
    <>
      <StudentsDataGrid
        students={displayed}
        totalEnrolled={counts.all}
        loading={listLoading}
        error={listError}
        onRetry={refreshStudentsList}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusOptions={statusOptions}
        statusSel={statusSel}
        onStatusSelect={setStatusSel}
        totalDue={totalDue}
        onDuesClick={() => setDuesOnly((v) => !v)}
        attendanceBar={
          <AttendanceBar
            pct={avgAtt}
            sub={`${attTracked} tracked`}
            pending={displayed.length - attTracked}
            pendingLabel={displayed.length - attTracked > 0 ? `${displayed.length - attTracked} not marked` : null}
            onBoard={() => setBoardOpen(true)}
          />
        }
        selectedKeys={selectedKeys}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
        onClearSelection={onClearSelection}
        onBulkAction={onBulkAction}
        onAddStudent={() => setCreateOpen(true)}
        onOpenStudent={onOpenStudent}
        onEditStudent={onEditStudent}
        onDeleteStudent={onDeleteStudent}
        onPin={handlePinStudent}
        onUnpin={handleUnpinStudent}
        activeFiltersCount={activeFiltersCount}
        feeStatusFilter={feeStatusFilter}
        onFeeFilterToggle={(val) => handleFilterChange("feeStatus", val)}
        onClearFilters={clearAllFilters}
        moreActions={moreActions}
      />

      {/* ── Bulk Modals ── */}
      <StudentsBulkModals
        isBulkDeleteOpen={isBulkDeleteOpen}
        onBulkDeleteClose={onBulkDeleteClose}
        bulkDeleteStudents={bulkDeleteStudents}
        executeBulkDelete={executeBulkDelete}
        isBulkActionOpen={isBulkActionOpen}
        onBulkActionClose={onBulkActionClose}
        bulkAction={bulkAction}
        selectedCount={selectedKeys.size}
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

      {/* ── New student composer ── */}
      <CreateStudentComposer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refreshStudentsList}
        addStudent={addStudent}
        classes={classes}
        currentAcademicYear={currentAcademicYear}
      />

      {/* ── Attendance board ── */}
      <AttendanceBoard
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
        board={board}
        onMarkClass={(c) => { setBoardOpen(false); navigate(`/classes/${c.id}/attendance`); }}
      />

      {/* ── Edit Student Drawer ── */}
      <EditStudentDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => { setIsEditDrawerOpen(false); setSelectedStudent(null); }}
        student={selectedStudent}
        onUpdate={(updatedStudent) => {
          setLocalStudents(
            students.map((st) => (String(st.id) === String(updatedStudent.id) ? { ...st, ...updatedStudent } : st))
          );
          setSelectedStudent(updatedStudent);
        }}
        classOptions={getClassOptions()}
        classesWithTeachers={classes}
      />

      {/* ── Print Preview ── */}
      <PrintPreviewModal isOpen={printOpen} onClose={() => setPrintOpen(false)} title="Students List">
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
              {displayed.map((s) => (
                <tr key={sid(s)} className="border-b">
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
    </>
  );
}
