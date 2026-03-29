import { useRef, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { ArrowLeft, ArrowRight, User, Users, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useStudentForm } from "../hooks/useStudentForm";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import ParentsStep from "./steps/ParentsStep";
import DocumentsStep from "./steps/DocumentsStep";
import { useTranslation } from 'react-i18next';

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
    handleFileUpload,
    handleMultiFileUpload,
    removeFile,
    validateStep,
    resetForm,
  } = useStudentForm(initialData);

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
      { number: 1, title: "Personal Info", icon: User },
      { number: 2, title: "Parents & Health", icon: Users },
      { number: 3, title: "Documents", icon: FileText },
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

  const handleSubmit = async () => {
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
      await onSave(formData);
    } catch (error) {
      console.error("Submit error:", error);
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
    <div className="h-full flex flex-col bg-background">
      {/* Stepper */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between relative">
          {steps.map((s) => {
            const isActive = step >= s.number;
            const isCurrent = step === s.number;
            return (
              <div key={s.number} className="flex flex-col items-center relative z-10 bg-background px-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCurrent
                      ? "border-primary text-primary bg-primary-50 dark:bg-primary-900/20"
                      : isActive
                      ? "border-primary text-white bg-primary"
                      : "border-default-200 text-default-400 bg-white dark:bg-default-50"
                  }`}
                >
                  <s.icon size={16} strokeWidth={2} />
                </div>
                <span
                  className={`text-[11px] font-semibold mt-2 uppercase tracking-wide hidden sm:block ${
                    isCurrent ? "text-primary" : "text-default-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="flex-none px-4 py-3 border-t border-default-200 bg-background z-10">
        <div className="flex items-center justify-between gap-2">
          {step > 1 && (
            <Button variant="light" onPress={handlePrev} className="font-medium">
              <ArrowLeft size={16} />
              {t('common.back', 'Back')}
            </Button>
          )}
          <div className="flex-1 flex items-center justify-center">
            {hasUnsavedChanges && (
              <span className="text-xs text-gray-400 dark:text-zinc-500">{t('common.unsavedChanges', 'Unsaved changes')}</span>
            )}
          </div>
          <Button
            color="primary"
            onPress={step === 3 ? handleSubmit : handleNext}
            isLoading={isSubmitting}
            className="font-medium"
          >
            {step === 3 ? (
              "Add Student"
            ) : (
              <>
                Next Step <ArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
