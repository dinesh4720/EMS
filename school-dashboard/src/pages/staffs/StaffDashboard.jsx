import { useState, useEffect, useRef, useMemo } from "react";
import {
  Card, CardBody, CardHeader, Chip, Progress, Button, Divider,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Textarea, Avatar, Tabs, Tab, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip,
  Input, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, CheckSquare, MessageSquare, Clock, Mail, Phone, MapPin, Briefcase,
  Edit, User, FileText, Download, Upload, Plus, AlertCircle, BookOpen, GraduationCap,
  DollarSign, FileCheck, Layers, Settings, ChevronRight, Globe, TrendingUp, IndianRupee, AlertTriangle, Bell, Info,
  MoreHorizontal, Trash2, FolderPlus, Eye, CreditCard, ChevronLeft, Share2, Star, Shield, Activity, X, CheckCircle
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useApp } from "../../context/AppContext";
import { uploadApi } from "../../services/api";
import toast from "react-hot-toast";
import StaffAssignmentPanel from "./StaffAssignmentPanel";
import TeacherTimetableEditor from "./TeacherTimetableEditor";

export default function StaffDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    getStaffById, getMonthlyAttendance, markStaffAttendance: markAttendance, staffAttendance: attendance,
    staffSalaries, salarySettings, classes, updateClass, students, updateStaff, updateStaffLocal, deleteStaff,
    lessonPlans: allLessonPlans, documents: allDocuments, remarks: allRemarks,
    addLessonPlan, addDocument, addRemark, addEvent, payrollHistory, staff: allStaffList
  } = useApp();

  const { isOpen, onOpen, onClose } = useDisclosure(); // Message Modal
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure(); // Edit Modal
  const { isOpen: isSalaryOpen, onOpen: onSalaryOpen, onClose: onSalaryClose } = useDisclosure();

  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Document State
  const documentInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);

  // Photo Upload State
  const fileInputRef = useRef(null);
  const [picturePreview, setPicturePreview] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    status: "",
    address: ""
  });

  const staff = getStaffById(id); // Don't parse as number - MongoDB IDs are strings

  // Navigation Logic
  const currentStaffIndex = allStaffList?.findIndex(s => s.id === id) || 0;
  const prevStaffId = allStaffList?.[currentStaffIndex - 1]?.id;
  const nextStaffId = allStaffList?.[currentStaffIndex + 1]?.id;

  const handlePrevStaff = () => prevStaffId && navigate(`/staffs/${prevStaffId}`);
  const handleNextStaff = () => nextStaffId && navigate(`/staffs/${nextStaffId}`);

  const today = new Date();
  const monthlyStats = useMemo(() => {
    return getMonthlyAttendance(id, today.getFullYear(), today.getMonth());
  }, [id, attendance]);

  const attendanceRate = monthlyStats.total > 0 ? Math.round((monthlyStats.present / monthlyStats.total) * 100) : 0;

  const staffSalary = staffSalaries?.[id] || {};

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

  const { totalEarnings, totalDeductions, netSalary } = calculateTotals(staffSalary);

  // Initialize data
  useEffect(() => {
    if (staff) {
      setEditForm({
        name: staff.name || "",
        email: staff.email || "",
        phone: staff.phone || "",
        role: staff.role || "",
        department: staff.department || "",
        status: staff.status || "active",
        address: staff.address || ""
      });
      setPicturePreview(staff.picture || null);

      // Initialize Documents from all staff document arrays
      // Merge idDocuments, qualificationDocs, and customDocuments into unified format
      const allDocs = [];

      // Add ID documents with metadata
      if (staff.idDocuments && Array.isArray(staff.idDocuments)) {
        staff.idDocuments.forEach((doc, index) => {
          // Handle both old format (array of URLs) and new format (array of objects)
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

      // Add qualification documents
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

      // Add custom documents
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

  // Listen for real-time staff updates via Socket.IO
  useEffect(() => {
    const socketService = window.socketService;
    if (!socketService || !staff) {
      console.log('⚠️ Socket service or staff not available');
      return;
    }

    const handleStaffUpdate = (data) => {
      // Only update if this is the current staff member being viewed
      if (data.staffId === staff.id) {
        console.log('📢 Received update for current staff:', data);
        
        // Update the staff in global state
        updateStaffLocal(data.staffId, {
          name: data.name,
          role: data.role,
          department: data.department,
          status: data.status,
          phone: data.phone,
          email: data.email,
          picture: data.picture
        });
        
        // Update the edit form with new data
        setEditForm(prev => ({
          ...prev,
          name: data.name || prev.name,
          role: data.role || prev.role,
          department: data.department || prev.department,
          status: data.status || prev.status,
          phone: data.phone || prev.phone,
          email: data.email || prev.email
        }));
        
        // Update photo preview if changed
        if (data.picture) {
          setPicturePreview(data.picture);
        }
        
        toast.success('Profile updated by another user', {
          duration: 3000,
          icon: '🔄'
        });
      }
    };

    console.log('🎧 Setting up staff_updated listener for staff:', staff.id);
    socketService.on('staff_updated', handleStaffUpdate);

    return () => {
      console.log('🔇 Removing staff_updated listener');
      socketService.off('staff_updated', handleStaffUpdate);
    };
  }, [staff, updateStaffLocal]);

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files && files.length > 0) {
      // Mock Upload Process similar to StudentOverview
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

          // Simulate upload progress
          setActiveUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'uploading', progress: 50 } : u));

          const response = await uploadApi.uploadFile(file);

          const formatFileSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
          };

          const newDoc = {
            id: Date.now().toString(), // Mock ID
            name: file.name,
            type: file.type,
            url: response.url,
            size: formatFileSize(file.size),
            uploadDate: new Date().toISOString()
          };

          // In a real scenario, you would POST this to the backend
          // await updateStaffDocuments(id, newDoc); 
          // For now, we update local state and mock the backend update:
          const updatedDocs = [...documents, newDoc];
          setDocuments(updatedDocs);

          // Update Context (Mock)
          // updateStaff(id, { ...staff, documents: updatedDocs });

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
    }
  };

  const handleDeleteDocument = (docId) => {
    // Mock delete
    const updatedDocs = documents.filter(d => d.id !== docId && d.url !== docId); // Handle both ID types
    setDocuments(updatedDocs);
    toast.success("Document deleted");
    // updateStaff(id, { ...staff, documents: updatedDocs });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const loadingToast = toast.loading("Uploading photo...");
      try {
        const response = await uploadApi.uploadFile(file);

        // Update staff photo
        await updateStaff(id, { ...staff, picture: response.url });

        setPicturePreview(response.url);
        toast.success("Photo updated successfully", { id: loadingToast });
      } catch (error) {
        console.error("Photo upload error:", error);
        toast.error("Photo upload failed", { id: loadingToast });
      } finally {
        e.target.value = null;
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateStaff(id, editForm);
      toast.success("Staff details updated successfully");
      onEditClose();
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Failed to update staff details");
    }
  };

  const handleSendMessage = () => {
    console.log("Sending message to", staff.name, ":", message);
    setMessage("");
    onClose();
    toast.success("Message sent");
  };

  if (!staff) return <div className="p-8 text-center text-default-500">Staff member not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in p-6 lg:p-8 pb-12">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Top Profile Header & Actions Row - Matches StudentOverview */}
        <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-default-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full lg:w-auto">
            {/* Back Button & Navigation */}
            <div className="self-start md:self-center mr-2 flex items-center gap-2">
              <Button isIconOnly variant="light" onPress={() => navigate('/staffs')} className="text-default-500">
                <ArrowLeft size={20} />
              </Button>
            </div>

            {/* Avatar */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            <div className="relative group">
              <Avatar
                src={picturePreview || staff.picture || `https://i.pravatar.cc/150?u=${staff.id}`}
                name={staff.name}
                className="w-20 h-20 text-3xl ring-4 ring-white shadow-sm"
              />
              <div
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-default-200 cursor-pointer hover:bg-default-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                title="Update photo"
              >
                <Edit size={14} className="text-default-600" />
              </div>
            </div>

            {/* Staff Info */}
            <div className="text-center md:text-left space-y-1">
              <h1 className="text-2xl font-bold text-default-900">{staff.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-3 text-default-500 font-medium text-sm mt-1">
                <span>@{staff.role?.toLowerCase()?.replace(" ", "_") || "staff"}</span>
                <span className="text-sm font-medium text-default-600 bg-default-100 border border-default-200 px-2.5 py-0.5 rounded-md">
                  {staff.department || "General"}
                </span>
                {staff.joinDate && <span>• Joined {staff.joinDate}</span>}
              </div>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 z-10 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-default-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="flex items-center gap-2 mr-2">
              <Button isIconOnly variant="light" disabled={!prevStaffId} onPress={handlePrevStaff}>
                <ChevronLeft size={20} />
              </Button>
              <Button isIconOnly variant="light" disabled={!nextStaffId} onPress={handleNextStaff}>
                <ChevronRight size={20} />
              </Button>
            </div>
            <Button variant="flat" color="primary" startContent={<MessageSquare size={18} />} onPress={onOpen}>
              Send Message
            </Button>
            <Button variant="flat" color="default" startContent={<CreditCard size={18} />} onPress={() => setActiveTab("payroll")}>
              View Salary
            </Button>

            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light" color="default">
                  <MoreHorizontal size={20} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile actions">
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={onEditOpen}
                >
                  Edit Profile
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 size={16} />}
                  onPress={() => toast.error("Delete functionality constrained by permissions")}
                >
                  Delete Staff
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full space-y-6">
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
            <Tab key="attendance" title="Attendance" />
            <Tab key="about" title="About" />
            <Tab key="timetable" title="Timetable" />
            <Tab key="assignments" title="Assignments" />
            <Tab key="payroll" title="Payroll" />
            <Tab key="documents" title={
              <div className="flex items-center gap-2">
                <span>Documents</span>
                <Chip size="sm" variant="flat" color="primary">{documents.length}</Chip>
              </div>
            } />
          </Tabs>

          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Today's Status */}
                  <Card shadow="sm" className="border border-default-200">
                    <CardHeader className="px-6 py-4 border-b border-default-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 text-primary rounded-lg">
                          <Activity size={20} />
                        </div>
                        <h3 className="font-semibold text-default-900">Today's Status</h3>
                      </div>
                      <Chip
                        color={monthlyStats.present > 0 ? "success" : "default"}
                        variant="flat"
                        size="sm"
                      >
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </Chip>
                    </CardHeader>
                    <CardBody className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Attendance Status */}
                        <div className="text-center p-4 bg-default-50 rounded-xl">
                          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                            monthlyStats.present > 0 ? 'bg-success-100' : 'bg-default-200'
                          }`}>
                            {monthlyStats.present > 0 ? (
                              <CheckCircle size={24} className="text-success-600" />
                            ) : (
                              <Clock size={24} className="text-default-400" />
                            )}
                          </div>
                          <p className="text-xs text-default-500 uppercase font-semibold">Attendance</p>
                          <p className={`text-lg font-bold ${monthlyStats.present > 0 ? 'text-success' : 'text-default-600'}`}>
                            {monthlyStats.present > 0 ? 'Present' : 'Not Marked'}
                          </p>
                        </div>

                        {/* Check-in Time */}
                        <div className="text-center p-4 bg-default-50 rounded-xl">
                          <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-2">
                            <Clock size={24} className="text-blue-600" />
                          </div>
                          <p className="text-xs text-default-500 uppercase font-semibold">Check-in</p>
                          <p className="text-lg font-bold text-default-900">
                            {attendance[id]?.[new Date().toISOString().split('T')[0]]?.inTime || '--:--'}
                          </p>
                        </div>

                        {/* Current/Next Class - Only for teaching staff */}
                        {staff.staffType === 'Teacher' && (
                          <>
                            <div className="text-center p-4 bg-default-50 rounded-xl">
                              <div className="w-12 h-12 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-2">
                                <BookOpen size={24} className="text-orange-600" />
                              </div>
                              <p className="text-xs text-default-500 uppercase font-semibold">Current Class</p>
                              <p className="text-sm font-bold text-default-900">
                                {staff.assignedClasses?.[0] || 'No Class'}
                              </p>
                            </div>

                            <div className="text-center p-4 bg-default-50 rounded-xl">
                              <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-2">
                                <Calendar size={24} className="text-purple-600" />
                              </div>
                              <p className="text-xs text-default-500 uppercase font-semibold">Next Class</p>
                              <p className="text-sm font-bold text-default-900">
                                {staff.assignedClasses?.[1] || '--'}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Leave Info - For all staff */}
                        {!(staff.staffType === 'Teacher') && (
                          <>
                            <div className="text-center p-4 bg-default-50 rounded-xl">
                              <div className="w-12 h-12 mx-auto rounded-full bg-warning-100 flex items-center justify-center mb-2">
                                <AlertTriangle size={24} className="text-warning-600" />
                              </div>
                              <p className="text-xs text-default-500 uppercase font-semibold">Leave Balance</p>
                              <p className="text-lg font-bold text-default-900">
                                {12 - (monthlyStats.absent || 0)} days
                              </p>
                            </div>

                            <div className="text-center p-4 bg-default-50 rounded-xl">
                              <div className="w-12 h-12 mx-auto rounded-full bg-info-100 flex items-center justify-center mb-2">
                                <TrendingUp size={24} className="text-info-600" />
                              </div>
                              <p className="text-xs text-default-500 uppercase font-semibold">This Month</p>
                              <p className="text-lg font-bold text-default-900">
                                {attendanceRate}%
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>

                  {/* Classes Handling */}
                  <Card shadow="sm" className="border border-default-200">
                    <CardHeader className="px-6 py-4 border-b border-default-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                          <BookOpen size={20} />
                        </div>
                        <h3 className="font-semibold text-default-900">Classes Handling</h3>
                      </div>
                    </CardHeader>
                    <CardBody className="p-6">
                      {staff.assignedClasses && staff.assignedClasses.length > 0 ? (
                        <Table aria-label="Classes" removeWrapper shadow="none" classNames={{ th: "bg-default-50", td: "py-3 px-6" }}>
                          <TableHeader>
                            <TableColumn>CLASS</TableColumn>
                            <TableColumn>ROLE</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {staff.assignedClasses.map((className, index) => (
                              <TableRow key={index}>
                                <TableCell><span className="font-semibold">{className}</span></TableCell>
                                <TableCell>{staff.isClassTeacher && staff.classTeacherOf === className ? "Class Teacher" : "Assigned"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-default-500">No classes assigned yet</p>
                          <p className="text-xs text-default-400 mt-2">Classes can be assigned during staff creation or editing</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Attendance Stats */}
                  <Card shadow="sm" className="border border-default-200">
                    <CardHeader className="px-6 py-4 border-b border-default-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Clock size={20} />
                        </div>
                        <h3 className="font-semibold text-default-900">Attendance</h3>
                      </div>
                    </CardHeader>
                    <CardBody className="p-6 space-y-6">
                      <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-primary-100">
                          <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin-slow" style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent', transform: 'rotate(-45deg)' }}></div>
                          <div className="text-center">
                            <span className="text-3xl font-bold text-default-900">{attendanceRate}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-default-50 rounded-xl text-center">
                          <p className="text-xs text-default-500 uppercase font-semibold">Present</p>
                          <p className="text-lg font-bold text-success">{monthlyStats.present}</p>
                        </div>
                        <div className="p-3 bg-default-50 rounded-xl text-center">
                          <p className="text-xs text-default-500 uppercase font-semibold">Absent</p>
                          <p className="text-lg font-bold text-danger">{monthlyStats.absent}</p>
                        </div>
                        <div className="p-3 bg-default-50 rounded-xl text-center">
                          <p className="text-xs text-default-500 uppercase font-semibold">Total Days</p>
                          <p className="text-lg font-bold text-default-900">{monthlyStats.total}</p>
                        </div>
                        <div className="p-3 bg-default-50 rounded-xl text-center">
                          <p className="text-xs text-default-500 uppercase font-semibold">Leaves Used</p>
                          <p className="text-lg font-bold text-warning">{monthlyStats.leaves || 0}</p>
                        </div>
                      </div>
                      <Button fullWidth variant="flat" color="primary">Regularize Attendance</Button>
                    </CardBody>
                  </Card>


                  {/* Activity Log */}
                  <Card shadow="sm" className="border border-default-200">
                    <CardHeader className="px-6 py-4 border-b border-default-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-default-100 text-default-600 rounded-lg">
                          <Activity size={20} />
                        </div>
                        <h3 className="font-semibold text-default-900">Activity Log</h3>
                      </div>
                    </CardHeader>
                    <CardBody className="p-0">
                      <div className="flex flex-col">
                        {[
                          { title: "Marked Attendance", time: "08:24 AM", icon: CheckCircle, color: "text-success" },
                          { title: "Uploaded Lesson Plan", time: "Yesterday", icon: FileText, color: "text-primary" },
                          { title: "Applied for Leave", time: "2 days ago", icon: Calendar, color: "text-warning" }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 border-b border-default-100 last:border-0 hover:bg-default-50">
                            <item.icon size={18} className={item.color} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-default-900">{item.title}</p>
                              <p className="text-xs text-default-500">{item.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-6 animate-fade-in">
              {/* Attendance Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card shadow="sm" className="border border-default-200">
                  <CardBody className="p-6 text-center">
                    <p className="text-xs text-default-500 uppercase font-semibold">Total Days</p>
                    <p className="text-3xl font-bold text-default-900 mt-2">{monthlyStats.total}</p>
                  </CardBody>
                </Card>
                <Card shadow="sm" className="border border-default-200">
                  <CardBody className="p-6 text-center">
                    <p className="text-xs text-default-500 uppercase font-semibold">Present Days</p>
                    <p className="text-3xl font-bold text-success mt-2">{monthlyStats.present}</p>
                  </CardBody>
                </Card>
                <Card shadow="sm" className="border border-default-200">
                  <CardBody className="p-6 text-center">
                    <p className="text-xs text-default-500 uppercase font-semibold">Absent Days</p>
                    <p className="text-3xl font-bold text-danger mt-2">{monthlyStats.absent}</p>
                  </CardBody>
                </Card>
                <Card shadow="sm" className="border border-default-200">
                  <CardBody className="p-6 text-center">
                    <p className="text-xs text-default-500 uppercase font-semibold">Leaves Used</p>
                    <p className="text-3xl font-bold text-warning mt-2">{monthlyStats.leaves || 0}</p>
                  </CardBody>
                </Card>
              </div>

              {/* Attendance Calendar */}
              <Card shadow="sm" className="border border-default-200">
                <CardHeader className="px-6 py-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 text-primary rounded-lg">
                      <CalendarDays size={20} />
                    </div>
                    <h3 className="font-semibold text-default-900">Attendance Calendar</h3>
                  </div>
                  <Chip color="primary" variant="flat" size="sm">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Chip>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-semibold text-default-500 py-2">
                        {day}
                      </div>
                    ))}

                    {/* Calendar days - showing first 28 days for demo */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const dayNum = i - 3; // Offset to start from first of month
                      const dateStr = new Date(new Date().getFullYear(), new Date().getMonth(), dayNum)
                        .toISOString().split('T')[0];

                      if (dayNum < 1 || dayNum > 31) {
                        return <div key={i} className="h-10"></div>;
                      }

                      const dayAttendance = attendance[id]?.[dateStr];
                      let statusColor = 'bg-default-100';
                      let statusText = '-';

                      if (dayAttendance) {
                        switch (dayAttendance.status) {
                          case 'present':
                            statusColor = 'bg-success-100 text-success-700';
                            statusText = 'P';
                            break;
                          case 'absent':
                            statusColor = 'bg-danger-100 text-danger-700';
                            statusText = 'A';
                            break;
                          case 'leave':
                            statusColor = 'bg-warning-100 text-warning-700';
                            statusText = 'L';
                            break;
                          case 'halfday':
                            statusColor = 'bg-info-100 text-info-700';
                            statusText = 'H';
                            break;
                          default:
                            statusColor = 'bg-default-100';
                        }
                      }

                      const isToday = dayNum === new Date().getDate();

                      return (
                        <div
                          key={i}
                          className={`h-10 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-105 ${
                            statusColor
                          } ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          title={dayAttendance ? `${statusText}: ${dayAttendance.reason || ''}` : 'Not marked'}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>

              {/* Regularization Button */}
              <div className="flex justify-end">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<FileCheck size={16} />}
                  onPress={() => toast.success('Attendance regularization feature coming soon!')}
                >
                  Regularize Attendance
                </Button>
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-6 animate-fade-in">
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <User size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Personal Information</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Full Name" value={staff.name} />
                  <InfoItem label="Staff ID" value={staff.id} />
                  <InfoItem label="Date of Birth" value={staff.dateOfBirth} />
                  <InfoItem label="Gender" value={staff.gender} />
                  <InfoItem label="Marital Status" value={staff.maritalStatus} />
                  <InfoItem label="Blood Group" value={staff.bloodGroup} />
                  <InfoItem label="Qualification" value={staff.qualification} />
                  <InfoItem label="Experience" value={`${staff.experience || 0} Years`} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Briefcase size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Employment Details</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Role" value={staff.role} />
                  <InfoItem label="Department" value={staff.department} />
                  <InfoItem label="Designation" value={staff.designation} />
                  <InfoItem label="Joining Date" value={staff.joinDate} />
                  <InfoItem label="Employment Status" value={staff.status} />
                  <InfoItem label="Previous Organization" value={staff.previousOrganization || "-"} />
                  <InfoItem label="Role in Previous Organization" value={staff.roleInOrganization || "-"} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                      <Phone size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Contact Details</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Email" value={staff.email} />
                  <InfoItem label="Phone" value={staff.phone} />
                  <InfoItem label="Address" value={staff.address} className="col-span-full" />
                  {staff.emergencyContacts && staff.emergencyContacts.length > 0 ? (
                    <>
                      {staff.emergencyContacts.map((contact, index) => (
                        <InfoItem
                          key={index}
                          label={`Emergency Contact ${index + 1}`}
                          value={`${contact.name} (${contact.relationship}): ${contact.phone}`}
                          className="col-span-full"
                        />
                      ))}
                    </>
                  ) : (
                    <>
                      <InfoItem label="Emergency Contact" value={staff.emergencyContact || "-"} />
                      <InfoItem label="Emergency Phone" value={staff.emergencyPhone || "-"} />
                    </>
                  )}
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Bank Account Details</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Account Holder" value={staff.accountHolder} />
                  <InfoItem label="Account Number" value={staff.accountNumber} />
                  <InfoItem label="Bank Name" value={staff.bankName} />
                  <InfoItem label="IFSC Code" value={staff.ifscCode} />
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === "timetable" && (
            <div className="space-y-6 animate-fade-in">
              {/* Teacher Timetable Editor */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 py-4 border-b border-default-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-default-900">Weekly Timetable</h3>
                      <p className="text-xs text-default-500 mt-0.5">Manage class schedules and assignments</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <TeacherTimetableEditor teacherId={id} teacherName={staff?.name} />
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-6 animate-fade-in">
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 py-4 border-b border-default-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-default-900">Subject & Class Assignments</h3>
                      <p className="text-xs text-default-500 mt-0.5">Manage which subjects and classes this teacher can teach</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <StaffAssignmentPanel staffId={id} />
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === "payroll" && (
            <div className="space-y-6 animate-fade-in">
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="flex justify-between px-6 pt-6 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <IndianRupee size={20} />
                    </div>
                    <h4 className="font-bold text-lg text-default-900">Payroll History</h4>
                  </div>
                  <Button startContent={<Download size={16} />} variant="ghost" color="primary" size="sm">
                    Download Payslip
                  </Button>
                </CardHeader>
                <CardBody className="p-4">
                  {payrollHistory && payrollHistory.length > 0 ? (
                    <Table aria-label="Payroll History" removeWrapper classNames={{
                      th: "bg-default-50 text-default-600 font-semibold text-xs uppercase",
                      td: "py-4"
                    }}>
                      <TableHeader>
                        <TableColumn>MONTH</TableColumn>
                        <TableColumn>AMOUNT</TableColumn>
                        <TableColumn>STATUS</TableColumn>
                        <TableColumn>DATE PAID</TableColumn>
                        <TableColumn>ACTION</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {payrollHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell><span className="font-medium text-default-700">{record.month}</span></TableCell>
                            <TableCell>₹{staffSalary ? (calculateTotals(staffSalary).netSalary).toLocaleString() : 0}</TableCell>
                            <TableCell><Chip size="sm" color="success" variant="flat">Paid</Chip></TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>
                              <Button isIconOnly size="sm" variant="light" className="text-default-400 hover:text-primary">
                                <Download size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-default-500">No payroll records found for this staff member</p>
                      <p className="text-xs text-default-400 mt-2">Payroll can be generated from the Payroll section</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6 animate-fade-in">
              <input
                type="file"
                ref={documentInputRef}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-500">{documents.length} documents</span>
                </div>
                <Button size="sm" color="primary" startContent={<Upload size={16} />} onPress={() => documentInputRef.current?.click()}>Upload Document</Button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-default-200 rounded-xl bg-default-50/50 hover:bg-default-100/50 transition-colors cursor-pointer group" onClick={() => documentInputRef.current?.click()}>
                  <div className="inline-flex p-4 bg-white rounded-full mb-4 ring-1 ring-default-200 shadow-sm group-hover:scale-110 transition-transform">
                    <FolderPlus size={32} className="text-primary" />
                  </div>
                  <h4 className="font-semibold text-default-900 mb-1">No documents uploaded yet</h4>
                  <p className="text-sm text-default-500 max-w-xs mx-auto">Upload certificates, ID proofs, or other essential documents.</p>
                  <Button className="mt-4" size="sm" color="primary" variant="ghost" onPress={() => documentInputRef.current?.click()}>Browse Files</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-default-200 rounded-lg hover:bg-default-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-50 text-primary">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-default-900">{doc.name}</p>
                          <p className="text-xs text-default-500">{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Just now'} • {doc.size || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip content="View document">
                          <Button isIconOnly size="sm" variant="light" onPress={() => window.open(doc.url, '_blank')}>
                            <Eye size={16} className="text-default-500" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Download document">
                          <Button isIconOnly size="sm" variant="light" as="a" href={doc.url} download={doc.name} target="_blank">
                            <Download size={16} className="text-default-500" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Share document">
                          <Button isIconOnly size="sm" variant="light" onPress={() => toast.success("Shared via internal messaging")}>
                            <Share2 size={16} className="text-default-500" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete document">
                          <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteDocument(doc.id || doc.url)}>
                            <Trash2 size={16} />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Send Message Modal */}
      <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
        <ModalContent>
          <ModalHeader>Send Message to {staff.name}</ModalHeader>
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
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={handleSendMessage} isDisabled={!message.trim()}>Send</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} backdrop="blur" size="2xl">
        <ModalContent>
          <ModalHeader>Edit Staff Details</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Enter full name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                variant="bordered"
                isRequired
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                variant="bordered"
                isRequired
              />
              <Input
                label="Phone"
                placeholder="Enter phone number"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                variant="bordered"
                isRequired
              />
              <Select
                label="Role"
                placeholder="Select role"
                selectedKeys={editForm.role ? [editForm.role] : []}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                variant="bordered"
                isRequired
              >
                <SelectItem key="Teacher" value="Teacher">Teacher</SelectItem>
                <SelectItem key="Admin" value="Admin">Admin</SelectItem>
                <SelectItem key="Principal" value="Principal">Principal</SelectItem>
                <SelectItem key="Vice Principal" value="Vice Principal">Vice Principal</SelectItem>
                <SelectItem key="Accountant" value="Accountant">Accountant</SelectItem>
                <SelectItem key="Librarian" value="Librarian">Librarian</SelectItem>
                <SelectItem key="Lab Assistant" value="Lab Assistant">Lab Assistant</SelectItem>
              </Select>
              <Input
                label="Department"
                placeholder="Enter department"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                variant="bordered"
              />
              <Select
                label="Status"
                placeholder="Select status"
                selectedKeys={editForm.status ? [editForm.status] : []}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                variant="bordered"
                isRequired
              >
                <SelectItem key="active" value="active">Active</SelectItem>
                <SelectItem key="inactive" value="inactive">Inactive</SelectItem>
              </Select>
              <Input
                label="Address"
                placeholder="Enter address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                variant="bordered"
                className="md:col-span-2"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditClose}>Cancel</Button>
            <Button color="primary" onPress={handleSaveEdit}>Save Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value, className }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
      <span className="text-base font-medium text-default-900">{value || "-"}</span>
    </div>
  );
}
