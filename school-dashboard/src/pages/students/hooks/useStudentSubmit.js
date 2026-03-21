import { useState, useCallback } from "react";
import { studentsApi, settingsApi, uploadApi, classesApi } from "../../../services/api";
import toast from "react-hot-toast";
import { formatDate } from "../../../utils/dateFormatter";

/**
 * Custom hook for handling student form submission
 * Manages photo upload, document upload, data transformation, and API call
 *
 * Extracted from AddStudent.jsx to improve maintainability
 *
 * @param {Object} params
 * @param {Object} params.formData - The current form data state
 * @param {Object|null} params.initialData - Initial student data (null for new student)
 * @param {Array} params.classesWithTeachers - Array of class objects with teacher info
 * @param {Function} params.onSave - Callback after successful save (receives studentData)
 * @param {Function} params.setHasUnsavedChanges - Setter for dirty state tracking
 * @param {Function} params.validateStep - Step validation function
 * @param {Function} params.setErrors - Error state setter
 * @param {Function} params.setStep - Step navigation setter
 * @param {Object} params.scrollContainerRef - Ref for the scrollable container
 * @param {Function} params.scrollToError - Function to scroll to first error field
 * @param {Object} params.errorRefs - Object mapping field names to React refs for scrolling
 * @param {Function} params.t - Translation function
 * @returns {Object} { handleSubmit, isSubmitting }
 */
export function useStudentSubmit({
  formData,
  initialData,
  classesWithTeachers,
  onSave,
  setHasUnsavedChanges,
  validateStep,
  setErrors,
  setStep,
  scrollContainerRef,
  scrollToError,
  errorRefs,
  t,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const step1Validation = validateStep(1);
    const step2Validation = validateStep(2);

    if (!step1Validation.isValid || !step2Validation.isValid) {
      if (!step1Validation.isValid) {
        // validateStep(2) ran after validateStep(1) and overwrote errors state;
        // explicitly restore step 1 errors so they display when we navigate back.
        setErrors(step1Validation.errors);
        setStep(1);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        toast.error(t('students.form.personalInfoRequired', 'Please fill in all required fields in Personal Information'));
        scrollToError(1, step1Validation.errors, errorRefs);
      } else if (!step2Validation.isValid) {
        setErrors(step2Validation.errors);
        setStep(2);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        toast.error(t('students.form.parentsRequired', 'Please fill in all required parent/guardian information'));
        scrollToError(2, step2Validation.errors, errorRefs);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedClass = classesWithTeachers.find(c => c.name === formData.classGrade && c.section === formData.section);

      if (!selectedClass) {
        console.error('Selected class not found!');
        toast.error(t('students.form.classNotFound', 'Selected class not found'));
        setIsSubmitting(false);
        return;
      }

      const classId = selectedClass._id || selectedClass.id;
      if (!classId) {
        console.error('Selected class has no ID!', selectedClass);
        toast.error(t('students.form.classIdMissing', 'Class ID is missing. Please refresh and try again.'));
        setIsSubmitting(false);
        return;
      }

      // Check section capacity
      try {
        const capacityData = await classesApi.checkCapacity(classId);
        if (capacityData.isFull) {
          toast.error(t('students.form.sectionFull', 'Section {{section}} is full ({{current}}/{{capacity}} students). Please create a new section.', { section: `${selectedClass.name}-${selectedClass.section}`, current: capacityData.current, capacity: capacityData.capacity }), {
            duration: 5000,
            icon: '\uD83D\uDEAB'
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Failed to check capacity:', error);
      }

      // Upload photo
      let photoUrl = null;
      if (formData.picture instanceof File) {
        const loadingToast = toast.loading(t('students.uploadingPhoto', 'Uploading photo...'));
        try {
          const uploadResponse = await uploadApi.uploadFile(formData.picture);
          photoUrl = uploadResponse.url;
          toast.success(t('students.photoUploaded', 'Photo uploaded'), { id: loadingToast });
        } catch (error) {
          console.error('Photo upload failed:', error);
          toast.error(t('students.photoUploadFailed', 'Photo upload failed'), { id: loadingToast });
        }
      } else if (typeof formData.picture === 'string' && formData.picture.length > 0) {
        photoUrl = formData.picture;
      }

      // Upload documents
      const documents = [];
      const uploadDate = new Date().toISOString();
      const generateUniqueId = () => `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docsLoadingToast = toast.loading(t('students.uploadingDocuments', 'Uploading documents...'));

      try {
        if (formData.birthCertificate instanceof File) {
          try {
            const uploadResponse = await uploadApi.uploadFile(formData.birthCertificate);
            documents.push({
              id: generateUniqueId(), name: "Birth Certificate",
              type: formData.birthCertificate.type || "application/pdf", category: "birthCertificate",
              url: uploadResponse.url, uploadDate, size: formData.birthCertificate.size || 'Unknown',
              date: formatDate(new Date())
            });
          } catch (error) { console.error('Birth certificate upload failed:', error); }
        }

        if (formData.transferCertificate instanceof File) {
          try {
            const uploadResponse = await uploadApi.uploadFile(formData.transferCertificate);
            documents.push({
              id: generateUniqueId(), name: "Transfer Certificate",
              type: formData.transferCertificate.type || "application/pdf", category: "transferCertificate",
              url: uploadResponse.url, uploadDate, size: formData.transferCertificate.size || 'Unknown',
              date: formatDate(new Date())
            });
          } catch (error) { console.error('Transfer certificate upload failed:', error); }
        }

        if (formData.aadhaarFront instanceof File || formData.aadhaarBack instanceof File) {
          try {
            const aadhaarDoc = {
              id: generateUniqueId(), name: "Aadhaar Card", type: "application/pdf",
              category: "aadhaarCard", uploadDate, size: 'Unknown', date: formatDate(new Date())
            };
            if (formData.aadhaarFront instanceof File) {
              const frontResponse = await uploadApi.uploadFile(formData.aadhaarFront);
              aadhaarDoc.front = { url: frontResponse.url, uploadDate };
            }
            if (formData.aadhaarBack instanceof File) {
              const backResponse = await uploadApi.uploadFile(formData.aadhaarBack);
              aadhaarDoc.back = { url: backResponse.url, uploadDate };
            }
            documents.push(aadhaarDoc);
          } catch (error) { console.error('Aadhaar card upload failed:', error); }
        }

        if (Array.isArray(formData.otherDocuments) && formData.otherDocuments.length > 0) {
          for (let i = 0; i < formData.otherDocuments.length; i++) {
            const doc = formData.otherDocuments[i];
            if (doc instanceof File) {
              try {
                const uploadResponse = await uploadApi.uploadFile(doc);
                documents.push({
                  id: generateUniqueId(), name: doc.name,
                  type: doc.type || "application/pdf", category: "other",
                  url: uploadResponse.url, uploadDate, size: doc.size || 'Unknown',
                  date: formatDate(new Date())
                });
              } catch (error) { console.error(`Other document ${i + 1} upload failed:`, error); }
            }
          }
        }

        if (documents.length > 0) {
          toast.success(t('students.form.documentsUploaded', '{{count}} document(s) uploaded', { count: documents.length }), { id: docsLoadingToast });
        } else {
          toast.dismiss(docsLoadingToast);
        }
      } catch (error) {
        console.error('Document upload error:', error);
        toast.dismiss(docsLoadingToast);
      }

      // Transform data for saving
      let formattedDateOfBirth = formData.dateOfBirth;
      if (formData.dateOfBirth && formData.dateOfBirth.includes('/')) {
        const [day, month, year] = formData.dateOfBirth.split('/');
        formattedDateOfBirth = `${year}-${month}-${day}`;
      }

      // Get admission ID
      let admissionId;
      if (!initialData) {
        try {
          const response = await studentsApi.getNextAdmissionId();
          admissionId = response.admissionId;
        } catch (error) {
          console.error('Failed to get admission ID:', error);
          toast.error(t('students.form.admissionIdFailed', 'Failed to generate admission ID'));
          setIsSubmitting(false);
          return;
        }
      } else {
        admissionId = initialData.admissionId;
      }

      // Fetch academic year
      let academicYear;
      try {
        const settingsResponse = await settingsApi.getSchoolSettings();
        academicYear = settingsResponse?.academicYear;
      } catch (e) {
        console.warn('Could not fetch school settings for academic year, using fallback');
      }
      if (!academicYear) {
        const now = new Date();
        const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        academicYear = `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
      }

      // Filter out empty parent/guardian entries (keep entries that have at least a name)
      const filteredParents = formData.parents.filter(p => p.name?.trim());

      const studentData = {
        name: formData.fullName,
        admissionId,
        academicYear,
        classId,
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
        parentName: filteredParents[0]?.name,
        parentPhone: filteredParents[0]?.phone,
        parentEmail: filteredParents[0]?.email,
        parentRelationship: filteredParents[0]?.relationship,
        parentOccupation: filteredParents[0]?.occupation,
        parents: filteredParents,
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
        photo: photoUrl,
      };

      if (documents.length > 0) {
        studentData.documents = documents;
      } else if (initialData?.documents && initialData.documents.length > 0) {
        studentData.documents = initialData.documents;
      }

      if (!initialData) {
        studentData.status = "active";
        studentData.feeStatus = "pending";
      } else {
        if (initialData.status) studentData.status = initialData.status;
        if (initialData.feeStatus) studentData.feeStatus = initialData.feeStatus;
      }

      // Remove undefined values and empty objects
      Object.keys(studentData).forEach(key => {
        if (studentData[key] === undefined) {
          delete studentData[key];
        }
        if (typeof studentData[key] === 'object' &&
          studentData[key] !== null &&
          !Array.isArray(studentData[key]) &&
          !(studentData[key] instanceof File) &&
          Object.keys(studentData[key]).length === 0) {
          delete studentData[key];
        }
      });

      await onSave(studentData);
      setIsSubmitting(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error submitting student:', error);
      if (error.message && error.message.toLowerCase().includes('roll number')) {
        toast.error(t('students.form.rollNumberTaken', 'This roll number is already taken. Please contact administrator to check roll number settings for this section.'), {
          duration: 5000
        });
        setIsSubmitting(false);
        return;
      }
      toast.error(error.message || t('students.form.saveFailed', 'Failed to save student. Please try again.'));
      setIsSubmitting(false);
    }
  }, [formData, initialData, classesWithTeachers, onSave, setHasUnsavedChanges, validateStep, setErrors, setStep, scrollContainerRef, scrollToError, errorRefs, t]);

  return { handleSubmit, isSubmitting };
}
