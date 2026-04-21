import { request } from '../../services/api.js';
import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { useDebounce } from '../../hooks/useDebounce';
import logger from "../../utils/logger";
import { ArrowRight } from "lucide-react";
import { settingsApi, classesApi } from "../../services/api";
import { validateStep as validateStepExtracted, isoToDdmmyy } from "./utils/studentFormValidation";
import toast from "react-hot-toast";
import PhotoEditorModal from "../../components/PhotoEditorModal";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import { RELIGIONS } from "../../constants/studentConstants";
import { normalizeStateName } from "../../constants/states";
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { validateFileType } from '../../utils/fileValidation';
import useDOBValidation from "./hooks/useDOBValidation";
import useStudentSubmit from "./hooks/useStudentSubmit";
import Step1PersonalInfo from "./components/add-student/Step1PersonalInfo";
import Step2ParentsHealth from "./components/add-student/Step2ParentsHealth";
import Step3Documents from "./components/add-student/Step3Documents";
import StepperHeader from "./components/add-student/StepperHeader";
import UnsavedChangesModal from "./components/add-student/UnsavedChangesModal";

const emptyForm = {
  // Personal Information
  fullName: "", dateOfBirth: "", gender: "Male",
  picture: null, aadhaarNumber: "", bloodGroup: "", nationality: "", religion: "",
  category: "", motherTongue: "", previousSchool: "", tcNumber: "", mediumOfInstruction: "", house: "",
  // Class Info
  classGrade: "", section: "", rollNumber: "",
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
  birthCertificate: null, transferCertificate: null, aadhaarFront: null, aadhaarBack: null, otherDocuments: []
};

const AddStudent = forwardRef(function AddStudent({ onClose, onSave, classesWithTeachers = [], initialData = null }, ref) {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [step, setStep] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDirtyModalOpen, setIsDirtyModalOpen] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      // Parse class field (e.g., "10-A") into classGrade and section
      let classGrade = "";
      let section = "";
      if (initialData.class) {
        const parts = initialData.class.split('-');
        if (parts.length === 2) {
          classGrade = parts[0];
          section = parts[1];
        } else {
          // FIXED: Use String() comparison for ObjectId matching
          const matchingClass = classesWithTeachers.find(cls => String(cls.id) === String(initialData.classId));
          if (matchingClass) {
            classGrade = matchingClass.name;
            section = matchingClass.section;
          }
        }
      }

      // Bug #15 fix: Normalize religion value to match RELIGIONS constant
      let normalizedReligion = initialData.religion || "";
      if (normalizedReligion && !RELIGIONS.includes(normalizedReligion)) {
        const match = RELIGIONS.find(rel => rel.toLowerCase().startsWith(normalizedReligion.toLowerCase()));
        if (match) normalizedReligion = match;
      }

      return {
        ...emptyForm,
        ...initialData,
        fullName: initialData.name || "",
        mobile: initialData.phone || "",
        picture: initialData.photo || null,
        rollNumber: initialData.rollNo?.toString() || "",
        religion: normalizedReligion,
        parents: initialData.parents?.length > 0
          ? initialData.parents.map(parent => ({
              ...parent,
              // Bug #8/#9 fix: derive isParent from relationship when not explicitly stored
              isParent: parent.isParent != null ? parent.isParent : ["Father", "Mother"].includes(parent.relationship),
            }))
          : [{
              name: initialData.parentName || "",
              relationship: initialData.parentRelationship || "Father",
              phone: initialData.parentPhone || "",
              email: initialData.parentEmail || "",
              occupation: initialData.parentOccupation || "",
              isWhatsapp: true,
              isParent: true
            }],
        siblings: initialData.siblings || [],
        classGrade,
        section,
      };
    }
    // Restore draft from sessionStorage if available (new student only)
    try {
      const draft = sessionStorage.getItem('student-form-draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        const savedStep = sessionStorage.getItem('student-form-draft-step');
        if (savedStep) setTimeout(() => setStep(parseInt(savedStep) || 1), 0);
        return { ...emptyForm, ...parsed };
      }
    } catch { /* corrupt draft — ignore */ }
    return emptyForm;
  });

  const [errors, setErrors] = useState({});
  const [documentConfigs, setDocumentConfigs] = useState([]);
  const [isDobCalendarOpen, setIsDobCalendarOpen] = useState(false);
  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false);
  const scrollContainerRef = useRef(null);
  const initialFormDataRef = useRef(null);

  // Photo Editor State
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

  // Refs
  const pictureInputRef = useRef(null);
  const birthCertRef = useRef(null);
  const tcRef = useRef(null);
  const aadhaarFrontRef = useRef(null);
  const aadhaarBackRef = useRef(null);
  const otherDocsRef = useRef(null);
  const zipLookupTimeoutRef = useRef(null);
  const manualCityStateEntryRef = useRef(false);

  // Error field refs for auto-scroll
  const fullNameRef = useRef(null);
  const dobRef = useRef(null);
  const genderRef = useRef(null);
  const classRef = useRef(null);
  const parentNameRef = useRef(null);
  const parentPhoneRef = useRef(null);

  // Hooks
  const { dobValidation, validateDOBInRealTime: validateDOBHook } = useDOBValidation();
  const { isSubmitting, handleSubmit: submitHandler } = useStudentSubmit();

  // Wrap DOB hook to pass setErrors
  const validateDOBInRealTime = (dateStr) => validateDOBHook(dateStr, setErrors);

  // Load document configuration
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        const docConfigs = await settingsApi.getDocumentConfig();
        setDocumentConfigs(docConfigs);
      } catch (error) {
        logger.error('❌ Error loading configurations:', error);
        setDocumentConfigs([]);
      }
    };
    loadConfigurations();
  }, []);

  // Map admin document config names to form field keys (case-insensitive)
  const docConfigMap = useMemo(() => {
    const map = {};
    for (const cfg of documentConfigs) {
      const name = (cfg.documentName || '').toLowerCase().trim();
      if (name.includes('birth')) map.birthCertificate = cfg;
      else if (name.includes('transfer') || name.includes('tc')) map.transferCertificate = cfg;
      else if (name.includes('aadhaar') || name.includes('aadhar')) map.aadhaar = cfg;
    }
    return map;
  }, [documentConfigs]);

  const isDocRequired = (fieldKey) => {
    if (fieldKey === 'aadhaarFront' || fieldKey === 'aadhaarBack') return docConfigMap.aadhaar?.isRequired || false;
    return docConfigMap[fieldKey]?.isRequired || false;
  };

  // Store initial form data for dirty state detection
  useEffect(() => {
    const timer = setTimeout(() => {
      initialFormDataRef.current = JSON.stringify(formData);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally capture formData only on mount
  }, []);

  // Detect form changes (debounced) and auto-save draft to sessionStorage
  const debouncedFormData = useDebounce(formData, 500);
  useEffect(() => {
    if (!initialFormDataRef.current) return;
    const currentData = JSON.stringify(debouncedFormData);
    const hasChanges = currentData !== initialFormDataRef.current;
    setHasUnsavedChanges(hasChanges);
    if (!initialData && hasChanges) {
      try {
        sessionStorage.setItem('student-form-draft', currentData);
        sessionStorage.setItem('student-form-draft-step', String(step));
      } catch { /* storage full — ignore */ }
    }
  }, [debouncedFormData, step, initialData]);

  // Browser navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Auto-generate roll number when class is selected
  useEffect(() => {
    const generateRollNumber = async () => {
      if (formData.classGrade && formData.section && !initialData) {
        try {
          const selectedClass = classesWithTeachers.find(cls => cls.name === formData.classGrade && cls.section === formData.section);
          if (selectedClass) {
            const data = await request(`/classes/${selectedClass.id}/next-roll-number`);
            updateField("rollNumber", data.rollNumber.toString());
          }
        } catch (error) {
          logger.error('❌ Error generating roll number:', error);
          updateField("rollNumber", "1");
        }
      }
    };
    generateRollNumber();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updateField is stable; including it causes infinite loop
  }, [formData.classGrade, formData.section, initialData, classesWithTeachers]);

  // Initialize DOB validation when editing a student with existing DOB
  useEffect(() => {
    if (formData.dateOfBirth) {
      if (formData.dateOfBirth.includes('-') && /^\d{4}-\d{2}-\d{2}/.test(formData.dateOfBirth)) {
        const ddmmyy = isoToDdmmyy(formData.dateOfBirth.split('T')[0]);
        if (ddmmyy) {
          updateField("dateOfBirth", ddmmyy);
          validateDOBInRealTime(ddmmyy);
        }
      } else if (formData.dateOfBirth.includes('/')) {
        validateDOBInRealTime(formData.dateOfBirth);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount only
  }, []);

  // Normalize state from initialData on mount
  useEffect(() => {
    if (initialData && initialData.state) {
      const normalizedState = normalizeStateName(initialData.state);
      if (normalizedState && normalizedState !== initialData.state) {
        updateField("state", normalizedState);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount only
  }, []);

  // Cleanup zip lookup timeout on unmount
  useEffect(() => {
    return () => {
      if (zipLookupTimeoutRef.current) clearTimeout(zipLookupTimeoutRef.current);
    };
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Memoize picture preview URL to avoid creating new blob URLs on every render
  const picturePreviewUrl = useMemo(() => {
    if (formData.picture instanceof File) return URL.createObjectURL(formData.picture);
    return formData.picture || null;
  }, [formData.picture]);

  // Cleanup blob URL on unmount or when picture changes
  useEffect(() => {
    return () => {
      if (picturePreviewUrl && formData.picture instanceof File) URL.revokeObjectURL(picturePreviewUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup depends only on URL value
  }, [picturePreviewUrl]);

  // Memoize state selectedKeys to prevent Select from closing/flickering during PIN lookup
  const stateSelectedKeys = useMemo(() => {
    return formData.state ? [formData.state] : [];
  }, [formData.state]);

  // Memoize unique class names
  const uniqueClassNames = useMemo(() => {
    return Array.from(new Set(classesWithTeachers.map(cls => cls.name)))
      .sort((nameA, nameB) => parseInt(nameA) - parseInt(nameB));
  }, [classesWithTeachers]);

  // Memoize sections for selected class
  const availableSections = useMemo(() => {
    if (!formData.classGrade) return [];
    return Array.from(new Set(
      classesWithTeachers
        .filter(cls => cls.name === formData.classGrade)
        .map(cls => cls.section)
    )).sort();
  }, [classesWithTeachers, formData.classGrade]);

  const updateParent = (index, field, value) => {
    const updated = [...formData.parents];
    updated[index] = { ...updated[index], [field]: value };
    updateField("parents", updated);
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

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileUpload = (field, file) => {
    if (file) {
      const mimeError = validateFileType(file);
      if (mimeError) { toast.error(mimeError); return; }
      const maxSize = file.type?.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
      const label = file.type?.startsWith('image/') ? '5MB' : '10MB';
      if (file.size > maxSize) { toast.error(t('toast.error.fileTooLarge', `File size must be less than ${label}`)); return; }
      updateField(field, file);
    }
  };

  const handleMultiFileUpload = (field, files) => {
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter((file) => {
        const mimeError = validateFileType(file);
        if (mimeError) { toast.error(mimeError); return false; }
        const maxSize = file.type?.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
        if (file.size > maxSize) { toast.error(t('toast.error.fileTooLarge', `${file.name} exceeds the size limit`)); return false; }
        return true;
      });
      if (validFiles.length > 0) updateField(field, [...formData[field], ...validFiles]);
    }
  };

  const removeFile = (field, index) => {
    if (field === "otherDocuments" && Array.isArray(formData[field])) {
      updateField(field, formData[field].filter((_, i) => i !== index));
    } else {
      updateField(field, null);
    }
  };

  const handlePhotoSave = (croppedBlob) => {
    const file = new File([croppedBlob], "profile_photo.jpg", { type: "image/jpeg" });
    updateField("picture", file);
  };

  const handleCameraPhotoCapture = (file) => {
    updateField("picture", file);
  };

  const validateStep = (stepNum) => {
    if (stepNum === 3) {
      const newErrors = {};
      const existingDocs = initialData?.documents || [];
      const hasExisting = (category) => existingDocs.some(d => d.category === category);

      if (isDocRequired('birthCertificate') && !formData.birthCertificate && !hasExisting('birthCertificate'))
        newErrors.birthCertificate = 'Birth certificate is required';
      if (isDocRequired('transferCertificate') && !formData.transferCertificate && !hasExisting('transferCertificate'))
        newErrors.transferCertificate = 'Transfer certificate is required';
      if (isDocRequired('aadhaarFront') && !formData.aadhaarFront && !hasExisting('aadhaarCard'))
        newErrors.aadhaarFront = 'Aadhaar card front is required';
      if (isDocRequired('aadhaarBack') && !formData.aadhaarBack && !hasExisting('aadhaarCard'))
        newErrors.aadhaarBack = 'Aadhaar card back is required';

      setErrors(newErrors);
      return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
    }
    const result = validateStepExtracted(stepNum, formData);
    setErrors(result.errors);
    return result;
  };

  const scrollToError = (stepNum, errorObj) => {
    requestAnimationFrame(() => {
      if (stepNum === 1) {
        if (errorObj.fullName && fullNameRef.current) {
          fullNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errorObj.dateOfBirth && dobRef.current) {
          dobRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errorObj.gender && genderRef.current) {
          genderRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if ((errorObj.classGrade || errorObj.section) && classRef.current) {
          classRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (stepNum === 2) {
        if (errorObj.parentName && parentNameRef.current) {
          parentNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (errorObj.parentPhone && parentPhoneRef.current) {
          parentPhoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  };

  const handleNext = () => {
    const validation = validateStep(step);
    if (validation.isValid) {
      setStep(prev => Math.min(prev + 1, 3));
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollToError(step, validation.errors);
    }
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setIsDirtyModalOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setIsDirtyModalOpen(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleCancelClose = () => setIsDirtyModalOpen(false);

  useImperativeHandle(ref, () => ({
    attemptClose: handleClose,
    hasUnsavedChanges: () => hasUnsavedChanges
  }));

  const handleSubmit = (e) => {
    submitHandler(e, formData, {
      classesWithTeachers,
      initialData,
      validateStep,
      setStep,
      scrollContainerRef,
      scrollToError,
      onSave,
      setHasUnsavedChanges,
    });
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
        {/* Stepper */}
        <StepperHeader currentStep={step} />

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar"
        >
          {step === 1 && (
            <Step1PersonalInfo
              formData={formData}
              errors={errors}
              updateField={updateField}
              picturePreviewUrl={picturePreviewUrl}
              isDobCalendarOpen={isDobCalendarOpen}
              setIsDobCalendarOpen={setIsDobCalendarOpen}
              dobValidation={dobValidation}
              validateDOBInRealTime={validateDOBInRealTime}
              isZipLookupLoading={isZipLookupLoading}
              setIsZipLookupLoading={setIsZipLookupLoading}
              uniqueClassNames={uniqueClassNames}
              availableSections={availableSections}
              stateSelectedKeys={stateSelectedKeys}
              classesWithTeachers={classesWithTeachers}
              fullNameRef={fullNameRef}
              dobRef={dobRef}
              genderRef={genderRef}
              classRef={classRef}
              pictureInputRef={pictureInputRef}
              setIsCameraCaptureOpen={setIsCameraCaptureOpen}
              zipLookupTimeoutRef={zipLookupTimeoutRef}
              manualCityStateEntryRef={manualCityStateEntryRef}
            />
          )}
          {step === 2 && (
            <Step2ParentsHealth
              formData={formData}
              errors={errors}
              updateField={updateField}
              updateParent={updateParent}
              removeParent={removeParent}
              updateSibling={updateSibling}
              addSibling={addSibling}
              removeSibling={removeSibling}
              classesWithTeachers={classesWithTeachers}
              parentNameRef={parentNameRef}
              parentPhoneRef={parentPhoneRef}
            />
          )}
          {step === 3 && (
            <Step3Documents
              formData={formData}
              errors={errors}
              updateField={updateField}
              handleFileUpload={handleFileUpload}
              handleMultiFileUpload={handleMultiFileUpload}
              removeFile={removeFile}
              isDocRequired={isDocRequired}
              documentConfigs={documentConfigs}
              birthCertRef={birthCertRef}
              tcRef={tcRef}
              aadhaarFrontRef={aadhaarFrontRef}
              aadhaarBackRef={aadhaarBackRef}
              otherDocsRef={otherDocsRef}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                onClick={handlePrev}
                className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : step === 3 ? (
                initialData ? "Update Student" : "Add Student"
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
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

      {/* Camera Capture Modal */}
      {isCameraCaptureOpen && (
        <CameraCaptureModal
          isOpen={isCameraCaptureOpen}
          onClose={() => setIsCameraCaptureOpen(false)}
          onPhotoCaptured={handleCameraPhotoCapture}
        />
      )}

      {/* Unsaved Changes Warning Modal */}
      <UnsavedChangesModal
        isOpen={isDirtyModalOpen}
        onStay={handleCancelClose}
        onDiscard={handleConfirmClose}
      />
    </>
  );
});

export default AddStudent;
