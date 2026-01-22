import { useState, useRef, useEffect } from "react";
import { Button, Input, Select, SelectItem, Checkbox, Textarea, Chip, Avatar, RadioGroup, Radio, cn, Divider } from "@heroui/react";
import { ArrowLeft, ArrowRight, Upload, X, Plus, User, FileText, Users, GraduationCap, Check, Heart, Bus } from "lucide-react";
import { studentsApi, settingsApi, uploadApi } from "../../services/api";
import toast from "react-hot-toast";
import PhotoEditorModal from "../../components/PhotoEditorModal";

// --- Constants ---
const genders = ["Male", "Female", "Other"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const parentRelationships = ["Father", "Mother"];
const guardianRelationships = ["Grandparent", "Uncle", "Aunt", "Sibling", "Other"];
const academicYears = ["2024-25", "2025-26", "2023-24"];

const emptyForm = {
  // Personal Information
  fullName: "", admissionId: "", academicYear: "2024-25", dateOfBirth: "", gender: "Male",
  picture: null, aadhaarNumber: "", bloodGroup: "", nationality: "", religion: "",
  category: "", motherTongue: "", previousSchool: "", tcNumber: "",
  // Class Info
  class: "", section: "", rollNumber: "",
  // Contact
  mobile: "", isWhatsapp: true, whatsappNumber: "", email: "", address: "", city: "", state: "", zipCode: "",
  // Parent/Guardian 1
  parents: [{
    name: "", relationship: "Father", phone: "", email: "", occupation: "", isWhatsapp: true, isParent: true
  }],
  alternatePhone: "",
  // Siblings (in same school only)
  siblings: [],
  // Health & Safety
  medicalConditions: "", emergencyContactName: "", emergencyContactPhone: "",
  // Transport & Hostel
  transportRequired: false, hostelRequired: false,
  // Documents
  birthCertificate: null, transferCertificate: null, aadhaarFront: null, aadhaarBack: null, studentPhoto: null, otherDocuments: []
};

export default function AddStudent({ onClose, onSave, classOptions = [], classesWithTeachers = [], initialData = null }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      // Map initialData (student object) to form structure
      return {
        ...emptyForm,
        ...initialData,
        fullName: initialData.name || "",
        mobile: initialData.phone || "",
        picture: initialData.photo || null, // Map photo URL to picture field
        rollNumber: initialData.rollNo?.toString() || "", // Map rollNo to rollNumber
        // Ensure parents array is populated
        parents: initialData.parents?.length > 0 ? initialData.parents : [{
          name: initialData.parentName || "",
          relationship: initialData.parentRelationship || "Father",
          phone: initialData.parentPhone || "",
          email: initialData.parentEmail || "",
          occupation: initialData.parentOccupation || "",
          isWhatsapp: true,
          isParent: true
        }],
        // Siblings array
        siblings: initialData.siblings || [],
        // Class is already in "X-A" format from backend, use it directly
        class: initialData.class || "",
      };
    }
    return emptyForm;
  });
  const [errors, setErrors] = useState({});
  const [documentConfigs, setDocumentConfigs] = useState([]);
  const scrollContainerRef = useRef(null);

  // Photo Editor State
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);

  // Refs
  const pictureInputRef = useRef(null);
  const birthCertRef = useRef(null);
  const tcRef = useRef(null);
  const aadhaarFrontRef = useRef(null);
  const aadhaarBackRef = useRef(null);
  const photoRef = useRef(null);
  const otherDocsRef = useRef(null);

  // Error field refs for auto-scroll
  const fullNameRef = useRef(null);
  const dobRef = useRef(null);
  const genderRef = useRef(null);
  const classRef = useRef(null);
  const admissionIdRef = useRef(null);
  const parentNameRef = useRef(null);
  const parentPhoneRef = useRef(null);

  // Load document configuration and auto-generate admission ID
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        // Load document configuration
        const docConfigs = await settingsApi.getDocumentConfig();
        setDocumentConfigs(docConfigs);
        console.log('📄 Document configs loaded:', docConfigs);

        // Auto-generate admission ID only for new students
        if (!initialData) {
          console.log('🔄 Fetching next admission ID...');
          const response = await studentsApi.getNextAdmissionId();
          console.log('✅ Admission ID received:', response);

          if (response && response.admissionId) {
            updateField("admissionId", response.admissionId);
            console.log('✅ Admission ID set to:', response.admissionId);
          } else {
            console.error('❌ Invalid response format:', response);
            toast.error('Failed to generate admission ID');
          }
        }
      } catch (error) {
        console.error('❌ Error loading configurations:', error);
        toast.error('Failed to load admission settings: ' + error.message);
      }
    };
    loadConfigurations();
  }, [initialData]);

  // Auto-generate roll number when class is selected
  useEffect(() => {
    const generateRollNumber = async () => {
      if (formData.class && !initialData) {
        try {
          const selectedClass = classesWithTeachers.find(c => `${c.name}-${c.section}` === formData.class);
          if (selectedClass) {
            // Use optimized API endpoint
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/classes/${selectedClass.id}/next-roll-number`);
            const data = await response.json();
            updateField("rollNumber", data.rollNumber.toString());
            console.log('✅ Roll number set to:', data.rollNumber);
          }
        } catch (error) {
          console.error('❌ Error generating roll number:', error);
          // Set to 1 as fallback
          updateField("rollNumber", "1");
        }
      }
    };
    generateRollNumber();
  }, [formData.class, initialData, classesWithTeachers]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateParent = (index, field, value) => {
    const updated = [...formData.parents];
    updated[index] = { ...updated[index], [field]: value };
    updateField("parents", updated);
  };

  const addParent = () => {
    if (formData.parents.length < 3) {
      updateField("parents", [...formData.parents, { name: "", relationship: "Mother", phone: "", email: "", occupation: "", isWhatsapp: true, isParent: true }]);
    }
  };

  const removeParent = (index) => {
    if (formData.parents.length > 1) {
      updateField("parents", formData.parents.filter((_, i) => i !== index));
    }
  };

  const updateSibling = (index, field, value) => {
    const updated = [...formData.siblings];
    updated[index] = { ...updated[index], [field]: value };
    updateField("siblings", updated);
  };

  const addSibling = () => {
    updateField("siblings", [...formData.siblings, { name: "", inSameSchool: true, classId: "" }]);
  };

  const removeSibling = (index) => {
    updateField("siblings", formData.siblings.filter((_, i) => i !== index));
  };

  const handleFileUpload = (field, file) => {
    if (file) {
      updateField(field, file);
    }
  };

  const handleMultiFileUpload = (field, files) => {
    if (files && files.length > 0) {
      updateField(field, [...formData[field], ...Array.from(files)]);
    }
  };

  const removeFile = (field, index) => {
    // Prevent event propagation is handled in the calling component event

    // Check if it's a multi-file field like otherDocuments
    if (field === "otherDocuments" && Array.isArray(formData[field])) {
      updateField(field, formData[field].filter((_, i) => i !== index));
    } else {
      // For single file fields
      updateField(field, null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageForEdit(reader.result);
        setIsPhotoEditorOpen(true);
        // Reset so we can select same file again if needed
        e.target.value = null;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSave = (croppedImage) => {
    // croppedImage is a data URL (string)
    // We can convert it to a File/Blob if needed, but for now assuming direct usage or handling in submit
    // Ideally convert dataURL to Blob/File to stay consistent with File object structure

    // Helper to convert dataURL to File
    const dataURLtoFile = (dataurl, filename) => {
      let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    }

    const file = dataURLtoFile(croppedImage, "profile_photo.jpg");
    updateField("picture", file);
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    if (stepNum === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Required";

      // Validate date of birth (expects DD/MM/YYYY format)
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Required";
      } else {
        // Check if it's in proper DD/MM/YYYY format (user input format)
        const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!datePattern.test(formData.dateOfBirth)) {
          newErrors.dateOfBirth = "Please enter a valid date in DD/MM/YYYY format";
        } else {
          // Additional validation for the date values
          const [day, month, year] = formData.dateOfBirth.split('/').map(Number);
          const currentYear = new Date().getFullYear();
          if (year >= currentYear || year < 1900) {
            newErrors.dateOfBirth = `Year must be between 1900 and ${currentYear - 1}`;
          } else if (month < 1 || month > 12) {
            newErrors.dateOfBirth = "Invalid month";
          } else if (day < 1 || day > 31) {
            newErrors.dateOfBirth = "Invalid day";
          } else {
            // Check true calendar validity (e.g., reject Feb 30)
            const date = new Date(year, month - 1, day);
            const isValidDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
            if (!isValidDate) {
              newErrors.dateOfBirth = "Invalid calendar date";
            }
          }
        }
      }

      if (!formData.gender) newErrors.gender = "Required";
      if (!formData.admissionId.trim()) newErrors.admissionId = "Required";
      if (!formData.class) newErrors.class = "Required";
    }
    if (stepNum === 2) {
      if (formData.parents.length === 0 || !formData.parents[0].name.trim()) {
        newErrors.parentName = "At least one parent/guardian is required";
      }
      if (formData.parents[0] && !formData.parents[0].phone.trim()) {
        newErrors.parentPhone = "Phone is required";
      } else if (formData.parents[0] && !/^\d{10}$/.test(formData.parents[0].phone)) {
        newErrors.parentPhone = "Invalid phone (10 digits)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToError = (stepNum) => {
    // Scroll to the first error field
    setTimeout(() => {
      if (stepNum === 1) {
        if (errors.fullName && fullNameRef.current) {
          fullNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errors.dateOfBirth && dobRef.current) {
          dobRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errors.gender && genderRef.current) {
          genderRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errors.admissionId && admissionIdRef.current) {
          admissionIdRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errors.class && classRef.current) {
          classRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (stepNum === 2) {
        if (errors.parentName && parentNameRef.current) {
          parentNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errors.parentPhone && parentPhoneRef.current) {
          parentPhoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
      // Scroll to top when moving to next step
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to first error
      scrollToError(step);
    }
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    // Validate all steps before submitting
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);

    if (!step1Valid || !step2Valid) {
      // Go back to the first invalid step
      if (!step1Valid) {
        setStep(1);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        toast.error('Please fill in all required fields in Personal Information');
        scrollToError(1);
      } else if (!step2Valid) {
        setStep(2);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        toast.error('Please fill in all required parent/guardian information');
        scrollToError(2);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the classId from the selected class
      const selectedClass = classesWithTeachers.find(c => `${c.name}-${c.section}` === formData.class);

      if (!selectedClass) {
        console.error('❌ Selected class not found!');
        console.error('❌ Looking for class:', formData.class);
        console.error('❌ Available classes:', classesWithTeachers.map(c => ({ id: c.id, name: c.name, section: c.section })));
        toast.error('Selected class not found');
        setIsSubmitting(false);
        return;
      }

      if (!selectedClass.id) {
        console.error('❌ Selected class has no ID!', selectedClass);
        toast.error('Class ID is missing. Please refresh and try again.');
        setIsSubmitting(false);
        return;
      }

      // Upload photo to Cloudinary if it's a File object
      let photoUrl = null;
      if (formData.picture instanceof File) {
        console.log('📸 Uploading photo to Cloudinary...');
        const loadingToast = toast.loading("Uploading photo...");
        try {
          const uploadResponse = await uploadApi.uploadFile(formData.picture);
          photoUrl = uploadResponse.url;
          console.log('✅ Photo uploaded:', photoUrl);
          toast.success("Photo uploaded", { id: loadingToast });
        } catch (error) {
          console.error('❌ Photo upload failed:', error);
          toast.error("Photo upload failed", { id: loadingToast });
          // Continue without photo
        }
      } else if (typeof formData.picture === 'string' && formData.picture.length > 0) {
        // If it's already a URL string (editing existing student)
        photoUrl = formData.picture;
        console.log('✅ Using existing photo URL:', photoUrl);
      }

      // Transform data for saving
      // Convert date from DD/MM/YYYY to YYYY-MM-DD for database storage
      let formattedDateOfBirth = formData.dateOfBirth;
      if (formData.dateOfBirth && formData.dateOfBirth.includes('/')) {
        const [day, month, year] = formData.dateOfBirth.split('/');
        formattedDateOfBirth = `${year}-${month}-${day}`;
      }

      const studentData = {
        name: formData.fullName,
        admissionId: formData.admissionId,
        academicYear: formData.academicYear,
        classId: selectedClass?.id,
        rollNo: formData.rollNumber ? parseInt(formData.rollNumber) : null,
        gender: formData.gender,
        dateOfBirth: formattedDateOfBirth,
        bloodGroup: formData.bloodGroup,
        email: formData.email,
        phone: formData.mobile,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        parentName: formData.parents[0]?.name,
        parentPhone: formData.parents[0]?.phone,
        parentEmail: formData.parents[0]?.email,
        parentRelationship: formData.parents[0]?.relationship,
        parentOccupation: formData.parents[0]?.occupation,
        parents: formData.parents,
        siblings: formData.siblings,
        aadhaarNumber: formData.aadhaarNumber,
        nationality: formData.nationality,
        religion: formData.religion,
        category: formData.category,
        motherTongue: formData.motherTongue,
        previousSchool: formData.previousSchool,
        tcNumber: formData.tcNumber,
        transportRequired: formData.transportRequired,
        hostelRequired: formData.hostelRequired,
        medicalConditions: formData.medicalConditions,
        // Use the uploaded photo URL (not the File object)
        photo: photoUrl,
        // Preserve existing documents when editing (don't include documents field to avoid overwriting)
        // Documents are managed separately via the dedicated documents endpoint

        status: initialData?.status || "active",
        feeStatus: initialData?.feeStatus || "pending"
      };

      // Remove undefined values and empty objects to prevent MongoDB cast errors
      Object.keys(studentData).forEach(key => {
        if (studentData[key] === undefined) {
          delete studentData[key];
        }
        // Remove empty objects (like photo: {})
        if (typeof studentData[key] === 'object' &&
          studentData[key] !== null &&
          !Array.isArray(studentData[key]) &&
          !(studentData[key] instanceof File) &&
          Object.keys(studentData[key]).length === 0) {
          delete studentData[key];
        }
      });

      console.log('📤 Submitting student data:', studentData);
      console.log('📤 Class ID being sent:', studentData.classId);
      console.log('📤 Selected class:', selectedClass);

      await onSave(studentData);
      // Success toast is shown in parent component
      // Loading state will be reset when drawer closes
    } catch (error) {
      console.error('Error submitting student:', error);
      // Error toast is shown in parent component
      setIsSubmitting(false); // Reset loading state on error
    }
  };

  // --- Render Steps ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Admission Details - At the top */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-default-900">Admission Details</label>
        <div className="grid grid-cols-2 gap-4">
          <div ref={admissionIdRef}>
            <Input
              label="Admission ID"
              labelPlacement="outside"
              placeholder="e.g., ADM2024001"
              value={formData.admissionId}
              onValueChange={v => updateField("admissionId", v)}
              isInvalid={!!errors.admissionId}
              errorMessage={errors.admissionId}
              variant="bordered"
              radius="sm"
              isRequired
              isReadOnly
              description="Auto-generated from settings"
              classNames={{ inputWrapper: "bg-default-50 border-1 border-default-200 h-10" }}
            />
          </div>
          <Select
            label="Academic Year"
            labelPlacement="outside"
            placeholder="Select..."
            selectedKeys={formData.academicYear ? [formData.academicYear] : []}
            onSelectionChange={keys => updateField("academicYear", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {academicYears.map(y => <SelectItem key={y}>{y}</SelectItem>)}
          </Select>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex items-center gap-5 pt-2 border-t border-solid border-default-200">
        {formData.picture ? (
          <Avatar
            src={formData.picture instanceof File ? URL.createObjectURL(formData.picture) : formData.picture}
            className="w-20 h-20 text-3xl"
            isBordered
            radius="full"
            color="primary"
          />
        ) : (
          <div className="w-20 h-20 rounded-full border-2 border-default-200 bg-default-50 flex items-center justify-center">
            <User size={32} className="text-default-400" />
          </div>
        )}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-semibold text-primary hover:text-primary-600 transition-colors cursor-pointer"
              onClick={() => pictureInputRef.current?.click()}
            >
              {formData.picture ? "Change Photo" : "Upload Photo"}
            </button>
            {formData.picture && (
              <>
                <span className="text-default-300">|</span>
                <button
                  className="text-sm font-semibold text-danger hover:text-danger-600 transition-colors cursor-pointer"
                  onClick={() => updateField("picture", null)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-default-500 max-w-[250px]">
            Upload a passport-size photo of the student
          </p>
          <input ref={pictureInputRef} type="file" accept="image/*" className="hidden"
            onChange={handleFileSelect} />
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-2" ref={fullNameRef}>
        <label className="text-sm font-semibold text-default-900">Personal Information</label>
        <Input
          label="Full Name"
          labelPlacement="outside"
          placeholder="Enter student's full name"
          value={formData.fullName}
          onValueChange={v => updateField("fullName", v)}
          isInvalid={!!errors.fullName}
          errorMessage={errors.fullName}
          variant="bordered"
          radius="sm"
          isRequired
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div ref={dobRef}>
          <Input
            type="text"
            label="Date of Birth"
            labelPlacement="outside"
            placeholder="DD/MM/YYYY"
            value={(() => {
              if (!formData.dateOfBirth) return '';
              // Check if it's already in DD/MM/YYYY format (partial input)
              if (formData.dateOfBirth.includes('/')) {
                return formData.dateOfBirth;
              }
              // Convert from YYYY-MM-DD to DD/MM/YYYY
              const parts = formData.dateOfBirth.split('-');
              if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
              }
              return formData.dateOfBirth;
            })()}
            onValueChange={v => {
              // 1. Keep strictly digits
              const digits = v.replace(/\D/g, '');

              // Prevent typing more than 8 digits
              if (digits.length > 8) return;

              // 2. Validate chunks & BLOCK invalid inputs
              const currentYear = new Date().getFullYear();

              // Check Day
              if (digits.length >= 2) {
                const day = parseInt(digits.slice(0, 2));
                if (day > 31 || day === 0) return;
              }
              // Strict check for first digit of day? (Optional, but "32" block is covered above)
              // If digit[0] > 3, it's impossible for day (unless single digit, but we expect 0X).
              if (digits.length >= 1) {
                const d1 = parseInt(digits[0]);
                if (d1 > 3) return; // Block 4-9 as first digit
              }


              // Check Month
              if (digits.length >= 4) {
                const month = parseInt(digits.slice(2, 4));
                if (month > 12 || month === 0) return;
              }
              // Strict check for first digit of month
              if (digits.length >= 3) {
                const m1 = parseInt(digits[2]);
                if (m1 > 1) return; // Block 2-9 as first digit of month
              }

              // Check Year
              if (digits.length >= 8) {
                const year = parseInt(digits.slice(4, 8));
                if (year >= currentYear) return;
              }

              // 3. Format with slashes
              let formatted = digits;
              if (digits.length > 2) {
                formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
              }
              if (digits.length > 4) {
                formatted = `${formatted.slice(0, 5)}/${digits.slice(4)}`;
              }

              // Update State
              updateField("dateOfBirth", formatted);

              // 4. Clear errors if potentially valid, or set calendar error if full date is invalid (e.g., Feb 30)
              if (digits.length === 8) {
                const day = parseInt(digits.slice(0, 2));
                const month = parseInt(digits.slice(2, 4));
                const year = parseInt(digits.slice(4, 8));

                // Check true calendar validity
                const date = new Date(year, month - 1, day);
                const isValidDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

                if (!isValidDate) {
                  setErrors(prev => ({ ...prev, dateOfBirth: "Invalid calendar date" }));
                } else {
                  setErrors(prev => ({ ...prev, dateOfBirth: null }));
                }
              } else {
                // Clear error while typing (unless empty/required check happens elsewhere)
                if (errors.dateOfBirth) setErrors(prev => ({ ...prev, dateOfBirth: null }));
              }
            }}
            isInvalid={!!errors.dateOfBirth}
            errorMessage={errors.dateOfBirth}
            variant="bordered"
            radius="sm"
            isRequired
            description="Format: DD/MM/YYYY"
            endContent={<span className="text-default-400 text-xs">DD/MM/YYYY</span>}
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
        </div>
        <div className="space-y-1" ref={genderRef}>
          <label className="text-xs font-medium text-default-600">Gender <span className="text-danger">*</span></label>
          <RadioGroup
            orientation="horizontal"
            value={formData.gender}
            onValueChange={v => updateField("gender", v)}
            classNames={{ wrapper: "gap-4" }}
            isInvalid={!!errors.gender}
            errorMessage={errors.gender}
          >
            {genders.map(g => (
              <Radio key={g} value={g} size="sm" classNames={{ label: "text-sm" }}>{g}</Radio>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Class Info */}
      <div className="space-y-2 pt-2 border-t border-solid border-default-200">
        <label className="text-sm font-semibold text-default-900 block mt-2">Class Information</label>
        <div className="grid grid-cols-2 gap-4">
          <div ref={classRef}>
            <Select
              label="Class"
              labelPlacement="outside"
              placeholder="Select..."
              selectedKeys={formData.class ? [formData.class] : []}
              onSelectionChange={keys => updateField("class", Array.from(keys)[0])}
              isInvalid={!!errors.class}
              errorMessage={errors.class}
              variant="bordered"
              radius="sm"
              isRequired
              classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            >
              {classOptions.map(c => <SelectItem key={c}>{c}</SelectItem>)}
            </Select>
          </div>
          <Input
            label="Roll Number"
            labelPlacement="outside"
            placeholder="Auto-generated"
            value={formData.rollNumber}
            onValueChange={v => updateField("rollNumber", v)}
            variant="bordered"
            radius="sm"
            isReadOnly
            description="Auto-generated based on class"
            classNames={{ inputWrapper: "bg-default-50 border-1 border-default-200 h-10" }}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 pt-2 border-t border-solid border-default-200">
        <label className="text-sm font-semibold text-default-900 block mt-2">Contact Details</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label="Mobile Number"
              labelPlacement="outside"
              startContent={<span className="text-default-400 text-xs">+91</span>}
              placeholder="Student's mobile (if any)"
              value={formData.mobile}
              onValueChange={v => {
                const digitsOnly = v.replace(/\D/g, '').slice(0, 10);
                updateField("mobile", digitsOnly);
              }}
              variant="bordered"
              radius="sm"
              maxLength={10}
              classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            />
            <Checkbox size="sm" isSelected={formData.isWhatsapp} onValueChange={v => updateField("isWhatsapp", v)}
              classNames={{ label: "text-xs text-default-500" }}>
              Same for WhatsApp
            </Checkbox>
          </div>
          {!formData.isWhatsapp && (
            <Input
              label="WhatsApp Number"
              labelPlacement="outside"
              startContent={<span className="text-default-400 text-xs">+91</span>}
              placeholder="WhatsApp Number"
              value={formData.whatsappNumber}
              onValueChange={v => updateField("whatsappNumber", v)}
              variant="bordered"
              radius="sm"
              classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            />
          )}
        </div>
        <Input
          label="Email Address"
          labelPlacement="outside"
          placeholder="student@email.com"
          value={formData.email}
          onValueChange={v => updateField("email", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
        <Textarea
          label="Address"
          labelPlacement="outside"
          placeholder="Full residential address"
          value={formData.address}
          onValueChange={v => updateField("address", v)}
          variant="bordered"
          radius="sm"
          minRows={2}
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300" }}
        />
        <Input
          label="City"
          labelPlacement="outside"
          placeholder="City"
          value={formData.city}
          onValueChange={v => updateField("city", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
        <Input
          label="State"
          labelPlacement="outside"
          placeholder="State"
          value={formData.state}
          onValueChange={v => updateField("state", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
        <Input
          label="ZIP Code"
          labelPlacement="outside"
          placeholder="PIN Code"
          value={formData.zipCode}
          onValueChange={v => updateField("zipCode", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
      </div>

      {/* Optional Fields */}
      <div className="space-y-2 pt-2 border-t border-solid border-default-200">
        <label className="text-sm font-semibold text-default-900 block mt-2">Optional Information</label>
        <p className="text-xs text-default-500 mb-3">These fields are optional and can be filled later</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Aadhaar Number"
            labelPlacement="outside"
            placeholder="12 digit Aadhaar"
            value={formData.aadhaarNumber}
            onValueChange={v => updateField("aadhaarNumber", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Select
            label="Blood Group"
            labelPlacement="outside"
            placeholder="Select..."
            selectedKeys={formData.bloodGroup ? [formData.bloodGroup] : []}
            onSelectionChange={keys => updateField("bloodGroup", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {bloodGroups.map(b => <SelectItem key={b}>{b}</SelectItem>)}
          </Select>
          <Input
            label="Nationality"
            labelPlacement="outside"
            placeholder="e.g., Indian"
            value={formData.nationality}
            onValueChange={v => updateField("nationality", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Input
            label="Religion"
            labelPlacement="outside"
            placeholder="Optional"
            value={formData.religion}
            onValueChange={v => updateField("religion", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Input
            label="Category"
            labelPlacement="outside"
            placeholder="e.g., General, OBC, SC, ST"
            value={formData.category}
            onValueChange={v => updateField("category", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Input
            label="Mother Tongue"
            labelPlacement="outside"
            placeholder="e.g., Hindi, Tamil"
            value={formData.motherTongue}
            onValueChange={v => updateField("motherTongue", v)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Input
            label="Previous School"
            labelPlacement="outside"
            placeholder="Name of previous school"
            value={formData.previousSchool}
            onValueChange={v => updateField("previousSchool", v)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Input
            label="Transfer Certificate No."
            labelPlacement="outside"
            placeholder="TC Number"
            value={formData.tcNumber}
            onValueChange={v => updateField("tcNumber", v)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const parents = formData.parents.filter(p => p.isParent);
    const guardians = formData.parents.filter(p => !p.isParent);

    return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* Parent Details */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-default-900">Parent Details</label>
          </div>

          {parents.map((parent, idx) => {
            const index = formData.parents.findIndex(p => p === parent);
            return (
              <div key={index} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-default-700">
                    {idx === 0 ? "Primary Parent" : `Parent ${idx + 1}`}
                  </span>
                  {parents.length > 1 && (
                    <Button size="sm" variant="light" color="danger" onPress={() => removeParent(index)}>
                      <X size={14} /> Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div ref={index === 0 ? parentNameRef : null}>
                    <Input
                      label="Full Name"
                      labelPlacement="outside"
                      placeholder="Parent name"
                      value={parent.name}
                      onValueChange={v => updateParent(index, "name", v)}
                      isInvalid={index === 0 && !!errors.parentName}
                      errorMessage={index === 0 ? errors.parentName : ""}
                      variant="bordered"
                      radius="sm"
                      isRequired={index === 0}
                      classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                    />
                  </div>
                  <Select
                    label="Relationship"
                    labelPlacement="outside"
                    placeholder="Select..."
                    selectedKeys={parent.relationship ? [parent.relationship] : []}
                    onSelectionChange={keys => updateParent(index, "relationship", Array.from(keys)[0])}
                    variant="bordered"
                    radius="sm"
                    classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  >
                    {parentRelationships.map(r => <SelectItem key={r}>{r}</SelectItem>)}
                  </Select>
                  <div className="space-y-2" ref={index === 0 ? parentPhoneRef : null}>
                    <Input
                      label="Phone Number"
                      labelPlacement="outside"
                      startContent={<span className="text-default-400 text-xs">+91</span>}
                      placeholder="10 digit number"
                      value={parent.phone}
                      onValueChange={v => {
                        // Only allow digits and limit to 10 characters
                        const digitsOnly = v.replace(/\D/g, '').slice(0, 10);
                        updateParent(index, "phone", digitsOnly);
                      }}
                      isInvalid={index === 0 && !!errors.parentPhone}
                      errorMessage={index === 0 ? errors.parentPhone : ""}
                      variant="bordered"
                      radius="sm"
                      isRequired={index === 0}
                      maxLength={10}
                      classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                    />
                    <Checkbox size="sm" isSelected={parent.isWhatsapp} onValueChange={v => updateParent(index, "isWhatsapp", v)}
                      classNames={{ label: "text-xs text-default-500" }}>
                      Same as WhatsApp
                    </Checkbox>
                  </div>
                  <Input
                    label="Email"
                    labelPlacement="outside"
                    placeholder="parent@email.com"
                    value={parent.email}
                    onValueChange={v => updateParent(index, "email", v)}
                    variant="bordered"
                    radius="sm"
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                  <Input
                    label="Occupation"
                    labelPlacement="outside"
                    placeholder="e.g., Engineer, Doctor"
                    value={parent.occupation}
                    onValueChange={v => updateParent(index, "occupation", v)}
                    variant="bordered"
                    radius="sm"
                    className="col-span-2"
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                </div>
              </div>
            )
          })}

          {parents.length < 2 && (
            <button
              className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
              onClick={() => {
                updateField("parents", [...formData.parents, { name: "", relationship: "Mother", phone: "", email: "", occupation: "", isWhatsapp: true, isParent: true }]);
              }}
            >
              + Add Another Parent
            </button>
          )}
        </div>

        {/* Guardian Details */}
        <div className="space-y-4 pt-2 border-t border-solid border-default-200">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-default-900">Guardian Details</label>
            <span className="text-xs text-default-500">(Optional)</span>
          </div>

          {guardians.map((guardian, idx) => {
            const index = formData.parents.findIndex(p => p === guardian);
            return (
              <div key={index} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-default-700">
                    Guardian {idx + 1}
                  </span>
                  <Button size="sm" variant="light" color="danger" onPress={() => removeParent(index)}>
                    <X size={14} /> Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    labelPlacement="outside"
                    placeholder="Guardian name"
                    value={guardian.name}
                    onValueChange={v => updateParent(index, "name", v)}
                    variant="bordered"
                    radius="sm"
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                  <Select
                    label="Relationship"
                    labelPlacement="outside"
                    placeholder="Select..."
                    selectedKeys={guardian.relationship ? [guardian.relationship] : []}
                    onSelectionChange={keys => updateParent(index, "relationship", Array.from(keys)[0])}
                    variant="bordered"
                    radius="sm"
                    classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  >
                    {guardianRelationships.map(r => <SelectItem key={r}>{r}</SelectItem>)}
                  </Select>
                  <div className="space-y-2">
                    <Input
                      label="Phone Number"
                      labelPlacement="outside"
                      startContent={<span className="text-default-400 text-xs">+91</span>}
                      placeholder="10 digit number"
                      value={guardian.phone}
                      onValueChange={v => {
                        const digitsOnly = v.replace(/\D/g, '').slice(0, 10);
                        updateParent(index, "phone", digitsOnly);
                      }}
                      variant="bordered"
                      radius="sm"
                      maxLength={10}
                      classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                    />
                    <Checkbox size="sm" isSelected={guardian.isWhatsapp} onValueChange={v => updateParent(index, "isWhatsapp", v)}
                      classNames={{ label: "text-xs text-default-500" }}>
                      Same as WhatsApp
                    </Checkbox>
                  </div>
                  <Input
                    label="Email"
                    labelPlacement="outside"
                    placeholder="guardian@email.com"
                    value={guardian.email}
                    onValueChange={v => updateParent(index, "email", v)}
                    variant="bordered"
                    radius="sm"
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                  <Input
                    label="Occupation"
                    labelPlacement="outside"
                    placeholder="e.g., Engineer, Doctor"
                    value={guardian.occupation}
                    onValueChange={v => updateParent(index, "occupation", v)}
                    variant="bordered"
                    radius="sm"
                    className="col-span-2"
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                </div>
              </div>
            )
          })}

          {guardians.length === 0 && (
            <button
              className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
              onClick={() => {
                updateField("parents", [...formData.parents, { name: "", relationship: "Grandparent", phone: "", email: "", occupation: "", isWhatsapp: true, isParent: false }]);
              }}
            >
              + Add Guardian
            </button>
          )}
        </div>

        {/* Sibling Details */}
        <div className="space-y-4 pt-2 border-t border-solid border-default-200">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-default-900">Sibling Details</label>
            <span className="text-xs text-default-500">(Siblings in same school only)</span>
          </div>

          {formData.siblings.map((sibling, idx) => (
            <div key={idx} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-default-700">
                  Sibling {idx + 1}
                </span>
                <Button size="sm" variant="light" color="danger" onPress={() => removeSibling(idx)}>
                  <X size={14} /> Remove
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Sibling Name"
                  labelPlacement="outside"
                  placeholder="Sibling's full name"
                  value={sibling.name}
                  onValueChange={v => updateSibling(idx, "name", v)}
                  variant="bordered"
                  radius="sm"
                  classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                />
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    isSelected={sibling.inSameSchool}
                    onValueChange={v => {
                      updateSibling(idx, "inSameSchool", v);
                      if (!v) updateSibling(idx, "classId", "");
                    }}
                  >
                    <span className="text-sm text-default-700">Is sibling in this school?</span>
                  </Checkbox>
                </div>
                {sibling.inSameSchool && (
                  <Select
                    label="Class"
                    labelPlacement="outside"
                    placeholder="Select class"
                    selectedKeys={sibling.classId ? [sibling.classId] : []}
                    onSelectionChange={keys => updateSibling(idx, "classId", Array.from(keys)[0])}
                    variant="bordered"
                    radius="sm"
                    classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  >
                    {classesWithTeachers.map(c => (
                      <SelectItem key={c.id}>
                        {c.name} {c.section}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          ))}

          <button
            className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
            onClick={addSibling}
          >
            + Add Sibling
          </button>
        </div>

        {/* Health & Safety */}
        <div className="space-y-2 pt-2 border-t border-solid border-default-200">
          <label className="text-sm font-semibold text-default-900 block mt-2">Health & Safety</label>
          <Textarea
            label="Medical Conditions"
            labelPlacement="outside"
            placeholder="Any allergies, medical conditions, or special needs (optional)"
            value={formData.medicalConditions}
            onValueChange={v => updateField("medicalConditions", v)}
            variant="bordered"
            radius="sm"
            minRows={2}
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300" }}
          />
        </div>

        {/* Transport & Hostel */}
        <div className="space-y-4 pt-2 border-t border-solid border-default-200">
          <label className="text-sm font-semibold text-default-900 block mt-2">Additional Requirements</label>
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              "cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all",
              formData.transportRequired ? "border-primary bg-primary-50/20" : "border-default-200 hover:border-default-300"
            )} onClick={() => updateField("transportRequired", !formData.transportRequired)}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                formData.transportRequired ? "bg-primary text-white" : "bg-default-100 text-default-400"
              )}>
                <Bus size={20} />
              </div>
              <div>
                <span className={cn("text-sm font-medium", formData.transportRequired ? "text-primary-700" : "text-default-600")}>
                  Transport Required
                </span>
                <p className="text-xs text-default-500">School bus facility</p>
              </div>
            </div>
            <div className={cn(
              "cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all",
              formData.hostelRequired ? "border-primary bg-primary-50/20" : "border-default-200 hover:border-default-300"
            )} onClick={() => updateField("hostelRequired", !formData.hostelRequired)}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                formData.hostelRequired ? "bg-primary text-white" : "bg-default-100 text-default-400"
              )}>
                <Heart size={20} />
              </div>
              <div>
                <span className={cn("text-sm font-medium", formData.hostelRequired ? "text-primary-700" : "text-default-600")}>
                  Hostel Required
                </span>
                <p className="text-xs text-default-500">Boarding facility</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-default-900">Document Uploads</label>
        <p className="text-xs text-default-500">Upload required documents. All documents are optional and can be uploaded later.</p>
      </div>

      {/* Birth Certificate */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">Birth Certificate</label>
        <div
          className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors"
          onClick={() => birthCertRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.birthCertificate ? (
              <span className="text-sm text-default-700">{formData.birthCertificate.name}</span>
            ) : (
              <span className="text-sm text-default-500">Click to upload birth certificate</span>
            )}
          </div>
          {formData.birthCertificate ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("birthCertificate", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-default-400" />
          )}
        </div>
        <input ref={birthCertRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("birthCertificate", e.target.files[0])} />
      </div>

      {/* Transfer Certificate */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">Transfer Certificate (TC)</label>
        <div
          className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors"
          onClick={() => tcRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.transferCertificate ? (
              <span className="text-sm text-default-700">{formData.transferCertificate.name}</span>
            ) : (
              <span className="text-sm text-default-500">Click to upload transfer certificate</span>
            )}
          </div>
          {formData.transferCertificate ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("transferCertificate", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-default-400" />
          )}
        </div>
        <input ref={tcRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("transferCertificate", e.target.files[0])} />
      </div>

      {/* Aadhaar Card (Front & Back) */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">Aadhaar Card (Front & Back)</label>
        <p className="text-xs text-default-500">Upload both sides of the Aadhaar card</p>

        {/* Front Side */}
        <div
          className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors"
          onClick={() => aadhaarFrontRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.aadhaarFront ? (
              <span className="text-sm text-default-700">Front: {formData.aadhaarFront.name}</span>
            ) : (
              <span className="text-sm text-default-500">Click to upload FRONT side</span>
            )}
          </div>
          {formData.aadhaarFront ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("aadhaarFront", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-default-400" />
          )}
        </div>
        <input ref={aadhaarFrontRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("aadhaarFront", e.target.files[0])} />

        {/* Back Side */}
        <div
          className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors"
          onClick={() => aadhaarBackRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.aadhaarBack ? (
              <span className="text-sm text-default-700">Back: {formData.aadhaarBack.name}</span>
            ) : (
              <span className="text-sm text-default-500">Click to upload BACK side</span>
            )}
          </div>
          {formData.aadhaarBack ? (
            <Button size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); updateField("aadhaarBack", null); }}>
              <X size={14} />
            </Button>
          ) : (
            <Upload size={16} className="text-default-400" />
          )}
        </div>
        <input ref={aadhaarBackRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("aadhaarBack", e.target.files[0])} />
      </div>

      {/* Other Documents */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">Other Documents</label>
        <p className="text-xs text-default-500">Upload any other relevant documents (medical records, previous report cards, etc.)</p>
        <div
          className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-default-50 transition-colors"
          onClick={() => otherDocsRef.current?.click()}
        >
          <Upload size={14} className="text-default-500" />
          <span className="text-sm text-default-600">Upload additional documents</span>
        </div>
        <input ref={otherDocsRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleMultiFileUpload("otherDocuments", e.target.files)} />
        {formData.otherDocuments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.otherDocuments?.map((file, i) => (
              <Chip key={i} onClose={() => removeFile("otherDocuments", i)} size="sm" variant="flat" className="h-8 border border-default-200 bg-background">
                {file.name}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Parents & Health", icon: Users },
    { number: 3, title: "Documents", icon: FileText }
  ];



  return (
    <>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex-none p-4 border-b border-default-200 flex items-center justify-between bg-background z-10">
          <div className="flex items-center gap-3">
            <Button isIconOnly variant="light" onPress={handlePrev} isDisabled={step === 1}>
              <ArrowLeft size={20} className="text-default-500" />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-default-900 leading-none">
                {initialData ? "Edit Student" : "Add New Student"}
              </h2>
              <p className="text-xs text-default-500 mt-1">
                Step {step} of 3: {step === 1 ? "Personal Details" : step === 2 ? "Parents & Guardian" : "Documents"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto pb-10">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="flex-none p-4 border-t border-default-200 bg-background z-10">
          <div className="flex items-center justify-end gap-2">
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={step === 2 ? handleSubmit : handleNext}
              isLoading={isSubmitting}
            >
              {step === 2 ? "Save Student" : "Next Step"}
            </Button>
          </div>
        </div>
      </div>

      {/* Photo Editor Modal */}
      {selectedImageForEdit && (
        <PhotoEditorModal
          isOpen={isPhotoEditorOpen}
          onClose={() => setIsPhotoEditorOpen(false)}
          imageSrc={selectedImageForEdit}
          onSave={handlePhotoSave}
        />
      )}
    </>
  );
}
