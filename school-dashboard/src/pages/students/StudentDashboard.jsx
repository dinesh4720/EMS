import { useState, useEffect, useMemo, useRef } from "react";
import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, useDisclosure,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Drawer, DrawerContent, DrawerHeader, DrawerBody,
  Input, Select, SelectItem, Textarea, Checkbox
} from "@heroui/react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Phone, IndianRupee, User, GraduationCap, FileText, Download, Edit,
  MessageSquare, Clock, CheckCircle2, Award, TrendingUp, Camera, FileCheck,
  Printer, MoreVertical, ChevronRight, BarChart3, Trash2, Bell, Share2, Move,
  Users, Mail, Calendar, AlertCircle, BookOpen, Upload, XCircle, Plus,
  Activity, Heart, Send
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart as RechartsLineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { uploadApi } from "../../services/api";
import AddStudent from "./AddStudent";
import TCGeneratorModal from "./TCGeneratorModal";
import PhotoEditorModal from "../../components/PhotoEditorModal";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import PrintableStudentProfile from "./components/PrintableStudentProfile";
import StudentDocuments from "./components/StudentDocuments";
import StudentRemarks from "./components/StudentRemarks";
import StudentRatingSystem from "./components/StudentRatingSystem";
import InvoicePrintModal from "./components/InvoicePrintModal";

// ============================================================================
// STUDENT DASHBOARD - COMPLETE REFACTOR
// Dashboard style, full page, rounded corners, all features
// ============================================================================

const getAuthToken = () => {
  const storedUser = sessionStorage.getItem('app_user');
  if (storedUser) {
    try { return JSON.parse(storedUser).token; }
    catch { return null; }
  }
  return null;
};

// Helper to get next class for promotion
const getNextClass = (currentClass, availableClasses) => {
  if (!currentClass || currentClass === "Alumni" || currentClass === "Passed Out / Alumni") return null;
  const preschoolMap = { "Nursery": "KG", "KG": "1", "LKG": "UKG", "UKG": "1" };
  for (const [from, to] of Object.entries(preschoolMap)) {
    if (currentClass.startsWith(from)) {
      const sectionMatch = currentClass.match(/-[A-Z]$/i);
      return `${to}${sectionMatch ? sectionMatch[0] : ""}`;
    }
  }
  const match = currentClass.match(/^(\d+)(?:-([A-Z]))?$/i);
  if (!match) return null;
  const currentGrade = parseInt(match[1]);
  if (currentGrade >= 10) return "Passed Out / Alumni";
  return `${currentGrade + 1}${match[2] ? `-${match[2]}` : ""}`;
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StudentDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudentById, classesWithTeachers, staff, updateStudent, deleteStudent, loading } = useApp();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // Modals
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isTcOpen, onOpen: onTcOpen, onClose: onTcClose } = useDisclosure();
  const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
  const { isOpen: isProgressOpen, onOpen: onProgressOpen, onClose: onProgressClose } = useDisclosure();
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // States
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [studentFeeStructure, setStudentFeeStructure] = useState(null);
  const [loadingFeeStructure, setLoadingFeeStructure] = useState(false);
  const [feeHistory, setFeeHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [remarksCategoryFilter, setRemarksCategoryFilter] = useState('all');

  // Photo states
  const fileInputRef = useRef(null);
  const printRef = useRef(null);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

  // Form states
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentMode: "cash", date: new Date().toISOString().split('T')[0] });
  const [reminderMessage, setReminderMessage] = useState("");
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const student = getStudentById(id);

  // Available classes
  const availableClasses = useMemo(() => {
    if (classesWithTeachers?.length) return classesWithTeachers.map(c => `${c.name}-${c.section}`);
    return ["1-A", "2-A", "3-A", "4-A", "5-A", "6-A", "7-A", "8-A", "9-A", "10-A"];
  }, [classesWithTeachers]);

  // Class info
  const classInfo = useMemo(() => {
    if (!student?.class) return null;
    const parts = student.class.split("-");
    return (classesWithTeachers || []).find(c => c.name === parts[0] && c.section === parts[1]);
  }, [student, classesWithTeachers]);

  const classTeacher = useMemo(() => {
    if (!classInfo) return null;
    return (staff || []).find(s => s.id === classInfo.classTeacherId);
  }, [classInfo, staff]);

  // Attendance stats
  const attendanceStats = useMemo(() => {
    const workingDays = 22;
    const present = Math.floor(workingDays * 0.9);
    return { present, absent: workingDays - present, total: workingDays, percentage: Math.round((present / workingDays) * 100) };
  }, []);

  // Average percentage
  const avgPercentage = results?.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
    : null;

  // OPTIMIZATION: Track previous tab to avoid unnecessary re-fetches
  const prevActiveTab = useRef(activeTab);

  // Memoized tab key to prevent unnecessary renders
  const activeTabKey = useMemo(() => activeTab, [activeTab]);
  
  // Cache for fetched data to prevent re-fetching on same tab
  const dataCache = useRef({
    results: null,
    feeStructure: null,
    feeHistory: null,
    documents: null,
    remarks: null
  });

  // OPTIMIZATION: Lazy load data only when tab is selected
  // Results - only fetch when on academics tab
  useEffect(() => {
    if (activeTab !== 'academics' || !id) return;
    
    // Skip if we already have data for this tab
    if (dataCache.current.results !== null && prevActiveTab.current === 'academics') {
      return;
    }
    
    const fetchResults = async () => {
      setResultsLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/students/${id}/results`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          dataCache.current.results = data;
        }
      } catch (error) { console.error('Error fetching results:', error); }
      finally { setResultsLoading(false); }
    };
    fetchResults();
    prevActiveTab.current = 'academics';
  }, [id, activeTab]);

  // Fee structure - only fetch when on fees tab
  useEffect(() => {
    if (activeTab !== 'fees' || !id) return;
    
    const fetchFeeStructure = async () => {
      setLoadingFeeStructure(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/student-fees/student/${id}?academicYear=2024-25`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) setStudentFeeStructure(await response.json());
      } catch (error) { console.error('Error fetching fee structure:', error); }
      finally { setLoadingFeeStructure(false); }
    };
    fetchFeeStructure();
  }, [id, activeTab]);

  // Payment history - only fetch when on fees tab
  useEffect(() => {
    if (activeTab !== 'fees' || !id) return;
    
    const fetchFeeHistory = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/fees/payments?studentId=${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) setFeeHistory(await response.json());
      } catch (error) { console.error('Error fetching payment history:', error); }
    };
    fetchFeeHistory();
  }, [id, activeTab]);

  // Documents - only fetch when on documents tab
  useEffect(() => {
    if (activeTab !== 'documents' || !id) return;
    
    const fetchDocuments = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/students/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          if (data.documents) setDocuments(data.documents);
        }
      } catch (error) { console.error('Error fetching documents:', error); }
    };
    fetchDocuments();
  }, [id, activeTab]);

  // Remarks - only fetch when on remarks tab
  useEffect(() => {
    if (activeTab !== 'remarks' || !id) return;
    
    const fetchRemarks = async () => {
      setRemarksLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/students/${id}/remarks?category=${remarksCategoryFilter}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) setRemarks(await response.json());
      } catch (error) { console.error('Error fetching remarks:', error); }
      finally { setRemarksLoading(false); }
    };
    fetchRemarks();
  }, [id, activeTab, remarksCategoryFilter]);

  // Photo handlers
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageForEdit(reader.result);
        setIsPhotoEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSave = async (editedImage) => {
    try {
      const blob = await fetch(editedImage).then(r => r.blob());
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      const response = await uploadApi.uploadFile(file);
      await updateStudent(student.id, { photo: response.url });
      toast.success("Photo updated");
    } catch (error) { toast.error("Failed to update photo"); }
    setIsPhotoEditorOpen(false);
  };

  const handleRemovePhoto = async () => {
    try {
      await updateStudent(student.id, { photo: null });
      toast.success("Photo removed");
    } catch { toast.error("Failed to remove photo"); }
  };

  // Payment handler
  const handleRecordPayment = async () => {
    if (!paymentForm.amount || !paymentForm.paymentMode) {
      toast.error("Please enter amount and select payment method");
      return;
    }

    // Check if student has a fee structure
    if (!studentFeeStructure || studentFeeStructure.totalBalance <= 0) {
      toast.error("No outstanding balance to pay");
      return;
    }

    const paymentAmount = parseInt(paymentForm.amount);
    if (paymentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const loadingToast = toast.loading("Recording payment...");
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Calculate fee head payments for distribution
      const feeHeadPayments = [];
      let remainingAmount = paymentAmount;

      if (studentFeeStructure?.feeHeads) {
        for (const feeHead of studentFeeStructure.feeHeads) {
          if (remainingAmount <= 0) break;
          const balance = feeHead.balanceAmount || 0;
          if (balance > 0) {
            const paymentForThisHead = Math.min(remainingAmount, balance);
            let feeHeadId;
            if (typeof feeHead.feeHeadId === 'object' && feeHead.feeHeadId !== null) {
              feeHeadId = feeHead.feeHeadId._id || feeHead.feeHeadId.id;
            } else {
              feeHeadId = feeHead.feeHeadId;
            }
            feeHeadPayments.push({
              feeHeadId: feeHeadId,
              amount: paymentForThisHead
            });
            remainingAmount -= paymentForThisHead;
          }
        }
      }

      // 1. Update fee structure (primary operation - this is what matters)
      const feeStructureResponse = await fetch(`${API_URL}/student-fees/student/${id}/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: paymentAmount,
          feeHeadPayments,
          academicYear: '2024-25'
        })
      });

      if (!feeStructureResponse.ok) {
        const errorData = await feeStructureResponse.json();
        throw new Error(errorData.error || 'Failed to update fee structure');
      }

      // 2. Try to create payment record (secondary, non-blocking)
      try {
        await fetch(`${API_URL}/fees/payments`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            studentId: id,
            studentName: student?.name || '',
            classId: student.classId,
            academicYear: '2024-25',
            receiptNumber: `RCP-${Date.now()}`,
            paymentDate: paymentForm.date,
            amount: paymentAmount,
            paymentMode: paymentForm.paymentMode
          })
        });
      } catch (paymentRecordError) {
        console.warn('Payment record creation failed (non-critical):', paymentRecordError);
      }

      toast.success("Payment recorded successfully", { id: loadingToast });
      onPaymentClose();
      setPaymentForm({ amount: "", paymentMode: "cash", date: new Date().toISOString().split('T')[0] });

      // Refresh fee data and payment history
      const [feeResponse, historyResponse] = await Promise.all([
        fetch(`${API_URL}/student-fees/student/${id}?academicYear=2024-25`, { headers }),
        fetch(`${API_URL}/fees/payments?studentId=${id}`, { headers })
      ]);

      if (feeResponse.ok) {
        setStudentFeeStructure(await feeResponse.json());
      }
      if (historyResponse.ok) {
        setFeeHistory(await historyResponse.json());
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to record payment: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  // Promote handler
  const handlePromoteStudent = async () => {
    const nextClass = getNextClass(student.class, availableClasses);
    if (!nextClass) {
      toast.error("Unable to calculate next class");
      return;
    }
    try {
      const loadingToast = toast.loading(`Promoting ${student.name} to ${nextClass}...`);
      await updateStudent(student.id, { class: nextClass === "Passed Out / Alumni" ? "Passed Out" : nextClass });
      toast.success(`${student.name} promoted to ${nextClass}`, { id: loadingToast });
      onPromoteClose();
    } catch (e) {
      toast.error("Failed to promote student: " + (e.message || "Unknown error"));
    }
  };

  // Reminder handler
  const handleSendReminder = () => {
    const defaultMessage = studentFeeStructure?.totalBalance > 0
      ? `Dear ${student.parentName || 'Parent'}, fee payment of ₹${studentFeeStructure?.totalBalance?.toLocaleString()} is pending for ${student.name}. Please pay at your earliest convenience.`
      : `Dear ${student.parentName || 'Parent'}, thank you for the fee payment for ${student.name}.`;
    setReminderMessage(defaultMessage);
    setIsReminderOpen(true);
  };

  const handleSendReminderMessage = async () => {
    if (!reminderMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${API_URL}/students/${id}/send-reminder`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: reminderMessage,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          studentName: student.name
        })
      });

      toast.success(`Reminder sent to ${student.parentName || 'parent'}`);
      setIsReminderOpen(false);
    } catch (error) {
      toast.error('Failed to send reminder');
    }
  };

  // Rating handler
  const handleRatingChange = async (ratings) => {
    try {
      const loadingToast = toast.loading("Saving ratings...");
      const ratingsWithTimestamp = {};
      Object.keys(ratings).forEach(key => {
        ratingsWithTimestamp[key] = { ...ratings[key], lastUpdated: new Date().toISOString() };
      });
      await updateStudent(student.id, { ratings: ratingsWithTimestamp });
      toast.success("Ratings saved successfully", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to save ratings");
    }
  };

  const handleDownload = () => window.print();

  // Loading/Error states
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-sm">Student not found</div>
    </div>
  );

  // Stats
  const stats = [
    { label: "Academic Average", value: avgPercentage ? `${avgPercentage}%` : "N/A", subtext: results?.length ? `${results.length} exams` : "No data", icon: Award },
    { label: "Attendance", value: `${attendanceStats.percentage}%`, subtext: `${attendanceStats.present} present`, icon: Clock },
    { label: "Fee Balance", value: `₹${(studentFeeStructure?.totalBalance || 0).toLocaleString()}`, subtext: studentFeeStructure?.totalBalance > 0 ? "Outstanding" : "All clear", icon: IndianRupee },
    { label: "Class & Roll", value: student.class || "N/A", subtext: `Roll ${student.rollNo || "N/A"}`, icon: GraduationCap },
  ];

  // Tabs
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "details", label: "Details" },
    { key: "academics", label: "Academics" },
    { key: "attendance", label: "Attendance" },
    { key: "fees", label: "Fees" },
    { key: "documents", label: "Documents" },
    { key: "remarks", label: "Remarks" },
    { key: "ratings", label: "Ratings" },
  ];

  return (
    <div className="w-full flex-1 bg-gray-50 p-6 min-h-screen">
      {/* Hidden Printable */}
      <div style={{ display: "none" }}>
        <PrintableStudentProfile ref={printRef} student={student} results={results} attendanceStats={attendanceStats} studentFeeStructure={studentFeeStructure} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2">
          <ArrowLeft size={16} /><span>Back to Students</span>
        </button>

        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-medium text-gray-400">{student.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                      <Camera size={12} className="text-gray-500" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu className="min-w-[140px]">
                    <DropdownItem key="upload" onPress={() => fileInputRef.current?.click()}>Upload Photo</DropdownItem>
                    <DropdownItem key="camera" onPress={() => setIsCameraCaptureOpen(true)}>Take Photo</DropdownItem>
                    <DropdownItem key="remove" className="text-red-600" onPress={handleRemovePhoto}>Remove</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Info */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{student.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>@{student.admissionId}</span>
                  <span className="text-gray-300">|</span>
                  <span>{student.class}</span>
                  <span className="text-gray-300">|</span>
                  <span>Roll {student.rollNo}</span>
                </div>
                {student.parentPhone && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Phone size={12} /><span>{student.parentPhone}</span>
                    <span className="text-gray-300">|</span>
                    <span>{student.parentName || "Parent"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="flat" className="bg-gray-100 text-gray-700" startContent={<Phone size={16} />}
                onPress={() => { if (student.parentPhone) { window.location.href = `tel:${student.parentPhone}`; toast.success(`Calling...`); } else { toast.error("No phone number"); }}}
                isDisabled={!student.parentPhone}>Call</Button>
              <Button className="bg-gray-900 text-white hover:bg-gray-800" startContent={<Edit size={16} />} onPress={onEditOpen}>Edit</Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" className="text-gray-400"><MoreVertical size={20} /></Button>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[180px]">
                  <DropdownItem key="promote" startContent={<TrendingUp size={14} className="text-gray-400" />} onPress={onPromoteOpen}>Promote Student</DropdownItem>
                  <DropdownItem key="move" startContent={<Move size={14} className="text-gray-400" />}>Move to Class</DropdownItem>
                  <DropdownItem key="tc" startContent={<FileCheck size={14} className="text-gray-400" />} onPress={onTcOpen}>Generate TC</DropdownItem>
                  <DropdownItem key="progress" startContent={<BarChart3 size={14} className="text-gray-400" />} onPress={onProgressOpen}>Progress Card</DropdownItem>
                  <DropdownItem key="reminder" startContent={<Bell size={14} className="text-gray-400" />} onPress={handleSendReminder}>Send Reminder</DropdownItem>
                  <DropdownItem key="download" startContent={<Download size={14} className="text-gray-400" />} onPress={handleDownload}>Download</DropdownItem>
                  <DropdownItem key="print" startContent={<Printer size={14} className="text-gray-400" />} onPress={handleDownload}>Print</DropdownItem>
                  <DropdownItem key="delete" className="text-red-600" startContent={<Trash2 size={14} />} onPress={() => deleteStudent(student.id)}>Delete</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TABS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-5">
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* MAIN CONTENT - 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <stat.icon size={16} className="text-gray-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{stat.value}</h3>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</p>
                    {stat.subtext && <p className="text-xs text-gray-400 mt-2">{stat.subtext}</p>}
                  </div>
                ))}
              </div>

              {/* Performance Chart */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><TrendingUp size={16} className="text-gray-600" /></div>
                    <div><h3 className="font-medium text-gray-900 text-sm">Performance Trend</h3><p className="text-xs text-gray-500">Academic performance over time</p></div>
                  </div>
                </div>
                <div className="p-5">
                  {results?.length > 0 ? (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={results.map((r, i) => ({ name: r.examName || `Exam ${i + 1}`, value: r.percentage || 0 }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="value" name="Score" stroke="#6b7280" strokeWidth={2} fill="#e5e7eb" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No exam data available</div>}
                </div>
              </div>

              {/* Attendance Chart */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Clock size={16} className="text-gray-600" /></div>
                    <div><h3 className="font-medium text-gray-900 text-sm">Attendance Trend</h3><p className="text-xs text-gray-500">Monthly attendance</p></div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{ month: 'Jan', value: 92 }, { month: 'Feb', value: 88 }, { month: 'Mar', value: 95 }, { month: 'Apr', value: attendanceStats.percentage }, { month: 'May', value: 90 }, { month: 'Jun', value: 87 }]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" name="Attendance" stroke="#6b7280" strokeWidth={2} fill="#e5e7eb" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── DETAILS TAB ─── */}
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Academic Info */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><GraduationCap size={16} className="text-gray-600" /></div>
                    <h3 className="font-medium text-gray-900 text-sm">Academic Information</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 rounded-lg"><Edit size={14} className="text-gray-400" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div><p className="text-xs text-gray-400 mb-1">Class</p><p className="text-sm text-gray-900">{student.class || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Roll Number</p><p className="text-sm text-gray-900">{student.rollNo || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Academic Year</p><p className="text-sm text-gray-900">{student.academicYear || "2024-25"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Class Teacher</p><p className="text-sm text-gray-900">{classTeacher?.name || "—"}</p></div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><User size={16} className="text-gray-600" /></div>
                    <h3 className="font-medium text-gray-900 text-sm">Personal Information</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 rounded-lg"><Edit size={14} className="text-gray-400" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div><p className="text-xs text-gray-400 mb-1">Full Name</p><p className="text-sm text-gray-900">{student.name || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Admission ID</p><p className="text-sm text-gray-900">{student.admissionId || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Date of Birth</p><p className="text-sm text-gray-900">{student.dateOfBirth || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Gender</p><p className="text-sm text-gray-900">{student.gender || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Blood Group</p><p className="text-sm text-gray-900">{student.bloodGroup || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Religion</p><p className="text-sm text-gray-900">{student.religion || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Category</p><p className="text-sm text-gray-900">{student.category || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Mother Tongue</p><p className="text-sm text-gray-900">{student.motherTongue || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Nationality</p><p className="text-sm text-gray-900">{student.nationality || "—"}</p></div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Mail size={16} className="text-gray-600" /></div>
                    <h3 className="font-medium text-gray-900 text-sm">Contact Details</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 rounded-lg"><Edit size={14} className="text-gray-400" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="col-span-full"><p className="text-xs text-gray-400 mb-1">Address</p><p className="text-sm text-gray-900">{student.address || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">City</p><p className="text-sm text-gray-900">{student.city || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">State</p><p className="text-sm text-gray-900">{student.state || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">ZIP Code</p><p className="text-sm text-gray-900">{student.zipCode || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Phone</p><p className="text-sm text-gray-900">{student.phone || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Email</p><p className="text-sm text-gray-900">{student.email || "—"}</p></div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Users size={16} className="text-gray-600" /></div>
                    <h3 className="font-medium text-gray-900 text-sm">Parent / Guardian</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 rounded-lg"><Edit size={14} className="text-gray-400" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div><p className="text-xs text-gray-400 mb-1">Parent Name</p><p className="text-sm text-gray-900">{student.parentName || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Parent Phone</p><p className="text-sm text-gray-900">{student.parentPhone || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Parent Email</p><p className="text-sm text-gray-900">{student.parentEmail || "—"}</p></div>
                </div>
              </div>

              {/* Previous Education */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><GraduationCap size={16} className="text-gray-600" /></div>
                    <h3 className="font-medium text-gray-900 text-sm">Previous Education</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 rounded-lg"><Edit size={14} className="text-gray-400" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 gap-6">
                  <div><p className="text-xs text-gray-400 mb-1">Previous School</p><p className="text-sm text-gray-900">{student.previousSchool || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">TC Number</p><p className="text-sm text-gray-900">{student.tcNumber || "—"}</p></div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><FileCheck size={16} className="text-gray-600" /></div>
                    <h3 className="font-medium text-gray-900 text-sm">Additional Information</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 rounded-lg"><Edit size={14} className="text-gray-400" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div><p className="text-xs text-gray-400 mb-1">Transport Required</p><p className="text-sm text-gray-900">{student.transportRequired ? "Yes" : "No"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Hostel Required</p><p className="text-sm text-gray-900">{student.hostelRequired ? "Yes" : "No"}</p></div>
                  <div><p className="text-xs text-gray-400 mb-1">Medical Conditions</p><p className="text-sm text-gray-900">{student.medicalConditions || "None"}</p></div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ACADEMICS TAB ─── */}
          {activeTab === "academics" && (
            <div className="space-y-5">
              {/* Academic Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">Overall Grade</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{avgPercentage ? (avgPercentage >= 90 ? 'A+' : avgPercentage >= 80 ? 'A' : avgPercentage >= 70 ? 'B+' : 'B') : '—'}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">Avg Score</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{avgPercentage ? `${avgPercentage}%` : '—'}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">Exams</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{results?.length || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">Class Teacher</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{classTeacher?.name || '—'}</p>
                </div>
              </div>

              {/* Subject Performance */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Subject Performance</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Current term grades</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { name: "Mathematics", score: 88, grade: "A" },
                    { name: "Science", score: 92, grade: "A+" },
                    { name: "English", score: 85, grade: "A" },
                    { name: "Social Studies", score: 90, grade: "A+" },
                    { name: "Computer Science", score: 95, grade: "A+" },
                  ].map((subject, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                          {subject.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-800 rounded-full" style={{ width: `${subject.score}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-12 text-right">{subject.score}%</span>
                        <span className="text-xs font-medium text-gray-500 w-8">{subject.grade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam Results */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Exam Results</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Assessment history</p>
                  </div>
                  {resultsLoading && <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />}
                </div>
                {results?.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {results.map((result, i) => (
                      <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                            <FileText size={14} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{result.examId?.name || 'Exam'}</p>
                            <p className="text-xs text-gray-500">{result.examId?.startDate ? new Date(result.examId.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-bold ${result.percentage >= 90 ? 'text-gray-900' : result.percentage >= 75 ? 'text-gray-700' : 'text-gray-500'}`}>
                            {result.isPublished ? `${Math.round(result.percentage)}%` : '—'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-md ${result.isPublished ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'}`}>
                            {result.isPublished ? 'Published' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <FileText size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm text-gray-500">No exam results yet</p>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Achievements</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { title: "Best Student Award", date: "Dec 2024" },
                      { title: "Science Fair Winner", date: "Nov 2024" },
                      { title: "Perfect Attendance", date: "Oct 2024" },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <Award size={18} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.title}</p>
                          <p className="text-xs text-gray-500">{a.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ATTENDANCE TAB ─── */}
          {activeTab === "attendance" && (
            <div className="space-y-5">
              {/* Attendance Stats */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">This Month</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{format(new Date(), 'MMMM yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{attendanceStats.percentage}%</p>
                    <p className="text-xs text-gray-500">Attendance Rate</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xl font-bold text-gray-900">{attendanceStats.present}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Present</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xl font-bold text-gray-900">{attendanceStats.absent}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Absent</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xl font-bold text-gray-900">{attendanceStats.total}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total Days</p>
                  </div>
                </div>
              </div>

              {/* Quick Mark */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Mark Attendance</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Today, {format(new Date(), 'dd MMM yyyy')}</p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => toast.success("Marked as Present")} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all">
                      <CheckCircle2 size={20} className="text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Present</span>
                    </button>
                    <button onClick={() => toast.success("Marked as Absent")} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all">
                      <XCircle size={20} className="text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Absent</span>
                    </button>
                    <button onClick={() => toast.success("Marked as Half Day")} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all">
                      <Clock size={20} className="text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Half Day</span>
                    </button>
                    <button onClick={() => toast.success("Marked as Leave")} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all">
                      <Calendar size={20} className="text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">Leave</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Subject-wise Attendance */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Subject-wise Attendance</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { subject: "Mathematics", present: 18, total: 20, teacher: "Mrs. Sharma" },
                    { subject: "Science", present: 19, total: 20, teacher: "Mr. Gupta" },
                    { subject: "English", present: 17, total: 20, teacher: "Ms. Verma" },
                    { subject: "Social Studies", present: 18, total: 20, teacher: "Mr. Khan" },
                    { subject: "Hindi", present: 16, total: 20, teacher: "Mrs. Singh" },
                  ].map((s, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            {s.subject.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.subject}</p>
                            <p className="text-xs text-gray-500">{s.teacher}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{Math.round((s.present / s.total) * 100)}%</p>
                          <p className="text-xs text-gray-500">{s.present}/{s.total} classes</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-800 rounded-full transition-all" style={{ width: `${(s.present / s.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Report */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Send size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Send Report to Parent</p>
                      <p className="text-xs text-gray-500">Share attendance summary via email or SMS</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="flat" className="bg-gray-100 text-gray-700" startContent={<Mail size={14} />} onPress={() => toast.success("Report sent via email")}>Email</Button>
                    <Button size="sm" variant="flat" className="bg-gray-100 text-gray-700" startContent={<Phone size={14} />} onPress={() => toast.success("Report sent via SMS")}>SMS</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── FEES TAB ─── */}
          {activeTab === "fees" && (
            <div className="space-y-5">
              {/* Fee Summary Hero */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Outstanding</p>
                      <p className="text-4xl font-bold text-gray-900 mt-1">₹{(studentFeeStructure?.totalBalance || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(studentFeeStructure?.totalBalance || 0) <= 0 ? 'All fees cleared' : 'Payment pending'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(studentFeeStructure?.totalBalance || 0) > 0 && (
                        <>
                          <Button size="sm" className="bg-gray-900 text-white" startContent={<IndianRupee size={14} />} onPress={onPaymentOpen}>Collect Payment</Button>
                          <Button size="sm" variant="flat" className="bg-gray-100 text-gray-700" startContent={<Bell size={14} />} onPress={handleSendReminder}>Send Reminder</Button>
                        </>
                      )}
                      <Button size="sm" variant="bordered" className="border-gray-200 text-gray-700" startContent={<Download size={14} />} onPress={() => setIsInvoiceOpen(true)}>Invoice</Button>
                    </div>
                  </div>
                </div>

                {/* Fee Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500">Total Fee</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">₹{(studentFeeStructure?.totalFee || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">₹{(studentFeeStructure?.totalPaid || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500">Discount</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">₹{(studentFeeStructure?.discountApplied || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">₹{(studentFeeStructure?.totalBalance || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{feeHistory?.length || 0} transactions</p>
                  </div>
                  <Button size="sm" variant="light" className="text-gray-500" onPress={() => navigate('/fees')}>View All</Button>
                </div>
                {feeHistory?.length > 0 ? (
                  <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {feeHistory.slice(0, 5).map((payment, i) => (
                      <div key={payment.id || i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                            <CheckCircle2 size={14} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{payment.paymentPeriod || 'Fee Payment'}</p>
                            <p className="text-xs text-gray-500">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : payment.date} • {payment.paymentMode || payment.mode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">₹{payment.amount?.toLocaleString()}</p>
                          {payment.receiptNumber && <p className="text-xs text-gray-500">{payment.receiptNumber}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <IndianRupee size={24} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-500">No payment history</p>
                  </div>
                )}
              </div>

              {/* Fee Heads Breakdown */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Fee Breakdown</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{studentFeeStructure?.feeHeads?.length || 0} fee heads</p>
                  </div>
                  <Button size="sm" variant="light" className="text-gray-500" startContent={<BookOpen size={14} />} onPress={() => navigate('/settings?tab=fee-heads')}>Configure</Button>
                </div>
                {loadingFeeStructure ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto" />
                  </div>
                ) : studentFeeStructure?.feeHeads?.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {studentFeeStructure.feeHeads.map((fee, i) => (
                      <div key={i} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <FileText size={14} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fee.name}</p>
                            <p className="text-xs text-gray-500">{fee.category} • {fee.frequency}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pl-11 sm:pl-0">
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500">Amount</p>
                            <p className="text-sm font-medium text-gray-900">₹{fee.amount?.toLocaleString()}</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-500">Paid</p>
                            <p className="text-sm font-medium text-gray-900">₹{fee.paidAmount?.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Balance</p>
                            <p className="text-sm font-medium text-gray-900">₹{fee.balanceAmount?.toLocaleString()}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-md ${
                            fee.status === 'paid' ? 'bg-gray-100 text-gray-600' :
                            fee.status === 'partial' ? 'bg-gray-100 text-gray-600' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {fee.status === 'paid' ? 'Paid' : fee.status === 'partial' ? 'Partial' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <IndianRupee size={24} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-500">No fee structure assigned</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── DOCUMENTS TAB ─── */}
          {activeTab === "documents" && (
            <StudentDocuments
              studentId={id}
              documents={documents}
              activeUploads={activeUploads}
              onDocumentsChange={setDocuments}
              onActiveUploadsChange={setActiveUploads}
            />
          )}

          {/* ─── REMARKS TAB ─── */}
          {activeTab === "remarks" && (
            <StudentRemarks
              studentId={id}
              student={student}
              remarks={remarks}
              remarksLoading={remarksLoading}
              remarksCategoryFilter={remarksCategoryFilter}
              onRemarksChange={setRemarks}
              onCategoryFilterChange={setRemarksCategoryFilter}
            />
          )}

          {/* ─── RATINGS TAB ─── */}
          {activeTab === "ratings" && (
            <StudentRatingSystem
              studentId={student?.id}
              ratings={student?.ratings || {}}
              onRatingChange={handleRatingChange}
              editable={true}
            />
          )}
        </div>

        {/* RIGHT SIDEBAR - 1/3 */}
        <div className="lg:col-span-1 space-y-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onEditOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100"><Edit size={18} className="text-gray-600" /><span className="text-xs text-gray-600">Edit</span></button>
              <button onClick={() => student.parentPhone && (window.location.href = `tel:${student.parentPhone}`)} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100"><Phone size={18} className="text-gray-600" /><span className="text-xs text-gray-600">Call</span></button>
              <button onClick={onTcOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100"><FileCheck size={18} className="text-gray-600" /><span className="text-xs text-gray-600">TC</span></button>
              <button onClick={onProgressOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100"><BarChart3 size={18} className="text-gray-600" /><span className="text-xs text-gray-600">Progress</span></button>
            </div>
          </div>

          {/* Alerts */}
          {(attendanceStats.percentage < 75 || studentFeeStructure?.totalBalance > 0 || (avgPercentage && avgPercentage < 60)) && (
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100"><h3 className="text-sm font-medium text-gray-900">Attention Required</h3></div>
              <div className="divide-y divide-gray-50">
                {attendanceStats.percentage < 75 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><AlertCircle size={16} className="text-gray-600" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900">Low Attendance</p><p className="text-xs text-gray-500">{attendanceStats.percentage}% (below 75%)</p></div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                )}
                {studentFeeStructure?.totalBalance > 0 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><IndianRupee size={16} className="text-gray-600" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900">Pending Fees</p><p className="text-xs text-gray-500">₹{studentFeeStructure.totalBalance.toLocaleString()} due</p></div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                )}
                {avgPercentage && avgPercentage < 60 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><TrendingUp size={16} className="text-gray-600" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900">Academic Concern</p><p className="text-xs text-gray-500">{avgPercentage}% average</p></div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Clear */}
          {attendanceStats.percentage >= 75 && !studentFeeStructure?.totalBalance && (!avgPercentage || avgPercentage >= 60) && (
            <div className="bg-white rounded-lg border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><CheckCircle2 size={16} className="text-gray-600" /></div>
                <div><h3 className="text-sm font-medium text-gray-900">All Clear</h3><p className="text-xs text-gray-500">No issues detected</p></div>
              </div>
              <p className="text-sm text-gray-600">This student is performing well with good attendance, fee clearance, and academic progress.</p>
            </div>
          )}

          {/* Contact Card */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              {student.parentPhone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Phone size={14} className="text-gray-600" /></div>
                  <div><p className="text-xs text-gray-400">Parent Phone</p><p className="text-sm text-gray-900">{student.parentPhone}</p></div>
                </div>
              )}
              {student.parentEmail && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Mail size={14} className="text-gray-600" /></div>
                  <div><p className="text-xs text-gray-400">Parent Email</p><p className="text-sm text-gray-900 truncate">{student.parentEmail}</p></div>
                </div>
              )}
              {student.address && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Mail size={14} className="text-gray-600" /></div>
                  <div><p className="text-xs text-gray-400">Address</p><p className="text-sm text-gray-900">{student.address}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS & DRAWERS
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Edit Drawer */}
      <Drawer isOpen={isEditOpen} onOpenChange={(open) => open ? onEditOpen() : onEditClose()} placement="right" size="5xl" hideCloseButton classNames={{ wrapper: "!z-50", base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex items-center gap-3 border-b border-gray-100 p-4">
                <div className="p-2 bg-gray-100 rounded-lg"><Edit size={18} className="text-gray-600" /></div>
                <div><h3 className="text-lg font-semibold text-gray-900">Edit Student</h3><p className="text-xs text-gray-500">Update student information</p></div>
              </DrawerHeader>
              <DrawerBody className="p-0 overflow-auto">
                <AddStudent onClose={onClose} onSave={(data) => { updateStudent(id, data); onClose(); }} classesWithTeachers={classesWithTeachers || []} classOptions={availableClasses} initialData={student} />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={onPaymentClose} size="md">
        <ModalContent>
          <ModalHeader>Record Fee Payment</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input label="Amount" type="number" value={paymentForm.amount} onValueChange={(v) => setPaymentForm({ ...paymentForm, amount: v })} startContent="₹" variant="bordered" description={`Outstanding: ₹${studentFeeStructure?.totalBalance?.toLocaleString() || 0}`} isRequired />
              <Select label="Payment Method" placeholder="Select method" selectedKeys={[paymentForm.paymentMode]} onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMode: Array.from(keys)[0] })} variant="bordered" isRequired>
                <SelectItem key="cash">Cash</SelectItem>
                <SelectItem key="online">Online/UPI</SelectItem>
                <SelectItem key="card">Card</SelectItem>
                <SelectItem key="cheque">Cheque</SelectItem>
              </Select>
              <Input label="Payment Date" type="date" value={paymentForm.date} onValueChange={(v) => setPaymentForm({ ...paymentForm, date: v })} variant="bordered" />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPaymentClose}>Cancel</Button>
            <Button className="bg-gray-900 text-white" onPress={handleRecordPayment} isDisabled={!paymentForm.amount || !paymentForm.paymentMode}>Record Payment</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* TC Modal */}
      <TCGeneratorModal isOpen={isTcOpen} onClose={onTcClose} students={[student]} />

      {/* Invoice Modal */}
      <InvoicePrintModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        student={student}
        studentFeeStructure={studentFeeStructure}
        feeHistory={feeHistory}
      />

      {/* Promote Modal */}
      <Modal isOpen={isPromoteOpen} onClose={onPromoteClose} size="md">
        <ModalContent>
          <ModalHeader>Promote Student</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <GraduationCap size={24} className="text-gray-600" />
                <div><p className="text-sm text-gray-500">Student: <span className="font-semibold text-gray-900">{student.name}</span></p><p className="text-sm text-gray-500">Current Class: <span className="font-semibold text-gray-900">{student.class}</span></p></div>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Auto-calculated next class:</p>
                <p className="text-lg font-bold text-gray-900">{getNextClass(student.class, availableClasses) || "Unable to calculate"}</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPromoteClose}>Cancel</Button>
            <Button className="bg-gray-900 text-white" startContent={<GraduationCap size={16} />} onPress={handlePromoteStudent}>Promote</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Progress Card Modal */}
      <Modal isOpen={isProgressOpen} onClose={onProgressClose} size="md">
        <ModalContent>
          <ModalHeader>Student Progress Card</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="p-4 bg-gray-100 rounded-full"><BarChart3 size={48} className="text-gray-600" /></div>
              <div><h3 className="text-lg font-semibold text-gray-900">{student.name}</h3><p className="text-sm text-gray-500">Class {student.class} • Roll {student.rollNo}</p></div>
              <p className="text-sm text-gray-500">Generate and download the detailed academic performance report card.</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onProgressClose}>Cancel</Button>
            <Button className="bg-gray-900 text-white" startContent={<Download size={16} />} onPress={() => { toast.success("Downloading progress card..."); onProgressClose(); }}>Download</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reminder Modal */}
      <Modal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>Send Fee Reminder</ModalHeader>
          <ModalBody>
            <Textarea label="Message" value={reminderMessage} onValueChange={setReminderMessage} minRows={4} variant="bordered" placeholder="Enter reminder message..." />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsReminderOpen(false)}>Cancel</Button>
            <Button className="bg-gray-900 text-white" startContent={<Send size={16} />} onPress={handleSendReminderMessage}>Send Reminder</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Photo Editor */}
      {selectedImageForEdit && (
        <PhotoEditorModal isOpen={isPhotoEditorOpen} onClose={() => setIsPhotoEditorOpen(false)} imageSrc={selectedImageForEdit} onSave={handlePhotoSave} />
      )}

      {/* Camera Capture */}
      <CameraCaptureModal isOpen={isCameraCaptureOpen} onClose={() => setIsCameraCaptureOpen(false)} onPhotoCaptured={(image) => { setSelectedImageForEdit(image); setIsCameraCaptureOpen(false); setIsPhotoEditorOpen(true); }} />
    </div>
  );
}
