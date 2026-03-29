import { Input, Select, SelectItem, Chip, Switch, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Users, Hash, BookOpen, GraduationCap, Briefcase, Upload, FileScan, Check, Plus, X } from "lucide-react";
import { STAFF_ROLES } from "../../../constants/roles";
import { useTranslation } from "react-i18next";
import SectionHeader from "./SectionHeader";

const inputStyles = {
  inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-10",
};
const selectStyles = {
  trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-10",
};

const staffTypes = STAFF_ROLES;
const departments = ["Science", "Mathematics", "Languages", "Social Studies", "Commerce", "Arts", "Physical Education", "IT/Computer", "Library", "Administration", "Accounts", "Management", "Counseling", "Special Education", "Sports", "Others"];
const degreeOptions = [
  { label: "B.Ed", value: "B.Ed" }, { label: "M.Ed", value: "M.Ed" },
  { label: "PhD", value: "PhD" }, { label: "B.Sc", value: "B.Sc" },
  { label: "M.Sc", value: "M.Sc" }, { label: "B.A", value: "B.A" },
  { label: "M.A", value: "M.A" }, { label: "B.Com", value: "B.Com" },
  { label: "M.Com", value: "M.Com" }, { label: "MBA", value: "MBA" },
  { label: "B.Tech", value: "B.Tech" }, { label: "M.Tech", value: "M.Tech" },
  { label: "Other", value: "Other" }
];

// This component renders BOTH Step 2 (Job Details) and Step 3 (Qualifications) content
// based on the `stepNumber` prop.

function RoleQualificationsStep({
  stepNumber,
  formData,
  errors,
  updateField,
  availableClasses,
  loadingClasses,
  // Qualification handlers (used in step 3)
  addQualification,
  removeQualification,
  updateQualification,
  handleQualificationDocUpload,
  removeQualificationDoc,
}) {
  const { t } = useTranslation();

  // ── Step 2: Job Details ──
  if (stepNumber === 2) {
    return (
      <div className="space-y-5 animate-fade-in text-left">
        <div className="space-y-3">
          <SectionHeader icon={Users} title={t('staff.form.roleAssignment')} />
          <Select
            aria-label={t('staff.form.staffRolesLabel')}
            label={t('staff.form.staffRolesLabel')}
            labelPlacement="outside"
            placeholder={t('staff.form.staffRolesPlaceholder')}
            selectedKeys={new Set(formData.staffType ? (Array.isArray(formData.staffType) ? formData.staffType : [formData.staffType]) : [])}
            onSelectionChange={(keys) => {
              const selectedRoles = Array.from(keys);
              updateField("staffType", selectedRoles.length > 0 ? selectedRoles : []);
            }}
            selectionMode="multiple"
            variant="bordered"
            radius="sm"
            isRequired
            classNames={selectStyles}
            isInvalid={!!errors.staffType}
            errorMessage={errors.staffType}
          >
            {staffTypes.map((role) => <SelectItem key={role}>{role}</SelectItem>)}
          </Select>

          {formData.staffType && formData.staffType.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formData.staffType.map((role) => (
                <Chip key={role} size="sm" variant="flat" onClose={() => updateField("staffType", formData.staffType.filter(r => r !== role))}>
                  {role}
                </Chip>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">{t('staff.form.selectAllRoles')}</p>
        </div>

        <div className="space-y-3 pt-5 border-t border-gray-100">
          <SectionHeader icon={Hash} title={t('staff.form.staffDetails')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('staff.form.staffIdLabel')}
              labelPlacement="outside"
              placeholder={t('staff.form.staffIdPlaceholder')}
              value={formData.staffNumber}
              isReadOnly
              variant="bordered"
              radius="sm"
              isRequired
              description={t('staff.form.staffIdDescription')}
              classNames={{ inputWrapper: "bg-default-50 border-1 border-default-200 h-10" }}
            />
            <Select
              label={t('staff.form.departmentLabel')}
              labelPlacement="outside"
              placeholder={t('staff.form.departmentPlaceholder')}
              selectedKeys={formData.department ? [formData.department] : []}
              onSelectionChange={(keys) => updateField("department", Array.from(keys)[0])}
              variant="bordered"
              radius="sm"
              isRequired
              isInvalid={!!errors.department}
              errorMessage={errors.department}
              classNames={selectStyles}
            >
              {departments.map((dept) => <SelectItem key={dept}>{dept}</SelectItem>)}
            </Select>
          </div>
        </div>

        {(Array.isArray(formData.staffType) ? formData.staffType.includes("Teacher") : formData.staffType === "Teaching") && (
          <div className="space-y-3 pt-5 border-t border-gray-100">
            <SectionHeader icon={BookOpen} title={t('staff.form.teachingAssignments')} />
            <div className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-800">{t('staff.form.isClassTeacher')}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{t('staff.form.isClassTeacherDesc')}</p>
                </div>
                <Switch size="sm" isSelected={formData.isClassTeacher} onValueChange={(v) => updateField("isClassTeacher", v)} />
              </div>
              {formData.isClassTeacher && (
                <Select
                  className="mt-2"
                  label={t('staff.form.selectClassLabel')}
                  placeholder={loadingClasses ? t('staff.form.loadingClasses') : t('staff.form.selectClassPlaceholder')}
                  selectedKeys={formData.classTeacherOf ? [formData.classTeacherOf] : []}
                  onSelectionChange={(keys) => updateField("classTeacherOf", Array.from(keys)[0])}
                  variant="bordered"
                  radius="sm"
                  size="sm"
                  isDisabled={loadingClasses}
                  classNames={{ trigger: "bg-background border-1 border-default-200" }}
                >
                  {availableClasses.map((cls) => <SelectItem key={cls.id}>{cls.displayName}</SelectItem>)}
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">{t('staff.form.subjectTeachingClasses')}</label>
              <Select
                selectionMode="multiple"
                placeholder={loadingClasses ? "Loading classes..." : "Select classes"}
                selectedKeys={new Set(formData.assignedClasses)}
                onSelectionChange={(keys) => updateField("assignedClasses", Array.from(keys))}
                variant="bordered"
                radius="sm"
                isDisabled={loadingClasses}
                classNames={{ trigger: "bg-background border-1 border-default-200 hover:border-default-300 min-h-unit-10" }}
              >
                {availableClasses.map((cls) => <SelectItem key={cls.id}>{cls.displayName}</SelectItem>)}
              </Select>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step 3: Education & Qualifications ──
  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader icon={GraduationCap} title={t('staff.about.professionalQualifications')} />
          {formData.professionalQualifications.length > 0 && (
            <button type="button" onClick={addQualification} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-600 transition-colors px-2 py-1 rounded-md hover:bg-primary/5">
              <Plus size={12} /> {t('staff.form.addDegree')}
            </button>
          )}
        </div>

        {formData.professionalQualifications.map((qual, i) => (
          <div key={qual._id || `qual-${i}`} className="p-4 border border-gray-200 rounded-lg space-y-3 relative group hover:border-gray-300 transition-colors">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-md" onClick={() => removeQualification(i)}>
              <X size={14} />
            </button>
            <div className="grid grid-cols-12 gap-3 pr-8">
              <div className="col-span-8">
                <Autocomplete
                  label={t('staff.form.degreeCertLabel')}
                  labelPlacement="outside"
                  placeholder={t('staff.form.degreeCertPlaceholder')}
                  defaultItems={degreeOptions}
                  inputValue={qual.name}
                  onInputChange={(v) => updateQualification(i, "name", v)}
                  allowsCustomValue
                  isRequired
                  variant="bordered"
                  radius="sm"
                  size="sm"
                  classNames={{ base: "max-w-full", trigger: "bg-background border-1 border-default-200 hover:border-default-300 h-9 min-h-unit-8" }}
                  isInvalid={!!errors[`qualName_${i}`]}
                  errorMessage={errors[`qualName_${i}`]}
                >
                  {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
                </Autocomplete>
              </div>
              <div className="col-span-4">
                <Input label={t('staff.form.yearLabel')} labelPlacement="outside" placeholder={t('staff.form.yearPlaceholder')} value={qual.year} onValueChange={v => { if (v.length <= 4 && /^\d*$/.test(v)) updateQualification(i, "year", v); }} variant="bordered" radius="sm" size="sm" isInvalid={!!errors[`qualYear_${i}`]} errorMessage={errors[`qualYear_${i}`]} classNames={{ inputWrapper: "bg-background border-1 border-default-200 hover:border-default-300 h-9" }} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded-md hover:bg-gray-100" onClick={() => document.getElementById(`qual-doc-${i}`).click()}>
                <Upload size={12} /> {t('staff.form.uploadCertificate')}
              </button>
              {qual.documents && qual.documents.length > 0 && (
                <button className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 cursor-not-allowed px-2 py-1" disabled title={t('pages.comingSoon')}>
                  <FileScan size={12} /> Extract Info
                </button>
              )}
              <input id={`qual-doc-${i}`} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleQualificationDocUpload(i, e.target.files)} />
              {qual.documents && qual.documents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 ml-auto">
                  {qual.documents.map((file, docIdx) => (
                    <Chip key={file.name || `doc-${docIdx}`} size="sm" variant="flat" onClose={() => removeQualificationDoc(i, docIdx)} classNames={{ base: "h-6 text-xs" }} startContent={<Check size={10} />}>
                      {file.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {formData.professionalQualifications.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-300 transition-colors" onClick={addQualification}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <GraduationCap size={20} />
            </div>
            <p className="text-xs text-gray-500">{t('staff.form.noDegreesAdded')}</p>
          </div>
        )}
        {errors.qualifications && <p className="text-xs text-danger">{errors.qualifications}</p>}
      </div>

      <div className="space-y-3 pt-5 border-t border-gray-100">
        <SectionHeader icon={Briefcase} title={t('staff.form.workExperience')} optional />
        <div className="space-y-3">
          <div className="flex gap-4">
            <Input label={t('staff.form.prevOrgLabel')} labelPlacement="outside" placeholder={t('staff.form.prevOrgPlaceholder')} value={formData.previousOrganization} onValueChange={v => updateField("previousOrganization", v)} variant="bordered" radius="sm" className="flex-1" classNames={inputStyles} />
            <Input label={t('staff.form.expYearsLabel')} labelPlacement="outside" placeholder={t('staff.form.experiencePlaceholder')} value={formData.totalExperience} onValueChange={v => { const numericValue = v.replace(/\D/g, '').slice(0, 2); updateField("totalExperience", numericValue); }} variant="bordered" radius="sm" className="w-28" classNames={inputStyles} maxLength={2} />
          </div>
          <Input label={t('staff.form.designationLabel')} labelPlacement="outside" placeholder={t('staff.form.designationPlaceholder')} value={formData.roleInOrganization} onValueChange={v => updateField("roleInOrganization", v)} variant="bordered" radius="sm" classNames={inputStyles} />
        </div>
      </div>
    </div>
  );
}

export default RoleQualificationsStep;
