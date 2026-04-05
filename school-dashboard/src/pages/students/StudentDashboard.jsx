import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import lazyWithRetry from "../../utils/lazyWithRetry";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import {
  Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, useDisclosure,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Drawer, DrawerContent, DrawerHeader, DrawerBody,
  Input, Select, SelectItem, Textarea,
} from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import {
  ArrowLeft, Phone, IndianRupee, User, GraduationCap, FileText, Download, Edit,
  Clock, CheckCircle2, Award, TrendingUp, Camera, FileCheck,
  Printer, MoreVertical, ChevronRight, BarChart3, Trash2, Bell, Move,
  Users, Mail, Calendar, AlertCircle, BookOpen, XCircle,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { feesApi, studentFeesApi, studentsApi, uploadApi, attendanceApi, trashApi } from "../../services/api";
import { CHART_COLORS } from "../../utils/chartTheme";
import { escapeHtml } from "../../utils/sanitize";
const AddStudent = lazyWithRetry(() => import("./AddStudent"));
import TCGeneratorModal from "./TCGeneratorModal";
import PhotoEditorModal from "../../components/PhotoEditorModal";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import PrintableStudentProfile from "./components/PrintableStudentProfile";
import StudentDocuments from "./components/StudentDocuments";
import StudentRemarks from "./components/StudentRemarks";
import StudentRatingSystem from "./components/StudentRatingSystem";
import InvoicePrintModal from "./components/InvoicePrintModal";
import MoveClassModal from "./components/modals/MoveClassModal";
import CertificateModal from "./components/modals/CertificateModal";
import { useStudentAttendance, useStudentData, useStudentFees, useStudentRemarks, useStudentResults } from "./hooks";
import { useTranslation } from 'react-i18next';
import { DetailPageSkeleton } from '../../components/skeletons/PageSkeletons';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import { getDateLocale } from '../../i18n/index';
import { getGradeFromPercentage } from '../../utils/grading';


import { formatShortDate, formatCurrency, toTodayDateString } from '../../utils/dateFormatter';
import { distributeFeePayment } from './utils/studentHelpers';

// ============================================================================
// STUDENT DASHBOARD - COMPLETE REFACTOR
// Dashboard style, full page, rounded corners, all features
// ============================================================================

// confirmPermanentDeletion moved to ConfirmDialog in render

// Helper to get next class for promotion
const getNextClass = (currentClass, _availableClasses) => {
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
  if (currentGrade >= 12) return "Passed Out / Alumni";
  return `${currentGrade + 1}${match[2] ? `-${match[2]}` : ""}`;
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50">
        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">{label}</p>
        {payload.map((entry) => (
          <div key={`tooltip-${entry.name}`} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-600 dark:text-zinc-400">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-zinc-100">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { params: { id }, isValid } = useValidatedParams({ id: 'objectId' }, { redirectTo: '/students' });
  const navigate = useNavigate();
  const { getStudentById, classesWithTeachers, staff, updateStudent, deleteStudent, loading, currentAcademicYear } = useApp();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // Modals
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isTcOpen, onOpen: onTcOpen, onClose: onTcClose } = useDisclosure();
  const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
  const { isOpen: isProgressOpen, onOpen: onProgressOpen, onClose: onProgressClose } = useDisclosure();
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();
  const { isOpen: isBonafideOpen, onOpen: onBonafideOpen, onClose: onBonafideClose } = useDisclosure();
  const { isOpen: isCharacterOpen, onOpen: onCharacterOpen, onClose: onCharacterClose } = useDisclosure();
  const [isMoveClassOpen, setIsMoveClassOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // States
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);
  const [remarksCategoryFilter, setRemarksCategoryFilter] = useState('all');
  const [remarksOverride, setRemarksOverride] = useState(null);
  const [todayAttendanceStatus, setTodayAttendanceStatus] = useState(null);

  // Photo states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const printRef = useRef(null);
  const editStudentRef = useRef(null);

  // Handle backdrop click for unsaved changes check
  useEffect(() => {
    if (!isEditOpen) return;
    const handleBackdropClick = (e) => {
      const backdrop = e.target.closest?.('[data-slot="backdrop"]') || (e.target.getAttribute?.('data-slot') === 'backdrop' ? e.target : null);
      if (backdrop) {
        if (editStudentRef.current) editStudentRef.current.attemptClose();
        else onEditClose();
      }
    };
    document.addEventListener('click', handleBackdropClick, true);
    return () => document.removeEventListener('click', handleBackdropClick, true);
  }, [isEditOpen, onEditClose]);

  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

  // Form states
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentMode: "cash", date: toTodayDateString() });
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  // Use academic year boundaries instead of calendar year for attendance data
  const attendanceStartDate = useMemo(() => {
    if (!currentAcademicYear) return `${new Date().getFullYear()}-01-01`;
    const [startYear] = currentAcademicYear.split('-').map(Number);
    return startYear ? `${startYear}-04-01` : `${new Date().getFullYear()}-01-01`; // Academic year typically starts April
  }, [currentAcademicYear]);
  const attendanceEndDate = useMemo(() => {
    if (!currentAcademicYear) return `${new Date().getFullYear()}-12-31`;
    const parts = currentAcademicYear.split('-').map(Number);
    const endYear = parts[1] || parts[0];
    return endYear ? `${endYear}-03-31` : `${new Date().getFullYear()}-12-31`; // Academic year typically ends March
  }, [currentAcademicYear]);

  const contextStudent = getStudentById(id);
  const { student: hydratedStudent, loading: studentDataLoading, error: studentError, refetch: refetchStudent } = useStudentData(id);
  const student = hydratedStudent || contextStudent;
  const { attendanceData, attendanceStats, loading: attendanceLoading, error: attendanceError, refetch: refetchAttendance } = useStudentAttendance(id, {
    startDate: attendanceStartDate,
    endDate: attendanceEndDate,
  });

  // Derive today's attendance status from fetched data
  useEffect(() => {
    if (attendanceData?.length > 0) {
      const todayDate = toTodayDateString();
      const todayRecord = attendanceData.find(record => (record.date || '').split('T')[0] === todayDate);
      if (todayRecord?.status) setTodayAttendanceStatus(todayRecord.status);
    }
  }, [attendanceData]);

  const { results, loading: resultsLoading, error: resultsError, refetch: refetchResults } = useStudentResults(id);
  const { remarks, loading: remarksLoading, error: remarksError, refetch: refetchRemarks } = useStudentRemarks(id, { category: remarksCategoryFilter });
  const {
    feeStructure: studentFeeStructure,
    loading: loadingFeeStructure,
    refetch: refetchFeeStructure,
  } = useStudentFees(id, { academicYear: currentAcademicYear });
  const feeHistoryQuery = useQuery({
    queryKey: ["students", "fee-history", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { payments } = await feesApi.getPayments({ studentId: id });
      return payments;
    },
  });
  const feeHistory = feeHistoryQuery.data || [];
  const displayedRemarks = remarksOverride || remarks;

  // Available classes
  const availableClasses = useMemo(() => {
    if (classesWithTeachers?.length) return classesWithTeachers.map(cls => `${cls.name}-${cls.section}`);
    return []; // Return empty array instead of fake hardcoded classes
  }, [classesWithTeachers]);

  // Class info
  const classInfo = useMemo(() => {
    if (!student?.class || typeof student.class !== 'string') return null;
    const parts = student.class.split("-");
    return (classesWithTeachers || []).find(cls => cls.name === parts[0] && cls.section === parts[1]);
  }, [student, classesWithTeachers]);

  const classTeacher = useMemo(() => {
    if (!classInfo) return null;
    return (staff || []).find(staffMember => staffMember.id === classInfo.classTeacherId);
  }, [classInfo, staff]);

  // Calculate monthly attendance for chart
  // NOTE: If only one month has attendance records (e.g. seed data only covers March),
  // the chart will show a spike for that month and 0% for all others. This is expected
  // behavior -- the chart fills in naturally as teachers mark attendance each month.
  const monthlyAttendanceData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const attendanceYear = new Date().getFullYear();

    return months.map((month, index) => {
      const monthData = attendanceData.filter(att => {
        const attDate = new Date(att.date);
        return attDate.getMonth() === index && attDate.getFullYear() === attendanceYear;
      });

      const present = monthData.filter(att => att.status === 'present').length;
      const percentage = monthData.length > 0 ? Math.round((present / monthData.length) * 100) : 0;

      return { month, value: percentage };
    });
  }, [attendanceData]);

  // Average percentage
  const avgPercentage = results?.length > 0
    ? Math.round(results.reduce((sum, result) => sum + (result.percentage || 0), 0) / results.length)
    : null;

  useEffect(() => {
    if (Array.isArray(hydratedStudent?.documents)) {
      setDocuments(hydratedStudent.documents);
    }
  }, [hydratedStudent?.documents]);

  useEffect(() => {
    setRemarksOverride(null);
  }, [remarks]);

  // Photo handlers
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(t('toast.error.fileTooLarge', 'File size must be less than 5MB'));
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageForEdit(reader.result);
        setIsPhotoEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSave = async (croppedBlob) => {
    setIsUploadingPhoto(true);
    try {
      const file = new File([croppedBlob], 'photo.jpg', { type: 'image/jpeg' });
      const response = await uploadApi.uploadFile(file);
      await updateStudent(student.id, { photo: response.url });
      toast.success(t('toast.success.photoUpdated'));
    } catch { toast.error(t('toast.error.failedToUpdatePhoto')); }
    finally { setIsUploadingPhoto(false); }
    setIsPhotoEditorOpen(false);
  };

  const handleRemovePhoto = async () => {
    try {
      await updateStudent(student.id, { photo: null });
      toast.success(t('toast.success.photoRemoved'));
    } catch { toast.error(t('toast.error.failedToRemovePhoto')); }
  };

  // Payment handler
  const handleRecordPayment = async () => {
    if (!paymentForm.amount || !paymentForm.paymentMode) {
      toast.error(t('toast.error.pleaseEnterAmountAndSelectPaymentMethod'));
      return;
    }

    // Check if student has a fee structure
    if (!studentFeeStructure || studentFeeStructure.totalBalance <= 0) {
      toast.error(t('toast.error.noOutstandingBalanceToPay'));
      return;
    }

    const paymentAmount = parseFloat(paymentForm.amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      toast.error(t('toast.error.pleaseEnterAValidAmount'));
      return;
    }

    const totalBalance = studentFeeStructure?.totalBalance || 0;
    if (paymentAmount > totalBalance) {
      toast.error(`Amount cannot exceed outstanding balance of ₹${formatCurrency(totalBalance)}`);
      return;
    }

    setIsRecordingPayment(true);
    const loadingToast = toast.loading(t('toast.loading.recordingPayment'));
    try {
      // Calculate fee head payments for distribution
      const feeHeadPayments = studentFeeStructure?.feeHeads
        ? distributeFeePayment(studentFeeStructure.feeHeads, paymentAmount)
        : [];

      // Update fee structure and create payment record (single endpoint handles both)
      await studentFeesApi.recordPayment(id, {
        amount: paymentAmount,
        feeHeadPayments,
        paymentMode: paymentForm.paymentMode,
        academicYear: currentAcademicYear
      });

      toast.success("Payment recorded successfully", { id: loadingToast });
      onPaymentClose();
      setShowPaymentConfirm(false);
      setPaymentForm({ amount: "", paymentMode: "cash", date: toTodayDateString() });

      await Promise.all([
        refetchFeeStructure(),
        feeHistoryQuery.refetch(),
        refetchStudent(),
      ]);
      void queryClient.invalidateQueries({ queryKey: ["app-context-data"] });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(t('toast.error.failedToRecordPayment', 'Failed to record payment') + ": " + (error.message || t('common.unknownError', 'Unknown error')), { id: loadingToast });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Promote handler — uses dedicated POST /students/:id/promote endpoint
  const handlePromoteStudent = async () => {
    const nextClass = getNextClass(student.class, availableClasses);
    if (!nextClass) {
      toast.error(t('toast.error.unableToCalculateNextClass'));
      return;
    }
    try {
      const loadingToast = toast.loading(t('toast.loading.promotingStudent', { name: student.name, class: nextClass, defaultValue: `Promoting ${student.name} to ${nextClass}...` }));
      if (nextClass === "Passed Out / Alumni") {
        await studentsApi.promote(id, { graduate: true });
      } else {
        // Resolve classId from display string
        const classMatch = nextClass.match(/^(\d+|[A-Za-z]+)(?:-([A-Z]))?$/i);
        let targetClassId = null;
        if (classMatch) {
          const [, grade, section = ""] = classMatch;
          const target = (classesWithTeachers || []).find((cls) => String(cls.name) === String(grade) && (cls.section || "") === String(section));
          if (target) targetClassId = target._id || target.id;
        }
        if (targetClassId) {
          await studentsApi.promote(id, { targetClassId });
        } else {
          toast.error(t('toast.error.classNotFound', { class: nextClass, defaultValue: `Target class "${nextClass}" not found. Create the class first.` }), { id: loadingToast });
          return;
        }
      }
      toast.success(t('toast.success.studentPromoted', { name: student.name, class: nextClass, defaultValue: `${student.name} promoted to ${nextClass}` }), { id: loadingToast });
      onPromoteClose();
      refetchStudent();
    } catch (e) {
      toast.error("Failed to promote student: " + (e.message || "Unknown error"));
    }
  };

  // Reminder handler
  const handleSendReminder = () => {
    const defaultMessage = studentFeeStructure?.totalBalance > 0
      ? `Dear ${student.parentName || 'Parent'}, fee payment of ₹${formatCurrency(studentFeeStructure?.totalBalance)} is pending for ${student.name}. Please pay at your earliest convenience.`
      : `Dear ${student.parentName || 'Parent'}, thank you for the fee payment for ${student.name}.`;
    setReminderMessage(defaultMessage);
    setIsReminderOpen(true);
  };

  const handleSendReminderMessage = async () => {
    if (!reminderMessage.trim()) {
      toast.error(t('toast.error.pleaseEnterAMessage'));
      return;
    }
    try {
      const resolvedEmail = student.parentEmail || student.parents?.find(par => par.isParent !== false)?.email || student.parents?.[0]?.email || '';
      const resolvedPhone = student.parentPhone || student.parents?.find(par => par.isParent !== false)?.phone || student.parents?.[0]?.phone || '';
      await studentsApi.sendReminder(id, {
        type: 'fee',
        message: reminderMessage,
        parentPhone: resolvedPhone,
        parentEmail: resolvedEmail,
        studentName: student.name
      });

      toast.success(`Reminder sent to ${student.parentName || 'parent'}`);
      setIsReminderOpen(false);
    } catch {
      toast.error(t('toast.error.failedToSendReminder'));
    }
  };

  // Quick attendance marking handler (MF-13)
  const handleQuickMarkAttendance = async (status) => {
    if (!student?.id) return;
    const todayDate = toTodayDateString();
    const loadingToast = toast.loading(`Marking as ${status}...`);
    try {
      await attendanceApi.mark({
        studentId: student.id,
        classId: student.classId?._id || student.classId,
        date: todayDate,
        status,
        clientTimestamp: new Date().toISOString()
      });
      setTodayAttendanceStatus(status);
      toast.success(`Marked as ${status.charAt(0).toUpperCase() + status.slice(1)}`, { id: loadingToast });
      // Refresh attendance stats
      refetchAttendance();
    } catch (error) {
      toast.error(`Failed to mark attendance: ${error.message || 'Unknown error'}`, { id: loadingToast });
    }
  };

  // Send attendance report handler (MF-15)
  const handleSendAttendanceReport = async (channel) => {
    if (!student?.id) return;
    const loadingToast = toast.loading(`Sending report via ${channel === 'email' ? 'Email' : 'SMS'}...`);
    try {
      const message = `Attendance Report for ${student.name}: ${attendanceStats.percentage}% attendance (${attendanceStats.present} present, ${attendanceStats.absent} absent out of ${attendanceStats.total} days).`;
      const resolvedEmail = student.parentEmail || student.parents?.find(par => par.isParent !== false)?.email || student.parents?.[0]?.email || '';
      const resolvedPhone = student.parentPhone || student.parents?.find(par => par.isParent !== false)?.phone || student.parents?.[0]?.phone || '';
      await studentsApi.sendReminder(id, {
        type: 'attendance',
        message,
        channel,
        parentPhone: resolvedPhone,
        parentEmail: resolvedEmail,
        studentName: student.name,
      });
      toast.success(`Report sent via ${channel === 'email' ? 'Email' : 'SMS'}`, { id: loadingToast });
    } catch (error) {
      toast.error(`Failed to send report: ${error.message || 'Unknown error'}`, { id: loadingToast });
    }
  };

  // Rating handler
  const handleRatingChange = async (ratings) => {
    try {
      const loadingToast = toast.loading(t('toast.loading.savingRatings'));
      const ratingsWithTimestamp = {};
      Object.keys(ratings).forEach(key => {
        ratingsWithTimestamp[key] = { ...ratings[key], lastUpdated: new Date().toISOString() };
      });
      await updateStudent(student.id, { ratings: ratingsWithTimestamp });
      toast.success("Ratings saved successfully", { id: loadingToast });
    } catch {
      toast.error(t('toast.error.failedToSaveRatings'));
    }
  };

  const handleDownload = () => window.print();

  // MF-16: Generate branded progress card PDF using print-to-PDF
  const handleProgressCardDownload = () => {
    const studentResults = results || [];
    const photo = student?.photo || student?.picture || '';
    const resultRows = studentResults.map(res => `
      <tr>
        <td>${escapeHtml(res.examName || res.exam?.name || '—')}</td>
        <td>${escapeHtml(res.subject || '—')}</td>
        <td style="text-align:center">${escapeHtml(res.marksObtained ?? res.marks ?? '—')}</td>
        <td style="text-align:center">${escapeHtml(res.totalMarks ?? '—')}</td>
        <td style="text-align:center">${res.percentage != null ? escapeHtml(res.percentage) + '%' : '—'}</td>
        <td style="text-align:center">${escapeHtml(res.grade || '—')}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Progress Card – ${escapeHtml(student?.name || '')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;padding:36px;max-width:800px;margin:auto}
.header{display:flex;align-items:flex-start;gap:20px;border-bottom:3px solid #111;padding-bottom:16px;margin-bottom:24px}
.photo{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #ddd}
.photo-placeholder{width:80px;height:80px;border-radius:50%;background:#f3f4f6;border:2px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#9ca3af}
.school-name{font-size:18px;font-weight:700;margin-bottom:2px}
.title{font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
.student-name{font-size:22px;font-weight:700;margin-bottom:4px}
.meta{font-size:13px;color:#6b7280}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.stat{border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center}
.stat-val{font-size:22px;font-weight:700;color:#111}
.stat-lbl{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f9fafb;border:1px solid #e5e7eb;padding:10px 12px;text-align:left;font-weight:600;color:#374151;font-size:11px;text-transform:uppercase}
td{border:1px solid #e5e7eb;padding:9px 12px}
tr:hover td{background:#f9fafb}
.footer{text-align:center;font-size:11px;color:#aaa;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px}
@media print{body{padding:20px}}
</style></head><body>
<div class="header">
  <div style="flex:1">
    <div class="school-name">School Progress Card</div>
    <div class="title">Academic Performance Report</div>
  </div>
  <div style="text-align:right">
    ${photo ? `<img class="photo" src="${escapeHtml(photo)}" alt="photo"/>` : `<div class="photo-placeholder">${escapeHtml((student?.name || 'S')[0])}</div>`}
    <div style="margin-top:8px;font-size:12px;color:#6b7280">${student?.rollNo ? 'Roll: ' + escapeHtml(student.rollNo) : ''}</div>
  </div>
</div>
<div style="margin-bottom:20px">
  <div class="student-name">${escapeHtml(student?.name || '')}</div>
  <div class="meta">Class ${escapeHtml(student?.class || '—')} &nbsp;•&nbsp; Admission No: ${escapeHtml(student?.admissionId || '—')}</div>
</div>
<div class="stats">
  <div class="stat"><div class="stat-val">${avgPercentage != null ? escapeHtml(avgPercentage) + '%' : '—'}</div><div class="stat-lbl">Average</div></div>
  <div class="stat"><div class="stat-val">${escapeHtml(studentResults.length)}</div><div class="stat-lbl">Exams</div></div>
  <div class="stat"><div class="stat-val">${attendanceStats.percentage != null ? escapeHtml(attendanceStats.percentage) + '%' : '—'}</div><div class="stat-lbl">Attendance</div></div>
</div>
${studentResults.length > 0 ? `
<table>
  <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Total</th><th>%</th><th>Grade</th></tr></thead>
  <tbody>${resultRows}</tbody>
</table>` : '<p style="text-align:center;color:#9ca3af;padding:20px">No result records found</p>'}
<div class="footer">Generated on ${new Date().toLocaleString(getDateLocale())} — Confidential</div>
</body></html>`;
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) { toast.error('Pop-up blocked. Allow pop-ups to generate PDF.'); return; }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };

  if (!isValid) return null;

  // Loading/Error states
  if (loading || studentDataLoading) return (
    <div className="min-h-screen p-6">
      <DetailPageSkeleton avatar fields={8} />
    </div>
  );

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-gray-400 dark:text-zinc-500 text-sm">
          {studentError ? t('toast.error.failedToLoadStudent', 'Failed to load student data') : t('pages.studentNotFound')}
        </div>
        {studentError && (
          <Button size="sm" variant="bordered" onPress={() => refetchStudent()}>
            {t('common.tryAgain', 'Try Again')}
          </Button>
        )}
        <div>
          <Button size="sm" variant="light" onPress={() => navigate('/students')}>
            {t('pages.backToStudents', 'Back to Students')}
          </Button>
        </div>
      </div>
    </div>
  );

  // Stats - Actionable KPIs with tab navigation and color coding
  const attendancePct = attendanceStats.percentage;
  const feeBalance = studentFeeStructure?.totalBalance || 0;
  const stats = [
    {
      label: "Academic Average",
      value: avgPercentage ? `${avgPercentage}%` : "N/A",
      subtext: results?.length ? `${results.length} exams` : "No data",
      icon: Award,
      tab: "academics",
      actionLabel: "View Results",
    },
    {
      label: "Attendance",
      value: `${attendancePct}%`,
      subtext: `${attendanceStats.present} present`,
      icon: Clock,
      tab: "attendance",
      actionLabel: "View Details",
    },
    {
      label: "Fee Balance",
      value: `₹${formatCurrency(feeBalance)}`,
      subtext: feeBalance > 0 ? "Outstanding" : "All clear",
      icon: IndianRupee,
      tab: "fees",
      actionLabel: feeBalance > 0 ? "Pay Now" : "View History",
    },
    {
      label: "Class & Roll",
      value: student.class || "N/A",
      subtext: `Roll ${student.rollNo || "N/A"}`,
      icon: GraduationCap,
      navigateTo: student?.classId ? `/classes/${student.classId?._id || student.classId}` : null,
      actionLabel: "View Class",
    },
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

  // Portal for print content - renders directly to body
  const printContent = (
    <div className="print-only">
      <PrintableStudentProfile 
        ref={printRef} 
        student={student} 
        results={results} 
        attendanceStats={attendanceStats}
        attendanceData={attendanceData}
        studentFeeStructure={studentFeeStructure}
        feeHistory={feeHistory}
        documents={documents}
        remarks={displayedRemarks}
        classTeacher={classTeacher}
      />
    </div>
  );

  return (
    <>
      {/* Printable content rendered via Portal to body */}
      {createPortal(printContent, document.body)}
      
      <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-950 p-6 min-h-screen">

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <button onClick={() => navigate('/students')} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors mb-2">
          <ArrowLeft size={16} />
          <span>{t('common.students', 'Students')}</span>
          {student && <><span className="text-gray-300 dark:text-zinc-600">/</span><span className="text-gray-700 dark:text-zinc-300 font-medium truncate max-w-[200px]">{student.name}</span></>}
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} aria-label="Upload student photo" />
                <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center relative">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-xl font-bold text-gray-400 dark:text-zinc-500">{student.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <Camera size={13} className="text-gray-500 dark:text-zinc-400" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu className="min-w-[140px]">
                    <DropdownItem key="upload" onPress={() => fileInputRef.current?.click()}>{t('pages.uploadPhoto1')}</DropdownItem>
                    <DropdownItem key="camera" onPress={() => setIsCameraCaptureOpen(true)}>{t('pages.takePhoto')}</DropdownItem>
                    <DropdownItem key="remove" className="text-red-600" onPress={handleRemovePhoto}>{t('pages.remove1')}</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Info */}
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{student.name}</h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{student.admissionId} · {student.class} · Roll {student.rollNo}</p>
                {student.parentPhone && (
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1"><Phone size={11} />Parent: {student.parentPhone}</span>
                    <span>{student.parentName || "Parent"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Phone size={16} />}
                onPress={() => { if (student.parentPhone) { window.location.href = `tel:${student.parentPhone.replace(/[^\d+]/g, '')}`; toast.success(`Calling...`); } else { toast.error(t('toast.error.noPhoneNumber')); }}}
                isDisabled={!student.parentPhone}><span className="hidden sm:inline">{t('pages.call')}</span></Button>
              <Button className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200" startContent={<Edit size={16} />} onPress={onEditOpen}><span className="hidden sm:inline">{t('pages.edit1')}</span></Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" className="text-gray-400 dark:text-zinc-500"><MoreVertical size={20} /></Button>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[180px]">
                  <DropdownItem key="promote" startContent={<TrendingUp size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={onPromoteOpen}>{t('pages.promoteStudent')}</DropdownItem>
                  <DropdownItem key="move" startContent={<Move size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={() => setIsMoveClassOpen(true)}>{t('pages.moveToClass')}</DropdownItem>
                  <DropdownItem key="tc" startContent={<FileCheck size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={onTcOpen}>{t('pages.generateTc')}</DropdownItem>
                  <DropdownItem key="bonafide" startContent={<FileText size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={onBonafideOpen}>Bonafide Certificate</DropdownItem>
                  <DropdownItem key="character" startContent={<Award size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={onCharacterOpen}>Character Certificate</DropdownItem>
                  <DropdownItem key="progress" startContent={<BarChart3 size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={onProgressOpen}>{t('pages.progressCard')}</DropdownItem>
                  <DropdownItem key="reminder" startContent={<Bell size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={handleSendReminder}>{t('pages.sendReminder1')}</DropdownItem>
                  <DropdownItem key="download" startContent={<Download size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={handleDownload}>{t('pages.download')}</DropdownItem>
                  <DropdownItem key="print" startContent={<Printer size={14} className="text-gray-400 dark:text-zinc-500" />} onPress={handleDownload}>{t('pages.print')}</DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-red-600"
                    startContent={<Trash2 size={14} />}
                    onPress={() => setIsDeleteConfirmOpen(true)}
                  >
                    {t('common.delete', 'Delete')}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner for sub-query failures */}
      {(attendanceError || resultsError || remarksError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={16} />
            <span>{t('common.someDataFailedToLoad', 'Some data failed to load.')}</span>
          </div>
          <Button size="sm" variant="light" className="text-red-700 dark:text-red-400" onPress={() => {
            if (attendanceError) refetchAttendance();
            if (resultsError) refetchResults();
            if (remarksError) refetchRemarks();
          }}>
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TABS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-5">
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchParams({ tab: tab.key }, { replace: true }); }}
              className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-gray-900 dark:text-zinc-100'
                  : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
              }`}>
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-zinc-100" />}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT AREA (wrapped in ErrorBoundary to prevent tab crashes from killing the page)
      ═══════════════════════════════════════════════════════════════════ */}
      <ErrorBoundary>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* MAIN CONTENT - 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === "overview" && (
            <>
              {/* Actionable KPI Cards - Color coded */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat) => (
                  <div
                    key={`stat-${stat.label}`}
                    onClick={() => {
                      if (stat.tab) { setActiveTab(stat.tab); setSearchParams({ tab: stat.tab }, { replace: true }); }
                      else if (stat.navigateTo) navigate(stat.navigateTo);
                    }}
                    className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-gray-200 dark:hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <stat.icon size={16} className="text-gray-500 dark:text-zinc-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{stat.value}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
                    {stat.subtext && <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">{stat.subtext}</p>}
                    {(stat.tab || stat.navigateTo) && stat.actionLabel && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                        <span className="text-xs text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                          {stat.actionLabel}
                          <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Performance Chart */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.performanceTrend1')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.academicPerformanceOverTime')}</p></div>
                  </div>
                </div>
                <div className="p-5">
                  {results?.length > 0 ? (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={results.map((res, idx) => ({ name: res.examName || `Exam ${idx + 1}`, value: res.percentage || 0 }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="value" name="Score" stroke={CHART_COLORS.neutral} strokeWidth={2} fill={CHART_COLORS.neutralLight} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-zinc-500 text-sm">{t('pages.noExamDataAvailable')}</div>}
                </div>
              </div>

              {/* Attendance Chart */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Clock size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.attendanceTrend')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.monthlyAttendance')}</p></div>
                  </div>
                </div>
                <div className="p-5">
                  {attendanceLoading ? (
                    <div className="h-[180px] flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full" />
                    </div>
                  ) : attendanceData.length > 0 ? (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyAttendanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 100]} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="value" name="Attendance" stroke={CHART_COLORS.neutral} strokeWidth={2} fill={CHART_COLORS.neutralLight} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-gray-400 dark:text-zinc-500 text-sm">
                      No attendance data available
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ─── DETAILS TAB ─── */}
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Academic Info */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><GraduationCap size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.academicInformation1')}</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg"><Edit size={14} className="text-gray-400 dark:text-zinc-500" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.class1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.class || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.rollNumber2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.rollNo || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.academicYear1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.academicYear || currentAcademicYear}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.classTeacher2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{classTeacher?.name || "—"}</p></div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><User size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.personalInformation1')}</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg"><Edit size={14} className="text-gray-400 dark:text-zinc-500" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.fullName1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.name || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.admissionId1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.admissionId || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.dateOfBirth2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.dateOfBirth ? student.dateOfBirth.split('T')[0].split('-').reverse().join('/') : "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.gender1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.gender || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.bloodGroup1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.bloodGroup || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.religion1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.religion || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.category1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.category || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.motherTongue1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.motherTongue || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.nationality1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.nationality || "—"}</p></div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Mail size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.contactDetails1')}</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg"><Edit size={14} className="text-gray-400 dark:text-zinc-500" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="col-span-full"><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.address2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.address || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.city1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.city || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.state1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.state || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.zIPCode')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.zipCode || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.phone1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.phone || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.email1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.email || "—"}</p></div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Users size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">Parent / Guardian</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg"><Edit size={14} className="text-gray-400 dark:text-zinc-500" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.parentName2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.parentName || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.parentPhone1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.parentPhone || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.parentEmail1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.parentEmail || student.parents?.find(par => par.isParent !== false)?.email || student.parents?.[0]?.email || "—"}</p></div>
                </div>
              </div>

              {/* Previous Education */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><GraduationCap size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.previousEducation1')}</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg"><Edit size={14} className="text-gray-400 dark:text-zinc-500" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 gap-6">
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.previousSchool1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.previousSchool || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.tCNumber')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.tcNumber || "—"}</p></div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><FileCheck size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.additionalInformation1')}</h3>
                  </div>
                  <button onClick={onEditOpen} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg"><Edit size={14} className="text-gray-400 dark:text-zinc-500" /></button>
                </div>
                <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.transportRequired1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.transportRequired ? "Yes" : "No"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.hostelRequired1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.hostelRequired ? "Yes" : "No"}</p></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">{t('pages.medicalConditions1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.medicalConditions || "None"}</p></div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ACADEMICS TAB ─── */}
          {activeTab === "academics" && (
            <div className="space-y-5">
              {/* Academic Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={16} className="text-gray-400 dark:text-zinc-500" />
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t('pages.overallGrade1')}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{avgPercentage ? (avgPercentage >= 90 ? 'A+' : avgPercentage >= 80 ? 'A' : avgPercentage >= 70 ? 'B+' : 'B') : '—'}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-gray-400 dark:text-zinc-500" />
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t('pages.avgScore1')}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{avgPercentage ? `${avgPercentage}%` : '—'}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-gray-400 dark:text-zinc-500" />
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t('pages.exams1')}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{results?.length || 0}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-gray-400 dark:text-zinc-500" />
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{t('pages.classTeacher2')}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{classTeacher?.name || '—'}</p>
                </div>
              </div>

              {/* Subject Performance */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.subjectPerformance1')}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.basedOnExamResults1')}</p>
                </div>
                {resultsLoading ? (
                  <div className="p-8 flex justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full" />
                  </div>
                ) : results && results.length > 0 ? (
                  <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                    {Object.values(results.reduce((acc, res) => {
                      const subject = res.subjectName || res.examId?.subjectName || res.examId?.subject || res.examId?.name || 'Unknown';
                      if (!acc[subject] && res.percentage !== null && res.percentage !== undefined) {
                        acc[subject] = {
                          name: subject,
                          score: Math.round(res.percentage),
                          grade: res.grade || getGradeFromPercentage(res.percentage)
                        };
                      }
                      return acc;
                    }, {})).slice(0, 6).map((subject) => (
                      <div key={`subject-${subject.name}`} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-zinc-400">
                            {subject.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{subject.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-800 dark:bg-zinc-300 rounded-full" style={{ width: `${subject.score}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 w-12 text-right">{subject.score}%</span>
                          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 w-8">{subject.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <BookOpen size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noSubjectResultsAvailable')}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{t('pages.resultsWillAppearOnceExamsAreCompleted')}</p>
                  </div>
                )}
              </div>

              {/* Exam Results */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.examResults1')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.assessmentHistory1')}</p>
                  </div>
                  {resultsLoading && <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full" />}
                </div>
                {results?.length > 0 ? (
                  <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                    {results.map((result) => (
                      <div key={result._id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <FileText size={14} className="text-gray-500 dark:text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{result.examId?.name || 'Exam'}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{result.examId?.startDate ? formatShortDate(result.examId.startDate) : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-bold ${result.percentage >= 90 ? 'text-gray-900 dark:text-zinc-100' : result.percentage >= 75 ? 'text-gray-700 dark:text-zinc-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                            {result.isPublished ? `${Math.round(result.percentage)}%` : '—'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-md ${result.isPublished ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400' : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-zinc-500'}`}>
                            {result.isPublished ? 'Published' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <FileText size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noExamResultsYet1')}</p>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.achievements1')}</h3>
                </div>
                <div className="px-5 py-12 text-center">
                  <Award size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noAchievementsRecordedYet', 'No achievements recorded yet')}</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── ATTENDANCE TAB ─── */}
          {activeTab === "attendance" && (
            <div className="space-y-5">
              {/* Attendance Stats */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-5">
                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.attendanceOverview')}</h3>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Based on {attendanceStats.total} recorded days</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{attendanceStats.percentage}%</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.attendanceRate')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{attendanceStats.present}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.present2')}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{attendanceStats.absent}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.absent2')}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{attendanceStats.total}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.totalDays2')}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Mark */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.markAttendance')}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Today, {format(new Date(), 'dd MMM yyyy')}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">
                    Note: Attendance is typically marked by teachers through the Staff Mobile App.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'present', label: t('pages.present2'), Icon: CheckCircle2, activeColor: 'border-green-500 bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600' },
                      { key: 'absent', label: t('pages.absent2'), Icon: XCircle, activeColor: 'border-red-500 bg-red-50 dark:bg-red-950/30', iconColor: 'text-red-600' },
                      { key: 'halfday', label: t('pages.halfDay'), Icon: Clock, activeColor: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600' },
                      { key: 'leave', label: t('pages.leave'), Icon: Calendar, activeColor: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-600' },
                    ].map(({ key, label, Icon, activeColor, iconColor }) => {
                      const isActive = todayAttendanceStatus === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleQuickMarkAttendance(key)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                            isActive
                              ? `${activeColor} ring-1 ring-offset-1`
                              : 'border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <Icon size={20} className={isActive ? iconColor : 'text-gray-600 dark:text-zinc-400'} />
                          <span className={`text-xs font-medium ${isActive ? iconColor : 'text-gray-700 dark:text-zinc-300'}`}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Subject-wise Attendance - Not Available */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.subjectWiseAttendance')}</h3>
                </div>
                <div className="p-8 text-center">
                  <BookOpen size={32} className="mx-auto text-gray-200 dark:text-zinc-700 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.subjectWiseAttendanceTrackingIsNotCurrentlyAvailable')}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">This feature requires per-subject attendance tracking which will be implemented in a future update.</p>
                </div>
              </div>

              {/* Send Report */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Send size={18} className="text-gray-400 dark:text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.sendReportToParent')}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.shareAttendanceSummaryViaEmailOrSms')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Mail size={14} />} onPress={() => handleSendAttendanceReport('email')}>{t('pages.email1')}</Button>
                    <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Phone size={14} />} onPress={() => handleSendAttendanceReport('sms')}>SMS</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── FEES TAB ─── */}
          {activeTab === "fees" && (
            loadingFeeStructure ? (
              <div className="space-y-5">
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="h-3 w-28 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                        <div className="h-10 w-40 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-28 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                        <div className="h-8 w-28 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-zinc-700">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 text-center space-y-2">
                        <div className="h-3 w-16 mx-auto bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                        <div className="h-5 w-20 mx-auto bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden p-8 text-center">
                  <div className="h-4 w-32 mx-auto bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              </div>
            ) : (
            <div className="space-y-5">
              {/* Fee Summary Hero */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wide">{t('pages.totalOutstanding1')}</p>
                      <p className="text-4xl font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.totalBalance)}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        {(studentFeeStructure?.totalBalance || 0) <= 0 ? 'All fees cleared' : 'Payment pending'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(studentFeeStructure?.totalBalance || 0) > 0 && (
                        <>
                          <Button size="sm" className="bg-gray-900 text-white" startContent={<IndianRupee size={14} />} onPress={onPaymentOpen}>{t('pages.collectPayment1')}</Button>
                          <Button size="sm" variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Bell size={14} />} onPress={handleSendReminder}>{t('pages.sendReminder1')}</Button>
                        </>
                      )}
                      <Button size="sm" variant="bordered" className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300" startContent={<Download size={14} />} onPress={() => setIsInvoiceOpen(true)}>{t('pages.invoice1')}</Button>
                    </div>
                  </div>
                </div>

                {/* Fee Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-zinc-700">
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.totalFee3')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.totalFee)}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.paid2')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.totalPaid)}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.discount1')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.discountApplied)}</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.balance1')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">₹{formatCurrency(studentFeeStructure?.totalBalance)}</p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.paymentHistory')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{feeHistory?.length || 0} transactions</p>
                  </div>
                  <Button size="sm" variant="light" className="text-gray-500 dark:text-zinc-400" onPress={() => navigate(`/fees?studentId=${id}`)}>{t('pages.viewAll1')}</Button>
                </div>
                {feeHistory?.length > 0 ? (
                  <div className="divide-y divide-gray-50 dark:divide-zinc-800 max-h-64 overflow-y-auto">
                    {feeHistory.slice(0, 5).map((payment, i) => (
                      <div key={payment.id || i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <CheckCircle2 size={14} className="text-gray-500 dark:text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{payment.paymentPeriod || 'Fee Payment'}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{payment.paymentDate ? formatShortDate(payment.paymentDate) : payment.date} • {payment.paymentMode || payment.mode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">₹{formatCurrency(payment.amount)}</p>
                          {payment.receiptNumber && <p className="text-xs text-gray-500 dark:text-zinc-400">{payment.receiptNumber}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <IndianRupee size={24} className="mx-auto text-gray-200 dark:text-zinc-700 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noPaymentHistory')}</p>
                  </div>
                )}
              </div>

              {/* Fee Heads Breakdown */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{t('pages.feeBreakdown')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{studentFeeStructure?.feeHeads?.length || 0} fee heads</p>
                  </div>
                  <Button size="sm" variant="light" className="text-gray-500 dark:text-zinc-400" startContent={<BookOpen size={14} />} onPress={() => navigate('/settings?tab=fee-heads')}>{t('pages.configure')}</Button>
                </div>
                {loadingFeeStructure ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto" />
                  </div>
                ) : studentFeeStructure?.feeHeads?.length > 0 ? (
                  <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                    {studentFeeStructure.feeHeads.map((fee) => (
                      <div key={fee._id || fee.feeHeadId} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <FileText size={14} className="text-gray-500 dark:text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{fee.name}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{fee.category} • {fee.frequency}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pl-11 sm:pl-0">
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.amount1')}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{formatCurrency(fee.amount)}</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.paid2')}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{formatCurrency(fee.paidAmount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.balance1')}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">₹{formatCurrency(fee.balanceAmount)}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-md ${
                            fee.status === 'paid' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400' :
                            fee.status === 'partial' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400' :
                            'bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400'
                          }`}>
                            {fee.status === 'paid' ? 'Paid' : fee.status === 'partial' ? 'Partial' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <IndianRupee size={24} className="mx-auto text-gray-200 dark:text-zinc-700 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.noFeeStructureAssigned')}</p>
                  </div>
                )}
              </div>
            </div>
            )
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
              remarks={displayedRemarks}
              remarksLoading={remarksLoading}
              remarksCategoryFilter={remarksCategoryFilter}
              onRemarksChange={setRemarksOverride}
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
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.quickActions1')}</h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={onEditOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"><Edit size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.edit1')}</span></button>
              <button onClick={() => student.parentPhone && (window.location.href = `tel:${student.parentPhone.replace(/[^\d+]/g, '')}`)} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"><Phone size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.call')}</span></button>
              <button onClick={onTcOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"><FileCheck size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">TC</span></button>
              <button onClick={onBonafideOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"><FileText size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">Bonafide</span></button>
              <button onClick={onCharacterOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"><Award size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">Character</span></button>
              <button onClick={onProgressOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"><BarChart3 size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.progress')}</span></button>
            </div>
          </div>

          {/* Alerts */}
          {(attendanceStats.total > 0 && attendanceStats.percentage < 75 || studentFeeStructure?.totalBalance > 0 || (avgPercentage && avgPercentage < 60)) && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-zinc-700"><h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.attentionRequired1')}</h3></div>
              <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                {attendanceStats.total > 0 && attendanceStats.percentage < 75 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><AlertCircle size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.lowAttendance1')}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{attendanceStats.percentage}% (below 75%)</p></div>
                    <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
                  </div>
                )}
                {studentFeeStructure?.totalBalance > 0 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><IndianRupee size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.pendingFees1')}</p><p className="text-xs text-gray-500 dark:text-zinc-400">₹{formatCurrency(studentFeeStructure.totalBalance)} due</p></div>
                    <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
                  </div>
                )}
                {avgPercentage && avgPercentage < 60 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><TrendingUp size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.academicConcern1')}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{avgPercentage}% average</p></div>
                    <ChevronRight size={16} className="text-gray-400 dark:text-zinc-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Clear */}
          {(attendanceStats.total === 0 || attendanceStats.percentage >= 75) && !studentFeeStructure?.totalBalance && (!avgPercentage || avgPercentage >= 60) && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><CheckCircle2 size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                <div><h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.allClear')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.noIssuesDetected')}</p></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                This student has no pending issues. All records are up to date.
              </p>
            </div>
          )}

          {/* Contact Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.contactInformation1')}</h3>
            <div className="space-y-4">
              {(student.parentName || student.parents?.find(par => par.isParent !== false)?.name || student.parents?.[0]?.name) && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><User size={14} className="text-gray-600 dark:text-zinc-400" /></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.parentName2', 'Parent Name')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.parentName || student.parents?.find(par => par.isParent !== false)?.name || student.parents?.[0]?.name}</p></div>
                </div>
              )}
              {student.parentPhone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Phone size={14} className="text-gray-600 dark:text-zinc-400" /></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.parentPhone1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.parentPhone}</p></div>
                </div>
              )}
              {(student.parentEmail || student.parents?.find(par => par.isParent !== false)?.email || student.parents?.[0]?.email) && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Mail size={14} className="text-gray-600 dark:text-zinc-400" /></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.parentEmail1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100 truncate">{student.parentEmail || student.parents?.find(par => par.isParent !== false)?.email || student.parents?.[0]?.email}</p></div>
                </div>
              )}
              {student.address && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0"><Mail size={14} className="text-gray-600 dark:text-zinc-400" /></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.address2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{student.address}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </ErrorBoundary>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS & DRAWERS
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Edit Drawer - only mount when open */}
      {isEditOpen && (
      <Drawer isOpen={isEditOpen} onOpenChange={(open) => {
        if (!open) {
          if (editStudentRef.current) editStudentRef.current.attemptClose();
          else onEditClose();
        }
      }} placement="right" size="5xl" hideCloseButton classNames={{ wrapper: "!z-50", base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-700 p-4">
                <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg"><Edit size={18} className="text-gray-600 dark:text-zinc-400" /></div>
                <div><h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{t('pages.editStudent1')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.updateStudentInformation1')}</p></div>
              </DrawerHeader>
              <DrawerBody className="p-0 overflow-auto">
                <Suspense fallback={<div className="flex items-center justify-center h-40"><span className="text-sm text-gray-400 dark:text-zinc-500">{t('pages.loading')}</span></div>}>
                  <AddStudent ref={editStudentRef} onClose={onClose} onSave={(data) => { updateStudent(id, data); onClose(); }} classesWithTeachers={classesWithTeachers || []} classOptions={availableClasses} initialData={student} />
                </Suspense>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
      )}

      {/* Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={() => { onPaymentClose(); setShowPaymentConfirm(false); }} size="md">
        <ModalContent>
          <ModalHeader>{showPaymentConfirm ? t('pages.confirmPayment', 'Confirm Payment') : t('pages.recordFeePayment1')}</ModalHeader>
          <ModalBody>
            {showPaymentConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">{t('pages.reviewPaymentDetails', 'Please review the payment details before submitting:')}</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.studentName', 'Student')}</span>
                    <span className="text-sm font-medium">{student?.firstName} {student?.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.amount1')}</span>
                    <span className="text-lg font-semibold">₹{formatCurrency(paymentForm.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.paymentMethod1')}</span>
                    <span className="text-sm font-medium capitalize">{paymentForm.paymentMode === 'online' ? 'Online/UPI' : paymentForm.paymentMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.paymentDate1')}</span>
                    <span className="text-sm font-medium">{formatShortDate(paymentForm.date)}</span>
                  </div>
                  <hr className="my-1" />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('pages.balanceAfterPayment', 'Balance after payment')}</span>
                    <span className="text-sm font-medium">₹{formatCurrency((studentFeeStructure?.totalBalance || 0) - parseFloat(paymentForm.amount))}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label={t('pages.amount1')}
                  type="number"
                  value={paymentForm.amount}
                  onValueChange={(val) => setPaymentForm({ ...paymentForm, amount: val })}
                  startContent="₹"
                  variant="bordered"
                  min={1}
                  max={studentFeeStructure?.totalBalance || 0}
                  description={`Outstanding: ₹${formatCurrency(studentFeeStructure?.totalBalance)}`}
                  isInvalid={!!paymentForm.amount && parseInt(paymentForm.amount, 10) > (studentFeeStructure?.totalBalance || 0)}
                  errorMessage={`Max payable: ₹${formatCurrency(studentFeeStructure?.totalBalance)}`}
                  isRequired
                />
                <Select label={t('pages.paymentMethod1')} placeholder={t('pages.selectMethod')} selectedKeys={[paymentForm.paymentMode]} onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMode: Array.from(keys)[0] })} variant="bordered" isRequired>
                  <SelectItem key="cash">{t('pages.cash1')}</SelectItem>
                  <SelectItem key="online">Online/UPI</SelectItem>
                  <SelectItem key="card">{t('pages.card1')}</SelectItem>
                  <SelectItem key="cheque">{t('pages.cheque1')}</SelectItem>
                </Select>
                <Input label={t('pages.paymentDate1')} type="date" value={paymentForm.date} onValueChange={(val) => setPaymentForm({ ...paymentForm, date: val })} variant="bordered" />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {showPaymentConfirm ? (
              <>
                <Button variant="light" onPress={() => setShowPaymentConfirm(false)}>{t('common.back', 'Back')}</Button>
                <Button
                  className="bg-gray-900 text-white"
                  onPress={handleRecordPayment}
                  isLoading={isRecordingPayment}
                >{t('pages.confirmAndPay', 'Confirm & Pay')}</Button>
              </>
            ) : (
              <>
                <Button variant="light" onPress={() => { onPaymentClose(); setShowPaymentConfirm(false); }}>{t('pages.cancel2')}</Button>
                <Button
                  className="bg-gray-900 text-white"
                  onPress={() => setShowPaymentConfirm(true)}
                  isDisabled={
                    !paymentForm.amount ||
                    !paymentForm.paymentMode ||
                    parseInt(paymentForm.amount, 10) <= 0 ||
                    parseInt(paymentForm.amount, 10) > (studentFeeStructure?.totalBalance || 0)
                  }
                >{t('pages.reviewPayment', 'Review Payment')}</Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* TC Modal */}
      <TCGeneratorModal isOpen={isTcOpen} onClose={onTcClose} students={[student]} />

      {/* Bonafide Certificate Modal */}
      <CertificateModal isOpen={isBonafideOpen} onClose={onBonafideClose} student={student} type="bonafide" />

      {/* Character Certificate Modal */}
      <CertificateModal isOpen={isCharacterOpen} onClose={onCharacterClose} student={student} type="character" />

      {/* Move Class Modal */}
      <MoveClassModal
        isOpen={isMoveClassOpen}
        onClose={() => setIsMoveClassOpen(false)}
        student={student}
        availableClasses={availableClasses}
        classObjects={classesWithTeachers || []}
        onMove={async () => {
          refetchStudent();
          setIsMoveClassOpen(false);
        }}
      />

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
          <ModalHeader>{t('pages.promoteStudent')}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <GraduationCap size={24} className="text-gray-600 dark:text-zinc-400" />
                <div><p className="text-sm text-gray-500 dark:text-zinc-400">Student: <span className="font-semibold text-gray-900 dark:text-zinc-100">{student.name}</span></p><p className="text-sm text-gray-500 dark:text-zinc-400">Current Class: <span className="font-semibold text-gray-900 dark:text-zinc-100">{student.class}</span></p></div>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{t('pages.autoCalculatedNextClass')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{getNextClass(student.class, availableClasses) || "Unable to calculate"}</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPromoteClose}>{t('pages.cancel2')}</Button>
            <Button className="bg-gray-900 text-white" startContent={<GraduationCap size={16} />} onPress={handlePromoteStudent}>{t('pages.promote')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Progress Card Modal */}
      <Modal isOpen={isProgressOpen} onClose={onProgressClose} size="md">
        <ModalContent>
          <ModalHeader>{t('pages.studentProgressCard1')}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-full"><BarChart3 size={48} className="text-gray-600 dark:text-zinc-400" /></div>
              <div><h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{student.name}</h3><p className="text-sm text-gray-500 dark:text-zinc-400">Class {student.class} • Roll {student.rollNo}</p></div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{t('pages.generateAndDownloadTheDetailedAcademicPerformanceReportCard')}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onProgressClose}>{t('pages.cancel2')}</Button>
            <Button className="bg-gray-900 text-white" startContent={<Download size={16} />} onPress={() => { handleProgressCardDownload(); onProgressClose(); }}>{t('pages.download')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reminder Modal */}
      <Modal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>{t('pages.sendFeeReminder1')}</ModalHeader>
          <ModalBody>
            <Textarea label={t('pages.message1')} value={reminderMessage} onValueChange={setReminderMessage} minRows={4} variant="bordered" placeholder={t('pages.enterReminderMessage')} />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsReminderOpen(false)}>{t('pages.cancel2')}</Button>
            <Button className="bg-gray-900 text-white" startContent={<Send size={16} />} onPress={handleSendReminderMessage}>{t('pages.sendReminder1')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Photo Editor */}
      {selectedImageForEdit && (
        <PhotoEditorModal isOpen={isPhotoEditorOpen} onClose={() => setIsPhotoEditorOpen(false)} imageSrc={selectedImageForEdit} onSave={handlePhotoSave} />
      )}

      {/* Camera Capture */}
      <CameraCaptureModal isOpen={isCameraCaptureOpen} onClose={() => setIsCameraCaptureOpen(false)} onPhotoCaptured={(image) => { setSelectedImageForEdit(image); setIsCameraCaptureOpen(false); setIsPhotoEditorOpen(true); }} />

      {/* Delete Student Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            const result = await deleteStudent(student.id);
            const deletedName = student.name;
            const trashItemId = result?.trashItemId;
            setIsDeleteConfirmOpen(false);
            navigate('/students');
            toast(
              (toastObj) => (
                <div className="flex items-center gap-3">
                  <span>{deletedName} {t('common.deleted', 'deleted')}</span>
                  {trashItemId && (
                    <button
                      className="font-semibold text-primary underline whitespace-nowrap"
                      onClick={async () => {
                        toast.dismiss(toastObj.id);
                        try {
                          await trashApi.restore(trashItemId);
                          toast.success(t('toast.success.studentRestored', { name: deletedName, defaultValue: `${deletedName} restored` }));
                          navigate(`/students/${student.id}`);
                        } catch {
                          toast.error(t('toast.error.failedToRestore', 'Failed to restore student'));
                        }
                      }}
                    >
                      {t('common.undo', 'Undo')}
                    </button>
                  )}
                </div>
              ),
              { duration: 5000, icon: '🗑️' }
            );
          } catch (error) {
            toast.error(error.message || t('toast.error.failedToDeleteStudent', 'Failed to delete student'));
          } finally {
            setIsDeleting(false);
            setIsDeleteConfirmOpen(false);
          }
        }}
        title={t('confirm.deleteStudentTitle', 'Delete Student')}
        message={t('confirm.permanentDeleteStudent', { name: student?.name, defaultValue: `Are you sure you want to permanently delete ${student?.name}? This action cannot be undone.` })}
        confirmText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
    </>
  );
}
