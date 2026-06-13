import { useRef, useState, useEffect, useMemo } from "react";
import { Input, Select, RadioGroup, Checkbox, Textarea, Avatar } from "../../../../components/ui";
import { User, Calendar } from "lucide-react";
import { GENDERS, BLOOD_GROUPS, RELIGIONS, CATEGORIES, MOTHER_TONGUES } from "../../../../constants/studentConstants";
import { INDIAN_STATES, normalizeStateName } from "../../../../constants/states";
import { lookupPincode } from "../../../../services/api";
import { useTranslation } from 'react-i18next';
import logger from '../../../../utils/logger';


/**
 * Personal Information Step for Student Form
 * Extracted from AddStudent.jsx
 */
export default function PersonalInfoStep({
  formData,
  errors,
  updateField,
  classesWithTeachers,
  fullNameRef,
  dobRef,
  genderRef,
  classRef,
}) {
  const { t } = useTranslation();
  const [dobValidation, setDobValidation] = useState({ isValid: false, message: "", warning: "" });
  const [isDobCalendarOpen, setIsDobCalendarOpen] = useState(false);
  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false);
  const zipLookupTimeoutRef = useRef(null);
  const manualCityStateEntryRef = useRef(false);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (zipLookupTimeoutRef.current) {
        clearTimeout(zipLookupTimeoutRef.current);
      }
    };
  }, []);

  const handleZipCodeChange = (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    updateField("zipCode", digitsOnly);

    if (zipLookupTimeoutRef.current) {
      clearTimeout(zipLookupTimeoutRef.current);
    }

    if (digitsOnly.length === 6) {
      zipLookupTimeoutRef.current = setTimeout(async () => {
        setIsZipLookupLoading(true);
        try {
          const locationData = await lookupPincode(digitsOnly);
          if (locationData) {
            const normalizedState = normalizeStateName(locationData.state);

            if (!formData.city || !manualCityStateEntryRef.current) {
              updateField("city", locationData.city);
            }

            if (!formData.state || !manualCityStateEntryRef.current) {
              if (normalizedState) {
                updateField("state", normalizedState);
              }
            }
          }
        } catch (error) {
          logger.error("PIN code lookup failed:", error);
        } finally {
          setIsZipLookupLoading(false);
        }
      }, 500);
    }
  };

  const handleClassChange = (value) => {
    const selectedClass = classesWithTeachers.find(
      (c) => c.name === value
    );
    updateField("classGrade", value);
    updateField("section", selectedClass?.section || "");
    updateField("rollNumber", "");
  };

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Profile Section */}
      <ProfileSection formData={formData} updateField={updateField} />

      {/* Personal Information */}
      <div className="space-y-2" ref={fullNameRef}>
        <label className="text-sm font-semibold text-fg">{t('pages.personalInformation1')}</label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('pages.fullName1')}
            placeholder={t('pages.enterStudentSFullName')}
            value={formData.fullName}
            onChange={(e) => updateField("fullName", e.target.value.replace(/[0-9]/g, ""))}
            error={errors.fullName}
            required
          />

          <DateOfBirthInput
            value={formData.dateOfBirth}
            onChange={(value) => updateField("dateOfBirth", value)}
            error={errors.dateOfBirth}
            dobValidation={dobValidation}
            setDobValidation={setDobValidation}
            isOpen={isDobCalendarOpen}
            setIsOpen={setIsDobCalendarOpen}
            inputRef={dobRef}
          />
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-1" ref={genderRef}>
        <label id="gender-label" className="text-xs font-medium text-fg-muted">
          Gender <span className="text-danger">*</span>
        </label>
        <RadioGroup
          value={formData.gender}
          onChange={(e) => updateField("gender", e.target.value)}
          aria-labelledby="gender-label"
          options={GENDERS.map((g) => ({ value: g, label: g }))}
        />
      </div>

      {/* Class Information */}
      <ClassSection
        formData={formData}
        errors={errors}
        classesWithTeachers={classesWithTeachers}
        onClassChange={handleClassChange}
        onSectionChange={(section) => updateField("section", section)}
        inputRef={classRef}
      />

      {/* Contact Info */}
      <ContactSection formData={formData} updateField={updateField} />

      {/* Address */}
      <AddressSection
        formData={formData}
        errors={errors}
        updateField={updateField}
        onZipCodeChange={handleZipCodeChange}
        isZipLookupLoading={isZipLookupLoading}
        onManualCityStateEntry={() => { manualCityStateEntryRef.current = true; }}
      />

      {/* Optional Information */}
      <OptionalSection formData={formData} updateField={updateField} />
    </div>
  );
}

// Sub-components would go here...
function ProfileSection({ formData, updateField }) {
  const picturePreviewUrl = useMemo(() => {
    if (formData.picture instanceof File) {
      return URL.createObjectURL(formData.picture);
    }
    return null;
  }, [formData.picture]);

  useEffect(() => {
    return () => {
      if (picturePreviewUrl) URL.revokeObjectURL(picturePreviewUrl);
    };
  }, [picturePreviewUrl]);

  const avatarSrc = picturePreviewUrl || (typeof formData.picture === 'string' ? formData.picture : null);

  return (
    <div className="flex items-center gap-5">
      {formData.picture ? (
        <Avatar
          src={avatarSrc}
          className="w-20 h-20 text-3xl"
          shape="circle"
        />
      ) : (
        <div className="w-20 h-20 rounded-full border-2 border-divider bg-surface-2 flex items-center justify-center">
          <User size={32} className="text-fg-faint" aria-hidden />
        </div>
      )}
      <div className="flex flex-col gap-1 text-left">
        <div className="flex items-center gap-3">
          <button
            className="text-sm font-semibold text-primary hover:text-[var(--accent)] transition-colors"
            onClick={() => {/* Open camera modal */}}
          >
            {formData.picture ? "Change Photo" : "Add Photo"}
          </button>
          {formData.picture && (
            <>
              <span className="text-fg-faint">|</span>
              <button
                className="text-sm font-semibold text-danger hover:text-[var(--danger)] transition-colors"
                onClick={() => updateField("picture", null)}
              >
                Delete
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-fg-muted max-w-[250px]">
          Take a photo or upload from device
        </p>
      </div>
    </div>
  );
}

// [AUDIT-541] Changed ref prop to inputRef — function components can't receive ref as plain prop
// [AUDIT-629] Added DD/MM/YYYY input mask
function DateOfBirthInput({ value, onChange, error, inputRef }) {
  const handleDateInput = (raw) => {
    // Strip non-digits
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    // Auto-insert slashes: DD/MM/YYYY
    let masked = digits;
    if (digits.length > 4) {
      masked = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    } else if (digits.length > 2) {
      masked = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    onChange(masked);
  };

  return (
    <div ref={inputRef}>
      <Input
        label="Date of Birth"
        placeholder="DD/MM/YYYY"
        value={value || ""}
        onChange={(e) => handleDateInput(e.target.value)}
        error={error}
        required
        maxLength={10}
      />
    </div>
  );
}

// [AUDIT-541] Changed ref prop to inputRef
function ClassSection({ formData, errors, classesWithTeachers, onClassChange, onSectionChange, inputRef }) {
  const { t } = useTranslation();
  const uniqueClasses = [...new Set(classesWithTeachers.map((c) => c.name))].sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  const availableSections = formData.classGrade
    ? [...new Set(classesWithTeachers.filter((c) => c.name === formData.classGrade).map((c) => c.section))].sort()
    : [];

  return (
    <div className="space-y-2 pt-2 border-t border-solid border-divider" ref={inputRef}>
      <label className="text-sm font-semibold text-fg block mt-2">{t('pages.classInformation')}</label>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('pages.class1')}
          placeholder={t('pages.selectClass2')}
          value={formData.classGrade || ""}
          onChange={(e) => onClassChange(e.target.value)}
          required
          options={uniqueClasses.map((className) => ({ value: className, label: className }))}
        />

        <Select
          label={t('pages.section1')}
          placeholder={t('pages.selectSection')}
          value={formData.section || ""}
          onChange={(e) => onSectionChange(e.target.value)}
          required
          disabled={!formData.classGrade}
          options={availableSections.map((section) => ({ value: section, label: section }))}
        />
      </div>
    </div>
  );
}

function ContactSection({ formData, updateField }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 pt-2 border-t border-solid border-divider">
      <label className="text-sm font-semibold text-fg block mt-2">{t('pages.contactDetails1')}</label>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('pages.mobileNumber')}
          startContent={<span className="text-fg-faint text-xs">+91</span>}
          placeholder={t('pages.studentSMobileIfAny')}
          value={formData.mobile}
          onChange={(e) => updateField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
          maxLength={10}
        />
        <Input
          label={t('pages.emailAddress')}
          placeholder={t('students.form.studentEmailPlaceholder')}
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </div>
    </div>
  );
}

function AddressSection({ formData, errors, updateField, onZipCodeChange, isZipLookupLoading, onManualCityStateEntry }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Textarea
        label={t('pages.address2')}
        placeholder={t('pages.fullResidentialAddress')}
        value={formData.address}
        onChange={(e) => updateField("address", e.target.value)}
        required
        rows={2}
      />
      <div className="grid grid-cols-3 gap-4">
        <Input
          label={t('pages.city1')}
          placeholder={t('pages.city1')}
          value={formData.city}
          onChange={(e) => { onManualCityStateEntry(); updateField("city", e.target.value); }}
          required
        />
        <Select
          label={t('pages.state1')}
          placeholder={t('pages.selectState')}
          value={formData.state || ""}
          onChange={(e) => { onManualCityStateEntry(); updateField("state", e.target.value); }}
          options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
        />
        <Input
          label={t('pages.zIPCode')}
          placeholder={t('pages.pINCode')}
          value={formData.zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          required
          maxLength={6}
        />
      </div>
    </div>
  );
}

function OptionalSection({ formData, updateField }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 pt-2 border-t border-solid border-divider">
      <label className="text-sm font-semibold text-fg block mt-2">{t('pages.optionalInformation')}</label>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('pages.aadhaarNumber')}
          placeholder={t('students.form.aadhaarPlaceholder')}
          value={formData.aadhaarNumber}
          onChange={(e) => updateField("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
          maxLength={12}
        />
        <Select
          label={t('pages.bloodGroup1')}
          placeholder={t('pages.select1')}
          value={formData.bloodGroup || ""}
          onChange={(e) => updateField("bloodGroup", e.target.value)}
          options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
        />
        <Select
          label={t('pages.religion1')}
          placeholder={t('pages.selectReligion', 'Select Religion')}
          value={formData.religion || ""}
          onChange={(e) => updateField("religion", e.target.value)}
          options={RELIGIONS.map((r) => ({ value: r, label: r }))}
        />
        <Select
          label={t('pages.category1')}
          placeholder={t('pages.select1')}
          value={formData.category || ""}
          onChange={(e) => updateField("category", e.target.value)}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </div>
    </div>
  );
}
