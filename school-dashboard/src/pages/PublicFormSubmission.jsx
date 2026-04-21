import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Spinner,
  Chip,
  Divider,
} from "@heroui/react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { publicApi } from "../services/api";
import { format } from "date-fns";
import logger from '../utils/logger';


/**
 * PublicFormSubmission - A parent-friendly form submission page
 *
 * Purpose: Allow parents to submit intake forms via secure token links
 * Tone: Clean, trustworthy, professional with a warm educational feel
 * Aesthetic: Soft gradients, clear hierarchy, approachable interface
 */

export default function PublicFormSubmission() {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    formDetails: null,
    submissionStatus: null,
  });
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Load form details on mount
  useEffect(() => {
    loadFormDetails();
  }, [token]);

  const loadFormDetails = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getFormByToken(token);

      // Check if already submitted
      const statusData = await publicApi.getSubmissionStatus(token).catch(() => null);
      // Normalize backend response shape:
      // Backend returns { success, data: { formId, formName, formType, fields, ... } }
      // Map to formDetails with consistent property names for the UI
      const formPayloadRaw = data?.data || data;
      const normalizedDetails = {
        ...formPayloadRaw,
        formTitle: formPayloadRaw.formName || formPayloadRaw.formTitle,
        formDescription: formPayloadRaw.formDescription || formPayloadRaw.description || '',
        formStructure: formPayloadRaw.fields || formPayloadRaw.formStructure || [],
      };
      setFormData({
        formDetails: normalizedDetails,
        submissionStatus: statusData,
      });

      // Initialize form values from normalized formStructure
      const initialValues = {};
      if (normalizedDetails.formStructure) {
        normalizedDetails.formStructure.forEach((field) => {
          if (field.defaultValue) {
            initialValues[field.id] = field.defaultValue;
          }
        });
      }
      setFormValues(initialValues);
    } catch (error) {
      logger.error("Failed to load form:", error);
      toast.error(error.message || "Invalid or expired form link");
      setFormData({
        formDetails: null,
        submissionStatus: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.formDetails?.formStructure) return true;

    formData.formDetails.formStructure.forEach((field) => {
      if (field.required && !formValues[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }

      // Email validation
      if (field.type === "email" && formValues[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formValues[field.id])) {
          newErrors[field.id] = "Please enter a valid email address";
        }
      }

      // Phone validation — must contain at least 7 digits
      if (field.type === "phone" && formValues[field.id]) {
        const val = formValues[field.id];
        const phoneRegex = /^[+]?[\d\s\-()]+$/;
        const digitCount = (val.replace(/\D/g, '')).length;
        if (!phoneRegex.test(val) || digitCount < 7 || digitCount > 15) {
          newErrors[field.id] = "Please enter a valid phone number";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('toast.error.pleaseFillInAllRequiredFieldsCorrectly'));
      return;
    }

    try {
      setSubmitting(true);
      await publicApi.submitForm(token, {
        submissionData: formValues,
        submittedAt: new Date().toISOString(),
      });

      setSubmitted(true);
      toast.success(t('toast.success.formSubmittedSuccessfully'));
    } catch (error) {
      logger.error("Submission failed:", error);
      toast.error(error.message || "Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formValues[field.id] || "";
    const error = errors[field.id];

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            key={field.id}
            label={field.label}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            isRequired={field.required}
            isInvalid={!!error}
            errorMessage={error}
            type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
            variant="bordered"
            classNames={{
              input: "text-foreground",
              label: "text-foreground/70",
              inputWrapper: "border-default-200 hover:border-default-400",
            }}
            description={field.description}
          />
        );

      case "textarea":
        return (
          <Textarea
            key={field.id}
            label={field.label}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            isRequired={field.required}
            isInvalid={!!error}
            errorMessage={error}
            variant="bordered"
            classNames={{
              input: "text-foreground",
              label: "text-foreground/70",
              inputWrapper: "border-default-200 hover:border-default-400",
            }}
            description={field.description}
            minRows={3}
          />
        );

      case "number":
        return (
          <Input
            key={field.id}
            label={field.label}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            isRequired={field.required}
            isInvalid={!!error}
            errorMessage={error}
            type="number"
            variant="bordered"
            classNames={{
              input: "text-foreground",
              label: "text-foreground/70",
              inputWrapper: "border-default-200 hover:border-default-400",
            }}
            description={field.description}
          />
        );

      case "date":
        return (
          <Input
            key={field.id}
            label={field.label}
            type="date"
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            isRequired={field.required}
            isInvalid={!!error}
            errorMessage={error}
            variant="bordered"
            classNames={{
              input: "text-foreground",
              label: "text-foreground/70",
              inputWrapper: "border-default-200 hover:border-default-400",
            }}
            description={field.description}
          />
        );

      case "dropdown":
      case "select":
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <label htmlFor={`${field.id}-select`} className="text-sm text-foreground/70 font-medium">
              {field.label}
              {field.required && <span className="text-danger ml-1">*</span>}
            </label>
            <select
              id={`${field.id}-select`}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? `${field.id}-error` : undefined}
              className={`px-3 py-2 rounded-lg border bg-background text-foreground transition-colors
                ${error ? "border-danger" : "border-default-200 hover:border-default-400"}
                focus:outline-none focus:ring-2 focus:ring-primary/50`}
            >
              <option value="">{t('pages.selectAnOption')}</option>
              {field.options?.map((option) => {
                // Handle both string options and object options with value/label
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
            {error && <p id={`${field.id}-error`} role="alert" aria-live="polite" className="text-xs text-danger mt-1">{error}</p>}
            {field.description && (
              <p className="text-xs text-default-400 mt-1">{field.description}</p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="flex items-start gap-3 p-3 rounded-lg bg-default-50/50">
            <input
              type="checkbox"
              id={field.id}
              checked={value || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              required={field.required}
              className="mt-1 w-4 h-4 rounded border-default-300 text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor={field.id} className="text-sm font-medium text-foreground cursor-pointer">
                {field.label}
                {field.required && <span className="text-danger ml-1">*</span>}
              </label>
              {field.description && (
                <p className="text-xs text-default-500 mt-1">{field.description}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 via-background to-default-100 dark:from-default-950 dark:via-background dark:to-default-900">
        <div className="w-full max-w-2xl mx-auto px-4 space-y-6">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 space-y-6">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-4 w-72 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            ))}
            <div className="pt-4">
              <div className="h-10 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!formData.formDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 via-background to-default-100 dark:from-default-950 dark:via-background dark:to-default-900 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardBody className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('pages.formNotAvailable')}</h2>
            <p className="text-foreground/70">
              This form link is invalid, expired, or has been canceled.
              Please contact the school administration for assistance.
            </p>
            <Button
              color="primary"
              variant="flat"
              onPress={() => navigate("/")}
              className="mt-4"
            >
              Return to Home
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Already submitted state
  if (formData.submissionStatus?.submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 via-background to-default-100 dark:from-default-950 dark:via-background dark:to-default-900 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardBody className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('pages.alreadySubmitted')}</h2>
            <p className="text-foreground/70">
              This form has already been submitted on{" "}
              {formData.submissionStatus?.submittedAt ? format(new Date(formData.submissionStatus.submittedAt), "MMMM d, yyyy 'at' h:mm a") : '—'}.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-default-500">
              <User className="w-4 h-4" />
              <span>{formData.submissionStatus.submitterName || "Parent"}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-default-50 via-background to-default-100 dark:from-default-950 dark:via-background dark:to-default-900 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardBody className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
              Thank You!
            </h2>
            <p className="text-foreground/70">
              Your form has been submitted successfully. We'll review it and get back to you if needed.
            </p>
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-default-500">
                <FileText className="w-4 h-4" />
                <span>{formData.formDetails.formTitle}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-default-500">
                <Calendar className="w-4 h-4" />
                <span>Submitted on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Main form state
  const { formDetails } = formData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-default-50 via-background to-default-100 dark:from-default-950 dark:via-background dark:to-default-900 py-8 px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <Card className="mb-6 shadow-lg border border-default-200 dark:border-default-800">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {formDetails.formTitle}
                </h1>
                {formDetails.formDescription && (
                  <p className="text-foreground/70 text-sm">{formDetails.formDescription}</p>
                )}
              </div>
            </div>

            {formDetails.deadline && (
              <div className="flex items-center gap-2 text-sm text-default-500">
                <Clock className="w-4 h-4" />
                <span>
                  Due by {format(new Date(formDetails.deadline), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            )}

            {formDetails.expiresAt && new Date(formDetails.expiresAt) < new Date() && (
              <Chip color="danger" variant="flat" startContent={<AlertCircle className="w-4 h-4" />}>
                This form has expired
              </Chip>
            )}
          </CardBody>
        </Card>

        {/* Form */}
        <Card className="shadow-lg border border-default-200 dark:border-default-800">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formDetails.formStructure?.map((field) => (
                <div key={field.id}>{renderField(field)}</div>
              ))}

              <Divider className="my-6" />

              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-default-500">
                  <span className="text-danger">*</span> Required fields
                </p>
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={submitting}
                  isDisabled={submitting}
                  className="shadow-lg shadow-primary/20 font-medium px-8"
                  endContent={!submitting && <CheckCircle className="w-5 h-5" />}
                >
                  {submitting ? "Submitting..." : "Submit Form"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-default-500">
          <p>{t('pages.needHelpContactTheSchoolAdministration')}</p>
        </div>
      </div>
    </div>
  );
}
