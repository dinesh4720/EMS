import { useState, useCallback, useEffect, useRef } from "react";
import { DEFAULT_STUDENT_FORM } from "../../../constants/studentConstants";

/**
 * Custom hook for managing student form state
 * Extracted from AddStudent.jsx to improve maintainability
 * 
 * @param {Object} initialData - Initial student data for editing
 * @returns {Object} Form state and handlers
 */
export function useStudentForm(initialData = null) {
  // Initialize form data
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return normalizeInitialData(initialData);
    }
    return DEFAULT_STUDENT_FORM;
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialFormDataRef = useRef(null);

  // Store initial data for dirty checking
  useEffect(() => {
    const timer = setTimeout(() => {
      initialFormDataRef.current = JSON.stringify(formData);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Detect form changes
  useEffect(() => {
    if (!initialFormDataRef.current) return;
    const currentData = JSON.stringify(formData);
    setHasUnsavedChanges(currentData !== initialFormDataRef.current);
  }, [formData]);

  // Browser navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  /**
   * Update a single form field
   */
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  /**
   * Update a parent at specific index
   */
  const updateParent = useCallback((index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.parents];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, parents: updated };
    });
  }, []);

  /**
   * Add a new parent
   */
  const addParent = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      parents: [
        ...prev.parents,
        {
          name: "",
          relationship: "Mother",
          phone: "",
          email: "",
          occupation: "",
          isWhatsapp: true,
          isParent: true,
        },
      ],
    }));
  }, []);

  /**
   * Remove a parent at specific index
   */
  const removeParent = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      parents: prev.parents.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Update a sibling at specific index
   */
  const updateSibling = useCallback((index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.siblings];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, siblings: updated };
    });
  }, []);

  /**
   * Add a new sibling
   */
  const addSibling = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      siblings: [
        ...prev.siblings,
        { name: "", inSameSchool: true, classId: "" },
      ],
    }));
  }, []);

  /**
   * Remove a sibling at specific index
   */
  const removeSibling = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      siblings: prev.siblings.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Handle single file upload
   */
  const handleFileUpload = useCallback((field, file) => {
    if (file) {
      setFormData((prev) => ({ ...prev, [field]: file }));
    }
  }, []);

  /**
   * Handle multiple file upload
   */
  const handleMultiFileUpload = useCallback((field, files) => {
    if (files && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), ...Array.from(files)],
      }));
    }
  }, []);

  /**
   * Remove a file
   */
  const removeFile = useCallback((field, index) => {
    setFormData((prev) => {
      if (field === "otherDocuments" && Array.isArray(prev[field])) {
        return {
          ...prev,
          [field]: prev[field].filter((_, i) => i !== index),
        };
      }
      return { ...prev, [field]: null };
    });
  }, []);

  /**
   * Validate a specific step
   */
  const validateStep = useCallback((stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Required";
      }

      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Required";
      } else {
        const ddmmyyPattern = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!ddmmyyPattern.test(formData.dateOfBirth)) {
          newErrors.dateOfBirth = "Please enter date in DD/MM/YYYY format";
        }
      }

      if (!formData.gender) {
        newErrors.gender = "Required";
      }
      if (!formData.classGrade) {
        newErrors.classGrade = "Required";
      }
      if (!formData.section) {
        newErrors.section = "Required";
      }
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
  }, [formData]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData(initialData ? normalizeInitialData(initialData) : DEFAULT_STUDENT_FORM);
    setErrors({});
    setHasUnsavedChanges(false);
  }, [initialData]);

  return {
    formData,
    errors,
    isSubmitting,
    hasUnsavedChanges,
    setIsSubmitting,
    setHasUnsavedChanges,
    updateField,
    updateParent,
    addParent,
    removeParent,
    updateSibling,
    addSibling,
    removeSibling,
    handleFileUpload,
    handleMultiFileUpload,
    removeFile,
    validateStep,
    resetForm,
  };
}

/**
 * Normalize initial data from student object to form format
 */
function normalizeInitialData(initialData) {
  let classGrade = "";
  let section = "";

  if (initialData.class) {
    const parts = initialData.class.split("-");
    if (parts.length === 2) {
      classGrade = parts[0];
      section = parts[1];
    }
  }

  return {
    ...DEFAULT_STUDENT_FORM,
    ...initialData,
    fullName: initialData.name || "",
    mobile: initialData.phone || "",
    picture: initialData.photo || null,
    rollNumber: initialData.rollNo?.toString() || "",
    parents: initialData.parents?.length > 0
      ? initialData.parents
      : [{
          name: initialData.parentName || "",
          relationship: initialData.parentRelationship || "Father",
          phone: initialData.parentPhone || "",
          email: initialData.parentEmail || "",
          occupation: initialData.parentOccupation || "",
          isWhatsapp: true,
          isParent: true,
        }],
    siblings: initialData.siblings || [],
    classGrade,
    section,
  };
}
