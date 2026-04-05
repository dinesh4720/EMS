import { request } from '../../services/api.js';
import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from "react";
import logger from "../../utils/logger";
import { Button, Input, Select, SelectItem, Checkbox, Textarea, Chip, Avatar, RadioGroup, Radio, cn, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { ArrowRight, Upload, X, User, FileText, Users, Check, Heart, Bus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isValid, parse } from "date-fns";
import { studentsApi, settingsApi, uploadApi, lookupPincode, classesApi } from "../../services/api";
import { validateStep as validateStepExtracted, isoToDdmmyy, ddmmyyToIso, buildStudentPayload } from "./utils/studentFormValidation";
import toast from "react-hot-toast";
import PhotoEditorModal from "../../components/PhotoEditorModal";
import CameraCaptureModal from "../../components/CameraCaptureModal";
import { GENDERS, BLOOD_GROUPS, PARENT_RELATIONSHIPS, GUARDIAN_RELATIONSHIPS, RELIGIONS, CATEGORIES, MOTHER_TONGUES } from "../../constants/studentConstants";
import { INDIAN_STATES, normalizeStateName } from "../../constants/states";
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatShortDate } from '../../utils/dateFormatter';

// Note: Constants now imported from constants/ folder

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

// --- Click Away Listener Component ---
// Simple hook-based click outside detector
function ClickAwayListener({ children, onClickAway }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClickAway();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClickAway]);

  return <div ref={ref}>{children}</div>;
}

// --- Custom Calendar Component ---
// Simple calendar that shows only the calendar grid, no nested input
// Disables future dates to prevent selection
function CustomCalendar({ selectedDate, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) return selectedDate;
    return new Date();
  });
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [focusedDate, setFocusedDate] = useState(() => selectedDate || new Date());
  const yearDropdownRef = useRef(null);
  const calendarGridRef = useRef(null);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);

  // Get all days to display (including padding from previous/next months)
  const startOfWeekDay = new Date(firstDayOfMonth);
  startOfWeekDay.setDate(startOfWeekDay.getDate() - firstDayOfMonth.getDay());

  const endOfWeekDay = new Date(lastDayOfMonth);
  endOfWeekDay.setDate(endOfWeekDay.getDate() + (6 - lastDayOfMonth.getDay()));

  const allDays = eachDayOfInterval({ start: startOfWeekDay, end: endOfWeekDay });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

  // Generate year options from 1900 to current year - 1
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 1;
  const years = [];
  for (let year = maxYear; year >= 1900; year--) {
    years.push(year);
  }

  const isDayDisabled = useCallback((day) => {
    const dayDate = new Date(day);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate > today;
  }, [today]);

  const handleDateClick = (day) => {
    if (isDayDisabled(day)) return;
    onSelect(day);
  };

  const handleYearChange = (year) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
    setIsYearDropdownOpen(false);
  };

  // Scroll the active year into view when year dropdown opens
  useEffect(() => {
    if (isYearDropdownOpen && yearDropdownRef.current) {
      const activeBtn = yearDropdownRef.current.querySelector('[data-active-year="true"]');
      if (activeBtn) activeBtn.scrollIntoView({ block: 'center' });
    }
  }, [isYearDropdownOpen]);

  const handleYearDropdownKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsYearDropdownOpen(false);
    }
  };

  const handleCalendarKeyDown = (e) => {
    const key = e.key;
    let newFocused = focusedDate;

    switch (key) {
      case 'ArrowRight':
        e.preventDefault();
        newFocused = addDays(focusedDate, 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newFocused = addDays(focusedDate, -1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newFocused = addDays(focusedDate, 7);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newFocused = addDays(focusedDate, -7);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isDayDisabled(focusedDate)) {
          onSelect(focusedDate);
        }
        return;
      case 'Escape':
        e.preventDefault();
        if (isYearDropdownOpen) setIsYearDropdownOpen(false);
        return;
      default:
        return;
    }

    // If navigated to a different month, update currentMonth
    if (!isSameMonth(newFocused, currentMonth)) {
      setCurrentMonth(newFocused);
    }
    setFocusedDate(newFocused);

    // Focus the button for the new date after render
    requestAnimationFrame(() => {
      if (calendarGridRef.current) {
        const btn = calendarGridRef.current.querySelector(`[data-date="${format(newFocused, 'yyyy-MM-dd')}"]`);
        if (btn) btn.focus();
      }
    });
  };

  return (
    <div className="bg-content1 border border-default-200 rounded-lg shadow-xl p-4 min-w-[320px]" role="dialog" aria-label="Date picker">
      {/* Header with month and year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-default-100 rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} className="text-default-600" />
        </button>

        <div className="flex items-center gap-2">
          <div className="font-semibold text-default-700" aria-live="polite">
            {format(currentMonth, 'MMMM')}
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              onKeyDown={handleYearDropdownKeyDown}
              className="font-semibold text-default-700 hover:text-primary transition-colors px-2 py-1 hover:bg-default-100 rounded flex items-center gap-1"
              aria-expanded={isYearDropdownOpen}
              aria-haspopup="listbox"
              aria-label={`Year ${format(currentMonth, 'yyyy')}, click to change`}
            >
              {format(currentMonth, 'yyyy')}
              <svg
                className={`w-4 h-4 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isYearDropdownOpen && (
              <ClickAwayListener onClickAway={() => setIsYearDropdownOpen(false)}>
                <div
                  ref={yearDropdownRef}
                  role="listbox"
                  aria-label="Select year"
                  onKeyDown={handleYearDropdownKeyDown}
                  className="absolute top-full left-0 mt-1 bg-content1 border border-default-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 min-w-[100px]"
                >
                  {years.map(year => (
                    <button
                      key={year}
                      type="button"
                      role="option"
                      aria-selected={year === currentMonth.getFullYear()}
                      data-active-year={year === currentMonth.getFullYear() ? 'true' : undefined}
                      onClick={() => handleYearChange(year)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleYearChange(year);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsYearDropdownOpen(false);
                        }
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-default-100 transition-colors ${
                        year === currentMonth.getFullYear() ? 'bg-primary-50 text-primary font-semibold' : 'text-default-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </ClickAwayListener>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-default-100 rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={20} className="text-default-600" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2" role="row">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-default-500 py-1" role="columnheader" abbr={day}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        ref={calendarGridRef}
        className="grid grid-cols-7 gap-1"
        role="grid"
        aria-label={format(currentMonth, 'MMMM yyyy')}
        onKeyDown={handleCalendarKeyDown}
      >
        {allDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const isFocused = isSameDay(day, focusedDate);
          const isDisabled = isDayDisabled(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              data-date={format(day, 'yyyy-MM-dd')}
              tabIndex={isFocused ? 0 : -1}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              aria-label={format(day, 'EEEE, MMMM d, yyyy')}
              aria-selected={isSelected || undefined}
              aria-current={isToday ? 'date' : undefined}
              className={`
                aspect-square flex items-center justify-center text-sm rounded transition-colors
                ${isDisabled ? 'text-default-300 cursor-not-allowed opacity-50' : !isCurrentMonth ? 'text-default-300' : 'text-default-700'}
                ${isSelected && !isDisabled ? 'bg-primary text-white font-semibold' : ''}
                ${isToday && !isSelected && !isDisabled ? 'border-2 border-primary' : ''}
                ${!isSelected && !isDisabled ? 'hover:bg-default-100' : ''}
                ${isFocused && !isDisabled ? 'ring-2 ring-primary ring-offset-1' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const AddStudent = forwardRef(function AddStudent({ onClose, onSave, classesWithTeachers = [], initialData = null }, ref) {
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          // If class doesn't have the expected format, try to find matching class
          // FIXED: Use String() comparison for ObjectId matching
          const matchingClass = classesWithTeachers.find(cls => String(cls.id) === String(initialData.classId));
          if (matchingClass) {
            classGrade = matchingClass.name;
            section = matchingClass.section;
          }
        }
      }

      // Bug #15 fix: Normalize religion value to match RELIGIONS constant
      // Backend may store "Hindu" but constants use "Hinduism"
      let normalizedReligion = initialData.religion || "";
      if (normalizedReligion && !RELIGIONS.includes(normalizedReligion)) {
        const match = RELIGIONS.find(rel => rel.toLowerCase().startsWith(normalizedReligion.toLowerCase()));
        if (match) normalizedReligion = match;
      }

      // Map initialData (student object) to form structure
      return {
        ...emptyForm,
        ...initialData,
        fullName: initialData.name || "",
        mobile: initialData.phone || "",
        picture: initialData.photo || null, // Map photo URL to picture field
        rollNumber: initialData.rollNo?.toString() || "", // Map rollNo to rollNumber
        religion: normalizedReligion,
        // Ensure parents array is populated
        parents: initialData.parents?.length > 0
          ? initialData.parents.map(parent => ({
              ...parent,
              // Bug #8/#9 fix: Ensure isParent is explicitly set based on relationship
              // Backend may not store isParent, so derive it from relationship
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
        // Siblings array
        siblings: initialData.siblings || [],
        // Parse class and section
        classGrade,
        section,
      };
    }
    // Restore draft from sessionStorage if available (new student only)
    try {
      const draft = sessionStorage.getItem('student-form-draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        // Restore saved step too
        const savedStep = sessionStorage.getItem('student-form-draft-step');
        if (savedStep) setTimeout(() => setStep(parseInt(savedStep) || 1), 0);
        return { ...emptyForm, ...parsed };
      }
    } catch { /* corrupt draft — ignore */ }
    return emptyForm;
  });
  const [errors, setErrors] = useState({});
  const [documentConfigs, setDocumentConfigs] = useState([]);
  const [dobValidation, setDobValidation] = useState({ isValid: false, message: '', warning: '' });
  const [isDobCalendarOpen, setIsDobCalendarOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const initialFormDataRef = useRef(null);

  // Photo Editor State
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState(null);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false);

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

  // Load document configuration
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        // Load document configuration
        const docConfigs = await settingsApi.getDocumentConfig();
        setDocumentConfigs(docConfigs);
      } catch (error) {
        logger.error('❌ Error loading configurations:', error);
        // Don't show error toast - just log it and continue with empty configs
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

  const isDocRequired = useCallback((fieldKey) => {
    if (fieldKey === 'aadhaarFront' || fieldKey === 'aadhaarBack') return docConfigMap.aadhaar?.isRequired || false;
    return docConfigMap[fieldKey]?.isRequired || false;
  }, [docConfigMap]);

  // Store initial form data for dirty state detection
  useEffect(() => {
    // Store after auto-generated fields are set
    const timer = setTimeout(() => {
      initialFormDataRef.current = JSON.stringify(formData);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally capture formData only on mount; re-running would defeat dirty-state detection
  }, []);

  // Detect form changes for dirty state (debounced to avoid lag)
  // Also auto-save draft to sessionStorage for recovery on page reload
  useEffect(() => {
    if (!initialFormDataRef.current) return;

    const timer = setTimeout(() => {
      const currentData = JSON.stringify(formData);
      const hasChanges = currentData !== initialFormDataRef.current;
      setHasUnsavedChanges(hasChanges);
      // Auto-save draft for new students (not edits)
      if (!initialData && hasChanges) {
        try {
          sessionStorage.setItem('student-form-draft', currentData);
          sessionStorage.setItem('student-form-draft-step', String(step));
        } catch { /* storage full — ignore */ }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, step, initialData]);

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
            // Use optimized API endpoint
            const data = await request(`/classes/${selectedClass.id}/next-roll-number`);
            updateField("rollNumber", data.rollNumber.toString());
          }
        } catch (error) {
          logger.error('❌ Error generating roll number:', error);
          // Set to 1 as fallback
          updateField("rollNumber", "1");
        }
      }
    };
    generateRollNumber();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updateField is stable, including it causes infinite loop
  }, [formData.classGrade, formData.section, initialData, classesWithTeachers]);

  // Initialize DOB validation when editing a student with existing DOB
  useEffect(() => {
    if (formData.dateOfBirth) {
      // If it's in ISO format (YYYY-MM-DD), convert to DD/MM/YYYY for display
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
      if (zipLookupTimeoutRef.current) {
        clearTimeout(zipLookupTimeoutRef.current);
      }
    };
  }, []);


  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Memoize picture preview URL to avoid creating new blob URLs on every render
  const picturePreviewUrl = useMemo(() => {
    if (formData.picture instanceof File) {
      return URL.createObjectURL(formData.picture);
    }
    return formData.picture || null;
  }, [formData.picture]);

  // Cleanup blob URL on unmount or when picture changes
  useEffect(() => {
    return () => {
      if (picturePreviewUrl && formData.picture instanceof File) {
        URL.revokeObjectURL(picturePreviewUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup depends only on the URL value, not formData.picture
  }, [picturePreviewUrl]);

  // Memoize state selectedKeys to prevent Select component from closing/flickering during PIN lookup
  const stateSelectedKeys = useMemo(() => {
    return formData.state ? [formData.state] : [];
  }, [formData.state]);

  // Memoize unique class names to prevent recalculation on every render
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

  const _addParent = () => {
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

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileUpload = (field, file) => {
    if (file) {
      const maxSize = file.type?.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
      const label = file.type?.startsWith('image/') ? '5MB' : '10MB';
      if (file.size > maxSize) {
        toast.error(t('toast.error.fileTooLarge', `File size must be less than ${label}`));
        return;
      }
      updateField(field, file);
    }
  };

  const handleMultiFileUpload = (field, files) => {
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter((file) => {
        const maxSize = file.type?.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
        if (file.size > maxSize) {
          toast.error(t('toast.error.fileTooLarge', `${file.name} exceeds the size limit`));
          return false;
        }
        return true;
      });
      if (validFiles.length > 0) {
        updateField(field, [...formData[field], ...validFiles]);
      }
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

  const _handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(t('toast.error.fileTooLarge', 'File size must be less than 5MB'));
        e.target.value = null;
        return;
      }
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

  const handlePhotoSave = (croppedBlob) => {
    const file = new File([croppedBlob], "profile_photo.jpg", { type: "image/jpeg" });
    updateField("picture", file);
  };

  const handleCameraPhotoCapture = (file) => {
    // File is already captured from camera or file picker, no need to edit again
    // The CameraCaptureModal handles editing internally
    updateField("picture", file);
  };

  // Validation uses extracted schemas from studentFormValidation.js
  const validateStep = (stepNum) => {
    if (stepNum === 3) {
      // Validate required documents based on admin config
      const newErrors = {};
      // Check existing docs from initialData (editing) — category matches field key
      const existingDocs = initialData?.documents || [];
      const hasExisting = (category) => existingDocs.some(d => d.category === category);

      if (isDocRequired('birthCertificate') && !formData.birthCertificate && !hasExisting('birthCertificate')) {
        newErrors.birthCertificate = 'Birth certificate is required';
      }
      if (isDocRequired('transferCertificate') && !formData.transferCertificate && !hasExisting('transferCertificate')) {
        newErrors.transferCertificate = 'Transfer certificate is required';
      }
      if (isDocRequired('aadhaarFront') && !formData.aadhaarFront && !hasExisting('aadhaarCard')) {
        newErrors.aadhaarFront = 'Aadhaar card front is required';
      }
      if (isDocRequired('aadhaarBack') && !formData.aadhaarBack && !hasExisting('aadhaarCard')) {
        newErrors.aadhaarBack = 'Aadhaar card back is required';
      }
      setErrors(newErrors);
      return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
    }
    const result = validateStepExtracted(stepNum, formData);
    setErrors(result.errors);
    return result;
  };

  const scrollToError = (stepNum, errorObj) => {
    // Scroll to the first error field using the passed error object
    // Use requestAnimationFrame for more reliable scrolling after DOM updates
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
      // Scroll to top when moving to next step
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to first error using the errors from validation
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

  const handleCancelClose = () => {
    setIsDirtyModalOpen(false);
  };

  useImperativeHandle(ref, () => ({
    attemptClose: handleClose,
    hasUnsavedChanges: () => hasUnsavedChanges
  }));

  // Helper function to validate DOB in real-time with strict blocking
  const validateDOBInRealTime = (dateStr) => {
    const digits = dateStr.replace(/\D/g, '');
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    // Reset validation state
    const validation = { isValid: false, message: '', warning: '' };

    // If empty, clear validation
    if (!dateStr || dateStr.length === 0) {
      setDobValidation(validation);
      setErrors(prev => ({ ...prev, dateOfBirth: null }));
      return;
    }

    // Provide progress feedback
    if (digits.length < 8) {
      validation.message = `Keep typing... (${digits.length}/8 digits)`;
      setDobValidation(validation);
      setErrors(prev => ({ ...prev, dateOfBirth: null }));
      return;
    }

    // Full date entered - validate it
    const day = parseInt(digits.slice(0, 2));
    const month = parseInt(digits.slice(2, 4));
    const year = parseInt(digits.slice(4, 8));

    // BLOCK: Invalid day range
    if (day < 1 || day > 31) {
      validation.message = 'Invalid day (must be 01-31)';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Day must be between 01 and 31' }));
      setDobValidation(validation);
      return;
    }

    // BLOCK: Invalid month range
    if (month < 1 || month > 12) {
      validation.message = 'Invalid month (must be 01-12)';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Month must be between 01 and 12' }));
      setDobValidation(validation);
      return;
    }

    // BLOCK: Invalid year range (must be reasonable)
    if (year < 1900) {
      validation.message = 'Year too old (must be 1900 or later)';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Year must be 1900 or later' }));
      setDobValidation(validation);
      return;
    }

    // BLOCK: Current year or future years
    if (year >= currentYear) {
      validation.message = 'Future dates not allowed';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Year cannot be current year or future' }));
      setDobValidation(validation);
      return;
    }

    // BLOCK: Calendar validity (e.g., Feb 30, Apr 31, etc.)
    const date = new Date(year, month - 1, day);
    const isValidCalendar = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

    if (!isValidCalendar) {
      validation.message = 'Invalid date (does not exist in calendar)';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Invalid calendar date' }));
      setDobValidation(validation);
      return;
    }

    // BLOCK: Future date check (compare full dates)
    const inputDate = new Date(year, month - 1, day);
    inputDate.setHours(0, 0, 0, 0);
    if (inputDate > today) {
      validation.message = 'Future dates not allowed';
      setErrors(prev => ({ ...prev, dateOfBirth: 'Date cannot be in the future' }));
      setDobValidation(validation);
      return;
    }

    // Calculate age
    const ageInYears = today.getFullYear() - year - (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day) ? 1 : 0);

    // WARNING: Very old date (>100 years) - still valid but warn
    if (ageInYears > 100) {
      validation.warning = 'Person appears to be over 100 years old';
      validation.isValid = true;
      validation.message = `Age: ${ageInYears} years`;
      setErrors(prev => ({ ...prev, dateOfBirth: null })); // Clear error, allow submission
      setDobValidation(validation);
      return;
    }

    // All checks passed - valid date
    validation.isValid = true;
    validation.message = `Age: ${ageInYears} years`;
    setErrors(prev => ({ ...prev, dateOfBirth: null }));
    setDobValidation(validation);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    // Validate all steps before submitting
    const step1Validation = validateStep(1);
    const step2Validation = validateStep(2);
    const step3Validation = validateStep(3);

    if (!step1Validation.isValid || !step2Validation.isValid || !step3Validation.isValid) {
      // Go back to the first invalid step
      if (!step1Validation.isValid) {
        setStep(1);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        toast.error(t('toast.error.pleaseFillInAllRequiredFieldsInPersonalInformation'));
        scrollToError(1, step1Validation.errors);
      } else if (!step2Validation.isValid) {
        setStep(2);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        toast.error(t('toast.error.pleaseFillInAllRequiredParentGuardianInformation'));
        scrollToError(2, step2Validation.errors);
      } else if (!step3Validation.isValid) {
        setStep(3);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        toast.error('Please upload all required documents');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the classId from the selected classGrade and section
      const selectedClass = classesWithTeachers.find(cls => cls.name === formData.classGrade && cls.section === formData.section);

      if (!selectedClass) {
        logger.error('❌ Selected class not found!');
        logger.error('❌ Looking for classGrade:', formData.classGrade, 'section:', formData.section);
        logger.error('❌ Available classes:', classesWithTeachers.map(cls => ({ id: cls.id, name: cls.name, section: cls.section })));
        toast.error(t('toast.error.selectedClassNotFound'));
        setIsSubmitting(false);
        return;
      }

      if (!selectedClass.id) {
        logger.error('❌ Selected class has no ID!', selectedClass);
        toast.error(t('toast.error.classIdIsMissingPleaseRefreshAndTryAgain'));
        setIsSubmitting(false);
        return;
      }

      // Check if section has reached capacity
      try {
        const capacityData = await classesApi.checkCapacity(selectedClass.id);

        if (capacityData.isFull) {
          toast.error(`Section ${selectedClass.name}-${selectedClass.section} is full (${capacityData.current}/${capacityData.capacity} students). Please create a new section.`, {
            duration: 5000,
            icon: '🚫'
          });
          setIsSubmitting(false);
          return;
        }

      } catch (error) {
        logger.error('Failed to check capacity:', error);
        // Continue anyway - let backend handle it
      }

      // Upload photo to Cloudinary if it's a File object
      let photoUrl = null;
      if (formData.picture instanceof File) {
        const loadingToast = toast.loading(t('toast.loading.uploadingPhoto'));
        try {
          const uploadResponse = await uploadApi.uploadFile(formData.picture);
          photoUrl = uploadResponse.url;
          toast.success("Photo uploaded", { id: loadingToast });
        } catch (error) {
          logger.error('❌ Photo upload failed:', error);
          toast.error("Photo upload failed", { id: loadingToast });
          // Continue without photo
        }
      } else if (typeof formData.picture === 'string' && formData.picture.length > 0) {
        // If it's already a URL string (editing existing student)
        photoUrl = formData.picture;
      }

      // Upload documents to Cloudinary
      const documents = [];
      const uploadDate = new Date().toISOString();

      // Helper function to generate unique ID
      const generateUniqueId = () => {
        return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      };

      // Show loading toast for document uploads
      const docsLoadingToast = toast.loading(t('toast.loading.uploadingDocuments'));

      try {
        // Upload Birth Certificate
        if (formData.birthCertificate instanceof File) {
          try {
            const uploadResponse = await uploadApi.uploadFile(formData.birthCertificate);
            documents.push({
              id: generateUniqueId(),
              name: "Birth Certificate",
              type: formData.birthCertificate.type || "application/pdf",
              category: "birthCertificate",
              url: uploadResponse.url,
              uploadDate: uploadDate,
              size: formData.birthCertificate.size || 'Unknown',
              date: formatShortDate(new Date())
            });
          } catch (error) {
            logger.error('❌ Birth certificate upload failed:', error);
            // Continue with other documents
          }
        }

        // Upload Transfer Certificate
        if (formData.transferCertificate instanceof File) {
          try {
            const uploadResponse = await uploadApi.uploadFile(formData.transferCertificate);
            documents.push({
              id: generateUniqueId(),
              name: "Transfer Certificate",
              type: formData.transferCertificate.type || "application/pdf",
              category: "transferCertificate",
              url: uploadResponse.url,
              uploadDate: uploadDate,
              size: formData.transferCertificate.size || 'Unknown',
              date: formatShortDate(new Date())
            });
          } catch (error) {
            logger.error('❌ Transfer certificate upload failed:', error);
            // Continue with other documents
          }
        }

        // Upload Aadhaar Card (Front & Back as single document)
        if (formData.aadhaarFront instanceof File || formData.aadhaarBack instanceof File) {
          try {
            const aadhaarDoc = {
              id: generateUniqueId(),
              name: "Aadhaar Card",
              type: "application/pdf",
              category: "aadhaarCard",
              uploadDate: uploadDate,
              size: 'Unknown',
              date: formatShortDate(new Date())
            };

            // Upload front side
            if (formData.aadhaarFront instanceof File) {
              const frontResponse = await uploadApi.uploadFile(formData.aadhaarFront);
              aadhaarDoc.front = {
                url: frontResponse.url,
                uploadDate: uploadDate
              };
            }

            // Upload back side
            if (formData.aadhaarBack instanceof File) {
              const backResponse = await uploadApi.uploadFile(formData.aadhaarBack);
              aadhaarDoc.back = {
                url: backResponse.url,
                uploadDate: uploadDate
              };
            }

            documents.push(aadhaarDoc);
          } catch (error) {
            logger.error('❌ Aadhaar card upload failed:', error);
            // Continue with other documents
          }
        }

        // Upload Other Documents
        if (Array.isArray(formData.otherDocuments) && formData.otherDocuments.length > 0) {
          for (let i = 0; i < formData.otherDocuments.length; i++) {
            const doc = formData.otherDocuments[i];
            if (doc instanceof File) {
              try {
                const uploadResponse = await uploadApi.uploadFile(doc);
                documents.push({
                  id: generateUniqueId(),
                  name: doc.name,
                  type: doc.type || "application/pdf",
                  category: "other",
                  url: uploadResponse.url,
                  uploadDate: uploadDate,
                  size: doc.size || 'Unknown',
                  date: formatShortDate(new Date())
                });
              } catch (error) {
                logger.error(`❌ Other document ${i + 1} upload failed:`, error);
                // Continue with next document
              }
            }
          }
        }

        if (documents.length > 0) {
          toast.success(`${documents.length} document(s) uploaded`, { id: docsLoadingToast });
        } else {
          toast.dismiss(docsLoadingToast);
        }
      } catch (error) {
        logger.error('❌ Document upload error:', error);
        toast.dismiss(docsLoadingToast);
        // Continue even if document uploads fail
      }

      // Transform data for saving
      // Convert date from DD/MM/YYYY to YYYY-MM-DD for database storage
      let formattedDateOfBirth = formData.dateOfBirth;
      if (formData.dateOfBirth && formData.dateOfBirth.includes('/')) {
        const [day, month, year] = formData.dateOfBirth.split('/');
        formattedDateOfBirth = `${year}-${month}-${day}`;
      }

      // For edits, preserve existing admission ID; for new students, the backend
      // generates it atomically during creation (no separate fetch needed).
      const admissionId = initialData ? initialData.admissionId : undefined;

      // Use school-configured academic year from context
      const academicYear = currentAcademicYear;

      const studentData = {
        name: formData.fullName,
        admissionId: admissionId,
        academicYear: academicYear,
        classId: selectedClass?._id || selectedClass?.id,
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
        mediumOfInstruction: formData.mediumOfInstruction,
        house: formData.house,
        transportRequired: formData.transportRequired,
        hostelRequired: formData.hostelRequired,
        medicalConditions: formData.medicalConditions,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        alternatePhone: formData.alternatePhone,
        isWhatsapp: formData.isWhatsapp,
        whatsappNumber: formData.whatsappNumber,
        // Use the uploaded photo URL (not the File object)
        photo: photoUrl,
      };

      // Add documents array if we have new documents to upload
      if (documents.length > 0) {
        studentData.documents = documents;
      } else if (initialData?.documents && initialData.documents.length > 0) {
        // Preserve existing documents when editing and no new documents uploaded
        studentData.documents = initialData.documents;
      }

      // Add status and feeStatus (only for new students, preserve when editing)
      if (!initialData) {
        studentData.status = "active";
        studentData.feeStatus = "pending";
      } else {
        if (initialData.status) studentData.status = initialData.status;
        if (initialData.feeStatus) studentData.feeStatus = initialData.feeStatus;
      }

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

      await onSave(studentData);
      // Reset submitting state after successful save
      setIsSubmitting(false);
      // Reset dirty state after successful save
      setHasUnsavedChanges(false);
      // Clear draft from sessionStorage
      sessionStorage.removeItem('student-form-draft');
      sessionStorage.removeItem('student-form-draft-step');
      // Success toast is shown in parent component
    } catch (error) {
      logger.error('Error submitting student:', error);

      // For roll number conflicts, show clear error
      if (error.message && error.message.toLowerCase().includes('roll number')) {
        toast.error('This roll number is already taken. Please contact administrator to check roll number settings for this section.', {
          duration: 5000
        });
        setIsSubmitting(false);
        return;
      }

      // For other errors, reset submitting state
      setIsSubmitting(false);
      // Error toast is shown in parent component
    }
  };

  // --- Render Steps ---
  const renderStep1 = () => (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Profile Section */}
      <div className="flex items-center gap-5">
        {formData.picture ? (
          <Avatar
            src={picturePreviewUrl}
            className="w-20 h-20 text-3xl"
            isBordered
            radius="full"
            color="primary"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full border-2 border-default-200 bg-default-50 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors"
            onClick={() => pictureInputRef.current?.click()}
          >
            <User size={32} className="text-default-400" />
          </div>
        )}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-semibold text-primary hover:text-primary-600 transition-colors cursor-pointer"
              onClick={() => setIsCameraCaptureOpen(true)}
            >
              {formData.picture ? "Change Photo" : "Add Photo"}
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
            Take a photo or upload from device
          </p>
        </div>
      </div>

      {/* Personal Information - Full Name & Date of Birth in same row */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.personalInformation1')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div ref={fullNameRef}>
            <Input
              label={t('pages.fullName1')}
              labelPlacement="outside"
              placeholder={t('pages.enterStudentSFullName')}
              value={formData.fullName}
              onValueChange={val => updateField("fullName", val.replace(/[0-9]/g, ''))}
              isInvalid={!!errors.fullName}
              errorMessage={errors.fullName}
              variant="bordered"
              radius="sm"
              isRequired
              classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            />
          </div>

          {/* Date of Birth */}
          <div ref={dobRef} className="space-y-1">
            <label className="text-xs font-medium text-default-600">Date of Birth <span className="text-danger">*</span></label>

            <div className="relative">
              <Input
                labelPlacement="outside"
                placeholder={t('students.form.dobPlaceholder')}
                value={formData.dateOfBirth || ''}
                onClick={() => setIsDobCalendarOpen(true)}
                onFocus={() => setIsDobCalendarOpen(true)}
                onValueChange={(value) => {
                  const currentYear = new Date().getFullYear();
                  const maxYear = currentYear - 1;

                  // Extract digits from input
                  const digits = value.replace(/\D/g, '');

                  // Filter and validate digits in real-time
                  let filteredDigits = '';
                  let dayPart = '';
                  let monthPart = '';

                  if (digits.length > 0) {
                    // DAY VALIDATION (positions 0-1)
                    const firstDigit = digits[0];

                    // Block invalid first digits (4-9 are invalid for day)
                    if (firstDigit >= '4') {
                      // Don't allow this digit at all
                      filteredDigits = '';
                    } else {
                      dayPart = firstDigit;

                      // Second digit of day
                      if (digits.length >= 2) {
                        const secondDigit = digits[1];

                        // If first digit is 0-2, any second digit is allowed (00-29)
                        if (firstDigit <= '2') {
                          dayPart = firstDigit + secondDigit;
                        }
                        // If first digit is 3, only allow 0 or 1 (30, 31)
                        else if (firstDigit === '3') {
                          if (secondDigit === '0' || secondDigit === '1') {
                            dayPart = firstDigit + secondDigit;
                          } else {
                            // Block invalid second digit, keep only first
                            dayPart = firstDigit;
                          }
                        }
                      }

                      filteredDigits = dayPart;

                      // MONTH VALIDATION (positions 2-3)
                      if (digits.length >= 3 && dayPart.length === 2) {
                        const monthFirstDigit = digits[2];

                        // Block invalid first month digits (2-9 are invalid)
                        if (monthFirstDigit >= '2') {
                          // Don't add this digit
                          monthPart = '';
                        } else {
                          monthPart = monthFirstDigit;

                          // Second digit of month
                          if (digits.length >= 4) {
                            const monthSecondDigit = digits[3];

                            // If first digit is 0, any second digit is allowed (01-09)
                            if (monthFirstDigit === '0') {
                              monthPart = monthFirstDigit + monthSecondDigit;
                            }
                            // If first digit is 1, only allow 0-2 (10, 11, 12)
                            else if (monthFirstDigit === '1') {
                              if (monthSecondDigit >= '0' && monthSecondDigit <= '2') {
                                monthPart = monthFirstDigit + monthSecondDigit;
                              } else {
                                // Block invalid second digit, keep only first
                                monthPart = monthFirstDigit;
                              }
                            }
                          }

                          filteredDigits = dayPart + monthPart;
                        }

                        // YEAR VALIDATION (positions 4-7)
                        if (digits.length >= 5 && monthPart.length === 2) {
                          const yearDigits = digits.slice(4);

                          // Only allow 4 digits for year
                          if (yearDigits.length <= 4) {
                            // For each digit being typed, validate the partial year
                            let yearToCheck = yearDigits;

                            // If we have 4 digits, validate the full year
                            if (yearDigits.length === 4) {
                              const fullYear = parseInt(yearDigits);

                              // Block years before 1900
                              if (fullYear < 1900) {
                                // Don't allow this year
                                yearToCheck = '';
                              }
                              // Block current year and future years
                              else if (fullYear > maxYear) {
                                // Don't allow this year
                                yearToCheck = '';
                              } else {
                                yearToCheck = yearDigits;
                              }
                            } else {
                              // For partial years (1-3 digits), allow typing but be more restrictive
                              // If first digit is 0 or 1, that's fine (years 1000-1999)
                              // If first digit is 2, second digit must be 0 (years 2000-2099)
                              if (yearDigits.length >= 1) {
                                const firstYearDigit = yearDigits[0];

                                // Block years starting with 0 or 1 (too old)
                                if (firstYearDigit === '0' || firstYearDigit === '1') {
                                  yearToCheck = '';
                                }
                                // For years starting with 2, ensure second digit is 0
                                else if (firstYearDigit === '2') {
                                  if (yearDigits.length >= 2) {
                                    const secondYearDigit = yearDigits[1];
                                    if (secondYearDigit !== '0') {
                                      // Block anything other than 20xx
                                      yearToCheck = '2';
                                    } else {
                                      yearToCheck = yearDigits;
                                    }
                                  } else {
                                    yearToCheck = yearDigits;
                                  }
                                }
                                // Block years starting with 3-9 (future years)
                                else if (firstYearDigit >= '3') {
                                  yearToCheck = '';
                                } else {
                                  yearToCheck = yearDigits;
                                }
                              }
                            }

                            filteredDigits = dayPart + monthPart + yearToCheck;
                          }
                        }
                      }
                    }
                  }

                  // Format with slashes
                  let formatted = '';
                  if (filteredDigits.length >= 1) {
                    formatted += filteredDigits.slice(0, 2);
                    if (filteredDigits.length >= 3) {
                      formatted += '/' + filteredDigits.slice(2, 4);
                      if (filteredDigits.length >= 5) {
                        formatted += '/' + filteredDigits.slice(4, 8);
                      }
                    }
                  }

                  updateField("dateOfBirth", formatted);

                  // Validate in real-time if we have a complete date
                  if (/^\d{2}\/\d{2}\/\d{4}$/.test(formatted)) {
                    validateDOBInRealTime(formatted);
                  } else {
                    setDobValidation({ isValid: false, message: '', warning: '' });
                  }
                }}
                isInvalid={!!errors.dateOfBirth}
                errorMessage={errors.dateOfBirth}
                variant="bordered"
                radius="sm"
                isRequired
                classNames={{
                  inputWrapper: "bg-background border-1 border-default-200 hover:border-primary-400 hover:bg-default-50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 h-10 pr-10 cursor-pointer"
                }}
                endContent={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDobCalendarOpen(true);
                    }}
                    className="flex items-center justify-center"
                  >
                    <Calendar
                      size={18}
                      className="text-default-500 cursor-pointer hover:text-primary transition-colors"
                    />
                  </button>
                }
              />

              {/* Calendar dropdown - shows ONLY calendar, no nested input */}
              {isDobCalendarOpen && (
                <div className="absolute z-50 mt-1">
                  <ClickAwayListener onClickAway={() => setIsDobCalendarOpen(false)}>
                    <CustomCalendar
                      selectedDate={(() => {
                        if (!formData.dateOfBirth) return null;
                        const isoDate = ddmmyyToIso(formData.dateOfBirth);
                        if (!isoDate) return null;
                        const parsed = parse(isoDate, 'yyyy-MM-dd', new Date());
                        return isValid(parsed) ? parsed : null;
                      })()}
                      onSelect={(date) => {
                        const ddmmyy = format(date, 'dd/MM/yyyy');
                        updateField("dateOfBirth", ddmmyy);
                        validateDOBInRealTime(ddmmyy);
                        setIsDobCalendarOpen(false);
                      }}
                    />
                  </ClickAwayListener>
                </div>
              )}
            </div>

            {dobValidation.message && (
              <p className={`text-xs mt-1 ${dobValidation.isValid ? 'text-success' : dobValidation.warning ? 'text-warning' : 'text-default-500'}`}>
                {dobValidation.message}
              </p>
            )}
            {dobValidation.warning && (
              <p className="text-xs text-warning mt-1">⚠️ {dobValidation.warning}</p>
            )}
          </div>
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2" ref={genderRef}>
        <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Gender <span className="text-red-500">*</span></label>
        <RadioGroup
          orientation="horizontal"
          value={formData.gender}
          onValueChange={val => updateField("gender", val)}
          classNames={{ wrapper: "gap-4" }}
          isInvalid={!!errors.gender}
          errorMessage={errors.gender}
        >
          {GENDERS.map(gender => (
            <Radio key={gender} value={gender} size="sm" classNames={{ label: "text-sm" }}>{gender}</Radio>
          ))}
        </RadioGroup>
      </div>

      {/* Class Info */}
      <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.classInformation')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Class Selection */}
          <div ref={classRef}>
            <Select
              label={t('pages.class1')}
              labelPlacement="outside"
              placeholder={t('pages.selectClass2')}
              selectedKeys={formData.classGrade ? [formData.classGrade] : []}
              onSelectionChange={keys => {
                const selectedClass = classesWithTeachers.find(cls => cls.name === Array.from(keys)[0]);
                updateField("classGrade", Array.from(keys)[0]);
                updateField("section", selectedClass?.section || ""); // Auto-select section
                updateField("rollNumber", ""); // Reset roll number
              }}
              isRequired
              isInvalid={!!errors.classGrade}
              errorMessage={errors.classGrade}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            >
              {uniqueClassNames.map(className => (
                <SelectItem key={className}>{className}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Section Selection */}
          <div>
            <Select
              label={t('pages.section1')}
              labelPlacement="outside"
              placeholder={t('pages.selectSection')}
              selectedKeys={formData.section ? [formData.section] : []}
              onSelectionChange={keys => updateField("section", Array.from(keys)[0])}
              isRequired
              isDisabled={!formData.classGrade}
              isInvalid={!!errors.section}
              errorMessage={errors.section}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            >
              {availableSections.map(section => (
                <SelectItem key={section}>{section}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <Input
            label={t('pages.rollNumber2')}
            labelPlacement="outside"
            placeholder={t('pages.autoGenerated')}
            value={formData.rollNumber}
            variant="bordered"
            radius="sm"
            isReadOnly
            description="Auto-generated from roll number settings. Cannot be modified."
            classNames={{ inputWrapper: "bg-default-50 border-1 border-default-200 h-10" }}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.contactDetails1')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label={t('pages.mobileNumber')}
              labelPlacement="outside"
              startContent={<span className="text-default-400 text-xs">+91</span>}
              placeholder={t('pages.studentSMobileIfAny')}
              value={formData.mobile}
              onValueChange={val => {
                const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
                updateField("mobile", digitsOnly);
              }}
              variant="bordered"
              radius="sm"
              maxLength={10}
              classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            />
            <Checkbox size="sm" isSelected={formData.isWhatsapp} onValueChange={val => updateField("isWhatsapp", val)}
              classNames={{ label: "text-xs text-default-500" }}>
              Same for WhatsApp
            </Checkbox>
          </div>
          <Input
            label={t('pages.emailAddress')}
            labelPlacement="outside"
            placeholder={t('students.form.studentEmailPlaceholder')}
            value={formData.email}
            onValueChange={val => updateField("email", val)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          {!formData.isWhatsapp && (
            <Input
              label={t('pages.whatsAppNumber')}
              labelPlacement="outside"
              startContent={<span className="text-default-400 text-xs">+91</span>}
              placeholder={t('pages.whatsAppNumber')}
              value={formData.whatsappNumber}
              onValueChange={val => updateField("whatsappNumber", val)}
              variant="bordered"
              radius="sm"
              classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            />
          )}
        </div>
        <Textarea
          label={t('pages.address2')}
          labelPlacement="outside"
          placeholder={t('pages.fullResidentialAddress')}
          value={formData.address}
          onValueChange={val => updateField("address", val)}
          variant="bordered"
          radius="sm"
          isRequired
          minRows={2}
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300" }}
        />
        <div className="grid grid-cols-3 gap-4">
          <Input
            label={t('pages.city1')}
            labelPlacement="outside"
            placeholder={t('pages.city1')}
            value={formData.city}
            onValueChange={val => {
              updateField("city", val);
              manualCityStateEntryRef.current = true;  // Mark as manually entered
            }}
            variant="bordered"
            radius="sm"
            isRequired
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <div className="relative">
            <Select
              key="state-select"
              label={t('pages.state1')}
              labelPlacement="outside"
              placeholder={t('pages.selectState')}
              selectedKeys={stateSelectedKeys}
              onSelectionChange={keys => {
                updateField("state", Array.from(keys)[0]);
                manualCityStateEntryRef.current = true;  // Mark as manually entered
              }}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            >
              {INDIAN_STATES.map(state => <SelectItem key={state}>{state}</SelectItem>)}
            </Select>
          </div>
          <div className="relative">
            <Input
              label={t('pages.zIPCode')}
              labelPlacement="outside"
              placeholder={t('pages.pINCode')}
              value={formData.zipCode}
              onValueChange={val => {
                const digitsOnly = val.replace(/\D/g, '').slice(0, 6);
                updateField("zipCode", digitsOnly);

                // Clear previous timeout
                if (zipLookupTimeoutRef.current) {
                  clearTimeout(zipLookupTimeoutRef.current);
                }

                // Trigger lookup when exactly 6 digits are entered
                if (digitsOnly.length === 6) {
                  // Debounce by 500ms
                  zipLookupTimeoutRef.current = setTimeout(async () => {
                    setIsZipLookupLoading(true);
                    try {
                      const locationData = await lookupPincode(digitsOnly);
                      if (locationData) {
                        // Normalize state name to match predefined list
                        const normalizedState = normalizeStateName(locationData.state);

                        // Autofill city if empty or user hasn't manually entered it
                        if (!formData.city || formData.city.trim() === '' || !manualCityStateEntryRef.current) {
                          updateField("city", locationData.city);
                        }

                        // Autofill state if empty or user hasn't manually entered it
                        if (!formData.state || formData.state.trim() === '' || !manualCityStateEntryRef.current) {
                          // Only update if we found a valid normalized state
                          if (normalizedState) {
                            updateField("state", normalizedState);
                          }
                        }
                      }
                    } catch (error) {
                      logger.error('PIN code lookup failed:', error);
                      // Silent fail - allow manual entry
                    } finally {
                      setIsZipLookupLoading(false);
                    }
                  }, 500);
                }
              }}
              variant="bordered"
              radius="sm"
              isRequired
              maxLength={6}
              isLoading={isZipLookupLoading}
              classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
            />
            {/* Absolute positioned loading indicator to prevent layout shift */}
            {isZipLookupLoading && (
              <div className="absolute -bottom-5 left-0 text-xs text-default-500 whitespace-nowrap">
                Looking up location...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optional Fields */}
      <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.optionalInformation')}</h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 -mt-1">{t('pages.theseFieldsAreOptionalAndCanBeFilledLater')}</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('pages.aadhaarNumber')}
            labelPlacement="outside"
            placeholder={t('students.form.aadhaarPlaceholder')}
            value={formData.aadhaarNumber}
            onValueChange={val => updateField("aadhaarNumber", val.replace(/\D/g, '').slice(0, 12))}
            variant="bordered"
            radius="sm"
            maxLength={12}
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Select
            label={t('pages.bloodGroup1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.bloodGroup ? [formData.bloodGroup] : []}
            onSelectionChange={keys => updateField("bloodGroup", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {BLOOD_GROUPS.map(bg => <SelectItem key={bg}>{bg}</SelectItem>)}
          </Select>
          <Input
            label={t('pages.nationality1')}
            labelPlacement="outside"
            placeholder={t('students.form.nationalityPlaceholder')}
            value={formData.nationality}
            onValueChange={val => updateField("nationality", val)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Select
            label={t('pages.religion1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.religion ? [formData.religion] : []}
            onSelectionChange={keys => updateField("religion", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {RELIGIONS.map(rel => <SelectItem key={rel}>{rel}</SelectItem>)}
          </Select>
          <Select
            label={t('pages.category1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.category ? [formData.category] : []}
            onSelectionChange={keys => updateField("category", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {CATEGORIES.map(cat => <SelectItem key={cat}>{cat}</SelectItem>)}
          </Select>
          <Select
            label={t('pages.motherTongue1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.motherTongue ? [formData.motherTongue] : []}
            onSelectionChange={keys => updateField("motherTongue", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {MOTHER_TONGUES.map(tongue => <SelectItem key={tongue}>{tongue}</SelectItem>)}
          </Select>
          <Input
            label={t('pages.previousSchool1')}
            labelPlacement="outside"
            placeholder={t('pages.nameOfPreviousSchool')}
            value={formData.previousSchool}
            onValueChange={val => updateField("previousSchool", val)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Input
            label={t('pages.transferCertificateNo')}
            labelPlacement="outside"
            placeholder={t('pages.tCNumber')}
            value={formData.tcNumber}
            onValueChange={val => updateField("tcNumber", val.replace(/\D/g, ''))}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Input
            label={t('pages.mediumOfInstruction')}
            labelPlacement="outside"
            placeholder={t('pages.enterMediumOfInstruction')}
            value={formData.mediumOfInstruction}
            onValueChange={val => updateField("mediumOfInstruction", val)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Input
            label={t('pages.house')}
            labelPlacement="outside"
            placeholder={t('pages.enterHouse')}
            value={formData.house}
            onValueChange={val => updateField("house", val)}
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
    const parents = formData.parents.filter(entry => entry.isParent);
    const guardians = formData.parents.filter(entry => !entry.isParent);

    return (
      <div className="space-y-5 animate-fade-in text-left">
        {/* Parent Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.parentDetails')}</h3>

          {parents.map((parent, idx) => {
            const index = formData.parents.findIndex(entry => entry === parent);
            return (
              <div key={`parent-${idx}`} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
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
                      label={t('pages.fullName1')}
                      labelPlacement="outside"
                      placeholder={t('pages.parentName1')}
                      value={parent.name}
                      onValueChange={val => updateParent(index, "name", val)}
                      isInvalid={index === 0 && !!errors.parentName}
                      errorMessage={index === 0 ? errors.parentName : ""}
                      variant="bordered"
                      radius="sm"
                      isRequired={index === 0}
                      classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                    />
                  </div>
                  <Select
                    label={t('pages.relationship')}
                    labelPlacement="outside"
                    placeholder={t('pages.select1')}
                    selectedKeys={parent.relationship ? [parent.relationship] : []}
                    onSelectionChange={keys => updateParent(index, "relationship", Array.from(keys)[0])}
                    variant="bordered"
                    radius="sm"
                    classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  >
                    {PARENT_RELATIONSHIPS.map(rel => <SelectItem key={rel}>{rel}</SelectItem>)}
                  </Select>
                  <div className="space-y-2" ref={index === 0 ? parentPhoneRef : null}>
                    <Input
                      label={t('pages.phoneNumber')}
                      labelPlacement="outside"
                      startContent={<span className="text-default-400 text-xs">+91</span>}
                      placeholder={t('students.form.phonePlaceholder')}
                      value={parent.phone}
                      onValueChange={val => {
                        // Only allow digits and limit to 10 characters
                        const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
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
                    <Checkbox size="sm" isSelected={parent.isWhatsapp} onValueChange={val => updateParent(index, "isWhatsapp", val)}
                      classNames={{ label: "text-xs text-default-500" }}>
                      Same as WhatsApp
                    </Checkbox>
                  </div>
                  <Input
                    label={t('pages.email1')}
                    labelPlacement="outside"
                    placeholder={t('students.form.parentEmailPlaceholder')}
                    value={parent.email}
                    onValueChange={val => updateParent(index, "email", val)}
                    variant="bordered"
                    radius="sm"
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                  <Input
                    label={t('pages.occupation')}
                    labelPlacement="outside"
                    placeholder={t('students.form.occupationPlaceholder')}
                    value={parent.occupation}
                    onValueChange={val => updateParent(index, "occupation", val)}
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
        <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.guardianDetails')}</h3>
            <span className="text-xs text-gray-400 dark:text-zinc-500">(Optional)</span>
          </div>

          {guardians.map((guardian, idx) => {
            const index = formData.parents.findIndex(entry => entry === guardian);
            return (
              <div key={`guardian-${idx}`} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
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
                    label={t('pages.fullName1')}
                    labelPlacement="outside"
                    placeholder={t('pages.guardianName')}
                    value={guardian.name}
                    onValueChange={val => updateParent(index, "name", val)}
                    variant="bordered"
                    radius="sm"
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                  <Select
                    label={t('pages.relationship')}
                    labelPlacement="outside"
                    placeholder={t('pages.select1')}
                    selectedKeys={guardian.relationship ? [guardian.relationship] : []}
                    onSelectionChange={keys => updateParent(index, "relationship", Array.from(keys)[0])}
                    variant="bordered"
                    radius="sm"
                    classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  >
                    {GUARDIAN_RELATIONSHIPS.map(rel => <SelectItem key={rel}>{rel}</SelectItem>)}
                  </Select>
                  <div className="space-y-2">
                    <Input
                      label={t('pages.phoneNumber')}
                      labelPlacement="outside"
                      startContent={<span className="text-default-400 text-xs">+91</span>}
                      placeholder={t('students.form.phonePlaceholder')}
                      value={guardian.phone}
                      onValueChange={val => {
                        const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
                        updateParent(index, "phone", digitsOnly);
                      }}
                      variant="bordered"
                      radius="sm"
                      maxLength={10}
                      classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                    />
                    <Checkbox size="sm" isSelected={guardian.isWhatsapp} onValueChange={val => updateParent(index, "isWhatsapp", val)}
                      classNames={{ label: "text-xs text-default-500" }}>
                      Same as WhatsApp
                    </Checkbox>
                  </div>
                  <Input
                    label={t('pages.email1')}
                    labelPlacement="outside"
                    placeholder={t('students.form.guardianEmailPlaceholder')}
                    value={guardian.email}
                    onValueChange={val => updateParent(index, "email", val)}
                    variant="bordered"
                    radius="sm"
                    classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  />
                  <Input
                    label={t('pages.occupation')}
                    labelPlacement="outside"
                    placeholder={t('students.form.occupationPlaceholder')}
                    value={guardian.occupation}
                    onValueChange={val => updateParent(index, "occupation", val)}
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
        <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.siblingDetails')}</h3>
            <span className="text-xs text-gray-400 dark:text-zinc-500">(Siblings in same school only)</span>
          </div>

          {formData.siblings.map((sibling, idx) => (
            <div key={`sibling-${idx}`} className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
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
                  label={t('pages.siblingName')}
                  labelPlacement="outside"
                  placeholder={t('pages.siblingSFullName')}
                  value={sibling.name}
                  onValueChange={val => updateSibling(idx, "name", val)}
                  variant="bordered"
                  radius="sm"
                  classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                />
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox size="sm"
                    isSelected={sibling.inSameSchool}
                    onValueChange={val => {
                      updateSibling(idx, "inSameSchool", val);
                      if (!val) updateSibling(idx, "classId", "");
                    }}
                  >
                    <span className="text-sm text-default-700">{t('pages.isSiblingInThisSchool')}</span>
                  </Checkbox>
                </div>
                {sibling.inSameSchool && (
                  <Select
                    label={t('pages.class1')}
                    labelPlacement="outside"
                    placeholder={t('pages.selectClass2')}
                    selectedKeys={sibling.classId ? [sibling.classId] : []}
                    onSelectionChange={keys => updateSibling(idx, "classId", Array.from(keys)[0])}
                    variant="bordered"
                    radius="sm"
                    classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
                  >
                    {classesWithTeachers.map(cls => (
                      <SelectItem key={cls.id}>
                        {cls.name} {cls.section}
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
        <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.healthSafety')}</h3>
          <Textarea
            label={t('pages.medicalConditions1')}
            labelPlacement="outside"
            placeholder={t('pages.anyAllergiesMedicalConditionsOrSpecialNeedsOptional')}
            value={formData.medicalConditions}
            onValueChange={val => updateField("medicalConditions", val)}
            variant="bordered"
            radius="sm"
            minRows={2}
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300" }}
          />
        </div>

        {/* Transport & Hostel */}
        <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{t('pages.additionalRequirements')}</h3>
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
                <p className="text-xs text-default-500">{t('pages.schoolBusFacility')}</p>
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
                <p className="text-xs text-default-500">{t('pages.boardingFacility')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-default-900">{t('pages.documentUploads')}</label>
        <p className="text-xs text-default-500">
          {documentConfigs.some(c => c.isRequired)
            ? 'Upload required documents. Fields marked with * are mandatory.'
            : t('pages.uploadRequiredDocumentsAllDocumentsAreOptionalAndCanBeUploadedLater')}
        </p>
      </div>

      {/* Birth Certificate */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">
          {t('pages.birthCertificate')}
          {isDocRequired('birthCertificate') && <span className="text-danger ml-1">*</span>}
        </label>
        <div
          className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors ${errors.birthCertificate ? 'border-danger' : 'border-default-300'}`}
          role="button"
          tabIndex={0}
          onClick={() => birthCertRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); birthCertRef.current?.click(); } }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.birthCertificate ? (
              <span className="text-sm text-default-700">{formData.birthCertificate.name}</span>
            ) : (
              <span className="text-sm text-default-500">{t('pages.clickToUploadBirthCertificate')}</span>
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
        {errors.birthCertificate && <p className="text-xs text-danger">{errors.birthCertificate}</p>}
        <input ref={birthCertRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("birthCertificate", e.target.files[0])} />
      </div>

      {/* Transfer Certificate */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">
          {t('pages.transferCertificateTc')}
          {isDocRequired('transferCertificate') && <span className="text-danger ml-1">*</span>}
        </label>
        <div
          className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors ${errors.transferCertificate ? 'border-danger' : 'border-default-300'}`}
          role="button"
          tabIndex={0}
          onClick={() => tcRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tcRef.current?.click(); } }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.transferCertificate ? (
              <span className="text-sm text-default-700">{formData.transferCertificate.name}</span>
            ) : (
              <span className="text-sm text-default-500">{t('pages.clickToUploadTransferCertificate')}</span>
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
        {errors.transferCertificate && <p className="text-xs text-danger">{errors.transferCertificate}</p>}
        <input ref={tcRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("transferCertificate", e.target.files[0])} />
      </div>

      {/* Aadhaar Card (Front & Back) */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">
          {t('pages.aadhaarCardFrontBack')}
          {isDocRequired('aadhaarFront') && <span className="text-danger ml-1">*</span>}
        </label>
        <p className="text-xs text-default-500">{t('pages.uploadBothSidesOfTheAadhaarCard')}</p>

        {/* Front Side */}
        <div
          className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors ${errors.aadhaarFront ? 'border-danger' : 'border-default-300'}`}
          role="button"
          tabIndex={0}
          onClick={() => aadhaarFrontRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aadhaarFrontRef.current?.click(); } }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.aadhaarFront ? (
              <span className="text-sm text-default-700">Front: {formData.aadhaarFront.name}</span>
            ) : (
              <span className="text-sm text-default-500">{t('pages.clickToUploadFrontSide')}</span>
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
        {errors.aadhaarFront && <p className="text-xs text-danger">{errors.aadhaarFront}</p>}
        <input ref={aadhaarFrontRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("aadhaarFront", e.target.files[0])} />

        {/* Back Side */}
        <div
          className={`border border-solid rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-default-50 transition-colors ${errors.aadhaarBack ? 'border-danger' : 'border-default-300'}`}
          role="button"
          tabIndex={0}
          onClick={() => aadhaarBackRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aadhaarBackRef.current?.click(); } }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-default-400" />
            {formData.aadhaarBack ? (
              <span className="text-sm text-default-700">Back: {formData.aadhaarBack.name}</span>
            ) : (
              <span className="text-sm text-default-500">{t('pages.clickToUploadBackSide')}</span>
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
        {errors.aadhaarBack && <p className="text-xs text-danger">{errors.aadhaarBack}</p>}
        <input ref={aadhaarBackRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleFileUpload("aadhaarBack", e.target.files[0])} />
      </div>

      {/* Other Documents */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-default-600">{t('pages.otherDocuments')}</label>
        <p className="text-xs text-default-500">Upload any other relevant documents (medical records, previous report cards, etc.)</p>
        <div
          className="border border-solid border-default-300 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-default-50 transition-colors"
          role="button"
          tabIndex={0}
          onClick={() => otherDocsRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); otherDocsRef.current?.click(); } }}
        >
          <Upload size={14} className="text-default-500" />
          <span className="text-sm text-default-600">{t('pages.uploadAdditionalDocuments')}</span>
        </div>
        <input ref={otherDocsRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => handleMultiFileUpload("otherDocuments", e.target.files)} />
        {formData.otherDocuments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.otherDocuments?.map((file, i) => (
              <Chip key={file.name || `doc-${i}`} onClose={() => removeFile("otherDocuments", i)} size="sm" variant="flat" className="h-8 border border-default-200 bg-background">
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
      <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
        {/* Stepper */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-700">
          <div className="flex items-center justify-between relative">
            {steps.map((stepItem, i) => {
              const isActive = step >= stepItem.number;
              const isCurrent = step === stepItem.number;
              const isCompleted = step > stepItem.number;
              return (
                <div key={stepItem.number} className="flex flex-col items-center relative z-10 flex-1">
                  {/* Progress line */}
                  {i < steps.length - 1 && (
                    <div className={cn(
                      "absolute top-4 h-0.5 -translate-y-1/2 transition-all duration-300 left-1/2 w-[calc(100%-36px)]",
                      isActive ? "bg-gray-900 dark:bg-zinc-100" : "bg-gray-200 dark:bg-zinc-700"
                    )} />
                  )}
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 relative z-20",
                    isCurrent ? "border-gray-900 text-gray-900 bg-white dark:border-zinc-100 dark:text-zinc-100 dark:bg-zinc-900" :
                      isCompleted ? "border-gray-900 text-white bg-gray-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" :
                        "border-gray-300 text-gray-400 bg-white dark:border-zinc-600 dark:text-zinc-500 dark:bg-zinc-900"
                  )}>
                    {isCompleted ? <Check size={16} strokeWidth={2.5} /> : <stepItem.icon size={16} strokeWidth={2} />}
                  </div>
                  <span className={cn(
                    "text-[11px] font-medium mt-2 uppercase tracking-wide transition-colors duration-200",
                    isCurrent || isCompleted ? "text-gray-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-500"
                  )}>
                    {stepItem.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
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

      {/* Camera Capture Modal - only mount when opened */}
      {isCameraCaptureOpen && (
        <CameraCaptureModal
          isOpen={isCameraCaptureOpen}
          onClose={() => setIsCameraCaptureOpen(false)}
          onPhotoCaptured={handleCameraPhotoCapture}
        />
      )}

      {/* Unsaved Changes Warning Modal */}
      <Modal
        isOpen={isDirtyModalOpen}
        onClose={handleCancelClose}
        size="sm"
        isDismissable={false}
        hideCloseButton
        portalContainer={document.body}
        classNames={{
          base: "z-[999999]",
          wrapper: "z-[999999]",
          backdrop: "z-[999999]",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">{t('pages.unsavedChanges')}</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              You have unsaved changes. Are you sure you want to close? Your changes will be lost.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={handleCancelClose}
            >
              Stay
            </Button>
            <Button
              color="danger"
              variant="flat"
              onPress={handleConfirmClose}
            >
              Discard Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

export default AddStudent;
