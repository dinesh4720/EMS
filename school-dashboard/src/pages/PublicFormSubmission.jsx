import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  User,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { publicApi } from '../services/api';
import logger from '../utils/logger';
import { Skeleton } from '../components/ui';
import FormFieldRenderer from '../components/publicForm/FormFieldRenderer';

function normalizeFormDetails(payload) {
  return {
    ...payload,
    formTitle: payload.formName || payload.formTitle,
    formDescription: payload.formDescription || payload.description || '',
    formStructure: payload.fields || payload.formStructure || [],
  };
}

function FormSkeleton() {
  return (
    <div className="public-form">
      <div className="public-form__inner">
        <div className="public-form__head">
          <Skeleton variant="rect" className="public-form__head-icon" style={{ width: 36, height: 36 }} />
          <div className="public-form__head-body">
            <Skeleton variant="text" className="h-5 w-48" />
            <Skeleton variant="text" className="h-3 w-72" />
          </div>
        </div>
        <div className="public-form__card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" className="h-3 w-1/4" />
              <Skeleton variant="rect" className="h-9 w-full" />
            </div>
          ))}
          <Skeleton variant="rect" className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
}

export default function PublicFormSubmission() {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ formDetails: null, submissionStatus: null });
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Guard against race conditions where the token changes mid-fetch (e.g. user
    // navigates between two public links) — stale responses must not overwrite
    // state for the new token.
    let cancelled = false;

    async function loadFormDetails() {
      try {
        setLoading(true);
        const data = await publicApi.getFormByToken(token);
        const statusData = await publicApi.getSubmissionStatus(token).catch(() => null);
        if (cancelled) return;

        const normalizedDetails = normalizeFormDetails(data?.data || data);
        setFormData({ formDetails: normalizedDetails, submissionStatus: statusData });

        const initialValues = {};
        normalizedDetails.formStructure?.forEach((field) => {
          if (field.defaultValue) initialValues[field.id] = field.defaultValue;
        });
        setFormValues(initialValues);
      } catch (error) {
        if (cancelled) return;
        logger.error('Failed to load form:', error);
        toast.error(error.message || 'Invalid or expired form link');
        setFormData({ formDetails: null, submissionStatus: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFormDetails();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleFieldChange = (fieldId, value) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const structure = formData.formDetails?.formStructure;
    if (!structure) return true;

    structure.forEach((field) => {
      const value = formValues[field.id];
      if (field.required && !value) {
        newErrors[field.id] = `${field.label} is required`;
      }

      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }

      if (field.type === 'phone' && value) {
        const phoneRegex = /^[+]?[\d\s\-()]+$/;
        const digitCount = String(value).replace(/\D/g, '').length;
        if (!phoneRegex.test(value) || digitCount < 7 || digitCount > 15) {
          newErrors[field.id] = 'Please enter a valid phone number';
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
      logger.error('Submission failed:', error);
      // Surface 413 / payload-too-large specifically; the renderer doesn't
      // currently expose file uploads but submission payloads can still
      // exceed limits when forms have long free-text answers.
      if (error?.status === 413) {
        toast.error('Submission is too large. Please shorten your answers and try again.');
      } else {
        toast.error(error.message || 'Failed to submit form. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FormSkeleton />;

  if (!formData.formDetails) {
    return (
      <div className="public-form">
        <div className="public-form__inner">
          <div className="public-form__status" role="alert">
            <div
              className="public-form__status-icon public-form__status-icon--danger"
              aria-hidden="true"
            >
              <XCircle className="w-7 h-7" />
            </div>
            <h2 className="public-form__status-title">
              {t('pages.formNotAvailable') || 'Form not available'}
            </h2>
            <p className="public-form__status-sub">
              This form link is invalid, expired, or has been canceled. Please
              contact the school administration for assistance.
            </p>
            <span className="chip chip--danger" style={{ marginTop: 4 }}>
              <span className="dot" aria-hidden="true" />
              Link expired
            </span>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 8 }}
              onClick={() => navigate('/')}
            >
              {t('common.returnHome') || 'Return to home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (formData.submissionStatus?.submitted) {
    const submittedAt = formData.submissionStatus?.submittedAt
      ? format(new Date(formData.submissionStatus.submittedAt), "MMMM d, yyyy 'at' h:mm a")
      : '—';
    return (
      <div className="public-form">
        <div className="public-form__inner">
          <div className="public-form__status" role="status">
            <div
              className="public-form__status-icon public-form__status-icon--ok"
              aria-hidden="true"
            >
              <CheckCircle className="w-7 h-7" />
            </div>
            <h2 className="public-form__status-title">
              {t('pages.alreadySubmitted') || 'Already submitted'}
            </h2>
            <p className="public-form__status-sub">
              This form was submitted on {submittedAt}.
            </p>
            <span className="chip chip--ok" style={{ marginTop: 4 }}>
              <span className="dot" aria-hidden="true" />
              Submitted
            </span>
            <div className="public-form__meta-item" style={{ marginTop: 4 }}>
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{formData.submissionStatus.submitterName || 'Parent'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="public-form">
        <div className="public-form__inner">
          <div className="public-form__status" role="status">
            <div
              className="public-form__status-icon public-form__status-icon--ok"
              aria-hidden="true"
            >
              <CheckCircle className="w-7 h-7" />
            </div>
            <h2 className="public-form__status-title">Thank you</h2>
            <p className="public-form__status-sub">
              Your form has been submitted. We'll review it and get back to you
              if anything else is needed.
            </p>
            <span className="chip chip--ok" style={{ marginTop: 4 }}>
              <span className="dot" aria-hidden="true" />
              Submitted
            </span>
            <div className="public-form__meta" style={{ justifyContent: 'center' }}>
              <span className="public-form__meta-item">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                {formData.formDetails.formTitle}
              </span>
              <span className="public-form__meta-item">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { formDetails } = formData;
  const isExpired = formDetails.expiresAt && new Date(formDetails.expiresAt) < new Date();

  return (
    <div className="public-form">
      <div className="public-form__inner">
        <header className="public-form__head">
          <div className="public-form__head-icon" aria-hidden="true">
            <FileText className="w-5 h-5" />
          </div>
          <div className="public-form__head-body">
            <h1 className="public-form__title">{formDetails.formTitle}</h1>
            {formDetails.formDescription && (
              <p className="public-form__sub">{formDetails.formDescription}</p>
            )}
            <div className="public-form__meta">
              {formDetails.deadline && (
                <span className="public-form__meta-item">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  Due by{' '}
                  {format(new Date(formDetails.deadline), "MMM d, yyyy 'at' h:mm a")}
                </span>
              )}
              {isExpired && (
                <span className="chip chip--danger">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  This form has expired
                </span>
              )}
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="public-form__card" noValidate>
          {formDetails.formStructure?.map((field) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={formValues[field.id]}
              error={errors[field.id]}
              onChange={handleFieldChange}
              t={t}
            />
          ))}

          <div className="public-form__footer">
            <p className="public-form__required">
              <span className="public-form__required-mark">*</span> Required fields
            </p>
            <button
              type="submit"
              className="btn btn--accent"
              disabled={submitting || isExpired}
              aria-busy={submitting || undefined}
            >
              {submitting ? 'Submitting…' : 'Submit form'}
            </button>
          </div>
        </form>

        <p className="public-form__notice">
          {t('pages.needHelpContactTheSchoolAdministration')}
        </p>
      </div>
    </div>
  );
}
