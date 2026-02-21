import { useState, useEffect, useMemo, useRef } from "react";
import { Tabs, Tab, Drawer, DrawerContent, useDisclosure } from "@heroui/react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { isObjectId } from "../../utils/objectIdHelper";

// Context
import { useApp } from "../../context/AppContext";

// Components
import StudentProfileHeader from "./components/StudentProfileHeader";
import PageHeader from "../../components/PageHeader";

// Tab Components
import {
  OverviewTab,
  BasicDetailsTab,
  AttendanceTab,
  AcademicsTab,
  FeesTab,
  DocumentsTab,
  RemarksTab,
  RatingsTab,
} from "./components/tabs";

// Modal Components
import PaymentModal from "./components/modals/PaymentModal";
import ReminderModal from "./components/modals/ReminderModal";
import PromoteStudentModal from "./components/modals/PromoteStudentModal";

// Other Components
import AddStudent from "./AddStudent";
import TCGeneratorModal from "./TCGeneratorModal";

// Hooks and Utils
import { useStudentFees } from "./hooks";
import { getAuthToken, getNextClass } from "./utils/studentHelpers";

// Get auth token helper
const getToken = () => {
  const storedUser = sessionStorage.getItem('app_user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      return userData.token;
    } catch (err) {
      return null;
    }
  }
  return null;
};

export default function StudentOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudentById, classesWithTeachers, staff, updateStudent, updateStudentLocal, deleteStudent, loading } = useApp();
  const [searchParams] = useSearchParams();

  // Tab state
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // TC Modal
  const { isOpen: isTcOpen, onOpen: onTcOpen, onClose: onTcClose } = useDisclosure();

  // Promote Modal
  const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();

  // Progress Card Modal
  const { isOpen: isProgressOpen, onOpen: onProgressOpen, onClose: onProgressClose } = useDisclosure();

  // Delete Modal
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Get student data from context
  const student = useMemo(() => getStudentById(id), [getStudentById, id]);

  // Set page title based on student name
  useEffect(() => {
    if (student && student.name && !isObjectId(student.name)) {
      document.title = `${student.name} - Student - SchoolSync`;
    } else if (student && student.admissionId) {
      document.title = `Student ${student.admissionId} - SchoolSync`;
    } else {
      document.title = `Student Profile - SchoolSync`;
    }
    
    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'SchoolSync';
    };
  }, [student]);

  // Get available classes
  const availableClasses = useMemo(() => {
    return classesWithTeachers?.map(c => c.name || c.classId) || [];
  }, [classesWithTeachers]);

  // Get class teacher
  const classTeacher = useMemo(() => {
    if (!student?.classId || !classesWithTeachers) return null;
    // FIXED: Use String() comparison for ObjectId matching
    const classInfo = classesWithTeachers.find(c => String(c.id) === String(student.classId) || String(c.classId) === String(student.classId));
    if (!classInfo?.classTeacherId) return null;
    return staff?.find(s => s.id === classInfo.classTeacherId);
  }, [student, classesWithTeachers, staff]);

  // Attendance stats (simplified - in real app would come from hook or API)
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0
  });

  // Results state
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);

  // Remarks state
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [remarksCategoryFilter, setRemarksCategoryFilter] = useState('all');

  // Fee structure using hook
  const { feeStructure: studentFeeStructure, loading: loadingFeeStructure, refetch: refetchFees } = useStudentFees(id);

  // Fee history state
  const [feeHistory, setFeeHistory] = useState([]);

  // Fetch attendance stats
  useEffect(() => {
    if (!id) return;

    const fetchAttendance = async () => {
      try {
        const token = getToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/attendance`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          const present = data.filter(a => a.status === 'present' || a.status === 'P').length;
          const absent = data.filter(a => a.status === 'absent' || a.status === 'A').length;
          const total = data.length;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
          setAttendanceStats({ present, absent, total, percentage });
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }
    };

    fetchAttendance();
  }, [id]);

  // Fetch results
  useEffect(() => {
    if (!id || activeTab !== 'academics') return;

    const fetchResults = async () => {
      setResultsLoading(true);
      try {
        const token = getToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/results`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setResultsLoading(false);
      }
    };

    fetchResults();
  }, [id, activeTab]);

  // Fetch remarks
  useEffect(() => {
    if (!id || activeTab !== 'remarks') return;

    const fetchRemarks = async () => {
      setRemarksLoading(true);
      try {
        const token = getToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/remarks?category=${remarksCategoryFilter}`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          setRemarks(data);
        }
      } catch (err) {
        console.error("Error fetching remarks:", err);
      } finally {
        setRemarksLoading(false);
      }
    };

    fetchRemarks();
  }, [id, activeTab, remarksCategoryFilter]);

  // Fetch initial documents
  useEffect(() => {
    if (!id) return;

    const fetchDocuments = async () => {
      try {
        const token = getToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.documents) {
            setDocuments(data.documents);
          }
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };

    fetchDocuments();
  }, [id]);

  // Sync documents from student context
  useEffect(() => {
    if (student?.documents && documents.length === 0) {
      setDocuments(student.documents);
    }
  }, [student, documents.length]);

  // Fetch fee history
  useEffect(() => {
    if (!id) return;

    const fetchFeeHistory = async () => {
      try {
        const token = getToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/fees/payments?studentId=${id}`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          setFeeHistory(data);
        }
      } catch (err) {
        console.error("Error fetching fee history:", err);
      }
    };

    fetchFeeHistory();
  }, [id]);

  // Handlers
  const handleSendReminder = () => {
    setIsReminderOpen(true);
  };

  const handleDownloadInvoice = () => {
    toast.success("Downloading invoice...");
  };

  const handleRatingChange = async (category, rating) => {
    try {
      const token = getToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/ratings`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ category, rating })
        }
      );

      if (response.ok) {
        toast.success("Rating updated");
      }
    } catch (err) {
      console.error("Error updating rating:", err);
      toast.error("Failed to update rating");
    }
  };

  const handlePaymentComplete = () => {
    refetchFees();
    toast.success("Payment recorded successfully");
  };

  const handlePromoteStudent = async () => {
    // Promotion logic would go here
    toast.success("Student promoted successfully");
    onPromoteClose();
  };

  const handleDeleteStudent = async () => {
    try {
      await deleteStudent(id);
      toast.success("Student deleted successfully");
      navigate('/students');
    } catch (err) {
      toast.error("Failed to delete student");
    }
  };

  // Loading state
  if (loading && !student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Not found state
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-500">Student not found</p>
        <button
          onClick={() => navigate('/students')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={student.name}
        breadcrumbs={[
          { label: "Students", href: "/students" },
          { label: student.name }
        ]}
      />

      {/* Student Profile Header */}
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

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
        size="lg"
        color="primary"
        variant="solid"
        classNames={{
          tabList: "gap-1 p-1.5 bg-default-100/50 rounded-2xl border border-default-200 mb-6",
          cursor: "bg-background rounded-xl shadow-sm ring-1 ring-black/5",
          tab: "px-6 h-10 transition-all",
          tabContent: "group-data-[selected=true]:text-default-900 group-data-[selected=true]:font-semibold text-default-500 font-medium"
        }}
      >
        <Tab key="overview" title="Overview" />
        <Tab key="student_info" title="Basic Details" />
        <Tab key="attendance" title="Attendance" />
        <Tab key="academics" title="Academics" />
        <Tab key="fees" title="Fees" />
        <Tab key="documents" title="Documents" />
        <Tab key="remarks" title="Remarks" />
        <Tab key="ratings" title="Ratings" />
      </Tabs>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "overview" && (
          <OverviewTab
            student={student}
            results={results}
            attendanceStats={attendanceStats}
            studentFeeStructure={studentFeeStructure}
            onTabChange={setActiveTab}
            onDownloadReport={(type) => toast.success(`Downloading ${type} report...`)}
            onSendReminder={handleSendReminder}
            classTeacher={classTeacher}
          />
        )}

        {activeTab === "student_info" && (
          <BasicDetailsTab
            student={student}
            classTeacher={classTeacher}
            onEditSection={(section) => setIsEditOpen(true)}
          />
        )}

        {activeTab === "attendance" && (
          <AttendanceTab
            student={student}
            attendanceStats={attendanceStats}
            onRegularizeOpen={() => toast("Regularization feature coming soon")}
          />
        )}

        {activeTab === "academics" && (
          <AcademicsTab
            results={results}
            resultsLoading={resultsLoading}
            classTeacher={classTeacher}
            onExamSelect={(exam) => toast.success(`Selected exam: ${exam.name}`)}
          />
        )}

        {activeTab === "fees" && (
          <FeesTab
            studentFeeStructure={studentFeeStructure}
            feeHistory={feeHistory}
            loadingFeeStructure={loadingFeeStructure}
            onRecordPayment={() => setIsPaymentOpen(true)}
            onSendReminder={handleSendReminder}
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

      {/* Edit Drawer */}
      <Drawer
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        placement="right"
        size="5xl"
        hideCloseButton={true}
      >
        <DrawerContent>
          <AddStudent
            isDrawer={true}
            editMode={true}
            studentData={student}
            onClose={() => setIsEditOpen(false)}
            onSave={(data) => {
              updateStudent(id, data);
              setIsEditOpen(false);
              toast.success("Student updated successfully");
            }}
          />
        </DrawerContent>
      </Drawer>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        student={student}
        studentFeeStructure={studentFeeStructure}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        student={student}
        studentFeeStructure={studentFeeStructure}
        onSend={() => {
          setIsReminderOpen(false);
          toast.success("Reminder sent");
        }}
      />

      {/* Promote Student Modal */}
      <PromoteStudentModal
        isOpen={isPromoteOpen}
        onClose={onPromoteClose}
        student={student}
        availableClasses={availableClasses}
        onPromote={handlePromoteStudent}
      />

      {/* TC Generator Modal */}
      <TCGeneratorModal
        isOpen={isTcOpen}
        onClose={onTcClose}
        student={student}
      />

      {/* Delete Confirmation Modal - using HeroUI Modal inline for simplicity */}
      {/* Progress Card Modal - would be imported if needed */}
    </div>
  );
}
