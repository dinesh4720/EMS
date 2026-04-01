/**
 * StaffDashboard - Refactored to match StudentDashboard minimal UI design
 * Clean, minimal gray palette with white cards
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import logger from "../../utils/logger";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Textarea, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip
} from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useValidatedParams } from "../../hooks/useValidatedParams";
import {
  ArrowLeft, Phone, Clock, Calendar, Briefcase, X, Users, GraduationCap,
  Link, TrendingUp, TrendingDown, Camera, MoreVertical, Edit, FileText,
  IndianRupee, Award, Mail, Activity, CheckCircle2, AlertCircle, BookOpen
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { getSafeDisplayName, getSafeInitials, isObjectId } from "../../utils/objectIdHelper";

// Components
import PhotoEditorModal from "../../components/PhotoEditorModal";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import StaffAssignmentPanel from "./StaffAssignmentPanel";
import TeacherTimetableEditor from "./TeacherTimetableEditor";
import AddStaff from "./AddStaff";
import AssignClassToStaffModal from "./components/AssignClassToStaffModal";

// Tab Components
import StaffAboutTab from "./components/StaffAboutTab";
import StaffAttendanceTab from "./components/StaffAttendanceTab";
import StaffPayrollTab from "./components/StaffPayrollTab";
import StaffDocumentsTab from "./components/StaffDocumentsTab";

import { DetailPageSkeleton } from "../../components/skeletons/PageSkeletons";

// Context & Services
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import { uploadApi } from "../../services/api";
import { getSocketService } from "../../services/socketServiceEnhanced.js";
import { useTranslation } from 'react-i18next';

export default function StaffDashboard() {
  const { t } = useTranslation();
  const { params: { id }, isValid } = useValidatedParams({ id: 'objectId' }, { redirectTo: '/staffs' });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();

  const {
    getStaffById, getMonthlyAttendance, staffAttendance: attendance,
    staffSalaries, salarySettings, classesWithTeachers, updateStaff, updateStaffLocal,
    payrollHistory, staff: allStaffList, classes, loading, error: appError, teacherAssignmentsApi,
    fetchStaffAttendanceByStaff
  } = useApp();

  const { isOpen, onOpen, onClose } = useDisclosure(); // Message Modal

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

  const handleOpenAssignClassModal = useCallback(() => {
    setIsAssignClassModalOpen(true);
  }, []);

  const handleCloseAssignClassModal = useCallback(() => {
    setIsAssignClassModalOpen(false);
  }, []);

  const [message, setMessage] = useState("");
  const validTabs = ["overview", "attendance", "about", "timetable", "classes", "payroll", "documents"];
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTabState] = useState(validTabs.includes(tabFromUrl) ? tabFromUrl : "overview");

  // Clear the tab param from URL after initial consumption
  useEffect(() => {
    if (tabFromUrl) {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveTab = (tab) => setActiveTabState(tab);
  const [subjectAssignments, setSubjectAssignments] = useState([]);

  // Document State
  const documentInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);

  // Photo Upload State
  const fileInputRef = useRef(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

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

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'SchoolSync';
    };
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

  // Navigation Logic
  const currentStaffIndex = Math.max(0, allStaffList?.findIndex(s => String(s.id) === String(id)) ?? -1);
  const prevStaffId = allStaffList?.[currentStaffIndex - 1]?.id;
  const nextStaffId = allStaffList?.[currentStaffIndex + 1]?.id;

  const handlePrevStaff = () => prevStaffId && navigate(`/staffs/${prevStaffId}`);
  const handleNextStaff = () => nextStaffId && navigate(`/staffs/${nextStaffId}`);

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
      // Guard: skip classes without a classTeacherId to avoid String(undefined) === String(undefined) false matches
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
    salarySettings?.earnings?.forEach(item => {
      totalEarnings += Number(salaryData[item.id] || 0);
    });
    let totalDeductions = 0;
    salarySettings?.deductions?.forEach(item => {
      totalDeductions += Number(salaryData[item.id] || 0);
    });
    return { totalEarnings, totalDeductions, netSalary: totalEarnings - totalDeductions };
  };

  // Initialize data
  useEffect(() => {
    if (staff) {
      setPicturePreview(staff.picture || null);

      // Initialize Documents
      const allDocs = [];

      if (staff.idDocuments && Array.isArray(staff.idDocuments)) {
        staff.idDocuments.forEach((doc, index) => {
          if (typeof doc === 'string') {
            allDocs.push({
              id: `id-${index}`,
              name: `ID Document ${index + 1}`,
              type: 'ID Proof',
              url: doc,
              uploadDate: staff.createdAt || new Date().toISOString()
            });
          } else if (doc && doc.url) {
            allDocs.push({
              id: `id-${index}`,
              name: doc.name || doc.type || 'ID Document',
              type: doc.type || 'ID Proof',
              url: doc.url,
              uploadDate: staff.createdAt || new Date().toISOString()
            });
          }
        });
      }

      if (staff.qualificationDocs && Array.isArray(staff.qualificationDocs)) {
        staff.qualificationDocs.forEach((doc, index) => {
          allDocs.push({
            id: `qual-${index}`,
            name: `Qualification Document ${index + 1}`,
            type: 'Qualification',
            url: doc,
            uploadDate: staff.createdAt || new Date().toISOString()
          });
        });
      }

      if (staff.customDocuments && Array.isArray(staff.customDocuments)) {
        staff.customDocuments.forEach((doc, index) => {
          allDocs.push({
            id: `custom-${index}`,
            name: `Custom Document ${index + 1}`,
            type: 'Custom',
            url: doc,
            uploadDate: staff.createdAt || new Date().toISOString()
          });
        });
      }

      setDocuments(allDocs);
    }
  }, [staff]);

  // Load subject assignments for teachers
  useEffect(() => {
    if (!id || !teacherAssignmentsApi) return;

    const loadSubjects = async () => {
      try {
        const data = await teacherAssignmentsApi.getAll(id);
        if (data && data.assignments) {
          setSubjectAssignments(data.assignments);
        }
      } catch (error) {
        logger.error("Error loading subject assignments:", error);
      }
    };

    loadSubjects();
  }, [id, teacherAssignmentsApi]);

  // Socket.IO listener for real-time updates
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService?.isConnected() || !staff) return;

    const handleStaffUpdate = (data) => {
      if (data.staffId === staff.id) {
        updateStaffLocal(data.staffId, {
          name: data.name,
          role: data.role,
          department: data.department,
          status: data.status,
          phone: data.phone,
          email: data.email,
          picture: data.picture
        });

        if (data.picture) {
          setPicturePreview(data.picture);
        }

        toast.success('Profile updated by another user', { duration: 3000, icon: '' });
      }
    };

    socketService.on('staff_updated', handleStaffUpdate);
    return () => socketService.off('staff_updated', handleStaffUpdate);
  }, [staff, updateStaffLocal]);

  // Handlers
  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newUploads = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }));

    setActiveUploads(prev => [...prev, ...newUploads]);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadId = newUploads[i].id;

        setActiveUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'uploading', progress: 50 } : u));

        const response = await uploadApi.uploadFile(file);

        const formatFileSize = (bytes) => {
          if (bytes < 1024) return bytes + ' B';
          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
          return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        };

        const newDoc = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          url: response.url,
          size: formatFileSize(file.size),
          uploadDate: new Date().toISOString()
        };

        setDocuments(prev => [...prev, newDoc]);
        setActiveUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u));
      }

      setTimeout(() => setActiveUploads([]), 2000);
      toast.success(t('toast.success.documentsUploadedSuccessfully'));
    } catch (error) {
      logger.error("Upload error:", error);
      toast.error(t('toast.error.uploadFailed'));
    } finally {
      e.target.value = null;
    }
  };

  const handleDeleteDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId && d.url !== docId));
    toast.success(t('toast.success.documentDeleted'));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageForEdit(reader.result);
        setIsPhotoEditorOpen(true);
        e.target.value = null;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraPhotoCapture = async (file) => {
    const loadingToast = toast.loading(t('toast.loading.uploadingPhoto'));

    try {
      const response = await uploadApi.uploadFile(file);
      await updateStaff(id, { ...staff, picture: response.url });
      setPicturePreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });
    } catch (error) {
      logger.error("Photo upload error:", error);
      toast.error("Photo upload failed", { id: loadingToast });
    }
  };

  const handlePhotoSave = async (croppedImage) => {
    const loadingToast = toast.loading(t('toast.loading.uploadingPhoto'));

    try {
      const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new File([u8arr], filename, { type: mime });
      };

      const file = dataURLtoFile(croppedImage, "profile_photo.jpg");
      const response = await uploadApi.uploadFile(file);
      await updateStaff(id, { ...staff, picture: response.url });
      setPicturePreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });
    } catch (error) {
      logger.error("Photo upload error:", error);
      toast.error("Photo upload failed", { id: loadingToast });
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateStaff(id, { ...staff, picture: null });
      setPicturePreview(null);
      toast.success(t('toast.success.photoRemoved'));
    } catch {
      toast.error(t('toast.error.failedToRemovePhoto'));
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    // TODO: Integrate with real messaging API when available
    toast.error('Messaging feature is not yet connected to the backend');
    setMessage("");
    onClose();
  };

  const handleEditClick = () => {
    if (hasPermission('staff', 'edit')) {
      handleOpenAddStaff();
    } else {
      toast.error(t('toast.error.youDoNotHavePermissionToEditStaffMembers'));
    }
  };

  // Tabs configuration
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "attendance", label: "Attendance" },
    { key: "about", label: "About" },
    { key: "timetable", label: "Timetable" },
    { key: "classes", label: "Classes & Subjects" },
    { key: "payroll", label: "Payroll" },
    { key: "documents", label: `Documents (${documents.length})` },
  ];

  // Stats
  const isTeacher = Array.isArray(staff?.role) ? staff?.role.includes('Teacher') : staff?.role === 'Teacher';
  const stats = [
    { label: "Attendance", value: `${attendanceRate}%`, subtext: `${monthlyStats.present} present`, icon: Clock },
    { label: isTeacher ? "Students" : "Department", value: isTeacher ? totalStudents : staff?.department || "—", subtext: isTeacher ? `${classTeacherAssignments.length} classes` : "", icon: Users },
    { label: "Role", value: Array.isArray(staff?.role) ? staff?.role[0] : staff?.role || "—", subtext: staff?.department || "", icon: Briefcase },
    { label: "Join Date", value: staff?.joinDate || "—", subtext: staff?.status || "Active", icon: Calendar },
  ];

  if (!isValid) return null;

  if (!staff) {
    // Show skeleton while data is being fetched OR staff array hasn't been synced yet
    // The staff array may be empty briefly after loading=false due to async context sync
    if (loading || (!appError && (!Array.isArray(allStaffList) || allStaffList.length === 0))) {
      return <DetailPageSkeleton avatar fields={8} />;
    }
    // Staff data loaded but this ID wasn't found — show not-found with back navigation
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-gray-400 dark:text-zinc-500 text-sm">{t('pages.staffMemberNotFound1')}</div>
        <button
          onClick={() => navigate('/staffs')}
          className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 underline"
        >
          {t('pages.backToStaff')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-zinc-900 p-6 min-h-screen">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <button onClick={() => navigate('/staffs')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors mb-2">
          <ArrowLeft size={16} /><span>{t('pages.backToStaff')}</span>
        </button>

        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                  {picturePreview || staff.picture ? (
                    <img src={picturePreview || staff.picture} alt={staff.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-xl font-medium text-gray-400 dark:text-zinc-500">
                      {getSafeInitials(staff.name, staff.code?.charAt(0)?.toUpperCase() || '?')}
                    </span>
                  )}
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-900">
                      <Camera size={12} className="text-gray-500 dark:text-zinc-400" />
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
                <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                  {getSafeDisplayName(staff, 'code')}
                </h1>

                {/* Roles Line with heading */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.roles1')}</span>
                  {Array.isArray(staff.role) ? staff.role.map((role, idx) => (
                    <Chip
                      key={role}
                      size="sm"
                      variant="flat"
                      classNames={{
                        base: role === 'Admin' || role === 'Principal' ? "bg-gray-800 dark:bg-zinc-200 text-white dark:text-zinc-900" :
                          role === 'Teacher' ? "bg-gray-700 dark:bg-zinc-300 text-white dark:text-zinc-900" :
                            "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300",
                        content: "text-xs font-medium"
                      }}
                    >
                      {role}
                    </Chip>
                  )) : (
                    <Chip
                      size="sm"
                      variant="flat"
                      classNames={{
                        base: "bg-gray-700 dark:bg-zinc-300 text-white dark:text-zinc-900",
                        content: "text-xs font-medium"
                      }}
                    >
                      {staff.role}
                    </Chip>
                  )}
                </div>

                {/* Subjects Line with heading (only for teachers) */}
                {subjectAssignments.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{t('pages.subjectsHandling')}</span>
                    {[...new Set(subjectAssignments.map(a => a.subject).filter(Boolean))].map((subject, idx) => (
                      <Chip
                        key={subject}
                        size="sm"
                        variant="flat"
                        classNames={{
                          base: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800",
                          content: "text-xs font-medium"
                        }}
                      >
                        {subject}
                      </Chip>
                    ))}
                  </div>
                )}

                {/* Department - only show if no subjects */}
                {subjectAssignments.length === 0 && staff.department && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                    <span>{staff.department}</span>
                  </div>
                )}

                {/* Contact Info */}
                {staff.phone && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                    <Phone size={12} /><span>{staff.phone}</span>
                    {staff.email && <><span className="text-gray-300 dark:text-zinc-600">|</span><span>{staff.email}</span></>}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="flat" className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300" startContent={<Phone size={16} />}
                onPress={() => { if (staff.phone) { window.location.href = `tel:${staff.phone.replace(/[^\d+]/g, '')}`; toast.success(`Calling...`); } else { toast.error(t('toast.error.noPhoneNumber')); } }}
                isDisabled={!staff.phone}>{t('pages.call')}</Button>
              <Button className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-200" startContent={<Edit size={16} />} onPress={handleEditClick}>{t('pages.edit1')}</Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" className="text-gray-400 dark:text-zinc-500"><MoreVertical size={20} /></Button>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[180px]">
                  <DropdownItem key="message" onPress={onOpen}>{t('pages.sendMessage')}</DropdownItem>
                  <DropdownItem key="download" onPress={() => window.print()}>{t('pages.downloadProfile')}</DropdownItem>
                  <DropdownItem key="print" onPress={() => window.print()}>{t('pages.print')}</DropdownItem>
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
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.key ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-400'
                }`}>
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-zinc-100" />}
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
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <stat.icon size={16} className="text-gray-600 dark:text-zinc-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-zinc-200">{stat.value}</h3>
                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">{stat.label}</p>
                    {stat.subtext && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{stat.subtext}</p>}
                  </div>
                ))}
              </div>

              {/* Class Teacher Section - Always visible */}
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><GraduationCap size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.classTeacherAssignment')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{classTeacherAssignments.length > 0 ? 'Class you manage as class teacher' : 'Not assigned to any class'}</p></div>
                  </div>
                </div>
                {classTeacherAssignments.length > 0 ? (
                  <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                    {classTeacherAssignments.map((cls) => {
                      const clsAttendance = cls.averageAttendance || cls.attendance || 0;
                      return (
                        <div
                          key={cls.id}
                          className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/classes/${cls.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              {cls.name}-{cls.section}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{cls.name} - {cls.section}</p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">{cls.studentCount || 0} students</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${clsAttendance >= 90 ? 'bg-gray-800 dark:bg-zinc-200' : clsAttendance >= 75 ? 'bg-gray-600 dark:bg-zinc-400' : 'bg-gray-400 dark:bg-zinc-500'}`} style={{ width: `${clsAttendance}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 w-12 text-right">{clsAttendance}%</span>
                            <Link size={16} className="text-gray-400 dark:text-zinc-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center mb-3">
                      <GraduationCap size={20} className="text-gray-300 dark:text-zinc-600" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">{t('pages.noClassHasBeenAssignedYet')}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">{t('pages.thisStaffMemberIsNotAClassTeacherForAnyClass')}</p>
                    <button
                      onClick={handleOpenAssignClassModal}
                      className="text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Assign a Class →
                    </button>
                  </div>
                )}
              </div>

              {/* Today's Status */}
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Activity size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.todaySStatus')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{format(today, 'EEEE, MMMM d, yyyy')}</p></div>
                  </div>
                </div>
                <div className="p-5">
                  {(() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todayRecord = attendance?.[id]?.[todayStr];
                    const todayStatus = todayRecord?.status || 'unmarked';
                    const checkInTime = todayRecord?.inTime && todayRecord.inTime !== '-' ? todayRecord.inTime : null;
                    const checkOutTime = todayRecord?.outTime && todayRecord.outTime !== '-' ? todayRecord.outTime : null;
                    const isPresent = todayStatus === 'present';
                    const isAbsent = todayStatus === 'absent';
                    const isOnLeave = todayStatus === 'leave';
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPresent ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-gray-50 dark:bg-zinc-900'}`}>
                            <CheckCircle2 size={24} className={isPresent ? 'text-gray-600 dark:text-zinc-400' : 'text-gray-400 dark:text-zinc-500'} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                              {isPresent ? 'Present Today' : isAbsent ? 'Absent Today' : isOnLeave ? 'On Leave' : 'Not Marked'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                              {checkInTime ? `Check-in: ${checkInTime}` : isPresent ? 'Check-in: Marked' : 'Check-in: --:--'}
                              {checkOutTime ? ` · Out: ${checkOutTime}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{attendanceRate}%</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.monthlyAttendance1')}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Quick Stats Summary */}
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.monthlySummary')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
                    <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{monthlyStats.total}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.workingDays')}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
                    <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{monthlyStats.present}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.present2')}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-zinc-900">
                    <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">{monthlyStats.absent}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('pages.absent2')}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── ATTENDANCE TAB ─── */}
          {activeTab === "attendance" && (
            <StaffAttendanceTab
              staffId={id}
              monthlyStats={monthlyStats}
              attendance={attendance[id]}
            />
          )}

          {/* ─── ABOUT TAB ─── */}
          {activeTab === "about" && (
            <StaffAboutTab staff={staff} />
          )}

          {/* ─── TIMETABLE TAB ─── */}
          {activeTab === "timetable" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Calendar size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div><h3 className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{t('pages.weeklyTimetable')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.manageClassSchedulesAndAssignments')}</p></div>
                  </div>
                </div>
                <div className="p-5">
                  <TeacherTimetableEditor teacherId={id} teacherName={staff?.name} />
                </div>
              </div>
            </div>
          )}

          {/* ─── CLASSES TAB ─── */}
          {activeTab === "classes" && (
            <StaffAssignmentPanel staffId={id} onAssignClassTeacher={handleOpenAssignClassModal} />
          )}

          {/* ─── PAYROLL TAB ─── */}
          {activeTab === "payroll" && (
            <StaffPayrollTab
              payrollHistory={payrollHistory}
              staffSalary={staffSalary}
              calculateTotals={calculateTotals}
              staff={staff}
            />
          )}

          {/* ─── DOCUMENTS TAB ─── */}
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

        {/* RIGHT SIDEBAR - 1/3 */}
        <div className="lg:col-span-1 space-y-4">

          {/* Quick Actions */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.quickActions1')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleEditClick} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700"><Edit size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.edit1')}</span></button>
              <button onClick={() => staff.phone && (window.location.href = `tel:${staff.phone.replace(/[^\d+]/g, '')}`)} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700"><Phone size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.call')}</span></button>
              <button onClick={onOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700"><Mail size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.message1')}</span></button>
              <button onClick={() => navigate('/staffs')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700"><Users size={18} className="text-gray-600 dark:text-zinc-400" /><span className="text-xs text-gray-600 dark:text-zinc-400">{t('pages.allStaff1')}</span></button>
            </div>
          </div>

          {/* Alerts */}
          {(attendanceRate < 75 || (isTeacher && avgClassAttendance < 75)) && (
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800"><h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.attentionRequired1')}</h3></div>
              <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                {attendanceRate < 75 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><AlertCircle size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.lowAttendance1')}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{attendanceRate}% (below 75%)</p></div>
                  </div>
                )}
                {isTeacher && avgClassAttendance < 75 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Users size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.classAttendanceAlert')}</p><p className="text-xs text-gray-500 dark:text-zinc-400">Average: {avgClassAttendance}%</p></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Clear */}
          {attendanceRate >= 75 && (!isTeacher || avgClassAttendance >= 75) && (
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><CheckCircle2 size={16} className="text-gray-600 dark:text-zinc-400" /></div>
                <div><h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.allClear')}</h3><p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.noIssuesDetected')}</p></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">This staff member is performing well with good attendance and no pending actions.</p>
            </div>
          )}

          {/* Contact Card */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.contactInformation1')}</h3>
            <div className="space-y-4">
              {staff.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Phone size={14} className="text-gray-600 dark:text-zinc-400" /></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.phone1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{staff.phone}</p></div>
                </div>
              )}
              {staff.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Mail size={14} className="text-gray-600 dark:text-zinc-400" /></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.email1')}</p><p className="text-sm text-gray-900 dark:text-zinc-100 truncate">{staff.email}</p></div>
                </div>
              )}
              {staff.address && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0"><Briefcase size={14} className="text-gray-600 dark:text-zinc-400" /></div>
                  <div><p className="text-xs text-gray-400 dark:text-zinc-500">{t('pages.address2')}</p><p className="text-sm text-gray-900 dark:text-zinc-100">{staff.address}</p></div>
                </div>
              )}
            </div>
          </div>

          {/* Department Info */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-4">{t('pages.departmentDetails')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.department1')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{staff.department || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.role1')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{Array.isArray(staff.role) ? staff.role.join(', ') : staff.role || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.status2')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{staff.status || "Active"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.joinDate1')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{staff.joinDate || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
        <ModalContent>
          <ModalHeader>Send Message to {staff.name && /^[a-f\d]{24}$/i.test(staff.name) ? (staff.code || 'Staff') : (staff.name || 'Staff')}</ModalHeader>
          <ModalBody>
            <Textarea
              label={t('pages.message1')}
              placeholder={t('pages.typeYourMessageHere')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minRows={3}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300" onClick={onClose}>{t('pages.cancel2')}</button>
            <button
              className="px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-gray-900 dark:bg-zinc-100 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              Send
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AddStaff Drawer - Edit Mode */}
      {shouldRenderAddStaff && (
        <Drawer
          isOpen={isAddStaffOpen}
          onOpenChange={(open) => {
            if (!open) {
              if (addStaffRef.current) addStaffRef.current.attemptClose();
              else handleCloseAddStaff();
            }
          }}
          isDismissable={false}
          placement="right"
          hideCloseButton
          classNames={{ wrapper: "justify-end", base: "w-[720px] max-w-[95vw]", backdrop: "bg-black/30" }}
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="border-b border-gray-100 dark:border-zinc-800 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                      <Edit size={20} className="text-gray-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{t('pages.editStaffMember')}</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{t('pages.updateStaffDetails')}</p>
                    </div>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => {
                    if (addStaffRef.current) addStaffRef.current.attemptClose();
                    else if (window.staffDrawerCloseHandler) window.staffDrawerCloseHandler();
                    else handleCloseAddStaff();
                  }}>
                    <X size={20} className="text-gray-400 dark:text-zinc-500" />
                  </Button>
                </DrawerHeader>
                <DrawerBody className="p-0 overflow-hidden">
                  <AddStaff ref={addStaffRef} onClose={handleCloseAddStaff} onSave={handleSaveAddStaff} editingStaff={staff} />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}

      {/* Photo Editor Modal */}
      {selectedImageForEdit && (
        <PhotoEditorModal
          isOpen={isPhotoEditorOpen}
          onClose={() => setIsPhotoEditorOpen(false)}
          imageSrc={selectedImageForEdit}
          onSave={handlePhotoSave}
        />
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraCaptureOpen}
        onClose={() => setIsCameraCaptureOpen(false)}
        onPhotoCaptured={handleCameraPhotoCapture}
      />

      {/* Assign Class to Staff Modal */}
      <AssignClassToStaffModal
        isOpen={isAssignClassModalOpen}
        onClose={handleCloseAssignClassModal}
        staffId={id}
        staffName={staff.name}
      />
    </div>
  );
}
