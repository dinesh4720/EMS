import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card, CardBody, CardHeader, Chip, Progress, Button, Divider, Avatar,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Input, Select, SelectItem, Textarea,
  RadioGroup, Radio, Checkbox, cn, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, IndianRupee, User, Users,
  GraduationCap, FileText, Download, Edit, MessageSquare, Clock,
  CheckCircle, AlertCircle, BookOpen, Award, Upload, TrendingUp, CreditCard, Camera, Save,
  FileCheck, AlertTriangle, Printer, Eye, Plus, X, Check, Heart, Bus, ArrowRight,
  Globe, Twitter, Linkedin, Github, MoreHorizontal, FolderPlus, CalendarCheck, XCircle,
  FileOutput, BarChart4, TrendingUp as TrendingIcon, Trash2, Activity, MoreVertical, ChevronRight, Droplets, Shield, Search, Filter
}
  from "lucide-react";
import { format } from "date-fns";
import AddStudent from "./AddStudent";
import TCGeneratorModal from "./TCGeneratorModal";
import { useApp } from "../../context/AppContext";
import { uploadApi } from "../../services/api";
import { UnifiedUploadProgress } from "../../components/FileUploadProgress";
import toast from "react-hot-toast";

const genderOptions = ["Male", "Female", "Other"];
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const feeStatusOptions = ["paid", "pending", "overdue"];
const academicYears = ["2024-25", "2025-26", "2023-24"];

export default function StudentOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudentById, getStudentFeeHistory, classesWithTeachers, staff, updateStudent, addFeePayment, deleteStudent, loading } = useApp();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isFeeStatusOpen, setIsFeeStatusOpen] = useState(false);
  const [isParentAppOpen, setIsParentAppOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Documents state
  const documentInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files && files.length > 0) {

      // Initialize uploads state
      const newUploads = files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending' // pending, uploading, completed, error
      }));

      setActiveUploads(prev => [...prev, ...newUploads]);

      try {
        let successCount = 0;
        let failCount = 0;

        // Upload each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const uploadId = newUploads[i].id;

          // Update Status to Uploading
          setActiveUploads(prev => prev.map(u =>
            u.id === uploadId ? { ...u, status: 'uploading', progress: 5 } : u
          ));

          // Simulate progress for UX
          const progressInterval = setInterval(() => {
            setActiveUploads(prev => prev.map(u =>
              u.id === uploadId && u.progress < 90 ? { ...u, progress: u.progress + 10 } : u
            ));
          }, 200);

          try {
            // Upload to backend/Cloudinary
            const response = await uploadApi.uploadFile(file);

            clearInterval(progressInterval);

            // Format file size
            const formatFileSize = (bytes) => {
              if (bytes < 1024) return bytes + ' B';
              if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
              return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            };

            // Construct new doc object
            const newDoc = {
              name: file.name,
              type: file.type,
              url: response.url,
              size: formatFileSize(file.size),
              uploadDate: new Date().toISOString()
            };

            // Use dedicated document endpoint to append to array
            const response2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/documents`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(newDoc)
            });

            if (!response2.ok) {
              const error = await response2.json();
              throw new Error(error.error || 'Failed to save document');
            }

            const result = await response2.json();
            console.log('📄 Document saved to backend, received:', result);
            console.log('📄 All documents from server:', result.documents);

            // Update local state with all documents from server
            setDocuments(result.documents || []);
            console.log('📄 Local state updated with', result.documents?.length || 0, 'documents');

            // Mark completed
            setActiveUploads(prev => prev.map(u =>
              u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u
            ));

            successCount++;
          } catch (error) {
            clearInterval(progressInterval);
            console.error(`Upload error for ${file.name}:`, error);
            // Mark error
            setActiveUploads(prev => prev.map(u =>
              u.id === uploadId ? { ...u, status: 'error', progress: 0 } : u
            ));
            failCount++;
          }
        }

        // Auto-close after a few seconds if all success
        if (failCount === 0) {
          setTimeout(() => {
            setActiveUploads([]); // Clear uploads
            toast.success("All documents uploaded successfully");
          }, 3000);
        } else {
          toast.error(`Uploaded ${successCount}, Failed ${failCount}`);
        }

      } catch (error) {
        console.error("Batch upload error:", error);
        toast.error("Upload failed");
      } finally {
        e.target.value = null; // Reset input
      }
    }
  };

  const handleDeleteDocument = async (docId) => {
    console.log('🗑️ Attempting to delete document:', docId);
    console.log('🗑️ Current documents:', documents);
    
    // Find the index of the document to delete
    // Handle both doc.id and fallback doc-{index} format
    let docIndex = documents.findIndex(d => d.id === docId);
    
    console.log('🗑️ Found document at index:', docIndex);
    
    // If not found by id, try to extract index from doc-{index} format
    if (docIndex === -1 && docId.startsWith('doc-')) {
      docIndex = parseInt(docId.replace('doc-', ''));
      console.log('🗑️ Using fallback index:', docIndex);
    }

    if (docIndex === -1 || docIndex >= documents.length) {
      console.error('🗑️ Document not found or invalid index');
      toast.error("Document not found");
      return;
    }

    const loadingToast = toast.loading("Deleting document...");

    try {
      const deleteUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/documents/${docIndex}`;
      console.log('🗑️ DELETE request to:', deleteUrl);
      
      // Call the backend DELETE endpoint with the document index
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      console.log('🗑️ DELETE response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('🗑️ DELETE error response:', error);
        throw new Error(error.error || 'Failed to delete document');
      }

      const result = await response.json();
      console.log('🗑️ DELETE success, remaining documents:', result.documents?.length);

      // Update local state with the documents array from server
      setDocuments(result.documents || []);
      toast.success("Document deleted successfully", { id: loadingToast });
    } catch (error) {
      console.error("🗑️ Delete error:", error);
      toast.error("Failed to delete document: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handleCleanupCorruptedDocuments = async () => {
    console.log('🔧 Current documents before fix:', documents);
    const loadingToast = toast.loading("Fixing documents...");

    try {
      // Call the fix-documents endpoint which removes corrupted docs and adds IDs
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/fix-documents`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fix documents');
      }

      const result = await response.json();
      console.log('✅ Fixed documents from server:', result.documents);
      
      // Update local state with fixed documents
      setDocuments(result.documents || []);
      toast.success("Documents fixed successfully", { id: loadingToast });
    } catch (error) {
      console.error("Fix error:", error);
      toast.error("Failed to fix documents: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const loadingToast = toast.loading("Uploading photo...");
      try {
        // Upload to Cloudinary
        const response = await uploadApi.uploadFile(file);

        // Update student photo using direct MongoDB update
        const response2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photo: response.url,
            // Include all other fields to prevent data loss
            name: student.name,
            admissionId: student.admissionId,
            classId: student.classId,
            rollNo: student.rollNo,
            gender: student.gender,
            dateOfBirth: student.dateOfBirth,
            bloodGroup: student.bloodGroup,
            email: student.email,
            phone: student.phone,
            address: student.address,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            parentEmail: student.parentEmail,
            status: student.status,
            feeStatus: student.feeStatus
          })
        });

        if (!response2.ok) {
          const error = await response2.json();
          throw new Error(error.error || 'Failed to save photo');
        }

        // Update local preview
        setPhotoPreview(response.url);
        toast.success("Photo updated successfully", { id: loadingToast });

        // Refresh page to show new photo
        window.location.reload();
      } catch (error) {
        console.error("Photo upload error:", error);
        toast.error("Photo upload failed: " + (error.message || "Unknown error"), { id: loadingToast });
      } finally {
        e.target.value = null;
      }
    }
  };

  const student = getStudentById(id);
  const feeHistory = getStudentFeeHistory(id);
  const [selectedExam, setSelectedExam] = useState(null);

  // Fetch fresh student data on mount to get latest documents
  useEffect(() => {
    const fetchFreshStudentData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}`);
        if (response.ok) {
          const freshStudent = await response.json();
          if (freshStudent.documents) {
            console.log('📄 Initial documents loaded:', freshStudent.documents.length);
            setDocuments(freshStudent.documents);
          }
        }
      } catch (error) {
        console.error('Error fetching fresh student data:', error);
      }
    };

    fetchFreshStudentData();
  }, [id]);

  // Only sync documents from student data if local documents state is empty
  // This prevents overwriting newly uploaded documents with stale context data
  useEffect(() => {
    if (student?.documents && documents.length === 0) {
      console.log('📄 Syncing documents from context (only if empty)');
      setDocuments(student.documents);
    }
  }, [student, documents.length]);

  const [editForm, setEditForm] = useState({});
  const [paymentForm, setPaymentForm] = useState({ amount: "7000", month: "", date: new Date().toISOString().split('T')[0] });
  const [complaintForm, setComplaintForm] = useState({ subject: "", description: "" });

  // New States
  const [isRemarkOpen, setIsRemarkOpen] = useState(false);
  const [isExamConfigOpen, setIsExamConfigOpen] = useState(false);
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // New Actions State
  const { isOpen: isTcOpen, onOpen: onTcOpen, onClose: onTcClose } = useDisclosure();
  const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
  const { isOpen: isProgressOpen, onOpen: onProgressOpen, onClose: onProgressClose } = useDisclosure();

  const [promoteToClass, setPromoteToClass] = useState("");

  const handlePromoteStudent = async () => {
    if (!promoteToClass) return;
    try {
      await updateStudent(student.id, { class: promoteToClass }); // Assuming updateStudent handles class string/id
      toast.success(`Student promoted to ${promoteToClass}`);
      onPromoteClose();
      // optionally refresh or navigate
    } catch (e) {
      toast.error("Failed to promote student");
    }
  };

  // Helper to get unique classes (mock or from context if available)
  // For now using context's classesWithTeachers if available or formatted list
  const availableClasses = useMemo(() => {
    if (classesWithTeachers?.length) return classesWithTeachers.map(c => `${c.name}-${c.section}`);
    return ["Nursery-A", "KG-A", "1-A", "2-A", "3-A", "4-A", "5-A", "6-A", "7-A", "8-A", "9-A", "10-A"];
  }, [classesWithTeachers]);

  const openEditDrawer = () => {
    if (student) {
      setEditForm({
        // Personal Information
        fullName: student.name || "",
        admissionId: student.admissionId || "",
        academicYear: student.academicYear || "2024-25",
        dateOfBirth: student.dateOfBirth || "",
        gender: student.gender || "Male",
        picture: student.photo || null,
        aadhaarNumber: student.aadhaarNumber || "",
        bloodGroup: student.bloodGroup || "",
        nationality: student.nationality || "",
        religion: student.religion || "",
        category: student.category || "",
        motherTongue: student.motherTongue || "",
        previousSchool: student.previousSchool || "",
        tcNumber: student.tcNumber || "",
        // Class Info
        class: student.class || "",
        rollNumber: student.rollNo?.toString() || "",
        mediumOfInstruction: student.mediumOfInstruction || "",
        house: student.house || "",
        // Contact
        mobile: student.phone || "",
        email: student.email || "",
        address: student.address || "",
        // Parents
        parentName: student.parentName || "",
        parentPhone: student.parentPhone || "",
        parentEmail: student.parentEmail || "",
        parents: student.parents || [],
        // Status
        feeStatus: student.feeStatus || "pending",
        status: student.status || "active"
      });
      setPhotoPreview(student.photo || null);
      setIsEditOpen(true);
    }
  };





  const handleSaveEdit = async () => {
    const selectedClass = (classesWithTeachers || []).find(c => `${c.name}-${c.section}` === editForm.class);

    let photoUrl = student.photo; // Default to existing photo
    console.log('💾 Starting save - Current photo:', photoUrl);
    console.log('💾 editForm.picture:', editForm.picture ? (typeof editForm.picture === 'string' ? editForm.picture.substring(0, 50) + '...' : 'File object') : 'null');

    // Handle photo upload
    if (editForm.picture) {
      if (editForm.picture instanceof File) {
        // If it's a File object, upload it
        const loadingToast = toast.loading("Uploading photo...");
        try {
          const response = await uploadApi.uploadFile(editForm.picture);
          photoUrl = response.url;
          console.log('✅ Photo uploaded (File):', photoUrl);
          toast.success("Photo uploaded", { id: loadingToast });
        } catch (error) {
          toast.error("Photo upload failed", { id: loadingToast });
          console.error("Photo upload error:", error);
        }
      } else if (typeof editForm.picture === 'string') {
        if (editForm.picture.startsWith('data:image')) {
          // If it's a base64 string, convert to File and upload
          const loadingToast = toast.loading("Uploading photo...");
          try {
            console.log('🔄 Converting base64 to File...');
            // Convert base64 to blob
            const response = await fetch(editForm.picture);
            const blob = await response.blob();
            const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });

            console.log('🔄 Uploading to Cloudinary...');
            // Upload to Cloudinary
            const uploadResponse = await uploadApi.uploadFile(file);
            photoUrl = uploadResponse.url;
            console.log('✅ Photo uploaded (base64):', photoUrl);
            toast.success("Photo uploaded", { id: loadingToast });
          } catch (error) {
            toast.error("Photo upload failed", { id: loadingToast });
            console.error("Photo upload error:", error);
          }
        } else if (editForm.picture.startsWith('http')) {
          // If it's already a URL, use it
          photoUrl = editForm.picture;
          console.log('✅ Using existing URL:', photoUrl);
        }
      }
    }

    const updatedData = {
      ...student,
      name: editForm.fullName,
      admissionId: editForm.admissionId,
      classId: selectedClass?.id,
      rollNo: editForm.rollNumber ? parseInt(editForm.rollNumber) : null,
      gender: editForm.gender,
      dateOfBirth: editForm.dateOfBirth,
      bloodGroup: editForm.bloodGroup,
      email: editForm.email,
      phone: editForm.mobile,
      address: editForm.address,
      parentName: editForm.parentName,
      parentPhone: editForm.parentPhone,
      parentEmail: editForm.parentEmail,
      photo: photoUrl,
      status: editForm.status
    };

    console.log('💾 Saving student with photo:', photoUrl);
    console.log('💾 Full update data:', updatedData);

    await updateStudent(id, updatedData);
    setIsEditOpen(false);

    // Refresh the page to show updated data everywhere
    window.location.reload();
  };

  const handleRecordPayment = () => {
    if (!paymentForm.month || !paymentForm.amount) return;
    addFeePayment({ studentId: id, amount: parseInt(paymentForm.amount), month: paymentForm.month, date: paymentForm.date, status: "paid" });
    setIsPaymentOpen(false);
    setPaymentForm({ amount: "7000", month: "", date: new Date().toISOString().split('T')[0] });
  };

  const classOptions = (classesWithTeachers || []).map(c => `${c.name}-${c.section}`);

  const classInfo = useMemo(() => {
    if (!student || !student.class) return null;
    const parts = student.class.split("-");
    const className = parts[0];
    const section = parts[1]; // might be undefined logic check
    return (classesWithTeachers || []).find(c => c.name === className && c.section === section);
  }, [student, classesWithTeachers]);

  const classTeacher = useMemo(() => {
    if (!classInfo) return null;
    return (staff || []).find(s => s.id === classInfo.classTeacherId);
  }, [classInfo, staff]);

  const attendanceStats = useMemo(() => {
    const workingDays = 22;
    const present = Math.floor(workingDays * 0.9);
    return { present, absent: workingDays - present, total: workingDays, percentage: Math.round((present / workingDays) * 100) };
  }, []);

  if (loading) return <div className="p-8 text-center text-default-500">Loading profile...</div>;
  if (!student) return <div className="p-8 text-center text-default-500">Student not found</div>;

  const awardIcon = Award;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in p-6 lg:p-8 pb-12">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Sidebar - Left Side (Moved from Right) */}
        {/* Top Profile Header & Actions Row */}
        <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-default-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full lg:w-auto">
            {/* Back Button */}
            <div className="self-start md:self-center mr-2">
              <Button isIconOnly variant="light" onPress={() => navigate('/students')} className="text-default-500">
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
                src={student.photo || `https://i.pravatar.cc/150?u=student${student.id}`}
                className="w-20 h-20 text-3xl ring-4 ring-white shadow-sm"
              />
              <div
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-default-200 cursor-pointer hover:bg-default-50 transition-colors"
                onClick={() => setIsEditOpen(true)}
                title="Edit profile"
              >
                <Edit size={14} className="text-default-600" />
              </div>
            </div>

            {/* Student Info */}
            <div className="text-center md:text-left space-y-1">
              <h1 className="text-2xl font-bold text-default-900">{student.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-3 text-default-500 font-medium text-sm mt-1">
                <span>@{student.admissionId || "Student"}</span>
                <span className="text-sm font-medium text-default-600 bg-default-100 border border-default-200 px-2.5 py-0.5 rounded-md">
                  {student.class || "N/A"}
                </span>
                <span>• Roll {student.rollNo || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 z-10 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-default-100 pt-4 lg:pt-0 lg:pl-6">
            <Button variant="flat" color="default" startContent={<FileCheck size={18} />} onPress={onTcOpen}>
              Generate TC
            </Button>
            <Button variant="flat" color="default" startContent={<BarChart4 size={18} />} onPress={onProgressOpen}>
              Progress Card
            </Button>
            <Button color="primary" className="font-medium" startContent={<TrendingIcon size={18} />} onPress={onPromoteOpen}>
              Promote
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
                  onPress={() => setIsEditOpen(true)}
                >
                  Edit Profile
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 size={16} />}
                  onPress={onDeleteOpen}
                >
                  Delete Student
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
            <Tab key="student_info" title="Basic Details" />
            <Tab key="academics" title="Academics" />
            <Tab key="fees" title="Fees" />
            <Tab key="remarks" title="Remarks" />
          </Tabs>

          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              {/* Reports Section with Premium Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-default-900">Performance Overview</h3>
                  <span className="text-sm text-default-500">Last updated today</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Academic Performance Card - New */}
                  <Card shadow="sm" className="border border-default-200 bg-background/60 backdrop-blur-md">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                          <Award size={24} />
                        </div>
                        <Chip size="sm" color="secondary" variant="flat" className="text-xs font-semibold">Exams</Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-2xl font-semibold text-default-900">85%</h4>
                        <p className="text-sm font-medium text-default-500">Overall Percentage</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 space-y-2">
                        <div className="flex items-center gap-3 text-xs text-default-500">
                          <span className="font-medium">Class Average:</span>
                          <span className="font-bold text-default-700">78%</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-red-500">
                          <span className="font-medium">Weak Subject:</span>
                          <span className="font-bold">Mathematics</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Attendance Card - Updated */}
                  <Card isPressable onPress={() => setIsAttendanceOpen(true)} shadow="sm" className="border border-default-200 bg-background/60 backdrop-blur-md">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                          <Clock size={24} />
                        </div>
                        <Chip size="sm" color="primary" variant="flat" className="text-xs font-semibold">Expected: 90%</Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-2xl font-semibold text-default-900">{attendanceStats.percentage}%</h4>
                        <p className="text-sm font-medium text-default-500">Attendance</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 space-y-2">
                        <div className="flex items-center gap-3 text-xs text-default-500">
                          <span className="font-medium">Total Present:</span>
                          <span className="font-bold text-default-700">{attendanceStats.present}/{attendanceStats.total}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-red-500">
                          <span className="font-medium">Absent Days:</span>
                          <span className="font-bold">{attendanceStats.absent}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Fee Status Card - Updated */}
                  <Card isPressable onPress={() => setIsFeeStatusOpen(true)} shadow="sm" className="border border-default-200 bg-background/60 backdrop-blur-md">
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className={`p-3 rounded-xl ${student.feeStatus === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                          <IndianRupee size={24} />
                        </div>
                        <Chip size="sm" color={student.feeStatus === "paid" ? "success" : "warning"} variant="flat" className="capitalize text-xs font-semibold">
                          {student.feeStatus}
                        </Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          {/* Pending Amount Logic Placeholder - assuming 19666 as example */}
                          <h4 className="text-2xl font-semibold text-default-900">
                            {student.feeStatus === 'paid' ? '₹0' : '₹19,666'}
                          </h4>
                        </div>
                        <p className="text-sm font-medium text-default-500">{student.feeStatus === 'paid' ? 'No Dues' : 'Pending Amount'}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 text-xs text-default-500">
                          <span className="font-medium text-danger-600">Next Due:</span>
                          <span className="font-bold text-default-700">5th Oct</span>
                        </div>
                        <span className="text-xs font-semibold text-primary hover:text-primary-600 cursor-pointer transition-colors">Send Reminder</span>
                      </div>
                    </CardBody>
                  </Card>

                </div>
              </div>
            </div>
          )}

          {activeTab === "student_info" && (
            <div className="space-y-6 animate-fade-in">
              {/* Personal Information */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <User size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Personal Information</h3>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("personal")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Full Name" value={student.name} />
                  <InfoItem label="Admission ID" value={student.admissionId} />
                  <InfoItem label="Date of Birth" value={student.dateOfBirth} />
                  <InfoItem label="Gender" value={student.gender} />
                  <InfoItem label="Blood Group" value={student.bloodGroup} />
                  <InfoItem label="Religion" value={student.religion} />
                  <InfoItem label="Category" value={student.category} />
                  <InfoItem label="Mother Tongue" value={student.motherTongue} />
                  <InfoItem label="Aadhaar Number" value={student.aadhaarNumber} />
                  <InfoItem label="Nationality" value={student.nationality} />
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
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("contact")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                  <InfoItem label="Address" value={student.address} className="col-span-full" />
                  <InfoItem label="City" value={student.city} />
                  <InfoItem label="State" value={student.state} />
                  <InfoItem label="ZIP Code" value={student.zipCode} />
                  <InfoItem label="Phone" value={student.phone} />
                  <InfoItem label="Email" value={student.email} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Users size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Parent / Guardian</h3>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("parents")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                  <InfoItem label="Father's Name" value={student.parentName} />
                  <InfoItem label="Father's Occupation" value={student.parentOccupation} />
                  <InfoItem label="Mother's Name" value={student.motherName} />
                  <InfoItem label="Mother's Occupation" value={student.motherOccupation} />
                  <InfoItem label="Primary Phone" value={student.parentPhone} />
                  <InfoItem label="Primary Email" value={student.parentEmail} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                      <GraduationCap size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Previous Education</h3>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("education")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                  <InfoItem label="School Name" value={student.previousSchool} />
                  <InfoItem label="TC Number" value={student.tcNumber} />
                </CardBody>
              </Card>

              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                      <FileCheck size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Additional Information</h3>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("additional")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Academic Year" value={student.academicYear || "2024-25"} />
                  <InfoItem label="Medium of Instruction" value={student.mediumOfInstruction || "English"} />
                  <InfoItem label="House" value={student.house || "Not Assigned"} />
                  <InfoItem label="Transport Required" value={student.transportRequired ? "Yes" : "No"} />
                  <InfoItem label="Hostel Required" value={student.hostelRequired ? "Yes" : "No"} />
                  <InfoItem label="Medical Conditions" value={student.medicalConditions || "None"} className="col-span-full" />
                  <InfoItem label="Emergency Contact Name" value={student.emergencyContactName || "-"} />
                  <InfoItem label="Emergency Contact Phone" value={student.emergencyContactPhone || "-"} />
                </CardBody>
              </Card>

              {/* Documents Section */}
              {/* Documents Section */}
              <input
                type="file"
                ref={documentInputRef}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
              />
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Documents</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-default-500 self-center">{documents.length} documents</span>
                    {documents.some(doc => !doc.url || !doc.name || !doc.id) && (
                      <Button 
                        size="sm" 
                        color="warning" 
                        variant="flat" 
                        startContent={<AlertTriangle size={16} />} 
                        onPress={handleCleanupCorruptedDocuments}
                      >
                        Fix Documents
                      </Button>
                    )}
                    <Button size="sm" color="primary" variant="flat" startContent={<Upload size={16} />} onPress={() => documentInputRef.current?.click()}>Upload New</Button>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  {documents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-default-200 rounded-xl bg-default-50/50 hover:bg-default-100/50 transition-colors cursor-pointer group" onClick={() => documentInputRef.current?.click()}>
                      <div className="inline-flex p-4 bg-white rounded-full mb-4 ring-1 ring-default-200 shadow-sm group-hover:scale-110 transition-transform">
                        <FolderPlus size={32} className="text-primary" />
                      </div>
                      <h4 className="font-semibold text-default-900 mb-1">No documents uploaded yet</h4>
                      <p className="text-sm text-default-500 max-w-xs mx-auto">Upload birth certificate, transfer certificate, or other essential documents.</p>
                      <Button className="mt-4" size="sm" color="primary" variant="ghost" onPress={() => documentInputRef.current?.click()}>Browse Files</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc, index) => {
                        // Check if document has valid data
                        const isCorrupted = !doc.url || !doc.name;
                        const docId = doc.id || `doc-${index}`;
                        
                        return (
                          <div key={docId} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isCorrupted ? 'border-danger-200 bg-danger-50/30' : 'border-default-200 hover:bg-default-50'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isCorrupted ? 'bg-danger-50 text-danger' : 'bg-primary-50 text-primary'}`}>
                                {isCorrupted ? <AlertTriangle size={20} /> : <FileText size={20} />}
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${isCorrupted ? 'text-danger-700' : 'text-default-900'}`}>
                                  {doc.name || 'Corrupted Document'}
                                </p>
                                <p className="text-xs text-default-500">
                                  {isCorrupted ? 'Invalid file - please delete' : `${doc.date || 'Unknown date'} • ${doc.size || 'Unknown size'}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isCorrupted && doc.url && (
                                <>
                                  <Tooltip content="View document">
                                    <Button 
                                      isIconOnly 
                                      size="sm" 
                                      variant="light" 
                                      onPress={() => {
                                        console.log('👁️ Opening document:', doc.url);
                                        
                                        // For PDFs, use Google Docs Viewer or direct URL
                                        if (doc.name?.toLowerCase().endsWith('.pdf')) {
                                          // Use Google Docs Viewer as a proxy to force inline viewing
                                          const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.url)}&embedded=true`;
                                          window.open(viewerUrl, '_blank', 'noopener,noreferrer');
                                        } else {
                                          // For images and other files, open directly
                                          window.open(doc.url, '_blank', 'noopener,noreferrer');
                                        }
                                      }}
                                    >
                                      <Eye size={16} className="text-default-500" />
                                    </Button>
                                  </Tooltip>
                                  <Tooltip content="Download document">
                                    <Button 
                                      isIconOnly 
                                      size="sm" 
                                      variant="light" 
                                      as="a"
                                      href={doc.url}
                                      download={doc.name}
                                      target="_blank"
                                    >
                                      <Download size={16} className="text-default-500" />
                                    </Button>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip content="Delete document">
                                <Button 
                                  isIconOnly 
                                  size="sm" 
                                  variant="light" 
                                  color="danger" 
                                  onPress={() => handleDeleteDocument(docId)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

            </div>
          )}

          {activeTab === "fees" && (
            <div className="space-y-6 animate-fade-in">
              {/* Fee Hero Section - Enhanced with Real Data */}
              <div className={`p-6 rounded-2xl border relative overflow-hidden ${
                studentFeeSummary?.totalPending <= 0 
                  ? "bg-success-50 border-success-200" 
                  : "bg-gradient-to-br from-danger-50 to-orange-50 border-danger-200"
              }`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <p className="text-default-600 font-medium">Total Outstanding</p>
                    <h2 className="text-4xl font-bold text-default-900">
                      ₹{studentFeeSummary?.totalPending?.toLocaleString() || 0}
                    </h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {studentFeeSummary?.nextDueDate && new Date(studentFeeSummary.nextDueDate) < new Date() ? (
                        <p className="text-xs text-danger-600 bg-danger-100 px-3 py-1 rounded-full inline-block font-medium">
                          Overdue: {new Date(studentFeeSummary.nextDueDate).toLocaleDateString()}
                        </p>
                      ) : studentFeeSummary?.nextDueDate ? (
                        <p className="text-xs text-warning-600 bg-warning-100 px-3 py-1 rounded-full inline-block font-medium">
                          Next Due: {new Date(studentFeeSummary.nextDueDate).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-xs text-success-600 bg-success-100 px-3 py-1 rounded-full inline-block font-medium">
                          All fees paid
                        </p>
                      )}
                      {studentFeeSummary?.collectionMode && (
                        <p className="text-xs text-default-600 bg-white px-3 py-1 rounded-full inline-block font-medium capitalize">
                          {studentFeeSummary.collectionMode}-wise collection
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {studentFeeSummary?.totalPending > 0 && (
                      <>
                        <Button 
                          color="primary" 
                          className="font-semibold shadow-sm" 
                          onPress={() => setIsPaymentOpen(true)} 
                          startContent={<CreditCard size={18} />}
                        >
                          Collect Payment
                        </Button>
                        <Button 
                          variant="flat" 
                          color="warning" 
                          className="font-medium" 
                          startContent={<Mail size={18} />}
                          onPress={() => handleSendReminder()}
                        >
                          Send Reminder
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="bordered" 
                      className="border-default-200 text-default-700 bg-white" 
                      startContent={<Download size={18} />}
                      onPress={() => handleDownloadInvoice()}
                    >
                      Invoice
                    </Button>
                  </div>
                </div>
              </div>

              {/* Fee Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <IndianRupee size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Total Fee</p>
                        <p className="text-lg font-bold text-default-900">
                          ₹{studentFeeSummary?.totalFee?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-success-50 text-success-600 rounded-xl">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Paid</p>
                        <p className="text-lg font-bold text-success-600">
                          ₹{studentFeeSummary?.totalPaid?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-warning-50 text-warning-600 rounded-xl">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Pending</p>
                        <p className="text-lg font-bold text-warning-600">
                          ₹{studentFeeSummary?.totalPending?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Discount</p>
                        <p className="text-lg font-bold text-purple-600">
                          ₹{studentFeeSummary?.totalDiscount?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fee Breakdown by Period */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-default-900">Fee Breakdown by Period</h3>
                    <Chip size="sm" variant="flat" className="capitalize">
                      {studentFeeSummary?.collectionMode || 'Term'}-wise
                    </Chip>
                  </div>
                  <div className="space-y-3">
                    {studentFeeSummary?.pendingDuesByPeriod && Object.keys(studentFeeSummary.pendingDuesByPeriod).length > 0 ? (
                      Object.entries(studentFeeSummary.pendingDuesByPeriod).map(([period, data]) => (
                        <div key={period} className={`p-4 rounded-xl border bg-white shadow-none ${
                          data.status === 'paid' ? 'border-success-200 bg-success-50/30' :
                          data.status === 'overdue' ? 'border-danger-200 bg-danger-50/30' :
                          'border-default-200'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-default-700 capitalize">{period}</span>
                                <Chip 
                                  size="sm" 
                                  color={data.status === 'paid' ? 'success' : data.status === 'overdue' ? 'danger' : 'warning'}
                                  variant="flat"
                                  className="text-xs capitalize"
                                >
                                  {data.status}
                                </Chip>
                              </div>
                              <p className="text-xs text-default-500 mt-1">
                                Due: {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-default-500">
                                ₹{data.paid?.toLocaleString() || 0} / ₹{data.total?.toLocaleString() || 0}
                              </p>
                              <p className="text-lg font-bold text-default-900">
                                {data.status === 'paid' ? 'Paid' : `₹${data.pending?.toLocaleString() || 0} pending`}
                              </p>
                            </div>
                          </div>
                          <Progress 
                            value={data.total ? ((data.paid || 0) / data.total) * 100 : 0} 
                            color={data.status === 'paid' ? 'success' : data.status === 'overdue' ? 'danger' : 'warning'} 
                            size="sm" 
                            radius="full" 
                            className="mt-2"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center border border-default-200 rounded-xl bg-default-50">
                        <CheckCircle size={32} className="mx-auto text-success-500 mb-2" />
                        <p className="text-sm text-default-600">No pending dues</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment History Timeline */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-default-900">Payment History</h3>
                    <Button size="sm" variant="light" color="primary" onPress={() => navigate('/fees')}>View All</Button>
                  </div>
                  <div className="space-y-0 border border-default-200 rounded-xl divide-y divide-default-100 bg-white shadow-none max-h-[400px] overflow-y-auto">
                    {feeHistory.length > 0 ? feeHistory.map((payment, idx) => (
                      <div key={payment.id || idx} className="flex justify-between items-center p-4 hover:bg-default-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            payment.status === 'completed' || payment.status === 'success'
                              ? 'bg-success-50 text-success' 
                              : 'bg-warning-50 text-warning'
                          }`}>
                            <CheckCircle size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-default-900">
                              {payment.paymentPeriod || payment.feeHeads?.[0]?.period || 'Fee Payment'}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-default-500">
                                {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : payment.date}
                              </p>
                              {payment.receiptNumber && (
                                <span className="text-xs text-default-400">• {payment.receiptNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-default-900">₹{payment.amount?.toLocaleString() || 0}</p>
                          <p className="text-xs text-default-500 capitalize">{payment.paymentMode || payment.mode}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center">
                        <CreditCard size={32} className="mx-auto text-default-300 mb-2" />
                        <p className="text-sm text-default-500">No payment history yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fee Heads Detailed Breakdown */}
              {studentFeeSummary?.feeHeads && studentFeeSummary.feeHeads.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-default-900">Fee Heads Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studentFeeSummary.feeHeads.map((head, idx) => (
                      <Card key={idx} className="border border-default-200">
                        <CardBody className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-default-900">{head.name}</p>
                              <p className="text-xs text-default-500 capitalize">{head.category}</p>
                            </div>
                            <Chip 
                              size="sm" 
                              color={head.paid >= head.amount ? 'success' : 'warning'}
                              variant="flat"
                            >
                              {head.paid >= head.amount ? 'Paid' : 'Partial'}
                            </Chip>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-default-500">Total:</span>
                              <span className="font-medium">₹{head.amount?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-default-500">Paid:</span>
                              <span className="font-medium text-success-600">₹{head.paid?.toLocaleString() || 0}</span>
                            </div>
                            {head.pending > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-default-500">Pending:</span>
                                <span className="font-medium text-warning-600">₹{head.pending?.toLocaleString() || 0}</span>
                              </div>
                            )}
                          </div>
                          <Progress 
                            value={head.amount ? (head.paid / head.amount) * 100 : 0} 
                            color={head.paid >= head.amount ? 'success' : 'warning'}
                            size="sm" 
                            radius="full"
                            className="mt-3"
                          />
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "remarks" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-default-900">Recent Remarks & Notes</h3>
                <Button size="sm" color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => setIsRemarkOpen(true)}>Add Note</Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-default-200 bg-white hover:border-primary/30 hover:shadow-sm transition-all hover:bg-default-50/50">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <MessageSquare size={20} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-default-900">Excellent participation in class</h4>
                        <p className="text-sm text-default-500 mt-0.5">Academic • Teacher A</p>
                      </div>
                      <Chip size="sm" variant="flat" className="bg-default-100 text-default-600">Dec 20</Chip>
                    </div>
                    <p className="text-sm text-default-600 leading-relaxed">
                      Student shows great enthusiasm and actively participates in discussions. Consistently asks insightful questions.
                    </p>
                  </div>
                </div>

                <div className="group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-default-200 bg-white hover:border-warning/30 hover:shadow-sm transition-all hover:bg-default-50/50">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                      <AlertCircle size={20} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-default-900">Needs improvement in homework</h4>
                        <p className="text-sm text-default-500 mt-0.5">Behavioral • Teacher B</p>
                      </div>
                      <Chip size="sm" variant="flat" className="bg-default-100 text-default-600">Dec 18</Chip>
                    </div>
                    <p className="text-sm text-default-600 leading-relaxed">
                      Homework submission has been irregular this week. Please ensure daily monitoring.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}



          {activeTab === "academics" && (
            <div className="space-y-6 animate-fade-in">
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100"><h3 className="text-lg font-semibold text-default-900">Current Academic Status</h3></CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Class" value={student.class || "N/A"} />
                  <InfoItem label="Roll Number" value={student.rollNo || "N/A"} />
                  <InfoItem label="Academic Year" value={student.academicYear || "2024-25"} />
                  <InfoItem label="Class Teacher" value={classTeacher?.name || "Not Assigned"} />
                  <InfoItem label="Medium" value={student.mediumOfInstruction || "English"} />
                  <InfoItem label="House" value={student.house || "Not Assigned"} />
                </CardBody>
              </Card>

              {/* Exam Performance - Cards Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-default-900">Exam Overview</h3>
                  <Select size="sm" placeholder="Select Term" className="w-32" variant="bordered" defaultSelectedKeys={["term1"]}>
                    <SelectItem key="term1">Term 1</SelectItem>
                    <SelectItem key="term2">Term 2</SelectItem>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Exam Cards */}
                  {[{ name: "Unit Test 1", date: "Aug 2024", status: "Published", score: "88%" }, { name: "Half Yearly", date: "Sept 2024", status: "Pending", score: "-" }, { name: "Unit Test 2", date: "Nov 2024", status: "Scheduled", score: "-" }].map((exam, i) => (
                    <Card key={i} isPressable onPress={() => { setSelectedExam(exam); setIsExamConfigOpen(true); }} shadow="none" className="border border-default-200 hover:border-primary hover:bg-primary-50/10 transition-colors">
                      <CardBody className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2.5 bg-default-100 rounded-lg text-default-600">
                            <FileText size={20} />
                          </div>
                          <Chip size="sm" color={exam.status === "Published" ? "success" : exam.status === "Pending" ? "warning" : "default"} variant="flat">{exam.status}</Chip>
                        </div>
                        <h4 className="text-lg font-semibold text-default-900 mb-1">{exam.name}</h4>
                        <p className="text-xs text-default-500 mb-4">{exam.date}</p>
                        <div className="flex items-center justify-between text-sm pt-4 border-t border-default-100">
                          <span className="text-default-500">Score</span>
                          <span className="font-bold text-default-900">{exam.score}</span>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Attendance Summary */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Attendance Summary</h3>
                  <Button size="sm" variant="flat" color="warning" startContent={<Clock size={16} />} onPress={() => setIsRegularizeOpen(true)}>Regularize Attendance</Button>
                </CardHeader>
                <CardBody className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-6 bg-primary-50/50 rounded-2xl border border-primary-100">
                      <div className="text-4xl font-semibold text-primary mb-2">{attendanceStats.percentage}%</div>
                      <div className="text-sm font-medium text-default-600 uppercase tracking-wider">Overall</div>
                    </div>
                    {/* ... other stats same styling ... */}
                    <div className="text-center p-6 bg-success-50/50 rounded-2xl border border-success-100">
                      <div className="text-4xl font-semibold text-success-600 mb-2">{attendanceStats.present}</div>
                      <div className="text-sm font-medium text-default-600 uppercase tracking-wider">Present</div>
                    </div>
                    <div className="text-center p-6 bg-danger-50/50 rounded-2xl border border-danger-100">
                      <div className="text-4xl font-semibold text-danger-600 mb-2">{attendanceStats.absent}</div>
                      <div className="text-sm font-medium text-default-600 uppercase tracking-wider">Absent</div>
                    </div>
                    <div className="text-center p-6 bg-default-100/50 rounded-2xl border border-default-200">
                      <div className="text-4xl font-semibold text-default-700 mb-2">{attendanceStats.total}</div>
                      <div className="text-sm font-medium text-default-600 uppercase tracking-wider">Total Days</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Attendance Progress</span>
                      <span className="text-primary">{attendanceStats.percentage}%</span>
                    </div>
                    <Progress value={attendanceStats.percentage} color="primary" size="md" radius="lg" classNames={{ track: "bg-default-100", indicator: "bg-primary" }} />
                    <p className="text-xs text-default-400 text-center pt-2">Based on current academic session records</p>
                  </div>
                </CardBody>
              </Card>


              {/* Progress Reports */}
              <Card shadow="sm" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100"><h3 className="text-lg font-semibold text-default-900">Progress Reports & Remarks</h3></CardHeader>
                <CardBody className="p-8 space-y-6">
                  <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={18} className="text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Teacher Comments</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800/80 list-disc list-inside pl-2">
                      <li>Shows excellent understanding of concepts</li>
                      <li>Active participation in class discussions</li>
                      <li>Needs to improve time management for assignments</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-success-50/50 rounded-xl border border-success-100 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-success-100 rounded-full"><Plus size={14} className="text-success-700" /></div>
                        <h4 className="font-semibold text-success-900">Strengths</h4>
                      </div>
                      <p className="text-sm text-success-800/80 leading-relaxed">Problem-solving, Analytical thinking, Team collaboration in science projects.</p>
                    </div>
                    <div className="p-6 bg-warning-50/50 rounded-xl border border-warning-100 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-warning-100 rounded-full"><AlertCircle size={14} className="text-warning-700" /></div>
                        <h4 className="font-semibold text-warning-900">Areas to Improve</h4>
                      </div>
                      <p className="text-sm text-warning-800/80 leading-relaxed">Handwriting legibility, Consistent homework completion, Time management during exams.</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div >




      {/* Edit Drawer */}
      {/* Edit Drawer - Uses AddStudent Component */}
      <Drawer isOpen={isEditOpen} onOpenChange={setIsEditOpen} placement="right" size="5xl" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]", backdrop: "bg-black/40 backdrop-blur-sm" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1 border-b border-default-100 pb-4">
                <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-xl"><Edit size={20} className="text-primary" /></div><div><h3 className="text-lg font-semibold">Edit Student</h3><p className="text-xs text-default-500">Update student information</p></div></div>
              </DrawerHeader>
              <DrawerBody className="py-2 px-0">
                <AddStudent
                  onClose={onClose}
                  onSave={(data) => {
                    updateStudent(id, data);
                    onClose();
                  }}
                  classesWithTeachers={classesWithTeachers || []}
                  classOptions={classOptions}
                  initialData={student}
                />
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)}>
        <ModalContent>
          <ModalHeader>Record Fee Payment</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input label="Amount" type="number" value={paymentForm.amount} onValueChange={(v) => setPaymentForm({ ...paymentForm, amount: v })} startContent="₹" variant="bordered" />
              <Select label="Month" placeholder="Select month" selectedKeys={paymentForm.month ? [paymentForm.month] : []} onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, month: Array.from(keys)[0] })} variant="bordered">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <SelectItem key={m}>{m}</SelectItem>)}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button color="primary" onPress={handleRecordPayment}>Record Payment</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* TC Generator Modal */}
      <TCGeneratorModal
        isOpen={isTcOpen}
        onClose={onTcClose}
        students={[student]}
      />

      {/* TC Generator Modal */}
      <TCGeneratorModal
        isOpen={isTcOpen}
        onClose={onTcClose}
        students={[student]}
      />

      <Modal isOpen={isPromoteOpen} onClose={onPromoteClose}>
        <ModalContent>
          <ModalHeader>Promote Student</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-500">
                Current Class: <span className="font-semibold text-default-900">{student.class}</span>
              </p>
              <Select
                label="Promote to Class"
                placeholder="Select next class"
                selectedKeys={promoteToClass ? [promoteToClass] : []}
                onSelectionChange={(keys) => setPromoteToClass(Array.from(keys)[0])}
                variant="bordered"
              >
                {availableClasses.map(c => <SelectItem key={c}>{c}</SelectItem>)}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onPromoteClose}>Cancel</Button>
            <Button color="primary" onPress={handlePromoteStudent} isDisabled={!promoteToClass}>Promote</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Progress Card Modal */}
      <Modal isOpen={isProgressOpen} onClose={onProgressClose}>
        <ModalContent>
          <ModalHeader>Student Progress Card</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <BarChart4 size={48} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{student.name}</h3>
                <p className="text-default-500">Class {student.class} • Roll {student.rollNo}</p>
              </div>
              <p className="text-sm text-default-500 max-w-xs">
                Generate and download the detailed academic performance report card for the current academic year.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onProgressClose}>Cancel</Button>
            <Button color="primary" startContent={<Download size={18} />} onPress={() => { toast.success("Progress card downloading..."); onProgressClose(); }}>
              Download Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Side Drawers for Detail Cards */}
      <Drawer isOpen={isAttendanceOpen} onOpenChange={setIsAttendanceOpen} placement="right" size="sm" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Attendance Details</h3></DrawerHeader>
              <DrawerBody className="p-6">
                <div className="space-y-6">
                  <div className="text-center p-6 bg-primary-50 rounded-2xl"><div className="text-4xl font-bold text-primary">{attendanceStats.percentage}%</div><div className="text-sm text-primary-600">Overall Attendance</div></div>
                  <div><h4 className="font-medium mb-3">Attendance History</h4><p className="text-sm text-default-500">Detailed calendar view and log will be here.</p></div>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer isOpen={isFeeStatusOpen} onOpenChange={setIsFeeStatusOpen} placement="right" size="sm" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Fee Details</h3></DrawerHeader>
              <DrawerBody className="p-6">
                <div className="space-y-6">
                  <div className="p-4 border border-warning-200 bg-warning-50 rounded-xl"><h4 className="text-warning-700 font-semibold mb-1">Payment Due</h4><p className="text-2xl font-bold text-warning-800">₹19,666</p><p className="text-xs text-warning-600">Due Date: Oct 5, 2024</p></div>
                  <Button color="primary" fullWidth onPress={() => { onClose(); setActiveTab("fees"); }}>View Full Fee Structure</Button>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer isOpen={isParentAppOpen} onOpenChange={setIsParentAppOpen} placement="right" size="sm" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Parent App</h3></DrawerHeader>
              <DrawerBody className="p-6">
                <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-success-50 rounded-full text-success"><Phone size={24} /></div><div><h4 className="font-bold">Connected</h4><p className="text-sm text-default-500">Active since Aug 2024</p></div></div>
                <div className="space-y-4"><div className="flex justify-between border-b border-default-100 pb-2"><span className="text-default-500">Last Login</span><span>Today, 10:30 AM</span></div><div className="flex justify-between border-b border-default-100 pb-2"><span className="text-default-500">Device</span><span>iPhone 14 Pro</span></div></div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Add Remark Drawer */}
      <Drawer isOpen={isRemarkOpen} onOpenChange={setIsRemarkOpen} placement="right" size="sm" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Add Remark</h3></DrawerHeader>
              <DrawerBody className="p-6 space-y-6">
                <Select label="Remark Type" placeholder="Select type" variant="bordered">
                  <SelectItem key="academic">Academic</SelectItem>
                  <SelectItem key="behavioral">Behavioral</SelectItem>
                  <SelectItem key="achievement">Achievement</SelectItem>
                </Select>
                <Input label="Title" placeholder="e.g. Excellent Performance" variant="bordered" />
                <Textarea label="Description" placeholder="Enter detailed remark..." minRows={4} variant="bordered" />
                <Checkbox defaultSelected>Visible to Parent</Checkbox>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={onClose}>Save Remark</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Regularize Attendance Drawer */}
      <Drawer isOpen={isRegularizeOpen} onOpenChange={setIsRegularizeOpen} placement="right" size="md" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100"><h3 className="text-lg font-semibold">Regularize Attendance</h3></DrawerHeader>
              <DrawerBody className="p-0">
                <div className="p-6 bg-warning-50/50 border-b border-warning-100">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-warning-600" size={24} />
                    <div>
                      <h4 className="font-semibold text-warning-900">Unaccounted Absences</h4>
                      <p className="text-sm text-warning-700">Select days to mark as present or add reason.</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {["Oct 12, 2024", "Oct 15, 2024", "Oct 18, 2024"].map((date, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-default-200 rounded-xl">
                      <div className="flex items-center gap-4">
                        <Checkbox />
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-default-100 rounded-lg text-default-500"><CalendarCheck size={20} /></div>
                          <span className="font-medium text-default-900">{date}</span>
                        </div>
                      </div>
                      <Select size="sm" placeholder="Select Reason" className="w-40" variant="bordered">
                        <SelectItem key="sick">Sick Leave</SelectItem>
                        <SelectItem key="personal">Personal</SelectItem>
                        <SelectItem key="official">Official Duty</SelectItem>
                      </Select>
                    </div>
                  ))}
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={onClose}>Update Attendance</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer >

      {/* Exam Details Drawer */}
      < Drawer isOpen={isExamConfigOpen} onOpenChange={setIsExamConfigOpen} placement="right" size="md" classNames={{ base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]" }}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary"><FileText size={20} /></div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedExam?.name || "Exam Details"}</h3>
                    <p className="text-xs text-default-500">{selectedExam?.date}</p>
                  </div>
                </div>
              </DrawerHeader>
              <DrawerBody className="p-0">
                <div className="p-6 grid grid-cols-2 gap-4 bg-default-50 border-b border-default-200">
                  <div className="p-4 bg-white rounded-xl border border-default-200 text-center">
                    <span className="text-xs text-default-500 uppercase">Total Score</span>
                    <div className="text-2xl font-bold text-default-900 mt-1">{selectedExam?.score || "-"}</div>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-default-200 text-center">
                    <span className="text-xs text-default-500 uppercase">Rank</span>
                    <div className="text-2xl font-bold text-primary mt-1">#5</div>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold text-default-900 mb-4">Subject-wise Performance</h4>
                  <div className="space-y-4">
                    {[{ sub: "Mathematics", score: 88 }, { sub: "Science", score: 92 }, { sub: "English", score: 85 }].map((s, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-32 font-medium text-sm">{s.sub}</div>
                        <Progress value={s.score} color={s.score > 90 ? "success" : "primary"} size="sm" className="max-w-xs" />
                        <div className="font-semibold text-sm">{s.score}/100</div>
                      </div>
                    ))}
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button variant="light" onPress={onClose}>Close</Button>
                <Button color="primary" startContent={<Download size={16} />}>Download Report</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger-50 rounded-lg">
                    <AlertTriangle size={24} className="text-danger" />
                  </div>
                  <span>Delete Student</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-default-600">
                  Are you sure you want to delete <span className="font-semibold text-default-900">{student?.name}</span>?
                </p>
                <p className="text-sm text-danger mt-2">
                  This action cannot be undone. All student data including attendance, fees, and academic records will be permanently removed.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    try {
                      await deleteStudent(id);
                      toast.success(`${student.name} has been deleted`);
                      onClose();
                      navigate('/students');
                    } catch (error) {
                      toast.error('Failed to delete student');
                    }
                  }}
                  startContent={<Trash2 size={16} />}
                >
                  Delete Student
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <UnifiedUploadProgress
        uploads={activeUploads}
        onClose={() => setActiveUploads([])}
      />

    </div>
  );
}


function AtomIcon({ size, ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="1" />
      <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
      <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
    </svg>
  )
}

function InfoItem({ label, value, className }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">{label}</span>
      <span className="text-base font-medium text-default-900">{value || "-"}</span>
    </div>
  );
}

