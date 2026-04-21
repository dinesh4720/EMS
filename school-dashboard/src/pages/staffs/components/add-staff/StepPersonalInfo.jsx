import { parseDate } from "@internationalized/date";
import { Input, Select, SelectItem, Checkbox, Textarea, Avatar, DatePicker } from "@heroui/react";
import { Upload, Phone, PenLine } from "lucide-react";
import PhotoEditorModal from "../../../../components/PhotoEditorModal";
import { employmentTypes, bloodGroups, genders, maritalStatuses } from "./constants";
import { cn } from "@heroui/react";
import { useTranslation } from "react-i18next";
import logger from "../../../../utils/logger";

const StepPersonalInfo = ({
  formData,
  errors,
  updateField,
  picturePreviewUrl,
  isEditorOpen,
  setIsEditorOpen,
  tempImage,
  handleEditorSave,
  setIsCameraCaptureOpen,
  handleEmergencyContactChange,
  addEmergencyContact,
  removeEmergencyContact,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Profile Section */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar
            src={formData.picture ? (formData.picture instanceof File ? picturePreviewUrl : formData.picture) : undefined}
            name={!formData.picture ? (formData.name?.[0] || "") : undefined}
            className="w-24 h-24 text-3xl"
            isBordered
            radius="full"
          />
          {formData.picture && (
            <button
              className="absolute bottom-0 right-0 p-1.5 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-colors"
              onClick={() => setIsCameraCaptureOpen(true)}
            >
              <PenLine size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-left">
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-teal-50 text-teal-600 font-medium rounded-lg text-sm hover:bg-teal-100 transition-colors flex items-center gap-2"
              onClick={() => setIsCameraCaptureOpen(true)}
            >
              <Upload size={16} />
              {formData.picture ? "Change Photo" : "Add Photo"}
            </button>
            {formData.picture && (
              <button
                className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                onClick={() => updateField("picture", null)}
              >
                Delete
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 max-w-[280px]">
            Take a photo or upload from device. You can crop, rotate and adjust it.
          </p>
        </div>
      </div>

      {/* Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-900">{t('pages.employmentType1')}</label>
        <div className="grid grid-cols-3 gap-3">
          {employmentTypes.map((type) => {
            const isSelected = formData.employmentType === type.value;
            return (
              <div key={type.value} className={cn(
                "cursor-pointer rounded-xl border-2 p-3 flex items-center justify-center gap-2 transition-all text-center h-20",
                isSelected ? "border-primary bg-primary-50/20" : "border-default-200 hover:border-default-300"
              )}
                onClick={() => updateField("employmentType", type.value)}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-primary" : "border-default-300"
                )}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className={cn("text-xs font-semibold uppercase tracking-wide", isSelected ? "text-primary-700 dark:text-primary-400" : "text-default-600")}>
                  {type.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Name Field */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-default-900">{t('pages.personalInformation1')}</label>
          <Input
            label={t('pages.fullName1')}
            labelPlacement="outside"
            placeholder={t('pages.enterFullName')}
            value={formData.name}
            onValueChange={v => updateField("name", v)}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            variant="bordered"
            radius="sm"
            isRequired
            className="max-w-md"
            classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Wrapper div prevents keyboard events from propagating to parent form elements */}
          <div onKeyDown={(e) => e.stopPropagation()}>
            <DatePicker
              aria-label={t('aria.inputs.dateOfBirth')}
              label={t('pages.dateOfBirth2')}
              labelPlacement="outside"
              placeholderValue={parseDate("2000-01-01")}
              value={(() => {
                if (!formData.dob) return null;
                try {
                  const dateStr = formData.dob.split('T')[0];
                  // Validate the date string format (YYYY-MM-DD)
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    return parseDate(dateStr);
                  }
                  return null;
                } catch (e) {
                  logger.warn('Invalid DOB value:', formData.dob, e);
                  return null;
                }
              })()}
              onChange={(date) => {
                if (!date) {
                  updateField("dob", "");
                  return;
                }
                try {
                  // CalendarDate has .toString() which returns YYYY-MM-DD format
                  const dateStr = date.toString();
                  updateField("dob", dateStr);
                } catch (e) {
                  logger.warn('Error converting date:', e);
                  updateField("dob", "");
                }
              }}
              variant="bordered"
              radius="sm"
              showMonthAndYearPickers
              isRequired
              isInvalid={!!errors.dob}
              errorMessage={errors.dob}
              portalContainer={document.body}
              className="w-full"
              classNames={{
                label: "text-xs font-medium text-default-600 mb-1",
                input: "cursor-pointer",
                inputWrapper: "cursor-pointer hover:border-primary-400 transition-colors data-[hover=true]:border-primary-400",
                group: "cursor-pointer"
              }}
              style={{
                pointerEvents: "auto"
              }}
            />
          </div>

          <Select
            aria-label={t('aria.inputs.gender')}
            label={t('pages.gender1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.gender ? [formData.gender] : []}
            onSelectionChange={keys => updateField("gender", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            isRequired
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {genders.map(g => <SelectItem key={g}>{g}</SelectItem>)}
          </Select>
          <Input
            label={t('pages.fatherSName1')}
            labelPlacement="outside"
            placeholder={t('pages.fullName1')}
            value={formData.fatherName}
            onValueChange={v => updateField("fatherName", v)}
            variant="bordered"
            radius="sm"
            isRequired
            isInvalid={!!errors.fatherName}
            errorMessage={errors.fatherName}
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          />
          <Select
            aria-label={t('aria.inputs.maritalStatus')}
            label={t('pages.maritalStatus1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.maritalStatus ? [formData.maritalStatus] : []}
            onSelectionChange={keys => updateField("maritalStatus", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {maritalStatuses.map(ms => <SelectItem key={ms}>{ms}</SelectItem>)}
          </Select>
          <Select
            aria-label={t('aria.inputs.bloodGroup')}
            label={t('pages.bloodGroup1')}
            labelPlacement="outside"
            placeholder={t('pages.select1')}
            selectedKeys={formData.bloodGroup ? [formData.bloodGroup] : []}
            onSelectionChange={keys => updateField("bloodGroup", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={{ label: "text-xs font-medium text-default-600 mb-1", trigger: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          >
            {bloodGroups.map(bg => <SelectItem key={bg}>{bg}</SelectItem>)}
          </Select>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4 pt-4 border-t border-dashed border-default-200">
        <label className="text-sm font-semibold text-default-900 block">{t('pages.contactDetails1')}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('pages.mobileNumber')}
            labelPlacement="outside"
            startContent={<Phone className="text-default-400" size={16} />}
            placeholder={t('staff.form.mobilePlaceholder')}
            value={formData.phone}
            onValueChange={v => {
              if (v.length <= 20 && /^[+\d\s\-()]*$/.test(v)) updateField("phone", v);
            }}
            variant="bordered"
            radius="sm"
            isRequired
            isInvalid={!!errors.phone}
            errorMessage={errors.phone}
            classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
          />

          <div className="space-y-2">
            <Input
              label={t('pages.whatsAppNumber')}
              labelPlacement="outside"
              startContent={<span className="text-default-400 text-xs">+91</span>}
              placeholder={t('pages.whatsAppNumber')}
              value={formData.whatsappNumber}
              onValueChange={v => updateField("whatsappNumber", v)}
              variant="bordered"
              radius="sm"
              isDisabled={formData.isWhatsapp}
              classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
            />
            <Checkbox
              classNames={{ label: "text-xs text-default-500" }}
              size="sm"
              isSelected={formData.isWhatsapp}
              onValueChange={v => {
                updateField("isWhatsapp", v);
                if (v) updateField("whatsappNumber", formData.phone);
              }}
            >
              Same as mobile
            </Checkbox>
          </div>


          <Input
            label={t('pages.emailAddress')}
            labelPlacement="outside"
            placeholder={t('pages.emailAddress')}
            value={formData.email}
            onValueChange={v => updateField("email", v)}
            variant="bordered"
            radius="sm"
            isInvalid={!!errors.email}
            errorMessage={errors.email}
            className="col-span-1 md:col-span-2"
            classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-10" }}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-default-900">{t('pages.address2')}</label>
        <Textarea
          placeholder={t('pages.fullResidentialAddress1')}
          value={formData.address}
          onValueChange={v => updateField("address", v)}
          maxLength={200}
          variant="bordered"
          radius="sm"
          minRows={2}
          description={`${formData.address.length} / 200 characters`}
          classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300" }}
        />
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-3 pt-4 border-t border-dashed border-default-200">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-default-900">{t('pages.emergencyContacts1')}</label>
          <button
            type="button"
            onClick={addEmergencyContact}
            className="text-xs font-semibold text-primary hover:text-primary-600 transition-colors px-2 py-1 flex items-center gap-1"
          >
            + Add Contact
          </button>
        </div>

        {formData.emergencyContacts.map((contact, index) => (
          <div key={contact._key} className="p-4 border border-default-200 rounded-xl space-y-3 relative group hover:border-default-300 transition-colors">
            {formData.emergencyContacts.length > 1 && (
              <button
                className="absolute top-2 right-2 text-default-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeEmergencyContact(index)}
              >
                ✕
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder={t('pages.contactName')}
                value={contact.name}
                onValueChange={v => handleEmergencyContactChange(index, "name", v)}
                size="sm"
                radius="sm"
                variant="bordered"
                classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9" }}
              />
              <Input
                placeholder={t('pages.relationship')}
                value={contact.relationship}
                onValueChange={v => handleEmergencyContactChange(index, "relationship", v)}
                size="sm"
                radius="sm"
                variant="bordered"
                classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9" }}
              />
              <Input
                placeholder={t('pages.phoneNumber')}
                value={contact.phone}
                onValueChange={v => handleEmergencyContactChange(index, "phone", v)}
                size="sm"
                radius="sm"
                variant="bordered"
                isInvalid={!!errors[`emergencyPhone_${index}`]}
                errorMessage={errors[`emergencyPhone_${index}`]}
                startContent={<span className="text-default-400 text-xs">+91</span>}
                classNames={{ inputWrapper: "bg-default-50 dark:bg-default-100/50 border-1 border-default-200 hover:border-default-300 h-9" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Photo Editor Modal */}
      {tempImage && (
        <PhotoEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          imageSrc={tempImage}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
};

export default StepPersonalInfo;
