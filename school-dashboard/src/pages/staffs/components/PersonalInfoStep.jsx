import { Input, Select, SelectItem, Checkbox, Textarea, Avatar, RadioGroup, Radio, DatePicker } from "@heroui/react";
import { User, Phone, MapPin, ShieldAlert, Camera, Trash2, X, Plus } from "lucide-react";
import { parseDate, CalendarDate } from "@internationalized/date";
import PhotoEditorModal from "../../../components/PhotoEditorModal";
import { useTranslation } from "react-i18next";
import SectionHeader from "./SectionHeader";

const inputStyles = {
  inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10",
};
const selectStyles = {
  trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10",
};

const employmentTypes = [
  { label: "Full-Time", value: "Full-time" },
  { label: "Part-Time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["Male", "Female", "Other"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];

function PersonalInfoStep({
  formData,
  errors,
  updateField,
  picturePreviewUrl,
  onOpenCameraCapture,
  handleEmergencyContactChange,
  addEmergencyContact,
  removeEmergencyContact,
  isEditorOpen,
  setIsEditorOpen,
  tempImage,
  handleEditorSave,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Profile Photo */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-zinc-900 dark:to-zinc-800/50 border border-gray-200/60 dark:border-zinc-700/60">
        {formData.picture ? (
          <Avatar
            src={formData.picture instanceof File ? picturePreviewUrl : formData.picture}
            className="w-16 h-16 text-2xl shrink-0"
            isBordered
            radius="full"
            color="primary"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-zinc-600 bg-surface-2 flex items-center justify-center shrink-0 cursor-pointer hover:border-gray-400 transition-colors"
            onClick={onOpenCameraCapture}
          >
            <User size={24} className="text-gray-300 dark:text-zinc-500" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-fg">{t('staff.form.staffPhoto')}</p>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-600 transition-colors px-2.5 py-1 rounded-md hover:bg-primary/5 cursor-pointer"
              onClick={onOpenCameraCapture}
            >
              <Camera size={12} />
              {formData.picture ? t('staff.form.changePhoto') : t('staff.form.uploadPhoto')}
            </button>
            {formData.picture && (
              <button
                className="inline-flex items-center gap-1.5 text-xs font-medium text-danger hover:text-danger-600 transition-colors px-2.5 py-1 rounded-md hover:bg-danger/5 cursor-pointer"
                onClick={() => updateField("picture", null)}
              >
                <Trash2 size={12} />
                {t('staff.form.removePhoto')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employment Type */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-fg-muted">{t('staff.form.employmentType')}</label>
        <RadioGroup
          orientation="horizontal"
          value={formData.employmentType}
          onValueChange={v => updateField("employmentType", v)}
          classNames={{ wrapper: "gap-4" }}
        >
          {employmentTypes.map(et => (
            <Radio key={et.value} value={et.value} size="sm" classNames={{ label: "text-sm" }}>{et.label}</Radio>
          ))}
        </RadioGroup>
      </div>

      {/* Personal Information */}
      <div className="space-y-3 pt-5 border-t border-divider">
        <SectionHeader icon={User} title={t('staff.about.personalInformation')} />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('staff.form.fullNameLabel')}
            labelPlacement="outside"
            placeholder={t('staff.form.fullNamePlaceholder')}
            value={formData.name}
            onValueChange={v => updateField("name", v)}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            variant="bordered"
            radius="sm"
            isRequired
            classNames={inputStyles}
          />
          <div onClick={(e) => e.stopPropagation()} onFocus={(e) => e.stopPropagation()}>
            <DatePicker
              aria-label={t('staff.form.dobLabel')}
              label={t('staff.form.dobLabel')}
              labelPlacement="outside"
              value={(() => {
                if (!formData.dob) return null;
                try {
                  const dateStr = formData.dob.split('T')[0];
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return parseDate(dateStr);
                  return null;
                } catch (e) { return null; }
              })()}
              onChange={(date) => {
                if (!date) { updateField("dob", ""); return; }
                try { updateField("dob", date.toString()); } catch (e) { updateField("dob", ""); }
              }}
              variant="bordered"
              radius="sm"
              showMonthAndYearPickers
              minValue={new CalendarDate(1950, 1, 1)}
              maxValue={new CalendarDate(new Date().getFullYear(), 12, 31)}
              isRequired
              isInvalid={!!errors.dob}
              errorMessage={errors.dob}
              granularity="day"
              className="w-full"
              classNames={{
                base: "w-full",
                inputWrapper: "hover:border-default-300 transition-colors data-[hover=true]:border-default-300",
              }}
            />
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-fg-muted">{t('staff.about.gender')} <span className="text-red-500">*</span></label>
          <RadioGroup
            orientation="horizontal"
            value={formData.gender}
            onValueChange={v => updateField("gender", v)}
            classNames={{ wrapper: "gap-4" }}
            isInvalid={!!errors.gender}
            errorMessage={errors.gender}
          >
            {genders.map(g => (
              <Radio key={g} value={g} size="sm" classNames={{ label: "text-sm" }}>{g}</Radio>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('staff.form.fatherNameLabel')}
            labelPlacement="outside"
            placeholder={t('staff.form.fatherNamePlaceholder')}
            value={formData.fatherName}
            onValueChange={v => updateField("fatherName", v)}
            variant="bordered"
            radius="sm"
            isRequired
            isInvalid={!!errors.fatherName}
            errorMessage={errors.fatherName}
            classNames={inputStyles}
          />
          <Select
            aria-label={t('staff.form.maritalStatusLabel')}
            label={t('staff.form.maritalStatusLabel')}
            labelPlacement="outside"
            placeholder={t('staff.form.maritalStatusPlaceholder')}
            selectedKeys={formData.maritalStatus ? [formData.maritalStatus] : []}
            onSelectionChange={keys => updateField("maritalStatus", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={selectStyles}
          >
            {maritalStatuses.map(ms => <SelectItem key={ms}>{ms}</SelectItem>)}
          </Select>
          <Select
            aria-label={t('staff.form.bloodGroupLabel')}
            label={t('staff.form.bloodGroupLabel')}
            labelPlacement="outside"
            placeholder={t('staff.form.bloodGroupPlaceholder', 'Select blood group')}
            selectedKeys={formData.bloodGroup ? [formData.bloodGroup] : []}
            onSelectionChange={keys => updateField("bloodGroup", Array.from(keys)[0])}
            variant="bordered"
            radius="sm"
            classNames={selectStyles}
          >
            {bloodGroups.map(bg => <SelectItem key={bg}>{bg}</SelectItem>)}
          </Select>
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-3 pt-5 border-t border-divider">
        <SectionHeader icon={Phone} title={t('staff.about.contactDetails')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label={t('staff.form.mobileLabel')}
              labelPlacement="outside"
              startContent={<span className="text-default-400 text-xs">+91</span>}
              placeholder={t('staff.form.mobilePlaceholder')}
              value={formData.phone}
              onValueChange={v => {
                if (v.length <= 10 && /^\d*$/.test(v)) {
                  updateField("phone", v);
                  if (formData.isWhatsapp) updateField("whatsappNumber", v);
                }
              }}
              variant="bordered"
              radius="sm"
              isRequired
              isInvalid={!!errors.phone}
              errorMessage={errors.phone}
              classNames={inputStyles}
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
              {t('staff.form.sameAsWhatsapp')}
            </Checkbox>
          </div>

          {!formData.isWhatsapp && (
            <Input
              label={t('staff.form.whatsappLabel')}
              labelPlacement="outside"
              type="tel"
              maxLength={10}
              pattern="[0-9]*"
              startContent={<span className="text-default-400 text-xs">+91</span>}
              placeholder={t('staff.form.whatsappPlaceholder')}
              value={formData.whatsappNumber}
              onValueChange={v => {
                if (v.length <= 10 && /^\d*$/.test(v)) updateField("whatsappNumber", v);
              }}
              onKeyDown={e => {
                if (!/[0-9]/.test(e.key) && !["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }}
              variant="bordered"
              radius="sm"
              classNames={inputStyles}
            />
          )}

          <Input
            label={t('staff.form.emailLabel')}
            labelPlacement="outside"
            placeholder={t('staff.form.emailPlaceholder')}
            value={formData.email}
            onValueChange={v => updateField("email", v)}
            variant="bordered"
            radius="sm"
            isInvalid={!!errors.email}
            errorMessage={errors.email}
            className={formData.isWhatsapp ? "" : "col-span-1 md:col-span-2"}
            classNames={inputStyles}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-3 pt-5 border-t border-divider">
        <SectionHeader icon={MapPin} title={t('staff.about.address')} />
        <Textarea
          placeholder={t('staff.form.addressPlaceholder')}
          value={formData.address || ''}
          onValueChange={v => updateField("address", v)}
          maxLength={200}
          variant="bordered"
          radius="sm"
          minRows={2}
          description={`${(formData.address || '').length}/200`}
          classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300" }}
        />
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-3 pt-5 border-t border-divider">
        <SectionHeader icon={ShieldAlert} title={t('staff.form.emergencyContacts')} />
        <p className="text-xs text-fg-muted -mt-1">{t('staff.form.emergencyContactsHint')}</p>
        {(formData.emergencyContacts || []).map((contact, index) => (
          <div key={contact._key} className="p-3 border border-border-token rounded-lg space-y-3 relative group hover:border-gray-300 dark:hover:border-zinc-600 transition-colors">
            {(formData.emergencyContacts || []).length > 1 && (
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeEmergencyContact(index)}
              >
                <X size={14} />
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder={t('pages.contactName1')} value={contact.name} onValueChange={v => handleEmergencyContactChange(index, "name", v)} size="sm" radius="sm" variant="bordered" classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-9" }} />
              <Input placeholder={t('pages.relationship')} value={contact.relationship} onValueChange={v => handleEmergencyContactChange(index, "relationship", v)} size="sm" radius="sm" variant="bordered" classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-9" }} />
              <Input placeholder={t('pages.phoneNumber1')} value={contact.phone} onValueChange={v => handleEmergencyContactChange(index, "phone", v)} size="sm" radius="sm" variant="bordered" isInvalid={!!errors[`emergencyPhone_${index}`]} errorMessage={errors[`emergencyPhone_${index}`]} startContent={<span className="text-default-400 text-2xs">+91</span>} classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-9" }} />
            </div>
          </div>
        ))}
        <button
          onClick={addEmergencyContact}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-600 transition-colors px-2.5 py-1 rounded-md hover:bg-primary/5 cursor-pointer"
        >
          <Plus size={12} />
          {t('staff.form.addContact')}
        </button>
      </div>

      {tempImage && (
        <PhotoEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} imageSrc={tempImage} onSave={handleEditorSave} />
      )}
    </div>
  );
}

export default PersonalInfoStep;
