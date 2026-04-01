import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import { parseDate } from "@internationalized/date";
import { Button, Input, Select, SelectItem, Checkbox, Switch, Textarea, Chip, Divider, Avatar, RadioGroup, Radio, cn, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, DatePicker, Autocomplete, AutocompleteItem, Spinner } from "@heroui/react";
import { ArrowLeft, ArrowRight, Upload, X, Plus, User, FileText, Briefcase, DollarSign, Trash2, Check, Banknote, GraduationCap, MapPin, Phone, Mail, BadgeCheck, FileBadge, Calendar as CalendarIcon, Clock, HeartPulse, MoreHorizontal, AlertTriangle, PenLine, FileScan, CheckCircle2 } from "lucide-react";
import PhotoEditorModal from "../../components/PhotoEditorModal";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import TimetableWizardModal from "../classes/components/TimetableWizardModal";
import ClassSubjectManagementModal from "./components/ClassSubjectManagementModal";
import { STAFF_ROLES } from "../../constants/roles";
import { usePermissions } from "../../context/PermissionContext";
import { useApp } from "../../context/AppContext";
import { classesApi } from "../../services/api";
import toast from "react-hot-toast";
import { useTranslation } from 'react-i18next';

// Minimal design constants matching login page style
const minimalInputClasses = "bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 hover:border-teal-500 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all duration-200";
const minimalLabelClasses = "text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1";
const minimalButtonPrimary = "bg-teal-600 hover:bg-teal-700 text-white transition-colors";
const minimalButtonSecondary = "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition-colors";

// --- Constants ---
const employmentTypes = [
  { label: "Full-Time", value: "Full-time" },
  { label: "Part-Time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["Male", "Female", "Other"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
const staffTypes = STAFF_ROLES; // Use centralized roles
const idProofTypes = ["Aadhar Card", "PAN Card", "Driving License", "Passport", "Voter ID", "Other"];
const degreeOptions = [
  { label: "B.Ed", value: "B.Ed" }, { label: "M.Ed", value: "M.Ed" },
  { label: "PhD", value: "PhD" }, { label: "B.Sc", value: "B.Sc" },
  { label: "M.Sc", value: "M.Sc" }, { label: "B.A", value: "B.A" },
  { label: "M.A", value: "M.A" }, { label: "B.Com", value: "B.Com" },
  { label: "M.Com", value: "M.Com" }, { label: "MBA", value: "MBA" },
  { label: "B.Tech", value: "B.Tech" }, { label: "M.Tech", value: "M.Tech" },
  { label: "Other", value: "Other" }
];
const departments = ["Science", "Mathematics", "Languages", "Social Studies", "Arts", "Sports", "Admin", "Others"];

// Fallback class options - will be replaced by actual API data
const fallbackClassOptions = Array.from({ length: 12 }, (_, i) => i + 1).flatMap(num => ["A", "B", "C", "D"].map(sec => `${num}-${sec}`));

const emptyForm = {
  // Personal Details
  name: "", dob: "", picture: null, phone: "", isWhatsapp: false,
  whatsappNumber: "", email: "", fatherName: "", bloodGroup: "", gender: "Male", maritalStatus: "",
  employmentType: "Full-time", idDocuments: [], customDocuments: [],
  emergencyContacts: [{ name: "", relationship: "", phone: "" }], address: "",
  // Qualifications
  professionalQualifications: [], totalExperience: "", experience: 0, previousOrganization: "", roleInOrganization: "", qualificationDocs: [],
  // Staff Info
  staffNumber: "", staffType: [], department: "", assignedClasses: [], isClassTeacher: false, classTeacherOf: "",
  // Salary Details
  accountNumber: "", ifscCode: "", bankName: "", branchName: "", salaryTemplate: "", salaryBreakdown: []
};

const AddStaff = forwardRef(({ onClose, onSave, editingStaff }, ref) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { staff: allStaff } = useApp();
  const canEdit = editingStaff ? hasPermission('staff', 'edit') : hasPermission('staff', 'create');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  // showTimetableModal state removed - was unused

  // Create blob URL once per picture change to avoid memory leaks from calling createObjectURL on every render
  const picturePreviewUrl = useMemo(() => {
    if (!formData.picture || !(formData.picture instanceof File)) return null;
    const url = URL.createObjectURL(formData.picture);
    return url;
  }, [formData.picture]);

  useEffect(() => {
    return () => {
      if (picturePreviewUrl) URL.revokeObjectURL(picturePreviewUrl);
    };
  }, [picturePreviewUrl]);
  const [showClassSubjectModal, setShowClassSubjectModal] = useState(false);
  const [createdStaffId, setCreatedStaffId] = useState(null);
  const [createdStaffName, setCreatedStaffName] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Refs
  const pictureInputRef = useRef(null);
  const idDocsInputRef = useRef(null);
  const qualDocsInputRef = useRef(null);

  // Auto-generate Staff ID on component mount (only for new staff)
  // Populate form with editingStaff data when editing
  useEffect(() => {
    if (editingStaff) {
      // EDIT MODE: Populate form with existing staff data
      setFormData({
        // Personal Details
        name: editingStaff.name || "",
        dob: editingStaff.dob || "",
        picture: editingStaff.picture || null,
        phone: editingStaff.phone || "",
        isWhatsapp: editingStaff.whatsappNumber === editingStaff.phone,
        whatsappNumber: editingStaff.whatsappNumber || "",
        email: editingStaff.email || "",
        fatherName: editingStaff.fatherName || "",
        bloodGroup: editingStaff.bloodGroup || "",
        gender: editingStaff.gender || "Male",
        maritalStatus: editingStaff.maritalStatus || "",
        employmentType: editingStaff.employmentType || "Full-time",
        idDocuments: editingStaff.idDocuments || [],
        customDocuments: editingStaff.customDocuments || [],
        emergencyContacts: editingStaff.emergencyContacts ? editingStaff.emergencyContacts : [{ name: "", relationship: "", phone: "" }],
        address: editingStaff.address || "",
        // Qualifications
        professionalQualifications: editingStaff.professionalQualifications || [],
        totalExperience: editingStaff.totalExperience || "",
        experience: editingStaff.experience ?? (parseInt(editingStaff.totalExperience, 10) || 0),
        previousOrganization: editingStaff.previousOrganization || "",
        roleInOrganization: editingStaff.roleInOrganization || "",
        qualificationDocs: editingStaff.qualificationDocs || [],
        // Staff Info
        staffNumber: editingStaff.staffNumber || editingStaff.code || "",
        // Prefer `role` (canonical) over `staffType` (deprecated) to avoid stale data on re-edit
        staffType: (() => {
          const source = editingStaff.role || editingStaff.staffType;
          if (!source) return [];
          return Array.isArray(source) ? source : [source];
        })(),
        department: editingStaff.department || "",
        assignedClasses: editingStaff.assignedClasses || [],
        isClassTeacher: editingStaff.isClassTeacher || false,
        classTeacherOf: editingStaff.classTeacherOf || "",
        // Salary Details
        accountNumber: editingStaff.accountNumber || "",
        ifscCode: editingStaff.ifscCode || "",
        bankName: editingStaff.bankName || "",
        branchName: editingStaff.branchName || "",
        salaryTemplate: editingStaff.salaryTemplate || "",
        salaryBreakdown: editingStaff.salaryBreakdown || []
      });
    }
    // In CREATE mode, staffNumber is left empty — the backend auto-generates it
  }, [editingStaff]);

  // Fetch available classes from the API
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const classes = await classesApi.getPublic();
        setAvailableClasses(classes || []);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
        // Fallback to static options
        setAvailableClasses(fallbackClassOptions.map(c => ({ id: c, displayName: c })));
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const cancelClose = () => {
    setShowConfirmClose(false);
  };

  useImperativeHandle(ref, () => ({
    attemptClose: handleClose,
    hasUnsavedChanges: () => hasChanges
  }));

  const validateSingleField = (field, value) => {
    let newError = null;
    switch (field) {
      case "name":
        if (!value.trim()) newError = "Required";
        break;
      case "phone":
        if (!value.trim()) newError = "Required";
        else if (!/^\d{10}$/.test(value)) newError = "Invalid";
        else {
          // BUG-19: check for duplicate phone among existing staff
          const editingId = editingStaff?._id || editingStaff?.id;
          const phoneDupe = Array.isArray(allStaff) && allStaff.find(s =>
            s.phone && s.phone === value.trim() &&
            (s._id || s.id) !== editingId
          );
          if (phoneDupe) {
            newError = `Phone already used by ${phoneDupe.name}${phoneDupe.code ? ` (${phoneDupe.code})` : ''}`;
          }
        }
        break;
      case "email":
        if (value.trim()) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newError = "Invalid email";
          } else {
            // Check for duplicate email among existing staff
            const editingId = editingStaff?._id || editingStaff?.id;
            const duplicate = Array.isArray(allStaff) && allStaff.find(s =>
              s.email && s.email.toLowerCase() === value.trim().toLowerCase() &&
              (s._id || s.id) !== editingId
            );
            if (duplicate) {
              newError = `Email already used by ${duplicate.name}${duplicate.code ? ` (${duplicate.code})` : ''}`;
            }
          }
        }
        break;
      case "staffType":
        if (!value) newError = "Required";
        break;
      case "dob":
        if (!value) {
          newError = "Required";
        } else {
          const dobYear = new Date(value).getFullYear();
          const currentYear = new Date().getFullYear();
          if (dobYear === currentYear) {
            newError = "Year cannot be current year";
          }
        }
        break;
      case "gender":
        if (!value) newError = "Required";
        break;
      case "fatherName":
        if (!value.trim()) newError = "Required";
        break;
      case "department":
        if (!value) newError = "Required";
        break;
      case "ifscCode":
        if (value.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase())) {
          newError = "Invalid IFSC format (e.g., SBIN0001234)";
        }
        break;
    }
    setErrors(prev => ({ ...prev, [field]: newError }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true); // Mark as changed whenever any field is updated
    validateSingleField(field, value);
  };

  const addQualification = () => {
    updateField("professionalQualifications", [...formData.professionalQualifications, { name: "", year: "", documents: [] }]);
  };

  const removeQualification = (index) => {
    updateField("professionalQualifications", formData.professionalQualifications.filter((_, i) => i !== index));
  };

  const updateQualification = (index, field, value) => {
    const updated = [...formData.professionalQualifications];
    updated[index][field] = value;
    updateField("professionalQualifications", updated);

    // Real-time validation for qualification fields
    if (field === "name") {
      setErrors(prev => ({ ...prev, [`qualName_${index}`]: !value ? "Required" : null }));
    }
    if (field === "year") {
      let error = null;
      if (value && !/^\d{4}$/.test(value)) error = "Invalid Year";
      if (value && (parseInt(value) < 1950 || parseInt(value) > new Date().getFullYear())) {
        error = "Invalid Year";
      }
      setErrors(prev => ({ ...prev, [`qualYear_${index}`]: error }));
    }
  };

  const handleQualificationDocUpload = (index, files) => {
    const updated = [...formData.professionalQualifications];
    updated[index].documents = [...(updated[index].documents || []), ...Array.from(files)];
    updateField("professionalQualifications", updated);
  };

  const removeQualificationDoc = (qualIndex, docIndex) => {
    const updated = [...formData.professionalQualifications];
    updated[qualIndex].documents = updated[qualIndex].documents.filter((_, i) => i !== docIndex);
    updateField("professionalQualifications", updated);
  };

  const handleFileUpload = (field, files) => {
    if (files && files.length > 0) {
      updateField(field, [...formData[field], ...Array.from(files)]);
    }
  };

  const removeFile = (field, index) => {
    updateField(field, formData[field].filter((_, i) => i !== index));
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    if (stepNum === 1) {
      // Personal Info validation
      if (!formData.name.trim()) newErrors.name = "Required";
      if (!formData.dob) {
        newErrors.dob = "Required";
      } else {
        const dobYear = new Date(formData.dob).getFullYear();
        const currentYear = new Date().getFullYear();
        if (dobYear === currentYear) {
          newErrors.dob = "Year cannot be current year";
        }
      }
      if (!formData.gender) newErrors.gender = "Required";
      if (!formData.fatherName.trim()) newErrors.fatherName = "Required";
      if (!formData.phone.trim()) newErrors.phone = "Required";
      else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Invalid";
      if (formData.email.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Invalid email";
        } else {
          const editingId = editingStaff?._id || editingStaff?.id;
          const duplicate = Array.isArray(allStaff) && allStaff.find(s =>
            s.email && s.email.toLowerCase() === formData.email.trim().toLowerCase() &&
            (s._id || s.id) !== editingId
          );
          if (duplicate) {
            newErrors.email = `Email already used by ${duplicate.name}${duplicate.code ? ` (${duplicate.code})` : ''}`;
          }
        }
      }
      // Emergency contact phone validation
      formData.emergencyContacts.forEach((contact, i) => {
        if (contact.phone && !/^\d{10}$/.test(contact.phone)) {
          newErrors[`emergencyPhone_${i}`] = "Invalid phone number";
        }
      });
    }
    if (stepNum === 2) {
      // Job Details validation
      if (!formData.staffType || (Array.isArray(formData.staffType) && formData.staffType.length === 0)) {
        newErrors.staffType = "At least one role is required";
      }
      if (!formData.department) newErrors.department = "Required";
    }
    if (stepNum === 3) {
      // Education validation - At least one degree is required for NEW staff only
      if (!editingStaff && formData.professionalQualifications.length === 0) {
        newErrors.qualifications = "At least one degree is required";
      }
      formData.professionalQualifications.forEach((q, i) => {
        if (!q.name) newErrors[`qualName_${i}`] = "Required";
        if (q.year && !/^\d{4}$/.test(q.year)) newErrors[`qualYear_${i}`] = "Invalid Year";
        if (q.year && (parseInt(q.year) < 1950 || parseInt(q.year) > new Date().getFullYear())) {
          newErrors[`qualYear_${i}`] = "Invalid Year";
        }
      });
    }
    // Step 4 (Documents) has no required validations
    if (stepNum === 5) {
      // Salary details validation (optional, but IFSC should be validated if provided)
      if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
        newErrors.ifscCode = "Invalid IFSC format (e.g., SBIN0001234)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      // Import uploadApi
      const { uploadApi } = await import("../../services/api");

      // Upload profile picture to Cloudinary if it's a File object
      let pictureUrl = null;
      if (formData.picture instanceof File) {
        try {
          const uploadResponse = await uploadApi.uploadFile(formData.picture);
          pictureUrl = uploadResponse.url;
        } catch (error) {
          console.error('❌ Photo upload failed:', error);
          // Continue without photo
        }
      } else if (typeof formData.picture === 'string' && formData.picture.length > 0) {
        pictureUrl = formData.picture;
      }

      // Upload ID documents to Cloudinary
      const uploadedIdDocuments = [];
      for (const doc of formData.idDocuments) {
        if (doc.file instanceof File) {
          try {
            const uploadResponse = await uploadApi.uploadFile(doc.file);
            uploadedIdDocuments.push({
              type: doc.type,
              url: uploadResponse.url,
              name: doc.name
            });
          } catch (error) {
            console.error(`❌ ${doc.type} upload failed:`, error);
          }
        } else if (doc.url) {
          // Already uploaded, keep as is
          uploadedIdDocuments.push(doc);
        }
      }

      // Upload qualification documents
      const uploadedQualificationDocs = [];
      for (const file of formData.qualificationDocs) {
        if (file instanceof File) {
          try {
            const uploadResponse = await uploadApi.uploadFile(file);
            uploadedQualificationDocs.push(uploadResponse.url);
          } catch (error) {
            console.error('❌ Qualification doc upload failed:', error);
          }
        } else if (typeof file === 'string') {
          uploadedQualificationDocs.push(file);
        }
      }

      // Upload documents within professional qualifications
      const uploadedProfessionalQualifications = await Promise.all(
        formData.professionalQualifications.map(async (qual) => {
          const uploadedDocs = [];
          for (const doc of qual.documents || []) {
            if (doc instanceof File) {
              try {
                const uploadResponse = await uploadApi.uploadFile(doc);
                uploadedDocs.push(uploadResponse.url);
              } catch (error) {
                console.error('❌ Professional qualification doc upload failed:', error);
              }
            } else if (typeof doc === 'string') {
              uploadedDocs.push(doc);
            }
          }
          return {
            name: qual.name,
            year: qual.year,
            documents: uploadedDocs
          };
        })
      );

      // Upload custom documents
      const uploadedCustomDocuments = [];
      for (const file of formData.customDocuments || []) {
        if (file instanceof File) {
          try {
            const uploadResponse = await uploadApi.uploadFile(file);
            uploadedCustomDocuments.push(uploadResponse.url);
          } catch (error) {
            console.error('❌ Custom document upload failed:', error);
          }
        } else if (typeof file === 'string') {
          uploadedCustomDocuments.push(file);
        }
      }

      // Prepare staff data with uploaded URLs
      const staffData = {
        ...formData,
        picture: pictureUrl,
        idDocuments: uploadedIdDocuments,
        qualificationDocs: uploadedQualificationDocs,
        professionalQualifications: uploadedProfessionalQualifications,
        customDocuments: uploadedCustomDocuments,
      };

      // Calculate total salary from salaryBreakdown for payroll
      if (formData.salaryBreakdown && formData.salaryBreakdown.length > 0) {
        const totalSalary = formData.salaryBreakdown.reduce((sum, item) => {
          return sum + (parseFloat(item.amount) || 0);
        }, 0);
        staffData.salary = totalSalary;
      }

      // Filter out empty emergency contacts (remove contacts with all empty fields)
      if (staffData.emergencyContacts) {
        staffData.emergencyContacts = staffData.emergencyContacts.filter(
          contact => contact.name?.trim() || contact.relationship?.trim() || contact.phone?.trim()
        );
        if (staffData.emergencyContacts.length === 0) {
          delete staffData.emergencyContacts;
        }
      }

      // Remove undefined values and unwanted fields
      Object.keys(staffData).forEach(key => {
        if (staffData[key] === undefined || staffData[key] === null) {
          delete staffData[key];
        }
      });

      // Remove staffId if it exists (not a valid field in schema)
      delete staffData.staffId;

      // Save staff and get the response
      const savedStaff = await onSave(staffData);

      // If it's a new staff creation (not editing), show class/subject management modal
      if (!editingStaff && savedStaff) {
        setCreatedStaffId(savedStaff._id || savedStaff.id);
        setCreatedStaffName(staffData.name);
        setShowClassSubjectModal(true);
      }

      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting staff:', error);
      toast.error(error?.message || (editingStaff ? 'Failed to update staff member' : 'Failed to create staff member'));
      setIsSubmitting(false);
    }
  };

  // --- Render Steps ---

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setTempImage(reader.result);
        setIsEditorOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleEditorSave = (croppedImage) => {
    // croppedImage may be a base64 data URL or a blob URL
    if (croppedImage && croppedImage.startsWith('data:')) {
      // Base64 data URL — convert directly without fetch
      const [header, base64] = croppedImage.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], "profile_photo.jpg", { type: mime });
      updateField("picture", file);
    } else {
      fetch(croppedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });
          updateField("picture", file);
        })
        .catch(() => {
          // If fetch fails, store the raw value as a fallback
          updateField("picture", croppedImage);
        });
    }
  };

  const handleCameraPhotoCapture = (file) => {
    // File is already captured from camera or file picker, no need to edit again
    // The CameraCaptureModal handles editing internally
    updateField("picture", file);
  };

  const handleEmergencyContactChange = (index, field, value) => {
    // For phone field, restrict to digits only and max 10 characters
    if (field === "phone") {
      if (!/^\d*$/.test(value)) return; // Only allow digits
      if (value.length > 10) return; // Max 10 digits
    }
    const updated = [...formData.emergencyContacts];
    updated[index][field] = value;
    updateField("emergencyContacts", updated);

    // Real-time validation for emergency contact phone
    if (field === "phone") {
      let phoneError = null;
      if (value && value.length > 0 && value.length < 10) {
        phoneError = `${10 - value.length} more digits needed`;
      } else if (value && !/^\d{10}$/.test(value)) {
        phoneError = "Must be 10 digits";
      }
      setErrors(prev => ({ ...prev, [`emergencyPhone_${index}`]: phoneError }));
    }
  };

  const addEmergencyContact = () => {
    updateField("emergencyContacts", [...formData.emergencyContacts, { name: "", relationship: "", phone: "" }]);
  };

  const removeEmergencyContact = (index) => {
    updateField("emergencyContacts", formData.emergencyContacts.filter((_, i) => i !== index));
  };

  const handleIDProofUpload = (type, files) => {
    if (files && files.length > 0) {
      // Remove existing document of same type if any
      const filtered = formData.idDocuments.filter(doc => doc.type !== type);
      // Add new document with metadata
      const updated = [...filtered, { type, file: files[0], name: files[0].name }];
      updateField("idDocuments", updated);
    }
  };

  const removeIDProof = (type) => {
    const updated = formData.idDocuments.filter(doc => doc.type !== type);
    updateField("idDocuments", updated);
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Profile Section */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar
            src={formData.picture ? (formData.picture instanceof File ? picturePreviewUrl : formData.picture) : undefined}
            name={!formData.picture ? (formData.name?.[0] || "") : undefined}
            className="w-24 h-24 text-3xl"
            isBordered
            radius="full"
          />
          {formData.picture && (
            <button
              className="absolute bottom-0 right-0 p-1.5 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-colors"
              onClick={() => pictureInputRef.current?.click()}
            >
              <PenLine size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-left">
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-teal-50 text-teal-600 font-medium rounded-lg text-sm hover:bg-teal-100 transition-colors flex items-center gap-2"
              onClick={() => setIsCameraCaptureOpen(true)}
            >
              <Upload size={16} />
              {formData.picture ? "Change Photo" : "Add Photo"}
            </button>
            {formData.picture && (
              <button
                className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                onClick={() => updateField("picture", null)}
              >
                Delete
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 max-w-[280px]">
            Take a photo or upload from device. You can crop, rotate and adjust it.
          </p>
        </div>
      </div>

      {/* Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-900">{t('pages.employmentType1')}</label>
        <div className="grid grid-cols-3 gap-3">
          {employmentTypes.map((type) => {
            const isSelected = formData.employmentType === type.value;
            return (
              <div key={type.value} className={cn(
                "cursor-pointer rounded-xl border-2 p-3 flex items-center justify-center gap-2 transition-all text-center h-20",
                isSelected ? "border-primary bg-primary-50/20" : "border-default-200 hover:border-default-300"
              )}
                onClick={() => updateField("employmentType", type.value)}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-primary" : "border-default-300"
                )}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className={cn("text-xs font-semibold uppercase tracking-wide", isSelected ? "text-primary-700 dark:text-primary-400" : "text-default-600")}>
                  {type.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Name Field */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-default-900">{t('pages.personalInformation1')}</label>
          <Input
            label={t('pages.fullName1')}
            labelPlacement="outside"
            placeholder={t('pages.enterFullName')}
            value={formData.name}
            onValueChange={v => updateField("name", v)}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            variant="bordered"
            radius="sm"
            isRequired
            className="max-w-md"
            classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            aria-label={t('aria.inputs.dateOfBirth')}
            label={t('pages.dateOfBirth2')}
            labelPlacement="outside"
            value={(() => {
              if (!formData.dob) return null;
              try {
                const dateStr = formData.dob.split('T')[0];
                // Validate the date string format (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  return parseDate(dateStr);
                }
                return null;
              } catch (e) {
                console.warn('Invalid DOB value:', formData.dob, e);
                return null;
              }
            })()}
            onChange={(date) => {
              if (!date) {
                updateField("dob", "");
                return;
              }
              try {
                // CalendarDate has .toString() which returns YYYY-MM-DD format
                const dateStr = date.toString();
                updateField("dob", dateStr);
              } catch (e) {
                console.warn('Error converting date:', e);
                updateField("dob", "");
              }
            }}
            variant="bordered"
            radius="sm"
            showMonthAndYearPickers
            isRequired
            isInvalid={!!errors.dob}
            errorMessage={errors.dob}
            portalContainer={document.body}
            className="w-full"
            classNames={{
              label: "text-xs font-medium text-default-600 mb-1",
              input: "cursor-pointer",
              inputWrapper: "cursor-pointer hover:border-primary-400 transition-colors data-[hover=true]:border-primary-400",
              group: "cursor-pointer"
            }}
            style={{
              pointerEvents: "auto"
            }}
          />

          <Select
            aria-label={t('aria.inputs.gender')}
            label={t('pages.gender1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.gender ? [formData.gender] : []}
            onSelectionChange={keys => updateField("gender", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            isRequired
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {genders.map(g => <SelectItem key={g}>{g}</SelectItem>)}
          </Select>
          <Input
            label={t('pages.fatherSName1')}
            labelPlacement="outside"
            placeholder={t('pages.fullName1')}
            value={formData.fatherName}
            onValueChange={v => updateField("fatherName", v)}
            variant="bordered"
            radius="sm"
            isRequired
            isInvalid={!!errors.fatherName}
            errorMessage={errors.fatherName}
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Select
            aria-label={t('aria.inputs.maritalStatus')}
            label={t('pages.maritalStatus1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.maritalStatus ? [formData.maritalStatus] : []}
            onSelectionChange={keys => updateField("maritalStatus", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {maritalStatuses.map(ms => <SelectItem key={ms}>{ms}</SelectItem>)}
          </Select>
          <Select
            aria-label={t('aria.inputs.bloodGroup')}
            label={t('pages.bloodGroup1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.bloodGroup ? [formData.bloodGroup] : []}
            onSelectionChange={keys => updateField("bloodGroup", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {bloodGroups.map(bg => <SelectItem key={bg}>{bg}</SelectItem>)}
          </Select>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4 pt-4 border-t border-dashed border-default-200">
        <label className="text-sm font-semibold text-default-900 block">{t('pages.contactDetails1')}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('pages.mobileNumber')}
            labelPlacement="outside"
            startContent={<span className="text-default-400 text-xs">+91</span>}
            placeholder={t('staff.form.mobilePlaceholder')}
            value={formData.phone}
            onValueChange={v => {
              if (v.length <= 10 && /^\d*$/.test(v)) updateField("phone", v);
            }}
            variant="bordered"
            radius="sm"
            isRequired
            isInvalid={!!errors.phone}
            errorMessage={errors.phone}
            classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          />

          <div className="space-y-2">
            <Input
              label={t('pages.whatsAppNumber')}
              labelPlacement="outside"
              startContent={<span className="text-default-400 text-xs">+91</span>}
              placeholder={t('pages.whatsAppNumber')}
              value={formData.whatsappNumber}
              onValueChange={v => updateField("whatsappNumber", v)}
              variant="bordered"
              radius="sm"
              isDisabled={formData.isWhatsapp}
              classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
            />
            <Checkbox
              classNames={{ label: "text-xs text-default-500" }}
              size="sm"
              isSelected={formData.isWhatsapp}
              onValueChange={v => {
                updateField("isWhatsapp", v);
                if (v) updateField("whatsappNumber", formData.phone);
              }}
            >
              Same as mobile
            </Checkbox>
          </div>


          <Input
            label={t('pages.emailAddress')}
            labelPlacement="outside"
            placeholder={t('pages.emailAddress')}
            value={formData.email}
            onValueChange={v => updateField("email", v)}
            variant="bordered"
            radius="sm"
            isInvalid={!!errors.email}
            errorMessage={errors.email}
            className="col-span-1 md:col-span-2"
            classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-default-900">{t('pages.address2')}</label>
        <Textarea
          placeholder={t('pages.fullResidentialAddress1')}
          value={formData.address}
          onValueChange={v => updateField("address", v)}
          maxLength={200}
          variant="bordered"
          radius="sm"
          minRows={2}
          description={`${formData.address.length} / 200 characters`}
          classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300" }}
        />
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-3 pt-4 border-t border-dashed border-default-200">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-default-900">{t('pages.emergencyContacts1')}</label>
          <Button size="sm" variant="light" color="primary" onPress={addEmergencyContact} startContent={<Plus size={14} />}>
            Add Contact
          </Button>
        </div>

        {formData.emergencyContacts.map((contact, index) => (
          <div key={contact.phone || index} className="p-4 border border-default-200 rounded-xl space-y-3 relative group hover:border-default-300 transition-colors">
            {formData.emergencyContacts.length > 1 && (
              <button
                className="absolute top-2 right-2 text-default-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeEmergencyContact(index)}
              >
                <X size={14} />
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder={t('pages.contactName')}
                value={contact.name}
                onValueChange={v => handleEmergencyContactChange(index, "name", v)}
                size="sm"
                radius="sm"
                variant="bordered"
                classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9" }}
              />
              <Input
                placeholder={t('pages.relationship')}
                value={contact.relationship}
                onValueChange={v => handleEmergencyContactChange(index, "relationship", v)}
                size="sm"
                radius="sm"
                variant="bordered"
                classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9" }}
              />
              <Input
                placeholder={t('pages.phoneNumber')}
                value={contact.phone}
                onValueChange={v => handleEmergencyContactChange(index, "phone", v)}
                size="sm"
                radius="sm"
                variant="bordered"
                isInvalid={!!errors[`emergencyPhone_${index}`]}
                errorMessage={errors[`emergencyPhone_${index}`]}
                startContent={<span className="text-default-400 text-xs">+91</span>}
                classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Photo Editor Modal */}
      {tempImage && (
        <PhotoEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          imageSrc={tempImage}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="space-y-4">
        <label className="text-sm font-semibold text-default-900 block">{t('pages.jobDetails')}</label>

        {/* Role Selection - Multiple */}
        <div className="space-y-2">
          <Select
            aria-label={t('aria.inputs.staffRoles')}
            label={t('pages.staffRoles1')}
            labelPlacement="outside"
            placeholder={t('pages.selectOneOrMoreRoles')}
            selectedKeys={new Set(formData.staffType ? (Array.isArray(formData.staffType) ? formData.staffType : [formData.staffType]) : [])}
            onSelectionChange={(keys) => {
              const selectedRoles = Array.from(keys);
              updateField("staffType", selectedRoles.length > 0 ? selectedRoles : []);
            }}
            selectionMode="multiple"
            variant="bordered"
            radius="sm"
            isRequired
            classNames={{ trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
            isInvalid={!!errors.staffType}
            errorMessage={errors.staffType}
          >
            {staffTypes.map((role) => (
              <SelectItem key={role}>{role}</SelectItem>
            ))}
          </Select>

          {/* Selected Roles Display */}
          {formData.staffType && formData.staffType.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {formData.staffType.map((role, idx) => (
                <Chip
                  key={role}
                  size="sm"
                  variant="flat"
                  color="primary"
                  onClose={() => {
                    const updatedRoles = formData.staffType.filter((_, i) => i !== idx);
                    updateField("staffType", updatedRoles);
                  }}
                >
                  {role}
                </Chip>
              ))}
            </div>
          )}
          <p className="text-xs text-default-500">{t('pages.selectAllApplicableRolesForThisStaffMember')}</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Staff ID / Number"
            labelPlacement="outside"
            placeholder={t('pages.autoGenerated')}
            value={formData.staffNumber}
            isReadOnly
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-default-100 dark:bg-default-100/50 border-1 border-default-200 h-10" }}
            description={formData.staffNumber ? "Staff ID" : "Will be auto-generated by the server"}
          />

          <Select
            label={t('pages.department1')}
            labelPlacement="outside"
            placeholder={t('pages.selectDepartment')}
            selectedKeys={formData.department ? [formData.department] : []}
            onSelectionChange={(keys) => updateField("department", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            isRequired
            isInvalid={!!errors.department}
            errorMessage={errors.department}
            classNames={{ trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {departments.map((dept) => (
              <SelectItem key={dept}>{dept}</SelectItem>
            ))}
          </Select>
        </div>

        {(Array.isArray(formData.staffType) ? formData.staffType.includes("Teacher") : formData.staffType === "Teaching") && (
          <div className="space-y-4 pt-4 border-t border-dashed border-default-200">
            {/* Show Class Teacher First */}
            <div className="flex flex-col gap-2 p-4 border border-default-200 rounded-xl bg-default-50/50">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-default-900">{t('pages.asClassTeacher')}</span>
                  <span className="text-xs text-default-500">{t('pages.isThisStaffMemberAClassTeacher')}</span>
                </div>
                <Switch
                  size="sm"
                  isSelected={formData.isClassTeacher}
                  onValueChange={(v) => updateField("isClassTeacher", v)}
                />
              </div>

              {formData.isClassTeacher && (
                <Select
                  className="mt-2"
                  label={t('pages.selectClass1')}
                  placeholder={t('staff.form.selectClassPlaceholder')}
                  isLoading={loadingClasses}
                  selectedKeys={formData.classTeacherOf ? [formData.classTeacherOf] : []}
                  onSelectionChange={(keys) => updateField("classTeacherOf", Array.from(keys)[0])}
                  variant="bordered"
                  radius="sm"
                  size="sm"
                  isDisabled={loadingClasses}
                  classNames={{ trigger: "bg-white dark:bg-default-100 border-1 border-default-200" }}
                >
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id}>{cls.displayName}</SelectItem>
                  ))}
                </Select>
              )}
            </div>

            {/* Then Show Assign Classes for subject teaching */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-default-900">{t('pages.assignClassesForSubjectTeaching')}</label>
              <Select
                selectionMode="multiple"
                placeholder={t('staff.form.selectClassesPlaceholder')}
                isLoading={loadingClasses}
                selectedKeys={new Set(formData.assignedClasses)}
                onSelectionChange={(keys) => updateField("assignedClasses", Array.from(keys))}
                variant="bordered"
                radius="sm"
                isDisabled={loadingClasses}
                classNames={{ trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 min-h-unit-10" }}
              >
                {availableClasses.map((cls) => (
                  <SelectItem key={cls.id}>{cls.displayName}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-end mb-2 border-b border-default-100 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-default-900">{t('pages.educationDetails')}</h3>
          <p className="text-xs text-danger-500 mt-0.5">* At least one degree is required</p>
        </div>
        {formData.professionalQualifications.length > 0 && (
          <button
            type="button"
            onClick={addQualification}
            className="h-8 text-xs font-medium text-primary hover:text-primary-600 hover:underline px-2 flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <Plus size={14} />
            Add Degree
          </button>
        )}
      </div>

      <div className="space-y-4">
        {formData.professionalQualifications.map((qual, i) => (
          <div key={`qualification-${i}`} className="p-4 border border-default-200 rounded-xl space-y-4 relative group hover:border-default-300 transition-colors bg-default-50/20">
            <button
              className="absolute top-3 right-3 text-default-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-default-100 rounded-lg"
              onClick={() => removeQualification(i)}
            >
              <X size={14} />
            </button>

            <div className="grid grid-cols-12 gap-3 pr-8">
              <div className="col-span-8">
                <Autocomplete
                  label="Degree / Certificate"
                  labelPlacement="outside"
                  placeholder={t('pages.selectOrTypeDegree')}
                  defaultItems={degreeOptions}
                  inputValue={qual.name}
                  onInputChange={(v) => updateQualification(i, "name", v)}
                  allowsCustomValue
                  isRequired
                  variant="bordered"
                  radius="sm"
                  size="sm"
                  classNames={{
                    base: "max-w-full",
                    trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9 min-h-unit-8"
                  }}
                  isInvalid={!!errors[`qualName_${i}`]}
                  errorMessage={errors[`qualName_${i}`]}
                >
                  {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
                </Autocomplete>
              </div>
              <div className="col-span-4">
                <Input
                  label={t('pages.year1')}
                  labelPlacement="outside"
                  placeholder={t('pages.year1')}
                  value={qual.year}
                  onValueChange={v => {
                    if (v.length <= 4 && /^\d*$/.test(v)) updateQualification(i, "year", v);
                  }}
                  variant="bordered"
                  radius="sm"
                  size="sm"
                  isInvalid={!!errors[`qualYear_${i}`]}
                  errorMessage={errors[`qualYear_${i}`]}
                  classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9" }}
                />
              </div>
            </div>

            {/* Document Upload for this qualification */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  className="h-8 text-xs bg-default-100 text-default-600 hover:bg-default-200"
                  onPress={() => document.getElementById(`qual-doc-${i}`).click()}
                  startContent={<Upload size={14} />}
                >
                  Upload Certificate
                </Button>
                {qual.documents && qual.documents.length > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    className="h-8 text-xs text-primary font-medium"
                    startContent={<FileScan size={14} />}
                    onPress={() => { /* Add logic later */ }}
                  >
                    Extract Info
                  </Button>
                )}
              </div>

              <input
                id={`qual-doc-${i}`}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleQualificationDocUpload(i, e.target.files)}
              />

              {qual.documents && qual.documents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 align-middle ml-auto">
                  {qual.documents.map((file, docIdx) => (
                    <Chip
                      key={docIdx}
                      size="sm"
                      variant="flat"
                      onClose={() => removeQualificationDoc(i, docIdx)}
                      classNames={{ base: "h-6 text-xs bg-success-50 text-success-700" }}
                      startContent={<Check size={12} />}
                    >
                      {file.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {formData.professionalQualifications.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-default-200 rounded-xl bg-default-50/30 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center text-default-400">
              <GraduationCap size={20} />
            </div>
            <div className="text-xs text-default-500">
              No degrees added. <span className="text-danger">*Required</span>
            </div>
            <button
              type="button"
              onClick={addQualification}
              className="text-xs font-medium text-primary hover:text-primary-600 hover:underline bg-transparent border-none cursor-pointer"
            >
              Add Degree
            </button>
          </div>
        )}
        {errors.qualifications && <p className="text-xs text-danger">{errors.qualifications}</p>}
      </div>

      <div className="space-y-4 pt-6 border-t border-dashed border-default-200">
        <label className="text-sm font-semibold text-default-900 block">{t('pages.experience')}</label>

        <div className="space-y-3">
          {/* Row 1: Org Name (Flex) and Years (Fixed small width) */}
          <div className="flex gap-4">
            <Input
              label={t('pages.previousOrganization')}
              labelPlacement="outside"
              placeholder={t('pages.organizationName')}
              value={formData.previousOrganization}
              onValueChange={v => updateField("previousOrganization", v)}
              variant="bordered"
              radius="sm"
              className="flex-1"
              classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
            />
            <Input
              label={t('pages.expYears')}
              labelPlacement="outside"
              placeholder={t('staff.form.experiencePlaceholder')}
              value={formData.totalExperience}
              onValueChange={v => {
                // Only allow numbers and limit to 2 digits
                const numericValue = v.replace(/\D/g, '').slice(0, 2);
                updateField("totalExperience", numericValue);
              }}
              variant="bordered"
              radius="sm"
              className="w-28"
              classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
              maxLength={2}
            />
          </div>

          {/* Row 2: Role in Organization */}
          <Input
            label="Role / Designation"
            labelPlacement="outside"
            placeholder={t('staff.form.designationPlaceholder')}
            value={formData.roleInOrganization}
            onValueChange={v => updateField("roleInOrganization", v)}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    // Helper function to find document by type
    const findDocByType = (type) => formData.idDocuments.find(doc => doc.type === type);

    return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* Identity Docs & Proofs */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-default-900">{t('pages.documentsProofs')}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {idProofTypes.map((type) => {
              const doc = findDocByType(type);
              return (
                <div key={type} className="flex items-center justify-between p-3 border border-default-200 rounded-lg bg-default-50/50 hover:bg-default-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileBadge size={16} className="text-default-500" />
                    <span className="text-sm font-medium text-default-700">{type}</span>
                  </div>
                  {doc ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-success-600 font-medium truncate max-w-[100px]">{doc.name}</span>
                      <button onClick={() => removeIDProof(type)} className="text-default-400 hover:text-danger p-1 rounded-full hover:bg-default-200">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button className="text-xs font-semibold text-primary hover:text-primary-600 transition-colors px-2 py-1">
                        Upload
                      </button>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleIDProofUpload(type, e.target.files)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-semibold text-default-900">{t('pages.otherCertificates1')}</label>
            <div
              className="border border-dashed border-default-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-default-50 transition-colors text-center"
              onClick={() => qualDocsInputRef.current?.click()}
            >
              <div className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center text-default-500">
                <Upload size={16} />
              </div>
              <span className="text-xs text-default-600">{t('pages.clickToUploadScannedDocuments')}</span>
              <input ref={qualDocsInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => handleFileUpload("qualificationDocs", e.target.files)} />
            </div>
            {formData.qualificationDocs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.qualificationDocs.map((file, i) => (
                  <Chip key={`doc-${file.name}-${i}`} onClose={() => removeFile("qualificationDocs", i)} size="sm" variant="flat" className="text-xs h-7 bg-default-100">
                    {file.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    // Salary Templates Local Logic
    const salaryTemplates = [
      { name: "Teacher", breakdown: [{ component: "Basic Salary", amount: 25000 }, { component: "HRA", amount: 10000 }, { component: "Allowance", amount: 5000 }] },
      { name: "Assistant", breakdown: [{ component: "Basic Salary", amount: 18000 }, { component: "HRA", amount: 7000 }] },
    ];

    const handleTemplateChange = (templateName) => {
      const template = salaryTemplates.find(t => t.name === templateName);
      if (template) {
        updateField("salaryTemplate", templateName);
        updateField("salaryBreakdown", template.breakdown);
      }
    };

    const updateBreakdownItem = (index, field, value) => {
      const updated = [...formData.salaryBreakdown];
      updated[index][field] = field === "amount" ? Number(value) : value;
      updateField("salaryBreakdown", updated);
    };

    const totalSalary = formData.salaryBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* Bank Details */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-default-900">{t('pages.bankDetails')}</label>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('pages.accountNumber')} labelPlacement="outside" placeholder={t('pages.accountNo')} value={formData.accountNumber} onValueChange={v => updateField("accountNumber", v)} variant="bordered" radius="sm" classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }} />
            <Input label={t('pages.iFSCCode')} labelPlacement="outside" placeholder={t('pages.iFSCEGSbin0001234')} value={formData.ifscCode} onValueChange={v => updateField("ifscCode", v)} variant="bordered" radius="sm" errorMessage={errors.ifscCode} classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }} />
            <Input label={t('pages.bankName')} labelPlacement="outside" placeholder={t('pages.bankName')} value={formData.bankName} onValueChange={v => updateField("bankName", v)} variant="bordered" radius="sm" classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }} />
            <Input label={t('pages.branchName')} labelPlacement="outside" placeholder={t('pages.branch')} value={formData.branchName} onValueChange={v => updateField("branchName", v)} variant="bordered" radius="sm" classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }} />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-dashed border-default-200">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-default-900">{t('pages.salaryStructure1')}</label>
            <Select
              size="sm"
              placeholder={t('pages.loadTemplate')}
              className="w-32"
              selectedKeys={formData.salaryTemplate ? [formData.salaryTemplate] : []}
              onSelectionChange={keys => handleTemplateChange(Array.from(keys)[0])}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "h-8 min-h-0" }}
            >
              {salaryTemplates.map(t => <SelectItem key={t.name}>{t.name}</SelectItem>)}
            </Select>
          </div>

          <div className="border border-default-200 rounded-lg overflow-hidden">
            {formData.salaryBreakdown.map((item, i) => (
              <div key={`salary-${i}`} className="flex items-center gap-2 p-2 border-b border-default-100 last:border-0 hover:bg-default-50">
                <Input
                  size="sm"
                  value={item.component}
                  onValueChange={v => updateBreakdownItem(i, "component", v)}
                  variant="flat"
                  placeholder={t('pages.enterComponentName')}
                  classNames={{ inputWrapper: "bg-transparent shadow-none" }}
                />
                <Input
                  size="sm"
                  type="number"
                  value={item.amount}
                  onValueChange={v => updateBreakdownItem(i, "amount", v)}
                  variant="flat"
                  placeholder={t('staff.form.amountPlaceholder')}
                  startContent="₹"
                  classNames={{ inputWrapper: "bg-transparent shadow-none w-24" }}
                />
                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => updateField("salaryBreakdown", formData.salaryBreakdown.filter((_, idx) => idx !== i))}><X size={14} /></Button>
              </div>
            ))}
            <Button fullWidth variant="light" size="sm" className="text-default-500 font-medium" onPress={() => updateField("salaryBreakdown", [...formData.salaryBreakdown, { component: "", amount: 0 }])}>+ Add Component</Button>
          </div>

          <div className="flex justify-between items-center px-2 pt-2">
            <span className="text-sm font-medium text-default-600">{t('pages.totalSalary')}</span>
            <span className="text-lg font-bold text-default-900">₹{totalSalary.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const steps = useMemo(() => [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Job Details", icon: Briefcase },
    { number: 3, title: "Education", icon: GraduationCap },
    { number: 4, title: "Documents", icon: FileText },
    { number: 5, title: "Payroll", icon: Banknote }
  ], []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Permission Warning */}
      {!canEdit && (
        <div className="px-8 py-3 bg-warning-50 border-b border-warning-200">
          <div className="flex items-center gap-2 text-warning-700">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">
              {editingStaff
                ? "You don't have permission to edit staff members. All fields are read-only."
                : "You don't have permission to create staff members."}
            </span>
          </div>
        </div>
      )}

      {/* Elegant Stepper */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between relative">
          {/* Dashed Line Background */}
          <div className="absolute top-[20px] left-0 right-0 h-[1.5px] border-t-2 border-dashed border-default-200 -z-0" />

          {steps.map((s, i) => {
            const isActive = step >= s.number;
            const isCurrent = step === s.number;
            return (
              <div key={s.number} className="flex flex-col items-center relative z-10 bg-white dark:bg-black px-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCurrent ? "border-primary text-primary bg-primary-50 dark:bg-primary-900/20" :
                    isActive ? "border-primary text-white bg-primary" :
                      "border-default-200 text-default-400 bg-white dark:bg-default-50"
                )}>
                  <s.icon size={18} strokeWidth={2} />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold mt-2 uppercase tracking-wide",
                  isCurrent ? "text-primary" : "text-default-400"
                )}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 flex justify-center gap-4 border-t border-default-100">
        <Button
          className="w-32 font-medium"
          variant="light"
          onPress={handleClose}
        >
          Cancel
        </Button>
        {step > 1 && (
          <Button
            className="w-32 font-medium border-default-200 text-default-700"
            variant="bordered"
            onPress={handlePrev}
          >
            Back
          </Button>
        )}
        <Button
          className="w-32 font-medium shadow-lg shadow-primary/20"
          color="primary"
          onPress={step === 5 ? handleSubmit : handleNext}
          isDisabled={isSubmitting || !canEdit}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" color="white" />
              {step === 5 ? (editingStaff ? "Updating..." : "Creating...") : "Processing..."}
            </span>
          ) : (
            step === 5 ? (editingStaff ? "Update Staff" : "Create Staff") : "Next"
          )}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmClose} onClose={cancelClose} size="sm" isDismissable={false} hideCloseButton portalContainer={document.body} classNames={{ base: "z-[999999]", wrapper: "z-[999999]", backdrop: "z-[999999]" }}>
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center">
            <AlertTriangle size={20} className="text-warning" />
            <span>{t('pages.unsavedChanges')}</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={cancelClose}>
              Continue Editing
            </Button>
            <Button color="danger" onPress={confirmClose}>
              Discard Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraCaptureOpen}
        onClose={() => setIsCameraCaptureOpen(false)}
        onPhotoCaptured={handleCameraPhotoCapture}
      />

      {/* Class & Subject Management Modal */}
      <ClassSubjectManagementModal
        isOpen={showClassSubjectModal}
        onClose={() => {
          setShowClassSubjectModal(false);
          onClose();
        }}
        staffId={createdStaffId}
        staffName={createdStaffName}
      />
    </div>
  );
});

export default AddStaff;