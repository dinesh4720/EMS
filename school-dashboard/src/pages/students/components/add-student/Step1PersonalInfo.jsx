import { Input, Select, RadioGroup, Checkbox, Textarea, Avatar } from "../../../../components/ui";
import { Upload, X, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { parse, isValid } from "date-fns";
import { useTranslation } from 'react-i18next';
import { GENDERS, BLOOD_GROUPS, RELIGIONS, CATEGORIES, MOTHER_TONGUES } from "../../../../constants/studentConstants";
import { INDIAN_STATES } from "../../../../constants/states";
import { lookupPincode } from "../../../../services/api";
import { normalizeStateName } from "../../../../constants/states";
import { ddmmyyToIso } from "../../utils/studentFormValidation";
import logger from "../../../../utils/logger";
import ClickAwayListener from "./ClickAwayListener";
import CustomCalendar from "./CustomCalendar";

function Step1PersonalInfo({
  formData,
  errors,
  updateField,
  picturePreviewUrl,
  isDobCalendarOpen,
  setIsDobCalendarOpen,
  dobValidation,
  validateDOBInRealTime,
  isZipLookupLoading,
  setIsZipLookupLoading,
  uniqueClassNames,
  availableSections,
  stateSelectedKeys,
  classesWithTeachers,
  // Refs
  fullNameRef,
  dobRef,
  genderRef,
  classRef,
  pictureInputRef,
  setIsCameraCaptureOpen,
  zipLookupTimeoutRef,
  manualCityStateEntryRef,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Profile Section */}
      <div className="flex items-center gap-5">
        {formData.picture ? (
          <Avatar
            src={picturePreviewUrl}
            className="w-20 h-20 text-3xl"
            shape="circle"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full border-2 border-border-token bg-surface-2 flex items-center justify-center cursor-pointer hover:border-[var(--accent)] transition-colors"
            onClick={() => pictureInputRef.current?.click()}
          >
            <User size={32} className="text-fg-faint" aria-hidden />
          </div>
        )}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-semibold text-primary hover:text-[var(--accent)] transition-colors cursor-pointer"
              onClick={() => setIsCameraCaptureOpen(true)}
            >
              {formData.picture ? "Change Photo" : "Add Photo"}
            </button>
            {formData.picture && (
              <>
                <span className="text-fg-faint">|</span>
                <button
                  className="text-sm font-semibold text-danger hover:text-[var(--danger)] transition-colors cursor-pointer"
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

      {/* Personal Information - Full Name & Date of Birth in same row */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-fg">{t('pages.personalInformation1')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div ref={fullNameRef}>
            <Input
              label={t('pages.fullName1')}
              placeholder={t('pages.enterStudentSFullName')}
              value={formData.fullName}
              onChange={(e) => updateField("fullName", e.target.value.replace(/[0-9]/g, ''))}
              error={errors.fullName}
              required
            />
          </div>

          {/* Date of Birth */}
          <div ref={dobRef} className="space-y-1">
            <label className="text-xs font-medium text-fg-muted">Date of Birth <span className="text-danger">*</span></label>

            <div className="relative">
              <Input
                placeholder={t('students.form.dobPlaceholder')}
                value={formData.dateOfBirth || ''}
                onClick={() => setIsDobCalendarOpen(true)}
                onFocus={() => setIsDobCalendarOpen(true)}
                onChange={(e) => {
                  const value = e.target.value;
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
                    // setDobValidation is handled by parent via validateDOBInRealTime
                  }
                }}
                error={errors.dateOfBirth}
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
                      className="text-fg-muted cursor-pointer hover:text-primary transition-colors"
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
              <p className={`text-xs mt-1 ${dobValidation.isValid ? 'text-success' : dobValidation.warning ? 'text-warning' : 'text-fg-muted'}`}>
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
        <label className="text-xs font-medium text-fg-muted">Gender <span className="text-danger">*</span></label>
        <RadioGroup
          value={formData.gender}
          onChange={(e) => updateField("gender", e.target.value)}
          options={GENDERS.map(gender => ({ value: gender, label: gender }))}
        />
      </div>

      {/* Class Info */}
      <div className="space-y-3 pt-5 border-t border-divider">
        <h3 className="text-sm font-medium text-fg">{t('pages.classInformation')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Class Selection */}
          <div ref={classRef}>
            <Select
              label={t('pages.class1')}
              placeholder={t('pages.selectClass2')}
              value={formData.classGrade || ""}
              onChange={(e) => {
                const selectedClass = classesWithTeachers.find(cls => cls.name === e.target.value);
                updateField("classGrade", e.target.value);
                updateField("section", selectedClass?.section || ""); // Auto-select section
                updateField("rollNumber", ""); // Reset roll number
              }}
              required
              options={uniqueClassNames.map(className => ({ value: className, label: className }))}
            />
          </div>

          {/* Section Selection */}
          <div>
            <Select
              label={t('pages.section1')}
              placeholder={t('pages.selectSection')}
              value={formData.section || ""}
              onChange={(e) => updateField("section", e.target.value)}
              required
              disabled={!formData.classGrade}
              options={availableSections.map(section => ({ value: section, label: section }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <Input
            label={t('pages.rollNumber2')}
            placeholder={t('pages.autoGenerated')}
            value={formData.rollNumber}
            readOnly
            description="Auto-generated from roll number settings. Cannot be modified."
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 pt-5 border-t border-divider">
        <h3 className="text-sm font-medium text-fg">{t('pages.contactDetails1')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label={t('pages.mobileNumber')}
              startContent={<span className="text-fg-faint text-xs">+91</span>}
              placeholder={t('pages.studentSMobileIfAny')}
              value={formData.mobile}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                updateField("mobile", digitsOnly);
              }}
              maxLength={10}
            />
            <Checkbox
              size="sm"
              checked={formData.isWhatsapp}
              onChange={(e) => updateField("isWhatsapp", e.target.checked)}
              label="Same for WhatsApp"
            />
          </div>
          <Input
            label={t('pages.emailAddress')}
            placeholder={t('students.form.studentEmailPlaceholder')}
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          {!formData.isWhatsapp && (
            <Input
              label={t('pages.whatsAppNumber')}
              startContent={<span className="text-fg-faint text-xs">+91</span>}
              placeholder={t('pages.whatsAppNumber')}
              value={formData.whatsappNumber}
              onChange={(e) => updateField("whatsappNumber", e.target.value)}
            />
          )}
        </div>
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
            onChange={(e) => {
              updateField("city", e.target.value);
              manualCityStateEntryRef.current = true;  // Mark as manually entered
            }}
            required
          />
          <div className="relative">
            <Select
              key="state-select"
              label={t('pages.state1')}
              placeholder={t('pages.selectState')}
              value={Array.isArray(stateSelectedKeys) ? stateSelectedKeys[0] || "" : stateSelectedKeys || ""}
              onChange={(e) => {
                updateField("state", e.target.value);
                manualCityStateEntryRef.current = true;  // Mark as manually entered
              }}
              options={INDIAN_STATES.map(state => ({ value: state, label: state }))}
            />
          </div>
          <div className="relative">
            <Input
              label={t('pages.zIPCode')}
              placeholder={t('pages.pINCode')}
              value={formData.zipCode}
              onChange={(e) => {
                const val = e.target.value;
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
              required
              maxLength={6}
            />
            {/* Absolute positioned loading indicator to prevent layout shift */}
            {isZipLookupLoading && (
              <div className="absolute -bottom-5 left-0 text-xs text-fg-muted whitespace-nowrap">
                Looking up location...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optional Fields */}
      <div className="space-y-3 pt-5 border-t border-divider">
        <h3 className="text-sm font-medium text-fg">{t('pages.optionalInformation')}</h3>
        <p className="text-xs text-fg-muted -mt-1">{t('pages.theseFieldsAreOptionalAndCanBeFilledLater')}</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('pages.aadhaarNumber')}
            placeholder={t('students.form.aadhaarPlaceholder')}
            value={formData.aadhaarNumber}
            onChange={(e) => updateField("aadhaarNumber", e.target.value.replace(/\D/g, '').slice(0, 12))}
            maxLength={12}
          />
          <Select
            label={t('pages.bloodGroup1')}
            placeholder={t('pages.select1')}
            value={formData.bloodGroup || ""}
            onChange={(e) => updateField("bloodGroup", e.target.value)}
            options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
          />
          <Input
            label={t('pages.nationality1')}
            placeholder={t('students.form.nationalityPlaceholder')}
            value={formData.nationality}
            onChange={(e) => updateField("nationality", e.target.value)}
          />
          <Select
            label={t('pages.religion1')}
            placeholder={t('pages.select1')}
            value={formData.religion || ""}
            onChange={(e) => updateField("religion", e.target.value)}
            options={RELIGIONS.map(rel => ({ value: rel, label: rel }))}
          />
          <Select
            label={t('pages.category1')}
            placeholder={t('pages.select1')}
            value={formData.category || ""}
            onChange={(e) => updateField("category", e.target.value)}
            options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
          />
          <Select
            label={t('pages.motherTongue1')}
            placeholder={t('pages.select1')}
            value={formData.motherTongue || ""}
            onChange={(e) => updateField("motherTongue", e.target.value)}
            options={MOTHER_TONGUES.map(tongue => ({ value: tongue, label: tongue }))}
          />
          <Input
            label={t('pages.previousSchool1')}
            placeholder={t('pages.nameOfPreviousSchool')}
            value={formData.previousSchool}
            onChange={(e) => updateField("previousSchool", e.target.value)}
            className="col-span-2"
          />
          <Input
            label={t('pages.transferCertificateNo')}
            placeholder={t('pages.tCNumber')}
            value={formData.tcNumber}
            onChange={(e) => updateField("tcNumber", e.target.value.replace(/\D/g, ''))}
            className="col-span-2"
          />
          <Input
            label={t('pages.mediumOfInstruction')}
            placeholder={t('pages.enterMediumOfInstruction')}
            value={formData.mediumOfInstruction}
            onChange={(e) => updateField("mediumOfInstruction", e.target.value)}
            className="col-span-2"
          />
          <Input
            label={t('pages.house')}
            placeholder={t('pages.enterHouse')}
            value={formData.house}
            onChange={(e) => updateField("house", e.target.value)}
            className="col-span-2"
          />
        </div>
      </div>
    </div>
  );
}

export default Step1PersonalInfo;
