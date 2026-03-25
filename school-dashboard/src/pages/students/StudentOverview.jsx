import { useState, useEffect, useMemo } from "react";
import { Tabs, Tab, useDisclosure } from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import { useStudentRemarks } from "../../hooks/useStudentRemarks";
import { useStudentResults } from "../../hooks/useStudentResults";
import { useStudentFeeData } from "../../hooks/useStudentFeeData";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { studentsApi, attendanceApi } from "../../services/api";
import { UnifiedUploadProgress } from "../../components/FileUploadProgress";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

// Header
import StudentProfileHeader from "./components/StudentProfileHeader";

// Modals
import TCGeneratorModal from "./TCGeneratorModal";
import InvoicePrintModal from "./components/InvoicePrintModal";
import { PaymentModal, ReminderModal, PromoteStudentModal } from "./components/modals";
import DeleteStudentModal from "./components/modals/DeleteStudentModal";
import ProgressCardModal from "./components/modals/ProgressCardModal";
import WriteRemarkModal from "./components/modals/WriteRemarkModal";

// Drawers
import EditStudentDrawer from "./components/drawers/EditStudentDrawer";
import RegularizeAttendanceDrawer from "./components/drawers/RegularizeAttendanceDrawer";

// Tab components
import {
  OverviewTab,
  BasicDetailsTab,
  AttendanceTab,
  FeesTab,
  DocumentsTab,
  RemarksTab,
  RatingsTab,
  AcademicsTab,
} from "./components/tabs";

// Skeleton
import { DetailPageSkeleton } from "../../components/skeletons/PageSkeletons";

export default function StudentOverview() {
  const { params: { id }, isValid } = useValidatedParams({ id: 'objectId' }, { redirectTo: '/students' });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    getStudentById, classesWithTeachers, staff,
    updateStudent, updateStudentLocal, deleteStudent,
    loading, currentAcademicYear
  } = useApp();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // ── Modal / Drawer open states ────────────────────────────────────────────
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRemarkOpen, setIsRemarkOpen] = useState(false);
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isTcOpen, onOpen: onTcOpen, onClose: onTcClose } = useDisclosure();
  const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
  const { isOpen: isProgressOpen, onOpen: onProgressOpen, onClose: onProgressClose } = useDisclosure();

  // ── Documents state ───────────────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);

  // ── Data hooks ────────────────────────────────────────────────────────────
  const {
    remarks, setRemarks, remarksLoading, remarksCategoryFilter, setRemarksCategoryFilter
  } = useStudentRemarks(id, activeTab);

  const {
    results, resultsLoading, setSelectedExam
  } = useStudentResults(id, activeTab);

  const student = getStudentById(id);

  const {
    studentFeeStructure, loadingFeeStructure, feeHistory,
    refetchFeeStructure, refetchPaymentHistory
  } = useStudentFeeData(id, currentAcademicYear, student?.academicYear);

  // ── Fetch fresh documents on mount ───────────────────────────────────────
  useEffect(() => {
    const fetchFreshStudentData = async () => {
      try {
        const freshStudent = await studentsApi.getById(id);
        if (freshStudent.documents) setDocuments(freshStudent.documents);
      } catch (error) {
        console.error('Error fetching fresh student data:', error);
      }
    };
    fetchFreshStudentData();
  }, [id]);

  // Sync documents from context only if local state is still empty
  useEffect(() => {
    if (student?.documents && documents.length === 0) {
      setDocuments(student.documents);
    }
  }, [student, documents.length]);

  // ── Attendance data ───────────────────────────────────────────────────────
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!id) return;
      setAttendanceLoading(true);
      try {
        const year = new Date().getFullYear();
        const data = await attendanceApi.getStudentAttendance(id, `${year}-01-01`, `${year}-12-31`);
        setAttendanceData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setAttendanceData([]);
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendance();
  }, [id]);

  const attendanceStats = useMemo(() => {
    if (!attendanceData.length) return { present: 0, absent: 0, total: 0, percentage: 0 };
    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.status === 'present').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, percentage };
  }, [attendanceData]);

  // MF-17: Export attendance data as CSV
  const handleExportAttendance = () => {
    if (!attendanceData.length) { toast.error('No attendance data to export'); return; }
    const headers = ['Date', 'Day', 'Status', 'Remarks'];
    const rows = attendanceData.map(a => {
      const d = new Date(a.date);
      return [
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        d.toLocaleDateString('en-IN', { weekday: 'long' }),
        a.status || '',
        a.remarks || '',
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${student?.name?.replace(/\s+/g, '-') || 'student'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Attendance exported — ${attendanceData.length} records`);
  };

  const monthlyAttendanceTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    return months.map((month, index) => {
      const monthData = attendanceData.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });
      const present = monthData.filter(a => a.status === 'present').length;
      const percentage = monthData.length > 0 ? Math.round((present / monthData.length) * 100) : 0;
      return { name: month, attendance: percentage };
    });
  }, [attendanceData]);

  // ── Derived class data ────────────────────────────────────────────────────
  const availableClasses = useMemo(() => {
    if (classesWithTeachers?.length) return classesWithTeachers.map(c => `${c.name}-${c.section}`);
    return ["Nursery-A", "KG-A", "1-A", "2-A", "3-A", "4-A", "5-A", "6-A", "7-A", "8-A", "9-A", "10-A"];
  }, [classesWithTeachers]);

  const classOptions = (classesWithTeachers || []).map(c => `${c.name}-${c.section}`);

  const classInfo = useMemo(() => {
    if (!student?.class) return null;
    const [className, section] = student.class.split("-");
    return (classesWithTeachers || []).find(c => c.name === className && c.section === section);
  }, [student, classesWithTeachers]);

  const classTeacher = useMemo(() => {
    if (!classInfo) return null;
    return (staff || []).find(s => s.id === classInfo.classTeacherId);
  }, [classInfo, staff]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleRatingChange = async (ratings) => {
    try {
      const loadingToast = toast.loading(t('toast.loading.savingRatings'));
      const ratingsWithTimestamp = {};
      Object.keys(ratings).forEach(key => {
        ratingsWithTimestamp[key] = { ...ratings[key], lastUpdated: new Date().toISOString() };
      });
      await updateStudent(student.id, { ratings: ratingsWithTimestamp });
      toast.success("Ratings saved successfully", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to save ratings: " + (error.message || "Unknown error"));
    }
  };

  const handleDownloadInvoice = () => setIsInvoiceOpen(true);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isValid) return null;
  if (loading) return <DetailPageSkeleton avatar fields={8} />;
  if (!student) return <div className="p-8 text-center text-default-500">{t('pages.studentNotFound')}</div>;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in p-6 lg:p-8 pb-12">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Profile Header */}
        <StudentProfileHeader
          student={student}
          onEdit={() => setIsEditOpen(true)}
          onDelete={onDeleteOpen}
          onGenerateTC={onTcOpen}
          onProgressCard={onProgressOpen}
          onPromote={onPromoteOpen}
          onUpdateStudent={updateStudentLocal}
          availableClasses={availableClasses}
          results={results}
          attendanceStats={attendanceStats}
          studentFeeStructure={studentFeeStructure}
          staff={staff}
        />

        {/* Tab Navigation */}
        <div className="w-full space-y-6">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={setActiveTab}
            size="lg"
            color="primary"
            variant="solid"
            classNames={{
              tabList: "gap-1 p-1.5 bg-default-100/50 rounded-2xl border border-default-200 mb-6",
              cursor: "bg-background rounded-xl shadow-sm dark:shadow-zinc-900/50 ring-1 ring-black/5 dark:ring-white/10",
              tab: "px-6 h-10 transition-all",
              tabContent: "group-data-[selected=true]:text-default-900 group-data-[selected=true]:font-semibold text-default-500 font-medium"
            }}
          >
            <Tab key="overview" title={t('pages.overview1')} />
            <Tab key="student_info" title={t('pages.basicDetails')} />
            <Tab key="attendance" title={t('pages.attendance2')} />
            <Tab key="academics" title={t('pages.academics1')} />
            <Tab key="fees" title={t('pages.fees1')} />
            <Tab key="documents" title={t('pages.documents')} />
            <Tab key="remarks" title={t('pages.remarks')} />
            <Tab key="ratings" title={t('pages.ratings')} />
          </Tabs>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab
              student={student}
              results={results}
              attendanceStats={{ ...attendanceStats, monthlyTrend: monthlyAttendanceTrend }}
              studentFeeStructure={studentFeeStructure}
              onTabChange={setActiveTab}
              onDownloadReport={(type) => toast.success(`Downloading ${type} report...`)}
              onSendReminder={() => setIsReminderOpen(true)}
              classTeacher={classTeacher}
            />
          )}

          {activeTab === "student_info" && (
            <BasicDetailsTab
              student={student}
              classTeacher={classTeacher}
              onEditSection={() => setIsEditOpen(true)}
            />
          )}

          {activeTab === "attendance" && (
            <AttendanceTab
              student={student}
              attendanceStats={attendanceStats}
              onRegularizeOpen={() => setIsRegularizeOpen(true)}
              onExportAttendance={handleExportAttendance}
            />
          )}

          {activeTab === "academics" && (
            <AcademicsTab
              results={results}
              resultsLoading={resultsLoading}
              classTeacher={classTeacher}
              onExamSelect={setSelectedExam}
            />
          )}

          {activeTab === "fees" && (
            <FeesTab
              studentFeeStructure={studentFeeStructure}
              feeHistory={feeHistory}
              loadingFeeStructure={loadingFeeStructure}
              onRecordPayment={() => setIsPaymentOpen(true)}
              onSendReminder={() => setIsReminderOpen(true)}
              onDownloadInvoice={handleDownloadInvoice}
            />
          )}

          {activeTab === "documents" && (
            <DocumentsTab
              studentId={id}
              documents={documents}
              activeUploads={activeUploads}
              onDocumentsChange={setDocuments}
              onActiveUploadsChange={setActiveUploads}
            />
          )}

          {activeTab === "remarks" && (
            <RemarksTab
              studentId={id}
              student={student}
              remarks={remarks}
              remarksLoading={remarksLoading}
              remarksCategoryFilter={remarksCategoryFilter}
              onRemarksChange={setRemarks}
              onCategoryFilterChange={setRemarksCategoryFilter}
            />
          )}

          {activeTab === "ratings" && (
            <RatingsTab
              studentId={student?.id}
              ratings={student?.ratings || {}}
              onRatingChange={handleRatingChange}
              editable={true}
            />
          )}
        </div>
      </div>

      {/* ── Drawers ──────────────────────────────────────────────────────── */}
      <EditStudentDrawer
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        student={student}
        classesWithTeachers={classesWithTeachers || []}
        classOptions={classOptions}
        onSave={(data) => {
          updateStudent(id, data);
          setIsEditOpen(false);
        }}
      />

      <RegularizeAttendanceDrawer
        isOpen={isRegularizeOpen}
        onOpenChange={setIsRegularizeOpen}
      />

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        student={student}
        studentFeeStructure={studentFeeStructure}
        onPaymentComplete={() => {
          refetchFeeStructure();
          refetchPaymentHistory();
        }}
      />

      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        student={student}
        studentFeeStructure={studentFeeStructure}
      />

      <WriteRemarkModal
        isOpen={isRemarkOpen}
        onClose={() => setIsRemarkOpen(false)}
        student={student}
        onSave={(savedRemark) => {
          setRemarks([savedRemark, ...remarks]);
          setIsRemarkOpen(false);
        }}
      />

      <PromoteStudentModal
        isOpen={isPromoteOpen}
        onClose={onPromoteClose}
        student={student}
        availableClasses={availableClasses}
        onPromote={(nextClass) => {
          updateStudent(student.id, { class: nextClass });
        }}
      />

      <ProgressCardModal
        isOpen={isProgressOpen}
        onClose={onProgressClose}
        student={student}
        onNavigateToAcademics={() => setActiveTab('academics')}
      />

      <DeleteStudentModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        student={student}
        onDeleteConfirmed={async () => {
          const result = await deleteStudent(id);
          navigate('/students');
          return result;
        }}
      />

      <TCGeneratorModal
        isOpen={isTcOpen}
        onClose={onTcClose}
        students={[student]}
      />

      <InvoicePrintModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        student={student}
        studentFeeStructure={studentFeeStructure}
        feeHistory={feeHistory}
      />

      {/* Upload Progress Overlay */}
      <UnifiedUploadProgress
        uploads={activeUploads}
        onClose={() => setActiveUploads([])}
      />
    </div>
  );
}
