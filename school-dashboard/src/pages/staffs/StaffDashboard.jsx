/**
 * StaffDashboard - Refactored to match StudentDashboard minimal UI design
 * Clean, minimal gray palette with white cards
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Textarea, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip
} from "@heroui/react";
import { useParams, useNavigate } from "react-router-dom";
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

// Context & Services
import { useApp } from "../../context/AppContext";
import { usePermissions } from "../../context/PermissionContext";
import { uploadApi } from "../../services/api";

export default function StaffDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const {
    getStaffById, getMonthlyAttendance, staffAttendance: attendance,
    staffSalaries, salarySettings, classesWithTeachers, updateStaff, updateStaffLocal,
    payrollHistory, staff: allStaffList, classes, loading, teacherAssignmentsApi,
    fetchStaffAttendanceByStaff
  } = useApp();

  const { isOpen, onOpen, onClose } = useDisclosure(); // Message Modal

  // AddStaff Drawer State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [shouldRenderAddStaff, setShouldRenderAddStaff] = useState(false);
  const addStaffRef = useRef(null);

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

  const handleSaveAddStaff = (staffData) => {
    handleCloseAddStaff();
  };

  const handleOpenAssignClassModal = useCallback(() => {
    setIsAssignClassModalOpen(true);
  }, []);

  const handleCloseAssignClassModal = useCallback(() => {
    setIsAssignClassModalOpen(false);
  }, []);

  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
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
        console.error('Failed to fetch staff attendance:', err);
        toast.error('Failed to load attendance data');
      });
    }
  }, [id, fetchStaffAttendanceByStaff]);

  // Navigation Logic
  const currentStaffIndex = allStaffList?.findIndex(s => s.id === id) || 0;
  const prevStaffId = allStaffList?.[currentStaffIndex - 1]?.id;
  const nextStaffId = allStaffList?.[currentStaffIndex + 1]?.id;

  const handlePrevStaff = () => prevStaffId && navigate(`/staffs/${prevStaffId}`);
  const handleNextStaff = () => nextStaffId && navigate(`/staffs/${nextStaffId}`);

  const today = new Date();
  const monthlyStats = useMemo(() => {
    return getMonthlyAttendance(id, today.getFullYear(), today.getMonth());
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
        console.error("Error loading subject assignments:", error);
      }
    };

    loadSubjects();
  }, [id, teacherAssignmentsApi]);

  // Socket.IO listener for real-time updates
  useEffect(() => {
    const socketService = window.socketService;
    if (!socketService || !staff) return;

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
      toast.success("Documents uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      e.target.value = null;
    }
  };

  const handleDeleteDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId && d.url !== docId));
    toast.success("Document deleted");
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
    const loadingToast = toast.loading("Uploading photo...");

    try {
      const response = await uploadApi.uploadFile(file);
      await updateStaff(id, { ...staff, picture: response.url });
      setPicturePreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Photo upload failed", { id: loadingToast });
    }
  };

  const handlePhotoSave = async (croppedImage) => {
    const loadingToast = toast.loading("Uploading photo...");

    try {
      const dataURLtoFile = (dataurl, filename) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new File([u8arr], filename, { type: mime });
      };

      const file = dataURLtoFile(croppedImage, "profile_photo.jpg");
      const response = await uploadApi.uploadFile(file);
      await updateStaff(id, { ...staff, picture: response.url });
      setPicturePreview(response.url);
      toast.success("Photo updated successfully", { id: loadingToast });
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Photo upload failed", { id: loadingToast });
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateStaff(id, { ...staff, picture: null });
      setPicturePreview(null);
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    }
  };

  const handleSendMessage = () => {
    setMessage("");
    onClose();
    toast.success("Message sent");
  };

  const handleEditClick = () => {
    if (hasPermission('staff', 'edit')) {
      handleOpenAddStaff();
    } else {
      toast.error('You do not have permission to edit staff members');
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

  if (!staff) {
    // Show loading state while data is being fetched
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 text-sm">Loading staff data...</div></div>;
    }
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 text-sm">Staff member not found</div></div>;
  }

  return (
    <div className="w-full flex-1 bg-gray-50 p-6 min-h-screen">
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
        <button onClick={() => navigate('/staffs')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2">
          <ArrowLeft size={16} /><span>Back to Staff</span>
        </button>

        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                  {picturePreview || staff.picture ? (
                    <img src={picturePreview || staff.picture} alt={staff.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-medium text-gray-400">
                      {getSafeInitials(staff.name, staff.code?.charAt(0)?.toUpperCase() || '?')}
                    </span>
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
                <h1 className="text-xl font-semibold text-gray-900">
                  {getSafeDisplayName(staff, 'code')}
                </h1>

                {/* Roles Line with heading */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500">Roles:</span>
                  {Array.isArray(staff.role) ? staff.role.map((role, idx) => (
                    <Chip
                      key={idx}
                      size="sm"
                      variant="flat"
                      classNames={{
                        base: role === 'Admin' || role === 'Principal' ? "bg-gray-800 text-white" :
                          role === 'Teacher' ? "bg-gray-700 text-white" :
                            "bg-gray-100 text-gray-700",
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
                        base: "bg-gray-700 text-white",
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
                    <span className="text-xs font-medium text-gray-500">Subjects Handling:</span>
                    {[...new Set(subjectAssignments.map(a => a.subject).filter(Boolean))].map((subject, idx) => (
                      <Chip
                        key={idx}
                        size="sm"
                        variant="flat"
                        classNames={{
                          base: "bg-blue-50 text-blue-700 border border-blue-100",
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
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>{staff.department}</span>
                  </div>
                )}

                {/* Contact Info */}
                {staff.phone && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Phone size={12} /><span>{staff.phone}</span>
                    {staff.email && <><span className="text-gray-300">|</span><span>{staff.email}</span></>}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="flat" className="bg-gray-100 text-gray-700" startContent={<Phone size={16} />}
                onPress={() => { if (staff.phone) { window.location.href = `tel:${staff.phone}`; toast.success(`Calling...`); } else { toast.error("No phone number"); } }}
                isDisabled={!staff.phone}>Call</Button>
              <Button className="bg-gray-900 text-white hover:bg-gray-800" startContent={<Edit size={16} />} onPress={handleEditClick}>Edit</Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" className="text-gray-400"><MoreVertical size={20} /></Button>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[180px]">
                  <DropdownItem key="message" onPress={onOpen}>Send Message</DropdownItem>
                  <DropdownItem key="download">Download Profile</DropdownItem>
                  <DropdownItem key="print" onPress={() => window.print()}>Print</DropdownItem>
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
              className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
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
              {/* Stats Cards */}
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

              {/* Class Teacher Section - Always visible */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><GraduationCap size={16} className="text-gray-600" /></div>
                    <div><h3 className="font-medium text-gray-900 text-sm">Class Teacher Assignment</h3><p className="text-xs text-gray-500">{classTeacherAssignments.length > 0 ? 'Class you manage as class teacher' : 'Not assigned to any class'}</p></div>
                  </div>
                </div>
                {classTeacherAssignments.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {classTeacherAssignments.map((cls) => {
                      const clsAttendance = cls.averageAttendance || cls.attendance || 0;
                      return (
                        <div
                          key={cls.id}
                          className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/classes/${cls.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                              {cls.name}-{cls.section}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{cls.name} - {cls.section}</p>
                              <p className="text-xs text-gray-500">{cls.studentCount || 0} students</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${clsAttendance >= 90 ? 'bg-gray-800' : clsAttendance >= 75 ? 'bg-gray-600' : 'bg-gray-400'}`} style={{ width: `${clsAttendance}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-12 text-right">{clsAttendance}%</span>
                            <Link size={16} className="text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                      <GraduationCap size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">No class has been assigned yet</p>
                    <p className="text-xs text-gray-400 mb-4">This staff member is not a class teacher for any class.</p>
                    <button
                      onClick={handleOpenAssignClassModal}
                      className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                    >
                      Assign a Class →
                    </button>
                  </div>
                )}
              </div>

              {/* Today's Status */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Activity size={16} className="text-gray-600" /></div>
                    <div><h3 className="font-medium text-gray-900 text-sm">Today's Status</h3><p className="text-xs text-gray-500">{format(today, 'EEEE, MMMM d, yyyy')}</p></div>
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
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPresent ? 'bg-gray-100' : 'bg-gray-50'}`}>
                            <CheckCircle2 size={24} className={isPresent ? 'text-gray-600' : 'text-gray-400'} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {isPresent ? 'Present Today' : isAbsent ? 'Absent Today' : isOnLeave ? 'On Leave' : 'Not Marked'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {checkInTime ? `Check-in: ${checkInTime}` : isPresent ? 'Check-in: Marked' : 'Check-in: --:--'}
                              {checkOutTime ? ` · Out: ${checkOutTime}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
                          <p className="text-xs text-gray-500">Monthly Attendance</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Quick Stats Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Monthly Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xl font-bold text-gray-900">{monthlyStats.total}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Working Days</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xl font-bold text-gray-900">{monthlyStats.present}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Present</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xl font-bold text-gray-900">{monthlyStats.absent}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Absent</p>
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
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Calendar size={16} className="text-gray-600" /></div>
                    <div><h3 className="font-medium text-gray-900 text-sm">Weekly Timetable</h3><p className="text-xs text-gray-500">Manage class schedules and assignments</p></div>
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
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Briefcase size={16} className="text-gray-600" /></div>
                    <div><h3 className="font-medium text-gray-900 text-sm">Subject & Class Assignments</h3><p className="text-xs text-gray-500">Manage which subjects and classes this teacher can teach</p></div>
                  </div>
                </div>
                <div className="p-5">
                  <StaffAssignmentPanel staffId={id} />
                </div>
              </div>
            </div>
          )}

          {/* ─── PAYROLL TAB ─── */}
          {activeTab === "payroll" && (
            <StaffPayrollTab
              payrollHistory={payrollHistory}
              staffSalary={staffSalary}
              calculateTotals={calculateTotals}
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
            />
          )}
        </div>

        {/* RIGHT SIDEBAR - 1/3 */}
        <div className="lg:col-span-1 space-y-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleEditClick} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100"><Edit size={18} className="text-gray-600" /><span className="text-xs text-gray-600">Edit</span></button>
              <button onClick={() => staff.phone && (window.location.href = `tel:${staff.phone}`)} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100"><Phone size={18} className="text-gray-600" /><span className="text-xs text-gray-600">Call</span></button>
              <button onClick={onOpen} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100"><Mail size={18} className="text-gray-600" /><span className="text-xs text-gray-600">Message</span></button>
              <button onClick={() => navigate('/staffs')} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100"><Users size={18} className="text-gray-600" /><span className="text-xs text-gray-600">All Staff</span></button>
            </div>
          </div>

          {/* Alerts */}
          {(attendanceRate < 75 || (isTeacher && avgClassAttendance < 75)) && (
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100"><h3 className="text-sm font-medium text-gray-900">Attention Required</h3></div>
              <div className="divide-y divide-gray-50">
                {attendanceRate < 75 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><AlertCircle size={16} className="text-gray-600" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900">Low Attendance</p><p className="text-xs text-gray-500">{attendanceRate}% (below 75%)</p></div>
                  </div>
                )}
                {isTeacher && avgClassAttendance < 75 && (
                  <div className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Users size={16} className="text-gray-600" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900">Class Attendance Alert</p><p className="text-xs text-gray-500">Average: {avgClassAttendance}%</p></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Clear */}
          {attendanceRate >= 75 && (!isTeacher || avgClassAttendance >= 75) && (
            <div className="bg-white rounded-lg border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><CheckCircle2 size={16} className="text-gray-600" /></div>
                <div><h3 className="text-sm font-medium text-gray-900">All Clear</h3><p className="text-xs text-gray-500">No issues detected</p></div>
              </div>
              <p className="text-sm text-gray-600">This staff member is performing well with good attendance and no pending actions.</p>
            </div>
          )}

          {/* Contact Card */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              {staff.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Phone size={14} className="text-gray-600" /></div>
                  <div><p className="text-xs text-gray-400">Phone</p><p className="text-sm text-gray-900">{staff.phone}</p></div>
                </div>
              )}
              {staff.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Mail size={14} className="text-gray-600" /></div>
                  <div><p className="text-xs text-gray-400">Email</p><p className="text-sm text-gray-900 truncate">{staff.email}</p></div>
                </div>
              )}
              {staff.address && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Briefcase size={14} className="text-gray-600" /></div>
                  <div><p className="text-xs text-gray-400">Address</p><p className="text-sm text-gray-900">{staff.address}</p></div>
                </div>
              )}
            </div>
          </div>

          {/* Department Info */}
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Department Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Department</span>
                <span className="text-sm font-medium text-gray-900">{staff.department || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Role</span>
                <span className="text-sm font-medium text-gray-900">{Array.isArray(staff.role) ? staff.role.join(', ') : staff.role || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span className="text-sm font-medium text-gray-900">{staff.status || "Active"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Join Date</span>
                <span className="text-sm font-medium text-gray-900">{staff.joinDate || "—"}</span>
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
              label="Message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minRows={3}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <button className="px-4 py-2 text-sm font-medium text-gray-700" onClick={onClose}>Cancel</button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
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
              else if (window.staffDrawerCloseHandler) {
                const canClose = window.staffDrawerCloseHandler();
                if (!canClose) return;
              }
              handleCloseAddStaff();
            }
          }}
          placement="right"
          hideCloseButton
          classNames={{ wrapper: "justify-end", base: "w-[720px] max-w-[95vw]", backdrop: "bg-black/30" }}
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Edit size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Edit Staff Member</h2>
                      <p className="text-xs text-gray-500">Update staff details</p>
                    </div>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => {
                    if (addStaffRef.current) addStaffRef.current.attemptClose();
                    else if (window.staffDrawerCloseHandler) window.staffDrawerCloseHandler();
                    else handleCloseAddStaff();
                  }}>
                    <X size={20} className="text-gray-400" />
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
