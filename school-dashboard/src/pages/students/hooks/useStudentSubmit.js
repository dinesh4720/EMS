import { useState } from "react";
import { uploadApi, classesApi } from "../../../services/api";
import logger from "../../../utils/logger";
import toast from "react-hot-toast";
import { formatShortDate } from '../../../utils/dateFormatter';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';

/**
 * Hook that encapsulates the student form submission logic:
 * - Capacity check
 * - Photo upload
 * - Document uploads
 * - Payload assembly
 * - Calling onSave
 * - Draft cleanup
 *
 * Returns:
 *   isSubmitting      - boolean
 *   handleSubmit      - async (formData, { classesWithTeachers, initialData, validateStep, setStep, scrollContainerRef, scrollToError, onSave, setHasUnsavedChanges }) => void
 */
function useStudentSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const { currentAcademicYear } = useApp();

  const generateUniqueId = () => `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const uploadDocuments = async (formData) => {
    const documents = [];
    const uploadDate = new Date().toISOString();
    const failedDocNames = [];

    const docsLoadingToast = toast.loading(t('toast.loading.uploadingDocuments'));

    try {
      if (formData.birthCertificate instanceof File) {
        try {
          const uploadResponse = await uploadApi.uploadFile(formData.birthCertificate);
          documents.push({
            id: generateUniqueId(),
            name: "Birth Certificate",
            type: formData.birthCertificate.type || "application/pdf",
            category: "birthCertificate",
            url: uploadResponse.url,
            uploadDate,
            size: formData.birthCertificate.size || 'Unknown',
            date: formatShortDate(new Date())
          });
        } catch (error) {
          logger.error('❌ Birth certificate upload failed:', error);
          failedDocNames.push(`Birth Certificate (${error.message || 'upload failed'})`);
        }
      }

      if (formData.transferCertificate instanceof File) {
        try {
          const uploadResponse = await uploadApi.uploadFile(formData.transferCertificate);
          documents.push({
            id: generateUniqueId(),
            name: "Transfer Certificate",
            type: formData.transferCertificate.type || "application/pdf",
            category: "transferCertificate",
            url: uploadResponse.url,
            uploadDate,
            size: formData.transferCertificate.size || 'Unknown',
            date: formatShortDate(new Date())
          });
        } catch (error) {
          logger.error('❌ Transfer certificate upload failed:', error);
          failedDocNames.push(`Transfer Certificate (${error.message || 'upload failed'})`);
        }
      }

      if (formData.aadhaarFront instanceof File || formData.aadhaarBack instanceof File) {
        try {
          const aadhaarDoc = {
            id: generateUniqueId(),
            name: "Aadhaar Card",
            type: "application/pdf",
            category: "aadhaarCard",
            uploadDate,
            size: 'Unknown',
            date: formatShortDate(new Date())
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
        } catch (error) {
          logger.error('❌ Aadhaar card upload failed:', error);
          failedDocNames.push(`Aadhaar Card (${error.message || 'upload failed'})`);
        }
      }

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
                uploadDate,
                size: doc.size || 'Unknown',
                date: formatShortDate(new Date())
              });
            } catch (error) {
              logger.error(`❌ Other document ${i + 1} upload failed:`, error);
              failedDocNames.push(`${doc.name} (${error.message || 'upload failed'})`);
            }
          }
        }
      }

      if (documents.length > 0) {
        toast.success(`${documents.length} document(s) uploaded`, { id: docsLoadingToast });
      } else {
        toast.dismiss(docsLoadingToast);
      }

      if (failedDocNames.length > 0) {
        toast.error(`Some documents failed to upload: ${failedDocNames.join(', ')}`);
      }
    } catch (error) {
      logger.error('❌ Document upload error:', error);
      toast.dismiss(docsLoadingToast);
    }

    return documents;
  };

  const buildPayload = (formData, { classId, admissionId, academicYear, photoUrl, documents, initialData }) => {
    let formattedDateOfBirth = formData.dateOfBirth;
    if (formData.dateOfBirth && formData.dateOfBirth.includes('/')) {
      const [day, month, year] = formData.dateOfBirth.split('/');
      formattedDateOfBirth = `${year}-${month}-${day}`;
    }

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
      if (initialData.updatedAt) studentData.clientUpdatedAt = initialData.updatedAt;
    }

    // Remove undefined values and empty objects to prevent MongoDB cast errors
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

    return studentData;
  };

  const handleSubmit = async (e, formData, {
    classesWithTeachers,
    initialData,
    validateStep,
    setStep,
    scrollContainerRef,
    scrollToError,
    onSave,
    setHasUnsavedChanges,
  }) => {
    e?.preventDefault?.();

    const step1Validation = validateStep(1);
    const step2Validation = validateStep(2);
    const step3Validation = validateStep(3);

    if (!step1Validation.isValid || !step2Validation.isValid || !step3Validation.isValid) {
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
      const selectedClass = classesWithTeachers.find(
        cls => cls.name === formData.classGrade && cls.section === formData.section
      );

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

      // Check capacity
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

      // Upload photo
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
        }
      } else if (typeof formData.picture === 'string' && formData.picture.length > 0) {
        photoUrl = formData.picture;
      }

      // Upload documents
      const documents = await uploadDocuments(formData);

      // Build and save payload
      const studentData = buildPayload(formData, {
        classId: selectedClass?._id || selectedClass?.id,
        admissionId: initialData ? initialData.admissionId : undefined,
        academicYear: currentAcademicYear,
        photoUrl,
        documents,
        initialData,
      });

      await onSave(studentData);

      setIsSubmitting(false);
      setHasUnsavedChanges(false);
      sessionStorage.removeItem('student-form-draft');
      sessionStorage.removeItem('student-form-draft-step');
      // Success toast is shown in parent component
    } catch (error) {
      logger.error('Error submitting student:', error);

      if (error.message && error.message.toLowerCase().includes('roll number')) {
        toast.error('This roll number is already taken. Please contact administrator to check roll number settings for this section.', {
          duration: 5000
        });
        setIsSubmitting(false);
        return;
      }

      if (!error._toastShown) {
        toast.error(error?.message || t('toast.error.failedToSaveStudent', 'Failed to save student. Please try again.'));
      }
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmit };
}

export default useStudentSubmit;
