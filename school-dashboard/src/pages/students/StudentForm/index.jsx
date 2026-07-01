import { useRef, useMemo, useState } from "react";
import { Button } from "../../../components/ui";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useStudentForm } from "../hooks/useStudentForm";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import ParentsStep from "./steps/ParentsStep";
import DocumentsStep from "./steps/DocumentsStep";
import { Stepper } from "../../../components/ui";
import { useTranslation } from 'react-i18next';
import logger from '../../../utils/logger';
import { buildStudentPayload } from "../../../validators/studentFormValidation";
import { useAppMeta } from "../../../context/AppContext";


/**
 * Refactored Student Form Component
 * Uses composition pattern with step components
 * Extracted from AddStudent.jsx (2500+ lines -> ~300 lines)
 */
export default function StudentForm({
  onClose,
  onSave,
  classOptions = [],
  classesWithTeachers = [],
  initialData = null,
}) {
  const {
    formData,
    errors,
    isSubmitting,
    hasUnsavedChanges,
    setIsSubmitting,
    updateField,
    updateParent,
    addParent,
    removeParent,
    updateSibling,
    addSibling,
    removeSibling,
    updateHealthInfoItem,
    addHealthInfoItem,
    removeHealthInfoItem,
    handleFileUpload,
    handleMultiFileUpload,
    removeFile,
    validateStep,
    resetForm,
  } = useStudentForm(initialData);

  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const scrollContainerRef = useRef(null);

  // Error field refs for auto-scroll
  const fullNameRef = useRef(null);
  const dobRef = useRef(null);
  const genderRef = useRef(null);
  const classRef = useRef(null);
  const parentNameRef = useRef(null);
  const parentPhoneRef = useRef(null);

  // File refs
  const pictureInputRef = useRef(null);
  const birthCertRef = useRef(null);
  const tcRef = useRef(null);
  const aadhaarFrontRef = useRef(null);
  const aadhaarBackRef = useRef(null);
  const otherDocsRef = useRef(null);

  const steps = useMemo(
    () => [
      { n: 1, label: "Personal Info" },
      { n: 2, label: "Parents & Health" },
      { n: 3, label: "Documents" },
    ],
    []
  );

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      scrollToError(step);
    }
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const scrollToError = (stepNum) => {
    setTimeout(() => {
      if (stepNum === 1) {
        if (errors.fullName && fullNameRef.current) {
          fullNameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (errors.dateOfBirth && dobRef.current) {
          dobRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (errors.gender && genderRef.current) {
          genderRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if ((errors.classGrade || errors.section) && classRef.current) {
          classRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else if (stepNum === 2) {
        if (errors.parentName && parentNameRef.current) {
          parentNameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (errors.parentPhone && parentPhoneRef.current) {
          parentPhoneRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
  };

  const { currentAcademicYear } = useAppMeta();

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);

    if (!step1Valid || !step2Valid) {
      if (!step1Valid) {
        setStep(1);
        scrollToError(1);
      } else {
        setStep(2);
        scrollToError(2);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedClass = classesWithTeachers.find(
        cls => cls.name === formData.classGrade && cls.section === formData.section
      );
      const payload = buildStudentPayload(formData, {
        classId: selectedClass?._id || selectedClass?.id,
        admissionId: initialData ? initialData.admissionId : undefined,
        academicYear: currentAcademicYear,
        photoUrl: null,
        documents: [],
        initialData,
      });
      await onSave(payload);
    } catch (error) {
      logger.error("Submit error:", error);
      toast.error(error?.message || "Failed to save student. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <PersonalInfoStep
            formData={formData}
            errors={errors}
            updateField={updateField}
            classesWithTeachers={classesWithTeachers}
            fullNameRef={fullNameRef}
            dobRef={dobRef}
            genderRef={genderRef}
            classRef={classRef}
          />
        );
      case 2:
        return (
          <ParentsStep
            formData={formData}
            errors={errors}
            updateParent={updateParent}
            addParent={addParent}
            removeParent={removeParent}
            updateSibling={updateSibling}
            addSibling={addSibling}
            removeSibling={removeSibling}
            updateField={updateField}
            classesWithTeachers={classesWithTeachers}
            parentNameRef={parentNameRef}
            parentPhoneRef={parentPhoneRef}
            updateHealthInfoItem={updateHealthInfoItem}
            addHealthInfoItem={addHealthInfoItem}
            removeHealthInfoItem={removeHealthInfoItem}
          />
        );
      case 3:
        return (
          <DocumentsStep
            formData={formData}
            handleFileUpload={handleFileUpload}
            handleMultiFileUpload={handleMultiFileUpload}
            removeFile={removeFile}
            birthCertRef={birthCertRef}
            tcRef={tcRef}
            aadhaarFrontRef={aadhaarFrontRef}
            aadhaarBackRef={aadhaarBackRef}
            otherDocsRef={otherDocsRef}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Stepper — design-system primitive */}
      <div className="px-4 pt-4 pb-3">
        <Stepper steps={steps} current={step} />
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {renderStep()}
      </div>

      {/* Footer — bundle pattern: saved-state indicator on left, Back / Continue on right */}
      <div className="flex-none px-4 py-3 border-t border-divider bg-surface-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11.5px] text-fg-faint">
            {hasUnsavedChanges ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]" aria-hidden />
                {t('common.unsavedChanges', 'Unsaved changes')}
              </>
            ) : (
              <>
                <Check size={11} aria-hidden />
                {initialData
                  ? t('common.editing', 'Editing existing student')
                  : t('common.draftReady', 'New student · ready')}
              </>
            )}
          </span>
          <span className="flex-1" />
          {step > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrev}
              className="border-border-token text-fg font-medium"
              icon={<ArrowLeft size={12} aria-hidden />}
            >
              {t('common.back', 'Back')}
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            onClick={step === 3 ? handleSubmit : handleNext}
            loading={isSubmitting}
            className="font-medium whitespace-nowrap"
            icon={step === 3 ? null : <ArrowRight size={12} aria-hidden />}
            iconPosition="right"
          >
            {step === 3
              ? (initialData ? "Update student" : "Add student")
              : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
