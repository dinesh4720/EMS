/**
 * StaffDashboard - Refactored to match StudentDashboard minimal UI design
 * Design-system token palette with surface cards
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import logger from "../../utils/logger";
import { useDisclosure } from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import {
  Users, Calendar, Briefcase, BookOpen, Clock,
  User, CalendarDays, FileText, Wallet, ClipboardList, GraduationCap
} from "lucide-react";
import MinimalTabs from "../../components/ui/MinimalTabs";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { isObjectId } from "../../utils/objectIdHelper";

// Components
import PhotoEditorModal from "../../components/PhotoEditorModal";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import StaffAssignmentPanel from "./StaffAssignmentPanel";
import TeacherTimetableEditor from "./TeacherTimetableEditor";
import AddStaffComposer from "./AddStaffComposer";
import AssignClassToStaffModal from "./components/AssignClassToStaffModal";

// Tab Components
import StaffAboutTab from "./components/StaffAboutTab";
import StaffAttendanceTab from "./components/StaffAttendanceTab";
import StaffPayrollTab from "./components/StaffPayrollTab";
import StaffDocumentsTab from "./components/StaffDocumentsTab";
import StaffLeaveBalance from "./components/StaffLeaveBalance";

import { DetailPageSkeleton } from "../../components/skeletons/PageSkeletons";

// Context & Services
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import { uploadApi, classesApi, homeworkApi } from "../../services/api";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import useConfirmDialog from "../../hooks/useConfirmDialog";
import { getSocketService } from "../../services/socketServiceEnhanced.js";
import { useTranslation } from 'react-i18next';

// Staff Dashboard Sub-components
import StaffSendMessageModal from "./components/staff-dashboard/StaffSendMessageModal";
import StaffClassTeacherSection from "./components/staff-dashboard/StaffClassTeacherSection";
import StaffTodayStatusCard from "./components/staff-dashboard/StaffTodayStatusCard";
import StaffMonthlySummary from "./components/staff-dashboard/StaffMonthlySummary";
import StaffQuickActions from "./components/staff-dashboard/StaffQuickActions";
import StaffAlerts from "./components/staff-dashboard/StaffAlerts";
import StaffContactCard from "./components/staff-dashboard/StaffContactCard";
import StaffDepartmentCard from "./components/staff-dashboard/StaffDepartmentCard";
import StaffProfileHeader from "./components/staff-dashboard/StaffProfileHeader";
import StaffPrintLayout from "./components/staff-dashboard/StaffPrintLayout";
import StaffOverviewStats from "./components/staff-dashboard/StaffOverviewStats";

// Extracted hooks
import useStaffDocuments from "./hooks/useStaffDocuments";
import useStaffPhoto from "./hooks/useStaffPhoto";

export default function StaffDashboard() {
  const { t } = useTranslation();
  const { params: { id }, isValid } = useValidatedParams({ id: 'objectId' }, { redirectTo: '/staffs' });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();

  const {
    getStaffById, getMonthlyAttendance, staffAttendance: attendance,
    staffSalaries, salarySettings, classesWithTeachers, updateStaff, updateStaffLocal, updateClassLocal,
    payrollHistory, staff: allStaffList, loading, error: appError, teacherAssignmentsApi,
    fetchStaffAttendanceByStaff, fetchPayrollHistory
  } = useApp();

  const { isOpen, onOpen, onClose } = useDisclosure(); // Message Modal
  const { confirmState, showConfirm, closeConfirm } = useConfirmDialog();

  // AddStaff Drawer State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [shouldRenderAddStaff, setShouldRenderAddStaff] = useState(false);
  const addStaffRef = useRef(null);

  // Handle backdrop click for unsaved changes check
  useEffect(() => {
    if (!isAddStaffOpen) return;
    const handleBackdropClick = (e) => {
      const backdrop = e.target.closest?.('[data-slot="backdrop"]') || (e.target.getAttribute?.('data-slot') === 'backdrop' ? e.target : null);
      if (backdrop) {
        if (addStaffRef.current) addStaffRef.current.attemptClose();
        else handleCloseAddStaff();
      }
    };
    document.addEventListener('click', handleBackdropClick, true);
    return () => document.removeEventListener('click', handleBackdropClick, true);
  }, [isAddStaffOpen]);

  // Assign Class Modal State
  const [isAssignClassModalOpen, setIsAssignClassModalOpen] = useState(false);

  const handleOpenAddStaff = () => {
    setShouldRenderAddStaff(true);
    requestAnimationFrame(() => setIsAddStaffOpen(true));
  };

  const handleCloseAddStaff = () => {
    setIsAddStaffOpen(false);
    setTimeout(() => setShouldRenderAddStaff(false), 300);
  };

  const handleSaveAddStaff = async (staffData) => {
    try {
      const savedStaff = await updateStaff(id, staffData);
      toast.success(t('toast.success.staffMemberUpdatedSuccessfully'));
      handleCloseAddStaff();
      return savedStaff;
    } catch (err) {
      logger.error('Failed to save staff from dashboard:', err);
      toast.error('Failed to update staff member');
      throw err;
    }
  };

  const handleOpenAssignClassModal = useCallback(() => setIsAssignClassModalOpen(true), []);
  const handleCloseAssignClassModal = useCallback(() => setIsAssignClassModalOpen(false), []);

  const [message, setMessage] = useState("");
  const validTabs = ["overview", "attendance", "about", "timetable", "classes", "payroll", "leave", "documents"];
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTabState] = useState(validTabs.includes(tabFromUrl) ? tabFromUrl : "overview");

  // Keep URL ↔ tab state in sync (deep-linking + back/forward) — set ?tab=...
  // on every change so the URL is shareable. `replace: true` avoids polluting
  // history for every tab toggle.
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "overview") next.delete("tab");
      else next.set("tab", tab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Pick up URL changes from back/forward / external nav
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [tabFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch payroll records from backend when payroll tab is active
  useEffect(() => {
    if (activeTab === "payroll" && id) {
      fetchPayrollHistory({ employeeId: id });
    }
  }, [activeTab, id, fetchPayrollHistory]);

  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [todayHomeworkCount, setTodayHomeworkCount] = useState(null);

  // Document hook
  const {
    documents, setDocuments, activeUploads, documentInputRef,
    handleDocumentUpload, handleDeleteDocument, initFromStaff,
  } = useStaffDocuments(id, updateStaff, uploadApi);

  // Photo hook
  const {
    picturePreview, setPicturePreview,
    selectedImageForEdit, isPhotoEditorOpen, setIsPhotoEditorOpen,
    isCameraCaptureOpen, setIsCameraCaptureOpen,
    fileInputRef, handleFileSelect, handleCameraPhotoCapture, handlePhotoSave, handleRemovePhoto,
  } = useStaffPhoto(id, updateStaff, uploadApi);

  const staff = getStaffById(id);

  // Set page title based on staff name
  useEffect(() => {
    if (staff && staff.name && !isObjectId(staff.name)) {
      document.title = `${staff.name} - Staff - SchoolSync`;
    } else if (staff && staff.code) {
      document.title = `Staff ${staff.code} - SchoolSync`;
    } else {
      document.title = `Staff Profile - SchoolSync`;
    }
    return () => { document.title = 'SchoolSync'; };
  }, [staff]);

  // Fetch attendance data on load
  useEffect(() => {
    if (id) {
      const now = new Date();
      const start = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
      const end = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
      fetchStaffAttendanceByStaff(id, start, end).catch(err => {
        logger.error('Failed to fetch staff attendance:', err);
        toast.error(t('toast.error.failedToLoadAttendanceData'));
      });
    }
  }, [id, fetchStaffAttendanceByStaff]);

  const today = new Date();
  const monthlyStats = useMemo(() => {
    if (!getMonthlyAttendance) return { present: 0, absent: 0, total: 0 };
    return getMonthlyAttendance(id, today.getFullYear(), today.getMonth()) || { present: 0, absent: 0, total: 0 };
  }, [id, attendance, getMonthlyAttendance]);

  const attendanceRate = monthlyStats.total > 0 ? Math.round((monthlyStats.present / monthlyStats.total) * 100) : 0;

  const staffSalary = staffSalaries?.[id] || {};

  // Get classes where this teacher is assigned as class teacher
  const classTeacherAssignments = useMemo(() => {
    if (!staff || !classesWithTeachers) return [];
    return classesWithTeachers.filter(cls => {
      if (!cls.classTeacherId) return false;
      return String(cls.classTeacherId) === String(staff.id) || (staff._id && String(cls.classTeacherId) === String(staff._id));
    });
  }, [staff, classesWithTeachers]);

  const totalStudents = classTeacherAssignments.reduce((sum, cls) => sum + (cls.studentCount || cls.strength || 0), 0);
  const avgClassAttendance = classTeacherAssignments.length > 0
    ? Math.round(classTeacherAssignments.reduce((sum, cls) => sum + (cls.averageAttendance || cls.attendance || 0), 0) / classTeacherAssignments.length)
    : 0;

  const calculateTotals = (salaryData) => {
    if (!salaryData) return { totalEarnings: 0, totalDeductions: 0, netSalary: 0 };
    let totalEarnings = 0;
    salarySettings?.earnings?.forEach(item => { totalEarnings += Number(salaryData[item.id] || 0); });
    let totalDeductions = 0;
    salarySettings?.deductions?.forEach(item => { totalDeductions += Number(salaryData[item.id] || 0); });
    return { totalEarnings, totalDeductions, netSalary: totalEarnings - totalDeductions };
  };

  // Initialize picture preview and documents from staff data
  useEffect(() => {
    if (staff) {
      setPicturePreview(staff.picture || null);
      initFromStaff(staff);
    }
  }, [staff]);

  // Load subject assignments for teachers
  useEffect(() => {
    if (!id || !teacherAssignmentsApi) return;
    const loadSubjects = async () => {
      try {
        const data = await teacherAssignmentsApi.getAll(id);
        if (data && data.assignments) {
          setSubjectAssignments(Array.isArray(data.assignments) ? data.assignments : []);
        }
      } catch (error) {
        logger.error("Error loading subject assignments:", error);
      }
    };
    loadSubjects();
  }, [id, teacherAssignmentsApi]);

  // Fetch today's homework count for this teacher
  useEffect(() => {
    if (!id) return;
    const todayStr = new Date().toISOString().split('T')[0];
    homeworkApi.getByTeacher(id, { status: 'active' })
      .then((data) => {
        const todayCount = Array.isArray(data)
          ? data.filter(hw => hw.dueDate && hw.dueDate.split('T')[0] === todayStr).length
          : 0;
        setTodayHomeworkCount(todayCount);
      })
      .catch((err) => {
        logger.error('Failed to fetch teacher homework:', err);
        setTodayHomeworkCount(0);
      });
  }, [id]);

  // Socket.IO listener for real-time updates
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService?.isConnected() || !staff) return;

    const handleStaffUpdate = (data) => {
      if (data.staffId === staff.id) {
        updateStaffLocal(data.staffId, {
          name: data.name, role: data.role, department: data.department,
          status: data.status, phone: data.phone, email: data.email, picture: data.picture
        });
        if (data.picture) setPicturePreview(data.picture);
        toast.success('Profile updated by another user', { duration: 3000, icon: '' });
      }
    };

    socketService.on('staff_updated', handleStaffUpdate);
    return () => socketService.off('staff_updated', handleStaffUpdate);
  }, [staff, updateStaffLocal]);

  const handleSendMessage = async () => {
    if (!message.trim()) { toast.error('Please enter a message'); return; }
    try {
      const { api } = await import("../../services/api");
      await api.post('/messages/send', { recipientId: staff?._id || staff?.id, recipientType: 'staff', message: message.trim() });
      toast.success('Message sent successfully');
      setMessage("");
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleEditClick = () => {
    if (hasPermission('staff', 'edit')) handleOpenAddStaff();
    else toast.error(t('toast.error.youDoNotHavePermissionToEditStaffMembers'));
  };

  const handleUnassignClass = (cls) => {
    showConfirm({
      title: t('classes.unassignClassTeacher', 'Unassign Class Teacher'),
      message: t('classes.unassignClassTeacherMessage', 'Remove {{name}} as class teacher of {{class}}?', { name: staff.name, class: `${cls.name}-${cls.section}` }),
      variant: 'danger',
      confirmText: t('common.unassign', 'Unassign'),
      onConfirm: async () => {
        try {
          await classesApi.updateClassTeacher(cls.id, null, { force: true });
          updateClassLocal(cls.id, { classTeacherId: null, teacher: null, teacherPhoto: null });
          updateStaffLocal(staff.id, { classTeacherOf: null, isClassTeacher: false });
          toast.success(t('toast.success.classTeacherUnassigned', '{{name}} unassigned from {{class}}', { name: staff.name, class: `${cls.name}-${cls.section}` }));
        } catch (error) {
          toast.error(error.message || t('toast.error.failedToUnassign', 'Failed to unassign class teacher'));
        }
      },
    });
  };

  // Tabs configuration — segmented underline tabs match the StaffDetailPane
  // treatment. Order follows REVAMP-16 spec: About, Attendance, Documents,
  // Overview, Payroll, LeaveBalance — with Overview anchored first as the
  // landing tab.
  const isTeacherRole = Array.isArray(staff?.role)
    ? staff?.role.includes('Teacher')
    : staff?.role === 'Teacher';

  const tabs = [
    { key: "overview", title: "Overview", icon: <User size={14} aria-hidden /> },
    { key: "about", title: "About", icon: <FileText size={14} aria-hidden /> },
    { key: "attendance", title: "Attendance", icon: <CalendarDays size={14} aria-hidden /> },
    ...(isTeacherRole
      ? [
          { key: "timetable", title: "Timetable", icon: <Calendar size={14} aria-hidden /> },
          { key: "classes", title: "Classes", icon: <GraduationCap size={14} aria-hidden /> },
        ]
      : []),
    { key: "payroll", title: "Payroll", icon: <Wallet size={14} aria-hidden /> },
    { key: "leave", title: "Leave", icon: <ClipboardList size={14} aria-hidden /> },
    { key: "documents", title: `Documents${documents.length ? ` (${documents.length})` : ''}`, icon: <BookOpen size={14} aria-hidden /> },
  ];

  const isTeacher = isTeacherRole;
  const stats = [
    { label: "Attendance", value: `${attendanceRate}%`, subtext: `${monthlyStats.present} present`, icon: Clock },
    { label: isTeacher ? "Students" : "Department", value: isTeacher ? totalStudents : staff?.department || "—", subtext: isTeacher ? `${classTeacherAssignments.length} classes` : "", icon: Users },
    { label: "Role", value: Array.isArray(staff?.role) ? staff?.role[0] : staff?.role || "—", subtext: staff?.department || "", icon: Briefcase },
    { label: "Homework Due Today", value: todayHomeworkCount === null ? "—" : todayHomeworkCount, subtext: isTeacher ? "assignments" : "tasks", icon: BookOpen },
  ];

  if (!isValid) return null;

  if (!staff) {
    if (loading || (!appError && (!Array.isArray(allStaffList) || allStaffList.length === 0))) {
      return <DetailPageSkeleton avatar fields={8} />;
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-fg-faint text-sm">{t('pages.staffMemberNotFound1')}</div>
        <button onClick={() => navigate('/staffs')} className="text-sm text-accent hover:text-accent-hover underline">
          {t('pages.backToStaff')}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Print-only staff profile */}
      <StaffPrintLayout
        staff={staff}
        monthlyStats={monthlyStats}
        attendanceRate={attendanceRate}
        classTeacherAssignments={classTeacherAssignments}
      />

      <div className="page staff-dashboard">
        {/* Hidden file input for photo selection */}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

        {/* Hero + dp-metric strip (detail-pane treatment) */}
        <StaffProfileHeader
          staff={staff}
          picturePreview={picturePreview}
          subjectAssignments={subjectAssignments}
          attendanceRate={attendanceRate}
          monthlyStats={monthlyStats}
          fileInputRef={fileInputRef}
          handleRemovePhoto={handleRemovePhoto}
          setIsCameraCaptureOpen={setIsCameraCaptureOpen}
          handleEditClick={handleEditClick}
          onOpen={onOpen}
          navigate={navigate}
          t={t}
        />

        {/* Tabs (segmented underline) */}
        <div className="staff-dashboard__tabs">
          <MinimalTabs
            tabs={tabs}
            activeKey={activeTab}
            onChange={setActiveTab}
            variant="underline"
            size="md"
            ariaLabel="Staff detail tabs"
            baseId="staff-dashboard"
          />
        </div>

        {/* Tab panel */}
        <div
          id={`staff-dashboard-tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`staff-dashboard-tab-${activeTab}`}
          className="staff-dashboard__panel"
        >
          {activeTab === "overview" && (
            <div className="staff-dashboard__grid">
              <div className="col gap-4">
                <StaffOverviewStats stats={stats} />
                <StaffClassTeacherSection
                  classTeacherAssignments={classTeacherAssignments}
                  onUnassignClass={handleUnassignClass}
                  onAssignClass={handleOpenAssignClassModal}
                  canEdit={hasPermission('staff', 'edit')}
                  t={t}
                  navigate={navigate}
                  staff={staff}
                />
                <StaffTodayStatusCard attendance={attendance} staffId={id} attendanceRate={attendanceRate} t={t} />
                <StaffMonthlySummary monthlyStats={monthlyStats} t={t} />
              </div>
              <div className="col gap-4">
                <StaffQuickActions staff={staff} onEdit={handleEditClick} onMessage={onOpen} navigate={navigate} t={t} />
                <StaffAlerts attendanceRate={attendanceRate} avgClassAttendance={avgClassAttendance} isTeacher={isTeacher} t={t} />
                <StaffContactCard staff={staff} t={t} />
                <StaffDepartmentCard staff={staff} t={t} />
              </div>
            </div>
          )}

          {activeTab === "about" && <StaffAboutTab staff={staff} />}

          {activeTab === "attendance" && (
            <StaffAttendanceTab staffId={id} monthlyStats={monthlyStats} attendance={attendance[id]} />
          )}

          {activeTab === "timetable" && (
            <div className="card">
              <div className="card__head">
                <span className="card__title">{t('pages.weeklyTimetable')}</span>
              </div>
              <div className="card__body">
                <TeacherTimetableEditor teacherId={id} teacherName={staff?.name} />
              </div>
            </div>
          )}

          {activeTab === "classes" && (
            <StaffAssignmentPanel staffId={id} onAssignClassTeacher={handleOpenAssignClassModal} />
          )}

          {activeTab === "payroll" && (
            <StaffPayrollTab payrollHistory={payrollHistory} staffSalary={staffSalary} calculateTotals={calculateTotals} staff={staff} />
          )}

          {activeTab === "leave" && <StaffLeaveBalance staffId={id} />}

          {activeTab === "documents" && (
            <StaffDocumentsTab
              documents={documents}
              activeUploads={activeUploads}
              documentInputRef={documentInputRef}
              onDocumentUpload={handleDocumentUpload}
              onDeleteDocument={handleDeleteDocument}
              staffName={staff?.name}
            />
          )}
        </div>

        {/* Send Message Modal */}
        <StaffSendMessageModal isOpen={isOpen} onClose={onClose} message={message} setMessage={setMessage} onSend={handleSendMessage} staff={staff} t={t} />

        {/* Edit Staff — single composer surface (REVAMP-15). */}
        {shouldRenderAddStaff && isAddStaffOpen && (
          <AddStaffComposer
            ref={addStaffRef}
            onClose={handleCloseAddStaff}
            onSave={handleSaveAddStaff}
            editingStaff={staff}
          />
        )}

        {/* Photo Editor Modal */}
        {selectedImageForEdit && (
          <PhotoEditorModal isOpen={isPhotoEditorOpen} onClose={() => setIsPhotoEditorOpen(false)} imageSrc={selectedImageForEdit} onSave={handlePhotoSave} />
        )}

        {/* Camera Capture Modal */}
        <CameraCaptureModal isOpen={isCameraCaptureOpen} onClose={() => setIsCameraCaptureOpen(false)} onPhotoCaptured={handleCameraPhotoCapture} />

        {/* Assign Class to Staff Modal */}
        <AssignClassToStaffModal isOpen={isAssignClassModalOpen} onClose={handleCloseAssignClassModal} staffId={id} staffName={staff.name} />

        {/* Confirm Dialog for unassign etc. */}
        <ConfirmDialog {...confirmState} onClose={closeConfirm} />
      </div>
    </>
  );
}
