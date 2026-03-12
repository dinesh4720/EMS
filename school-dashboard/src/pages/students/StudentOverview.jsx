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
  FileOutput, BarChart3, BarChart4, LineChart, TrendingUp as TrendingIcon, Trash2, Activity, MoreVertical, ChevronRight, Droplets, Shield, Search, Filter, Send
}
  from "lucide-react";
import { format } from "date-fns";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import AddStudent from "./AddStudent";
import TCGeneratorModal from "./TCGeneratorModal";
import { useApp } from "../../context/AppContext";
import { uploadApi, classesApi } from "../../services/api";
import { UnifiedUploadProgress } from "../../components/FileUploadProgress";
import toast from "react-hot-toast";
// Import extracted components
import StudentProfileHeader from "./components/StudentProfileHeader";
import StudentFeeSummary from "./components/StudentFeeSummary";
import StudentDocuments from "./components/StudentDocuments";
import StudentRemarks from "./components/StudentRemarks";
import StudentResults from "./components/StudentResults";
import StudentAcademics from "./components/StudentAcademics";
import StudentRatingSystem from "./components/StudentRatingSystem";
import InvoicePrintModal from "./components/InvoicePrintModal";

const genderOptions = ["Male", "Female", "Other"];
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const feeStatusOptions = ["paid", "pending", "overdue", "partial"];
// Helper function to calculate next class for automatic promotion
const getNextClass = (currentClass, availableClasses) => {
    // Handle special cases
    if (!currentClass || currentClass === "Alumni" || currentClass === "Passed Out / Alumni") {
        return null;
    }

    // Handle Nursery/KG levels
    const preschoolMap = {
        "Nursery": "KG",
        "KG": "1",
        "LKG": "UKG",
        "UKG": "1"
    };

    // Check if it's a preschool level
    for (const [from, to] of Object.entries(preschoolMap)) {
        if (currentClass.startsWith(from)) {
            // Extract section if present
            const sectionMatch = currentClass.match(/-[A-Z]$/i);
            const section = sectionMatch ? sectionMatch[0] : "";
            return `${to}${section}`;
        }
    }

    // Extract class number and section (e.g., "9-A" → class: 9, section: "A")
    const match = currentClass.match(/^(\d+)-([A-Z])$/i);
    if (!match) {
        // Try without section (e.g., "9")
        const numMatch = currentClass.match(/^(\d+)$/);
        if (!numMatch) return null;

        const currentGrade = parseInt(numMatch[1]);
        if (currentGrade >= 10) return "Passed Out / Alumni";
        return `${currentGrade + 1}`;
    }

    const currentGrade = parseInt(match[1]);
    const section = match[2];

    // If already in 10th grade, promote to alumni
    if (currentGrade >= 10) return "Passed Out / Alumni";

    // Otherwise, promote to next grade with same section
    const nextClass = `${currentGrade + 1}-${section}`;

    // Check if the next class exists in available classes
    if (availableClasses && availableClasses.length > 0) {
        const classExists = availableClasses.some(c => c === nextClass || c.startsWith(`${currentGrade + 1}-`));
        if (!classExists) {
            // If exact section doesn't exist, try to find any section of next grade
            const anyNextGrade = availableClasses.find(c => c.startsWith(`${currentGrade + 1}-`));
            if (anyNextGrade) return anyNextGrade;
        }
    }

    return nextClass;
};

// Helper function to get auth token (same as api.js)
const getAuthToken = () => {
  const storedUser = sessionStorage.getItem('app_user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      return userData.token;
    } catch (err) {
      console.error('Failed to parse user data:', err);
      return null;
    }
  }
  return null;
};

export default function StudentOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudentById, classesWithTeachers, staff, updateStudent, updateStudentLocal, deleteStudent, loading, currentAcademicYear } = useApp();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isFeeStatusOpen, setIsFeeStatusOpen] = useState(false);
  const [isParentAppOpen, setIsParentAppOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Documents state
  const documentInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);

  // Remarks state
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [remarksCategoryFilter, setRemarksCategoryFilter] = useState('all');
  const [isRemarkOpen, setIsRemarkOpen] = useState(false);

  // Exam results state
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Fetch remarks when tab changes or filter changes
  useEffect(() => {
    const fetchRemarks = async () => {
      if (activeTab === 'remarks') {
        setRemarksLoading(true);
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const token = getAuthToken();
          const response = await fetch(`${API_URL}/students/${id}/remarks?category=${remarksCategoryFilter}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setRemarks(data);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response:', errorData);
          }
        } catch (error) {
          console.error('Error fetching remarks:', error);
        } finally {
          setRemarksLoading(false);
        }
      }
    };

    fetchRemarks();
  }, [activeTab, remarksCategoryFilter, id]);

  // Fetch exam results when academics tab is active
  useEffect(() => {
    const fetchResults = async () => {
      if (activeTab === 'academics') {
        setResultsLoading(true);
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const token = getAuthToken();
          const response = await fetch(`${API_URL}/students/${id}/results`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setResults(data);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response:', errorData);
          }
        } catch (error) {
          console.error('Error fetching results:', error);
        } finally {
          setResultsLoading(false);
        }
      }
    };

    fetchResults();
  }, [activeTab, id]);

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
            const token = getAuthToken();
            const headers = {
              'Content-Type': 'application/json',
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            const response2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/documents`, {
              method: 'POST',
              headers,
              body: JSON.stringify(newDoc)
            });

            if (!response2.ok) {
              const error = await response2.json();
              throw new Error(error.error || 'Failed to save document');
            }

            const result = await response2.json();

            // Update local state with all documents from server
            setDocuments(result.documents || []);

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
    // Find the index of the document to delete
    // Handle both doc.id and fallback doc-{index} format
    let docIndex = documents.findIndex(d => d.id === docId);

    // If not found by id, try to extract index from doc-{index} format
    if (docIndex === -1 && docId.startsWith('doc-')) {
      docIndex = parseInt(docId.replace('doc-', ''));
    }

    if (docIndex === -1 || docIndex >= documents.length) {
      console.error('🗑️ Document not found or invalid index');
      toast.error("Document not found");
      return;
    }

    const loadingToast = toast.loading("Deleting document...");

    try {
      const deleteUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/documents/${docIndex}`;

      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call the backend DELETE endpoint with the document index
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('🗑️ DELETE error response:', error);
        throw new Error(error.error || 'Failed to delete document');
      }

      const result = await response.json();

      // Update local state with the documents array from server
      setDocuments(result.documents || []);
      toast.success("Document deleted successfully", { id: loadingToast });
    } catch (error) {
      console.error("🗑️ Delete error:", error);
      toast.error("Failed to delete document: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handleCleanupCorruptedDocuments = async () => {
    const loadingToast = toast.loading("Fixing documents...");

    try {
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call the fix-documents endpoint which removes corrupted docs and adds IDs
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}/fix-documents`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fix documents');
      }

      const result = await response.json();

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

        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Update student photo using direct MongoDB update
        const response2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}`, {
          method: 'PUT',
          headers,
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
            city: student.city || "",
            state: student.state || "",
            zipCode: student.zipCode || "",
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

        // No need to reload - the photoPreview state will update the UI
      } catch (error) {
        console.error("Photo upload error:", error);
        toast.error("Photo upload failed: " + (error.message || "Unknown error"), { id: loadingToast });
      } finally {
        e.target.value = null;
      }
    }
  };

  const student = getStudentById(id);
  const [selectedExam, setSelectedExam] = useState(null);
  
  // Fee structure state
  const [studentFeeStructure, setStudentFeeStructure] = useState(null);
  const [loadingFeeStructure, setLoadingFeeStructure] = useState(false);
  
  // Payment history state
  const [feeHistory, setFeeHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  
  // Fetch student fee structure
  const fetchFeeStructure = async () => {
    if (!id) return;

    try {
      setLoadingFeeStructure(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/student-fees/student/${id}?academicYear=${currentAcademicYear}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setStudentFeeStructure(data);
      } else if (response.status === 404) {
        // No fee structure yet, initialize it
        const initHeaders = { 'Content-Type': 'application/json' };
        if (token) {
          initHeaders['Authorization'] = `Bearer ${token}`;
        }
        const initResponse = await fetch(`${API_URL}/student-fees/initialize/${id}`, {
          method: 'POST',
          headers: initHeaders,
          body: JSON.stringify({ academicYear: student?.academicYear || currentAcademicYear })
        });

        if (initResponse.ok) {
          const data = await initResponse.json();
          setStudentFeeStructure(data);
        }
      }
    } catch (error) {
      console.error('❌ [StudentOverview] Error fetching fee structure:', error);
    } finally {
      setLoadingFeeStructure(false);
    }
  };
  
  // Fetch payment history from database
  const fetchPaymentHistory = async () => {
    if (!id) return;

    try {
      setLoadingPaymentHistory(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/fees/payments?studentId=${id}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setFeeHistory(data);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoadingPaymentHistory(false);
    }
  };
  
  useEffect(() => {
    fetchFeeStructure();
    fetchPaymentHistory();
  }, [id]);

  // Fetch fresh student data on mount to get latest documents
  useEffect(() => {
    const fetchFreshStudentData = async () => {
      try {
        const token = getAuthToken();
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${id}`, { headers });
        if (response.ok) {
          const freshStudent = await response.json();
          if (freshStudent.documents) {
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
      setDocuments(student.documents);
    }
  }, [student, documents.length]);

  const [editForm, setEditForm] = useState({});
  const [paymentForm, setPaymentForm] = useState({ 
    amount: "", 
    paymentMode: "cash", 
    date: new Date().toISOString().split('T')[0] 
  });
  const [complaintForm, setComplaintForm] = useState({ subject: "", description: "" });
  const [remarkForm, setRemarkForm] = useState({
    type: "",
    customType: "",
    title: "",
    description: "",
    sendToParent: false
  });

  // Fee reminder modal state
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderSending, setReminderSending] = useState(false);

  // New States
  const [isExamConfigOpen, setIsExamConfigOpen] = useState(false);
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // New Actions State
  const { isOpen: isTcOpen, onOpen: onTcOpen, onClose: onTcClose } = useDisclosure();
  const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
  const { isOpen: isProgressOpen, onOpen: onProgressOpen, onClose: onProgressClose } = useDisclosure();

  const [promoteToClass, setPromoteToClass] = useState("");

  const handlePromoteStudent = async () => {
    if (!student?.class) {
      toast.error("Unable to determine current class");
      return;
    }

    // Auto-calculate next class
    const nextClass = getNextClass(student.class, availableClasses);

    if (!nextClass) {
      toast.error("Unable to calculate next class. Please update class manually.");
      return;
    }

    // If it's alumni promotion, confirm with the user
    if (nextClass === "Passed Out / Alumni") {
      if (!confirm(`${student.name} will be marked as "Passed Out / Alumni". Continue?`)) {
        return;
      }
    }

    try {
      const loadingToast = toast.loading(`Promoting ${student.name} to ${nextClass}...`);

      if (nextClass === "Passed Out / Alumni") {
        await updateStudent(student.id, { class: "Passed Out" });
      } else {
        // Parse the class name to find classId
        const classMatch = nextClass.match(/^(\d+)(?:-([A-Z]))?$/i);
        let classId = null;

        if (classMatch) {
          const grade = classMatch[1];
          const section = classMatch[2] || '';

          // Find the class in the classes array
          const targetClass = (classesWithTeachers || []).find(c =>
            String(c.name) === String(grade) &&
            (c.section || '') === String(section)
          );

          if (targetClass) {
            classId = targetClass._id || targetClass.id;
          }
        }

        if (classId) {
          // Check if we need to update roll number to avoid conflicts
          let updateData = { classId, class: nextClass };

          // Get students from context to check for roll number conflicts
          // Note: In StudentOverview, we don't have direct access to all students,
          // so we'll rely on the API to handle conflicts gracefully
          // If there's a conflict, we'll catch the error and get next roll number

          try {
            // Try to promote with current roll number first
            await updateStudent(student.id, updateData);
          } catch (error) {
            // If there's a conflict error, get next roll number and retry
            if (error.message && (error.message.includes('duplicate key') || error.message.includes('E11000'))) {
              try {
                // Get next available roll number for the target class
                const nextRollNoResponse = await classesApi.getNextRollNumber(classId);
                const nextRollNo = nextRollNoResponse?.rollNumber || nextRollNoResponse?.rollNo;

                if (nextRollNo) {
                  updateData.rollNo = nextRollNo;
                  await updateStudent(student.id, updateData);
                } else {
                  console.warn(`⚠️ Could not get next roll number for class ${nextClass}`);
                  throw error;
                }
              } catch (retryError) {
                console.error(`❌ Error getting next roll number or retrying promotion:`, retryError);
                throw retryError;
              }
            } else {
              throw error;
            }
          }
        } else {
          // Fallback: try with just class name
          await updateStudent(student.id, { class: nextClass });
        }
      }

      toast.success(`${student.name} promoted to ${nextClass}`, { id: loadingToast });
      onPromoteClose();
      // optionally refresh or navigate
    } catch (e) {
      toast.error("Failed to promote student: " + (e.message || "Unknown error"));
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
        academicYear: student.academicYear || currentAcademicYear,
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
        // Contact
        mobile: student.phone || "",
        email: student.email || "",
        address: student.address || "",
        // Parents
        parentName: student.parentName || "",
        parentPhone: student.parentPhone || "",
        parentEmail: student.parentEmail || "",
        parents: student.parents || [],
        // Siblings
        siblings: student.siblings || [],
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

    // Handle photo upload
    if (editForm.picture) {
      if (editForm.picture instanceof File) {
        // If it's a File object, upload it
        const loadingToast = toast.loading("Uploading photo...");
        try {
          const response = await uploadApi.uploadFile(editForm.picture);
          photoUrl = response.url;
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
            // Convert base64 to blob
            const response = await fetch(editForm.picture);
            const blob = await response.blob();
            const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });

            // Upload to Cloudinary
            const uploadResponse = await uploadApi.uploadFile(file);
            photoUrl = uploadResponse.url;
            toast.success("Photo uploaded", { id: loadingToast });
          } catch (error) {
            toast.error("Photo upload failed", { id: loadingToast });
            console.error("Photo upload error:", error);
          }
        } else if (editForm.picture.startsWith('http')) {
          // If it's already a URL, use it
          photoUrl = editForm.picture;
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

    await updateStudent(id, updatedData);
    setIsEditOpen(false);

    // No need to reload - the updateStudent function will refresh the context
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || !paymentForm.paymentMode) {
      toast.error("Please enter amount and select payment method");
      return;
    }

    const paymentAmount = parseInt(paymentForm.amount);
    if (paymentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if student has a fee structure
    if (!studentFeeStructure || !studentFeeStructure.feeHeads || studentFeeStructure.feeHeads.length === 0) {
      toast.error("No fee structure found for this student. Please initialize fee structure first.");
      return;
    }

    const loadingToast = toast.loading("Recording payment...");

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();

      // 1. Distribute payment across pending fee heads (FIFO - First In First Out)
      const feeHeadPayments = [];
      let remainingAmount = paymentAmount;

      for (const feeHead of studentFeeStructure.feeHeads) {
        if (remainingAmount <= 0) break;

        const balance = feeHead.balanceAmount || 0;
        if (balance > 0) {
          const paymentForThisHead = Math.min(remainingAmount, balance);

          // Extract feeHeadId - handle both populated (object) and unpopulated (string) cases
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

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 2. Update StudentFeeStructure via backend API (primary operation)
      const feeStructureResponse = await fetch(`${API_URL}/student-fees/student/${id}/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: paymentAmount,
          feeHeadPayments,
          academicYear: studentFeeStructure.academicYear || currentAcademicYear
        })
      });

      if (!feeStructureResponse.ok) {
        const errorData = await feeStructureResponse.json();
        console.error('❌ Payment API error:', errorData);
        throw new Error(errorData.error || 'Failed to update fee structure');
      }

      const updatedStructure = await feeStructureResponse.json();

      // 3. Try to create payment record (secondary, non-blocking)
      try {
        const paymentData = {
          studentId: id,
          studentName: student?.name || '',
          classId: student?.classId,
          academicYear: studentFeeStructure.academicYear || currentAcademicYear,
          paymentDate: paymentForm.date,
          amount: paymentAmount,
          paymentMode: paymentForm.paymentMode,
          feeHeads: feeHeadPayments.map(fp => ({
            period: new Date(paymentForm.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            amount: fp.amount
          })),
          remarks: `Fee payment via ${paymentForm.paymentMode}`,
          receiptNumber: `RCP-${Date.now()}`
        };

        await fetch(`${API_URL}/fees/payments`, {
          method: 'POST',
          headers,
          body: JSON.stringify(paymentData)
        });
      } catch (paymentRecordError) {
        // Non-critical error - payment structure is already updated
        console.warn('⚠️ Could not create payment record:', paymentRecordError);
      }

      // 4. Refresh fee structure and payment history
      await Promise.all([fetchFeeStructure(), fetchPaymentHistory()]);

      toast.success("Payment recorded successfully", { id: loadingToast });
      setIsPaymentOpen(false);
      setPaymentForm({
        amount: "",
        paymentMode: "cash",
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error("Failed to record payment: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handleSaveRemark = async () => {
    // Validate form
    if (!remarkForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!remarkForm.type && !remarkForm.customType.trim()) {
      toast.error("Please select or enter a remark type");
      return;
    }
    if (!remarkForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();

      const remarkData = {
        title: remarkForm.title.trim(),
        description: remarkForm.description.trim(),
        category: remarkForm.customType.trim() || remarkForm.type,
        sentToParent: remarkForm.sendToParent
      };

      const response = await fetch(`${API_URL}/students/${id}/remarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(remarkData)
      });

      if (response.ok) {
        const savedRemark = await response.json();

        // Add to local state
        setRemarks([savedRemark, ...remarks]);

        // Show success message
        if (remarkForm.sendToParent) {
          toast.success(`Remark added and sent to ${student.parentName || 'parent'}`);
        } else {
          toast.success("Remark added successfully");
        }

        // Reset form and close drawer
        setRemarkForm({
          type: "",
          customType: "",
          title: "",
          description: "",
          sendToParent: false
        });
        setIsRemarkOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error saving remark:", errorData);
        toast.error(errorData.error || "Failed to save remark");
      }
    } catch (error) {
      console.error("Error saving remark:", error);
      toast.error("Failed to save remark");
    }
  };

  const handleRatingChange = async (ratings) => {
    try {
      const loadingToast = toast.loading("Saving ratings...");

      // Add lastUpdated timestamp to each dimension
      const ratingsWithTimestamp = {};
      Object.keys(ratings).forEach(key => {
        ratingsWithTimestamp[key] = {
          ...ratings[key],
          lastUpdated: new Date().toISOString()
        };
      });

      await updateStudent(student.id, { ratings: ratingsWithTimestamp });

      toast.success("Ratings saved successfully", { id: loadingToast });
    } catch (error) {
      console.error("Error saving ratings:", error);
      toast.error("Failed to save ratings: " + (error.message || "Unknown error"));
    }
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

  // Real attendance data state
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Fetch real attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!id) return;
      
      setAttendanceLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = getAuthToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Get attendance for current year
        const year = new Date().getFullYear();
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        
        const response = await fetch(`${API_URL}/attendance/student/${id}?start=${startDate}&end=${endDate}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setAttendanceData(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setAttendanceData([]);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [id]);

  // Calculate real attendance stats
  const attendanceStats = useMemo(() => {
    if (!attendanceData.length) {
      return { present: 0, absent: 0, total: 0, percentage: 0 };
    }
    
    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.status === 'present').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { present, absent, total, percentage };
  }, [attendanceData]);

  // Calculate monthly attendance for chart
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

  // Compute student fee summary
  const studentFeeSummary = useMemo(() => {
    if (!feeHistory || feeHistory.length === 0) {
      return {
        totalFee: 0,
        totalPaid: 0,
        totalPending: 0,
        totalDiscount: 0,
        nextDueDate: null,
        collectionMode: 'term',
        pendingDuesByPeriod: {},
        feeHeads: []
      };
    }

    const totalPaid = feeHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalFee = 50000; // Mock total annual fee
    const totalPending = totalFee - totalPaid;
    const totalDiscount = 0;

    return {
      totalFee,
      totalPaid,
      totalPending,
      totalDiscount,
      nextDueDate: totalPending > 0 ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() : null,
      collectionMode: 'term',
      pendingDuesByPeriod: {},
      feeHeads: []
    };
  }, [feeHistory]);

  // Helper functions for fee actions
  const handleSendReminder = () => {
    // Generate message based on fee status
    const hasOutstanding = (studentFeeStructure?.totalBalance || 0) > 0;
    const schoolName = "Your School"; // TODO: Get from config/settings

    let defaultMessage = "";
    if (hasOutstanding) {
      defaultMessage = `Dear ${student.parentName || 'Parent'}, this is a reminder that fee payment of ₹${studentFeeStructure?.totalBalance?.toLocaleString() || 0} is pending for ${student.name}. Please pay at your earliest convenience. - ${schoolName}`;
    } else {
      defaultMessage = `Dear ${student.parentName || 'Parent'}, thank you for the fee payment of ₹${studentFeeStructure?.totalPaid?.toLocaleString() || 0} for ${student.name}. - ${schoolName}`;
    }

    setReminderMessage(defaultMessage);
    setIsReminderModalOpen(true);
  };

  const handleSendReminderMessage = async () => {
    if (!reminderMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setReminderSending(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call API to send SMS/Email
      const response = await fetch(`${API_URL}/students/${id}/send-reminder`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: reminderMessage,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          studentName: student.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      toast.success(`Reminder sent to ${student.parentName || 'parent'}`);
      setIsReminderModalOpen(false);
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder: ' + (error.message || 'Unknown error'));
    } finally {
      setReminderSending(false);
    }
  };

  const handleDownloadInvoice = () => {
    setIsInvoiceOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-default-500">Loading profile...</div>;
  if (!student) return <div className="p-8 text-center text-default-500">Student not found</div>;

  const awardIcon = Award;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in p-6 lg:p-8 pb-12">
      <div className="max-w-[1600px] mx-auto space-y-6">

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
            <Tab key="attendance" title="Attendance" />
            <Tab key="academics" title="Academics" />
            <Tab key="fees" title="Fees" />
            <Tab key="documents" title="Documents" />
            <Tab key="remarks" title="Remarks" />
            <Tab key="ratings" title="Ratings" />
          </Tabs>

          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              {/* KPI Cards Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-default-900">Overview</h3>
                  <span className="text-sm text-default-500">Last updated today</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Academic Performance Card */}
                  <Card
                    isPressable
                    onPress={() => setActiveTab("academics")}
                    shadow="sm"
                    className="border border-default-200 bg-background/60 backdrop-blur-md cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                          <Award size={24} />
                        </div>
                        <Chip
                          size="sm"
                          color={
                            results?.length > 0
                              ? (() => {
                                  const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
                                                                  if (avgPercentage >= 90) return "success";
                                                                  if (avgPercentage >= 75) return "primary";
                                                                  if (avgPercentage >= 60) return "warning";
                                                                  return "danger";
                                                                })()
                              : "default"
                          }
                          variant="flat"
                          className="text-xs font-semibold"
                        >
                          {results?.length > 0
                            ? (() => {
                                const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
                                if (avgPercentage >= 90) return "Very Good";
                                if (avgPercentage >= 75) return "Good";
                                if (avgPercentage >= 60) return "Needs Improvement";
                                if (avgPercentage >= 40) return "Poor";
                                return "Supervision Needed";
                              })()
                            : "No Data"}
                        </Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-2xl font-semibold text-default-900">
                          {results?.length > 0
                            ? `${Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)}%`
                            : "N/A"}
                        </h4>
                        <p className="text-sm font-medium text-default-500">Average Academic Percentage</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 space-y-2">
                        <div className="flex items-center gap-3 text-xs text-default-500">
                          <span className="font-medium">Exams Taken:</span>
                          <span className="font-bold text-default-700">{results?.length || 0}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-default-400">Click to view details</span>
                        <span
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary hover:bg-primary-100 cursor-pointer transition-colors flex items-center gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success("Downloading academic report...");
                          }}
                        >
                          <Download size={14} />
                          Download
                        </span>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Attendance Card */}
                  <Card
                    isPressable
                    onPress={() => setActiveTab("attendance")}
                    shadow="sm"
                    className="border border-default-200 bg-background/60 backdrop-blur-md cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                          <Clock size={24} />
                        </div>
                        <Chip size="sm" color={attendanceStats.percentage >= 90 ? "success" : attendanceStats.percentage >= 75 ? "primary" : "warning"} variant="flat" className="text-xs font-semibold">
                          Expected: 90%
                        </Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-2xl font-semibold text-default-900">{attendanceStats.percentage}%</h4>
                        <p className="text-sm font-medium text-default-500">Average Attendance</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 space-y-2">
                        <div className="flex items-center gap-3 text-xs text-default-500">
                          <span className="font-medium">Present Days:</span>
                          <span className="font-bold text-default-700">{attendanceStats.present}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-red-500">
                          <span className="font-medium">Absent Days:</span>
                          <span className="font-bold">{attendanceStats.absent}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-default-400">Click to view details</span>
                        <span
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary hover:bg-primary-100 cursor-pointer transition-colors flex items-center gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success("Downloading attendance report...");
                          }}
                        >
                          <Download size={14} />
                          Download
                        </span>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Fee Status Card */}
                  <Card
                    isPressable
                    onPress={() => setActiveTab("fees")}
                    shadow="sm"
                    className="border border-default-200 bg-background/60 backdrop-blur-md cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4 w-full">
                        <div className={`p-3 rounded-xl ${(studentFeeStructure?.totalBalance || 0) <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                          <IndianRupee size={24} />
                        </div>
                        <Chip size="sm" color={(studentFeeStructure?.totalBalance || 0) <= 0 ? "success" : "warning"} variant="flat" className="capitalize text-xs font-semibold">
                          {(studentFeeStructure?.totalBalance || 0) <= 0 ? 'Paid' : studentFeeStructure?.overallStatus || 'Pending'}
                        </Chip>
                      </div>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-2xl font-semibold text-default-900">
                            ₹{(studentFeeStructure?.totalBalance || 0) <= 0 ? studentFeeStructure?.totalPaid?.toLocaleString() || 0 : studentFeeStructure?.totalBalance?.toLocaleString() || 0}
                          </h4>
                        </div>
                        <p className="text-sm font-medium text-default-500">
                          {(studentFeeStructure?.totalBalance || 0) <= 0 ? 'Total Fees Paid' : 'Outstanding Amount'}
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-default-100 flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 text-xs text-default-500">
                          {studentFeeStructure?.totalBalance > 0 && (
                            <>
                              <span className="font-medium text-default-600">Total Fee:</span>
                              <span className="font-bold text-default-700">₹{studentFeeStructure?.totalFee?.toLocaleString() || 0}</span>
                            </>
                          )}
                          {(studentFeeStructure?.totalBalance || 0) <= 0 && (
                            <span className="font-medium text-success-600">All fees paid ✓</span>
                          )}
                        </div>
                        {studentFeeStructure?.totalBalance > 0 && (
                          <span
                            className="text-xs font-semibold text-primary hover:text-primary-600 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReminder();
                            }}
                          >
                            Send Reminder
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-default-400">Click to view details</span>
                      </div>
                    </CardBody>
                  </Card>

                </div>
              </div>

              {/* Action Needed Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-default-900">Action Needed</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Low Attendance Alert */}
                  {attendanceStats.percentage < 75 && (
                    <Card
                      isPressable
                      onPress={() => setActiveTab("attendance")}
                      className="border border-warning-200 bg-warning-50/50 cursor-pointer hover:bg-warning-50 transition-colors"
                    >
                      <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-warning-100 text-warning-600 rounded-lg">
                            <AlertTriangle size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-warning-900">Low Attendance</p>
                            <p className="text-xs text-warning-700">
                              Attendance is {attendanceStats.percentage}% (below 75%)
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-warning-600" />
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Pending Fees Alert */}
                  {studentFeeStructure?.totalBalance > 0 && (
                    <Card
                      isPressable
                      onPress={() => setActiveTab("fees")}
                      className="border border-danger-200 bg-danger-50/50 cursor-pointer hover:bg-danger-50 transition-colors"
                    >
                      <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-danger-100 text-danger-600 rounded-lg">
                            <IndianRupee size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-danger-900">Pending Fees</p>
                            <p className="text-xs text-danger-700">
                              ₹{studentFeeStructure.totalBalance.toLocaleString()} outstanding
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-danger-600" />
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Poor Performance Alert */}
                  {results?.length > 0 && (() => {
                    const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
                    if (avgPercentage < 60) {
                      return (
                        <Card
                          isPressable
                          onPress={() => setActiveTab("academics")}
                          className="border border-danger-200 bg-danger-50/50 cursor-pointer hover:bg-danger-50 transition-colors"
                        >
                          <CardBody className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-danger-100 text-danger-600 rounded-lg">
                                <AlertTriangle size={20} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-danger-900">Poor Performance</p>
                                <p className="text-xs text-danger-700">
                                  Average is {Math.round(avgPercentage)}% - needs attention
                                </p>
                              </div>
                              <ChevronRight size={16} className="text-danger-600" />
                            </div>
                          </CardBody>
                        </Card>
                      );
                    }
                    return null;
                  })()}

                  {/* If no actions needed, show positive message */}
                  {attendanceStats.percentage >= 75 &&
                   (!studentFeeStructure?.totalBalance || studentFeeStructure.totalBalance <= 0) &&
                   (!results?.length || results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length >= 60) && (
                    <Card className="border border-success-200 bg-success-50/50">
                      <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-success-100 text-success-600 rounded-lg">
                            <CheckCircle size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-success-900">All Good!</p>
                            <p className="text-xs text-success-700">
                              No immediate actions required
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </div>

              {/* Analytics Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-default-900">Analytics</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Performance Trend Chart */}
                  <Card shadow="sm" className="border border-default-200">
                    <CardHeader className="pb-0 pt-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-default-900">Performance Trend</h4>
                          <p className="text-xs text-default-500">Academic performance over time</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="px-6 py-6">
                      {results?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <RechartsLineChart data={results.map((r, i) => ({
                            name: r.examName || `Exam ${i + 1}`,
                            percentage: r.percentage || 0
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                              }}
                              formatter={(value) => [`${value}%`, "Percentage"]}
                            />
                            <Line
                              type="monotone"
                              dataKey="percentage"
                              stroke="#9333ea"
                              strokeWidth={2}
                              dot={{ fill: "#9333ea", r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center text-default-400 text-sm">
                          No exam data available
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* Subject-wise Performance Chart */}
                  <Card shadow="sm" className="border border-default-200">
                    <CardHeader className="pb-0 pt-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <BarChart3 size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-default-900">Subject-wise Performance</h4>
                          <p className="text-xs text-default-500">Latest exam results by subject</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="px-6 py-6">
                      {results?.length > 0 && results[0]?.subjects ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={results[0].subjects.map(s => ({
                            name: s.name,
                            marks: s.marks || 0
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                              }}
                              formatter={(value) => [`${value}`, "Marks"]}
                            />
                            <Bar dataKey="marks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center text-default-400 text-sm">
                          No subject data available
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* Attendance Trend Chart */}
                  <Card shadow="sm" className="border border-default-200 lg:col-span-2">
                    <CardHeader className="pb-0 pt-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                          <LineChart size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-default-900">Attendance Trend</h4>
                          <p className="text-xs text-default-500">Monthly attendance overview</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="px-6 py-6">
                      {attendanceLoading ? (
                        <div className="h-[180px] flex items-center justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-default-300 border-t-primary rounded-full" />
                        </div>
                      ) : attendanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <RechartsLineChart data={monthlyAttendanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                            }}
                            formatter={(value) => [`${value}%`, "Attendance"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="attendance"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ fill: "#22c55e", r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                      ) : (
                        <div className="h-[180px] flex items-center justify-center text-default-400 text-sm">
                          No attendance data available. Data will appear when teachers mark attendance through the Staff App.
                        </div>
                      )}
                    </CardBody>
                  </Card>

                </div>
              </div>
            </div>
          )}

          {activeTab === "student_info" && (
            <div className="space-y-6 animate-fade-in">
              {/* Academic Information - Moved from Academics Tab */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <GraduationCap size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Academic Information</h3>
                  </div>
                  <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("academic")}><Edit size={16} className="text-default-500" /></Button>
                </CardHeader>
                <CardBody className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem label="Class" value={student.class || "N/A"} />
                  <InfoItem label="Roll Number" value={student.rollNo || "N/A"} />
                  <InfoItem label="Academic Year" value={student.academicYear || currentAcademicYear} />
                  <InfoItem label="Class Teacher" value={classTeacher?.name || "Not Assigned"} />
                </CardBody>
              </Card>

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
                  <InfoItem label="Mother's Name" value={
                    student.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'mother')?.name ||
                    student.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'wife')?.name ||
                    'N/A'
                  } />
                  <InfoItem label="Mother's Occupation" value={
                    student.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'mother')?.occupation ||
                    student.parents && student.parents.find(p => p.relationship?.toLowerCase() === 'wife')?.occupation ||
                    'N/A'
                  } />
                  <InfoItem label="Primary Phone" value={student.parentPhone} />
                  <InfoItem label="Alternate Phone" value={student.alternatePhone} />
                  <InfoItem label="Primary Email" value={student.parentEmail} />
                </CardBody>
              </Card>

              {student.siblings && student.siblings.length > 0 && (
                <Card shadow="none" className="border border-default-200">
                  <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                        <Users size={20} />
                      </div>
                      <h3 className="text-lg font-semibold text-default-900">Sibling Information</h3>
                    </div>
                    <Button isIconOnly size="sm" variant="light" onPress={() => openEditDrawer("siblings")}><Edit size={16} className="text-default-500" /></Button>
                  </CardHeader>
                  <CardBody className="p-8">
                    <div className="space-y-4">
                      {student.siblings.map((sibling, idx) => (
                        <div key={idx} className="p-4 bg-default-50 rounded-lg border border-default-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-default-900">{sibling.name}</span>
                                {!sibling.inSameSchool && (
                                  <Chip size="sm" variant="flat" className="bg-default-200 text-default-600">
                                    Not in this school
                                  </Chip>
                                )}
                              </div>
                              {sibling.inSameSchool && sibling.classId && (
                                <p className="text-sm text-default-500">
                                  Class: {sibling.classId?.name || 'N/A'} {sibling.classId?.section || ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {student.siblings.length === 0 && (
                        <p className="text-sm text-default-400 text-center py-4">No sibling information available</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

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
                  <InfoItem label="Academic Year" value={student.academicYear || currentAcademicYear} />
                  <InfoItem label="Transport Required" value={student.transportRequired ? "Yes" : "No"} />
                  <InfoItem label="Hostel Required" value={student.hostelRequired ? "Yes" : "No"} />
                  <InfoItem label="Medical Conditions" value={student.medicalConditions || "None"} className="col-span-full" />
                  <InfoItem label="Emergency Contact Name" value={student.emergencyContactName || "-"} />
                  <InfoItem label="Emergency Contact Phone" value={student.emergencyContactPhone || "-"} />
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === "documents" && (
            <StudentDocuments
              studentId={id}
              documents={documents}
              activeUploads={activeUploads}
              onDocumentsChange={setDocuments}
              onActiveUploadsChange={setActiveUploads}
            />
          )}

          {activeTab === "fees" && (
            <StudentFeeSummary
              studentFeeStructure={studentFeeStructure}
              feeHistory={feeHistory}
              loadingFeeStructure={loadingFeeStructure}
              onRecordPayment={() => setIsPaymentOpen(true)}
              onSendReminder={handleSendReminder}
              onDownloadInvoice={handleDownloadInvoice}
            />
          )}

          {activeTab === "attendance" && (
            <div className="space-y-6 animate-fade-in">
              {/* Attendance Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl">
                        <Activity size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Average Attendance</p>
                        <p className="text-lg font-bold text-default-900">{attendanceStats.percentage}%</p>
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
                        <p className="text-xs text-default-500">Present Days</p>
                        <p className="text-lg font-bold text-success-600">{attendanceStats.present}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-danger-50 text-danger-600 rounded-xl">
                        <XCircle size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Absent Days</p>
                        <p className="text-lg font-bold text-danger-600">{attendanceStats.absent}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-default-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-default-100 text-default-600 rounded-xl">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Total Days</p>
                        <p className="text-lg font-bold text-default-900">{attendanceStats.total}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Mark Attendance Section */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <CheckCircle size={20} />
                      </div>
                      <h3 className="text-lg font-semibold text-default-900">Mark Today's Attendance</h3>
                    </div>
                    <Input
                      type="date"
                      size="sm"
                      variant="bordered"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-48"
                    />
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      color="success"
                      variant="flat"
                      startContent={<CheckCircle size={18} />}
                      onPress={() => toast.success("Marked as Present")}
                    >
                      Mark Present
                    </Button>
                    <Button
                      color="danger"
                      variant="flat"
                      startContent={<XCircle size={18} />}
                      onPress={() => toast.error("Marked as Absent")}
                    >
                      Mark Absent
                    </Button>
                    <Button
                      color="warning"
                      variant="flat"
                      startContent={<Clock size={18} />}
                      onPress={() => toast("Marked as Half Day", { icon: "⏰" })}
                    >
                      Mark Half Day
                    </Button>
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<Calendar size={18} />}
                      onPress={() => toast("Marked as Leave", { icon: "📅" })}
                    >
                      Mark Leave
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Subject-wise Attendance - Not Available */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Subject-wise Attendance</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="text-center py-8">
                    <BookOpen size={32} className="mx-auto text-default-200 mb-3" />
                    <p className="text-sm text-default-500">Subject-wise attendance tracking is not currently available.</p>
                    <p className="text-xs text-default-400 mt-1">This feature requires per-subject attendance tracking which will be implemented in a future update.</p>
                  </div>
                </CardBody>
              </Card>

              {/* Attendance Calendar & History */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Calendar View */}
                <Card shadow="none" className="border border-default-200">
                  <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                          <Calendar size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-default-900">Monthly Overview</h3>
                      </div>
                      <Select 
                        aria-label="Select month"
                        size="sm" 
                        variant="bordered" 
                        defaultSelectedKeys={["december"]} 
                        className="w-32"
                      >
                        <SelectItem key="december">December</SelectItem>
                        <SelectItem key="november">November</SelectItem>
                        <SelectItem key="october">October</SelectItem>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardBody className="p-6">
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-default-500 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 31 }, (_, i) => {
                        const status = i % 5 === 0 ? 'absent' : i % 7 === 0 ? 'leave' : 'present';
                        return (
                          <Tooltip
                            key={i}
                            content={`${i + 1} Dec - ${status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Leave'}`}
                          >
                            <div
                              className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg cursor-pointer transition-all hover:scale-110 ${
                                status === 'present' ? 'bg-success-100 text-success-700 hover:bg-success-200' :
                                status === 'absent' ? 'bg-danger-100 text-danger-700 hover:bg-danger-200' :
                                'bg-warning-100 text-warning-700 hover:bg-warning-200'
                              }`}
                            >
                              {i + 1}
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-default-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-success-500"></div>
                        <span className="text-xs text-default-600">Present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-danger-500"></div>
                        <span className="text-xs text-default-600">Absent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-warning-500"></div>
                        <span className="text-xs text-default-600">Leave</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Regularize Attendance */}
                <Card shadow="none" className="border border-default-200">
                  <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                        <AlertTriangle size={20} />
                      </div>
                      <h3 className="text-lg font-semibold text-default-900">Regularize Attendance</h3>
                    </div>
                  </CardHeader>
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <p className="text-sm text-default-600">
                        Request to regularize attendance for days marked as absent or missing.
                      </p>
                      
                      {/* Pending Regularization Requests */}
                      <div className="space-y-3">
                        {[
                          { date: "Dec 15, 2024", status: "Pending", reason: "Medical Leave" },
                          { date: "Dec 10, 2024", status: "Approved", reason: "Family Emergency" },
                          { date: "Dec 5, 2024", status: "Rejected", reason: "No valid reason" }
                        ].map((request, idx) => (
                          <div key={idx} className={`p-4 rounded-lg border ${
                            request.status === 'Pending' ? 'border-warning-200 bg-warning-50/30' :
                            request.status === 'Approved' ? 'border-success-200 bg-success-50/30' :
                            'border-danger-200 bg-danger-50/30'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-default-900">{request.date}</span>
                              <Chip
                                size="sm"
                                color={request.status === 'Pending' ? 'warning' : request.status === 'Approved' ? 'success' : 'danger'}
                                variant="flat"
                              >
                                {request.status}
                              </Chip>
                            </div>
                            <p className="text-xs text-default-600">{request.reason}</p>
                          </div>
                        ))}
                      </div>

                      <Button
                        color="primary"
                        variant="flat"
                        fullWidth
                        startContent={<Plus size={18} />}
                        onPress={() => setIsRegularizeOpen(true)}
                      >
                        New Regularization Request
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Send Report to Parent */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                      <Mail size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Send Attendance Report</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-default-600 mb-2">
                        Send a detailed attendance report to the parent via email or SMS.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-default-500">
                        <Mail size={14} />
                        <span>{student.parentEmail || "No email on file"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-default-500 mt-1">
                        <Phone size={14} />
                        <span>{student.parentPhone || "No phone on file"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<Mail size={18} />}
                        onPress={() => toast.success("Attendance report sent via email")}
                      >
                        Send via Email
                      </Button>
                      <Button
                        color="primary"
                        variant="bordered"
                        startContent={<Phone size={18} />}
                        onPress={() => toast.success("Attendance report sent via SMS")}
                      >
                        Send via SMS
                      </Button>
                      <Button
                        color="default"
                        variant="bordered"
                        isIconOnly
                        onPress={() => toast.success("Downloading attendance report...")}
                      >
                        <Download size={18} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Attendance Trends */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Attendance Trends</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-default-300 border-t-primary rounded-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                        <p className="text-xs text-default-600 mb-1">This Month</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {attendanceStats.monthlyTrend?.thisMonth || attendanceStats.percentage}%
                        </p>
                        <p className="text-xs text-default-500 mt-1">Based on actual data</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                        <p className="text-xs text-default-600 mb-1">This Quarter</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {attendanceStats.monthlyTrend?.thisQuarter || attendanceStats.percentage}%
                        </p>
                        <p className="text-xs text-default-500 mt-1">Based on actual data</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                        <p className="text-xs text-default-600 mb-1">This Year</p>
                        <p className="text-2xl font-bold text-green-600">{attendanceStats.percentage}%</p>
                        <p className="text-xs text-default-500 mt-1">Based on {attendanceStats.total} recorded days</p>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

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

          {activeTab === "ratings" && (
            <StudentRatingSystem
              studentId={student?.id}
              ratings={student?.ratings || {}}
              onRatingChange={handleRatingChange}
              editable={true}
            />
          )}



          {activeTab === "academics" && (
            <StudentAcademics
              studentId={student?.id}
              student={student}
              classTeacher={classTeacher}
            />
          )}
        </div>
      </div>



      {/* Edit Drawer */}
      {/* Edit Drawer - Uses AddStudent Component */}
      <Drawer
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        placement="right"
        size="5xl"
        hideCloseButton={true}
        classNames={{
          wrapper: "!z-50",
          base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]",
          backdrop: "!z-40"
        }}
      >
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

      <Modal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)}
        onOpenChange={(open) => {
          if (open && studentFeeStructure?.totalBalance) {
            // Auto-populate with outstanding amount when modal opens
            setPaymentForm(prev => ({ 
              ...prev, 
              amount: studentFeeStructure.totalBalance.toString() 
            }));
          }
        }}
      >
        <ModalContent>
          <ModalHeader>Record Fee Payment</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input 
                label="Amount" 
                type="number" 
                value={paymentForm.amount} 
                onValueChange={(v) => setPaymentForm({ ...paymentForm, amount: v })} 
                startContent="₹" 
                variant="bordered"
                description={`Outstanding: ₹${studentFeeStructure?.totalBalance?.toLocaleString() || 0}`}
                isRequired
              />
              <Select 
                aria-label="Payment method"
                label="Payment Method" 
                placeholder="Select payment method" 
                selectedKeys={[paymentForm.paymentMode]} 
                onSelectionChange={(keys) => setPaymentForm({ ...paymentForm, paymentMode: Array.from(keys)[0] })} 
                variant="bordered"
                isRequired
              >
                <SelectItem key="cash">Cash</SelectItem>
                <SelectItem key="online">Online/UPI</SelectItem>
                <SelectItem key="card">Card</SelectItem>
                <SelectItem key="cheque">Cheque</SelectItem>
                <SelectItem key="bank_transfer">Bank Transfer</SelectItem>
              </Select>
              <Input 
                label="Payment Date" 
                type="date" 
                value={paymentForm.date} 
                onValueChange={(v) => setPaymentForm({ ...paymentForm, date: v })} 
                variant="bordered"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button 
              color="primary" 
              onPress={handleRecordPayment}
              isDisabled={!paymentForm.amount || !paymentForm.paymentMode}
            >
              Record Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* TC Generator Modal */}
      <TCGeneratorModal
        isOpen={isTcOpen}
        onClose={onTcClose}
        students={[student]}
      />

      {/* Fee Invoice Modal */}
      <InvoicePrintModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        student={student}
        studentFeeStructure={studentFeeStructure}
        feeHistory={feeHistory}
      />

      <Modal isOpen={isPromoteOpen} onClose={onPromoteClose}>
        <ModalContent>
          <ModalHeader>Promote Student</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-default-50 rounded-lg">
                <GraduationCap size={24} className="text-primary" />
                <div>
                  <p className="text-sm text-default-500">Student: <span className="font-semibold text-default-900">{student.name}</span></p>
                  <p className="text-sm text-default-500">Current Class: <span className="font-semibold text-default-900">{student.class}</span></p>
                </div>
              </div>

              <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-sm text-success-700 mb-1">
                  <span className="font-semibold">Auto-calculated next class:</span>
                </p>
                <p className="text-lg font-bold text-success-900">
                  {getNextClass(student.class, availableClasses) || "Unable to calculate"}
                </p>
                <p className="text-xs text-success-600 mt-2">
                  Click "Promote" to automatically promote the student to this class
                </p>
              </div>

              {getNextClass(student.class, availableClasses) === "Passed Out / Alumni" && (
                <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <p className="text-xs text-warning-700">
                    <AlertTriangle size={14} className="inline mr-1" />
                    This will mark the student as "Passed Out / Alumni"
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onPromoteClose}>Cancel</Button>
            <Button color="primary" onPress={handlePromoteStudent}>
              <GraduationCap size={16} className="mr-1" />
              Promote
            </Button>
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
      <Drawer 
        isOpen={isAttendanceOpen} 
        onOpenChange={setIsAttendanceOpen} 
        placement="right" 
        size="sm" 
        classNames={{ 
          wrapper: "!z-50", 
          base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]",
          backdrop: "!z-40"
        }}
      >
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

      <Drawer 
        isOpen={isFeeStatusOpen} 
        onOpenChange={setIsFeeStatusOpen} 
        placement="right" 
        size="sm" 
        classNames={{ 
          wrapper: "!z-50", 
          base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]",
          backdrop: "!z-40"
        }}
      >
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

      <Drawer 
        isOpen={isParentAppOpen} 
        onOpenChange={setIsParentAppOpen} 
        placement="right" 
        size="sm" 
        classNames={{ 
          wrapper: "!z-50", 
          base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]",
          backdrop: "!z-40"
        }}
      >
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
      <Drawer 
        isOpen={isRemarkOpen} 
        onOpenChange={setIsRemarkOpen} 
        placement="right" 
        size="md" 
        classNames={{ 
          wrapper: "!z-50", 
          base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]",
          backdrop: "!z-40"
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="border-b border-default-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <MessageSquare size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Add Remark</h3>
                    <p className="text-xs text-default-500">Add a note or observation about the student</p>
                  </div>
                </div>
              </DrawerHeader>
              <DrawerBody className="p-6 space-y-6">
                {/* Remark Type - Dropdown with Custom Option */}
                <div className="space-y-2">
                  <Select 
                    aria-label="Remark type"
                    label="Remark Type" 
                    placeholder="Select type or enter custom" 
                    variant="bordered"
                    selectedKeys={remarkForm.type ? [remarkForm.type] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      setRemarkForm({ ...remarkForm, type: selected, customType: "" });
                    }}
                  >
                    <SelectItem key="academic">Academic</SelectItem>
                    <SelectItem key="behavioral">Behavioral</SelectItem>
                    <SelectItem key="achievement">Achievement</SelectItem>
                    <SelectItem key="attendance">Attendance</SelectItem>
                    <SelectItem key="health">Health</SelectItem>
                    <SelectItem key="general">General</SelectItem>
                    <SelectItem key="custom">Custom Type...</SelectItem>
                  </Select>
                  
                  {/* Show custom type input when "custom" is selected */}
                  {remarkForm.type === "custom" && (
                    <Input
                      label="Custom Type"
                      placeholder="Enter custom remark type"
                      variant="bordered"
                      value={remarkForm.customType}
                      onChange={(e) => setRemarkForm({ ...remarkForm, customType: e.target.value })}
                      maxLength={30}
                      description={`${remarkForm.customType.length}/30 characters`}
                    />
                  )}
                </div>

                {/* Title with Character Limit */}
                <Input 
                  label="Title" 
                  placeholder="e.g. Excellent Performance in Mathematics" 
                  variant="bordered"
                  value={remarkForm.title}
                  onChange={(e) => setRemarkForm({ ...remarkForm, title: e.target.value })}
                  maxLength={100}
                  description={`${remarkForm.title.length}/100 characters`}
                  isRequired
                />

                {/* Description */}
                <Textarea 
                  label="Description" 
                  placeholder="Enter detailed remark or observation..." 
                  minRows={5}
                  variant="bordered"
                  value={remarkForm.description}
                  onChange={(e) => setRemarkForm({ ...remarkForm, description: e.target.value })}
                  maxLength={500}
                  description={`${remarkForm.description.length}/500 characters`}
                  isRequired
                />

                {/* Send to Parent */}
                <div className="p-4 rounded-lg border border-default-200 bg-default-50">
                  <Checkbox size="sm" 
                    isSelected={remarkForm.sendToParent}
                    onValueChange={(checked) => setRemarkForm({ ...remarkForm, sendToParent: checked })}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-default-900">Send to Parent</span>
                      <span className="text-xs text-default-500">
                        {remarkForm.sendToParent 
                          ? `Will be sent to ${student.parentEmail || student.parentPhone || 'parent'}`
                          : 'Remark will only be visible to staff'
                        }
                      </span>
                    </div>
                  </Checkbox>
                </div>

                {/* Preview */}
                {(remarkForm.title || remarkForm.description) && (
                  <div className="p-4 rounded-lg border border-primary-200 bg-primary-50/30">
                    <p className="text-xs font-semibold text-primary-600 uppercase mb-2">Preview</p>
                    {remarkForm.title && (
                      <h4 className="font-semibold text-default-900 mb-1">{remarkForm.title}</h4>
                    )}
                    {remarkForm.description && (
                      <p className="text-sm text-default-600">{remarkForm.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Chip size="sm" variant="flat" color="primary" className="capitalize">
                        {remarkForm.customType || remarkForm.type || "No Type"}
                      </Chip>
                      {remarkForm.sendToParent && (
                        <Chip size="sm" variant="flat" color="success" startContent={<Mail size={12} />}>
                          Will Send
                        </Chip>
                      )}
                    </div>
                  </div>
                )}
              </DrawerBody>
              <DrawerFooter className="border-t border-default-100">
                <Button 
                  variant="flat" 
                  onPress={() => {
                    setRemarkForm({ 
                      type: "", 
                      customType: "", 
                      title: "", 
                      description: "", 
                      sendToParent: false 
                    });
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSaveRemark}
                  startContent={<Plus size={16} />}
                  isDisabled={!remarkForm.title.trim() || !remarkForm.description.trim() || (!remarkForm.type && !remarkForm.customType.trim())}
                >
                  {remarkForm.sendToParent ? "Save & Send" : "Save Remark"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Regularize Attendance Drawer */}
      <Drawer 
        isOpen={isRegularizeOpen} 
        onOpenChange={setIsRegularizeOpen} 
        placement="right" 
        size="md" 
        classNames={{ 
          wrapper: "!z-50", 
          base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]",
          backdrop: "!z-40"
        }}
      >
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
                        <Checkbox size="sm" />
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-default-100 rounded-lg text-default-500"><CalendarCheck size={20} /></div>
                          <span className="font-medium text-default-900">{date}</span>
                        </div>
                      </div>
                      <Select 
                        aria-label="Absence reason"
                        size="sm" 
                        placeholder="Select Reason" 
                        className="w-40" 
                        variant="bordered"
                      >
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
      </Drawer>

      {/* Exam Details Drawer */}
      <Drawer 
        isOpen={isExamConfigOpen} 
        onOpenChange={setIsExamConfigOpen} 
        placement="right" 
        size="md" 
        classNames={{ 
          wrapper: "!z-50", 
          base: "m-2 rounded-xl shadow-xl h-[calc(100%-1rem)]",
          backdrop: "!z-40"
        }}
      >
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
                  {results && results.length > 0 ? (
                    <div className="space-y-4">
                      {results.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-default-700">{r.subjectName || 'Subject'}</span>
                              <span className="text-sm font-semibold">{Math.round(r.percentage || 0)}%</span>
                            </div>
                            <Progress 
                              aria-label={`${r.subjectName} score`}
                              value={r.percentage || 0} 
                              color={(r.percentage || 0) >= 90 ? "success" : (r.percentage || 0) >= 75 ? "primary" : "warning"} 
                              size="sm" 
                              className="w-full" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-default-400">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No subject results available</p>
                    </div>
                  )}
                </div>
              </DrawerBody>
              <DrawerFooter className="border-t border-default-100">
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
                  This permanently removes the student profile and linked records, including attendance, fee, health, and parent-contact data.
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
                      const result = await deleteStudent(id);
                      toast.success(result.message || `${student.name} permanently deleted`);
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

      {/* Fee Reminder Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MessageSquare size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Send Fee Reminder</h3>
                <p className="text-xs text-default-500">
                  {(studentFeeStructure?.totalBalance || 0) > 0
                    ? "Outstanding fee payment reminder"
                    : "Fee payment acknowledgment"
                  }
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Parent Contact Info */}
              <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                <p className="text-xs font-semibold text-default-500 uppercase mb-2">Parent Contact Information</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-default-500" />
                    <span className="font-medium">{student.parentName || 'N/A'}</span>
                  </div>
                  {student.parentPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-default-500" />
                      <span>{student.parentPhone}</span>
                    </div>
                  )}
                  {student.parentEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={16} className="text-default-500" />
                      <span>{student.parentEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Status */}
              <div className={`p-4 rounded-lg border ${
                (studentFeeStructure?.totalBalance || 0) > 0
                  ? 'bg-warning-50 border-warning-200'
                  : 'bg-success-50 border-success-200'
              }`}>
                {(studentFeeStructure?.totalBalance || 0) > 0 ? (
                  <>
                    <p className="text-xs font-semibold text-warning-700 uppercase mb-1">Outstanding Amount</p>
                    <p className="text-2xl font-bold text-warning-900">
                      ₹{studentFeeStructure?.totalBalance?.toLocaleString() || 0}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-success-700 uppercase mb-1">Total Fees Paid Till Date</p>
                    <p className="text-2xl font-bold text-success-900">
                      ₹{studentFeeStructure?.totalPaid?.toLocaleString() || 0}
                    </p>
                  </>
                )}
              </div>

              {/* Message Template */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700">Message</label>
                <Textarea
                  value={reminderMessage}
                  onValueChange={setReminderMessage}
                  minRows={5}
                  variant="bordered"
                  placeholder="Enter your message..."
                  description={`${reminderMessage.length}/500 characters`}
                  maxLength={500}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsReminderModalOpen(false)}
              isDisabled={reminderSending}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSendReminderMessage}
              isDisabled={reminderSending || !reminderMessage.trim()}
              isLoading={reminderSending}
              startContent={!reminderSending && <Send size={18} />}
            >
              {reminderSending ? 'Sending...' : 'Send Reminder'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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

