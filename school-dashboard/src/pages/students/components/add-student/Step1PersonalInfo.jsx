import { Input, Select, SelectItem, Checkbox, Textarea, Avatar, RadioGroup, Radio } from "@heroui/react";
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
            isBordered
            radius="full"
            color="primary"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full border-2 border-border-token bg-surface-2 flex items-center justify-center cursor-pointer hover:border-[var(--accent)] transition-colors"
            onClick={() => pictureInputRef.current?.click()}
          >
            <User size={32} className="text-fg-faint" />
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
              labelPlacement="outside"
              placeholder={t('pages.enterStudentSFullName')}
              value={formData.fullName}
              onValueChange={val => updateField("fullName", val.replace(/[0-9]/g, ''))}
              isInvalid={!!errors.fullName}
              errorMessage={errors.fullName}
              variant="bordered"
              radius="sm"
              isRequired
              classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
            />
          </div>

          {/* Date of Birth */}
          <div ref={dobRef} className="space-y-1">
            <label className="text-xs font-medium text-fg-muted">Date of Birth <span className="text-danger">*</span></label>

            <div className="relative">
              <Input
                labelPlacement="outside"
                placeholder={t('students.form.dobPlaceholder')}
                value={formData.dateOfBirth || ''}
                onClick={() => setIsDobCalendarOpen(true)}
                onFocus={() => setIsDobCalendarOpen(true)}
                onValueChange={(value) => {
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
                isInvalid={!!errors.dateOfBirth}
                errorMessage={errors.dateOfBirth}
                variant="bordered"
                radius="sm"
                isRequired
                classNames={{
                  inputWrapper: "bg-bg border-1 border-border-token hover:border-[var(--accent)] hover:bg-surface-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 h-10 pr-10 cursor-pointer"
                }}
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
        <label className="text-xs font-medium text-fg-muted">Gender <span className="text-red-500">*</span></label>
        <RadioGroup
          orientation="horizontal"
          value={formData.gender}
          onValueChange={val => updateField("gender", val)}
          classNames={{ wrapper: "gap-4" }}
          isInvalid={!!errors.gender}
          errorMessage={errors.gender}
        >
          {GENDERS.map(gender => (
            <Radio key={gender} value={gender} size="sm" classNames={{ label: "text-sm" }}>{gender}</Radio>
          ))}
        </RadioGroup>
      </div>

      {/* Class Info */}
      <div className="space-y-3 pt-5 border-t border-divider">
        <h3 className="text-sm font-medium text-fg">{t('pages.classInformation')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Class Selection */}
          <div ref={classRef}>
            <Select
              label={t('pages.class1')}
              labelPlacement="outside"
              placeholder={t('pages.selectClass2')}
              selectedKeys={formData.classGrade ? [formData.classGrade] : []}
              onSelectionChange={keys => {
                const selectedClass = classesWithTeachers.find(cls => cls.name === Array.from(keys)[0]);
                updateField("classGrade", Array.from(keys)[0]);
                updateField("section", selectedClass?.section || ""); // Auto-select section
                updateField("rollNumber", ""); // Reset roll number
              }}
              isRequired
              isInvalid={!!errors.classGrade}
              errorMessage={errors.classGrade}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
            >
              {uniqueClassNames.map(className => (
                <SelectItem key={className}>{className}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Section Selection */}
          <div>
            <Select
              label={t('pages.section1')}
              labelPlacement="outside"
              placeholder={t('pages.selectSection')}
              selectedKeys={formData.section ? [formData.section] : []}
              onSelectionChange={keys => updateField("section", Array.from(keys)[0])}
              isRequired
              isDisabled={!formData.classGrade}
              isInvalid={!!errors.section}
              errorMessage={errors.section}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
            >
              {availableSections.map(section => (
                <SelectItem key={section}>{section}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <Input
            label={t('pages.rollNumber2')}
            labelPlacement="outside"
            placeholder={t('pages.autoGenerated')}
            value={formData.rollNumber}
            variant="bordered"
            radius="sm"
            isReadOnly
            description="Auto-generated from roll number settings. Cannot be modified."
            classNames={{ inputWrapper: "bg-surface-2 border-1 border-border-token h-10" }}
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
              labelPlacement="outside"
              startContent={<span className="text-fg-faint text-xs">+91</span>}
              placeholder={t('pages.studentSMobileIfAny')}
              value={formData.mobile}
              onValueChange={val => {
                const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
                updateField("mobile", digitsOnly);
              }}
              variant="bordered"
              radius="sm"
              maxLength={10}
              classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
            />
            <Checkbox size="sm" isSelected={formData.isWhatsapp} onValueChange={val => updateField("isWhatsapp", val)}
              classNames={{ label: "text-xs text-fg-muted" }}>
              Same for WhatsApp
            </Checkbox>
          </div>
          <Input
            label={t('pages.emailAddress')}
            labelPlacement="outside"
            placeholder={t('students.form.studentEmailPlaceholder')}
            value={formData.email}
            onValueChange={val => updateField("email", val)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          />
          {!formData.isWhatsapp && (
            <Input
              label={t('pages.whatsAppNumber')}
              labelPlacement="outside"
              startContent={<span className="text-fg-faint text-xs">+91</span>}
              placeholder={t('pages.whatsAppNumber')}
              value={formData.whatsappNumber}
              onValueChange={val => updateField("whatsappNumber", val)}
              variant="bordered"
              radius="sm"
              classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
            />
          )}
        </div>
        <Textarea
          label={t('pages.address2')}
          labelPlacement="outside"
          placeholder={t('pages.fullResidentialAddress')}
          value={formData.address}
          onValueChange={val => updateField("address", val)}
          variant="bordered"
          radius="sm"
          isRequired
          minRows={2}
          classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong" }}
        />
        <div className="grid grid-cols-3 gap-4">
          <Input
            label={t('pages.city1')}
            labelPlacement="outside"
            placeholder={t('pages.city1')}
            value={formData.city}
            onValueChange={val => {
              updateField("city", val);
              manualCityStateEntryRef.current = true;  // Mark as manually entered
            }}
            variant="bordered"
            radius="sm"
            isRequired
            classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          />
          <div className="relative">
            <Select
              key="state-select"
              label={t('pages.state1')}
              labelPlacement="outside"
              placeholder={t('pages.selectState')}
              selectedKeys={stateSelectedKeys}
              onSelectionChange={keys => {
                updateField("state", Array.from(keys)[0]);
                manualCityStateEntryRef.current = true;  // Mark as manually entered
              }}
              variant="bordered"
              radius="sm"
              classNames={{ trigger: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
            >
              {INDIAN_STATES.map(state => <SelectItem key={state}>{state}</SelectItem>)}
            </Select>
          </div>
          <div className="relative">
            <Input
              label={t('pages.zIPCode')}
              labelPlacement="outside"
              placeholder={t('pages.pINCode')}
              value={formData.zipCode}
              onValueChange={val => {
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
              variant="bordered"
              radius="sm"
              isRequired
              maxLength={6}
              isLoading={isZipLookupLoading}
              classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
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
            labelPlacement="outside"
            placeholder={t('students.form.aadhaarPlaceholder')}
            value={formData.aadhaarNumber}
            onValueChange={val => updateField("aadhaarNumber", val.replace(/\D/g, '').slice(0, 12))}
            variant="bordered"
            radius="sm"
            maxLength={12}
            classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          />
          <Select
            label={t('pages.bloodGroup1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.bloodGroup ? [formData.bloodGroup] : []}
            onSelectionChange={keys => updateField("bloodGroup", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          >
            {BLOOD_GROUPS.map(bg => <SelectItem key={bg}>{bg}</SelectItem>)}
          </Select>
          <Input
            label={t('pages.nationality1')}
            labelPlacement="outside"
            placeholder={t('students.form.nationalityPlaceholder')}
            value={formData.nationality}
            onValueChange={val => updateField("nationality", val)}
            variant="bordered"
            radius="sm"
            classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          />
          <Select
            label={t('pages.religion1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.religion ? [formData.religion] : []}
            onSelectionChange={keys => updateField("religion", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          >
            {RELIGIONS.map(rel => <SelectItem key={rel}>{rel}</SelectItem>)}
          </Select>
          <Select
            label={t('pages.category1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.category ? [formData.category] : []}
            onSelectionChange={keys => updateField("category", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          >
            {CATEGORIES.map(cat => <SelectItem key={cat}>{cat}</SelectItem>)}
          </Select>
          <Select
            label={t('pages.motherTongue1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.motherTongue ? [formData.motherTongue] : []}
            onSelectionChange={keys => updateField("motherTongue", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ trigger: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          >
            {MOTHER_TONGUES.map(tongue => <SelectItem key={tongue}>{tongue}</SelectItem>)}
          </Select>
          <Input
            label={t('pages.previousSchool1')}
            labelPlacement="outside"
            placeholder={t('pages.nameOfPreviousSchool')}
            value={formData.previousSchool}
            onValueChange={val => updateField("previousSchool", val)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          />
          <Input
            label={t('pages.transferCertificateNo')}
            labelPlacement="outside"
            placeholder={t('pages.tCNumber')}
            value={formData.tcNumber}
            onValueChange={val => updateField("tcNumber", val.replace(/\D/g, ''))}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          />
          <Input
            label={t('pages.mediumOfInstruction')}
            labelPlacement="outside"
            placeholder={t('pages.enterMediumOfInstruction')}
            value={formData.mediumOfInstruction}
            onValueChange={val => updateField("mediumOfInstruction", val)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          />
          <Input
            label={t('pages.house')}
            labelPlacement="outside"
            placeholder={t('pages.enterHouse')}
            value={formData.house}
            onValueChange={val => updateField("house", val)}
            variant="bordered"
            radius="sm"
            className="col-span-2"
            classNames={{ inputWrapper: "bg-bg border-1 border-border-token hover:border-border-strong h-10" }}
          />
        </div>
      </div>
    </div>
  );
}

export default Step1PersonalInfo;
