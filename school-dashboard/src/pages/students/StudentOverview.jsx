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
  const { getStudentById, classesWithTeachers, staff, updateStudent, deleteStudent, loading } = useApp();
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
          console.log('Fetching remarks with token:', token ? 'present' : 'missing');
          const response = await fetch(`${API_URL}/students/${id}/remarks?category=${remarksCategoryFilter}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('Remarks response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Remarks data received:', data);
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
          console.log('Fetching results with token:', token ? 'present' : 'missing');
          const response = await fetch(`${API_URL}/students/${id}/results`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('Results response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Results data received:', data);
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
      const response = await fetch(`${API_URL}/student-fees/student/${id}`, { headers });

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
          body: JSON.stringify({ academicYear: '2024-25' })
        });
        
        if (initResponse.ok) {
          const data = await initResponse.json();
          setStudentFeeStructure(data);
        }
      }
    } catch (error) {
      console.error('Error fetching fee structure:', error);
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
    
    const loadingToast = toast.loading("Recording payment...");
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      // 1. Create payment record in database
      const paymentData = {
        studentId: id,
        classId: student.classId,
        academicYear: '2024-25',
        paymentDate: paymentForm.date,
        amount: paymentAmount,
        paymentMode: paymentForm.paymentMode,
        feeHeads: [{
          period: new Date(paymentForm.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          amount: paymentAmount
        }],
        remarks: `Fee payment via ${paymentForm.paymentMode}`,
        collectedBy: null // Can be set to current user ID if available
      };

      const token = getAuthToken();
      const paymentHeaders = { 'Content-Type': 'application/json' };
      if (token) {
        paymentHeaders['Authorization'] = `Bearer ${token}`;
      }

      const paymentResponse = await fetch(`${API_URL}/fees/payments`, {
        method: 'POST',
        headers: paymentHeaders,
        body: JSON.stringify(paymentData)
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment record');
      }
      
      // 2. Update StudentFeeStructure via backend API
      if (studentFeeStructure && studentFeeStructure.feeHeads) {
        // Distribute payment across pending fee heads (FIFO - First In First Out)
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
        
        console.log('💰 Recording payment:', { paymentAmount, feeHeadPayments });

        const feePaymentHeaders = { 'Content-Type': 'application/json' };
        if (token) {
          feePaymentHeaders['Authorization'] = `Bearer ${token}`;
        }

        // Call backend to record payment in fee structure
        const feeStructureResponse = await fetch(`${API_URL}/student-fees/student/${id}/payment`, {
          method: 'POST',
          headers: feePaymentHeaders,
          body: JSON.stringify({
            amount: paymentAmount,
            feeHeadPayments,
            academicYear: studentFeeStructure.academicYear || '2024-25'
          })
        });
        
        if (!feeStructureResponse.ok) {
          const errorData = await feeStructureResponse.json();
          console.error('❌ Payment API error:', errorData);
          throw new Error(errorData.error || 'Failed to update fee structure');
        }
        
        const updatedStructure = await feeStructureResponse.json();
        console.log('✅ Payment recorded, new balance:', updatedStructure.totalBalance);
        
        // Refresh fee structure
        await fetchFeeStructure();
      }
      
      // 3. Refresh payment history
      await fetchPaymentHistory();
      
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
        console.log("Remark saved successfully:", savedRemark);

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
    toast.success(`Fee reminder sent to ${student.parentName || 'parent'}`);
  };

  const handleDownloadInvoice = () => {
    toast.success('Downloading invoice...');
  };

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
            <Tab key="attendance" title="Attendance" />
            <Tab key="academics" title="Academics" />
            <Tab key="fees" title="Fees" />
            <Tab key="documents" title={
              <div className="flex items-center gap-2">
                <span>Documents</span>
                <Chip size="sm" variant="flat" color="primary">{documents.length}</Chip>
              </div>
            } />
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
                  <Card isPressable onPress={() => setActiveTab("fees")} shadow="sm" className="border border-default-200 bg-background/60 backdrop-blur-md">
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
                            ₹{studentFeeStructure?.totalBalance?.toLocaleString() || 0}
                          </h4>
                        </div>
                        <p className="text-sm font-medium text-default-500">
                          {(studentFeeStructure?.totalBalance || 0) <= 0 ? 'No Dues' : 'Outstanding Amount'}
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
                  <InfoItem label="Academic Year" value={student.academicYear || "2024-25"} />
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
                  <InfoItem label="Academic Year" value={student.academicYear || "2024-25"} />
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
            <div className="space-y-6 animate-fade-in">
              {/* Documents Section */}
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
                <div className="flex gap-2">
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
                  <Button size="sm" color="primary" startContent={<Upload size={16} />} onPress={() => documentInputRef.current?.click()}>Upload Document</Button>
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-default-200 rounded-xl bg-default-50/50 hover:bg-default-100/50 transition-colors cursor-pointer group" onClick={() => documentInputRef.current?.click()}>
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
                        const isFrontBack = doc.front && doc.back;
                        const isCorrupted = !doc.url && !isFrontBack;
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
                                  {isFrontBack && <span className="ml-2 text-xs bg-primary-100 text-primary px-2 py-0.5 rounded">Front & Back</span>}
                                </p>
                                <p className="text-xs text-default-500">
                                  {isCorrupted ? 'Invalid file - please delete' : `${doc.date || 'Unknown date'} • ${doc.size || 'Unknown size'}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* View buttons for front/back documents */}
                              {isFrontBack ? (
                                <>
                                  <Tooltip content="View front">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      onPress={() => {
                                        console.log('👁️ Opening front document:', doc.front.url);
                                        window.open(doc.front.url, '_blank', 'noopener,noreferrer');
                                      }}
                                    >
                                      <Eye size={16} className="text-default-500" />
                                    </Button>
                                  </Tooltip>
                                  <Tooltip content="View back">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      onPress={() => {
                                        console.log('👁️ Opening back document:', doc.back.url);
                                        window.open(doc.back.url, '_blank', 'noopener,noreferrer');
                                      }}
                                    >
                                      <Eye size={16} className="text-default-500" />
                                    </Button>
                                  </Tooltip>
                                </>
                              ) : !isCorrupted && doc.url && (
                                <>
                                  <Tooltip content="View document">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      onPress={() => {
                                        console.log('👁️ Opening document:', doc.url);

                                        // Check if it's a data URL (base64)
                                        if (doc.url.startsWith('data:')) {
                                          // Convert data URL to Blob and create object URL
                                          fetch(doc.url)
                                            .then(res => res.blob())
                                            .then(blob => {
                                              const objectUrl = URL.createObjectURL(blob);
                                              window.open(objectUrl, '_blank', 'noopener,noreferrer');
                                              // Clean up after a delay
                                              setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
                                            })
                                            .catch(err => {
                                              console.error('Error opening document:', err);
                                              toast.error('Failed to open document');
                                            });
                                        } else {
                                          // For Cloudinary URLs, add fl_attachment flag for PDFs to force download/view
                                          let viewUrl = doc.url;
                                          if (doc.url.includes('cloudinary.com') && doc.name?.toLowerCase().endsWith('.pdf')) {
                                            // Insert fl_attachment:false to force inline viewing
                                            viewUrl = doc.url.replace('/upload/', '/upload/fl_attachment:false/');
                                          }
                                          window.open(viewUrl, '_blank', 'noopener,noreferrer');
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
            </div>
          )}

          {activeTab === "fees" && (
            <div className="space-y-6 animate-fade-in">
              {/* Fee Hero Section - Enhanced with Real Data from StudentFeeStructure */}
              <div className={`p-6 rounded-2xl border relative overflow-hidden ${
                (studentFeeStructure?.totalBalance || 0) <= 0 
                  ? "bg-success-50 border-success-200" 
                  : "bg-gradient-to-br from-danger-50 to-orange-50 border-danger-200"
              }`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <p className="text-default-600 font-medium">Total Outstanding</p>
                    <h2 className="text-4xl font-bold text-default-900">
                      ₹{studentFeeStructure?.totalBalance?.toLocaleString() || 0}
                    </h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {(studentFeeStructure?.totalBalance || 0) <= 0 ? (
                        <p className="text-xs text-success-600 bg-success-100 px-3 py-1 rounded-full inline-block font-medium">
                          All fees paid
                        </p>
                      ) : (studentFeeStructure?.totalBalance || 0) > 0 ? (
                        <p className="text-xs text-danger-600 bg-danger-100 px-3 py-1 rounded-full inline-block font-medium">
                          Payment pending
                        </p>
                      ) : null}
                      {studentFeeStructure?.overallStatus && (
                        <p className="text-xs text-default-600 bg-white px-3 py-1 rounded-full inline-block font-medium capitalize">
                          Status: {studentFeeStructure.overallStatus}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {(studentFeeStructure?.totalBalance || 0) > 0 && (
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

              {/* Payment History */}
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

              {/* Fee Heads from StudentFeeStructure */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-default-900">Applicable Fee Heads</h3>
                  <div className="flex items-center gap-2">
                    {studentFeeStructure && (
                      <Chip size="sm" variant="flat" color="primary">
                        {studentFeeStructure.feeHeads?.length || 0} Fee Heads
                      </Chip>
                    )}
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<BookOpen size={16} />}
                      onPress={() => navigate('/settings?tab=fee-heads')}
                    >
                      Configure Fee Heads
                    </Button>
                  </div>
                </div>
                
                {loadingFeeStructure ? (
                  <div className="p-8 text-center border border-default-200 rounded-xl bg-default-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-default-600">Loading fee structure...</p>
                  </div>
                ) : studentFeeStructure && studentFeeStructure.feeHeads && studentFeeStructure.feeHeads.length > 0 ? (
                  <div className="border border-default-200 rounded-xl overflow-hidden bg-white">
                    <Table
                      aria-label="Student Fee Heads"
                      removeWrapper
                      classNames={{
                        th: "bg-default-50 text-default-600 font-semibold text-xs uppercase",
                        td: "py-4"
                      }}
                    >
                      <TableHeader>
                        <TableColumn>FEE HEAD</TableColumn>
                        <TableColumn>CATEGORY</TableColumn>
                        <TableColumn>AMOUNT</TableColumn>
                        <TableColumn>PAID</TableColumn>
                        <TableColumn>BALANCE</TableColumn>
                        <TableColumn>STATUS</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {studentFeeStructure.feeHeads.map((feeHead, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <p className="font-semibold text-default-900">{feeHead.name}</p>
                                <p className="text-xs text-default-500 capitalize">{feeHead.frequency}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip size="sm" variant="flat" color="primary">
                                {feeHead.category}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-default-900">
                                ₹{feeHead.amount?.toLocaleString() || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-success-600">
                                ₹{feeHead.paidAmount?.toLocaleString() || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-warning-600">
                                ₹{feeHead.balanceAmount?.toLocaleString() || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  feeHead.status === 'paid' ? 'success' :
                                  feeHead.status === 'partial' ? 'warning' :
                                  'danger'
                                }
                              >
                                {feeHead.status === 'paid' ? 'Paid' :
                                 feeHead.status === 'partial' ? 'Partial' :
                                 'Pending'}
                              </Chip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Fee Structure Summary */}
                    <div className="p-4 bg-default-50 border-t border-default-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-default-500 mb-1">Total Fee</p>
                          <p className="text-lg font-bold text-default-900">
                            ₹{studentFeeStructure.totalFee?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500 mb-1">Total Paid</p>
                          <p className="text-lg font-bold text-success-600">
                            ₹{studentFeeStructure.totalPaid?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500 mb-1">Discount</p>
                          <p className="text-lg font-bold text-purple-600">
                            ₹{studentFeeStructure.discountApplied?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500 mb-1">Balance</p>
                          <p className="text-lg font-bold text-warning-600">
                            ₹{studentFeeStructure.totalBalance?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      
                      {studentFeeStructure.discountReason && (
                        <div className="mt-3 pt-3 border-t border-default-200">
                          <p className="text-xs text-default-500">Discount Reason:</p>
                          <p className="text-sm text-default-700">{studentFeeStructure.discountReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center border border-default-200 rounded-xl bg-default-50">
                    <IndianRupee size={32} className="mx-auto text-default-300 mb-2" />
                    <p className="text-sm text-default-600 mb-2">No fee structure assigned yet</p>
                    <p className="text-xs text-default-500">
                      Fee heads will be automatically assigned based on the student's class
                    </p>
                  </div>
                )}
              </div>
            </div>
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

              {/* Subject-wise Attendance */}
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
                  <div className="space-y-4">
                    {[
                      { subject: "Mathematics", present: 18, total: 20, percentage: 90 },
                      { subject: "Science", present: 19, total: 20, percentage: 95 },
                      { subject: "English", present: 17, total: 20, percentage: 85 },
                      { subject: "Social Studies", present: 18, total: 20, percentage: 90 },
                      { subject: "Computer Science", present: 20, total: 20, percentage: 100 },
                      { subject: "Physical Education", present: 16, total: 20, percentage: 80 }
                    ].map((subject, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-default-900">{subject.subject}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-default-500">
                                {subject.present}/{subject.total} classes
                              </span>
                              <span className={`text-sm font-semibold ${
                                subject.percentage >= 90 ? 'text-success' : 
                                subject.percentage >= 75 ? 'text-warning' : 'text-danger'
                              }`}>
                                {subject.percentage}%
                              </span>
                            </div>
                          </div>
                          <Progress
                            value={subject.percentage}
                            color={subject.percentage >= 90 ? "success" : subject.percentage >= 75 ? "warning" : "danger"}
                            size="sm"
                            radius="full"
                          />
                        </div>
                      </div>
                    ))}
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
                      <Select size="sm" variant="bordered" defaultSelectedKeys={["december"]} className="w-32">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                      <p className="text-xs text-default-600 mb-1">This Month</p>
                      <p className="text-2xl font-bold text-blue-600">92%</p>
                      <p className="text-xs text-success-600 mt-1">↑ 3% from last month</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                      <p className="text-xs text-default-600 mb-1">This Quarter</p>
                      <p className="text-2xl font-bold text-purple-600">89%</p>
                      <p className="text-xs text-warning-600 mt-1">↓ 1% from last quarter</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                      <p className="text-xs text-default-600 mb-1">This Year</p>
                      <p className="text-2xl font-bold text-green-600">90%</p>
                      <p className="text-xs text-success-600 mt-1">↑ 2% from last year</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === "remarks" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-default-900">Student Remarks</h3>
                    <p className="text-xs text-default-500">Notes and observations about the student</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select
                    size="sm"
                    placeholder="Filter by category"
                    className="w-full sm:w-48"
                    variant="bordered"
                    selectedKeys={remarksCategoryFilter === 'all' ? [] : [remarksCategoryFilter]}
                    onSelectionChange={(keys) => setRemarksCategoryFilter(Array.from(keys)[0] || 'all')}
                  >
                    <SelectItem key="all">All Categories</SelectItem>
                    <SelectItem key="academic">Academic</SelectItem>
                    <SelectItem key="behavioral">Behavioral</SelectItem>
                    <SelectItem key="achievement">Achievement</SelectItem>
                    <SelectItem key="attendance">Attendance</SelectItem>
                    <SelectItem key="health">Health</SelectItem>
                    <SelectItem key="general">General</SelectItem>
                  </Select>
                  <Button size="sm" color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => setIsRemarkOpen(true)}>Add Remark</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {remarksLoading ? (
                  <div className="text-center py-12">
                    <p className="text-default-500">Loading remarks...</p>
                  </div>
                ) : remarks.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-default-200 rounded-xl">
                    <MessageSquare size={48} className="mx-auto text-default-300 mb-3" />
                    <h4 className="font-semibold text-default-700 mb-1">No remarks yet</h4>
                    <p className="text-sm text-default-500 mb-4">Add your first remark or observation about this student</p>
                    <Button color="primary" variant="flat" startContent={<Plus size={16} />} onPress={() => setIsRemarkOpen(true)}>
                      Add First Remark
                    </Button>
                  </div>
                ) : (
                  remarks.map((remark) => {
                    const getCategoryColor = (category) => {
                      switch (category) {
                        case 'academic': return 'primary';
                        case 'behavioral': return 'warning';
                        case 'achievement': return 'success';
                        case 'attendance': return 'secondary';
                        case 'health': return 'danger';
                        default: return 'default';
                      }
                    };

                    const getCategoryIcon = (category) => {
                      switch (category) {
                        case 'academic': return MessageSquare;
                        case 'behavioral': return AlertCircle;
                        case 'achievement': return Award;
                        case 'attendance': return CalendarCheck;
                        case 'health': return Heart;
                        default: return MessageSquare;
                      }
                    };

                    const CategoryIcon = getCategoryIcon(remark.category);

                    return (
                      <div key={remark._id} className="group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-default-200 bg-white hover:border-primary/30 hover:shadow-md transition-all">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-10 h-10 rounded-full bg-${getCategoryColor(remark.category)}-50 flex items-center justify-center text-${getCategoryColor(remark.category)}-600`}>
                            <CategoryIcon size={20} />
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-default-900 mb-1">{remark.title}</h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <Chip size="sm" variant="flat" color={getCategoryColor(remark.category)} className="capitalize">{remark.category}</Chip>
                                {remark.sentToParent ? (
                                  <Chip size="sm" variant="flat" color="success" startContent={<Mail size={12} />}>Sent to Parent</Chip>
                                ) : (
                                  <Chip size="sm" variant="flat" color="default">Staff Only</Chip>
                                )}
                                <span className="text-xs text-default-400">
                                  • {remark.authorName || 'System'} • {new Date(remark.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu aria-label="Remark actions">
                                <DropdownItem key="edit" startContent={<Edit size={14} />}>Edit</DropdownItem>
                                <DropdownItem key="resend" startContent={<Mail size={14} />}>Resend to Parent</DropdownItem>
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 size={14} />}>Delete</DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                          <p className="text-sm text-default-600 leading-relaxed">
                            {remark.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}



          {activeTab === "academics" && (
            <div className="space-y-6 animate-fade-in">
              {/* Academic Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border border-default-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-600">Overall Grade</p>
                        <p className="text-lg font-bold text-blue-700">A+</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-default-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-600">Average Score</p>
                        <p className="text-lg font-bold text-purple-700">88.5%</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-default-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-600">Class Rank</p>
                        <p className="text-lg font-bold text-green-700">#5</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-default-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-default-600">Class Teacher</p>
                        <p className="text-sm font-bold text-orange-700 truncate">{classTeacher?.name || "Not Assigned"}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Subject-wise Performance */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Subject-wise Performance</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { subject: "Mathematics", score: 88, grade: "A", color: "blue", icon: "📐" },
                      { subject: "Science", score: 92, grade: "A+", color: "green", icon: "🔬" },
                      { subject: "English", score: 85, grade: "A", color: "purple", icon: "📚" },
                      { subject: "Social Studies", score: 90, grade: "A+", color: "orange", icon: "🌍" },
                      { subject: "Computer Science", score: 95, grade: "A+", color: "cyan", icon: "💻" },
                      { subject: "Physical Education", score: 87, grade: "A", color: "red", icon: "⚽" }
                    ].map((subject, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-default-200 bg-white hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{subject.icon}</span>
                            <div>
                              <h4 className="font-semibold text-default-900">{subject.subject}</h4>
                              <p className="text-xs text-default-500">Current Term</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold text-${subject.color}-600`}>{subject.score}%</div>
                            <Chip size="sm" variant="flat" color={subject.score >= 90 ? "success" : "primary"} className="mt-1">
                              Grade {subject.grade}
                            </Chip>
                          </div>
                        </div>
                        <Progress
                          value={subject.score}
                          color={subject.score >= 90 ? "success" : subject.score >= 75 ? "primary" : "warning"}
                          size="sm"
                          radius="full"
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Exam Performance - Cards Grid with Responsive Layout */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Exam Overview</h3>
                  </div>
                  {resultsLoading && <Spinner size="sm" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Real exam results when available */}
                  {results.length > 0 ? results.map((result, i) => {
                    const exam = result.examId;
                    const scoreDisplay = result.isPublished ? `${Math.round(result.percentage)}%` : 'Not Published';
                    const status = result.isPublished ? 'Published' : 'Pending';

                    return (
                      <Card
                        key={i}
                        isPressable
                        onPress={() => { setSelectedExam(result); setIsExamConfigOpen(true); }}
                        shadow="none"
                        className="border border-default-200 hover:border-primary hover:shadow-lg transition-all hover:scale-105"
                      >
                        <CardBody className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-lg ${
                              result.isPublished ? "bg-success-50 text-success-600" :
                              "bg-warning-50 text-warning-600"
                            }`}>
                              <FileText size={18} />
                            </div>
                            <Chip
                              size="sm"
                              color={result.isPublished ? "success" : "warning"}
                              variant="flat"
                            >
                              {status}
                            </Chip>
                          </div>
                          <h4 className="text-base font-semibold text-default-900 mb-1">{exam?.name || 'Exam'}</h4>
                          <p className="text-xs text-default-500 mb-4">{exam?.startDate ? new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'No date'}</p>
                          {result.isPublished && result.percentage > 0 && (
                            <Progress
                              value={result.percentage}
                              color={result.percentage >= 90 ? "success" : result.percentage >= 75 ? "primary" : "warning"}
                              size="sm"
                              radius="full"
                              className="mb-3"
                            />
                          )}
                          <div className="flex items-center justify-between text-sm pt-3 border-t border-default-100">
                            <span className="text-default-500">Score</span>
                            <span className={`font-bold ${result.percentage >= 90 ? "text-success" : result.percentage >= 75 ? "text-primary" : "text-default-900"}`}>
                              {scoreDisplay}
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  }) : resultsLoading ? (
                    <div className="col-span-full flex justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : !resultsLoading && (
                    /* Fallback mock data when no results exist */
                    [
                      { name: "Unit Test 1", date: "Aug 2024", status: "Published", score: "88%", percentage: 88 },
                      { name: "Half Yearly", date: "Sept 2024", status: "Published", score: "92%", percentage: 92 },
                      { name: "Unit Test 2", date: "Nov 2024", status: "Published", score: "85%", percentage: 85 },
                      { name: "Annual Exam", date: "Dec 2024", status: "Scheduled", score: "-", percentage: 0 }
                    ].map((exam, i) => (
                    <Card 
                      key={i} 
                      isPressable 
                      onPress={() => { setSelectedExam(exam); setIsExamConfigOpen(true); }} 
                      shadow="none" 
                      className="border border-default-200 hover:border-primary hover:shadow-lg transition-all hover:scale-105"
                    >
                      <CardBody className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2.5 rounded-lg ${
                            exam.status === "Published" ? "bg-success-50 text-success-600" :
                            exam.status === "Pending" ? "bg-warning-50 text-warning-600" :
                            "bg-default-100 text-default-600"
                          }`}>
                            <FileText size={18} />
                          </div>
                          <Chip 
                            size="sm" 
                            color={exam.status === "Published" ? "success" : exam.status === "Pending" ? "warning" : "default"} 
                            variant="flat"
                          >
                            {exam.status}
                          </Chip>
                        </div>
                        <h4 className="text-base font-semibold text-default-900 mb-1">{exam.name}</h4>
                        <p className="text-xs text-default-500 mb-4">{exam.date}</p>
                        {exam.percentage > 0 && (
                          <Progress 
                            value={exam.percentage} 
                            color={exam.percentage >= 90 ? "success" : exam.percentage >= 75 ? "primary" : "warning"}
                            size="sm" 
                            radius="full"
                            className="mb-3"
                          />
                        )}
                        <div className="flex items-center justify-between text-sm pt-3 border-t border-default-100">
                          <span className="text-default-500">Score</span>
                          <span className={`font-bold ${exam.percentage >= 90 ? "text-success" : exam.percentage >= 75 ? "text-primary" : "text-default-900"}`}>
                            {exam.score}
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                  )}
                </div>
              </div>

              {/* Academic Achievements */}
              <Card shadow="none" className="border border-default-200">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-default-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                      <Award size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-default-900">Achievements & Awards</h3>
                  </div>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: "Best Student Award", date: "Dec 2024", icon: "🏆" },
                      { title: "Science Fair Winner", date: "Nov 2024", icon: "🔬" },
                      { title: "Perfect Attendance", date: "Oct 2024", icon: "📅" },
                      { title: "Math Olympiad Bronze", date: "Sept 2024", icon: "🥉" }
                    ].map((achievement, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border border-default-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                        <span className="text-3xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-default-900">{achievement.title}</h4>
                          <p className="text-xs text-default-500">{achievement.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

            </div>
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
                  <Checkbox 
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
                  <div className="space-y-4">
                    {[{ sub: "Mathematics", score: 88 }, { sub: "Science", score: 92 }, { sub: "English", score: 85 }].map((s, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-default-700">{s.sub}</span>
                            <span className="text-sm font-semibold">{s.score}/100</span>
                          </div>
                          <Progress value={s.score} color={s.score > 90 ? "success" : "primary"} size="sm" className="w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
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

