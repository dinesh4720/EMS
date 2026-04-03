import { useRef, useState, useEffect } from "react";
import { Input, Select, SelectItem, RadioGroup, Radio, Checkbox, Textarea, Avatar } from "@heroui/react";
import { User, Calendar } from "lucide-react";
import { GENDERS, BLOOD_GROUPS, RELIGIONS, CATEGORIES, MOTHER_TONGUES } from "../../../../constants/studentConstants";
import { INDIAN_STATES, normalizeStateName } from "../../../../constants/states";
import { lookupPincode } from "../../../../services/api";
import { useTranslation } from 'react-i18next';

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
          console.error("PIN code lookup failed:", error);
        } finally {
          setIsZipLookupLoading(false);
        }
      }, 500);
    }
  };

  const handleClassChange = (keys) => {
    const selectedClass = classesWithTeachers.find(
      (c) => c.name === Array.from(keys)[0]
    );
    updateField("classGrade", Array.from(keys)[0]);
    updateField("section", selectedClass?.section || "");
    updateField("rollNumber", "");
  };

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Profile Section */}
      <ProfileSection formData={formData} updateField={updateField} />

      {/* Personal Information */}
      <div className="space-y-2" ref={fullNameRef}>
        <label className="text-sm font-semibold text-default-900">{t('pages.personalInformation1')}</label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('pages.fullName1')}
            labelPlacement="outside"
            placeholder={t('pages.enterStudentSFullName')}
            value={formData.fullName}
            onValueChange={(v) => updateField("fullName", v.replace(/[0-9]/g, ""))}
            isInvalid={!!errors.fullName}
            errorMessage={errors.fullName}
            variant="bordered"
            radius="sm"
            isRequired
            classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
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
        <label className="text-xs font-medium text-default-600">
          Gender <span className="text-danger">*</span>
        </label>
        <RadioGroup
          orientation="horizontal"
          value={formData.gender}
          onValueChange={(v) => updateField("gender", v)}
          classNames={{ wrapper: "gap-4" }}
          isInvalid={!!errors.gender}
          errorMessage={errors.gender}
        >
          {GENDERS.map((g) => (
            <Radio key={g} value={g} size="sm" classNames={{ label: "text-sm" }}>
              {g}
            </Radio>
          ))}
        </RadioGroup>
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
  return (
    <div className="flex items-center gap-5">
      {formData.picture ? (
        <Avatar
          src={formData.picture instanceof File ? URL.createObjectURL(formData.picture) : formData.picture}
          className="w-20 h-20 text-3xl"
          isBordered
          radius="full"
          color="primary"
        />
      ) : (
        <div className="w-20 h-20 rounded-full border-2 border-default-200 bg-default-50 flex items-center justify-center">
          <User size={32} className="text-default-400" />
        </div>
      )}
      <div className="flex flex-col gap-1 text-left">
        <div className="flex items-center gap-3">
          <button
            className="text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
            onClick={() => {/* Open camera modal */}}
          >
            {formData.picture ? "Change Photo" : "Add Photo"}
          </button>
          {formData.picture && (
            <>
              <span className="text-default-300">|</span>
              <button
                className="text-sm font-semibold text-danger hover:text-danger-600 transition-colors"
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
  );
}

// [AUDIT-541] Changed ref prop to inputRef — function components can't receive ref as plain prop
function DateOfBirthInput({ value, onChange, error, inputRef }) {
  return (
    <div ref={inputRef} className="space-y-1">
      <label className="text-xs font-medium text-default-600">
        Date of Birth <span className="text-danger">*</span>
      </label>
      <Input
        labelPlacement="outside"
        placeholder="DD/MM/YYYY"
        value={value || ""}
        onValueChange={onChange}
        isInvalid={!!error}
        errorMessage={error}
        variant="bordered"
        radius="sm"
        isRequired
        classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-primary-400 h-10" }}
      />
    </div>
  );
}

// [AUDIT-541] Changed ref prop to inputRef
function ClassSection({ formData, errors, classesWithTeachers, onClassChange, onSectionChange, inputRef }) {
  const uniqueClasses = [...new Set(classesWithTeachers.map((c) => c.name))].sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  const availableSections = formData.classGrade
    ? [...new Set(classesWithTeachers.filter((c) => c.name === formData.classGrade).map((c) => c.section))].sort()
    : [];

  return (
    <div className="space-y-2 pt-2 border-t border-solid border-default-200" ref={ref}>
      <label className="text-sm font-semibold text-default-900 block mt-2">{t('pages.classInformation')}</label>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('pages.class1')}
          labelPlacement="outside"
          placeholder={t('pages.selectClass2')}
          selectedKeys={formData.classGrade ? [formData.classGrade] : []}
          onSelectionChange={onClassChange}
          isRequired
          isInvalid={!!errors.classGrade}
          errorMessage={errors.classGrade}
          variant="bordered"
          radius="sm"
          classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        >
          {uniqueClasses.map((className) => (
            <SelectItem key={className}>{className}</SelectItem>
          ))}
        </Select>

        <Select
          label={t('pages.section1')}
          labelPlacement="outside"
          placeholder={t('pages.selectSection')}
          selectedKeys={formData.section ? [formData.section] : []}
          onSelectionChange={(keys) => onSectionChange(Array.from(keys)[0])}
          isRequired
          isDisabled={!formData.classGrade}
          isInvalid={!!errors.section}
          errorMessage={errors.section}
          variant="bordered"
          radius="sm"
          classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        >
          {availableSections.map((section) => (
            <SelectItem key={section}>{section}</SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}

function ContactSection({ formData, updateField }) {
  return (
    <div className="space-y-2 pt-2 border-t border-solid border-default-200">
      <label className="text-sm font-semibold text-default-900 block mt-2">{t('pages.contactDetails1')}</label>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('pages.mobileNumber')}
          labelPlacement="outside"
          startContent={<span className="text-default-400 text-xs">+91</span>}
          placeholder={t('pages.studentSMobileIfAny')}
          value={formData.mobile}
          onValueChange={(v) => updateField("mobile", v.replace(/\D/g, "").slice(0, 10))}
          variant="bordered"
          radius="sm"
          maxLength={10}
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
        <Input
          label={t('pages.emailAddress')}
          labelPlacement="outside"
          placeholder={t('students.form.studentEmailPlaceholder')}
          value={formData.email}
          onValueChange={(v) => updateField("email", v)}
          variant="bordered"
          radius="sm"
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
      </div>
    </div>
  );
}

function AddressSection({ formData, errors, updateField, onZipCodeChange, isZipLookupLoading, onManualCityStateEntry }) {
  return (
    <div className="space-y-2">
      <Textarea
        label={t('pages.address2')}
        labelPlacement="outside"
        placeholder={t('pages.fullResidentialAddress')}
        value={formData.address}
        onValueChange={(v) => updateField("address", v)}
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
          onValueChange={(v) => { onManualCityStateEntry(); updateField("city", v); }}
          variant="bordered"
          radius="sm"
          isRequired
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
        <Select
          label={t('pages.state1')}
          labelPlacement="outside"
          placeholder={t('pages.selectState')}
          selectedKeys={formData.state ? [formData.state] : []}
          onSelectionChange={(keys) => { onManualCityStateEntry(); updateField("state", Array.from(keys)[0]); }}
          variant="bordered"
          radius="sm"
          classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        >
          {INDIAN_STATES.map((s) => (
            <SelectItem key={s}>{s}</SelectItem>
          ))}
        </Select>
        <Input
          label={t('pages.zIPCode')}
          labelPlacement="outside"
          placeholder={t('pages.pINCode')}
          value={formData.zipCode}
          onValueChange={onZipCodeChange}
          variant="bordered"
          radius="sm"
          isRequired
          maxLength={6}
          isLoading={isZipLookupLoading}
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        />
      </div>
    </div>
  );
}

function OptionalSection({ formData, updateField }) {
  return (
    <div className="space-y-2 pt-2 border-t border-solid border-default-200">
      <label className="text-sm font-semibold text-default-900 block mt-2">{t('pages.optionalInformation')}</label>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('pages.aadhaarNumber')}
          labelPlacement="outside"
          placeholder={t('students.form.aadhaarPlaceholder')}
          value={formData.aadhaarNumber}
          onValueChange={(v) => updateField("aadhaarNumber", v.replace(/\D/g, "").slice(0, 12))}
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
          onSelectionChange={(keys) => updateField("bloodGroup", Array.from(keys)[0])}
          variant="bordered"
          radius="sm"
          classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        >
          {BLOOD_GROUPS.map((b) => (
            <SelectItem key={b}>{b}</SelectItem>
          ))}
        </Select>
        <Select
          label={t('pages.religion1')}
          labelPlacement="outside"
          placeholder={t('pages.selectReligion', 'Select Religion')}
          selectedKeys={formData.religion ? [formData.religion] : []}
          onSelectionChange={(keys) => updateField("religion", Array.from(keys)[0])}
          variant="bordered"
          radius="sm"
          classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        >
          {RELIGIONS.map((r) => (
            <SelectItem key={r}>{r}</SelectItem>
          ))}
        </Select>
        <Select
          label={t('pages.category1')}
          labelPlacement="outside"
          placeholder={t('pages.select1')}
          selectedKeys={formData.category ? [formData.category] : []}
          onSelectionChange={(keys) => updateField("category", Array.from(keys)[0])}
          variant="bordered"
          radius="sm"
          classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10" }}
        >
          {CATEGORIES.map((c) => (
            <SelectItem key={c}>{c}</SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
